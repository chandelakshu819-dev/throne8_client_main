'use client';
// src/app/page.tsx
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEducation } from '@/features/profile/hooks/useEducation';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { HOME_PATH, IS_MENTORSHIP_MODE } from '@/config/launch';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { loadProfile, loadPosts } = useProfile();
  const { loadEducation } = useEducation();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      loadProfile();
      if (!IS_MENTORSHIP_MODE) {
        loadPosts();
        loadEducation();
      }
      router.replace(HOME_PATH);
    } else {
      router.replace('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#fffdfa]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4a3728] border-t-transparent" />
    </div>
  );
}