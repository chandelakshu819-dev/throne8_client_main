// src/shared/utils/collegeName.ts
// One place that decides when two college names are "the same college".
// Used by the college input (CollegeAutocomplete) and by the mentor filter,
// so spelling variants collapse into ONE entry.

/** Strict key: lowercase, no brackets, "&" -> "and", no punctuation. */
export const collegeKey = (raw: string): string =>
    (raw || "")
        .toLowerCase()
        .replace(/\([^)]*\)/g, " ") // "(OCT)", "(OIST)" ...
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

/** Loose key: strict key without the trailing city ("... technology bhopal" -> "... technology"). */
export const looseCollegeKey = (raw: string): string =>
    collegeKey(raw).replace(/\s+bhopal$/, "");

/** Returns the standard name from `list` if `input` is a spelling variant of it, otherwise null. */
export const canonicalCollege = (input: string, list: readonly string[]): string | null => {
    const k = looseCollegeKey(input);
    if (!k) return null;
    return list.find((n) => looseCollegeKey(n) === k) ?? null;
};

const titleCase = (s: string): string => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** Light clean-up for a custom ("Other") name: trim, collapse spaces, Title Case if all lowercase. */
export const tidyCustomCollege = (raw: string): string => {
    const base = raw.replace(/\s+/g, " ").trim().replace(/[,.\s]+$/, "");
    return base === base.toLowerCase() ? titleCase(base) : base;
};
