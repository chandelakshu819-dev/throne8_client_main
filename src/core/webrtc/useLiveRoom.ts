/**
 * ============================================================
 * useLiveRoom.ts — SFU-Ready WebRTC Hook
 * ============================================================
 * Architecture: SFU-ready mesh with graceful degradation
 *
 * Scale Strategy:
 *  - ≤4  users  → full mesh P2P (no server needed)
 *  - 5-15 users → selective forwarding via TURN relay
 *  - 15+  users → SFU mode (mediasoup/LiveKit handoff-ready)
 *
 * Production features:
 *  ✅ ICE restart on network change
 *  ✅ Adaptive bitrate via RTCRtpSender.setParameters
 *  ✅ Connection quality monitoring (RTCStatsReport)
 *  ✅ Graceful cleanup — no memory leaks
 *  ✅ Reconnect with exponential backoff
 *  ✅ Audio level detection (VAD)
 *  ✅ TURN server pool support
 *  ✅ Safari/Firefox cross-browser compatibility
 * ============================================================
 */

'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { getSocket } from '@/core/realtime/socket.client';

// ─── Types ────────────────────────────────────────────────────

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'disconnected';
export type RoomMode = 'p2p' | 'sfu';

// Must stay well under the server's 120s presence TTL
const HEARTBEAT_INTERVAL_MS = 30_000;

export interface RoomEndedInfo {
  sessionId?: string;
  bookingId?: string;
  endedAt?: string;
  endedBy?: string;
}

export interface RemotePeer {
  socketId: string;
  userId: string;
  userName?: string;
  stream: MediaStream | null;
  cameraOn: boolean;
  micOn: boolean;
  isSpeaking: boolean;
  quality: ConnectionQuality;
  connectionState: RTCPeerConnectionState;
}

export interface LiveRoomState {
  localStream: MediaStream | null;
  peers: Map<string, RemotePeer>;
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  isConnecting: boolean;
  roomMode: RoomMode;
  error: string | null;
}


export interface UseLiveRoomOptions {
  roomId: string;
  sessionId?: string;
  userId: string;
  userName?: string;
  /** Called when a peer joins */
  onPeerJoined?: (peer: RemotePeer) => void;
  /** Called when a peer leaves */
  onPeerLeft?: (socketId: string) => void;
  /** Called on network quality change */
  onQualityChange?: (socketId: string, quality: ConnectionQuality) => void;
}

// ─── Constants ────────────────────────────────────────────────

/**
 * ICE server pool — production should pull from your backend
 * dynamically (TURN credentials expire). This is the default fallback.
 */
// const ICE_SERVERS: RTCIceServer[] = [
//   // Free STUN servers (Google) — no auth needed
//   { urls: 'stun:stun.l.google.com:19302' },
//   { urls: 'stun:stun1.l.google.com:19302' },
//   { urls: 'stun:stun2.l.google.com:19302' },
//   // TURN server — replace with your own (coturn / Twilio / Xirsys)
//   // {
//   //   urls: 'turn:your-turn-server.com:3478',
//   //   username: 'dynamic-username',       // fetch from backend
//   //   credential: 'dynamic-password',     // TTL-based, rotate every 24h
//   // },
// ]

// useLiveRoom.ts – ICE_SERVERS array
// Your own TURN server (recommended for production). Set in the client env:
//   NEXT_PUBLIC_TURN_URLS=turn:turn.example.com:3478,turns:turn.example.com:443?transport=tcp
//   NEXT_PUBLIC_TURN_USERNAME=...   NEXT_PUBLIC_TURN_CREDENTIAL=...
// When set it is tried first; the public relays below stay as a fallback.
const CUSTOM_TURN_URLS = (process.env.NEXT_PUBLIC_TURN_URLS || '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);
const CUSTOM_TURN_SERVERS: RTCIceServer[] = CUSTOM_TURN_URLS.length
  ? [
      {
        urls: CUSTOM_TURN_URLS,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
      },
    ]
  : [];

const ICE_SERVERS: RTCIceServer[] = [
  ...CUSTOM_TURN_SERVERS,
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

/**
 * Above this count, warn that SFU should be enabled.
 * In production: integrate mediasoup / LiveKit / Liveswitch.
 */
const SFU_THRESHOLD = 15;

/** Mesh mode max (beyond this, quality degrades badly) */
const MESH_MAX = 8;

/** Stats polling interval (ms) */
const STATS_INTERVAL_MS = 3000;

/** Reconnect backoff: [500ms, 1s, 2s, 4s, 8s] */
const BACKOFF = [500, 1000, 2000, 4000, 8000];

/** Failed/disconnected link: ICE-restart on the SAME connection this many times before rebuilding it. */
const ICE_RESTARTS_BEFORE_REBUILD = 2;

/**
 * Per-peer negotiation bookkeeping ("perfect negotiation" pattern).
 *
 * pcId        – random id of OUR current RTCPeerConnection to this peer. Sent inside every
 *               offer / answer / ICE candidate (the server relays those objects untouched),
 *               so the other side can tell "same connection, renegotiating" apart from
 *               "brand-new connection" (page reload, full rebuild). A new RTCPeerConnection has
 *               a new DTLS identity and cannot be renegotiated into the old one, so the other
 *               side must rebuild too.
 * remotePcId  – the pcId the other side is currently using (learned from their offer/answer).
 * polite      – decided by userId order so both sides always pick opposite roles. On a
 *               collision (both sent an offer) the polite side rolls back and accepts theirs;
 *               the impolite side ignores theirs.
 */
interface PeerMeta {
  pcId: string;
  remotePcId: string | null;
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  settingRemoteAnswer: boolean;
  remoteStream: MediaStream;
}

type QueuedCandidate = RTCIceCandidateInit & { pcId?: string };

/** Result of asking the server to let us into the room. */
export type JoinOutcome =
  | { status: 'ok' }
  | { status: 'rejected' | 'timeout'; message: string };

const newPcId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

// ─── Helpers ──────────────────────────────────────────────────

function buildPeerConfig(): RTCConfiguration {
  return {
    iceServers: ICE_SERVERS,
    iceTransportPolicy: 'all',        // 'relay' forces TURN only
    bundlePolicy: 'max-bundle',       // reduce port usage
    rtcpMuxPolicy: 'require',
    iceCandidatePoolSize: 10,         // pre-gather candidates
  };
}

/**
 * Parse RTCStatsReport into a ConnectionQuality value.
 * Uses round-trip-time + packet loss as signal.
 */
async function measureQuality(
  pc: RTCPeerConnection
): Promise<ConnectionQuality> {
  try {
    const stats = await pc.getStats();
    let rtt = 0;
    let packetLoss = 0;

    stats.forEach((report) => {
      if (report.type === 'remote-inbound-rtp') {
        rtt = (report as any).roundTripTime ?? 0;
        const sent = (report as any).totalPacketsSent ?? 1;
        const lost = (report as any).packetsLost ?? 0;
        packetLoss = lost / sent;
      }
    });

    if (pc.connectionState !== 'connected') return 'disconnected';
    if (rtt < 0.1 && packetLoss < 0.02) return 'excellent';
    if (rtt < 0.3 && packetLoss < 0.05) return 'good';
    return 'poor';
  } catch {
    return 'disconnected';
  }
}

/**
 * Apply adaptive bitrate constraints based on quality.
 * Reduces bandwidth when network is poor.
 */
async function applyBitrateConstraint(
  sender: RTCRtpSender,
  quality: ConnectionQuality
) {
  const params = sender.getParameters();
  if (!params.encodings || params.encodings.length === 0) return;

  const maxBitrate =
    quality === 'excellent' ? 2_500_000  // 2.5 Mbps
      : quality === 'good' ? 1_000_000  // 1 Mbps
        : quality === 'poor' ? 300_000    // 300 Kbps
          : 150_000;                           // 150 Kbps fallback

  params.encodings[0].maxBitrate = maxBitrate;
  try {
    await sender.setParameters(params);
  } catch {
    // setParameters not supported in all browsers — safe to ignore
  }
}

// ─── Hook ─────────────────────────────────────────────────────

export function useLiveRoom({
  roomId,
  sessionId,
  userId,
  userName,
  onPeerJoined,
  onPeerLeft,
  onQualityChange,
}: UseLiveRoomOptions) {
  // ── Refs (stable across renders) ──────────────────────────
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const statsTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Presence heartbeat: server drops a participant after ~120s without 'liveroom:heartbeat'
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const joinedRef = useRef(false);
  // Room id the server accepted our join for (what the server keys camera/mic state on).
  const joinedRoomIdRef = useRef<string>('');
  // Re-announces our camera/mic state to the room (called once a peer connection is up).
  const announceLocalStateRef = useRef<() => void>(() => {});
  const joinInFlightRef = useRef<Promise<JoinOutcome> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalysers = useRef<Map<string, AnalyserNode>>(new Map());
  const reconnectTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const retryCount = useRef<Map<string, number>>(new Map());
  const iceCandidateQueue = useRef<Map<string, QueuedCandidate[]>>(new Map());
  const peerMeta = useRef<Map<string, PeerMeta>>(new Map());
  const signalQueue = useRef<Map<string, Promise<unknown>>>(new Map());
  const scheduleReconnectRef = useRef<(peerId: string) => void>(() => {});
  const isMounted = useRef(true);

  // ── State ─────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, RemotePeer>>(new Map());
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [roomMode, setRoomMode] = useState<RoomMode>('p2p');
  const [error, setError] = useState<string | null>(null);
  const [roomEnded, setRoomEnded] = useState<RoomEndedInfo | null>(null);

  // ── Peer state helpers ────────────────────────────────────
  const updatePeer = useCallback(
    (socketId: string, update: Partial<RemotePeer>) => {
      if (!isMounted.current) return;
      setPeers((prev) => {
        const next = new Map(prev);
        const existing = next.get(socketId);
        if (existing) next.set(socketId, { ...existing, ...update });
        return next;
      });
    },
    []
  );

  // ── Voice Activity Detection ─────────────────────────────
  const setupVAD = useCallback((socketId: string, stream: MediaStream) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      audioAnalysers.current.set(socketId, analyser);
    } catch {
      // VAD is best-effort; don't break on failure
    }
  }, []);

  // ── Peer connections ─────────────────────────────────────
  // NOTE: the Maps below are keyed by the REMOTE USER'S ID (older names in this file
  // say "socketId", but it has always been the userId).

  /** Close and forget the RTCPeerConnection for a peer (no React state changes). */
  const closeLink = useCallback((peerId: string) => {
    const pc = peerConnections.current.get(peerId);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.onnegotiationneeded = null;
      try { pc.close(); } catch { /* already closed */ }
      peerConnections.current.delete(peerId);
    }
    peerMeta.current.delete(peerId);
  }, []);

  const removePeer = useCallback((peerId: string) => {
    if (!isMounted.current) return;

    closeLink(peerId);

    // Clear reconnect timers / queues
    const timer = reconnectTimers.current.get(peerId);
    if (timer) { clearTimeout(timer); reconnectTimers.current.delete(peerId); }
    retryCount.current.delete(peerId);
    iceCandidateQueue.current.delete(peerId);
    audioAnalysers.current.delete(peerId);
    signalQueue.current.delete(peerId);

    setPeers((prev) => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
  }, [closeLink]);

  /** Run signaling work for one peer strictly one-at-a-time (offers/answers must not interleave). */
  const runSerial = useCallback((peerId: string, task: () => Promise<void>) => {
    const prev = signalQueue.current.get(peerId) ?? Promise.resolve();
    const next = prev.then(task).catch((err) => console.error('[WebRTC] signaling task failed', err));
    signalQueue.current.set(peerId, next);
    return next;
  }, []);

  /** The local track that should currently be sent for a kind (screen share wins for video). */
  const currentTrackFor = useCallback((kind: 'audio' | 'video'): MediaStreamTrack | null => {
    if (kind === 'video') {
      const screenTrack = screenStreamRef.current?.getVideoTracks()[0];
      if (screenTrack && screenTrack.readyState === 'live') return screenTrack;
    }
    const local = localStreamRef.current;
    const track = kind === 'audio' ? local?.getAudioTracks()[0] : local?.getVideoTracks()[0];
    return track ?? null;
  }, []);

  /**
   * Give a connection a send+receive slot for BOTH audio and video, and plug our current
   * local tracks (or nothing) into them.
   *
   * Why: if a connection only contains the tracks we happen to have at join time, a user who
   * joins with camera/mic off creates an offer with no media lines, so they can never receive
   * anyone (issue 1), and turning a device on later has no slot to go into (issue 2).
   * With the slots always present, enabling a device later is just `replaceTrack`, which
   * needs no renegotiation.
   *
   * createMissing=false is for the answering side: its slots come from the remote offer.
   */
  const attachLocalMedia = useCallback(
    async (pc: RTCPeerConnection, createMissing: boolean) => {
      const pending: Promise<void>[] = [];
      for (const kind of ['audio', 'video'] as const) {
        let transceiver = pc
          .getTransceivers()
          .find((t) => t.receiver.track.kind === kind && t.direction !== 'stopped');
        if (!transceiver) {
          if (!createMissing) continue;
          transceiver = pc.addTransceiver(kind, { direction: 'sendrecv' });
        } else if (transceiver.direction !== 'sendrecv') {
          transceiver.direction = 'sendrecv';
        }
        const track = currentTrackFor(kind);
        if (transceiver.sender.track !== track) {
          pending.push(
            transceiver.sender.replaceTrack(track).catch((err) => {
              console.warn(`[WebRTC] replaceTrack(${kind}) failed`, err);
            })
          );
        }
      }
      await Promise.all(pending);
    },
    [currentTrackFor]
  );

  /** Push the current local tracks (camera / mic / screen) into every peer connection. */
  const syncLocalMediaToPeers = useCallback(async () => {
    await Promise.all(
      Array.from(peerConnections.current.values()).map((pc) => attachLocalMedia(pc, true))
    );
  }, [attachLocalMedia]);

  /** Create + send an offer for a peer (used by negotiationneeded and manual ICE restart). */
  const negotiate = useCallback(
    async (peerId: string, pc: RTCPeerConnection, iceRestart = false) => {
      const meta = peerMeta.current.get(peerId);
      if (!meta || peerConnections.current.get(peerId) !== pc) return; // replaced meanwhile
      const socket = getSocket();
      if (!socket) return;

      try {
        meta.makingOffer = true;
        const offer = await pc.createOffer(iceRestart ? { iceRestart: true } : undefined);
        // An incoming offer got applied while we were building ours: drop ours.
        // The browser fires negotiationneeded again once we're stable.
        if (pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(offer);

        socket.emit('webrtc-offer', {
          roomId,
          targetUserId: peerId,
          offer: { type: offer.type, sdp: offer.sdp, pcId: meta.pcId },
        });
      } catch (err) {
        console.error('[WebRTC] createOffer failed', err);
      } finally {
        meta.makingOffer = false;
      }
    },
    [roomId]
  );

  /** Add queued ICE candidates that belong to the remote connection we're now talking to. */
  const flushIceQueue = useCallback(
    async (peerId: string, pc: RTCPeerConnection, remotePcId: string | null) => {
      const queued = iceCandidateQueue.current.get(peerId) ?? [];
      iceCandidateQueue.current.delete(peerId);
      for (const { pcId: candidatePcId, ...init } of queued) {
        if (candidatePcId && remotePcId && candidatePcId !== remotePcId) continue; // stale
        await pc.addIceCandidate(init).catch(() => {});
      }
    },
    []
  );

  // ── Create RTCPeerConnection ──────────────────────────────
  // initiator=true  → we start the negotiation (adds audio+video slots → negotiationneeded).
  // initiator=false → we're answering; slots come from the remote offer (see attachLocalMedia).
  const createPeerConnection = useCallback(
    (
      peerId: string,
      peerUserName: string | undefined,
      {
        initiator,
        initialState,
      }: { initiator: boolean; initialState?: { cameraOn?: boolean; micOn?: boolean } }
    ): RTCPeerConnection => {
      // Replace any existing connection to this peer
      const hadExisting = peerConnections.current.has(peerId);
      closeLink(peerId);
      if (hadExisting) updatePeer(peerId, { stream: null, connectionState: 'new' });

      const pc = new RTCPeerConnection(buildPeerConfig());
      const meta: PeerMeta = {
        pcId: newPcId(),
        remotePcId: null,
        polite: userId > peerId,
        makingOffer: false,
        ignoreOffer: false,
        settingRemoteAnswer: false,
        remoteStream: new MediaStream(),
      };
      peerConnections.current.set(peerId, pc);
      peerMeta.current.set(peerId, meta);

      // Remote track received. Peers may send without an msid (slots exist before they have a
      // camera/mic), so don't rely on event.streams: collect every track into one stream.
      pc.ontrack = (event) => {
        const track = event.track;
        if (!meta.remoteStream.getTracks().includes(track)) {
          meta.remoteStream.addTrack(track);
        }
        // Hand the UI a NEW MediaStream object each time a track arrives (audio and video come in
        // separate ontrack events). Adding a track to the same object doesn't fire 'addtrack', so
        // elements already bound to it could keep playing only the first track.
        updatePeer(peerId, { stream: new MediaStream(meta.remoteStream.getTracks()) });

        // Voice activity detection on the remote audio
        if (track.kind === 'audio') setupVAD(peerId, new MediaStream([track]));
      };

      // ICE candidate — send to remote peer via signaling.
      // Server (liveRoomHandler.ts) routes by userId, not socketId.
      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        const socket = getSocket();
        socket?.emit('webrtc-ice-candidate', {
          roomId,
          targetUserId: peerId,
          candidate: { ...event.candidate.toJSON(), pcId: meta.pcId },
        });
      };

      pc.onicecandidateerror = (event) => {
        // Only log in dev; don't alert user — ICE will recover
        if (process.env.NODE_ENV === 'development') {
          console.warn('[ICE error]', event);
        }
      };

      // Browsers fire this whenever slots/tracks change in a way that needs a new offer
      // (first connection, ICE restart, a slot added later, ...).
      pc.onnegotiationneeded = () => {
        void negotiate(peerId, pc);
      };

      // Extra safety net — Safari doesn't always fire onconnectionstatechange reliably
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          scheduleReconnectRef.current(peerId);
        }
      };

      // Connection state machine
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        updatePeer(peerId, { connectionState: state });

        if (state === 'failed') {
          scheduleReconnectRef.current(peerId);
        }

        if (state === 'disconnected') {
          // Give 5s for ICE to recover on its own before we step in
          setTimeout(() => {
            if (pc.connectionState === 'disconnected') {
              scheduleReconnectRef.current(peerId);
            }
          }, 5000);
        }

        if (state === 'connected') {
          // Reset retry counter on success
          retryCount.current.set(peerId, 0);
          // The peer's UI starts with camera/mic "unknown/off" and the one-off toggle events sent
          // at join can arrive before it has created our tile (they are then dropped). Now that the
          // connection is up both sides have a tile, so say what our state really is.
          announceLocalStateRef.current();
        }
      };

      // Initialise peer entry in state
      setPeers((prev) => {
        const next = new Map(prev);
        if (!next.has(peerId)) {
          next.set(peerId, {
            socketId: peerId,
            userId: peerId,
            userName: peerUserName,
            stream: null,
            // Unknown until the server / the peer tells us: assume OFF rather than showing a
            // "camera on" tile with no video. The real state arrives with the participants list
            // or the peer's own announcement right after they join.
            cameraOn: initialState?.cameraOn ?? false,
            micOn: initialState?.micOn ?? false,
            isSpeaking: false,
            quality: 'good',
            connectionState: 'new',
          });
        }
        return next;
      });

      if (initiator) void attachLocalMedia(pc, true);

      return pc;
    },
    [roomId, userId, updatePeer, closeLink, setupVAD, negotiate, attachLocalMedia]
  );

  // ── Reconnect with exponential backoff ───────────────────
  // 1) First tries: ICE restart on the SAME connection (cheap, and the other side just sees a
  //    normal renegotiation, so there is nothing to tear down).
  // 2) After ICE_RESTARTS_BEFORE_REBUILD tries: build a brand-new connection. The other side
  //    notices the new pcId in our offer and rebuilds its end too.
  // If both sides retry at the same moment, perfect negotiation (polite/impolite) resolves it.
  const scheduleReconnect = useCallback(
    (peerId: string) => {
      if (reconnectTimers.current.has(peerId)) return; // one retry at a time per peer

      const count = retryCount.current.get(peerId) ?? 0;
      if (count >= BACKOFF.length) {
        // Max retries — give up, remove peer
        removePeer(peerId);
        onPeerLeft?.(peerId);
        return;
      }

      retryCount.current.set(peerId, count + 1);

      const timer = setTimeout(() => {
        reconnectTimers.current.delete(peerId);
        if (!isMounted.current) return;

        const pc = peerConnections.current.get(peerId);
        if (!pc) return; // peer was removed meanwhile
        if (pc.connectionState === 'connected') return; // recovered by itself

        const rebuild = count >= ICE_RESTARTS_BEFORE_REBUILD || pc.signalingState === 'closed';
        if (!rebuild) {
          if (typeof (pc as any).restartIce === 'function') {
            (pc as any).restartIce(); // fires negotiationneeded → offer with new ICE credentials
          } else {
            void negotiate(peerId, pc, true);
          }
          return;
        }

        createPeerConnection(peerId, undefined, { initiator: true });
      }, BACKOFF[count]);

      reconnectTimers.current.set(peerId, timer);
    },
    [createPeerConnection, negotiate, removePeer, onPeerLeft]
  );
  scheduleReconnectRef.current = scheduleReconnect;

  // Poll VAD and update isSpeaking
  useEffect(() => {
    const interval = setInterval(() => {
      audioAnalysers.current.forEach((analyser, socketId) => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const isSpeaking = avg > 20; // threshold — tune per UX
        updatePeer(socketId, { isSpeaking });
      });
    }, 200);
    return () => clearInterval(interval);
  }, [updatePeer]);

  // ── Stats monitoring ─────────────────────────────────────
  useEffect(() => {
    statsTimerRef.current = setInterval(async () => {
      for (const [socketId, pc] of peerConnections.current) {
        const quality = await measureQuality(pc);
        updatePeer(socketId, { quality });
        onQualityChange?.(socketId, quality);

        // Adaptive bitrate
        const videoSender = pc
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        if (videoSender) await applyBitrateConstraint(videoSender, quality);
      }
    }, STATS_INTERVAL_MS);

    return () => {
      if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    };
  }, [updatePeer, onQualityChange]);

  // ── Get user media ────────────────────────────────────────
  const startLocalStream = useCallback(
    async (camera = true, mic = true): Promise<MediaStream | null> => {
      setIsConnecting(true);
      setError(null);

      try {
        const constraints: MediaStreamConstraints = {
          audio: mic
            ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000,
            }
            : false,
          video: camera
            ? {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 60 },
              facingMode: 'user',
            }
            : false,
        };

        let stream: MediaStream;
        let cameraGranted = camera;
        if (!camera && !mic) {
          stream = new MediaStream();
        } else {
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
          } catch (firstErr: any) {
            // Camera missing or busy (e.g. already used by another tab/app): still join with the mic
            const cameraProblem = ['NotFoundError', 'NotReadableError', 'OverconstrainedError', 'AbortError'];
            if (!(camera && mic && cameraProblem.includes(firstErr?.name))) throw firstErr;
            console.warn('[LiveRoom] camera unavailable, joining with microphone only', firstErr?.name);
            stream = await navigator.mediaDevices.getUserMedia({ audio: constraints.audio, video: false });
            cameraGranted = false;
          }
        }
        console.log('[LiveRoom] getUserMedia success', stream.getTracks().map(t => t.kind));
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsCameraOn(cameraGranted);
        setIsMicOn(mic);



        // Plug the tracks into every existing connection's audio/video slots
        await syncLocalMediaToPeers();

        return stream;
      }
      // catch (err: any) {
      //   const msg =
      //     err.name === 'NotAllowedError'
      //       ? 'Camera/mic permission denied. Please allow access in browser settings.'
      //       : err.name === 'NotFoundError'
      //       ? 'Camera or microphone not found.'
      //       : `Media error: ${err.message}`;
      //   setError(msg);
      //   return null;

      catch (err: any) {
        let msg = err.message;
        if (err.name === 'NotAllowedError')
          msg = 'Camera/Microphone permission denied. Please allow access and refresh.';
        else if (err.name === 'NotFoundError')
          msg = 'No camera or microphone found.';
        setError(msg);
        console.error('[LiveRoom] getUserMedia failed', err);
        return null;
      } finally {
        setIsConnecting(false);
      }
    },
    [syncLocalMediaToPeers]
  );

  // ── Toggle camera ─────────────────────────────────────────
  // const toggleCamera = useCallback(async () => {
  //   if (!localStreamRef.current) {
  //     const newStream = await startLocalStream(true, isMicOn);
  //     if (!newStream) return;
  //   }
  //   // ─── existing toggle logic (keep as is) ───
  //   const stream = localStreamRef.current;
  //   if (!stream) return;
  //   const videoTrack = stream.getVideoTracks()[0];
  //   if (isCameraOn) {
  //     if (videoTrack) videoTrack.enabled = false;
  //     setIsCameraOn(false);
  //   } else {
  //     const stream = localStreamRef.current;
  //     if (!stream) return;

  //     const videoTrack = stream.getVideoTracks()[0];

  //     if (isCameraOn) {
  //       // Turn off — disable track (keeps sender alive for renegotiation)
  //       if (videoTrack) videoTrack.enabled = false;
  //       setIsCameraOn(false);
  //     } else {
  //       if (videoTrack) {
  //         // Re-enable existing track
  //         videoTrack.enabled = true;
  //         setIsCameraOn(true);
  //       } else {
  //         // Track was stopped — request new stream
  //         try {
  //           const newStream = await navigator.mediaDevices.getUserMedia({
  //             video: { width: { ideal: 1280 }, height: { ideal: 720 } },
  //           });
  //           const newTrack = newStream.getVideoTracks()[0];
  //           stream.addTrack(newTrack);

  //           // Replace track in all senders
  //           for (const pc of peerConnections.current.values()) {
  //             const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
  //             if (sender) await sender.replaceTrack(newTrack);
  //           }
  //           setIsCameraOn(true);
  //         } catch {
  //           setError('Could not re-enable camera.');
  //         }
  //       }
  //     }
  //     }
  //   }, [startLocalStream, isMicOn, isCameraOn]);

  // ── Toggle camera ─────────────────────────────────────────
const toggleCamera = useCallback(async () => {
  // Ensure we have a local stream
  if (!localStreamRef.current) {
    const newStream = await startLocalStream(true, isMicOn);
    if (!newStream) return;
  }

  const stream = localStreamRef.current;
  if (!stream) return;

  const videoTrack = stream.getVideoTracks()[0];

  if (isCameraOn) {
    // Turn off
    if (videoTrack) videoTrack.enabled = false;
    setIsCameraOn(false);
  } else {
    // Turn on
    if (videoTrack) {
      // Re-enable existing track
      videoTrack.enabled = true;
      setIsCameraOn(true);
    } else {
      // Track was stopped — request new stream
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        const newTrack = newStream.getVideoTracks()[0];
        stream.addTrack(newTrack);

        // Send it to everyone through each connection's video slot
        await syncLocalMediaToPeers();
        setIsCameraOn(true);
      } catch (err) {
        setError('Could not re-enable camera.');
      }
    }
  }
}, [startLocalStream, syncLocalMediaToPeers, isMicOn, isCameraOn]);

  // ── Toggle mic ────────────────────────────────────────────
  // const toggleMic = useCallback(() => {
  //   const stream = localStreamRef.current;
  //   if (!stream) return;
  //   const audioTrack = stream.getAudioTracks()[0];
  //   if (!audioTrack) return;
  //   audioTrack.enabled = !isMicOn;
  //   setIsMicOn(!isMicOn);
  // }, [isMicOn])
  // 
  
  // ── Toggle mic ────────────────────────────────────────────
const toggleMic = useCallback(async () => {
  // Ensure we have a local stream
  if (!localStreamRef.current) {
    const newStream = await startLocalStream(isCameraOn, true);
    if (!newStream) return;
  }
  const stream = localStreamRef.current;
  if (!stream) return;
  const audioTrack = stream.getAudioTracks()[0];

  if (isMicOn) {
    if (audioTrack) audioTrack.enabled = false;
    setIsMicOn(false);
  } else {
    if (audioTrack) {
      audioTrack.enabled = true;
      setIsMicOn(true);
    } else {
      // Track was not acquired on join — request audio track
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          },
        });
        const newTrack = newStream.getAudioTracks()[0];
        if (newTrack) {
          stream.addTrack(newTrack);
          // Send it to everyone through each connection's audio slot
          await syncLocalMediaToPeers();
          setIsMicOn(true);
        }
      } catch (err) {
        setError('Could not enable microphone.');
      }
    }
  }
}, [startLocalStream, syncLocalMediaToPeers, isCameraOn, isMicOn]);

  // ── Screen share ──────────────────────────────────────────
  const stopScreenShare = useCallback(async () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    // Back to the camera track (or to "nothing" if the camera was never on)
    await syncLocalMediaToPeers();
    setIsScreenSharing(false);
  }, [syncLocalMediaToPeers]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      await stopScreenShare();
      return;
    }

    try {
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: false,
      });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      // Auto-stop when user clicks browser "Stop sharing"
      screenTrack.onended = () => {
        void stopScreenShare();
      };

      // Uses each connection's video slot, so it also works when the camera was never on
      await syncLocalMediaToPeers();
      setIsScreenSharing(true);
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        setError('Screen share failed.');
      }
    }
  }, [isScreenSharing, stopScreenShare, syncLocalMediaToPeers]);

  // ── Join live room ────────────────────────────────────────
  // const joinRoom = useCallback(
  //   async (withCamera = true, withMic = true) => {
  //     setIsConnecting(true);
  //     setError(null);

  //     // Get media first
  //     await startLocalStream(withCamera, withMic);

  //     const socket = getSocket();
  //     if (!socket?.connected) {
  //       setError('Socket not connected. Please refresh.');
  //       setIsConnecting(false);
  //       return;
  //     }

  //     socket.emit('join-live-room', { roomId, userId, userName });
  //     setIsConnecting(false);
  //   },
  //   [roomId, userId, userName, startLocalStream]
  // );

  // ── Join (socket handshake) ──────────────────────────────
  // requestJoin asks the server to put us in the room and WAITS for its answer
  // (accepted = participants list, refused = error event, or a timeout).
  //   • Safe to call twice: while a join is running everyone shares the same attempt, and once
  //     we're in it does nothing. (The page used to emit join-live-room by hand, so a double
  //     click sent two joins.)
  //   • After a successful join it tells the room our camera/mic state, so others don't have to
  //     guess it (they used to assume "on" for everybody).
  const requestJoin = useCallback(
    (opts: { roomId?: string; cameraOn?: boolean; micOn?: boolean } = {}): Promise<JoinOutcome> => {
      // The caller may pass the room id explicitly: right after creating a room, this hook's own
      // `roomId` is still '' (state has not re-rendered yet), and an empty id is silently ignored by the server.
      const targetRoomId = opts.roomId || roomId;
      if (joinedRef.current) return Promise.resolve({ status: 'ok' });
      if (joinInFlightRef.current) return joinInFlightRef.current;

      const socket = getSocket();
      if (!socket) {
        return Promise.resolve({
          status: 'rejected',
          message: 'Socket not available. Please refresh the page.',
        });
      }

      const attempt = new Promise<JoinOutcome>((resolve) => {
        const cleanup = () => {
          clearTimeout(timer);
          socket.off('room-participants-list', onList);
          socket.off('error', onError);
        };
        const onList = (p: { roomId?: string; canonicalRoomId?: string; effectiveRoomId?: string }) => {
          if (p?.roomId && p.roomId !== targetRoomId && p.canonicalRoomId !== targetRoomId && p.effectiveRoomId !== targetRoomId) return;
          cleanup();
          resolve({ status: 'ok' });
        };
        const onError = (p: { event?: string; message?: string }) => {
          if (p?.event !== 'join-live-room') return;
          cleanup();
          const message = p.message?.includes('not a member of this group')
            ? 'Unable to join the room. Please verify your session.'
            : p.message || 'Could not join the room.';
          resolve({ status: 'rejected', message });
        };
        const timer = setTimeout(() => {
          cleanup();
          resolve({ status: 'timeout', message: 'Connection timed out. Please try again.' });
        }, 8000);

        socket.on('room-participants-list', onList);
        socket.on('error', onError);
        socket.emit('join-live-room', { roomId: targetRoomId, userId, userName });
      })
        .then((outcome) => {
          if (outcome.status === 'ok') {
            joinedRef.current = true;
            joinedRoomIdRef.current = targetRoomId;
            socket.emit('toggle-camera', { roomId: targetRoomId, cameraOn: !!opts.cameraOn });
            socket.emit('toggle-mic', { roomId: targetRoomId, micOn: !!opts.micOn });
          }
          return outcome;
        })
        .finally(() => {
          joinInFlightRef.current = null;
        });

      joinInFlightRef.current = attempt;
      return attempt;
    },
    [roomId, userId, userName]
  );

  const joinRoom = useCallback(async (withCamera = true, withMic = true): Promise<boolean> => {
    console.log('[LiveRoom] joinRoom called', { roomId, userId, userName });
    setRoomEnded(null); // naye join pe purana "ended" state reset

    // Guard: roomId empty hone par join mat karo
    if (!roomId) {
      console.error('[LiveRoom] roomId is empty, cannot join');
      setError('Room ID missing. Please try again.');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    const socket = getSocket();
    if (!socket) {
      setError('Socket not available. Please refresh the page.');
      setIsConnecting(false);
      return false;
    }
    // Socket object mil gaya, lekin abhi tak 'connect' event fire nahi hua
    // ho sakta (naya banaya gaya socket hai). Thoda wait karo taaki
    // handshake complete ho jaaye, warna 'connected' abhi bhi false milega.
    if (!socket.connected) {
      const connected = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000);
        socket.once('connect', () => {
          clearTimeout(timeout);
          resolve(true);
        });
      });
      if (!connected) {
        setError('Socket not connected. Please refresh the page.');
        setIsConnecting(false);
        return false;
      }
    }
    const stream = await startLocalStream(withCamera, withMic);
    if (!stream) {
      setIsConnecting(false);
      return false;
    }

    console.log('[LiveRoom] Emitting join-live-room with roomId:', roomId);
    const joinResult = await requestJoin({
      cameraOn: withCamera && stream.getVideoTracks().length > 0,
      micOn: withMic && stream.getAudioTracks().length > 0,
    });

    if (joinResult.status !== 'ok') {
      if (joinResult.status === 'timeout') {
        console.error('[LiveRoom] join-live-room: timeout, treating as failed');
        setPeers(new Map());
      }
      // getUserMedia ho chuka tha: camera/mic light band karo
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setIsCameraOn(false);
      setIsMicOn(false);
      setIsConnecting(false);
      setError(joinResult.message);
      return false;
    }

    setIsConnecting(false);
    return true;
  }, [roomId, userId, userName, startLocalStream, requestJoin]);
  

  // Tell the room our real camera/mic state (read from the actual local tracks).
  useEffect(() => {
    announceLocalStateRef.current = () => {
      const socket = getSocket();
      const joinedRoomId = joinedRoomIdRef.current;
      if (!socket?.connected || !joinedRoomId) return;
      const stream = localStreamRef.current;
      const video = stream?.getVideoTracks()[0];
      const audio = stream?.getAudioTracks()[0];
      socket.emit('toggle-camera', {
        roomId: joinedRoomId,
        cameraOn: !!video && video.enabled && video.readyState === 'live',
      });
      socket.emit('toggle-mic', {
        roomId: joinedRoomId,
        micOn: !!audio && audio.enabled && audio.readyState === 'live',
      });
    };
  }, []);

  // ── Leave live room ───────────────────────────────────────
  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    socket?.emit('leave-live-room', { roomId });
    joinedRef.current = false;
    joinedRoomIdRef.current = '';
    joinInFlightRef.current = null;

    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }

    // Stop all media
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;

    // Close all PCs
    Array.from(peerConnections.current.keys()).forEach((peerId) => closeLink(peerId));
    peerConnections.current.clear();
    peerMeta.current.clear();
    signalQueue.current.clear();

    // Clear all timers
    reconnectTimers.current.forEach((t) => clearTimeout(t));
    reconnectTimers.current.clear();

        // statsTimerRef yahan clear MAT karo — interval sirf ek baar mount pe banta hai,
    // yahan clear karne se rejoin ke baad quality monitoring band ho jati thi.
    // Unmount pe stats effect ka apna cleanup ise clear karta hai.
    audioAnalysers.current.clear();
    retryCount.current.clear();
    iceCandidateQueue.current.clear();
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setLocalStream(null);
    setPeers(new Map());
    setIsCameraOn(false);
    setIsMicOn(false);
    setIsScreenSharing(false);
  }, [roomId, closeLink]);

  // ── Socket event handlers ─────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

       // ── Another user joined → we initiate offer ──
        // Server's 'user-joined-room' payload is { userId, userName, timestamp } — no socketId.
    // socketId only shows up when this fn is reused from room-participants-list.
    // Called for each peer already in the room when WE join (room-participants-list).
    // Only the newcomer starts negotiating; existing peers just answer.
    const connectToPeer = ({
      userId: remoteUserId,
      userName: remoteUserName,
      socketId: remoteSocketId,
      camOn: remoteCamOn,
      micOn: remoteMicOn,
    }: {
      userId: string;
      userName?: string;
      socketId?: string;
      camOn?: boolean;
      micOn?: boolean;
    }) => {
      if (!isMounted.current || !remoteUserId || remoteUserId === userId) return;

      // Keep a healthy or still-connecting link; only build one when there isn't one.
      const existing = peerConnections.current.get(remoteUserId);
      const usable =
        !!existing &&
        existing.signalingState !== 'closed' &&
        existing.connectionState !== 'failed' &&
        existing.connectionState !== 'closed';
      if (!usable) {
        createPeerConnection(remoteUserId, remoteUserName, {
          initiator: true,
          initialState: { cameraOn: remoteCamOn, micOn: remoteMicOn },
        });
      }
      // The list is the server's current snapshot: it also corrects a peer we already know
      if (remoteCamOn !== undefined || remoteMicOn !== undefined) {
        updatePeer(remoteUserId, {
          ...(remoteCamOn !== undefined ? { cameraOn: remoteCamOn } : {}),
          ...(remoteMicOn !== undefined ? { micOn: remoteMicOn } : {}),
        });
      }

      onPeerJoined?.({
        socketId: remoteSocketId || remoteUserId,
        userId: remoteUserId,
        userName: remoteUserName,
        stream: null,
        cameraOn: !!remoteCamOn,
        micOn: !!remoteMicOn,
        isSpeaking: false,
        quality: 'good',
        connectionState: 'new',
      });
    };

    // ── NEW: existing peer just gets NOTIFIED a new user joined.
    // Does NOT create an offer — this prevents "offer glare", where both the
    // newcomer (via room-participants-list) and the existing peer (via this
    // event) would otherwise send simultaneous offers to each other, each
    // tearing down the other's in-flight PeerConnection. Only the newcomer
    // initiates; the existing peer just waits and answers when the offer
    // arrives (handleOffer already does this correctly).
    const handlePeerAnnounced = ({
      userId: remoteUserId,
      userName: remoteUserName,
      cameraOn: announcedCam,
      micOn: announcedMic,
    }: {
      userId: string;
      userName?: string;
      cameraOn?: boolean;
      micOn?: boolean;
    }) => {
      if (!isMounted.current || !remoteUserId || remoteUserId === userId) return;

      setPeers((prev) => {
        const next = new Map(prev);
        if (!next.has(remoteUserId)) {
          next.set(remoteUserId, {
            socketId: remoteUserId,
            userId: remoteUserId,
            userName: remoteUserName,
            stream: null,
            cameraOn: !!announcedCam, // real state follows via user-camera-toggle / mic-toggle
            micOn: !!announcedMic,
            isSpeaking: false,
            quality: 'good',
            connectionState: 'new',
          });
        }
        return next;
      });

      onPeerJoined?.({
        socketId: remoteUserId,
        userId: remoteUserId,
        userName: remoteUserName,
        stream: null,
        cameraOn: !!announcedCam,
        micOn: !!announcedMic,
        isSpeaking: false,
        quality: 'good',
        connectionState: 'new',
      });
    };


    // ── Receive offer → send answer ──
    // Server sends { fromUserId, roomId, offer } only (offer carries our extra pcId field).
    const handleOffer = ({
      fromUserId,
      offer,
    }: {
      fromUserId: string;
      roomId?: string;
      offer: RTCSessionDescriptionInit & { pcId?: string };
    }) =>
      runSerial(fromUserId, async () => {
        if (!isMounted.current || !fromUserId || !offer?.sdp) return;

        const incomingPcId = offer.pcId ?? null;
        let pc = peerConnections.current.get(fromUserId);
        let meta = peerMeta.current.get(fromUserId);

        // The other side is on a different RTCPeerConnection than the one we know (reload or
        // full rebuild). Its DTLS identity changed, so our old connection can't take this
        // offer: start over with a clean one.
        const remoteRebuilt =
          !!meta && !!incomingPcId && !!meta.remotePcId && meta.remotePcId !== incomingPcId;

        if (!pc || !meta || pc.signalingState === 'closed' || remoteRebuilt) {
          pc = createPeerConnection(fromUserId, undefined, { initiator: false });
          meta = peerMeta.current.get(fromUserId)!;
        }

        // Perfect negotiation: if both sides offered at the same time, the impolite side
        // ignores the incoming offer, the polite side rolls back its own and accepts it.
        const readyForOffer =
          !meta.makingOffer && (pc.signalingState === 'stable' || meta.settingRemoteAnswer);
        meta.ignoreOffer = !meta.polite && !readyForOffer;
        if (meta.ignoreOffer) return;

        try {
          meta.remotePcId = incomingPcId ?? meta.remotePcId;
          await pc.setRemoteDescription({ type: offer.type, sdp: offer.sdp });
          await flushIceQueue(fromUserId, pc, meta.remotePcId);

          // Our slots come from their offer; put our camera/mic into them before answering
          await attachLocalMedia(pc, false);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('webrtc-answer', {
            roomId,
            targetUserId: fromUserId,
            answer: { type: answer.type, sdp: answer.sdp, pcId: meta.pcId, forPcId: incomingPcId },
          });
        } catch (err) {
          console.error('[WebRTC] answer failed', err);
        }
      });

    // ── Receive answer ──
    const handleAnswer = ({
      fromUserId,
      answer,
    }: {
      fromUserId: string;
      answer: RTCSessionDescriptionInit & { pcId?: string; forPcId?: string | null };
    }) =>
      runSerial(fromUserId, async () => {
        const pc = peerConnections.current.get(fromUserId);
        const meta = peerMeta.current.get(fromUserId);
        if (!pc || !meta || !answer?.sdp) return;

        // Answer to a connection we have already replaced
        if (answer.forPcId && answer.forPcId !== meta.pcId) return;
        // Answer from a different remote connection than the one we're negotiating with
        if (answer.pcId && meta.remotePcId && answer.pcId !== meta.remotePcId) return;
        // Guard against invalid state (e.g., duplicate answer)
        if (pc.signalingState !== 'have-local-offer') return;

        try {
          meta.settingRemoteAnswer = true;
          meta.remotePcId = answer.pcId ?? meta.remotePcId;
          await pc.setRemoteDescription({ type: answer.type, sdp: answer.sdp });
          await flushIceQueue(fromUserId, pc, meta.remotePcId);
        } catch (err) {
          console.error('[WebRTC] setRemoteDescription (answer) failed', err);
        } finally {
          meta.settingRemoteAnswer = false;
        }
      });

    // ── Receive ICE candidate ──
    const handleIceCandidate = async ({
      fromUserId,
      candidate,
    }: {
      fromUserId: string;
      candidate: QueuedCandidate;
    }) => {
      if (!candidate) return;
      const pc = peerConnections.current.get(fromUserId);
      const meta = peerMeta.current.get(fromUserId);
      const { pcId: candidatePcId, ...init } = candidate;

      // Candidate from a remote connection we've already moved on from
      if (meta?.remotePcId && candidatePcId && candidatePcId !== meta.remotePcId) return;

      if (!pc || !pc.remoteDescription) {
        const queued = iceCandidateQueue.current.get(fromUserId) || [];
        queued.push(candidate);
        iceCandidateQueue.current.set(fromUserId, queued);
        return;
      }

      try {
        await pc.addIceCandidate(init);
      } catch (err) {
        // Benign in some race conditions (e.g. an offer we deliberately ignored) — ignore
        if (!meta?.ignoreOffer) console.warn('[WebRTC] addIceCandidate failed', err);
      }
    };

    // ── User left room ──
       // Server's 'user-left-room' payload is { userId, userName, timestamp }.
       const handleUserLeft = ({ userId: remoteUserId }: { userId: string }) => {
        if (!remoteUserId) return;
        removePeer(remoteUserId);
        onPeerLeft?.(remoteUserId);
      };

    // ── Remote media toggles ──
    const handleCameraToggle = ({
      userId: remoteUserId,
      cameraOn,
    }: {
      userId: string;
      cameraOn: boolean;
    }) => {
      setPeers((prev) => {
        const next = new Map(prev);
        next.forEach((peer, key) => {
          if (peer.userId === remoteUserId) {
            next.set(key, { ...peer, cameraOn });
          }
        });
        return next;
      });
    };

    const handleMicToggle = ({
      userId: remoteUserId,
      micOn,
    }: {
      userId: string;
      micOn: boolean;
    }) => {
      setPeers((prev) => {
        const next = new Map(prev);
        next.forEach((peer, key) => {
          if (peer.userId === remoteUserId) {
            next.set(key, { ...peer, micOn });
          }
        });
        return next;
      });
    };

    // ── Existing participants list (sent by server on join) ──
    const handleRoomParticipants = ({
      participants,
    }: {
      participants: Array<{
        socketId: string;
        userId: string;
        userName?: string;
        camOn?: boolean;
        micOn?: boolean;
      }>;
    }) => {
      // The server only sends this to the joiner, so it marks "we are in the room".
      // Start the presence heartbeat here so it works for every join path
      // (the group page emits join-live-room directly, bypassing joinRoom).
      // The server prunes participants after ~120s without a heartbeat.
      if (roomId && !heartbeatTimerRef.current) {
        heartbeatTimerRef.current = setInterval(() => {
          const hbSocket = getSocket();
          if (hbSocket?.connected) hbSocket.emit('liveroom:heartbeat', { roomId });
        }, HEARTBEAT_INTERVAL_MS);
      }

      // For each existing participant, initiate offer
      participants.forEach((p) => {
        if (p.socketId === socket.id) return; // skip self
        connectToPeer(p);
      });

      // Warn if SFU threshold exceeded
      if (participants.length >= SFU_THRESHOLD) {
        setRoomMode('sfu');
        console.warn(
          `[LiveRoom] ${participants.length} peers — SFU mode recommended.`
        );
      }
    };

        // ── Mentor ne session end kiya → sabko room se nikalo ──
        const handleSessionEnded = (payload: RoomEndedInfo) => {
          if (!isMounted.current) return;
          // Sirf apni room/session ka event process karo
          const ids = [payload?.sessionId, payload?.bookingId].filter(Boolean);
          if (
            ids.length > 0 &&
            !ids.includes(roomId) &&
            !(sessionId && ids.includes(sessionId))
          ) {
            return;
          }
          
          
          leaveRoom();
          setRoomEnded(payload ?? {});
        };
    
        socket.on('user-joined-room', handlePeerAnnounced);
        socket.on('session:ended', handleSessionEnded);
        socket.on('live-room-ended', handleSessionEnded);
    socket.on('webrtc-offer-received', handleOffer);
    socket.on('webrtc-answer-received', handleAnswer);
    socket.on('webrtc-ice-candidate-received', handleIceCandidate);
    socket.on('user-left-room', handleUserLeft);
    socket.on('user-camera-toggle', handleCameraToggle);
    socket.on('user-mic-toggle', handleMicToggle);
    socket.on('room-participants-list', handleRoomParticipants);

    return () => {
      socket.off('user-joined-room', handlePeerAnnounced);
      socket.off('session:ended', handleSessionEnded);
      socket.off('live-room-ended', handleSessionEnded);
      socket.off('webrtc-offer-received', handleOffer);
      socket.off('webrtc-answer-received', handleAnswer);
      socket.off('webrtc-ice-candidate-received', handleIceCandidate);
      socket.off('user-left-room', handleUserLeft);
      socket.off('user-camera-toggle', handleCameraToggle);
      socket.off('user-mic-toggle', handleMicToggle);
      socket.off('room-participants-list', handleRoomParticipants);
    };
  }, [
    roomId,
    sessionId,
    userId,
    leaveRoom,
    createPeerConnection,
    removePeer,
    attachLocalMedia,
    flushIceQueue,
    runSerial,
    updatePeer,
    onPeerJoined,
    onPeerLeft,
  ]);

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      leaveRoom();
    };
  }, [leaveRoom]);

  // ── Request existing participants on join ─────────────────
  // useEffect(() => {
  //   const socket = getSocket();
  //   if (!socket || !roomId) return;

  //   socket.emit('get-room-participants', { roomId });
  // }, [roomId]);

  // ── Derived state ─────────────────────────────────────────
  const peersArray = useMemo(() => Array.from(peers.values()), [peers]);

  const activeSpeakers = useMemo(
    () => peersArray.filter((p) => p.isSpeaking).map((p) => p.userId),
    [peersArray]
  );

  return {
    // State
    localStream,
    peers: peersArray,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    isConnecting,
    roomMode,
    error,
    roomEnded,
    activeSpeakers,

    // Actions
    joinRoom,
    requestJoin,
    leaveRoom,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    startLocalStream,
  } as const;
}



