'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveRoom } from '@/core/webrtc/useLiveRoom';
import { getSocket } from '@/core/realtime/socket.client';
import SessionService from '@/lib/api/session.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

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


  // ✅ NEW: floating emoji reactions during the live call
  const [floatingReactions, setFloatingReactions] = useState
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
        const res = await SessionService.getSessionById(sessionId);
        console.log('[SessionRoom] RAW response:', res); // 👈 ISE CHECK KARO CONSOLE ME
        const normalized = res?.data ?? res;
        console.log('[SessionRoom] normalized sessionData:', normalized); // 👈 AUR ISE BHI
        setSessionData(normalized);
      } catch (err: any) {
        console.error('[SessionRoom] fetch error:', err);
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
      joinRoom(true, true).then(() => {
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

  const handleEndCall = useCallback(() => {
    leaveRoom();
    router.back();
  }, [leaveRoom, router]);

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

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', backgroundColor: '#1a1a1a', color: 'white' }}>
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