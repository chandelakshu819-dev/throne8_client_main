"use client";
//src/features/mentorship/components/sections/CompanyLogosSection.tsx

import React, { useMemo } from "react";
import TrustedCompanies from "../TrustedCompanies";
import { TOP_COMPANIES, TOP_COMPANIES_ROW2 } from "../../constants/mock.data";
import { MANUAL_COMPANIES } from "../../constants/manualCompanies";
import { parseRoleCompany } from "@/shared/utils/mentorFormat";

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
        // 1) Real mentors ki companies + mentor count
        const map = new Map<string, { name: string; count: number }>();
        mentors.forEach((m: any) => {
            const { company } = parseRoleCompany(m?.experience?.currentRole, m?.title, m?.company);
            const key = norm(company);
            if (INVALID.has(key)) return;
            const entry = map.get(key);
            if (entry) entry.count += 1;
            else map.set(key, { name: company, count: 1 });
        });

        const real = Array.from(map.entries())
            .sort((a, b) => b[1].count - a[1].count || a[1].name.localeCompare(b[1].name))
            .map(([key, v]) => {
                const brand = KNOWN_BRANDS[key];
                return {
                    name: v.name,
                    count: v.count,
                    color: brand?.color ?? pickColor(v.name),
                    svg: brand?.svg,
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