"use client";
//src/features/mentorship/components/sections/CompanyLogosSection.tsx

import React, { useMemo } from "react";
import TrustedCompanies from "../TrustedCompanies";
import { TOP_COMPANIES, TOP_COMPANIES_ROW2 } from "../../constants/mock.data";
import { MANUAL_COMPANIES } from "../../constants/manualCompanies";
import { parseRoleCompany } from "@/shared/utils/mentorFormat";
import { groupMentorsByCompany } from "../../utils/companyGrouping";

interface CompanyLogosSectionProps {
    mentors?: any[];
}

// "Throne 8" / "throne8" / "THRONE8" -> same key
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const INVALID = new Set(["", "na", "none", "null", "undefined", "notapplicable"]);

// Mock list ab dikhayi nahi jaati, sirf known brands ke logo/colour ke liye use hoti hai
const KNOWN_BRANDS: Record<string, { color: string; svg: string }> = {};
[...TOP_COMPANIES, ...TOP_COMPANIES_ROW2].forEach((c) => {
    KNOWN_BRANDS[norm(c.name)] = { color: c.color, svg: c.svg };
});

const PALETTE = ["#8B7355", "#4A3728", "#9C7A59", "#B47A3E", "#6B5B4F", "#7D5B3D"];

const pickColor = (name: string) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
        h = (h * 31 + name.charCodeAt(i)) >>> 0;
    }
    return PALETTE[h % PALETTE.length];
};

export default function CompanyLogosSection({ mentors = [] }: CompanyLogosSectionProps) {
    const companies = useMemo(() => {
        // 1) Real mentors ki companies + mentor count.
        //    Mentors with companyRef group by company id (stored logo); old name-only
        //    mentors merge into the group that has the same normalized name.
        const groups = groupMentorsByCompany(
            mentors.map((m: any) => ({
                ref: m?.companyRef,
                legacyName: parseRoleCompany(m?.experience?.currentRole, m?.title, m?.company).company,
            })),
            INVALID
        );

        const real = groups.map((g) => {
            const brand = KNOWN_BRANDS[norm(g.name)];
            return {
                name: g.name,
                count: g.count,
                color: brand?.color ?? pickColor(g.name),
                svg: brand?.svg,
                storedLogoUrl: g.logoUrl,
            };
        });

        // 2) Manual companies (jo real list mein pehle se nahi hain)
        const seen = new Set(real.map((c) => norm(c.name)));
        const manual = MANUAL_COMPANIES.filter((c) => {
            const key = norm(c.name);
            if (INVALID.has(key) || seen.has(key)) return false;
            seen.add(key);
            return true;
        }).map((c) => {
            const brand = KNOWN_BRANDS[norm(c.name)];
            return {
                name: c.name,
                color: brand?.color ?? pickColor(c.name),
                svg: brand?.svg,
                logoUrl: c.logoUrl,
            };
        });

        return [...real, ...manual];
    }, [mentors]);

    return <TrustedCompanies companies={companies} />;
}
