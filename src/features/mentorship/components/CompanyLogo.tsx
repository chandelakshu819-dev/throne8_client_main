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

const KNOWN_COMPANY_LOGOS: Record<string, string> = {
  akssai: "/logos/akssai.png",
  akssaiprojexel: "/logos/akssai.png",
  projexel: "/logos/akssai.png",
  redient: "/logos/redient.png",
  redientsecurity: "/logos/redient.png",
  vikaro: "/logos/vikaro.svg",
  throne8: "/throne8logo.png",
};

function resolveCompanyLogo(src?: string | null, companyName?: string | null): string | null {
  if (src && src.trim()) return src.trim();
  if (!companyName) return null;
  const key = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!key) return null;
  if (KNOWN_COMPANY_LOGOS[key]) return KNOWN_COMPANY_LOGOS[key];
  for (const [k, v] of Object.entries(KNOWN_COMPANY_LOGOS)) {
    if (key.includes(k) || k.includes(key)) {
      return v;
    }
  }
  return null;
}

export default function CompanyLogo({
  src,
  companyName,
  size = 20,
  className = "",
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);
  const initials = getCompanyInitials(companyName);
  const effectiveSrc = resolveCompanyLogo(src, companyName);

  useEffect(() => {
    setHasError(false);
  }, [effectiveSrc]);

  const containerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
  };

  const showImage = Boolean(effectiveSrc && !hasError);

  return (
    <span
      style={containerStyle}
      title={companyName || undefined}
      className={`inline-flex items-center justify-center rounded overflow-hidden shrink-0 select-none bg-[#f3ece4] border border-[#e0d8cf] ${className}`}
    >
      {showImage ? (
        <img
          src={effectiveSrc!}
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
