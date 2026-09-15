'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveRoom } from '@/core/webrtc/useLiveRoom';
import SessionService from '@/lib/api/session.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function SessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const { user } = useAuth();
  // ADJUST: agar useAuth se field ka naam alag hai (jaise user?.userId,
  // user?._id) to yahan match karo.
  const currentUserId = (user as any)?.id || (user as any)?.userId || '';
  const currentUserName =
    `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() ||
    'User';

  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasJoinedRef = useRef(false);

  // roomId = sessionId hi use kar rahe hain — alag se model field
  // add karne ki zaroorat nahi, sessionId already unique hai.
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

  // ── Session details fetch karo (auth check + display info ke liye) ──
  useEffect(() => {
    if (!sessionId) return;

    const fetchSession = async () => {
      try {
        setLoading(true);
        const res = await SessionService.getSessionById(sessionId);
        setSessionData(res.data || res);
      } catch (err: any) {
        setLoadError(err.message || 'Failed to load session.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // ── Session load hone ke baad hi room join karo (ek hi baar) ──
  useEffect(() => {
    if (sessionData && currentUserId && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      joinRoom(true, true);
    }
  }, [sessionData, currentUserId, joinRoom]);

  // ── Page se bahar jaate waqt room leave karo ──
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  const handleEndCall = useCallback(() => {
    leaveRoom();
    router.back();
  }, [leaveRoom, router]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6ede8]">
        <p className="text-[#4a3728]">Session load ho raha hai...</p>
      </div>
    );
  }

  // ── Error state ──
  if (loadError || !sessionData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#f6ede8]">
        <p className="text-red-600">{loadError || 'Session not found.'}</p>
        <button
          onClick={() => router.back()}
          className="rounded bg-[#4a3728] px-4 py-2 text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a] text-white">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#4a3728] px-6 py-3">
        <h1 className="text-lg font-semibold">{sessionData.title}</h1>
        <span className="text-sm opacity-80">
          {peers.length > 0 ? 'Connected' : 'Waiting for other participant...'}
        </span>
      </div>

      {/* Video grid */}
      <div className="flex flex-1 items-center justify-center gap-4 p-4">
        {/* Local video */}
        <div className="relative aspect-video w-full max-w-md rounded-lg bg-black">
          {localStream && (
            <video
              autoPlay
              muted
              playsInline
              ref={(el) => {
                if (el && el.srcObject !== localStream) el.srcObject = localStream;
              }}
              className="h-full w-full rounded-lg object-cover"
            />
          )}
          <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs">
            You
          </span>
        </div>

        {/* Remote peers */}
        {peers.length === 0 && (
          <div className="flex aspect-video w-full max-w-md items-center justify-center rounded-lg bg-black/40">
            <p className="text-sm opacity-70">Waiting for the other person to join…</p>
          </div>
        )}

        {peers.map((peer) => (
          <div key={peer.socketId} className="relative aspect-video w-full max-w-md rounded-lg bg-black">
            {peer.stream && (
              <video
                autoPlay
                playsInline
                ref={(el) => {
                  if (el && el.srcObject !== peer.stream) el.srcObject = peer.stream;
                }}
                className="h-full w-full rounded-lg object-cover"
              />
            )}
            <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs">
              {peer.userName || 'Participant'}
            </span>
          </div>
        ))}
      </div>

      {liveRoomError && (
        <p className="px-6 pb-2 text-center text-sm text-red-400">{liveRoomError}</p>
      )}
      {isConnecting && (
        <p className="px-6 pb-2 text-center text-sm opacity-70">Connecting…</p>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 bg-[#2a2a2a] py-4">
        <button
          onClick={toggleMic}
          className={`rounded-full px-4 py-2 ${isMicOn ? 'bg-[#7a5c3e]' : 'bg-red-600'}`}
        >
          {isMicOn ? 'Mute' : 'Unmute'}
        </button>
        <button
          onClick={toggleCamera}
          className={`rounded-full px-4 py-2 ${isCameraOn ? 'bg-[#7a5c3e]' : 'bg-red-600'}`}
        >
          {isCameraOn ? 'Camera Off' : 'Camera On'}
        </button>
        <button
          onClick={handleEndCall}
          className="rounded-full bg-red-700 px-6 py-2 font-semibold"
        >
          End Call
        </button>
      </div>
    </div>
  );
}