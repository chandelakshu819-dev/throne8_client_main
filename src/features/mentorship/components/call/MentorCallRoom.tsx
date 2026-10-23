'use client';

// src/features/mentorship/components/call/MentorCallRoom.tsx
//
// Meet-style live call UI used by /mentorship/mentor-session (mentor AND mentee).
//
// Phases:  lobby -> live -> (left | dropped) -> live ...  -> ended
//  - lobby   : camera preview + mic/cam toggles, "Join now"
//  - live    : full-screen stage, floating self view, control bar, side panel
//  - left    : user pressed Leave. Session keeps running, "Rejoin" available
//  - dropped : network lost for too long. "Rejoin" available
//  - ended   : session completed (mentor ended it, or it was ended remotely)
//              mentee gets a 5s countdown and is sent to Reviews & Feedback

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Mic,
  MicOff,
  MonitorOff,
  MonitorUp,
  MoreVertical,
  PanelRight,
  PhoneOff,
  RotateCcw,
  Smile,
  Star,
  Users,
  Video,
  VideoOff,
  WifiOff,
  X,
} from 'lucide-react';
import { useLiveRoom } from '@/core/webrtc/useLiveRoom';
import { useRingtone } from '@/shared/hooks/useRingtone';
import { getSocket, initializeSocket } from '@/core/realtime/socket.client';
import SessionService from '@/lib/api/session.service';
import MentorSessionPanels from './MentorSessionPanels';

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  bg: '#17120e',
  surface: '#241c15',
  tile: '#2c231b',
  text: '#f3ece4',
  muted: 'rgba(243,236,228,0.62)',
  border: 'rgba(255,255,255,0.09)',
  btn: 'rgba(255,255,255,0.10)',
  btnHover: 'rgba(255,255,255,0.18)',
  accent: '#c9a87c',
  accentInk: '#241c15',
  danger: '#d8503c',
  dangerSoft: 'rgba(216,80,60,0.16)',
  success: '#6fbf8b',
  warn: '#e0a458',
} as const;

type Phase = 'lobby' | 'live' | 'left' | 'dropped' | 'ended';

const RECONNECT_GRACE_MS = 30000;
const REVIEW_REDIRECT_SECONDS = 5;
const REACTIONS = ['👍', '❤️', '😂', '👏', '🎉'];
const OVER_STATUSES = ['completed', 'cancelled', 'no_show', 'refunded'];

interface Props {
  sessionId: string;
  roomId: string;
  bookingId: string;
  userId: string;
  userName: string;
  isMentor: boolean;
   /** Back to bookings / previous page. */
   onExit: () => void;
   /** Mentor only: called right after the mentor leaves the call (session keeps running). */
   onMentorLeft?: () => void;
  /** Mentee only: go to Reviews & Feedback for this session. */
  onGoToReview: () => void;
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function initialsOf(name: string) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return ((parts[0][0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function Avatar({ name, size }: { name: string; size: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, #7a5c3e, ${T.accent})`,
        color: '#fff',
      }}
    >
      {initialsOf(name)}
    </div>
  );
}

function VideoSurface({
  stream,
  showVideo,
  muted,
  mirror,
  name,
  speaking,
  avatarSize,
  radius,
  nameLabel,
  micOff,
}: {
  stream: MediaStream | null;
  showVideo: boolean;
  muted?: boolean;
  mirror?: boolean;
  name: string;
  speaking?: boolean;
  avatarSize: number;
  radius: number;
  nameLabel: string;
  micOff?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.srcObject !== stream) el.srcObject = stream;
  }, [stream]);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: T.tile,
        borderRadius: radius,
        boxShadow: speaking ? `0 0 0 3px ${T.accent}` : '0 0 0 1px rgba(255,255,255,0.06)',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* kept mounted (invisible, not removed) so remote audio keeps playing when camera is off */}
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover ${showVideo ? '' : 'invisible'}`}
        style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
      />
      {!showVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar name={name} size={avatarSize} />
        </div>
      )}
      <div
        className="absolute bottom-2.5 left-2.5 flex max-w-[85%] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"
        style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
      >
        {micOff && <MicOff className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#f0a08c' }} />}
        <span className="truncate">{nameLabel}</span>
      </div>
    </div>
  );
}

function RoundButton({
  onClick,
  title,
  active,
  danger,
  disabled,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const bg = danger ? T.danger : active ? T.accent : hover ? T.btnHover : T.btn;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex h-12 w-12 items-center justify-center rounded-full transition-colors disabled:opacity-50"
      style={{ background: bg, color: active && !danger ? T.accentInk : '#fff' }}
    >
      {children}
    </button>
  );
}

// ─── Lobby ────────────────────────────────────────────────────────────────────
function Lobby({
  title,
  userName,
  joining,
  error,
  onJoin,
  onCancel,
  heading,
  subheading,
  joinLabel,
}: {
  title: string;
  userName: string;
  joining: boolean;
  error: string | null;
  onJoin: (camOn: boolean, micOn: boolean) => void;
  onCancel: () => void;
  heading: string;
  subheading: string;
  joinLabel: string;
}) {
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [preview, setPreview] = useState<MediaStream | null>(null);
  const [permError, setPermError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopPreview = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPreview(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!camOn) {
      stopPreview();
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPermError('Camera is not available in this browser or context.');
      setCamOn(false);
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        setPreview(s);
        setPermError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setPermError(
          'Camera access is blocked. Allow it in your browser settings, or join with the camera off.'
        );
        setCamOn(false);
      });
    return () => {
      cancelled = true;
      stopPreview();
    };
  }, [camOn, stopPreview]);

  const handleJoin = () => {
    // release the preview camera BEFORE the call hook asks for it again
    stopPreview();
    onJoin(camOn, micOn);
  };

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto p-4 sm:p-8">
      <div className="grid w-full max-w-5xl items-center gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl" style={{ background: T.tile }}>
            <VideoSurface
              stream={preview}
              showVideo={camOn && !!preview}
              muted
              mirror
              name={userName}
              avatarSize={96}
              radius={16}
              nameLabel={`${userName} (You)`}
              micOff={!micOn}
            />
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3">
              <RoundButton
                onClick={() => setMicOn((v) => !v)}
                title={micOn ? 'Turn off microphone' : 'Turn on microphone'}
                danger={!micOn}
              >
                {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </RoundButton>
              <RoundButton
                onClick={() => setCamOn((v) => !v)}
                title={camOn ? 'Turn off camera' : 'Turn on camera'}
                danger={!camOn}
              >
                {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </RoundButton>
            </div>
          </div>
          {permError && (
            <p className="mt-3 flex items-start gap-2 text-sm" style={{ color: T.warn }}>
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {permError}
            </p>
          )}
        </div>

        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-semibold sm:text-3xl" style={{ color: T.text }}>
            {heading}
          </h1>
          <p className="mt-2 text-sm" style={{ color: T.muted }}>
            {subheading}
          </p>
          {title && (
            <p className="mt-4 text-sm font-medium" style={{ color: T.accent }}>
              {title}
            </p>
          )}
          {error && (
            <p
              className="mt-4 rounded-lg px-3 py-2 text-sm"
              style={{ background: T.dangerSoft, color: '#f0a08c' }}
            >
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
            <button
              onClick={handleJoin}
              disabled={joining}
              className="flex w-full items-center justify-center gap-2 rounded-full px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
              style={{ background: T.accent, color: T.accentInk }}
            >
              {joining && <Loader2 className="h-4 w-4 animate-spin" />}
              {joining ? 'Joining...' : joinLabel}
            </button>
            <button
              onClick={onCancel}
              disabled={joining}
              className="w-full rounded-full px-6 py-3 text-sm font-medium transition-colors disabled:opacity-60 sm:w-auto"
              style={{ border: `1px solid ${T.border}`, color: T.text }}
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Centered status card (left / dropped / ended) ────────────────────────────
function StatusCard({
  icon,
  tone,
  title,
  text,
  children,
}: {
  icon: React.ReactNode;
  tone: 'neutral' | 'warn' | 'success';
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  const toneBg =
    tone === 'success' ? 'rgba(111,191,139,0.16)' : tone === 'warn' ? 'rgba(224,164,88,0.16)' : T.btn;
  const toneFg = tone === 'success' ? T.success : tone === 'warn' ? T.warn : T.text;
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div
        className="w-full max-w-md rounded-3xl p-8 text-center"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: toneBg, color: toneFg }}
        >
          {icon}
        </div>
        <h2 className="text-2xl font-semibold" style={{ color: T.text }}>
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: T.muted }}>
          {text}
        </p>
        {children}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MentorCallRoom({
  sessionId,
  roomId,
  bookingId,
  userId,
  userName,
  isMentor,
  onExit,
  onMentorLeft,
  onGoToReview,
}: Props) {
  const {
    localStream,
    peers,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    isConnecting,
    error: liveRoomError,
    roomEnded,
    joinRoom,
    leaveRoom,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
  } = useLiveRoom({ roomId, sessionId, userId, userName });

  // ── phase state ──
  const [phase, setPhase] = useState<Phase>('lobby');
  const phaseRef = useRef<Phase>('lobby');
  const goPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const prefsRef = useRef({ cam: true, mic: true });
  const rejoinBusyRef = useRef(false);

  const [reconnecting, setReconnecting] = useState(false);
  const reconnectingRef = useRef(false);
  const dropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── session info (best effort) ──
  const [sessionTitle, setSessionTitle] = useState('');
  const [endsAt, setEndsAt] = useState<number | null>(null);

  // ── timers ──
  const joinedAtRef = useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [finalElapsed, setFinalElapsed] = useState(0);

  // ── ui state ──
  const [panelOpen, setPanelOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [floating, setFloating] = useState<{ id: number; emoji: string; self: boolean }[]>([]);
  const reactionIdRef = useRef(0);
  const controlsRef = useRef<HTMLDivElement>(null);

  // ── ending ──
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [endedByMe, setEndedByMe] = useState(false);

  // ── mentee redirect ──
  const [countdown, setCountdown] = useState(REVIEW_REDIRECT_SECONDS);
  const [redirectCancelled, setRedirectCancelled] = useState(false);
  const redirectedRef = useRef(false);

  const peer = peers[0];
  const displayName = userName || 'You';

  // Fetch title / schedule for the top bar
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res: any = await SessionService.getSessionById(sessionId);
        const d = res?.data ?? res;
        if (cancelled || !d) return;
        setSessionTitle(d.title || '');
        const start = new Date(d.startTime || d.scheduledAt || '').getTime();
        const mins = Number(d.duration ?? d.durationMinutes);
        if (!isNaN(start) && mins > 0) setEndsAt(start + mins * 60000);
      } catch {
        /* top bar simply shows no schedule */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Tick once per second while the call is on screen
  useEffect(() => {
    if (phase !== 'live') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const elapsed = joinedAtRef.current ? (now - joinedAtRef.current) / 1000 : 0;
  const remainingMs = endsAt ? endsAt - now : null;

  // ── join / rejoin ──
  const notifyJoin = useCallback(() => {
    getSocket()?.emit('mentorship:notify-join', { sessionId });
  }, [sessionId]);

  const doJoin = useCallback(
    async (cam: boolean, mic: boolean) => {
      prefsRef.current = { cam, mic };
      setJoining(true);
      setJoinError(null);
      const ok = await joinRoom(cam, mic);
      setJoining(false);
      if (!ok) return false;
      if (!joinedAtRef.current) joinedAtRef.current = Date.now();
      setNow(Date.now());
      notifyJoin();
      goPhase('live');
      return true;
    },
    [joinRoom, notifyJoin, goPhase]
  );

  const isSessionOver = useCallback(async (): Promise<boolean> => {
    try {
      const res: any = await SessionService.getSessionById(sessionId);
      const d = res?.data ?? res;
      if (!d) return false;
      const norm = (s: any) => String(s ?? '').toLowerCase();
      if (bookingId) {
        const matched = (d.bookings || []).find((b: any) => b._id === bookingId || b.id === bookingId);
        if (matched) return OVER_STATUSES.includes(norm(matched.status));
      }
      return OVER_STATUSES.includes(norm(d.status));
    } catch {
      return false; // if the check fails, let the rejoin attempt decide
    }
  }, [sessionId, bookingId]);

  const markEndedRemotely = useCallback(() => {
    if (phaseRef.current === 'ended') return;
    if (joinedAtRef.current) setFinalElapsed((Date.now() - joinedAtRef.current) / 1000);
    setEndedByMe(false);
    goPhase('ended');
  }, [goPhase]);

  const rejoin = useCallback(async (): Promise<'joined' | 'ended' | 'failed' | 'busy'> => {
    if (rejoinBusyRef.current) return 'busy';
    rejoinBusyRef.current = true;
    try {
      if (await isSessionOver()) {
        markEndedRemotely();
        return 'ended';
      }
      try {
        initializeSocket(); // reconnects a socket that already gave up
      } catch {
        return 'failed';
      }
      leaveRoom(); // clear stale stream / peer connections
      const ok = await joinRoom(prefsRef.current.cam, prefsRef.current.mic);
      if (ok) {
        notifyJoin();
        return 'joined';
      }
      if (await isSessionOver()) {
        markEndedRemotely();
        return 'ended';
      }
      return 'failed';
    } finally {
      rejoinBusyRef.current = false;
    }
  }, [isSessionOver, markEndedRemotely, leaveRoom, joinRoom, notifyJoin]);
  const rejoinRef = useRef(rejoin);
  rejoinRef.current = rejoin;

  const handleRejoinClick = useCallback(async () => {
    setJoining(true);
    setJoinError(null);
    const r = await rejoinRef.current();
    setJoining(false);
    if (r === 'joined') {
      setNow(Date.now());
      goPhase('live');
    } else if (r === 'failed') {
      setJoinError('Could not rejoin. Check your connection and try again.');
    }
  }, [goPhase]);

  // ── leave / end ──
  const handleLeave = useCallback(() => {
    if (dropTimerRef.current) {
      clearTimeout(dropTimerRef.current);
      dropTimerRef.current = null;
    }
    reconnectingRef.current = false;
    setReconnecting(false);
    setMenuOpen(false);
    setReactionsOpen(false);
    leaveRoom();
    goPhase('left');
    // Mentor left while the session is still running: go to the dashboard overview,
    // where the live session is listed with a Rejoin button.
    if (isMentor) onMentorLeft?.();
  }, [leaveRoom, goPhase, isMentor, onMentorLeft]);

  const handleEndSession = useCallback(async () => {
    setEnding(true);
    setEndError(null);
    try {
      await SessionService.completeSession(sessionId, { bookingId, wasSuccessful: true });
      if (joinedAtRef.current) setFinalElapsed((Date.now() - joinedAtRef.current) / 1000);
      leaveRoom();
      setEndedByMe(true);
      setShowEndConfirm(false);
      goPhase('ended');
    } catch (err: any) {
      setEndError(err?.message || 'Failed to end the session. Please try again.');
    } finally {
      setEnding(false);
    }
  }, [sessionId, bookingId, leaveRoom, goPhase]);

  // Session ended by someone else (socket event handled inside useLiveRoom)
  useEffect(() => {
    if (!roomEnded || phaseRef.current === 'ended') return;
    if (joinedAtRef.current) setFinalElapsed((Date.now() - joinedAtRef.current) / 1000);
    setEndedByMe(!!roomEnded.endedBy && roomEnded.endedBy === userId);
    goPhase('ended');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomEnded]);

  // Network drop -> "Reconnecting..." banner -> auto rejoin, or "dropped" screen
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const clearDropTimer = () => {
      if (dropTimerRef.current) {
        clearTimeout(dropTimerRef.current);
        dropTimerRef.current = null;
      }
    };

    const markDropped = () => {
      clearDropTimer();
      if (!reconnectingRef.current) return;
      reconnectingRef.current = false;
      setReconnecting(false);
      leaveRoom();
      goPhase('dropped');
    };

    const onDisconnect = (reason: string) => {
      if (reason === 'io client disconnect') return; // we did it ourselves
      if (phaseRef.current !== 'live') return;
      reconnectingRef.current = true;
      setReconnecting(true);
      if (reason === 'io server disconnect') socket.connect();
      clearDropTimer();
      dropTimerRef.current = setTimeout(markDropped, RECONNECT_GRACE_MS);
    };

    const onConnect = async () => {
      if (!reconnectingRef.current) return;
      clearDropTimer();
      const r = await rejoinRef.current();
      reconnectingRef.current = false;
      setReconnecting(false);
      if (r === 'failed') goPhase('dropped');
      // 'ended' -> ended screen already shown by markEndedRemotely
    };

    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);
    socket.io.on('reconnect_failed', markDropped);
    return () => {
      clearDropTimer();
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onConnect);
      socket.io.off('reconnect_failed', markDropped);
    };
  }, [leaveRoom, goPhase]);

  // ── reactions ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onReaction = (data: { sessionId: string; emoji: string }) => {
      if (data?.sessionId !== sessionId) return;
      const id = ++reactionIdRef.current;
      setFloating((prev) => [...prev, { id, emoji: data.emoji, self: false }]);
      setTimeout(() => setFloating((prev) => prev.filter((r) => r.id !== id)), 2200);
    };
    socket.on('mentorship:reaction-received', onReaction);
    return () => {
      socket.off('mentorship:reaction-received', onReaction);
    };
  }, [sessionId]);

  const sendReaction = (emoji: string) => {
    getSocket()?.emit('mentorship:send-reaction', { sessionId, emoji });
    const id = ++reactionIdRef.current;
    setFloating((prev) => [...prev, { id, emoji, self: true }]);
    setTimeout(() => setFloating((prev) => prev.filter((r) => r.id !== id)), 2200);
    setReactionsOpen(false);
  };

  // ── ringback while waiting for the other person (max 45s) ──
  const { start: startRing, stop: stopRing } = useRingtone({ volume: 0.5 });
  const waitingForPeer = phase === 'live' && !!localStream && !peer && !isConnecting && !reconnecting;
  useEffect(() => {
    if (!waitingForPeer) {
      stopRing();
      return;
    }
    startRing('outgoing');
    const t = setTimeout(stopRing, 45000);
    return () => {
      clearTimeout(t);
      stopRing();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingForPeer]);

  // ── keyboard shortcuts: M = mic, V = camera ──
  useEffect(() => {
    if (phase !== 'live') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.key === 'm' || e.key === 'M') toggleMic();
      if (e.key === 'v' || e.key === 'V') toggleCamera();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, toggleMic, toggleCamera]);

  // ── close popovers on outside click ──
  useEffect(() => {
    if (!menuOpen && !reactionsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (controlsRef.current && !controlsRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setReactionsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen, reactionsOpen]);

  // ── mentee: 5s countdown -> Reviews & Feedback ──
  const showMenteeRedirect = phase === 'ended' && !isMentor;
  useEffect(() => {
    if (!showMenteeRedirect || redirectCancelled) return;
    setCountdown(REVIEW_REDIRECT_SECONDS);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [showMenteeRedirect, redirectCancelled]);

  useEffect(() => {
    if (showMenteeRedirect && !redirectCancelled && countdown === 0 && !redirectedRef.current) {
      redirectedRef.current = true;
      onGoToReview();
    }
  }, [showMenteeRedirect, redirectCancelled, countdown, onGoToReview]);

  const goToReviewNow = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    onGoToReview();
  };

  // ── derived ──
  const statusBadge = useMemo(() => {
    if (reconnecting) return { label: 'Reconnecting', color: T.warn };
    if (peer) return { label: 'Live', color: T.success };
    return { label: 'Waiting', color: T.warn };
  }, [reconnecting, peer]);

  const remoteName = peer?.userName || (isMentor ? 'Mentee' : 'Mentor');
  const otherLabel = isMentor ? 'the mentee' : 'the mentor';

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: T.bg, color: T.text, fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* ───── LOBBY ───── */}
      {phase === 'lobby' && (
        <Lobby
          title={sessionTitle}
          userName={displayName}
          joining={joining || isConnecting}
          error={joinError || liveRoomError}
          onJoin={(cam, mic) => void doJoin(cam, mic)}
          onCancel={onExit}
          heading="Ready to join?"
          subheading="Check your camera and microphone, then join the session."
          joinLabel="Join now"
        />
      )}

      {/* ───── LEFT / DROPPED ───── */}
      {(phase === 'left' || phase === 'dropped') && (
        <StatusCard
          tone={phase === 'dropped' ? 'warn' : 'neutral'}
          icon={phase === 'dropped' ? <WifiOff className="h-7 w-7" /> : <PhoneOff className="h-7 w-7" />}
          title={phase === 'dropped' ? 'Connection lost' : 'You left the session'}
          text={
            phase === 'dropped'
              ? 'Your connection dropped. You can jump back into the same room.'
              : isMentor
                ? 'The session is still running for the mentee. Rejoin when you are ready, or end it for everyone.'
                : 'The session is still running. Left by mistake? You can jump back in.'
          }
        >
          {(joinError || liveRoomError) && (
            <p className="mt-4 text-sm" style={{ color: '#f0a08c' }}>
              {joinError || liveRoomError}
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => void handleRejoinClick()}
              disabled={joining}
              className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: T.accent, color: T.accentInk }}
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              {joining ? 'Rejoining...' : 'Rejoin session'}
            </button>
            {isMentor && (
              <button
                onClick={() => setShowEndConfirm(true)}
                disabled={joining}
                className="rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-60"
                style={{ background: T.dangerSoft, color: '#f0a08c' }}
              >
                End session for everyone
              </button>
            )}
            <button
              onClick={onExit}
              disabled={joining}
              className="rounded-full px-6 py-3 text-sm font-medium disabled:opacity-60"
              style={{ border: `1px solid ${T.border}`, color: T.text }}
            >
              {isMentor ? 'Back to bookings' : 'Back to my sessions'}
            </button>
          </div>
        </StatusCard>
      )}

      {/* ───── ENDED ───── */}
      {phase === 'ended' && (
        <StatusCard
          tone="success"
          icon={<CheckCircle2 className="h-8 w-8" />}
          title="Session ended"
          text={
            isMentor
              ? endedByMe
                ? 'You ended the session for everyone. It is now marked as completed.'
                : 'This session has ended.'
              : 'The mentor has ended this session. Thanks for joining!'
          }
        >
          {finalElapsed > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs" style={{ color: T.muted }}>
              <Clock className="h-3.5 w-3.5" /> Call duration {formatClock(finalElapsed)}
            </p>
          )}

          {isMentor ? (
            <button
              onClick={onExit}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: T.accent, color: T.accentInk }}
            >
              <ArrowLeft className="h-4 w-4" /> Back to bookings
            </button>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              <p className="text-sm" style={{ color: T.text }}>
                {redirectCancelled
                  ? 'How was your session? Your feedback helps other mentees.'
                  : `Taking you to Reviews & Feedback in ${countdown}s...`}
              </p>
              <button
                onClick={goToReviewNow}
                className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: T.accent, color: T.accentInk }}
              >
                <Star className="h-4 w-4" /> Give feedback now
              </button>
              {!redirectCancelled && (
                <button
                  onClick={() => setRedirectCancelled(true)}
                  className="rounded-full px-6 py-3 text-sm font-medium"
                  style={{ border: `1px solid ${T.border}`, color: T.text }}
                >
                  Stay on this page
                </button>
              )}
              {redirectCancelled && (
                <button
                  onClick={onExit}
                  className="rounded-full px-6 py-3 text-sm font-medium"
                  style={{ border: `1px solid ${T.border}`, color: T.text }}
                >
                  Back to my sessions
                </button>
              )}
            </div>
          )}
        </StatusCard>
      )}

      {/* ───── LIVE ───── */}
      {phase === 'live' && (
        <>
          {/* Top bar */}
          <header className="flex h-14 flex-shrink-0 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="inline-flex flex-shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: T.btn }}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                    style={{ background: statusBadge.color }}
                  />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: statusBadge.color }} />
                </span>
                {statusBadge.label}
              </span>
              <h1 className="truncate text-sm font-semibold sm:text-base">{sessionTitle || 'Mentorship session'}</h1>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2 text-xs sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono" style={{ background: T.btn }}>
                <Clock className="h-3.5 w-3.5" /> {formatClock(elapsed)}
              </span>
              {remainingMs !== null && (
                <span
                  className="hidden rounded-full px-3 py-1 sm:inline-block"
                  style={{ background: T.btn, color: remainingMs <= 0 ? T.warn : T.muted }}
                >
                  {remainingMs <= 0 ? 'Scheduled time is over' : `${Math.ceil(remainingMs / 60000)} min left`}
                </span>
              )}
              <span className="hidden items-center gap-1.5 rounded-full px-3 py-1 sm:inline-flex" style={{ background: T.btn }}>
                <Users className="h-3.5 w-3.5" /> {peer ? 2 : 1}
              </span>
            </div>
          </header>

          {/* Stage + side panel */}
          <div className="relative flex min-h-0 flex-1 gap-3 px-3 pb-3 sm:px-4">
            <div className="relative min-w-0 flex-1">
              {/* main tile */}
              <div className="h-full w-full">
                {peer ? (
                  <VideoSurface
                    stream={peer.stream}
                    showVideo={!!peer.stream && peer.cameraOn !== false}
                    name={remoteName}
                    nameLabel={remoteName}
                    speaking={peer.isSpeaking}
                    micOff={peer.micOn === false}
                    avatarSize={140}
                    radius={20}
                  />
                ) : (
                  <VideoSurface
                    stream={localStream}
                    showVideo={isCameraOn && !!localStream}
                    muted
                    mirror
                    name={displayName}
                    nameLabel={`${displayName} (You)`}
                    micOff={!isMicOn}
                    avatarSize={140}
                    radius={20}
                  />
                )}
              </div>

              {/* waiting card */}
              {!peer && (
                <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center px-4">
                  <div
                    className="flex items-center gap-2.5 rounded-full px-4 py-2 text-sm"
                    style={{ background: 'rgba(23,18,14,0.82)', border: `1px solid ${T.border}` }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: T.accent }} />
                    {isConnecting ? 'Connecting...' : `Waiting for ${otherLabel} to join...`}
                  </div>
                </div>
              )}

              {/* self view when someone else is on the main tile */}
              {peer && (
                <div
                  className="absolute bottom-4 right-4 aspect-video w-32 overflow-hidden sm:w-52"
                  style={{ borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.45)' }}
                >
                  <VideoSurface
                    stream={localStream}
                    showVideo={isCameraOn && !!localStream}
                    muted
                    mirror
                    name={displayName}
                    nameLabel="You"
                    micOff={!isMicOn}
                    avatarSize={44}
                    radius={14}
                  />
                </div>
              )}

              {/* floating reactions */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px]">
                {floating.map((r) => (
                  <span
                    key={r.id}
                    className="call-floating-reaction absolute text-4xl"
                    style={{ bottom: 70, left: r.self ? '30%' : '62%' }}
                  >
                    {r.emoji}
                  </span>
                ))}
              </div>

              {/* reconnecting / error banners */}
              {reconnecting && (
                <div
                  className="absolute inset-x-4 top-4 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
                  style={{ background: 'rgba(224,164,88,0.95)', color: '#2b1d0a' }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" /> Connection lost, reconnecting...
                </div>
              )}
              {!reconnecting && liveRoomError && (
                <div
                  className="absolute inset-x-4 top-4 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                  style={{ background: T.dangerSoft, color: '#f0a08c', border: `1px solid ${T.border}` }}
                >
                  <AlertTriangle className="h-4 w-4" /> {liveRoomError}
                </div>
              )}
            </div>

            {/* side panel */}
            {panelOpen && (
              <aside
                className="fixed inset-y-0 right-0 z-30 flex w-full max-w-[360px] flex-shrink-0 flex-col p-4 md:static md:z-auto md:w-[340px] md:max-w-none md:rounded-2xl"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Session activity</h2>
                  <button
                    onClick={() => setPanelOpen(false)}
                    aria-label="Close panel"
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: T.btn }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="min-h-0 flex-1">
                  <MentorSessionPanels role={isMentor ? 'mentor' : 'mentee'} />
                </div>
              </aside>
            )}
          </div>

          {/* Control bar */}
          <footer className="flex flex-shrink-0 items-center justify-center px-3 pb-5 pt-1">
            <div
              ref={controlsRef}
              className="relative flex items-center gap-2.5 rounded-full px-3 py-2.5 sm:gap-3 sm:px-4"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <RoundButton
                onClick={() => void toggleMic()}
                title={isMicOn ? 'Turn off microphone (M)' : 'Turn on microphone (M)'}
                danger={!isMicOn}
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </RoundButton>
              <RoundButton
                onClick={() => void toggleCamera()}
                title={isCameraOn ? 'Turn off camera (V)' : 'Turn on camera (V)'}
                danger={!isCameraOn}
              >
                {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </RoundButton>
              <RoundButton
                onClick={() => void toggleScreenShare()}
                title={isScreenSharing ? 'Stop presenting' : 'Present your screen'}
                active={isScreenSharing}
              >
                {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
              </RoundButton>

              <div className="relative">
                <RoundButton
                  onClick={() => {
                    setReactionsOpen((v) => !v);
                    setMenuOpen(false);
                  }}
                  title="Send a reaction"
                  active={reactionsOpen}
                >
                  <Smile className="h-5 w-5" />
                </RoundButton>
                {reactionsOpen && (
                  <div
                    className="absolute bottom-16 left-1/2 flex -translate-x-1/2 gap-1 rounded-full px-2 py-1.5"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                  >
                    {REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => sendReaction(emoji)}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-xl transition-transform hover:scale-125"
                        aria-label={`Send ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <RoundButton
                onClick={() => setPanelOpen((v) => !v)}
                title={panelOpen ? 'Hide session activity' : 'Show session activity'}
                active={panelOpen}
              >
                <PanelRight className="h-5 w-5" />
              </RoundButton>

              <div className="mx-1 h-8 w-px" style={{ background: T.border }} />

              {/* Leave (keeps the session running) */}
              <button
                type="button"
                onClick={handleLeave}
                title="Leave call (session keeps running)"
                aria-label="Leave call"
                className="flex h-12 items-center justify-center gap-2 rounded-full px-6 transition-opacity hover:opacity-90"
                style={{ background: T.danger, color: '#fff' }}
              >
                <PhoneOff className="h-5 w-5" />
                <span className="hidden text-sm font-semibold sm:inline">Leave</span>
              </button>

              {/* Overflow: End for everyone (mentor only) */}
              {isMentor && (
                <div className="relative">
                  <RoundButton
                    onClick={() => {
                      setMenuOpen((v) => !v);
                      setReactionsOpen(false);
                    }}
                    title="More options"
                    active={menuOpen}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </RoundButton>
                  {menuOpen && (
                    <div
                      className="absolute bottom-16 right-0 w-64 rounded-2xl p-1.5"
                      style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                    >
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setEndError(null);
                          setShowEndConfirm(true);
                        }}
                        className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                      >
                        <PhoneOff className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#f0a08c' }} />
                        <span>
                          <span className="block text-sm font-semibold" style={{ color: '#f0a08c' }}>
                            End session for everyone
                          </span>
                          <span className="block text-xs" style={{ color: T.muted }}>
                            Completes the session and closes the call for all participants.
                          </span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </footer>
        </>
      )}

      {/* ───── END CONFIRM DIALOG ───── */}
      {showEndConfirm && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="End session for everyone"
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: T.dangerSoft, color: '#f0a08c' }}
            >
              <PhoneOff className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">End session for everyone?</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: T.muted }}>
              This marks the session as completed and removes everyone from the call. It cannot be undone. The mentee
              will be asked for a review. If you only want to step out, use Leave instead.
            </p>
            {endError && (
              <p className="mt-3 rounded-lg px-3 py-2 text-sm" style={{ background: T.dangerSoft, color: '#f0a08c' }}>
                {endError}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                disabled={ending}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-60"
                style={{ border: `1px solid ${T.border}`, color: T.text }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleEndSession()}
                disabled={ending}
                className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                style={{ background: T.danger, color: '#fff' }}
              >
                {ending && <Loader2 className="h-4 w-4 animate-spin" />}
                {ending ? 'Ending...' : 'End session'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes callFloatUp {
          0%   { transform: translateY(0) scale(0.6); opacity: 0; }
          15%  { transform: translateY(-10px) scale(1.1); opacity: 1; }
          100% { transform: translateY(-180px) scale(1); opacity: 0; }
        }
        .call-floating-reaction { animation: callFloatUp 2.2s ease-out forwards; }
      `}</style>
    </div>
  );
}