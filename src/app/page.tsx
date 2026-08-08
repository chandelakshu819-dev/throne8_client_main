'use client'
// src/app/page.tsx
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useEducation } from "@/features/profile/hooks/useEducation";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { redirect, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {

 const router= useRouter();
   const { user, isLoading } = useAuth();
 
   const { loadProfile, loadPosts } = useProfile();
   const { loadEducation } = useEducation();
 
   useEffect(() => {
     if (user) {
       loadProfile();   // ← Redux action
       loadPosts();
       loadEducation();
     }
   }, [user]);

   redirect(user ? "/dashboard" : "/login");
}
