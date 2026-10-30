// src/features/mentorship/components/sections/CollegeMentorFilters.tsx
// Ek hi UNIFIED filter: Industry + College dono mentors par lagta hai.
// - Search + Mentor Type page ke top par
// - Sidebar me sirf chhote groups (top options + typeahead search)
// - Counts live update hote hain (0 result wale options chhup jaate hain)
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Search,
    X,
    Filter,
    SlidersHorizontal,
    LayoutGrid,
    List,
    ChevronDown,
} from "lucide-react";
import type { PublicSeniorMentor } from "@/lib/api/mentorship.service";
import { splitSkills } from "@/shared/utils/mentorFormat";

/* ─────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────── */

export type CollegeSort = "recommended" | "popular" | "name_asc" | "name_desc";
export type CollegeView = "grid" | "list";
export type MentorType = "all" | "industry" | "college";

type ListField = "skills" | "domains" | "exps" | "colleges" | "degrees";
type GroupKey = ListField | "search" | "available";

const GROUPS: GroupKey[] = ["search", "skills", "domains", "exps", "colleges", "degrees", "available"];

export interface FilterValues {
    search: string;
    type: MentorType;
    skills: string[]; // dono ke liye
    domains: string[]; // sirf industry
    exps: string[]; // sirf industry
    colleges: string[]; // sirf college
    degrees: string[]; // sirf college
    availableOnly: boolean; // dono ke liye: abhi book ho sakta hai
}

export interface FilterOption {
    key: string;
    label: string;
    count: number; // live count (baaki filters lagne ke baad)
}

export interface FilterChip {
    id: string;
    label: string;
    onRemove: () => void;
}

/** Industry mentor card ke jitne fields filter ke liye chahiye */
export interface IndustryFilterable {
    name: string;
    role: string;
    company: string;
    tags: string[];
    domains: string[];
    expTotal: number;
    acceptsBooking: boolean;
}

const EMPTY_FILTERS: FilterValues = {
    search: "",
    type: "all",
    skills: [],
    domains: [],
    exps: [],
    colleges: [],
    degrees: [],
    availableOnly: false,
};

const SORT_OPTIONS: { value: CollegeSort; label: string }[] = [
    { value: "recommended", label: "Recommended" },
    { value: "popular", label: "Most Popular" },
    { value: "name_asc", label: "Name (A–Z)" },
    { value: "name_desc", label: "Name (Z–A)" },
];

// Domain: sidebar labels -> API domain values
const DOMAIN_FILTERS: { key: string; api: string[] }[] = [
    { key: "Tech/Engineering", api: ["web_development", "interview_prep", "open_source"] },
    { key: "Product/Design", api: ["product_management", "ui_ux_design"] },
    { key: "Marketing/Growth", api: ["career_guidance", "entrepreneurship"] },
    { key: "Data Science/AI", api: ["data_science", "machine_learning"] },
];

// Experience: ranges overlap nahi karte (min <= years < max), isliye ek mentor sirf ek bucket me aata hai
const EXP_FILTERS: { key: string; min: number; max: number }[] = [
    { key: "0-3 Yrs", min: 0, max: 3 },
    { key: "3-7 Yrs", min: 3, max: 7 },
    { key: "7-12 Yrs", min: 7, max: 12 },
    { key: "12+ Yrs", min: 12, max: Number.POSITIVE_INFINITY },
];

const expBucketKey = (years: number): string | null =>
    EXP_FILTERS.find((e) => years >= e.min && years < e.max)?.key ?? null;

/* ─────────────────────────────────────────────────────────────
 * Normalisation helpers
 * ───────────────────────────────────────────────────────────── */

// Emoji / symbols (surrogate pairs + misc symbols/dingbats + variation selector + ZWJ)
const EMOJI_RE = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2190-\u2BFF\uFE0F\u200D]/g;

const ACRONYMS = new Set([
    "dsa", "ai", "ml", "sql", "aws", "api", "ui", "ux", "html", "css",
    "php", "oop", "oops", "iot", "nlp", "dbms", "os", "mern", "mean", "gcp",
]);

// Alag-alag likhe hue same skills ko ek me merge karne ke liye
// key = compact form (lowercase, sirf a-z 0-9 + #)
const SKILL_ALIASES: Record<string, string> = {
    react: "React.js",
    reactjs: "React.js",
    reactnative: "React Native",
    node: "Node.js",
    nodejs: "Node.js",
    express: "Express.js",
    expressjs: "Express.js",
    next: "Next.js",
    nextjs: "Next.js",
    mongo: "MongoDB",
    mongodb: "MongoDB",
    js: "JavaScript",
    javascript: "JavaScript",
    ts: "TypeScript",
    typescript: "TypeScript",
    mern: "MERN Stack",
    mernstack: "MERN Stack",
    mernstackdeveloper: "MERN Stack",
    mean: "MEAN Stack",
    meanstack: "MEAN Stack",
    cpp: "C++",
    "c++": "C++",
    "c#": "C#",
    csharp: "C#",
    dsa: "DSA",
    datastructures: "DSA",
    datastructuresandalgorithms: "DSA",
    datastructuresalgorithms: "DSA",
    ml: "Machine Learning",
    machinelearning: "Machine Learning",
    ai: "AI",
    artificialintelligence: "AI",
    aiml: "AI/ML",
    webdev: "Web Development",
    webdevelopment: "Web Development",
    html: "HTML",
    html5: "HTML",
    css: "CSS",
    css3: "CSS",
    sql: "SQL",
    mysql: "MySQL",
    postgres: "PostgreSQL",
    postgresql: "PostgreSQL",
    dbms: "DBMS",
    cybersecurity: "Cyber Security",
    cloudcomputing: "Cloud Computing",
    datascience: "Data Science",
    problemsolving: "Problem Solving",
};

// Ye skills sirf noise hain, filter options me nahi dikhate (search me phir bhi match hote hain)
const IGNORED_SKILL_KEYS = new Set(["mentor"]);

const stripPrefix = (s: string): string => s.replace(/^[^:]{2,40}:\s*/, "").trim();

const cleanSkillBase = (raw: string): string =>
    stripPrefix(raw.replace(EMOJI_RE, " "))
        .replace(/[_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const compactSkill = (s: string): string => s.toLowerCase().replace(/[^a-z0-9+#]/g, "");

const titleCase = (s: string): string => s.replace(/\b\w/g, (c) => c.toUpperCase());

const formatSkillWords = (base: string): string => {
    if (base !== base.toLowerCase()) return base; // pehle se properly formatted hai
    return base
        .split(" ")
        .map((w) =>
            ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
        )
        .join(" ");
};

interface ParsedSkill {
    key: string;
    label: string;
}

const parseSkill = (raw: string): ParsedSkill | null => {
    const base = cleanSkillBase(raw);
    if (!base) return null;
    const alias = SKILL_ALIASES[compactSkill(base)];
    if (alias) return { key: alias.toLowerCase(), label: alias };
    return { key: base.toLowerCase(), label: formatSkillWords(base) };
};

/** Card / list me dikhane ke liye clean skill label (emoji hata kar, canonical naam). */
export const getSkillLabel = (raw: string): string => parseSkill(raw)?.label ?? "";

// ── College ───────────────────────────────────────────────────

const COLLEGE_STOP = new Set(["of", "and", "the", "for", "in", "a"]);

const collegeKey = (raw: string): string => {
    const k = raw
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    // "o.i.s.t" -> "o i s t" -> "oist"
    return /^([a-z0-9] )+[a-z0-9]$/.test(k) ? k.replace(/ /g, "") : k;
};

const collegeLabel = (raw: string): string => {
    const base = raw.trim().replace(/[,.\s]+$/, "");
    return base === base.toLowerCase() ? titleCase(base) : base;
};

// ── Degree ────────────────────────────────────────────────────

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
 * Hook: ek hi filter state + live (faceted) counts
 * ───────────────────────────────────────────────────────────── */

interface IndexedIndustry<T> {
    mentor: T;
    skillKeys: Set<string>;
    domainKeys: Set<string>;
    expKey: string | null;
    available: boolean;
    haystack: string;
}

interface IndexedCollege {
    mentor: PublicSeniorMentor;
    skillKeys: Set<string>;
    collegeKey: string;
    degreeKey: string;
    available: boolean;
    haystack: string;
}

type Flags = Record<GroupKey, boolean>;

const toggleIn = (list: string[], value: string): string[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const bumpCount = (map: Map<string, number>, key: string) =>
    map.set(key, (map.get(key) ?? 0) + 1);

const allPass = (flags: Flags): boolean => GROUPS.every((g) => flags[g]);
// Ek group ko chhod kar baaki sab pass hain? (us group ke live count ke liye)
const othersPass = (flags: Flags, skip: GroupKey): boolean =>
    GROUPS.every((g) => g === skip || flags[g]);

export function useMentorFilters<T extends IndustryFilterable>(
    industry: T[],
    college: PublicSeniorMentor[]
) {
    const [values, setValues] = useState<FilterValues>(EMPTY_FILTERS);
    const [sort, setSort] = useState<CollegeSort>("recommended");

    /* 1) Index: ek baar banta hai jab mentors change hon */
    const index = useMemo(() => {
        // College names: "OIST" ko "Oriental Institute of Science & Technology" me merge karo
        const collegeLabels = new Map<string, string>();
        college.forEach((m) => {
            if (!m.college?.trim()) return;
            const k = collegeKey(m.college);
            if (!k) return;
            const label = collegeLabel(m.college);
            const prev = collegeLabels.get(k);
            if (!prev || label.length > prev.length) collegeLabels.set(k, label);
        });

        const acronyms = new Map<string, string>();
        collegeLabels.forEach((_label, k) => {
            const words = k.split(" ");
            if (words.length < 2) return;
            const acr = words
                .filter((w) => !COLLEGE_STOP.has(w))
                .map((w) => w[0])
                .join("");
            if (acr.length >= 2 && !acronyms.has(acr)) acronyms.set(acr, k);
        });

        const canonCollege = (raw: string): string => {
            const k = collegeKey(raw);
            if (k && !k.includes(" ")) {
                const full = acronyms.get(k);
                if (full) return full;
            }
            return k;
        };

        const skillLabels = new Map<string, string>();
        const degreeLabels = new Map<string, string>();

        const parseAll = (rawList: string[]): Map<string, ParsedSkill> => {
            const parsed = new Map<string, ParsedSkill>();
            rawList.forEach((raw) => {
                const p = parseSkill(raw);
                if (p && !parsed.has(p.key)) parsed.set(p.key, p);
            });
            parsed.forEach((p) => {
                if (!IGNORED_SKILL_KEYS.has(p.key) && !skillLabels.has(p.key)) skillLabels.set(p.key, p.label);
            });
            return parsed;
        };

        const indexedIndustry: IndexedIndustry<T>[] = industry.map((mentor) => {
            const parsed = parseAll(mentor.tags || []);
            const domainKeys = new Set(
                DOMAIN_FILTERS.filter((d) => (mentor.domains || []).some((x) => d.api.includes(x))).map((d) => d.key)
            );
            return {
                mentor,
                skillKeys: new Set(Array.from(parsed.keys()).filter((k) => !IGNORED_SKILL_KEYS.has(k))),
                domainKeys,
                expKey: expBucketKey(mentor.expTotal),
                available: Boolean(mentor.acceptsBooking),
                haystack: [
                    mentor.name,
                    mentor.role,
                    mentor.company,
                    ...Array.from(parsed.values()).map((p) => p.label),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase(),
            };
        });

        const indexedCollege: IndexedCollege[] = college.map((mentor) => {
            const parsed = parseAll(splitSkills(mentor.skills));
            const cKey = mentor.college?.trim() ? canonCollege(mentor.college) : "";
            const dKey = mentor.degree?.trim() ? degreeKey(mentor.degree) : "";
            if (dKey && !degreeLabels.has(dKey)) degreeLabels.set(dKey, degreeLabel(mentor.degree));

            return {
                mentor,
                skillKeys: new Set(Array.from(parsed.keys()).filter((k) => !IGNORED_SKILL_KEYS.has(k))),
                collegeKey: cKey,
                degreeKey: dKey,
                available: Boolean(mentor.sessionId),
                haystack: [
                    mentor.displayName,
                    mentor.college,
                    cKey ? collegeLabels.get(cKey) : "",
                    mentor.degree,
                    mentor.fieldOfStudy,
                    ...Array.from(parsed.values()).map((p) => p.label),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase(),
            };
        });

        return { indexedIndustry, indexedCollege, skillLabels, collegeLabels, degreeLabels };
    }, [industry, college]);

    /* 2) Har mentor ke liye: kaun sa filter group pass ho raha hai */
    const q = values.search.trim().toLowerCase();

    const industryFlags = useCallback(
        (it: IndexedIndustry<T>): Flags => ({
            search: !q || it.haystack.includes(q),
            skills: values.skills.length === 0 || values.skills.some((k) => it.skillKeys.has(k)),
            domains: values.domains.length === 0 || values.domains.some((d) => it.domainKeys.has(d)),
            exps: values.exps.length === 0 || (it.expKey !== null && values.exps.includes(it.expKey)),
            colleges: true, // industry mentors par college/degree filter nahi lagta
            degrees: true,
            available: !values.availableOnly || it.available,
        }),
        [q, values]
    );

    const collegeFlags = useCallback(
        (it: IndexedCollege): Flags => ({
            search: !q || it.haystack.includes(q),
            skills: values.skills.length === 0 || values.skills.some((k) => it.skillKeys.has(k)),
            domains: true, // college mentors par domain/experience filter nahi lagta
            exps: true,
            colleges: values.colleges.length === 0 || values.colleges.includes(it.collegeKey),
            degrees: values.degrees.length === 0 || values.degrees.includes(it.degreeKey),
            available: !values.availableOnly || it.available,
        }),
        [q, values]
    );

    /* 3) Filtered lists */
    const filteredIndustry = useMemo<T[]>(
        () => index.indexedIndustry.filter((it) => allPass(industryFlags(it))).map((it) => it.mentor),
        [index.indexedIndustry, industryFlags]
    );

    const filteredCollege = useMemo<PublicSeniorMentor[]>(() => {
        const result = index.indexedCollege.filter((it) => allPass(collegeFlags(it)));

        switch (sort) {
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

        return result.map((it) => it.mentor);
    }, [index.indexedCollege, collegeFlags, sort]);

    /* 4) LIVE counts: har group ka count baaki sab filters lagne ke baad */
    const facets = useMemo(() => {
        const skills = new Map<string, number>();
        const domains = new Map<string, number>();
        const exps = new Map<string, number>();
        const colleges = new Map<string, number>();
        const degrees = new Map<string, number>();
        let available = 0;

        // Jo type hidden hai uske mentors counts me na ginein
        if (values.type !== "college") {
            index.indexedIndustry.forEach((it) => {
                const flags = industryFlags(it);
                if (othersPass(flags, "skills")) it.skillKeys.forEach((k) => bumpCount(skills, k));
                if (othersPass(flags, "domains")) it.domainKeys.forEach((k) => bumpCount(domains, k));
                if (othersPass(flags, "exps") && it.expKey) bumpCount(exps, it.expKey);
                if (othersPass(flags, "available") && it.available) available += 1;
            });
        }
        if (values.type !== "industry") {
            index.indexedCollege.forEach((it) => {
                const flags = collegeFlags(it);
                if (othersPass(flags, "skills")) it.skillKeys.forEach((k) => bumpCount(skills, k));
                if (othersPass(flags, "colleges") && it.collegeKey) bumpCount(colleges, it.collegeKey);
                if (othersPass(flags, "degrees") && it.degreeKey) bumpCount(degrees, it.degreeKey);
                if (othersPass(flags, "available") && it.available) available += 1;
            });
        }

        const toOptions = (labels: Map<string, string>, counts: Map<string, number>): FilterOption[] =>
            Array.from(labels.entries())
                .map(([key, label]) => ({ key, label, count: counts.get(key) ?? 0 }))
                .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

        return {
            skillOptions: toOptions(index.skillLabels, skills),
            collegeOptions: toOptions(index.collegeLabels, colleges),
            degreeOptions: toOptions(index.degreeLabels, degrees),
            domainOptions: DOMAIN_FILTERS.map((d) => ({
                key: d.key,
                label: d.key,
                count: domains.get(d.key) ?? 0,
            })),
            expOptions: EXP_FILTERS.map((e) => ({
                key: e.key,
                label: e.key,
                count: exps.get(e.key) ?? 0,
            })),
            availableCount: available,
        };
    }, [index, values.type, industryFlags, collegeFlags]);

    /* setters */
    const setSearch = useCallback((search: string) => setValues((v) => ({ ...v, search })), []);
    const setType = useCallback((type: MentorType) => setValues((v) => ({ ...v, type })), []);
    const setAvailableOnly = useCallback(
        (availableOnly: boolean) => setValues((v) => ({ ...v, availableOnly })),
        []
    );
    const toggle = useCallback(
        (field: ListField, key: string) =>
            setValues((v) => ({ ...v, [field]: toggleIn(v[field], key) })),
        []
    );
    const clearAll = useCallback(() => setValues(EMPTY_FILTERS), []);

    const activeCount =
        (values.search.trim() ? 1 : 0) +
        values.skills.length +
        values.domains.length +
        values.exps.length +
        values.colleges.length +
        values.degrees.length +
        (values.availableOnly ? 1 : 0);

    // Mobile button ke liye: abhi screen par kitne mentors dikhenge
    const visibleTotal =
        (values.type !== "college" ? filteredIndustry.length : 0) +
        (values.type !== "industry" ? filteredCollege.length : 0);

    const chips: FilterChip[] = useMemo(() => {
        const list: FilterChip[] = [];
        const remove = (field: ListField, key: string) =>
            setValues((v) => ({ ...v, [field]: v[field].filter((x) => x !== key) }));

        if (values.search.trim()) {
            list.push({
                id: "search",
                label: `Search: ${values.search.trim()}`,
                onRemove: () => setValues((v) => ({ ...v, search: "" })),
            });
        }
        values.skills.forEach((k) =>
            list.push({
                id: `skill-${k}`,
                label: index.skillLabels.get(k) ?? k,
                onRemove: () => remove("skills", k),
            })
        );
        values.domains.forEach((k) =>
            list.push({ id: `domain-${k}`, label: k, onRemove: () => remove("domains", k) })
        );
        values.exps.forEach((k) =>
            list.push({ id: `exp-${k}`, label: k, onRemove: () => remove("exps", k) })
        );
        values.colleges.forEach((k) =>
            list.push({
                id: `college-${k}`,
                label: index.collegeLabels.get(k) ?? k,
                onRemove: () => remove("colleges", k),
            })
        );
        values.degrees.forEach((k) =>
            list.push({
                id: `degree-${k}`,
                label: index.degreeLabels.get(k) ?? k,
                onRemove: () => remove("degrees", k),
            })
        );
        if (values.availableOnly) {
            list.push({
                id: "available",
                label: "Bookable now",
                onRemove: () => setValues((v) => ({ ...v, availableOnly: false })),
            });
        }
        return list;
    }, [values, index]);

    return {
        values,
        sort,
        setSort,
        filteredIndustry,
        filteredCollege,
        totalIndustry: industry.length,
        totalCollege: college.length,
        visibleTotal,
        ...facets,
        activeCount,
        chips,
        setSearch,
        setType,
        setAvailableOnly,
        toggle,
        clearAll,
    };
}

export type MentorFiltersApi = ReturnType<typeof useMentorFilters>;

/* ─────────────────────────────────────────────────────────────
 * UI: page ke top par Search + Mentor Type tabs
 * ───────────────────────────────────────────────────────────── */

export function MentorTopBar({
    f,
    onOpenFilters,
}: {
    f: MentorFiltersApi;
    onOpenFilters: () => void;
}) {
    const { values } = f;

    const tabs: { value: MentorType; label: string; count: number }[] = [
        { value: "all", label: "All Mentors", count: f.filteredIndustry.length + f.filteredCollege.length },
        { value: "industry", label: "Industry", count: f.filteredIndustry.length },
        { value: "college", label: "College", count: f.filteredCollege.length },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={values.search}
                        onChange={(e) => f.setSearch(e.target.value)}
                        placeholder="Search by name, company, college or skill..."
                        aria-label="Search mentors"
                        className="w-full pl-12 pr-11 py-3.5 rounded-2xl border border-[#ece7e2] bg-white text-sm font-medium text-[#2d2015] placeholder:text-slate-400 shadow-sm focus:outline-none focus:border-[#4a3728] focus:ring-2 focus:ring-[#4a3728]/10 transition"
                    />
                    {values.search && (
                        <button
                            type="button"
                            onClick={() => f.setSearch("")}
                            aria-label="Clear search text"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4a3728]"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Mobile par filter panel kholne ka button */}
                <button
                    type="button"
                    onClick={onOpenFilters}
                    className={`lg:hidden flex items-center gap-2 px-4 py-3.5 rounded-2xl border text-sm font-bold transition-colors ${
                        f.activeCount > 0
                            ? "bg-[#3a2a1e] text-white border-[#3a2a1e]"
                            : "bg-white text-[#3a2a1e] border-[#ece7e2]"
                    }`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {f.activeCount > 0 && (
                        <span className="px-1.5 rounded-full text-[11px] font-bold bg-[#d4a537] text-white">
                            {f.activeCount}
                        </span>
                    )}
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {tabs.map((t) => (
                    <button
                        key={t.value}
                        type="button"
                        onClick={() => f.setType(t.value)}
                        aria-pressed={values.type === t.value}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                            values.type === t.value
                                ? "bg-[#4a3728] text-white border-[#4a3728] shadow-sm"
                                : "bg-white text-[#6b5643] border-[#ece7e2] hover:border-[#8b7355]"
                        }`}
                    >
                        {t.label}
                        <span
                            className={`text-[11px] font-black px-1.5 rounded-full ${
                                values.type === t.value ? "bg-white/20 text-white" : "bg-[#f8f6f4] text-[#8b7355]"
                            }`}
                        >
                            {t.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
 * UI: typeahead (type karo -> suggestions -> click karke select)
 * ───────────────────────────────────────────────────────────── */

const LABEL_CLASS = "text-[10px] font-black uppercase text-slate-400 tracking-widest";

function SearchPicker({
    options,
    selected,
    onSelect,
    placeholder,
}: {
    options: FilterOption[];
    selected: string[];
    onSelect: (key: string) => void;
    placeholder: string;
}) {
    const [text, setText] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    const needle = text.trim().toLowerCase();
    const matches = needle
        ? options
              .filter((o) => o.count > 0 && !selected.includes(o.key) && o.label.toLowerCase().includes(needle))
              .slice(0, 8)
        : [];

    const pick = (key: string) => {
        onSelect(key);
        setText("");
        setOpen(false);
        setActive(0);
    };

    return (
        <div ref={ref} className="relative">
            <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                    type="text"
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        setOpen(true);
                        setActive(0);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setActive((p) => (matches.length ? (p + 1) % matches.length : 0));
                        } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setActive((p) => (matches.length ? (p <= 0 ? matches.length - 1 : p - 1) : 0));
                        } else if (e.key === "Enter") {
                            e.preventDefault();
                            if (matches[active]) pick(matches[active].key);
                        } else if (e.key === "Escape") {
                            setOpen(false);
                        }
                    }}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#ece7e2] bg-[#f8f6f4] text-xs font-medium text-[#2d2015] placeholder:text-slate-400 focus:outline-none focus:border-[#4a3728] transition-colors"
                />
            </div>

            {open && needle && (
                <div className="absolute left-0 right-0 z-30 mt-1.5 bg-white border border-[#ece7e2] rounded-xl shadow-xl overflow-hidden">
                    {matches.length > 0 ? (
                        <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
                            {matches.map((o, idx) => (
                                <li
                                    key={o.key}
                                    role="option"
                                    aria-selected={idx === active}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        pick(o.key);
                                    }}
                                    onMouseEnter={() => setActive(idx)}
                                    className={`flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold cursor-pointer ${
                                        idx === active ? "bg-[#f8f6f4] text-[#4a3728]" : "text-slate-700"
                                    }`}
                                >
                                    <span className="truncate">{o.label}</span>
                                    <span className="text-[10px] font-black text-slate-400 shrink-0">{o.count}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="px-3 py-2.5 text-xs font-medium text-[#8b7355]">No match found.</p>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
 * UI: ek filter group = chuni hui + top N popular + typeahead
 * ───────────────────────────────────────────────────────────── */

function FacetGroup({
    title,
    hint,
    options,
    selected,
    onToggle,
    topN,
    searchPlaceholder,
}: {
    title: string;
    hint?: string;
    options: FilterOption[];
    selected: string[];
    onToggle: (key: string) => void;
    topN: number;
    searchPlaceholder?: string;
}) {
    const selectedOptions = selected
        .map((k) => options.find((o) => o.key === k))
        .filter((o): o is FilterOption => Boolean(o));
    // Sirf wahi options jinse kuch result milta hai
    const available = options.filter((o) => o.count > 0 && !selected.includes(o.key));
    const shown = [...selectedOptions, ...available.slice(0, topN)];

    if (shown.length === 0) return null;

    const moreCount = Math.max(0, available.length - topN);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <p className={LABEL_CLASS}>{title}</p>
                {hint && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f8f6f4] text-[#8b7355] border border-[#ece7e2]">
                        {hint}
                    </span>
                )}
            </div>

            <div className="space-y-2.5">
                {shown.map((o) => (
                    <label key={o.key} className="flex items-start gap-3 text-sm font-bold cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={selected.includes(o.key)}
                            onChange={() => onToggle(o.key)}
                            className="accent-[#4a3728] w-4 h-4 mt-0.5 shrink-0 rounded border-[#ece7e2]"
                        />
                        <span className="flex-1 min-w-0 leading-snug break-words group-hover:text-[#8b7355] transition-colors">
                            {o.label}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 mt-1 shrink-0">{o.count}</span>
                    </label>
                ))}
            </div>

            {searchPlaceholder && moreCount > 0 && (
                <div className="space-y-1.5">
                    <SearchPicker
                        options={options}
                        selected={selected}
                        onSelect={onToggle}
                        placeholder={searchPlaceholder}
                    />
                    <p className="text-[10px] font-semibold text-slate-400">
                        +{moreCount} more, search to find
                    </p>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
 * UI: sidebar (desktop) / full-screen panel (mobile)
 * ───────────────────────────────────────────────────────────── */

export function MentorFilterSidebar({
    f,
    mobileOpen,
    onMobileClose,
}: {
    f: MentorFiltersApi;
    mobileOpen: boolean;
    onMobileClose: () => void;
}) {
    const { values } = f;

    // Mobile panel khula ho to page scroll lock
    useEffect(() => {
        if (!mobileOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [mobileOpen]);

    const showIndustryGroups = values.type !== "college";
    const showCollegeGroups = values.type !== "industry";
    const showHints = values.type === "all";

    return (
        <aside className="lg:self-start lg:sticky lg:top-28">
            <div
                className={
                    mobileOpen
                        ? "fixed inset-0 z-50 flex flex-col bg-white lg:static lg:block lg:bg-transparent"
                        : "hidden lg:block"
                }
            >
                {/* Mobile header */}
                <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-[#ece7e2]">
                    <h4 className="flex items-center gap-2 text-sm font-black text-[#4a3728]">
                        <Filter className="w-4 h-4" /> Filters
                        {f.activeCount > 0 && (
                            <span className="px-1.5 rounded-full text-[11px] font-bold bg-[#d4a537] text-white">
                                {f.activeCount}
                            </span>
                        )}
                    </h4>
                    <button
                        type="button"
                        onClick={onMobileClose}
                        aria-label="Close filters"
                        className="w-9 h-9 rounded-full bg-[#f8f6f4] flex items-center justify-center text-[#4a3728]"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-5 lg:overflow-visible lg:flex-none lg:px-6 lg:py-6 lg:bg-white lg:border lg:border-[#ece7e2] lg:rounded-[28px] lg:shadow-sm">
                    <div className="hidden lg:flex items-center justify-between mb-6">
                        <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[3px] text-[#8b7355]">
                            <Filter className="w-4 h-4" /> Refine
                            {f.activeCount > 0 && (
                                <span className="px-1.5 rounded-full text-[10px] font-bold bg-[#d4a537] text-white tracking-normal">
                                    {f.activeCount}
                                </span>
                            )}
                        </h4>
                        {f.activeCount > 0 && (
                            <button
                                type="button"
                                onClick={f.clearAll}
                                className="text-[11px] font-bold text-[#8b5e3c] hover:text-[#3a2a1e] underline underline-offset-2"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    <div className="space-y-7">
                        {/* Availability */}
                        <div className="space-y-3">
                            <p className={LABEL_CLASS}>Availability</p>
                            <label className="flex items-start gap-3 text-sm font-bold cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={values.availableOnly}
                                    onChange={(e) => f.setAvailableOnly(e.target.checked)}
                                    className="accent-[#4a3728] w-4 h-4 mt-0.5 shrink-0 rounded border-[#ece7e2]"
                                />
                                <span className="flex-1 leading-snug group-hover:text-[#8b7355] transition-colors">
                                    Bookable now
                                </span>
                                <span className="text-[10px] font-black text-slate-400 mt-1 shrink-0">
                                    {f.availableCount}
                                </span>
                            </label>
                        </div>

                        {showIndustryGroups && (
                            <>
                                <FacetGroup
                                    title="Experience"
                                    hint={showHints ? "Industry" : undefined}
                                    options={f.expOptions}
                                    selected={values.exps}
                                    onToggle={(k) => f.toggle("exps", k)}
                                    topN={4}
                                />
                                <FacetGroup
                                    title="Domain"
                                    hint={showHints ? "Industry" : undefined}
                                    options={f.domainOptions}
                                    selected={values.domains}
                                    onToggle={(k) => f.toggle("domains", k)}
                                    topN={4}
                                />
                            </>
                        )}

                        <FacetGroup
                            title="Skills"
                            options={f.skillOptions}
                            selected={values.skills}
                            onToggle={(k) => f.toggle("skills", k)}
                            topN={6}
                            searchPlaceholder="Search skills..."
                        />

                        {showCollegeGroups && (
                            <>
                                <FacetGroup
                                    title="College"
                                    hint={showHints ? "College" : undefined}
                                    options={f.collegeOptions}
                                    selected={values.colleges}
                                    onToggle={(k) => f.toggle("colleges", k)}
                                    topN={5}
                                    searchPlaceholder="Search college..."
                                />
                                <FacetGroup
                                    title="Degree"
                                    hint={showHints ? "College" : undefined}
                                    options={f.degreeOptions}
                                    selected={values.degrees}
                                    onToggle={(k) => f.toggle("degrees", k)}
                                    topN={5}
                                    searchPlaceholder="Search degree..."
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile footer */}
                <div className="lg:hidden flex items-center gap-3 px-5 py-4 border-t border-[#ece7e2] bg-white">
                    <button
                        type="button"
                        onClick={f.clearAll}
                        disabled={f.activeCount === 0}
                        className="px-5 py-3 rounded-2xl bg-[#f8f6f4] text-[#4a3728] text-xs font-black uppercase tracking-widest disabled:opacity-50"
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        onClick={onMobileClose}
                        className="flex-1 py-3 rounded-2xl bg-[#4a3728] text-white text-sm font-bold"
                    >
                        Show {f.visibleTotal} mentor{f.visibleTotal === 1 ? "" : "s"}
                    </button>
                </div>
            </div>
        </aside>
    );
}

/* ─────────────────────────────────────────────────────────────
 * UI: selected filters ke chips
 * ───────────────────────────────────────────────────────────── */

export function ActiveFilterChips({ f }: { f: MentorFiltersApi }) {
    if (f.chips.length === 0) return null;
    return (
        <div className="flex flex-wrap items-center gap-2">
            {f.chips.map((chip) => (
                <span
                    key={chip.id}
                    className="inline-flex items-center gap-1.5 max-w-[260px] pl-3 pr-2 py-1 rounded-full text-xs font-semibold bg-white text-[#3a2a1e] border border-[#e8ded5]"
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
            <button
                type="button"
                onClick={f.clearAll}
                className="text-xs font-bold text-[#8b5e3c] hover:text-[#3a2a1e] underline underline-offset-2"
            >
                Clear all
            </button>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
 * UI: College section ka result count + sort + grid/list toggle
 * ───────────────────────────────────────────────────────────── */

interface CollegeResultsBarProps {
    resultCount: number;
    totalCount: number;
    filtersActive: boolean;
    sort: CollegeSort;
    onSortChange: (sort: CollegeSort) => void;
    view: CollegeView;
    onViewChange: (view: CollegeView) => void;
}

export function CollegeResultsBar({
    resultCount,
    totalCount,
    filtersActive,
    sort,
    onSortChange,
    view,
    onViewChange,
}: CollegeResultsBarProps) {
    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#2d2015]">
                {resultCount} Mentor{resultCount === 1 ? "" : "s"} Found
                {filtersActive && <span className="font-medium text-[#8b7355]"> (of {totalCount})</span>}
            </p>

            <div className="flex items-center gap-2">
                <div className="relative">
                    <select
                        value={sort}
                        onChange={(e) => onSortChange(e.target.value as CollegeSort)}
                        aria-label="Sort mentors"
                        className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#e8ded5] bg-white text-sm font-semibold text-[#3a2a1e] focus:outline-none focus:border-[#3a2a1e] cursor-pointer"
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
                        className={`p-2 transition-colors ${view === "grid" ? "bg-[#3a2a1e] text-white" : "text-[#6b5643] hover:bg-[#f5ede5]"}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewChange("list")}
                        aria-label="List view"
                        aria-pressed={view === "list"}
                        className={`p-2 transition-colors ${view === "list" ? "bg-[#3a2a1e] text-white" : "text-[#6b5643] hover:bg-[#f5ede5]"}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}