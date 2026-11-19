"use client";
// src/features/mentorship/components/shared/CompanyLogoBadge.tsx
import React, { useEffect, useState } from "react";
import { companyColor, companyInitial } from "../../utils/companyLogo";

interface CompanyLogoBadgeProps {
    name: string;
    src?: string;
    size?: number; // px
    className?: string;
}

/** Company logo; if there is no src or it fails to load, a letter circle is shown. */
export default function CompanyLogoBadge({ name, src, size = 32, className = "" }: CompanyLogoBadgeProps) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [src]);

    const dim = { width: size, height: size };
    if (!src || failed) {
        return (
            <span
                aria-hidden="true"
                className={`inline-flex shrink-0 items-center justify-center rounded-full font-black text-white ${className}`}
                style={{ ...dim, backgroundColor: companyColor(name), fontSize: Math.max(10, Math.round(size * 0.42)) }}
            >
                {companyInitial(name)}
            </span>
        );
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className={`shrink-0 rounded-md bg-white object-contain ${className}`}
            style={dim}
        />
    );
}
