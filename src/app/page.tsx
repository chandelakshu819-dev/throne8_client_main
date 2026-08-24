'use client'
// src/app/page.tsx
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useEducation } from "@/features/profile/hooks/useEducation";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { loadProfile, loadPosts } = useProfile();
  const { loadEducation } = useEducation();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      loadProfile();
      loadPosts();
      loadEducation();
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [user, isLoading]);

  return null;
}