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
  }, [user, isLoading]);

  return null;
}