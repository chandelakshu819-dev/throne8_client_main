"use client";
//src/features/mentorship/components/mentor/TrustScoreBadge.tsx
import React, { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { C } from "../../types/data";
import { trustScoreService, type PublicTrustScore } from "@/lib/api/trustScore.service";

interface TrustScoreBadgeProps {
    userId?: string;
}

const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({ userId }) => {
    const [data, setData] = useState<PublicTrustScore | null>(null);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        trustScoreService.getPublicByUserId(userId).then((res) => {
            if (!cancelled) setData(res);
        });
        return () => {
            cancelled = true;
        };
    }, [userId]);

    const ts = data?.trustScore;
    if (!data?.isMentor || !ts || typeof ts.overall !== "number") return null;

    const tierColor = ts.tier?.color || C.dark;
    const tierName = ts.tier?.name || "Trust Score";
    const pct = Math.max(0, Math.min(100, ts.overall));

    return (
        <div
            style={{
                borderRadius: "12px",
                padding: "12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                marginBottom: "18px",
                textAlign: "left",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                    <Shield size={14} style={{ color: tierColor, flexShrink: 0 }} />
                    <span style={{ fontSize: "10px", color: C.mid, textTransform: "uppercase", fontWeight: 700 }}>
                        Trust Score
                    </span>
                </div>
                <span
                    style={{
                        padding: "2px 8px",
                        borderRadius: "20px",
                        background: tierColor,
                        color: "#fff",
                        fontSize: "10px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                    }}
                >
                    {tierName}
                </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
                <span style={{ fontSize: "22px", fontWeight: 800, color: tierColor }}>{ts.overall}</span>
                <span style={{ fontSize: "11px", color: C.mid }}>/ 100</span>
            </div>
            <div style={{ width: "100%", height: "6px", borderRadius: "999px", background: C.border }}>
                <div
                    style={{
                        width: `${pct}%`,
                        height: "6px",
                        borderRadius: "999px",
                        background: tierColor,
                        transition: "width 0.6s ease",
                    }}
                />
            </div>
        </div>
    );
};

export default TrustScoreBadge;