'use client';
// src/features/auth/components/CompanyLogo.tsx
import { useEffect, useMemo, useState } from 'react';
import { COMPANY_DOMAINS } from '../data/jobData';

const LOWER_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(COMPANY_DOMAINS).map(([k, v]) => [k.toLowerCase(), v])
);

const COLORS = ['#4a3728', '#8b7355', '#6b4f3a', '#a0845c', '#5c4033', '#7a5c43'];

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export default function CompanyLogo({ name, size = 24, className = '' }: Props) {
  const clean = (name || '').trim();
  const domain = LOWER_MAP[clean.toLowerCase()];
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [domain]);

  const color = useMemo(() => {
    let h = 0;
    for (let i = 0; i < clean.length; i++) h = (h * 31 + clean.charCodeAt(i)) % COLORS.length;
    return COLORS[h];
  }, [clean]);

  if (!clean) return null;

  if (domain && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
        alt={`${clean} logo`}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`rounded-md object-contain bg-white ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`flex items-center justify-center rounded-md text-white font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: Math.max(10, Math.round(size * 0.5)),
      }}
    >
      {clean.charAt(0).toUpperCase()}
    </div>
  );
}