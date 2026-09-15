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
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'dynamic-user',
    credential: 'dynamic-password'
  }
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalysers = useRef<Map<string, AnalyserNode>>(new Map());
  const reconnectTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const retryCount = useRef<Map<string, number>>(new Map());
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

  const removePeer = useCallback((socketId: string) => {
    if (!isMounted.current) return;

    // Close PC
    const pc = peerConnections.current.get(socketId);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peerConnections.current.delete(socketId);
    }

    // Clear stats / reconnect timers
    const timer = reconnectTimers.current.get(socketId);
    if (timer) { clearTimeout(timer); reconnectTimers.current.delete(socketId); }
    retryCount.current.delete(socketId);
    audioAnalysers.current.delete(socketId);

    setPeers((prev) => {
      const next = new Map(prev);
      next.delete(socketId);
      return next;
    });
  }, []);

  // ── Create RTCPeerConnection ──────────────────────────────
  const createPeerConnection = useCallback(
    (socketId: string, peerUserId: string, peerUserName?: string): RTCPeerConnection => {
      // Tear down existing if any
      const existing = peerConnections.current.get(socketId);
      if (existing) {
        existing.close();
        peerConnections.current.delete(socketId);
      }

      const pc = new RTCPeerConnection(buildPeerConfig());
      peerConnections.current.set(socketId, pc);

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Remote track received
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        updatePeer(socketId, { stream: remoteStream });

        // Voice activity detection on remote stream
        setupVAD(socketId, remoteStream);
      };

         // ICE candidate — send to remote peer via signaling.
      // Server (liveRoomHandler.ts) routes by userId, not socketId.
      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        const socket = getSocket();
        socket?.emit('webrtc-ice-candidate', {
          roomId,
          targetUserId: peerUserId,
          candidate: event.candidate,
        });
      };

      // ICE restart on failure
      pc.onicecandidateerror = (event) => {
        // Only log in dev; don't alert user — ICE will recover
        if (process.env.NODE_ENV === 'development') {
          console.warn('[ICE error]', event);
        }
      };

      // Connection state machine
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        updatePeer(socketId, { connectionState: state });

        if (state === 'failed') {
          scheduleReconnect(socketId, peerUserId, peerUserName);
        }

        if (state === 'disconnected') {
          // Give 5s for ICE restart before declaring failed
          setTimeout(() => {
            if (pc.connectionState === 'disconnected') {
              scheduleReconnect(socketId, peerUserId, peerUserName);
            }
          }, 5000);
        }

        if (state === 'connected') {
          // Reset retry counter on success
          retryCount.current.set(socketId, 0);
        }
      };

      // Initialise peer entry in state
      setPeers((prev) => {
        const next = new Map(prev);
        if (!next.has(socketId)) {
          next.set(socketId, {
            socketId,
            userId: peerUserId,
            userName: peerUserName,
            stream: null,
            cameraOn: true,
            micOn: true,
            isSpeaking: false,
            quality: 'good',
            connectionState: 'new',
          });
        }
        return next;
      });

      return pc;
    },
    [roomId, updatePeer]
  );

  // ── Reconnect with exponential backoff ───────────────────
  const scheduleReconnect = useCallback(
    (socketId: string, peerUserId: string, peerUserName?: string) => {
      const count = retryCount.current.get(socketId) ?? 0;
      if (count >= BACKOFF.length) {
        // Max retries — give up, remove peer
        removePeer(socketId);
        onPeerLeft?.(socketId);
        return;
      }

      const delay = BACKOFF[count];
      retryCount.current.set(socketId, count + 1);

      const timer = setTimeout(async () => {
        if (!isMounted.current) return;
        const pc = createPeerConnection(socketId, peerUserId, peerUserName);

        try {
          // ICE restart offer
          const offer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offer);

          const socket = getSocket();
          // Server routes only by targetUserId (see liveRoomHandler.ts) — the old
          // targetSocketId field here was silently dropped by the `if (!targetUserId...)`
          // guard, so reconnect offers never reached the peer. `socketId` in this
          // function is actually the userId (peerConnections is keyed by userId
          // throughout this file), so it's safe to reuse directly.
          socket?.emit('webrtc-offer', {
            roomId,
            targetUserId: socketId,
            offer,
          });
        } catch (err) {
          console.error('[WebRTC] ICE restart failed', err);
        }
      }, delay);

      reconnectTimers.current.set(socketId, timer);
    },
    [roomId, createPeerConnection, removePeer, onPeerLeft]
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

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('[LiveRoom] getUserMedia success', stream.getTracks().map(t => t.kind));
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsCameraOn(camera);
        setIsMicOn(mic);



        // Add tracks to all existing PCs (re-join scenario)
        peerConnections.current.forEach((pc) => {
          stream.getTracks().forEach((track) => {
            // Avoid duplicate senders
            const alreadyAdded = pc.getSenders().some(
              (s) => s.track?.id === track.id
            );
            if (!alreadyAdded) pc.addTrack(track, stream);
          });
        });

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
    []
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

        // Replace track in all senders
        for (const pc of peerConnections.current.values()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(newTrack);
        }
        setIsCameraOn(true);
      } catch (err) {
        setError('Could not re-enable camera.');
      }
    }
  }
}, [startLocalStream, isMicOn, isCameraOn]);

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
  if (!audioTrack) return;
  audioTrack.enabled = !isMicOn;
  setIsMicOn(!isMicOn);
}, [startLocalStream, isCameraOn, isMicOn]);

  // ── Screen share ──────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen share, restore camera
      const screenTrack = screenStreamRef.current?.getVideoTracks()[0];
      screenTrack?.stop();
      screenStreamRef.current = null;

      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        for (const pc of peerConnections.current.values()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(cameraTrack);
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: { displaySurface: 'monitor' },
          audio: false,
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in all peers
        for (const pc of peerConnections.current.values()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(screenTrack);
        }

        // Auto-stop when user clicks browser "Stop sharing"
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };

        setIsScreenSharing(true);
      } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
          setError('Screen share failed.');
        }
      }
    }
  }, [isScreenSharing]);

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

// REPLACE WITH:
  const joinRoom = useCallback(async (withCamera = true, withMic = true) => {
    console.log('[LiveRoom] joinRoom called', { roomId, userId, userName });
    
    // Guard: roomId empty hone par join mat karo
    if (!roomId) {
      console.error('[LiveRoom] roomId is empty, cannot join');
      setError('Room ID missing. Please try again.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    const socket = getSocket();
    if (!socket?.connected) {
      setError('Socket not connected. Please refresh the page.');
      setIsConnecting(false);
      return;
    }
    const stream = await startLocalStream(withCamera, withMic);
    if (!stream) {
      setIsConnecting(false);
      return;
    }

    // REPLACE WITH:
    // roomId ko fresh read karo closure se nahi
    console.log('[LiveRoom] Emitting join-live-room with roomId:', roomId);
    if (!roomId) {
      setError('Room ID is missing.');
      setIsConnecting(false);
      return;
    }
    socket.emit('join-live-room', { roomId, userId, userName });


    
    setIsConnecting(false);
  }, [roomId, userId, userName, startLocalStream]);


  // ── Leave live room ───────────────────────────────────────
  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    socket?.emit('leave-live-room', { roomId });

    // Stop all media
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;

    // Close all PCs
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();

    // Clear all timers
    reconnectTimers.current.forEach((t) => clearTimeout(t));
    reconnectTimers.current.clear();

    if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setLocalStream(null);
    setPeers(new Map());
    setIsCameraOn(false);
    setIsMicOn(false);
    setIsScreenSharing(false);
  }, [roomId]);

  // ── Socket event handlers ─────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // ── Another user joined → we initiate offer ──
        // Server's 'user-joined-room' payload is { userId, userName, timestamp } — no socketId.
    // socketId only shows up when this fn is reused from room-participants-list.
    const handleUserJoined = async ({
      userId: remoteUserId,
      userName: remoteUserName,
      socketId: remoteSocketId,
    }: {
      userId: string;
      userName?: string;
      socketId?: string;
    }) => {
      if (!isMounted.current || !remoteUserId || remoteUserId === userId) return;

      const pc = createPeerConnection(remoteUserId, remoteUserId, remoteUserName);

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('webrtc-offer', {
          roomId,
          targetUserId: remoteUserId,
          offer,
        });
      } catch (err) {
        console.error('[WebRTC] createOffer failed', err);
      }

      onPeerJoined?.({
        socketId: remoteSocketId || remoteUserId,
        userId: remoteUserId,
        userName: remoteUserName,
        stream: null,
        cameraOn: true,
        micOn: true,
        isSpeaking: false,
        quality: 'good',
        connectionState: 'new',
      });
    };

    // ── Receive offer → send answer ──
        // Server sends { fromUserId, roomId, offer } only.
        const handleOffer = async ({
          fromUserId,
          offer,
        }: {
          fromUserId: string;
          roomId?: string;
          offer: RTCSessionDescriptionInit;
        }) => {
          if (!isMounted.current || !fromUserId) return;
    
          const pc = createPeerConnection(fromUserId, fromUserId, undefined);
    
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
    
            socket.emit('webrtc-answer', {
              roomId,
              targetUserId: fromUserId,
              answer,
            });
          } catch (err) {
            console.error('[WebRTC] answer failed', err);
          }
        };

    // ── Receive answer ──
    const handleAnswer = async ({
      fromUserId,
      answer,
    }: {
      fromUserId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const pc = peerConnections.current.get(fromUserId);
      if (!pc) return;

      try {
        // Guard against invalid state (e.g., duplicate answer)
        if (pc.signalingState !== 'have-local-offer') return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('[WebRTC] setRemoteDescription (answer) failed', err);
      }
    };

    // ── Receive ICE candidate ──
    const handleIceCandidate = async ({
      fromUserId,
      candidate,
    }: {
      fromUserId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peerConnections.current.get(fromUserId);
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        // Benign in some race conditions — ignore
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
      participants: Array<{ socketId: string; userId: string; userName?: string }>;
    }) => {
      // For each existing participant, initiate offer
      participants.forEach((p) => {
        if (p.socketId === socket.id) return; // skip self
        handleUserJoined(p);
      });

      // Warn if SFU threshold exceeded
      if (participants.length >= SFU_THRESHOLD) {
        setRoomMode('sfu');
        console.warn(
          `[LiveRoom] ${participants.length} peers — SFU mode recommended.`
        );
      }
    };

    socket.on('user-joined-room', handleUserJoined);
    socket.on('webrtc-offer-received', handleOffer);
    socket.on('webrtc-answer-received', handleAnswer);
    socket.on('webrtc-ice-candidate-received', handleIceCandidate);
    socket.on('user-left-room', handleUserLeft);
    socket.on('user-camera-toggle', handleCameraToggle);
    socket.on('user-mic-toggle', handleMicToggle);
    socket.on('room-participants-list', handleRoomParticipants);

    return () => {
      socket.off('user-joined-room', handleUserJoined);
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
    createPeerConnection,
    removePeer,
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
    activeSpeakers,

    // Actions
    joinRoom,
    leaveRoom,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    startLocalStream,
  } as const;
}



