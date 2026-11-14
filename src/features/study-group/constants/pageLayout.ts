// Same side gap on every study page (matches /study/groups).
// Tailwind scans src/**, so these full class strings are picked up.
export const STUDY_PAGE_X =
  "px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16";

// Inner wrapper for a page's content: full width, capped only on ultra-wide screens.
export const STUDY_PAGE_WRAP = `w-full max-w-[1920px] mx-auto ${STUDY_PAGE_X}`;
