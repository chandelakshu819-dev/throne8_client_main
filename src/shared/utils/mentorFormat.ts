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