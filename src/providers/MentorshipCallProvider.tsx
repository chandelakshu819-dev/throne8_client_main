'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSocket } from '@/core/realtime/socket.client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { navigateToUpcomingSessions } from '@/features/mentorship/services/sessionJoin.service';

interface IncomingSessionPayload {
  sessionId: string;
  bookingId: string;
  roomId: string;
  title?: string;
  startedAt?: string;
  scheduledAt?: string;
  meetingUrl?: string | null;
}

export default function MentorshipCallProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const [incoming, setIncoming] = useState<IncomingSessionPayload | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSessionIdRef = useRef<string | null>(null);

  // ── Ringtone (Web Audio beep — no external audio file needed) ──────────
  const startRing = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;

      const playBeep = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      };

      playBeep();
      ringIntervalRef.current = setInterval(playBeep, 1200);
    } catch {
      // Audio not available (autoplay policy etc.) — UI still shows, just silent
    }
  }, []);

  const stopRing = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.userId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleSessionStarted = (payload: IncomingSessionPayload) => {
      if (!payload?.sessionId || !payload?.roomId) return;

      // ✅ De-dupe: backend emits BOTH 'session:started' and
      // 'mentorship:session:started' for the same event — only show once.
      const key = `${payload.sessionId}:${payload.bookingId}`;
      if (lastSessionIdRef.current === key) return;
      lastSessionIdRef.current = key;

      // Already on the call page for this exact session — don't ring, just skip.
      if (
        (pathname?.includes('/mentorship/mentor-session') || pathname?.includes('/mentorship/session-room')) &&
        pathname.includes(payload.sessionId)
      ) {
        return;
      }

      setIncoming(payload);
      startRing();
    };

    socket.on('session:started', handleSessionStarted);
    socket.on('mentorship:session:started', handleSessionStarted);

    return () => {
      socket.off('session:started', handleSessionStarted);
      socket.off('mentorship:session:started', handleSessionStarted);
    };
  }, [isAuthenticated, user?.userId, pathname, startRing]);

  const handleJoin = () => {
    if (!incoming) return;
    stopRing();
    const { sessionId, bookingId } = incoming;
    setIncoming(null);
    lastSessionIdRef.current = null;
    const uid = user?.userId || (user as any)?.id || (user as any)?._id;
    if (uid) {
      navigateToUpcomingSessions({
        userId: uid,
        sessionId,
        bookingId,
        router,
      });
    }
  };

  const handleDecline = () => {
    stopRing();
    setIncoming(null);
    lastSessionIdRef.current = null;
  };

  return (
    <>
      {children}

      {incoming && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          style={{ background: 'rgba(74,55,40,0.45)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center animate-[pulse_1.5s_ease-in-out_infinite] relative"
            style={{ background: '#fbf7f3', border: '1px solid #e0d8cf' }}
          >
            <button
              onClick={() => {
                stopRing();
                setIncoming(null);
                lastSessionIdRef.current = null;
              }}
              aria-label="Close"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
              style={{ background: 'rgba(74,55,40,0.1)' }}
            >
              📞
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: '#4a3728' }}>
              Incoming Session
            </h3>
            <p className="text-sm mb-6" style={{ color: '#8a7a6a' }}>
              {incoming.title || 'Your mentorship session'} is starting now
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: '#e0d8cf', color: '#7a5c3e' }}
              >
                Decline
              </button>
              <button
                onClick={handleJoin}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#4a3728' }}
              >
                Join Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}