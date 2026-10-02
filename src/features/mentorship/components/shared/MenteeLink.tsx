"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileService from "@/lib/api/profile.service";

interface MenteeLinkProps {
  menteeId?: string;
  name?: string;
  avatar?: string | null;
  className?: string;
  showAvatar?: boolean;
  avatarSize?: string;
  underlineOnHover?: boolean;
  children?: React.ReactNode;
}

function initialsFrom(name?: string) {
  if (!name || !name.trim()) return "M";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "M";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Reusable MenteeLink component for Mentors.
 * Clicking a mentee's avatar/name stops propagation and navigates to the Read-Only Mentee Profile page.
 */
export default function MenteeLink({
  menteeId,
  name = "Student",
  avatar,
  className = "",
  showAvatar = true,
  avatarSize = "w-9 h-9",
  underlineOnHover,
  children,
}: MenteeLinkProps) {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!avatar) {
      setPhotoUrl(null);
      return;
    }
    if (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("data:")) {
      setPhotoUrl(avatar);
      return;
    }
    ProfileService.getProfilePhotoById(avatar)
      .then((res: any) => {
        const url = res?.data?.photo?.cloudinarySecureUrl;
        if (url) setPhotoUrl(url);
      })
      .catch(() => setPhotoUrl(null));
  }, [avatar]);

  const handleClick = (e: React.MouseEvent) => {
    if (!menteeId) return;
    e.stopPropagation();
    e.preventDefault();
    router.push(`/mentorship/menteeProfile/${encodeURIComponent(menteeId)}`);
  };

  const isClickable = Boolean(menteeId);

  if (children) {
    const hoverClass = underlineOnHover === true ? "hover:underline" : "";
    return (
      <span
        onClick={isClickable ? handleClick : undefined}
        className={`${isClickable ? "cursor-pointer" : ""} ${hoverClass} ${className}`}
      >
        {children}
      </span>
    );
  }

  const initials = initialsFrom(name);

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      className={`inline-flex items-center gap-2.5 max-w-full ${
        isClickable ? "cursor-pointer group" : ""
      } ${className}`}
    >
      {showAvatar && (
        photoUrl && !imgError ? (
          <img
            src={photoUrl}
            alt={name}
            onError={() => setImgError(true)}
            className={`${avatarSize} rounded-full object-cover shrink-0 border border-[#e0d8cf]`}
          />
        ) : (
          <div
            className={`${avatarSize} rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white bg-[#4a3728] border border-[#e0d8cf]`}
          >
            {initials}
          </div>
        )
      )}
      <span
        className={`text-sm font-medium truncate text-[#4a3728] ${
          isClickable ? "group-hover:underline" : ""
        }`}
      >
        {name}
      </span>
    </div>
  );
}
