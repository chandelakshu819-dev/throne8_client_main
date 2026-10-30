// src/features/mentorship/components/sections/CollegeMentorFilters.tsx
// Ek hi UNIFIED filter: Industry + College dono mentors par lagta hai.
// - Search + Mentor Type page ke top par
// - Sidebar: collapsible groups, "Show all" toggle, typeahead search
// - Counts live update hote hain (0 result wale options chhup jaate hain)
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Search,
    X,
    SlidersHorizontal,
    LayoutGrid,
    List,
    ChevronDown,
    Check,
    RotateCcw,
} from "lucide-react";
import type { PublicSeniorMentor } from "@/lib/api/mentorship.service";
import { splitSkills } from "@/shared/utils/mentorFormat";

/* ─────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────── */

export type CollegeSort = "recommended" | "popular" | "name_asc" | "name_desc";
export type CollegeView = "grid" | "list";
export type MentorType = "all" | "industry" | "college";

type ListField = "skills" | "domains" | "exps" | "colleges" | "degrees" | "years" | "locations";
type GroupKey = ListField | "search" | "available";

const GROUPS: GroupKey[] = ["search", "skills", "domains", "exps", "colleges", "degrees", "years", "locations", "available"];

// Kaun sa filter kis type ke mentors par lagta hai
const INDUSTRY_ONLY_FIELDS: ListField[] = ["domains", "exps"];
const COLLEGE_ONLY_FIELDS: ListField[] = ["colleges", "degrees", "years", "locations"];

export interface FilterValues {
    search: string;
    type: MentorType;
    skills: string[]; // dono ke liye
    domains: string[]; // sirf industry
    exps: string[]; // sirf industry
    colleges: string[]; // sirf college
    degrees: string[]; // sirf college
    years: string[]; // sirf college (graduation year)
    locations: string[]; // sirf college
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
    years: [],
    locations: [],
    availableOnly: false,
};

const SORT_OPTIONS: { value: CollegeSort; label: string }[] = [
    { value: "recommended", label: "Recommended" },
    { value: "popular", label: "Most popular" },
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

// Experience: chhote buckets (min <= years < max), ek mentor sirf ek bucket me aata hai
const EXP_FILTERS: { key: string; min: number; max: number }[] = [
    { key: "0-1 Yr", min: 0, max: 1 },
    { key: "1-2 Yrs", min: 1, max: 2 },
    { key: "2-3 Yrs", min: 2, max: 3 },
    { key: "3-5 Yrs", min: 3, max: 5 },
    { key: "5-8 Yrs", min: 5, max: 8 },
    { key: "8-12 Yrs", min: 8, max: 12 },
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

// ── Graduation year / Location: backend ke alag-alag field names ──

const firstNonEmpty = (...values: unknown[]): unknown =>
    values.find((v) => v !== undefined && v !== null && String(v).trim() !== "");

// "2025", 2025, "Batch of 2025", "2021-2025" (last year lega) -> "2025"
const readGraduationYear = (m: any): string => {
    const raw = firstNonEmpty(
        m.graduationYear,
        m.passingYear,
        m.passoutYear,
        m.yearOfGraduation,
        m.yearOfPassing,
        m.graduation_year,
        m.passing_year,
        m.batch,
        m.endYear,
        m.user?.graduationYear
    );
    if (raw === undefined) return "";
    const years = String(raw).match(/(19|20)\d{2}/g);
    if (!years || years.length === 0) return "";
    const year = Number(years[years.length - 1]);
    return year >= 1980 && year <= 2100 ? String(year) : "";
};

// city + state mile to "City, State", warna jo bhi location field mile
const readLocation = (m: any): string => {
    const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
    const city = str(firstNonEmpty(m.city, m.collegeCity, m.user?.city));
    const state = str(firstNonEmpty(m.state, m.collegeState, m.user?.state));
    if (city && state) return `${city}, ${state}`;
    if (city || state) return city || state;
    return str(
        firstNonEmpty(m.location, m.collegeLocation, m.address, m.currentCity, m.user?.location)
    );
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
    yearKey: string;
    locationKey: string;
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
        const yearLabels = new Map<string, string>();
        const locationLabels = new Map<string, string>();

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

            // Graduation year aur location: backend jo field bheje wahi padhte hain
            const anyM = mentor as any;
            const yKey = readGraduationYear(anyM);
            if (yKey && !yearLabels.has(yKey)) yearLabels.set(yKey, yKey);

            const rawLoc = readLocation(anyM);
            const lKey = rawLoc.toLowerCase().replace(/\s+/g, " ");
            if (lKey && !locationLabels.has(lKey)) locationLabels.set(lKey, collegeLabel(rawLoc));

            return {
                mentor,
                skillKeys: new Set(Array.from(parsed.keys()).filter((k) => !IGNORED_SKILL_KEYS.has(k))),
                collegeKey: cKey,
                degreeKey: dKey,
                yearKey: yKey,
                locationKey: lKey,
                available: Boolean(mentor.sessionId),
                haystack: [
                    mentor.displayName,
                    mentor.college,
                    cKey ? collegeLabels.get(cKey) : "",
                    mentor.degree,
                    mentor.fieldOfStudy,
                    yKey,
                    lKey ? locationLabels.get(lKey) : "",
                    ...Array.from(parsed.values()).map((p) => p.label),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase(),
            };
        });

        return { indexedIndustry, indexedCollege, skillLabels, collegeLabels, degreeLabels, yearLabels, locationLabels };
    }, [industry, college]);

    /* 2) Har mentor ke liye: kaun sa filter group pass ho raha hai */
    const q = values.search.trim().toLowerCase();

    // Industry mentors par college-only filter lage ho to wo match nahi karte
    // (pehle ye hamesha pass hote the, jo user ko galat lagta tha)
    const industryFlags = useCallback(
        (it: IndexedIndustry<T>): Flags => ({
            search: !q || it.haystack.includes(q),
            skills: values.skills.length === 0 || values.skills.some((k) => it.skillKeys.has(k)),
            domains: values.domains.length === 0 || values.domains.some((d) => it.domainKeys.has(d)),
            exps: values.exps.length === 0 || (it.expKey !== null && values.exps.includes(it.expKey)),
            colleges: values.colleges.length === 0,
            degrees: values.degrees.length === 0,
            years: values.years.length === 0,
            locations: values.locations.length === 0,
            available: !values.availableOnly || it.available,
        }),
        [q, values]
    );

    // College mentors par domain / experience filter lage ho to wo match nahi karte
    const collegeFlags = useCallback(
        (it: IndexedCollege): Flags => ({
            search: !q || it.haystack.includes(q),
            skills: values.skills.length === 0 || values.skills.some((k) => it.skillKeys.has(k)),
            domains: values.domains.length === 0,
            exps: values.exps.length === 0,
            colleges: values.colleges.length === 0 || values.colleges.includes(it.collegeKey),
            degrees: values.degrees.length === 0 || values.degrees.includes(it.degreeKey),
            years: values.years.length === 0 || values.years.includes(it.yearKey),
            locations: values.locations.length === 0 || values.locations.includes(it.locationKey),
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
        const years = new Map<string, number>();
        const locations = new Map<string, number>();
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
                if (othersPass(flags, "years") && it.yearKey) bumpCount(years, it.yearKey);
                if (othersPass(flags, "locations") && it.locationKey) bumpCount(locations, it.locationKey);
                if (othersPass(flags, "available") && it.available) available += 1;
            });
        }

        const toOptions = (labels: Map<string, string>, counts: Map<string, number>): FilterOption[] =>
            Array.from(labels.entries())
                .map(([key, label]) => ({ key, label, count: counts.get(key) ?? 0 }))
                .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

        // Year: naya batch pehle (2026, 2025, ...)
        const yearOptions = toOptions(index.yearLabels, years).sort((a, b) => Number(b.key) - Number(a.key));

        return {
            skillOptions: toOptions(index.skillLabels, skills),
            collegeOptions: toOptions(index.collegeLabels, colleges),
            degreeOptions: toOptions(index.degreeLabels, degrees),
            yearOptions,
            locationOptions: toOptions(index.locationLabels, locations),
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

    // Type badalne par jo filters ab dikhte hi nahi, unhe hata do (warna chupke se results kam kar dete)
    const setType = useCallback((type: MentorType) => {
        setValues((v) => {
            const next: FilterValues = { ...v, type };
            if (type === "industry") COLLEGE_ONLY_FIELDS.forEach((f) => (next[f] = []));
            if (type === "college") INDUSTRY_ONLY_FIELDS.forEach((f) => (next[f] = []));
            return next;
        });
    }, []);

    const setAvailableOnly = useCallback(
        (availableOnly: boolean) => setValues((v) => ({ ...v, availableOnly })),
        []
    );
    const toggle = useCallback(
        (field: ListField, key: string) =>
            setValues((v) => ({ ...v, [field]: toggleIn(v[field], key) })),
        []
    );
    // Clear all: search + filters saaf, par Mentor Type tab wahi rahe
    const clearAll = useCallback(() => setValues((v) => ({ ...EMPTY_FILTERS, type: v.type })), []);

    const activeCount =
        (values.search.trim() ? 1 : 0) +
        values.skills.length +
        values.domains.length +
        values.exps.length +
        values.colleges.length +
        values.degrees.length +
        values.years.length +
        values.locations.length +
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
        values.years.forEach((k) =>
            list.push({ id: `year-${k}`, label: `Graduated ${k}`, onRemove: () => remove("years", k) })
        );
        values.locations.forEach((k) =>
            list.push({
                id: `location-${k}`,
                label: index.locationLabels.get(k) ?? k,
                onRemove: () => remove("locations", k),
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
 * UI: page ke top par Search + Mentor Type
 * ───────────────────────────────────────────────────────────── */

const FOCUS_RING =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a3728]/40 focus-visible:ring-offset-1";

export function MentorTopBar({
    f,
    onOpenFilters,
}: {
    f: MentorFiltersApi;
    onOpenFilters: () => void;
}) {
    const { values } = f;

    const tabs: { value: MentorType; label: string; count: number }[] = [
        { value: "all", label: "All mentors", count: f.filteredIndustry.length + f.filteredCollege.length },
        { value: "industry", label: "Industry", count: f.filteredIndustry.length },
        { value: "college", label: "College", count: f.filteredCollege.length },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 text-[#a89580] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={values.search}
                        onChange={(e) => f.setSearch(e.target.value)}
                        placeholder="Search by name, company, college, year, location or skill"
                        aria-label="Search mentors"
                        className="w-full pl-12 pr-11 py-3.5 rounded-2xl border border-[#e8ded5] bg-white text-sm font-medium text-[#2d2015] placeholder:text-[#a89580] shadow-sm focus:outline-none focus:border-[#4a3728] focus:ring-4 focus:ring-[#4a3728]/10 transition"
                    />
                    {values.search && (
                        <button
                            type="button"
                            onClick={() => f.setSearch("")}
                            aria-label="Clear search text"
                            className={`absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[#8b7355] hover:bg-[#f5ede5] hover:text-[#4a3728] transition-colors ${FOCUS_RING}`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Mobile par filter panel kholne ka button */}
                <button
                    type="button"
                    onClick={onOpenFilters}
                    className={`lg:hidden relative flex items-center gap-2 px-4 py-3.5 rounded-2xl border text-sm font-bold transition-colors ${FOCUS_RING} ${
                        f.activeCount > 0
                            ? "bg-[#3a2a1e] text-white border-[#3a2a1e]"
                            : "bg-white text-[#3a2a1e] border-[#e8ded5]"
                    }`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {f.activeCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-[#d4a537] text-white flex items-center justify-center">
                            {f.activeCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Segmented control */}
            <div
                role="tablist"
                aria-label="Mentor type"
                className="inline-flex max-w-full overflow-x-auto p-1 rounded-full bg-white border border-[#e8ded5] shadow-sm [scrollbar-width:none]"
            >
                {tabs.map((t) => {
                    const active = values.type === t.value;
                    return (
                        <button
                            key={t.value}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => f.setType(t.value)}
                            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${FOCUS_RING} ${
                                active
                                    ? "bg-[#4a3728] text-white shadow"
                                    : "text-[#6b5643] hover:bg-[#f8f4ef]"
                            }`}
                        >
                            {t.label}
                            <span
                                className={`text-[11px] font-black min-w-[22px] text-center px-1.5 py-0.5 rounded-full ${
                                    active ? "bg-white/20 text-white" : "bg-[#f5ede5] text-[#8b7355]"
                                }`}
                            >
                                {t.count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
 * UI: typeahead (click karo -> suggestions, type karo -> filter)
 * ───────────────────────────────────────────────────────────── */

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

    // Multi-word search: "oriental tech" -> har word label me hona chahiye
    const needle = text.trim().toLowerCase();
    const tokens = needle.split(/\s+/).filter(Boolean);
    const matches = options
        .filter(
            (o) =>
                o.count > 0 &&
                !selected.includes(o.key) &&
                tokens.every((t) => o.label.toLowerCase().includes(t))
        )
        .slice(0, 8);

    const pick = (key: string) => {
        onSelect(key);
        setText("");
        setOpen(false);
        setActive(0);
    };

    return (
        <div ref={ref} className="relative">
            <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#a89580] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                            setOpen(true);
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
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e8ded5] bg-[#faf6f1] text-xs font-medium text-[#2d2015] placeholder:text-[#a89580] focus:outline-none focus:border-[#4a3728] focus:bg-white focus:ring-2 focus:ring-[#4a3728]/10 transition"
                />
            </div>

            {open && (matches.length > 0 || needle) && (
                <div className="absolute left-0 right-0 z-30 mt-1.5 bg-white border border-[#e8ded5] rounded-xl shadow-xl overflow-hidden">
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
                                        idx === active ? "bg-[#f8f4ef] text-[#4a3728]" : "text-slate-700"
                                    }`}
                                >
                                    <span className="truncate">{o.label}</span>
                                    <span className="text-[10px] font-bold text-[#a89580] shrink-0">{o.count}</span>
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
 * UI: ek filter group (collapsible)
 *  - list: checkbox rows (skills, college, degree ...)
 *  - chips: chhote toggle pills (experience, graduation year)
 * ───────────────────────────────────────────────────────────── */

function CountBadge({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-[11px] font-semibold tabular-nums text-[#a89580] shrink-0">{children}</span>
    );
}

function FacetGroup({
    title,
    hint,
    options,
    selected,
    onToggle,
    topN,
    searchPlaceholder,
    variant = "list",
    defaultOpen = true,
}: {
    title: string;
    hint?: string;
    options: FilterOption[];
    selected: string[];
    onToggle: (key: string) => void;
    topN: number;
    searchPlaceholder?: string;
    variant?: "list" | "chips";
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const [expanded, setExpanded] = useState(false);

    const selectedOptions = selected
        .map((k) => options.find((o) => o.key === k))
        .filter((o): o is FilterOption => Boolean(o));
    // Sirf wahi options jinse kuch result milta hai
    const available = options.filter((o) => o.count > 0 && !selected.includes(o.key));
    const visibleAvailable = expanded ? available : available.slice(0, topN);
    const shown = [...selectedOptions, ...visibleAvailable];

    if (shown.length === 0) return null;

    const moreCount = Math.max(0, available.length - topN);
    const bodyId = `facet-${title.toLowerCase().replace(/\s+/g, "-")}`;

    return (
        <section className="py-4 first:pt-0 last:pb-0">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-controls={bodyId}
                className={`w-full flex items-center justify-between gap-2 rounded-lg text-left ${FOCUS_RING}`}
            >
                <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-extrabold text-[#2d2015]">{title}</span>
                    {selected.length > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#d4a537] text-white text-[10px] font-bold flex items-center justify-center">
                            {selected.length}
                        </span>
                    )}
                    {hint && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5ede5] text-[#8b7355]">
                            {hint}
                        </span>
                    )}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-[#8b7355] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div id={bodyId} className="mt-3 space-y-3">
                    {variant === "chips" ? (
                        <div className="flex flex-wrap gap-2">
                            {shown.map((o) => {
                                const checked = selected.includes(o.key);
                                return (
                                    <button
                                        key={o.key}
                                        type="button"
                                        aria-pressed={checked}
                                        onClick={() => onToggle(o.key)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${FOCUS_RING} ${
                                            checked
                                                ? "bg-[#4a3728] border-[#4a3728] text-white"
                                                : "bg-white border-[#e8ded5] text-[#4a3728] hover:border-[#8b7355] hover:bg-[#faf6f1]"
                                        }`}
                                    >
                                        {o.label}
                                        <span className={`text-[10px] font-semibold ${checked ? "text-white/70" : "text-[#a89580]"}`}>
                                            {o.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <ul className="-mx-2 space-y-0.5">
                            {shown.map((o) => {
                                const checked = selected.includes(o.key);
                                return (
                                    <li key={o.key}>
                                        <label className="group flex items-start gap-3 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[#faf6f1] transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => onToggle(o.key)}
                                                className="peer sr-only"
                                            />
                                            <span
                                                aria-hidden
                                                className={`mt-0.5 w-[18px] h-[18px] shrink-0 rounded-md border flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#4a3728]/40 peer-focus-visible:ring-offset-1 ${
                                                    checked
                                                        ? "bg-[#4a3728] border-[#4a3728]"
                                                        : "bg-white border-[#d6c8ba] group-hover:border-[#8b7355]"
                                                }`}
                                            >
                                                {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                            </span>
                                            <span
                                                className={`flex-1 min-w-0 text-[13px] leading-snug break-words ${
                                                    checked ? "font-bold text-[#2d2015]" : "font-semibold text-[#4a3728]"
                                                }`}
                                            >
                                                {o.label}
                                            </span>
                                            <CountBadge>{o.count}</CountBadge>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {moreCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setExpanded((e) => !e)}
                            className={`text-xs font-bold text-[#8b5e3c] hover:text-[#3a2a1e] rounded ${FOCUS_RING}`}
                        >
                            {expanded ? "Show less" : `Show all (+${moreCount})`}
                        </button>
                    )}

                    {searchPlaceholder && options.some((o) => o.count > 0) && (
                        <SearchPicker
                            options={options}
                            selected={selected}
                            onSelect={onToggle}
                            placeholder={searchPlaceholder}
                        />
                    )}
                </div>
            )}
        </section>
    );
}

/* ─────────────────────────────────────────────────────────────
 * UI: Availability toggle switch
 * ───────────────────────────────────────────────────────────── */

function AvailabilityToggle({
    checked,
    count,
    onChange,
}: {
    checked: boolean;
    count: number;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#faf6f1] border border-[#efe5da] px-4 py-3">
            <div className="min-w-0">
                <p className="text-[13px] font-extrabold text-[#2d2015]">Bookable now</p>
                <p className="text-[11px] font-medium text-[#8b7355]">
                    {count} mentor{count === 1 ? "" : "s"} available
                </p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label="Show only mentors bookable now"
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${FOCUS_RING} ${
                    checked ? "bg-[#4a3728]" : "bg-[#d6c8ba]"
                }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        checked ? "translate-x-5" : ""
                    }`}
                />
            </button>
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

    // Mobile panel khula ho to page scroll lock + Esc se band
    useEffect(() => {
        if (!mobileOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onMobileClose();
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener("keydown", onKey);
        };
    }, [mobileOpen, onMobileClose]);

    const showIndustryGroups = values.type !== "college";
    const showCollegeGroups = values.type !== "industry";
    const showHints = values.type === "all";

    return (
        <aside className="lg:self-start lg:sticky lg:top-28">
            <div
                className={
                    mobileOpen
                        ? "fixed inset-0 z-50 flex flex-col bg-white lg:static lg:flex lg:flex-col lg:bg-transparent"
                        : "hidden lg:flex lg:flex-col"
                }
            >
                {/* Mobile header */}
                <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-[#efe5da]">
                    <h4 className="flex items-center gap-2 text-base font-extrabold text-[#2d2015]">
                        Filters
                        {f.activeCount > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-[#d4a537] text-white flex items-center justify-center">
                                {f.activeCount}
                            </span>
                        )}
                    </h4>
                    <button
                        type="button"
                        onClick={onMobileClose}
                        aria-label="Close filters"
                        className={`w-9 h-9 rounded-full bg-[#f5ede5] flex items-center justify-center text-[#4a3728] ${FOCUS_RING}`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-5 lg:flex-none lg:max-h-[calc(100vh-8rem)] lg:px-5 lg:py-5 lg:bg-white lg:border lg:border-[#e8ded5] lg:rounded-3xl lg:shadow-sm [scrollbar-width:thin] [scrollbar-color:#d6c8ba_transparent]">
                    <div className="hidden lg:flex items-center justify-between mb-4">
                        <h4 className="flex items-center gap-2 text-base font-extrabold text-[#2d2015]">
                            <SlidersHorizontal className="w-4 h-4 text-[#8b7355]" />
                            Filters
                            {f.activeCount > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-[#d4a537] text-white flex items-center justify-center">
                                    {f.activeCount}
                                </span>
                            )}
                        </h4>
                        {f.activeCount > 0 && (
                            <button
                                type="button"
                                onClick={f.clearAll}
                                className={`inline-flex items-center gap-1 text-xs font-bold text-[#8b5e3c] hover:text-[#3a2a1e] rounded ${FOCUS_RING}`}
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                            </button>
                        )}
                    </div>

                    <AvailabilityToggle
                        checked={values.availableOnly}
                        count={f.availableCount}
                        onChange={f.setAvailableOnly}
                    />

                    <div className="mt-4 divide-y divide-[#f1ebe5]">
                        {showIndustryGroups && (
                            <>
                                <FacetGroup
                                    title="Experience"
                                    hint={showHints ? "Industry" : undefined}
                                    options={f.expOptions}
                                    selected={values.exps}
                                    onToggle={(k) => f.toggle("exps", k)}
                                    topN={EXP_FILTERS.length}
                                    variant="chips"
                                />
                                <FacetGroup
                                    title="Domain"
                                    hint={showHints ? "Industry" : undefined}
                                    options={f.domainOptions}
                                    selected={values.domains}
                                    onToggle={(k) => f.toggle("domains", k)}
                                    topN={DOMAIN_FILTERS.length}
                                />
                            </>
                        )}

                        <FacetGroup
                            title="Skills"
                            options={f.skillOptions}
                            selected={values.skills}
                            onToggle={(k) => f.toggle("skills", k)}
                            topN={6}
                            searchPlaceholder="Search skills"
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
                                    searchPlaceholder="Search college"
                                />
                                <FacetGroup
                                    title="Degree"
                                    hint={showHints ? "College" : undefined}
                                    options={f.degreeOptions}
                                    selected={values.degrees}
                                    onToggle={(k) => f.toggle("degrees", k)}
                                    topN={5}
                                    searchPlaceholder="Search degree"
                                />
                                <FacetGroup
                                    title="Graduation year"
                                    hint={showHints ? "College" : undefined}
                                    options={f.yearOptions}
                                    selected={values.years}
                                    onToggle={(k) => f.toggle("years", k)}
                                    topN={6}
                                    variant="chips"
                                />
                                <FacetGroup
                                    title="Location"
                                    hint={showHints ? "College" : undefined}
                                    options={f.locationOptions}
                                    selected={values.locations}
                                    onToggle={(k) => f.toggle("locations", k)}
                                    topN={5}
                                    searchPlaceholder="Search city or state"
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile footer */}
                <div className="lg:hidden flex items-center gap-3 px-5 py-4 border-t border-[#efe5da] bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <button
                        type="button"
                        onClick={f.clearAll}
                        disabled={f.activeCount === 0}
                        className={`px-5 py-3 rounded-2xl bg-[#f5ede5] text-[#4a3728] text-sm font-bold disabled:opacity-50 ${FOCUS_RING}`}
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={onMobileClose}
                        className={`flex-1 py-3 rounded-2xl bg-[#4a3728] text-white text-sm font-bold ${FOCUS_RING}`}
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
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
            {f.chips.map((chip) => (
                <span
                    key={chip.id}
                    className="inline-flex items-center gap-1.5 max-w-[260px] pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold bg-[#4a3728] text-white shadow-sm"
                >
                    <span className="truncate">{chip.label}</span>
                    <button
                        type="button"
                        onClick={chip.onRemove}
                        aria-label={`Remove filter ${chip.label}`}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
            <button
                type="button"
                onClick={f.clearAll}
                className={`text-xs font-bold text-[#8b5e3c] hover:text-[#3a2a1e] underline underline-offset-2 rounded ${FOCUS_RING}`}
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
                {resultCount} mentor{resultCount === 1 ? "" : "s"} found
                {filtersActive && <span className="font-medium text-[#8b7355]"> (of {totalCount})</span>}
            </p>

            <div className="flex items-center gap-2">
                <div className="relative">
                    <select
                        value={sort}
                        onChange={(e) => onSortChange(e.target.value as CollegeSort)}
                        aria-label="Sort mentors"
                        className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#e8ded5] bg-white text-sm font-semibold text-[#3a2a1e] focus:outline-none focus:border-[#3a2a1e] focus:ring-2 focus:ring-[#4a3728]/10 cursor-pointer"
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
                        className={`p-2 transition-colors ${FOCUS_RING} ${view === "grid" ? "bg-[#3a2a1e] text-white" : "text-[#6b5643] hover:bg-[#f5ede5]"}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewChange("list")}
                        aria-label="List view"
                        aria-pressed={view === "list"}
                        className={`p-2 transition-colors ${FOCUS_RING} ${view === "list" ? "bg-[#3a2a1e] text-white" : "text-[#6b5643] hover:bg-[#f5ede5]"}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}