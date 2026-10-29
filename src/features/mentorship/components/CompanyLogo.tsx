"use client";

import React, { useState, useEffect } from "react";

interface CompanyLogoProps {
  src?: string | null;
  companyName?: string | null;
  size?: number; // size in pixels, default 20
  className?: string;
}

export function getCompanyInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "C";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function CompanyLogo({
  src,
  companyName,
  size = 20,
  className = "",
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);
  const initials = getCompanyInitials(companyName);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const containerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
  };

  const showImage = Boolean(src && !hasError);

  return (
    <span
      style={containerStyle}
      title={companyName || undefined}
      className={`inline-flex items-center justify-center rounded overflow-hidden shrink-0 select-none bg-[#f3ece4] border border-[#e0d8cf] ${className}`}
    >
      {showImage ? (
        <img
          src={src!}
          alt={companyName || "Company logo"}
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      ) : (
        <span
          className="font-bold text-[#4a3728] leading-none"
          style={{ fontSize: `${Math.max(Math.floor(size * 0.45), 9)}px` }}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
