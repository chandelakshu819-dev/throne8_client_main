// src/features/mentorship/components/sections/CollegeMentorFilters.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
    Search,
    X,
    SlidersHorizontal,
    LayoutGrid,
    List,
    RotateCcw,
    ChevronDown,
} from "lucide-react";
import type { PublicSeniorMentor } from "@/lib/api/mentorship.service";
import { splitSkills } from "@/shared/utils/mentorFormat";

/* ─────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────── */

export type CollegeSort = "recommended" | "popular" | "name_asc" | "name_desc";
export type CollegeView = "grid" | "list";

export interface CollegeFilterState {
    search: string;
    skills: string[]; // skill keys
    colleges: string[]; // college keys
    degrees: string[]; // degree keys
    freeOnly: boolean; // sirf wahi jinke paas bookable free session hai
    sort: CollegeSort;
}

export interface FilterOption {
    key: string;
    label: string;
    count: number;
}

export interface FilterChip {
    id: string;
    label: string;
    onRemove: () => void;
}

const INITIAL_FILTERS: CollegeFilterState = {
    search: "",
    skills: [],
    colleges: [],
    degrees: [],
    freeOnly: false,
    sort: "recommended",
};

const SORT_OPTIONS: { value: CollegeSort; label: string }[] = [
    { value: "recommended", label: "Recommended" },
    { value: "popular", label: "Most Popular" },
    { value: "name_asc", label: "Name (A–Z)" },
    { value: "name_desc", label: "Name (Z–A)" },
];

/* ─────────────────────────────────────────────────────────────
 * Normalisation helpers (messy data ko ek jaisa banane ke liye)
 * ───────────────────────────────────────────────────────────── */

const ACRONYMS = new Set([
    "dsa", "ai", "ml", "sql", "aws", "api", "ui", "ux", "html", "css",
    "php", "oop", "oops", "iot", "nlp", "cpp", "mern", "mean", "dbms", "os",
]);

const stripPrefix = (s: string): string => s.replace(/^[^:]{2,40}:\s*/, "").trim();

const cleanSkillBase = (raw: string): string =>
    stripPrefix(raw).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

const skillKey = (raw: string): string => cleanSkillBase(raw).toLowerCase();

const skillLabel = (raw: string): string => {
    const base = cleanSkillBase(raw);
    if (base !== base.toLowerCase()) return base; // pehle se formatted hai
    return base
        .split(" ")
        .map((w) =>
            ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
        )
        .join(" ");
};

const titleCase = (s: string): string => s.replace(/\b\w/g, (c) => c.toUpperCase());

const collegeKey = (raw: string): string =>
    raw.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const collegeLabel = (raw: string): string => {
    const base = raw.trim().replace(/[,.\s]+$/, "");
    return base === base.toLowerCase() ? titleCase(base) : base;
};

const DEGREE_LABELS: Record<string, string> = {
    btech: "B.Tech",
    mtech: "M.Tech",
    be: "B.E",
    me: "M.E",
    bca: "BCA",
    mca: "MCA",
    bsc: "B.Sc",
    msc: "M.Sc",
    mba: "MBA",
    bba: "BBA",
    diploma: "Diploma",
};

const degreeKey = (raw: string): string => raw.toLowerCase().replace(/[^a-z0-9]/g, "");

const degreeLabel = (raw: string): string => {
    const key = degreeKey(raw);
    if (DEGREE_LABELS[key]) return DEGREE_LABELS[key];
    const base = raw.trim();
    return base === base.toLowerCase() ? titleCase(base) : base;
};

/* ─────────────────────────────────────────────────────────────
 * Hook: filter state + options + filtered result
 * ───────────────────────────────────────────────────────────── */

interface IndexedMentor {
    mentor: PublicSeniorMentor;
    skillKeys: Set<string>;
    collegeKey: string;
    degreeKey: string;
    haystack: string;
}

const toggleIn = (list: string[], value: string): string[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export function useCollegeMentorFilters(mentors: PublicSeniorMentor[]) {
    const [filters, setFilters] = useState<CollegeFilterState>(INITIAL_FILTERS);

    // Har mentor ke liye ek baar normalized data
    const indexed: IndexedMentor[] = useMemo(
        () =>
            mentors.map((mentor) => {
                const skills = splitSkills(mentor.skills);
                return {
                    mentor,
                    skillKeys: new Set(skills.map(skillKey).filter(Boolean)),
                    collegeKey: mentor.college ? collegeKey(mentor.college) : "",
                    degreeKey: mentor.degree ? degreeKey(mentor.degree) : "",
                    haystack: [
                        mentor.displayName,
                        mentor.college,
                        mentor.degree,
                        mentor.fieldOfStudy,
                        ...skills.map(cleanSkillBase),
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase(),
                };
            }),
        [mentors]
    );

    // Options real data se (count ke saath)
    const { skillOptions, collegeOptions, degreeOptions } = useMemo(() => {
        const skillMap = new Map<string, FilterOption>();
        const collegeMap = new Map<string, FilterOption>();
        const degreeMap = new Map<string, FilterOption>();

        const bump = (map: Map<string, FilterOption>, key: string, label: string) => {
            if (!key) return;
            const existing = map.get(key);
            if (existing) existing.count += 1;
            else map.set(key, { key, label, count: 1 });
        };

        mentors.forEach((mentor) => {
            const seenSkills = new Set<string>();
            splitSkills(mentor.skills).forEach((raw) => {
                const key = skillKey(raw);
                if (!key || seenSkills.has(key)) return;
                seenSkills.add(key);
                bump(skillMap, key, skillLabel(raw));
            });
            if (mentor.college) bump(collegeMap, collegeKey(mentor.college), collegeLabel(mentor.college));
            if (mentor.degree) bump(degreeMap, degreeKey(mentor.degree), degreeLabel(mentor.degree));
        });

        const sortOptions = (m: Map<string, FilterOption>) =>
            Array.from(m.values()).sort(
                (a, b) => b.count - a.count || a.label.localeCompare(b.label)
            );

        return {
            skillOptions: sortOptions(skillMap),
            collegeOptions: sortOptions(collegeMap),
            degreeOptions: sortOptions(degreeMap),
        };
    }, [mentors]);

    const filtered = useMemo(() => {
        const q = filters.search.trim().toLowerCase();

        const result = indexed.filter((item) => {
            if (q && !item.haystack.includes(q)) return false;
            if (filters.skills.length > 0 && !filters.skills.some((k) => item.skillKeys.has(k))) return false;
            if (filters.colleges.length > 0 && !filters.colleges.includes(item.collegeKey)) return false;
            if (filters.degrees.length > 0 && !filters.degrees.includes(item.degreeKey)) return false;
            if (filters.freeOnly && !item.mentor.sessionId) return false;
            return true;
        });

        switch (filters.sort) {
            case "popular":
                result.sort((a, b) => (b.mentor.sessionsCount || 0) - (a.mentor.sessionsCount || 0));
                break;
            case "name_asc":
                result.sort((a, b) => a.mentor.displayName.localeCompare(b.mentor.displayName));
                break;
            case "name_desc":
                result.sort((a, b) => b.mentor.displayName.localeCompare(a.mentor.displayName));
                break;
            default:
                break; // recommended = API order
        }

        return result.map((i) => i.mentor);
    }, [indexed, filters]);

    /* setters */
    const setSearch = useCallback((search: string) => setFilters((f) => ({ ...f, search })), []);
    const setSort = useCallback((sort: CollegeSort) => setFilters((f) => ({ ...f, sort })), []);
    const setFreeOnly = useCallback((freeOnly: boolean) => setFilters((f) => ({ ...f, freeOnly })), []);
    const toggleSkill = useCallback(
        (key: string) => setFilters((f) => ({ ...f, skills: toggleIn(f.skills, key) })),
        []
    );
    const toggleCollege = useCallback(
        (key: string) => setFilters((f) => ({ ...f, colleges: toggleIn(f.colleges, key) })),
        []
    );
    const toggleDegree = useCallback(
        (key: string) => setFilters((f) => ({ ...f, degrees: toggleIn(f.degrees, key) })),
        []
    );
    const clearAll = useCallback(() => setFilters(INITIAL_FILTERS), []);

    // Sort ko filter count me nahi ginte
    const activeCount =
        (filters.search.trim() ? 1 : 0) +
        filters.skills.length +
        filters.colleges.length +
        filters.degrees.length +
        (filters.freeOnly ? 1 : 0);

    const chips: FilterChip[] = useMemo(() => {
        const list: FilterChip[] = [];
        if (filters.search.trim()) {
            list.push({ id: "search", label: `Search: ${filters.search.trim()}`, onRemove: () => setSearch("") });
        }
        filters.skills.forEach((k) =>
            list.push({
                id: `skill-${k}`,
                label: skillOptions.find((o) => o.key === k)?.label ?? k,
                onRemove: () => toggleSkill(k),
            })
        );
        filters.colleges.forEach((k) =>
            list.push({
                id: `college-${k}`,
                label: collegeOptions.find((o) => o.key === k)?.label ?? k,
                onRemove: () => toggleCollege(k),
            })
        );
        filters.degrees.forEach((k) =>
            list.push({
                id: `degree-${k}`,
                label: degreeOptions.find((o) => o.key === k)?.label ?? k,
                onRemove: () => toggleDegree(k),
            })
        );
        if (filters.freeOnly) {
            list.push({ id: "free", label: "Free session available", onRemove: () => setFreeOnly(false) });
        }
        return list;
    }, [filters, skillOptions, collegeOptions, degreeOptions, setSearch, toggleSkill, toggleCollege, toggleDegree, setFreeOnly]);

    return {
        filters,
        filtered,
        skillOptions,
        collegeOptions,
        degreeOptions,
        activeCount,
        chips,
        setSearch,
        setSort,
        setFreeOnly,
        toggleSkill,
        toggleCollege,
        toggleDegree,
        clearAll,
    };
}

export type CollegeFiltersApi = ReturnType<typeof useCollegeMentorFilters>;

/* ─────────────────────────────────────────────────────────────
 * UI
 * ───────────────────────────────────────────────────────────── */

function ChipGroup({
    title,
    options,
    selected,
    onToggle,
    initialLimit = 10,
}: {
    title: string;
    options: FilterOption[];
    selected: string[];
    onToggle: (key: string) => void;
    initialLimit?: number;
}) {
    const [expanded, setExpanded] = useState(false);
    if (options.length === 0) return null;

    // Selected options hamesha dikhen, chahe limit se bahar hon
    const base = expanded ? options : options.slice(0, initialLimit);
    const extraSelected = expanded
        ? []
        : options.slice(initialLimit).filter((o) => selected.includes(o.key));
    const shown = [...base, ...extraSelected];
    const hiddenCount = options.length - shown.length;

    return (
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8b7355] mb-2">{title}</p>
            <div className="flex flex-wrap gap-1.5">
                {shown.map((o) => {
                    const active = selected.includes(o.key);
                    return (
                        <button
                            key={o.key}
                            type="button"
                            onClick={() => onToggle(o.key)}
                            aria-pressed={active}
                            title={o.label}
                            className={`max-w-[220px] truncate text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                                active
                                    ? "bg-[#3a2a1e] text-white border-[#3a2a1e]"
                                    : "bg-white text-[#6b5643] border-[#ebdcd0] hover:border-[#c4963a]"
                            }`}
                        >
                            {o.label}
                            <span className={`ml-1 ${active ? "text-white/70" : "text-[#a08070]"}`}>{o.count}</span>
                        </button>
                    );
                })}
                {options.length > initialLimit && (
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-dashed border-[#c4963a]/60 text-[#8b7355] hover:bg-[#f5ede5]"
                    >
                        {expanded ? "Show less" : `+${hiddenCount > 0 ? hiddenCount : options.length - initialLimit} more`}
                    </button>
                )}
            </div>
        </div>
    );
}

interface CollegeMentorFiltersProps {
    f: CollegeFiltersApi;
    resultCount: number;
    totalCount: number;
    view: CollegeView;
    onViewChange: (view: CollegeView) => void;
}

export default function CollegeMentorFilters({
    f,
    resultCount,
    totalCount,
    view,
    onViewChange,
}: CollegeMentorFiltersProps) {
    const [panelOpen, setPanelOpen] = useState(false);
    const { filters } = f;

    return (
        <div className="mb-5 space-y-3">
            {/* Top row: search + sort + view + filters */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#8b7355] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => f.setSearch(e.target.value)}
                        placeholder="Search by name, college, skill, degree or specialization..."
                        aria-label="Search college mentors"
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#e8ded5] bg-white text-sm text-[#2d2015] placeholder:text-[#a08070] focus:outline-none focus:border-[#3a2a1e] transition-colors"
                    />
                    {filters.search && (
                        <button
                            type="button"
                            onClick={() => f.setSearch("")}
                            aria-label="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7355] hover:text-[#2d2015]"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={filters.sort}
                            onChange={(e) => f.setSort(e.target.value as CollegeSort)}
                            aria-label="Sort mentors"
                            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-[#e8ded5] bg-white text-sm font-semibold text-[#3a2a1e] focus:outline-none focus:border-[#3a2a1e] cursor-pointer"
                        >
                            {SORT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#8b7355] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <div className="flex rounded-xl border border-[#e8ded5] bg-white overflow-hidden">
                        <button
                            type="button"
                            onClick={() => onViewChange("grid")}
                            aria-label="Grid view"
                            aria-pressed={view === "grid"}
                            className={`p-2.5 transition-colors ${view === "grid" ? "bg-[#3a2a1e] text-white" : "text-[#6b5643] hover:bg-[#f5ede5]"}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewChange("list")}
                            aria-label="List view"
                            aria-pressed={view === "list"}
                            className={`p-2.5 transition-colors ${view === "list" ? "bg-[#3a2a1e] text-white" : "text-[#6b5643] hover:bg-[#f5ede5]"}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setPanelOpen((v) => !v)}
                        aria-expanded={panelOpen}
                        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                            panelOpen || f.activeCount > 0
                                ? "bg-[#3a2a1e] text-white border-[#3a2a1e]"
                                : "bg-white text-[#3a2a1e] border-[#e8ded5] hover:border-[#3a2a1e]"
                        }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Filters</span>
                        {f.activeCount > 0 && (
                            <span className="px-1.5 rounded-full text-[11px] font-bold bg-[#d4a537] text-white">
                                {f.activeCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter panel */}
            {panelOpen && (
                <div className="rounded-2xl border border-[#e8ded5] bg-[#faf6f1] p-4 space-y-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8b7355] mb-2">Availability</p>
                        <button
                            type="button"
                            onClick={() => f.setFreeOnly(!filters.freeOnly)}
                            aria-pressed={filters.freeOnly}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                                filters.freeOnly
                                    ? "bg-[#3a2a1e] text-white border-[#3a2a1e]"
                                    : "bg-white text-[#6b5643] border-[#ebdcd0] hover:border-[#c4963a]"
                            }`}
                        >
                            Free session available
                        </button>
                    </div>

                    <ChipGroup title="Skills" options={f.skillOptions} selected={filters.skills} onToggle={f.toggleSkill} />
                    <ChipGroup title="College" options={f.collegeOptions} selected={filters.colleges} onToggle={f.toggleCollege} initialLimit={6} />
                    <ChipGroup title="Degree" options={f.degreeOptions} selected={filters.degrees} onToggle={f.toggleDegree} />

                    <div className="flex justify-end pt-1">
                        <button
                            type="button"
                            onClick={f.clearAll}
                            disabled={f.activeCount === 0}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#8b5e3c] hover:text-[#3a2a1e] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Clear all filters
                        </button>
                    </div>
                </div>
            )}

            {/* Result count + active chips */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[#2d2015]">
                    {resultCount} Mentor{resultCount === 1 ? "" : "s"} Found
                    {f.activeCount > 0 && (
                        <span className="font-medium text-[#8b7355]"> (of {totalCount})</span>
                    )}
                </span>

                {f.chips.map((chip) => (
                    <span
                        key={chip.id}
                        className="inline-flex items-center gap-1.5 max-w-[240px] pl-3 pr-2 py-1 rounded-full text-xs font-semibold bg-white text-[#3a2a1e] border border-[#e8ded5]"
                    >
                        <span className="truncate">{chip.label}</span>
                        <button
                            type="button"
                            onClick={chip.onRemove}
                            aria-label={`Remove filter ${chip.label}`}
                            className="text-[#8b7355] hover:text-red-600 shrink-0"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {f.activeCount > 0 && (
                    <button
                        type="button"
                        onClick={f.clearAll}
                        className="text-xs font-bold text-[#8b5e3c] hover:text-[#3a2a1e] underline underline-offset-2"
                    >
                        Clear all
                    </button>
                )}
            </div>
        </div>
    );
}