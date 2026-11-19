"use client";

import React, { useEffect, useState } from "react";
import SeniorMentorApplicationService, {
    FreeSessionProgress,
} from "@/lib/api/seniorMentorApplication.service";

/**
 * Shows how many free sessions a student Senior Mentor has completed.
 * Renders nothing for alumni mentors or users without an application.
 * Place it on the Senior Mentor dashboard / services page.
 */
export default function FreeSessionProgressCard() {
    const [progress, setProgress] = useState<FreeSessionProgress | null>(null);

    useEffect(() => {
        let active = true;
        SeniorMentorApplicationService.getFreeSessionProgress()
            .then((p) => {
                if (active) setProgress(p);
            })
            .catch(() => {
                if (active) setProgress(null);
            });
        return () => {
            active = false;
        };
    }, []);

    if (!progress || !progress.appliesToUser) return null;

    const { completed, required, remaining, isUnlocked } = progress;
    const pct = Math.min(100, Math.round((completed / required) * 100));

    return (
        <div className="rounded-2xl border border-[#ece7e2] bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 gap-3">
                <p className="text-sm font-bold text-[#4a3728]">
                    {isUnlocked ? "Paid services unlocked 🎉" : "Free sessions progress"}
                </p>
                <span className="text-xs font-bold text-[#4a3728] whitespace-nowrap">
                    {completed}/{required}
                </span>
            </div>
            <div
                className="h-2.5 rounded-full bg-[#f0e8de] overflow-hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={required}
                aria-valuenow={completed}
            >
                <div className="h-full bg-[#4a3728] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {isUnlocked
                    ? "You can now create paid services and set your own prices."
                    : `Complete ${remaining} more free ${remaining === 1 ? "session" : "sessions"} to unlock paid services.`}
            </p>
        </div>
    );
}