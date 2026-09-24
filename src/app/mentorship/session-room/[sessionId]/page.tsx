'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveRoom } from '@/core/webrtc/useLiveRoom';

import { getSocket, initializeSocket } from '@/core/realtime/socket.client';
import SessionService from '@/lib/api/session.service';
import MentorService from '@/lib/api/mentorship.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

type CallStatus = 'active' | 'reconnecting' | 'left' | 'dropped';
// socket.io khud ~5 attempts (~17s) karta hai; ye sirf safety ceiling hai
const RECONNECT_GRACE_MS = 30000;


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
  const router = useRouter();
  const sessionId = params?.sessionId as string;

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
  const dropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRejoinRef = useRef<() => Promise<'joined' | 'ended' | 'failed' | 'busy'>>(
    async () => 'failed'
  );

  // ✅ NEW: floating emoji reactions during the live call
  const [floatingReactions, setFloatingReactions] = useState <
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
    roomId: sessionId,
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
          const res = await SessionService.getSessionById(sessionId);
          normalized = res?.data ?? res;
        } catch (oneOnOneErr: any) {
          console.warn('[SessionRoom] 1:1 session fetch failed, trying group session:', oneOnOneErr.message);
          const groupRes = await MentorService.getGroupSessionById(sessionId);
          const groupSession = groupRes?.data ?? groupRes;
          // Normalize group session shape to what this page expects
          // (title, scheduledAt, duration, status already match).
          normalized = groupSession;
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
  }, [sessionId]);

  useEffect(() => {
    if (sessionData && currentUserId && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      joinRoom(true, true).then((ok) => {
        if (!ok) return; // permission/socket fail → "joined" notification mat bhejo
        const socket = getSocket();
        socket?.emit('mentorship:notify-join', { sessionId });
        setPeerNotified(true);
      });
    }
  }, [sessionData, currentUserId, joinRoom, sessionId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handlePeerJoined = (data: { sessionId: string; joinerRole: string }) => {
      if (data.sessionId === sessionId) {
        console.log('[SessionRoom] peer joined:', data);
      }
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
    socket.on('mentorship:reaction-received', handleReactionReceived);
    return () => {
      socket.off('mentorship:peer-joined', handlePeerJoined);
      socket.off('mentorship:reaction-received', handleReactionReceived);
    };
  }, [sessionId]);

  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  const updateCallStatus = useCallback((next: CallStatus) => {
    callStatusRef.current = next;
    setCallStatus(next);
  }, []);

  // End Call ab back navigate nahi karta — "You left" screen dikhata hai
  const handleEndCall = useCallback(() => {
    if (dropTimerRef.current) {
      clearTimeout(dropTimerRef.current);
      dropTimerRef.current = null;
    }
    leaveRoom();
    updateCallStatus('left');
  }, [leaveRoom, updateCallStatus]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  // Rejoin se pehle: session sach me khatam to nahi ho gayi? (socket event miss ho sakta hai)
  const checkIfSessionOver = useCallback(async (): Promise<boolean> => {
    try {
      let data: any;
      try {
        const res = await SessionService.getSessionById(sessionId);
        data = res?.data ?? res;
      } catch {
        const groupRes = await MentorService.getGroupSessionById(sessionId);
        data = groupRes?.data ?? groupRes;
      }
      if (!data) return false;

      const OVER = ['completed', 'cancelled', 'no_show', 'refunded'];
      const norm = (s: any) => String(s ?? '').toLowerCase();

      if (OVER.includes(norm(data.status))) return true;
      const myBooking = (data.bookings || []).find(
        (b: any) => (b.menteeId || b.bookedBy) === currentUserId
      );
      return !!myBooking && OVER.includes(norm(myBooking.status));
    } catch {
      return false; // check fail ho to rejoin try hone do
    }
  }, [sessionId, currentUserId]);

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

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6ede8' }}>
        <p style={{ color: '#4a3728' }}>Session load ho raha hai...</p>
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
         <button onClick={handleGoBack} style={{ marginTop: 8, borderRadius: 9999, padding: '10px 24px', border: 'none', fontWeight: 600, color: 'white', backgroundColor: '#4a3728', cursor: 'pointer' }}>
           Go Back
         </button>
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
      <div style={{ backgroundColor: '#4a3728', padding: '12px 24px', flexShrink: 0 }}>
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

          {/* Video grid */}
          <div style={{ position: 'relative', display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 }}>
        {/* Floating reaction overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
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

        <div style={{ position: 'relative', aspectRatio: '16/9', width: '100%', maxWidth: 480, borderRadius: 8, backgroundColor: 'black' }}>
          {localStream && (
            <video
              autoPlay
              muted
              playsInline
              ref={(el) => {
                if (el && el.srcObject !== localStream) el.srcObject = localStream;
              }}
              style={{ height: '100%', width: '100%', borderRadius: 8, objectFit: 'cover' }}
            />
          )}
          <span style={{ position: 'absolute', bottom: 8, left: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 8px', fontSize: 12 }}>
            You
          </span>
        </div>

        {peers.length === 0 && (
          <div style={{ display: 'flex', aspectRatio: '16/9', width: '100%', maxWidth: 480, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <p style={{ fontSize: 13, opacity: 0.7 }}>
              {peerNotified ? 'Other person has been notified — waiting for them to join…' : 'Waiting for the other person to join…'}
            </p>
          </div>
        )}

        {peers.map((peer) => (
          <div key={peer.socketId} style={{ position: 'relative', aspectRatio: '16/9', width: '100%', maxWidth: 480, borderRadius: 8, backgroundColor: 'black' }}>
            {peer.stream && (
              <video
                autoPlay
                playsInline
                ref={(el) => {
                  if (el && el.srcObject !== peer.stream) el.srcObject = peer.stream;
                }}
                style={{ height: '100%', width: '100%', borderRadius: 8, objectFit: 'cover' }}
              />
            )}
            <span style={{ position: 'absolute', bottom: 8, left: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 8px', fontSize: 12 }}>
              {peer.userName || 'Participant'}
            </span>
          </div>
        ))}
      </div>

      {liveRoomError && <p style={{ padding: '0 24px 8px', textAlign: 'center', fontSize: 13, color: '#f87171' }}>{liveRoomError}</p>}
      {isConnecting && <p style={{ padding: '0 24px 8px', textAlign: 'center', fontSize: 13, opacity: 0.7 }}>Connecting…</p>}

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

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#2a2a2a', padding: '16px 0', flexShrink: 0 }}>
        <button onClick={toggleMic} style={{ borderRadius: 9999, padding: '8px 16px', border: 'none', color: 'white', backgroundColor: isMicOn ? '#7a5c3e' : '#dc2626' }}>
          {isMicOn ? 'Mute' : 'Unmute'}
        </button>
        <button onClick={toggleCamera} style={{ borderRadius: 9999, padding: '8px 16px', border: 'none', color: 'white', backgroundColor: isCameraOn ? '#7a5c3e' : '#dc2626' }}>
          {isCameraOn ? 'Camera Off' : 'Camera On'}
        </button>
        <button onClick={handleEndCall} style={{ borderRadius: 9999, padding: '8px 24px', border: 'none', fontWeight: 600, color: 'white', backgroundColor: '#b91c1c' }}>
          End Call
        </button>
      </div>

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