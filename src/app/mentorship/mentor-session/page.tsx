// src/app/mentorship/mentor-session/page.tsx
'use client';


import { Suspense, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { routes } from '@/config/routes';
import MentorCallRoom from '@/features/mentorship/components/call/MentorCallRoom';


const SHELL: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 16,
  padding: 24,
  textAlign: 'center',
  background: '#17120e',
  color: '#f3ece4',
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

function MentorSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // roomId doubles as the bookingId (backend reuses booking._id as the room name)
  const sessionId = searchParams.get('sessionId') || searchParams.get('id') || '';
  const bookingId = searchParams.get('bookingId') || searchParams.get('roomId') || '';
  const roomId = searchParams.get('roomId') || bookingId;
  // Mentor "Start Session" opens this page with ?role=mentor (server still enforces it).
  // Mentees arrive here too (e.g. "Join Now" banner) without the role param.
  const isMentor = searchParams.get('role') === 'mentor';

  const goBack = useCallback((): void => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/mentorship');
  }, [router]);

  const userId = user?.userId || '';

  // After a session ends the mentee lands on Reviews & Feedback, with this
  // session's review form opened automatically (?review=<sessionId>).
  const goToReview = useCallback((): void => {
    if (!userId) {
      router.replace('/mentorship');
      return;
    }
    const qs = new URLSearchParams({ tab: 'reviews' });
    if (sessionId) qs.set('review', sessionId);
    router.replace(`${routes.menteeDashboard(userId)}?${qs.toString()}`);
  }, [router, userId, sessionId]);

  // Mentor left by mistake: land on the dashboard overview, where the live
  // session is listed with a Rejoin button.
  const goToMentorOverview = useCallback((): void => {
    if (!userId) {
      router.replace('/mentorship');
      return;
    }
    router.replace(`${routes.seniorMentorDashboard(userId)}?tab=dashboard`);
  }, [router, userId]);



  if (authLoading) {
    return (
      <div style={SHELL}>
        <p style={{ fontSize: 14, opacity: 0.75 }}>Loading session...</p>
      </div>
    );
  }

  if (!sessionId || !roomId || !user?.userId) {
    return (
      <div style={SHELL}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Session link is incomplete</h1>
        <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 380, margin: 0 }}>
          Session or room details are missing. Please open this page from the Start Session or Join Now button.
        </p>
        <button
          onClick={goBack}
          style={{
            marginTop: 8,
            borderRadius: 9999,
            padding: '10px 24px',
            border: 'none',
            fontWeight: 600,
            background: '#c9a87c',
            color: '#241c15',
            cursor: 'pointer',
          }}
        >
          Go back
        </button>
      </div>
    );
  }

  const u = user as any;
  const fullName = [u.firstName, u.lastName]
    .filter((p: unknown): p is string => typeof p === 'string' && p.trim().length > 0)
    .join(' ');
  const userName = fullName || u.fullName || u.email || 'You';

  return (
    <MentorCallRoom
      sessionId={sessionId}
      roomId={roomId}
      bookingId={bookingId}
      userId={user.userId}
      userName={userName}
      isMentor={isMentor}
      onExit={goBack}
      onMentorLeft={goToMentorOverview}
      onGoToReview={goToReview}
    />
  );
}

export default function MentorSessionPage() {
  return (
    <Suspense
      fallback={
        <div style={SHELL}>
          <p style={{ fontSize: 14, opacity: 0.75 }}>Loading session...</p>
        </div>
      }
    >
      <MentorSessionContent />
    </Suspense>
  );
}