// src/features/mentorship/utils/companyLogo.ts
// Pure helpers (no React / no config imports) so they are easy to unit test.

export interface CompanyLike {
    name?: string | null;
    logoUrl?: string | null;
    logoPreviewPath?: string | null;
}

const PALETTE = ["#8B7355", "#4A3728", "#9C7A59", "#B47A3E", "#6B5B4F", "#7D5B3D"];

/** "https://host.com/api/v1" -> "https://host.com" ('' when invalid) */
export function apiOrigin(apiBaseUrl?: string | null): string {
    if (!apiBaseUrl) return "";
    try {
        return new URL(apiBaseUrl).origin;
    } catch {
        return "";
    }
}

/**
 * Image src for a company: our stored https logo first, then the backend
 * logo-preview proxy path (resolved against the API origin). Anything else
 * (javascript:, data:, http:) is ignored.
 */
export function resolveLogoSrc(item: CompanyLike | null | undefined, apiBaseUrl?: string | null): string | undefined {
    if (!item) return undefined;
    if (item.logoUrl && /^(?:https:\/\/|\/)/i.test(item.logoUrl)) return item.logoUrl;
    if (item.logoPreviewPath && item.logoPreviewPath.startsWith("/api/")) {
        const origin = apiOrigin(apiBaseUrl);
        if (origin) return `${origin}${item.logoPreviewPath}`;
    }
    return undefined;
}

export function companyInitial(name?: string | null): string {
    const c = (name || "").trim().charAt(0);
    return c ? c.toUpperCase() : "?";
}

export function companyColor(name?: string | null): string {
    const s = name || "";
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
}

/** Same normalisation the section uses: "Throne 8" / "throne8" -> "throne8" */
export function normCompanyName(s?: string | null): string {
    return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
