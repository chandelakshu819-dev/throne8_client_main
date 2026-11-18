'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSocket } from '@/core/realtime/socket.client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import StudyGroupService from '@/lib/api/studyGroup.service';

interface LiveRoomStartedPayload {
  roomId: string;
  groupId: string;
  groupName?: string;
  title?: string;
  hostId?: string;
  hostName?: string;
  startedAt?: string;
}

interface LiveRoomEndedPayload {
  roomId: string;
  groupId: string;
  endedAt?: string;
}

const AUTO_HIDE_MS = 60_000;
const POLL_INTERVAL_MS = 15_000;

/**
 * Global "live session started" banner for study groups.
 * Same idea as MentorshipCallProvider: the server sends `live-room:started`
 * to every active member's personal socket room, so this works on any page.
 */
export default function LiveRoomNotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const [live, setLive] = useState<LiveRoomStartedPayload | null>(null);
  const lastRoomIdRef = useRef<string | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const dismiss = () => {
    clearHideTimer();
    setLive(null);
  };

  // Keep latest pathname in a ref so route changes don't tear down the listeners
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!isAuthenticated || !user?.userId) return;
    let cancelled = false;
    let attachedSocket: ReturnType<typeof getSocket> = null;

    const show = (payload: LiveRoomStartedPayload) => {
      if (!payload?.roomId || !payload?.groupId) return;
      if (payload.hostId && payload.hostId === user.userId) return;

      // De-dupe: socket event and polling can report the same room
      if (lastRoomIdRef.current === payload.roomId) return;
      lastRoomIdRef.current = payload.roomId;

      // Already on this group's page: the page shows its own Join button
      if (pathnameRef.current?.includes(`/study/my-groups/${payload.groupId}`)) return;

      clearHideTimer();
      setLive(payload);
      hideTimerRef.current = setTimeout(() => setLive(null), AUTO_HIDE_MS);
    };

    const handleEnded = (payload: LiveRoomEndedPayload) => {
      if (!payload?.roomId) return;
      if (lastRoomIdRef.current === payload.roomId) lastRoomIdRef.current = null;
      setLive((current) => {
        if (current && current.roomId === payload.roomId) {
          clearHideTimer();
          return null;
        }
        return current;
      });
    };

    // Fallback: ask the server which rooms are live (missed socket event / offline / reconnect)
    const checkLiveRooms = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const rooms = await StudyGroupService.getMyActiveLiveRooms();
      if (cancelled) return;

      if (rooms.length > 0) {
        show(rooms[0]);
      } else {
        // Nothing live anymore: drop a banner whose "ended" event we missed
        lastRoomIdRef.current = null;
        dismiss();
      }
    };

    // The socket may not exist yet at first render, so (re)try attaching on every tick
    const attachSocket = () => {
      const socket = getSocket();
      if (!socket || socket === attachedSocket) return;
      attachedSocket = socket;
      socket.on('live-room:started', show);
      socket.on('live-room:ended', handleEnded);
      socket.on('connect', checkLiveRooms);
    };

    attachSocket();
    void checkLiveRooms();

    const timer = setInterval(() => {
      attachSocket();
      void checkLiveRooms();
    }, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkLiveRooms();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      if (attachedSocket) {
        attachedSocket.off('live-room:started', show);
        attachedSocket.off('live-room:ended', handleEnded);
        attachedSocket.off('connect', checkLiveRooms);
      }
    };
  }, [isAuthenticated, user?.userId]);

  useEffect(() => clearHideTimer, []);

  const handleJoin = () => {
    if (!live) return;
    const groupId = live.groupId;
    dismiss();
    router.push(`/study/my-groups/${groupId}`);
  };

  return (
    <>
      {children}

      {live && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-[99998] w-[340px] rounded-2xl border border-[#e0d3c4] bg-white p-4 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#4a3728]">Live session started</p>
              <p className="mt-0.5 text-sm text-[#6b5847]">
                {live.hostName || 'A member'} started a live session in{' '}
                <span className="font-semibold">{live.groupName || 'your group'}</span>
                {live.title ? `: ${live.title}` : ''}. You can join now.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleJoin}
                  className="rounded-lg bg-[#4a3728] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#3a2a1e]"
                >
                  Join
                </button>
                <button
                  onClick={dismiss}
                  className="rounded-lg border border-[#d4c4b5] bg-white px-4 py-1.5 text-sm font-semibold text-[#4a3728] hover:bg-[#f6ede8]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
