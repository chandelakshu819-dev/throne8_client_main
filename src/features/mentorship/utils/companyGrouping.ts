// src/features/mentorship/utils/companyGrouping.ts
// Pure grouping of mentors by company for the "World-Class Companies" strip.

import { normCompanyName } from "./companyLogo";

export interface MentorCompanyInput {
    /** companyRef from the mentors API (mentor_companies) */
    ref?: { id?: string; name?: string; logoUrl?: string } | null;
    /** free-text company parsed from the mentor profile (legacy / name-only mentors) */
    legacyName?: string | null;
}

export interface CompanyGroup {
    name: string;
    count: number;
    logoUrl?: string;
}

/**
 * - mentors with a companyRef are grouped by ref.id
 * - mentors with only a name are grouped by normalized name, and merged into a
 *   ref group when that group has the same normalized name
 * Sorted by count (desc), then name.
 */
export function groupMentorsByCompany(items: MentorCompanyInput[], invalid: Set<string> = new Set()): CompanyGroup[] {
    const groups = new Map<string, CompanyGroup>();
    const nameToKey = new Map<string, string>();

    // pass 1: register ref groups so name-only mentors can merge into them
    for (const it of items) {
        const ref = it.ref;
        if (!ref?.id || !ref?.name) continue;
        const key = `ref:${ref.id}`;
        if (!groups.has(key)) {
            groups.set(key, {
                name: ref.name,
                count: 0,
                logoUrl: ref.logoUrl && /^https:\/\//i.test(ref.logoUrl) ? ref.logoUrl : undefined,
            });
            const n = normCompanyName(ref.name);
            if (n && !nameToKey.has(n)) nameToKey.set(n, key);
        }
    }

    // pass 2: count
    for (const it of items) {
        if (it.ref?.id && it.ref?.name) {
            groups.get(`ref:${it.ref.id}`)!.count += 1;
            continue;
        }
        const name = (it.legacyName || "").trim();
        const n = normCompanyName(name);
        if (invalid.has(n)) continue;
        const key = nameToKey.get(n) ?? `name:${n}`;
        const g = groups.get(key);
        if (g) g.count += 1;
        else groups.set(key, { name, count: 1 });
    }

    return Array.from(groups.values())
        .filter((g) => g.count > 0)
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
