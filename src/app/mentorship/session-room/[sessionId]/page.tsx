'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useLiveRoom } from '@/core/webrtc/useLiveRoom';
import {
  Maximize2,
  Minimize2,
  LayoutGrid,
  UserSquare2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
} from 'lucide-react';

import { getSocket, initializeSocket } from '@/core/realtime/socket.client';
import SessionService from '@/lib/api/session.service';
import MentorService from '@/lib/api/mentorship.service';
import SeniorSessionService from '@/lib/api/seniorSession.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { routes } from '@/config/routes';

type CallStatus = 'active' | 'reconnecting' | 'left' | 'dropped';
type LayoutMode = 'speaker' | 'grid';

// Reconnect grace period: 2 minutes before marking participant as dropped
const RECONNECT_GRACE_MS = 120000;

// ─── helpers ──────────────────────────────────────────────────────────────────
function initialsOf(name: string) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return ((parts[0][0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

// ─── VideoTile ────────────────────────────────────────────────────────────────
// Keeps the <video> element mounted (just invisible) when cam is off, so
// remote audio keeps playing without interruption.
function VideoTile({
  stream,
  showVideo,
  muted,
  mirror,
  label,
  avatarName,
  radius = 8,
  avatarSize = 80,
}: {
  stream: MediaStream | null | undefined;
  showVideo: boolean;
  muted?: boolean;
  mirror?: boolean;
  label: string;
  avatarName: string;
  radius?: number;
  avatarSize?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach stream via ref — no re-mount when layouts change
  useEffect(() => {
    const el = videoRef.current;
    if (el && el.srcObject !== stream) el.srcObject = stream ?? null;
  }, [stream]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: radius,
        backgroundColor: '#1c1c1c',
        overflow: 'hidden',
      }}
    >
      {/* Always mounted; invisible (not removed) when cam is off — preserves remote audio */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transform: mirror ? 'scaleX(-1)' : undefined,
          visibility: showVideo ? 'visible' : 'hidden',
        }}
      />
      {/* Avatar fallback when cam is off */}
      {!showVideo && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7a5c3e, #c9a87c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: avatarSize * 0.36,
              fontWeight: 600,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {initialsOf(avatarName)}
          </div>
        </div>
      )}
      {/* Name badge */}
      <span
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          borderRadius: 6,
          backgroundColor: 'rgba(0,0,0,0.55)',
          padding: '2px 8px',
          fontSize: 12,
          color: '#fff',
          maxWidth: '80%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Icon control button ───────────────────────────────────────────────────────
function CtrlBtn({
  onClick,
  title,
  danger,
  active,
  children,
}: {
  onClick: () => void;
  title: string;
  danger?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const bg = danger
    ? '#b91c1c'
    : active
      ? '#7a5c3e'
      : hover
        ? 'rgba(255,255,255,0.18)'
        : 'rgba(255,255,255,0.10)';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: 'none',
        background: bg,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.15s',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ─── localStorage helpers (wrapped in try/catch for private-browsing safety) ──
function readStoredLayout(): LayoutMode {
  try {
    const v = localStorage.getItem('sr_layoutMode');
    if (v === 'grid' || v === 'speaker') return v;
  } catch { }
  return 'speaker'; // new default: speaker view
}

function storeLayout(mode: LayoutMode) {
  try {
    localStorage.setItem('sr_layoutMode', mode);
  } catch { }
}


function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function SessionRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;
  const bookingId = searchParams?.get('bookingId') || searchParams?.get('roomId') || '';
  const roomId = bookingId || sessionId;

  const { user } = useAuth();
  const currentUserId = (user as any)?.id || (user as any)?.userId || '';
  const currentUserName =
    `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || 'User';

  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [peerNotified, setPeerNotified] = useState(false);
  const hasJoinedRef = useRef(false);

  const [callStatus, setCallStatus] = useState<CallStatus>('active');
  const callStatusRef = useRef<CallStatus>('active');
  const [endedByCheck, setEndedByCheck] = useState(false);
  const [isRejoining, setIsRejoining] = useState(false);
  const [rejoinError, setRejoinError] = useState<string | null>(null);
  const rejoinInFlightRef = useRef(false);


  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [presenceToast, setPresenceToast] = useState<string | null>(null);

  const [sessionKind, setSessionKind] = useState<'one-on-one' | 'group' | 'senior'>('one-on-one');
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [redirectCancelled, setRedirectCancelled] = useState(false);
  const redirectedRef = useRef(false);

  // ── Layout state ─────────────────────────────────────────────────────────
  // Lazily initialised from localStorage (client-only) to avoid SSR mismatch
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('speaker');
  const [layoutReady, setLayoutReady] = useState(false);
  // true = local stream on main stage, remote in PiP (click-to-swap)
  const [pipSwapped, setPipSwapped] = useState(false);

  // Fullscreen
  const stageRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Only the mentee of a 1:1 session can review it.
  const isMentee = (() => {
    if (!sessionData || !currentUserId || sessionData.booking || sessionKind !== 'one-on-one') return false;
    const uid = String(currentUserId);
    const inBookings = (sessionData.bookings || []).some(
      (b: any) => String(b.menteeId || b.bookedBy || '') === uid
    );
    if (inBookings || String(sessionData.menteeId || '') === uid) return true;
    const rawMentor = sessionData.mentorId;
    const mentorUid =
      rawMentor && typeof rawMentor === 'object'
        ? String(rawMentor._id || rawMentor.userId || '')
        : String(rawMentor || '');
    // mentor id known and it is not me -> I am the mentee
    return !!mentorUid && mentorUid !== uid;
  })();

  const dropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRejoinRef = useRef<() => Promise<'joined' | 'ended' | 'failed' | 'busy'>>(
    async () => 'failed'
  );

  // ✅ NEW: floating emoji reactions during the live call
  const [floatingReactions, setFloatingReactions] = useState<
    { id: number; emoji: string; fromSelf: boolean }[]
  >([]);
  const reactionIdRef = useRef(0);

  const {
    localStream,
    peers,
    isCameraOn,
    isMicOn,
    isConnecting,
    error: liveRoomError,
    roomEnded,
    joinRoom,

    leaveRoom,
    toggleCamera,
    toggleMic,

  } = useLiveRoom({
    roomId,
    sessionId,
    userId: currentUserId,

    userName: currentUserName,
  });

  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async () => {
      try {
        setLoading(true);

        // ✅ FIX: this room hosts BOTH 1:1 sessions AND group sessions
        // (group sessions route here from BookingsPage's "Start" flow).
        // Group sessions live in a different collection/endpoint
        // (/mentorship/group-sessions/:id) than 1:1 sessions
        // (/mentorship/sessions/:id). Previously this always called the
        // 1:1 endpoint, which 404'd for a group sessionId
        // ("Session not found") and silently killed the whole page —
        // mentor never actually joined the live room, so mentees never
        // saw them connect either.
        //
        // Try the 1:1 endpoint first (most common case), and only fall
        // back to the group-session endpoint on a 404 — avoids needing a
        // query param / route change for existing 1:1 links.
        let normalized: any;
        try {
          const res = await SessionService.getSessionById(sessionId, 'join');
          normalized = res?.data ?? res;
        } catch (oneOnOneErr: any) {
          const msg = (oneOnOneErr?.message || '').toLowerCase();
          if (msg.includes('has ended') || msg.includes('no longer active')) {
            const endedRes = await SessionService.getSessionById(sessionId);
            normalized = endedRes?.data ?? endedRes;
            setEndedByCheck(true);
            setSessionData(normalized);
            return;
          }
          if (
            msg.includes('not started yet') ||
            msg.includes('too early') ||
            msg.includes('expired')
          ) {
            throw oneOnOneErr;
          }
          console.warn('[SessionRoom] 1:1 session fetch failed, trying group session:', oneOnOneErr.message);
          try {
            const groupRes = await MentorService.getGroupSessionById(sessionId);
            normalized = groupRes?.data ?? groupRes;
            setSessionKind('group');
          } catch (groupErr: any) {
            console.warn('[SessionRoom] Group session fetch failed, trying senior session:', groupErr.message);
            setSessionKind('senior');
            const seniorRes = await SeniorSessionService.getSessionById(sessionId);
            const seniorData = seniorRes?.data ?? seniorRes;
            const matchedBooking = (seniorData.bookings || []).find(
              (b: any) => b._id === bookingId || b.id === bookingId
            );
            normalized = {
              ...seniorData,
              status: matchedBooking?.status || seniorData.status,
              scheduledAt: matchedBooking?.scheduledAt || seniorData.scheduledAt,
              slotTime: matchedBooking?.slotTime || seniorData.slotTime,
              booking: matchedBooking,
            };
          }
        }

        console.log('[SessionRoom] normalized sessionData:', normalized);
        setSessionData(normalized);
      } catch (err: any) {
        console.error('[SessionRoom] fetch error (both 1:1 and group):', err);
        setLoadError(err.message || 'Failed to load session.');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId, bookingId]);

  useEffect(() => {
    if (sessionData && currentUserId && !endedByCheck && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      joinRoom(true, true).then((ok) => {
        if (!ok) return; // permission/socket fail → "joined" notification mat bhejo
        const socket = getSocket();
        socket?.emit('mentorship:notify-join', { sessionId });
        setPeerNotified(true);
      });
    }
  }, [sessionData, currentUserId, endedByCheck, joinRoom, sessionId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handlePeerJoined = (data: { sessionId: string; joinerRole?: string; isRejoin?: boolean }) => {
      if (data.sessionId === sessionId) {
        console.log('[SessionRoom] peer joined:', data);
        if (data.isRejoin) {
          setPresenceToast(`${isMentee ? 'Mentor' : 'Participant'} rejoined the session`);
          setTimeout(() => setPresenceToast(null), 4000);
        }
      }
    };

    const handleUserJoinedRoom = (data: { userId: string; userName?: string; isRejoin?: boolean }) => {
      if (!data?.userId || data.userId === currentUserId) return;
      if (data.isRejoin) {
        setPresenceToast(`${data.userName || (isMentee ? 'Mentor' : 'Participant')} rejoined the session`);
        setTimeout(() => setPresenceToast(null), 4000);
      }
    };

    const handleUserLeftRoom = (data: { userId: string; userName?: string }) => {
      if (!data?.userId || data.userId === currentUserId) return;
      setPresenceToast(`${data.userName || (isMentee ? 'Mentor' : 'Participant')} left the session`);
      setTimeout(() => setPresenceToast(null), 4000);
    };

    const handleReactionReceived = (data: { sessionId: string; emoji: string; fromUserId: string }) => {
      if (data.sessionId !== sessionId) return;
      const id = ++reactionIdRef.current;
      setFloatingReactions((prev) => [...prev, { id, emoji: data.emoji, fromSelf: false }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2200);
    };

    socket.on('mentorship:peer-joined', handlePeerJoined);
    socket.on('user-joined-room', handleUserJoinedRoom);
    socket.on('user-left-room', handleUserLeftRoom);
    socket.on('mentorship:reaction-received', handleReactionReceived);
    return () => {
      socket.off('mentorship:peer-joined', handlePeerJoined);
      socket.off('user-joined-room', handleUserJoinedRoom);
      socket.off('user-left-room', handleUserLeftRoom);
      socket.off('mentorship:reaction-received', handleReactionReceived);
    };
  }, [sessionId, currentUserId, isMentee]);

  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  const updateCallStatus = useCallback((next: CallStatus) => {
    callStatusRef.current = next;
    setCallStatus(next);
  }, []);

  // End Call confirms before leave so participant knows they can rejoin
  const confirmLeave = useCallback(() => {
    setShowLeaveConfirm(false);
    if (dropTimerRef.current) {
      clearTimeout(dropTimerRef.current);
      dropTimerRef.current = null;
    }
    leaveRoom();
    updateCallStatus('left');
  }, [leaveRoom, updateCallStatus]);

  const handleEndCall = useCallback(() => {
    setShowLeaveConfirm(true);
  }, []);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const goToReviews = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    // ?review=<sessionId> makes the Reviews page open this session's feedback form
    router.replace(
      `${routes.menteeDashboard(currentUserId)}?tab=reviews&review=${encodeURIComponent(sessionId)}`
    );
  }, [router, currentUserId, sessionId]);

  // Mentee: once the session has ended, auto-redirect to Reviews & Feedback after 5s
  const shouldAutoRedirect = (!!roomEnded || endedByCheck) && isMentee && !redirectCancelled;

    // Mentor ne End kiya -> mentee ko turant review form par bhejo
    useEffect(() => {
      if (!shouldAutoRedirect) return;
      goToReviews();
    }, [shouldAutoRedirect, goToReviews]);

  useEffect(() => {
    if (shouldAutoRedirect && redirectCountdown === 0) goToReviews();
  }, [shouldAutoRedirect, redirectCountdown, goToReviews]);



  // Rejoin se pehle: session sach me khatam to nahi ho gayi? (socket event miss ho sakta hai)
  const checkIfSessionOver = useCallback(async (): Promise<boolean> => {
    try {
      let data: any;
      try {
        const res = await SessionService.getSessionById(sessionId);
        data = res?.data ?? res;
      } catch {
        try {
          const groupRes = await MentorService.getGroupSessionById(sessionId);
          data = groupRes?.data ?? groupRes;
        } catch {
          const seniorRes = await SeniorSessionService.getSessionById(sessionId);
          data = seniorRes?.data ?? seniorRes;
        }
      }
      if (!data) return false;

      const OVER = ['completed', 'cancelled', 'no_show', 'refunded'];
      const norm = (s: any) => String(s ?? '').toLowerCase();

      if (bookingId) {
        const matched = (data.bookings || []).find(
          (b: any) => b._id === bookingId || b.id === bookingId
        );
        if (matched) {
          return OVER.includes(norm(matched.status));
        }
      }

      if (OVER.includes(norm(data.status))) return true;
      const myBooking = (data.bookings || []).find(
        (b: any) => (b.menteeId || b.bookedBy) === currentUserId
      );
      return !!myBooking && OVER.includes(norm(myBooking.status));
    } catch {
      return false; // check fail ho to rejoin try hone do
    }
  }, [sessionId, currentUserId, bookingId]);

  const attemptRejoin = useCallback(async () => {
    if (rejoinInFlightRef.current) return 'busy' as const;
    rejoinInFlightRef.current = true;
    try {
      if (await checkIfSessionOver()) {
        setEndedByCheck(true);
        return 'ended' as const;
      }
      try {
        initializeSocket(); // socket give-up kar chuka ho to dobara connect karta hai
      } catch {
        return 'failed' as const;
      }
      leaveRoom(); // purani stream / stale PCs saaf
      const ok = await joinRoom(true, true);
      if (ok) return 'joined' as const;

      // Server ne join reject kiya: ho sakta hai session abhi khatam hui ho
      if (await checkIfSessionOver()) {
        setEndedByCheck(true);
        return 'ended' as const;
      }
      return 'failed' as const;
    } finally {
      rejoinInFlightRef.current = false;
    }
  }, [checkIfSessionOver, joinRoom, leaveRoom]);
  attemptRejoinRef.current = attemptRejoin;

  const handleRejoin = useCallback(async () => {
    setRejoinError(null);
    setIsRejoining(true);
    const result = await attemptRejoin();
    setIsRejoining(false);
    if (result === 'joined') {
      updateCallStatus('active');
    } else if (result === 'failed') {
      setRejoinError('Could not rejoin. Please check your connection and try again.');
    }
  }, [attemptRejoin, updateCallStatus]);

  // Network drop: pehle "Reconnecting…", recover na ho to "dropped" (Rejoin screen)
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
      if (callStatusRef.current !== 'reconnecting') return;
      leaveRoom();
      updateCallStatus('dropped');
    };

    const onDisconnect = (reason: string) => {
      if (reason === 'io client disconnect') return; // hamne khud kiya
      if (callStatusRef.current !== 'active' || !hasJoinedRef.current) return;
      updateCallStatus('reconnecting');
      if (reason === 'io server disconnect') socket.connect(); // server ne kick kiya to manual connect
      clearDropTimer();
      dropTimerRef.current = setTimeout(markDropped, RECONNECT_GRACE_MS);
    };

    const onConnect = async () => {
      if (callStatusRef.current !== 'reconnecting') return;
      clearDropTimer();
      // naya socket id → server ke live room me nahi hain, clean re-join zaroori
      const result = await attemptRejoinRef.current();
      if (result === 'joined') updateCallStatus('active');
      else if (result === 'failed') updateCallStatus('dropped');
      // 'ended' → Session Ended screen apne aap priority le leti hai
    };

    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);
    socket.io.on('reconnect_failed', markDropped);
    return () => {
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onConnect);
      socket.io.off('reconnect_failed', markDropped);
    };
  }, [leaveRoom, updateCallStatus]);

  useEffect(() => {
    return () => {
      if (dropTimerRef.current) clearTimeout(dropTimerRef.current);
    };
  }, []);

  // ✅ NEW: emit a reaction to the other participant + show it locally
  const REACTIONS = ['👍', '❤️', '😂', '👏', '🎉'];
  const sendReaction = useCallback(
    (emoji: string) => {
      const socket = getSocket();
      socket?.emit('mentorship:send-reaction', { sessionId, emoji });

      const id = ++reactionIdRef.current;
      setFloatingReactions((prev) => [...prev, { id, emoji, fromSelf: true }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2200);
    },
    [sessionId]
  );

  // ── Layout: read from localStorage after mount (avoids SSR mismatch) ────────
  useEffect(() => {
    setLayoutMode(readStoredLayout());
    setLayoutReady(true);
  }, []);

  const toggleLayout = useCallback(() => {
    setLayoutMode((prev) => {
      const next: LayoutMode = prev === 'speaker' ? 'grid' : 'speaker';
      storeLayout(next);
      return next;
    });
    setPipSwapped(false);
  }, []);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && stageRef.current) {
      stageRef.current.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  }, []);

  // ── Resolved remote participant name ────────────────────────────────────
  const peer = peers[0] ?? null;
  const resolvedRemoteName = (() => {
    const sd = sessionData;
    if (!sd) return peer?.userName || 'Participant';
    const rawMentor = sd.mentorId;
    const mentorObj = rawMentor && typeof rawMentor === 'object' ? rawMentor : null;
    return (
      mentorObj?.fullName ||
      mentorObj?.name ||
      (mentorObj?.firstName
        ? `${mentorObj.firstName} ${mentorObj.lastName || ''}`.trim()
        : null) ||
      sd.mentorName ||
      sd.mentor?.fullName ||
      sd.mentor?.name ||
      (sd.mentor?.firstName
        ? `${sd.mentor.firstName} ${sd.mentor.lastName || ''}`.trim()
        : null) ||
      peer?.userName ||
      (isMentee ? 'Mentor' : 'Participant')
    );
  })();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6ede8' }}>
        <p style={{ color: '#4a3728' }}>Loading session...</p>
      </div>
    );
  }

  if (loadError || !sessionData) {
    return (
      <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#f6ede8' }}>
        <p style={{ color: '#dc2626' }}>{loadError || 'Session not found.'}</p>
        <button onClick={() => router.back()} style={{ borderRadius: 6, backgroundColor: '#4a3728', padding: '8px 16px', color: 'white', border: 'none' }}>
          Go Back
        </button>
      </div>
    );
  }

  // Priority: ended > left/dropped > normal call
  const sessionEnded = !!roomEnded || endedByCheck;

  if (sessionEnded) {
    return (
      <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#1a1a1a', color: 'white', padding: 24, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Session ended</h1>
        <p style={{ fontSize: 14, opacity: 0.8, maxWidth: 360, margin: 0 }}>
          {sessionData.title || 'This session'} has ended, so it can’t be rejoined.
        </p>
        {roomEnded?.endedAt && (
          <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Ended at {formatTime(roomEnded.endedAt)}</p>
        )}
        {isMentee && (
          <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
            {redirectCancelled
              ? 'How was your session? Your feedback helps other mentees.'
              : 'Taking you to Reviews & Feedback...'}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={isMentee ? goToReviews : handleGoBack}
            style={{ borderRadius: 9999, padding: '10px 24px', border: 'none', fontWeight: 600, color: 'white', backgroundColor: '#7a5c3e', cursor: 'pointer' }}
          >
            {isMentee ? 'Give feedback now' : 'Go Back'}
          </button>
          {isMentee && !redirectCancelled && (
            <button
              onClick={() => setRedirectCancelled(true)}
              style={{ borderRadius: 9999, padding: '10px 24px', border: '1px solid rgba(255,255,255,0.3)', color: 'white', backgroundColor: 'transparent', cursor: 'pointer' }}
            >
              Stay on this page
            </button>
          )}
        </div>
      </div>
    );
  }

  if (callStatus === 'left' || callStatus === 'dropped') {
    const isDropped = callStatus === 'dropped';
    return (
      <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#1a1a1a', color: 'white', padding: 24, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
          {isDropped ? 'Connection lost' : 'You left the session'}
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8, maxWidth: 360, margin: 0 }}>
          {isDropped
            ? 'Your connection dropped. You can jump back into the same room.'
            : 'Left by mistake? You can jump back into the same room.'}
        </p>
        {(liveRoomError || rejoinError) && (
          <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>{liveRoomError || rejoinError}</p>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={handleRejoin}
            disabled={isRejoining}
            style={{ borderRadius: 9999, padding: '10px 24px', border: 'none', fontWeight: 600, color: 'white', backgroundColor: '#7a5c3e', opacity: isRejoining ? 0.6 : 1, cursor: isRejoining ? 'not-allowed' : 'pointer' }}
          >
            {isRejoining ? 'Rejoining…' : 'Rejoin Session'}
          </button>
          <button
            onClick={handleGoBack}
            style={{ borderRadius: 9999, padding: '10px 24px', border: '1px solid rgba(255,255,255,0.3)', color: 'white', backgroundColor: 'transparent', cursor: 'pointer' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', backgroundColor: '#1a1a1a', color: 'white' }}>
      {callStatus === 'reconnecting' && (
        <div style={{ backgroundColor: '#b45309', padding: '6px 24px', textAlign: 'center', fontSize: 13, flexShrink: 0 }}>
          Connection lost — reconnecting…
        </div>
      )}
      {/* Header */}
      <div style={{ backgroundColor: '#4a3728', padding: '12px 24px', flexShrink: 0, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            {sessionData.title || 'Mentorship Session'}
          </h1>
          <span style={{ fontSize: 13, opacity: 0.85 }}>
            {peers.length > 0 ? 'Connected' : peerNotified ? 'Waiting — other person notified' : 'Waiting for other participant...'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 12, opacity: 0.8 }}>
          <span>{formatDate(sessionData.scheduledAt || sessionData.startTime)}</span>
          <span>{formatTime(sessionData.scheduledAt || sessionData.startTime)}</span>
          {sessionData.duration && <span>{sessionData.duration} min</span>}
          {sessionData.status && <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{sessionData.status}</span>}
        </div>
      </div>

      {presenceToast && (
        <div
          style={{
            position: 'absolute',
            top: 72,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(30,22,17,0.92)',
            border: '1px solid rgba(201,168,124,0.4)',
            color: '#fff',
            borderRadius: 9999,
            padding: '8px 22px',
            fontSize: 13,
            fontWeight: 500,
            zIndex: 60,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          {presenceToast}
        </div>
      )}

      {/* Video stage */}
      <div
        ref={stageRef}
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        {/* Floating reaction overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
          {floatingReactions.map((r) => (
            <span
              key={r.id}
              className="floating-reaction"
              style={{ position: 'absolute', bottom: 90, left: r.fromSelf ? '35%' : '60%', fontSize: 32 }}
            >
              {r.emoji}
            </span>
          ))}
        </div>

        {/* ─── SPEAKER VIEW ─── */}
        {(layoutMode === 'speaker' && layoutReady) && (
          <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
            {/* Main stage tile */}
            {peer ? (
              <VideoTile
                stream={pipSwapped ? localStream : peer.stream}
                showVideo={pipSwapped ? (isCameraOn && !!localStream) : (!!peer.stream && peer.cameraOn !== false)}
                muted={pipSwapped}
                mirror={pipSwapped}
                label={pipSwapped ? 'You' : resolvedRemoteName}
                avatarName={pipSwapped ? currentUserName : resolvedRemoteName}
                radius={0}
                avatarSize={140}
              />
            ) : (
              /* No peer yet — show local stream centred on stage */
              <VideoTile
                stream={localStream}
                showVideo={isCameraOn && !!localStream}
                muted
                mirror
                label={`${currentUserName} (You)`}
                avatarName={currentUserName}
                radius={0}
                avatarSize={140}
              />
            )}

            {/* Waiting badge */}
            {!peer && (
              <div style={{
                position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(23,18,14,0.82)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 9999, padding: '6px 16px', fontSize: 13, pointerEvents: 'none', whiteSpace: 'nowrap'
              }}>
                {peerNotified ? 'Other person notified — waiting for them to join…' : 'Waiting for the other person to join…'}
              </div>
            )}

            {/* Fullscreen button — top-right of stage */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 36, height: 36, borderRadius: '50%',
                border: 'none', background: 'rgba(0,0,0,0.45)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 5,
              }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* PiP self-view — click to swap */}
            {peer && (
              <div
                onClick={() => setPipSwapped((v) => !v)}
                title="Click to swap view"
                style={{
                  position: 'absolute', bottom: 16, right: 16,
                  width: 'clamp(100px, 18vw, 200px)', aspectRatio: '16/9',
                  borderRadius: 12, overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  cursor: 'pointer', zIndex: 20,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                }}
              >
                <VideoTile
                  stream={pipSwapped ? peer.stream : localStream}
                  showVideo={pipSwapped ? (!!peer.stream && peer.cameraOn !== false) : (isCameraOn && !!localStream)}
                  muted={!pipSwapped}
                  mirror={!pipSwapped}
                  label={pipSwapped ? resolvedRemoteName : 'You'}
                  avatarName={pipSwapped ? resolvedRemoteName : currentUserName}
                  radius={12}
                  avatarSize={44}
                />
              </div>
            )}
          </div>
        )}

        {/* ─── GRID VIEW ─── */}
        {(layoutMode === 'grid' || !layoutReady) && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', flex: 1,
            alignItems: 'center', justifyContent: 'center',
            gap: 16, padding: 16, overflowY: 'auto',
          }}>
            {/* Local tile */}
            <div style={{ position: 'relative', aspectRatio: '16/9', width: '100%', maxWidth: 480, borderRadius: 8, overflow: 'hidden' }}>
              <VideoTile
                stream={localStream}
                showVideo={isCameraOn && !!localStream}
                muted
                mirror
                label="You"
                avatarName={currentUserName}
                radius={8}
                avatarSize={80}
              />
            </div>

            {/* Remote / waiting tile */}
            {peers.length === 0 ? (
              <div style={{ display: 'flex', aspectRatio: '16/9', width: '100%', maxWidth: 480, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <p style={{ fontSize: 13, opacity: 0.7, textAlign: 'center', padding: '0 16px' }}>
                  {peerNotified ? 'Other person notified — waiting for them to join…' : 'Waiting for the other person to join…'}
                </p>
              </div>
            ) : (
              peers.map((p) => (
                <div key={p.socketId} style={{ position: 'relative', aspectRatio: '16/9', width: '100%', maxWidth: 480, borderRadius: 8, overflow: 'hidden' }}>
                  <VideoTile
                    stream={p.stream}
                    showVideo={!!p.stream && p.cameraOn !== false}
                    label={resolvedRemoteName}
                    avatarName={resolvedRemoteName}
                    radius={8}
                    avatarSize={80}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {liveRoomError && <p style={{ padding: '0 24px 8px', textAlign: 'center', fontSize: 13, color: '#f87171', flexShrink: 0 }}>{liveRoomError}</p>}
      {isConnecting && <p style={{ padding: '0 24px 8px', textAlign: 'center', fontSize: 13, opacity: 0.7, flexShrink: 0 }}>Connecting…</p>}

      {/* Reactions bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#1a1a1a', padding: '8px 0', flexShrink: 0 }}>
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            style={{ fontSize: 20, padding: '4px 10px', borderRadius: 9999, border: 'none', backgroundColor: 'rgba(255,255,255,0.08)', cursor: 'pointer' }}
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Control bar — icon-based */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#2a2a2a', padding: '14px 24px', flexShrink: 0 }}>
        {/* Mic */}
        <CtrlBtn onClick={toggleMic} title={isMicOn ? 'Mute microphone' : 'Unmute microphone'} danger={!isMicOn}>
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </CtrlBtn>

        {/* Camera */}
        <CtrlBtn onClick={toggleCamera} title={isCameraOn ? 'Turn off camera' : 'Turn on camera'} danger={!isCameraOn}>
          {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
        </CtrlBtn>

        {/* Layout toggle */}
        <CtrlBtn
          onClick={toggleLayout}
          title={layoutMode === 'speaker' ? 'Switch to grid view' : 'Switch to speaker view'}
        >
          {layoutMode === 'speaker' ? <LayoutGrid size={20} /> : <UserSquare2 size={20} />}
        </CtrlBtn>

        {/* Fullscreen */}
        <CtrlBtn onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </CtrlBtn>

        {/* Divider */}
        <div style={{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

        {/* End Call */}
        <button
          onClick={handleEndCall}
          title="Leave call"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            borderRadius: 9999, padding: '10px 20px',
            border: 'none', fontWeight: 600, color: 'white',
            backgroundColor: '#b91c1c', cursor: 'pointer',
          }}
        >
          <PhoneOff size={18} />
          <span>Leave</span>
        </button>
      </div>

      {/* Leave confirmation dialog */}
      {showLeaveConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#262626',
              borderRadius: 16,
              padding: 24,
              maxWidth: 380,
              width: '100%',
              border: '1px solid rgba(255,255,255,0.12)',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px 0', color: '#fff' }}>
              Leave session?
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              You can rejoin until the session ends.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                style={{
                  borderRadius: 9999,
                  padding: '10px 20px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Stay in Session
              </button>
              <button
                type="button"
                onClick={confirmLeave}
                style={{
                  borderRadius: 9999,
                  padding: '10px 20px',
                  border: 'none',
                  backgroundColor: '#b91c1c',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(0.6); opacity: 0; }
          15%  { transform: translateY(-10px) scale(1.1); opacity: 1; }
          100% { transform: translateY(-160px) scale(1); opacity: 0; }
        }
        .floating-reaction { animation: floatUp 2.2s ease-out forwards; }
      `}</style>
    </div>
  );
}