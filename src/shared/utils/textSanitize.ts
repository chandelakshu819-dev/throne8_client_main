// src/shared/utils/textSanitize.ts

/**
 * Garbled / junk text pehchanta hai: "𝕏𝕏𝕏𝕏", "........", "______", "https://...", "aaaa".
 * NFKC se fancy unicode letters normal ban jaate hain, phir repeat/symbol check hota hai.
 */
export function isMeaningfulText(raw?: string | null): boolean {
    if (!raw) return false;
    const text = raw.normalize("NFKC").trim();
    if (!text) return false;
    if (/^https?:\/\//i.test(text)) return false;

    const chars = Array.from(text.replace(/\s+/g, ""));
    const letters = chars.filter((c) => /[\p{L}\p{N}]/u.test(c));
    if (letters.length < 2) return false;
    if (letters.length / chars.length < 0.5) return false;

    const unique = new Set(letters.map((c) => c.toLowerCase()));
    return unique.size >= 2;
}

export function cleanText(raw: string | null | undefined, fallback: string): string {
    return isMeaningfulText(raw) ? (raw as string).normalize("NFKC").trim() : fallback;
}