// src/features/mentorship/components/shared/ServiceThumbnail.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
    GraduationCap,
    Video,
    FileText,
    MessageSquare,
    Briefcase,
    Package,
    Users,
    type LucideIcon,
} from "lucide-react";

interface ServiceThumbnailProps {
    src?: string | null;
    alt: string;
    label?: string;
    tone?: "brown" | "navy";
    /** sessionType / service type: mock_interview, ask_query, resume_review, etc. */
    type?: string;
}

const TYPE_STYLES: Record<string, { icon: LucideIcon; gradient: string }> = {
    quick_call: { icon: Video, gradient: "from-[#1e3a8a] to-[#3b82f6]" },
    deep_dive: { icon: Video, gradient: "from-[#4c1d95] to-[#8b5cf6]" },
    resume_review: { icon: FileText, gradient: "from-[#92400e] to-[#f59e0b]" },
    mock_interview: { icon: MessageSquare, gradient: "from-[#115e59] to-[#2dd4bf]" },
    career_planning: { icon: Briefcase, gradient: "from-[#312e81] to-[#6366f1]" },
    portfolio_review: { icon: Package, gradient: "from-[#9d174d] to-[#ec4899]" },
    ask_query: { icon: MessageSquare, gradient: "from-[#78350f] to-[#b45309]" },
    group_session: { icon: Users, gradient: "from-[#14532d] to-[#22c55e]" },
};

/** Service object se image URL nikalta hai, chahe backend ne koi bhi field name diya ho */
export function getServiceImage(service: any): string | null {
    if (!service) return null;
    const candidate =
        service.thumbnailImage ||
        service.thumbnail ||
        service.thumbnailUrl ||
        service.image ||
        service.imageUrl ||
        service.bannerImage ||
        service.coverImage ||
        null;
    return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
}

/** Image missing ya load fail ho to service type ke hisaab se gradient placeholder dikhata hai */
export default function ServiceThumbnail({
    src,
    alt,
    label,
    tone = "brown",
    type,
}: ServiceThumbnailProps) {
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

    const typeStyle = type ? TYPE_STYLES[type] : undefined;
    const Icon = typeStyle?.icon || GraduationCap;
    const gradient =
        typeStyle?.gradient ||
        (tone === "navy" ? "from-[#1b2b3a] to-[#3a5266]" : "from-[#4a3728] to-[#8b7355]");

    return (
        <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-1.5`}
        >
            <Icon className="w-8 h-8 text-white/80" />
            {label && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 px-3 text-center truncate max-w-full">
                    {label}
                </span>
            )}
        </div>
    );
}