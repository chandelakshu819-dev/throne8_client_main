"use client";

import { useEffect, useState } from "react";
import MentorService from "@/lib/api/mentorship.service";
import SeniorMentorApplicationService from "@/lib/api/seniorMentorApplication.service";

/**
 * Logged-in user ke College (Senior) Mentor ke saare possible ids.
 *
 * Public list/detail API card par `userId` nahi bhejti, aur roles API ka
 * `industryMentorId` bhi kabhi-kabhi missing hota hai. Isliye dono sources
 * (my application + my roles) se ids jama karte hain, taaki "ye mera hi card hai"
 * hamesha sahi pehchana jaaye.
 */
export function useMyCollegeMentorIds(enabled: boolean = true): Set<string> {
    const [ids, setIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!enabled) {
            setIds(new Set());
            return;
        }
        let cancelled = false;

        Promise.allSettled([
            SeniorMentorApplicationService.getMyApplication(),
            MentorService.getMyRoles(),
        ]).then(([appResult, rolesResult]) => {
            if (cancelled) return;
            const next = new Set<string>();
            const add = (value?: string | null) => {
                if (value) next.add(String(value));
            };

            if (appResult.status === "fulfilled" && appResult.value) {
                const app = appResult.value;
                add(app.seniorMentorId);
                add(app.id);
                add(app.applicationId);
                add(app.userId);
            }
            if (rolesResult.status === "fulfilled") {
                add(rolesResult.value.industryMentorId);
            }
            setIds(next);
        });

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return ids;
}
