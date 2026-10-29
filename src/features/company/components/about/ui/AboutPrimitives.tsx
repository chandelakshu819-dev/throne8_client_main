// ─── about/components/ui/AboutPrimitives.tsx ──────────────────────────────────
'use client';

import React from 'react';

// ── SectionHeader ─────────────────────────────────────────────────────────────
interface SectionHeaderProps {
    label: string;
    title: string;
    subtitle?: string;
}

export function SectionHeader({ label, title, subtitle }: SectionHeaderProps) {
    return (
        <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4a3728]/10 text-[#4a3728] text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#4a3728]/20 mb-3">
                {label}
            </span>
            <h2 className="text-2xl font-extrabold text-[#4a3728] leading-tight tracking-tight">{title}</h2>
            {subtitle && (
                <p className="text-sm text-[#4a3728]/55 mt-1.5 max-w-xl leading-relaxed">{subtitle}</p>
            )}
        </div>
    );
}

// ── Card ──────────────────────────────────────────────────────────────────────
interface CardProps {
    children?: React.ReactNode;
    label?: string;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
    return (
        <div
            className={`
        bg-white/75 backdrop-blur-sm border border-[#e0d8cf]/80
        rounded-3xl shadow-sm
        ${hover ? 'transition-all duration-200 hover:shadow-md hover:border-[#c8bfb5] hover:-translate-y-0.5' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
}

// ── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({ count }: { count: number }) {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <svg
                    key={i}
                    className={`w-3.5 h-3.5 ${i < count ? 'text-amber-400' : 'text-[#e0d8cf]'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

// ── AvatarPlaceholder ─────────────────────────────────────────────────────────
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const AVATAR_SIZE_MAP: Record<AvatarSize, string> = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
};

const AVATAR_COLORS = [
    'bg-[#4a3728]',
    'bg-[#6b4f3a]',
    'bg-[#8c6650]',
    'bg-[#a47c65]',
];

export function AvatarPlaceholder({
    name,
    size = 'md',
    className = '',
}: {
    name: string;
    size?: AvatarSize;
    className?: string;
}) {
    const colorIdx = name.charCodeAt(0) % AVATAR_COLORS.length;
    return (
        <div
            className={`
        ${AVATAR_SIZE_MAP[size]} ${AVATAR_COLORS[colorIdx]}
        rounded-2xl flex items-center justify-center
        text-[#f6ede8] font-bold flex-shrink-0 ${className}
      `}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps {
    children?: React.ReactNode;
    label?: string;
    variant?: 'default' | 'dark' | 'blue' | 'green';
    className?: string;
}

export function Badge({ children, label, variant = 'default', className = '' }: BadgeProps) {
    const variantStyles = {
        default: 'bg-[#4a3728]/10 text-[#4a3728] border-[#4a3728]/20',
        dark: 'bg-[#4a3728] text-[#f6ede8] border-transparent',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };

    return (
        <span
            className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-[10px] font-bold uppercase tracking-widest border
        ${variantStyles[variant]} ${className}
      `}
        >
            {children ?? label}
        </span>
    );
}

// ── TabBar ────────────────────────────────────────────────────────────────────
interface TabBarProps<T extends string> {
    tabs: { id: T; label: string }[];
    active: T;
    onChange: (id: T) => void;
    className?: string;
}

export function TabBar<T extends string>({ tabs, active, onChange, className = '' }: TabBarProps<T>) {
    return (
        <div className={`flex gap-1 bg-[#e8ddd5]/70 rounded-2xl p-1 w-fit ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`
            px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200
            ${active === tab.id
                            ? 'bg-[#4a3728] text-[#f6ede8] shadow-md'
                            : 'text-[#4a3728]/60 hover:text-[#4a3728] hover:bg-[#4a3728]/5'
                        }
          `}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
