'use client';
// src/shared/uiComponents/BrandWordmark.tsx
import Link from 'next/link';

interface Props {
    href?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const SIZES = {
    sm: 'text-xl',
    md: 'text-[26px]',
    lg: 'text-[34px]',
} as const;

export default function BrandWordmark({ href = '/', size = 'md', className = '' }: Props) {
    return (
        <Link
            href={href}
            aria-label="Throne8 home"
            className={`group relative inline-flex items-baseline select-none leading-none ${SIZES[size]} ${className}`}
        >
            <span className="font-black tracking-[-0.04em] bg-gradient-to-b from-[#2d2116] to-[#5c4033] bg-clip-text text-transparent">
                Throne
            </span>
            <span className="ml-[1px] font-black tracking-[-0.04em] bg-gradient-to-br from-[#e8c15a] via-[#c4963a] to-[#9f722d] bg-clip-text text-transparent transition-transform duration-300 group-hover:-translate-y-[2px] group-hover:scale-110 origin-bottom">
                8
            </span>

            {/* Hover underline */}
            <span className="pointer-events-none absolute -bottom-1.5 left-0 h-[2px] w-0 rounded-full bg-gradient-to-r from-[#c4963a] to-[#e8c15a] transition-all duration-300 group-hover:w-full" />
        </Link>
    );
}