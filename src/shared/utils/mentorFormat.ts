// src/shared/utils/mentorFormat.ts

const ACRONYMS = new Set([
    "ceo", "cto", "cfo", "coo", "vp", "hr", "qa", "ui", "ux", "ai", "ml", "it", "sde", "sre",
]);

/** "product-manager" -> "Product Manager", "founder & ceo" -> "Founder & CEO" */
export function normalizeRole(raw?: string | null): string {
    if (!raw) return "";
    return raw
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map((word) => {
            const lower = word.toLowerCase();
            if (ACRONYMS.has(lower)) return lower.toUpperCase();
            if (word === lower) return word.charAt(0).toUpperCase() + word.slice(1);
            return word;
        })
        .join(" ");
}
/** "HTML, CSS; JS" ya ["HTML, CSS", "JS"] -> ["HTML", "CSS", "JS"] (trim + duplicate hata deta hai) */
export function splitSkills(skills: unknown): string[] {
    const list = Array.isArray(skills) ? skills : typeof skills === "string" ? [skills] : [];
    const seen = new Set<string>();
    return list
        .flatMap((s) => String(s).split(/[,;|]/))
        .map((s) => s.trim())
        .filter((s) => {
            const key = s.toLowerCase();
            if (!s || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

/** Handles "Role @ Company", "Role at Company", plain role, or only title */
export function parseRoleCompany(
    rawRole?: string | null,
    title?: string | null,
    fallbackCompany?: string | null
): { role: string; company: string } {
    const source = (rawRole ?? "").trim();
    let role = "";
    let company = "";

    const sep = source.match(/\s+(?:@|at)\s+/i);
    if (sep && sep.index !== undefined) {
        role = source.slice(0, sep.index);
        company = source.slice(sep.index + sep[0].length);
    } else if (source) {
        role = source;
        company = fallbackCompany ?? "";
    } else {
        role = title ?? "";
        company = fallbackCompany ?? "";
    }

    return { role: normalizeRole(role) || "Mentor", company: company.trim() };
}

/** Company blank ho to "@" nahi dikhata */
export function formatRoleCompany(role?: string | null, company?: string | null): string {
    const r = (role ?? "").trim() || "Mentor";
    const c = (company ?? "").trim();
    return c ? `${r} @ ${c}` : r;
}

/** Rating sirf tab "real" maani jaati hai jab sessions > 0 aur rating > 0 ho */
export function getRatingDisplay(rating?: number | string | null, sessions?: number | null) {
    const r = Number(rating);
    const s = Number(sessions) || 0;
    const hasRating = s > 0 && Number.isFinite(r) && r > 0;

    let ratingLabel = "New";
    if (hasRating) ratingLabel = r.toFixed(1);
    else if (s > 0) ratingLabel = "Unrated";

    return {
        hasRating,
        ratingLabel,
        sessionsLabel: s > 0 ? `${s} session${s === 1 ? "" : "s"}` : "",
    };
}

export function getExperienceLabel(years?: number | string | null): string {
    const y = Math.floor(Number(years) || 0);
    if (y <= 0) return "Less than 1 Yr";
    if (y === 1) return "1 Yr";
    return `${y}+ Yrs`;
}

/** 1250 -> "1K+", 340 -> "340+", 12 -> "12" */
export function formatCountLabel(n?: number | null): string {
    const v = Number(n) || 0;
    if (v >= 1000) return `${Math.floor(v / 1000)}K+`;
    if (v >= 100) return `${Math.floor(v / 10) * 10}+`;
    return v > 0 ? String(v) : "";
}

/**
 * Validates and normalizes URL to safe http: or https: string.
 * Returns null if invalid or unsafe.
 */
export function safeUrl(raw?: string | null): string | null {
    if (!raw || typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return parsed.toString();
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Shared domain rule (same as server): hostname matches domain or ends with ".<domain>"
 */
export function isDomainAllowed(url: string, allowedDomains?: string[]): boolean {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "https:") return false;
        if (!allowedDomains || allowedDomains.length === 0) return true;
        const host = parsed.hostname.toLowerCase();
        return allowedDomains.some(
            (domain) => host === domain.toLowerCase() || host.endsWith(`.${domain.toLowerCase()}`)
        );
    } catch {
        return false;
    }
}

/**
 * Shared client validation helper matching server rules
 */
export function validateUrlClient(
    value: unknown,
    allowedDomains?: string[]
): { isValid: boolean; error?: string } {
    if (value === undefined || value === null || value === "") return { isValid: true };
    if (typeof value !== "string") return { isValid: false, error: "URL must be a string" };
    const trimmed = value.trim();
    if (trimmed === "") return { isValid: true };
    if (trimmed.length > 200) return { isValid: false, error: "URL cannot exceed 200 characters" };

    let parsed: URL;
    try {
        parsed = new URL(trimmed);
    } catch {
        return { isValid: false, error: "Invalid URL format" };
    }

    if (parsed.protocol !== "https:") {
        return { isValid: false, error: "URL must use https:// protocol" };
    }

    if (allowedDomains && allowedDomains.length > 0) {
        const host = parsed.hostname.toLowerCase();
        const isAllowed = allowedDomains.some(
            (domain) => host === domain.toLowerCase() || host.endsWith(`.${domain.toLowerCase()}`)
        );
        if (!isAllowed) {
            return { isValid: false, error: `URL must be from ${allowedDomains.join(" or ")}` };
        }
    }

    return { isValid: true };
}

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Formats "2024-01" -> "Jan 2024". Handles undefined, "", and bad strings gracefully.
 */
export function formatMonthYear(dateStr?: string | null): string {
    if (!dateStr || typeof dateStr !== "string") return "";
    const trimmed = dateStr.trim();
    const match = trimmed.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
    if (!match) return "";
    const year = match[1];
    const monthIdx = parseInt(match[2], 10) - 1;
    return `${MONTH_NAMES[monthIdx]} ${year}`;
}

/**
 * Formats experience duration:
 * - isCurrent: "Jan 2024 - Present" (or "Present" if no startDate)
 * - startDate + endDate: "Jan 2022 - Dec 2023"
 * - startDate only: "Jan 2022"
 * - legacy duration only: role.duration
 */
export function formatRoleDuration(role?: {
    startDate?: string | null;
    endDate?: string | null;
    isCurrent?: boolean | null;
    duration?: string | null;
} | null): string {
    if (!role) return "";
    const isCurrent = Boolean(role.isCurrent);
    const startFormatted = formatMonthYear(role.startDate);
    const endFormatted = formatMonthYear(role.endDate);

    if (isCurrent) {
        return startFormatted ? `${startFormatted} - Present` : "Present";
    }
    if (startFormatted && endFormatted) {
        return `${startFormatted} - ${endFormatted}`;
    }
    if (startFormatted) {
        return startFormatted;
    }
    if (role.duration && typeof role.duration === "string" && role.duration.trim()) {
        return role.duration.trim();
    }
    return "";
}

/**
 * Sorts previousRoles newest first:
 * 1. isCurrent === true on top
 * 2. Newest startDate first
 * 3. Fallback preserves order
 */
export function sortRolesNewestFirst<T extends { isCurrent?: boolean; startDate?: string; endDate?: string; companyLogo?: string }>(
    roles?: T[] | null
): T[] {
    if (!Array.isArray(roles)) return [];
    return [...roles].sort((a, b) => {
        const aCurrent = Boolean(a.isCurrent);
        const bCurrent = Boolean(b.isCurrent);
        if (aCurrent && !bCurrent) return -1;
        if (!aCurrent && bCurrent) return 1;

        const aStart = a.startDate || "";
        const bStart = b.startDate || "";
        if (aStart && bStart) {
            return bStart.localeCompare(aStart);
        }
        if (aStart) return -1;
        if (bStart) return 1;

        return 0;
    });
}