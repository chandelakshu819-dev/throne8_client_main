// src/features/mentorship/components/shared/ServiceThumbnail.tsx
"use client";

import React, { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";

interface ServiceThumbnailProps {
    src?: string | null;
    alt: string;
    label?: string;
    tone?: "brown" | "navy";
}

/** Image missing ya load fail ho to blank white box ke bajay gradient placeholder dikhata hai */
export default function ServiceThumbnail({ src, alt, label, tone = "brown" }: ServiceThumbnailProps) {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [src]);

    if (src && !failed) {
        return (
            <img
                src={src}
                alt={alt}
                draggable={false}
                onError={() => setFailed(true)}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
        );
    }

    const gradient =
        tone === "navy"
            ? "from-[#1b2b3a] to-[#3a5266]"
            : "from-[#4a3728] to-[#8b7355]";

    return (
        <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-1.5`}
        >
            <GraduationCap className="w-8 h-8 text-white/70" />
            {label && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 px-3 text-center truncate max-w-full">
                    {label}
                </span>
            )}
        </div>
    );
}