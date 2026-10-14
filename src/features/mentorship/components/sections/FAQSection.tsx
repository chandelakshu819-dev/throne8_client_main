"use client";
//src/features/mentorship/components/sections/FAQSection.tsx
import React, { useMemo, useState } from "react";
import {
    MessageSquare,
    ChevronDown,
    Search,
    X,
    ThumbsUp,
    ThumbsDown,
    Check,
    Mail,
    LifeBuoy,
} from "lucide-react";
import { FAQS } from "@/features/index";

/**
 * Support email: yahan apna email daalo (e.g. "support@throne8.com").
 * Khali rakhoge to "Contact Support" button nahi dikhega.
 */
const SUPPORT_EMAIL = "";

interface FAQItem {
    q: string;
    a: string;
    /** Optional: FAQS mein `category` daal doge to wahi use hoga, warna question se guess hoga */
    category?: string;
}

interface FAQSectionProps {
    openFaq?: number | null;
    setOpenFaq?: (index: number | null) => void;
}

const CATEGORY_ORDER = ["Booking", "Payments", "Mentors", "Masterclass"];

function inferCategory(question: string): string {
    const t = question.toLowerCase();
    if (/(pay|price|pricing|refund|fee|cost|invoice|billing)/.test(t)) return "Payments";
    if (/(masterclass|webinar|workshop|group session)/.test(t)) return "Masterclass";
    if (/(verif|vetted|background|qualif|trusted)/.test(t)) return "Mentors";
    return "Booking";
}

function categoryRank(c: string): number {
    const idx = CATEGORY_ORDER.indexOf(c);
    return idx === -1 ? 99 : idx;
}

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query: string }) {
    const q = query.trim();
    if (!q) return <>{text}</>;

    const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === q.toLowerCase() ? (
                    <mark
                        key={i}
                        className="rounded bg-[#F1D9B0] px-0.5 text-inherit"
                    >
                        {part}
                    </mark>
                ) : (
                    <React.Fragment key={i}>{part}</React.Fragment>
                )
            )}
        </>
    );
}

export default function FAQSection({ openFaq = null, setOpenFaq }: FAQSectionProps) {
    const [query, setQuery] = useState("");
    const [activeCat, setActiveCat] = useState("All");
    const [openIds, setOpenIds] = useState<Set<number>>(
        () => new Set(openFaq !== null ? [openFaq] : [])
    );
    const [votes, setVotes] = useState<Record<number, "up" | "down">>({});

    const items = useMemo(
        () =>
            (FAQS as FAQItem[]).map((f, i) => ({
                ...f,
                id: i,
                category: f.category ?? inferCategory(f.q),
            })),
        []
    );

    const categories = useMemo(
        () =>
            Array.from(new Set(items.map((i) => i.category))).sort(
                (a, b) => categoryRank(a) - categoryRank(b)
            ),
        [items]
    );

    const q = query.trim().toLowerCase();

    const filtered = useMemo(
        () =>
            items.filter(
                (it) =>
                    (activeCat === "All" || it.category === activeCat) &&
                    (!q ||
                        it.q.toLowerCase().includes(q) ||
                        it.a.toLowerCase().includes(q))
            ),
        [items, activeCat, q]
    );

    const allOpen = filtered.length > 0 && filtered.every((f) => openIds.has(f.id));

    const toggle = (id: number) => {
        const willOpen = !openIds.has(id);
        const next = new Set(openIds);
        if (willOpen) next.add(id);
        else next.delete(id);
        setOpenIds(next);
        setOpenFaq?.(willOpen ? id : null);
    };

    const toggleAll = () => {
        const next = new Set(openIds);
        filtered.forEach((f) => (allOpen ? next.delete(f.id) : next.add(f.id)));
        setOpenIds(next);
        setOpenFaq?.(null);
    };

    const clearFilters = () => {
        setQuery("");
        setActiveCat("All");
    };

    const vote = (id: number, type: "up" | "down") =>
        setVotes((v) => ({ ...v, [id]: type }));

    const countLabel = `${filtered.length} ${filtered.length === 1 ? "question" : "questions"}`;

    return (
        <section className="px-4 sm:px-6 py-14 sm:py-16">
            {/* Card container */}
            <div
                className="
                   relative mx-auto w-full max-w-[1240px] overflow-hidden
                    rounded-[28px] sm:rounded-[32px]
                    border border-white/70
                    bg-gradient-to-br from-[#FFFDF9] via-[#FCF7F0] to-[#F8F0E4]
                    px-5 py-10 sm:px-10 sm:py-12
                    shadow-[0_24px_60px_rgba(120,90,50,0.12)]
                "
            >
                {/* Decorative arcs (top-left) */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-28 -top-20 h-72 w-72 rounded-full bg-[#F1E4D3]/60"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-16 top-4 h-64 w-64 rounded-full border border-[#E8D8C3]/70"
                />

                <div className="relative z-10 mx-auto max-w-[960px]">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#EEDCC4]/70 bg-[#F6E9D9] px-4 py-2">
                            <MessageSquare className="h-4 w-4 text-[#8A6A45]" />
                            <span className="text-[13px] font-semibold text-[#4A3728]">
                                Help Center
                            </span>
                        </div>

                        <h2 className="mt-4 font-serif text-5xl font-bold leading-none tracking-tight text-[#2A1A10] sm:text-[52px]">
                            FAQs
                        </h2>

                        <p className="mt-3 text-[15px] text-[#8A7A6A]">
                            Quick answers to common questions
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative mb-5">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A7A6A]"
                        />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") setQuery("");
                            }}
                            placeholder="Search questions…"
                            aria-label="Search FAQs"
                            className="
                                w-full rounded-full border border-[#EADFCF] bg-white
                                py-3 pl-11 pr-11 text-sm text-[#2A1A10] placeholder:text-[#A8998A]
                                shadow-[0_2px_8px_rgba(120,90,50,0.05)]
                                transition-all duration-200
                                focus:border-[#C59F75] focus:outline-none focus:ring-4 focus:ring-[#C59F75]/20
                            "
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#8A7A6A] transition-colors hover:bg-[#F6ECE0] hover:text-[#4A3728]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Category tabs */}
                    {categories.length > 1 && (
                        <div
                            className="
                                mb-5 flex gap-2 overflow-x-auto pb-1
                                [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                                sm:flex-wrap sm:justify-center sm:overflow-visible
                            "
                        >
                            {["All", ...categories].map((cat) => {
                                const isActive = activeCat === cat;
                                const count =
                                    cat === "All"
                                        ? items.length
                                        : items.filter((i) => i.category === cat).length;

                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        aria-pressed={isActive}
                                        onClick={() => setActiveCat(cat)}
                                        className={`
                                            inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2
                                            text-[13px] font-semibold transition-all duration-200
                                            ${
                                                isActive
                                                    ? "border-[#4A2F20] bg-[#4A2F20] text-white shadow-[0_6px_14px_rgba(74,47,32,0.25)]"
                                                    : "border-[#EADFCF] bg-white/70 text-[#6B5844] hover:bg-white hover:border-[#D9C3A5]"
                                            }
                                        `}
                                    >
                                        {cat}
                                        <span
                                            className={`rounded-full px-1.5 text-[11px] ${
                                                isActive
                                                    ? "bg-white/20 text-white"
                                                    : "bg-[#F6ECE0] text-[#8A6A45]"
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Meta row: count + expand/collapse all */}
                    {filtered.length > 0 && (
                        <div className="mb-3 flex items-center justify-between px-1">
                            <p aria-live="polite" className="text-[13px] text-[#8A7A6A]">
                                {countLabel}
                            </p>
                            <button
                                type="button"
                                onClick={toggleAll}
                                className="text-[13px] font-semibold text-[#7A5C3E] underline-offset-4 transition-colors hover:text-[#4A2F20] hover:underline"
                            >
                                {allOpen ? "Collapse all" : "Expand all"}
                            </button>
                        </div>
                    )}

                    {/* Accordion */}
                    <div className="space-y-2.5">
                        {filtered.map((f) => {
                            const isOpen = openIds.has(f.id);
                            const answerOnly =
                                !!q &&
                                !f.q.toLowerCase().includes(q) &&
                                f.a.toLowerCase().includes(q);
                            const voted = votes[f.id];

                            return (
                                <div
                                    key={f.id}
                                    className={`rounded-xl border bg-[#FFFDF9] transition-all duration-300 ${
                                        isOpen
                                            ? "border-[#E2CDAE] shadow-[0_8px_20px_rgba(120,90,50,0.10)]"
                                            : "border-[#F0E8DC] shadow-[0_2px_8px_rgba(120,90,50,0.05)] hover:shadow-[0_6px_16px_rgba(120,90,50,0.09)]"
                                    }`}
                                >
                                    <button
                                        type="button"
                                        id={`faq-question-${f.id}`}
                                        aria-expanded={isOpen}
                                        aria-controls={`faq-answer-${f.id}`}
                                        onClick={() => toggle(f.id)}
                                        className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5"
                                    >
                                        <span className="min-w-0">
                                            <span className="block text-[14px] font-bold text-[#2A1A10] sm:text-[15px]">
                                                <Highlight text={f.q} query={query} />
                                            </span>
                                            {answerOnly && (
                                                <span className="mt-0.5 block text-[11px] font-medium text-[#A8845A]">
                                                    Match found in answer
                                                </span>
                                            )}
                                        </span>

                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6ECE0] transition-transform duration-300 ${
                                                isOpen ? "rotate-180" : ""
                                            }`}
                                        >
                                            <ChevronDown className="h-4 w-4 text-[#4A3728]" />
                                        </span>
                                    </button>

                                    {/* Answer (smooth height, no fixed max-height) */}
                                    <div
                                        id={`faq-answer-${f.id}`}
                                        role="region"
                                        aria-labelledby={`faq-question-${f.id}`}
                                        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                                            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                        }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="px-4 pb-4 sm:px-5">
                                                <p className="text-[13px] leading-relaxed text-[#7A6A5A] sm:text-sm">
                                                    <Highlight text={f.a} query={query} />
                                                </p>

                                                {/* Helpful? */}
                                                <div className="mt-3 flex items-center gap-2 border-t border-[#F0E8DC] pt-3 text-[12px] text-[#8A7A6A]">
                                                    {voted ? (
                                                        <span className="inline-flex items-center gap-1.5 font-medium text-[#7A5C3E]">
                                                            <Check className="h-3.5 w-3.5" />
                                                            Thanks for your feedback!
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span>Was this helpful?</span>
                                                            <button
                                                                type="button"
                                                                tabIndex={isOpen ? 0 : -1}
                                                                onClick={() => vote(f.id, "up")}
                                                                aria-label="Yes, this was helpful"
                                                                className="flex h-7 w-7 items-center justify-center rounded-full border border-[#EADFCF] bg-white text-[#6B5844] transition-colors hover:border-[#C59F75] hover:bg-[#F6ECE0]"
                                                            >
                                                                <ThumbsUp className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                tabIndex={isOpen ? 0 : -1}
                                                                onClick={() => vote(f.id, "down")}
                                                                aria-label="No, this was not helpful"
                                                                className="flex h-7 w-7 items-center justify-center rounded-full border border-[#EADFCF] bg-white text-[#6B5844] transition-colors hover:border-[#C59F75] hover:bg-[#F6ECE0]"
                                                            >
                                                                <ThumbsDown className="h-3.5 w-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Empty state */}
                        {filtered.length === 0 && (
                            <div className="rounded-xl border border-dashed border-[#E2CDAE] bg-white/60 px-6 py-10 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F6ECE0]">
                                    <Search className="h-5 w-5 text-[#8A6A45]" />
                                </div>
                                <p className="mt-4 text-[15px] font-bold text-[#2A1A10]">
                                    No questions found
                                    {query.trim() ? ` for “${query.trim()}”` : ""}
                                </p>
                                <p className="mt-1 text-[13px] text-[#8A7A6A]">
                                    Try a different keyword or browse all categories.
                                </p>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-4 rounded-full border border-[#D9C3A5] bg-white px-5 py-2 text-[13px] font-semibold text-[#4A3728] transition-colors hover:bg-[#F6ECE0]"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Still have questions? */}
                    <div
                        className="
                            relative mt-8 overflow-hidden rounded-2xl
                            bg-gradient-to-br from-[#4A2E1B] via-[#3A2213] to-[#2A170C]
                            px-6 py-7 sm:px-8
                            shadow-[0_16px_36px_rgba(40,20,5,0.28)]
                        "
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#C59F75]/20 blur-3xl"
                        />

                        <div className="relative z-10 flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#C59F75]/30 bg-gradient-to-br from-[#5A3A22] to-[#2A170C]">
                                <LifeBuoy className="h-5 w-5 text-[#F3DDBF]" strokeWidth={1.6} />
                            </div>

                            <div className="flex-1">
                                <p className="text-lg font-bold text-white">
                                    Still have questions?
                                </p>
                                <p className="mt-1 text-[13px] text-white/70 sm:text-sm">
                                    Can&apos;t find what you&apos;re looking for? Our team is happy
                                    to help.
                                </p>
                            </div>

                            {SUPPORT_EMAIL && (
                                <a
                                    href={`mailto:${SUPPORT_EMAIL}`}
                                    className="
                                        inline-flex shrink-0 items-center gap-2 rounded-full bg-white
                                        px-6 py-3 text-sm font-bold text-[#3A2718]
                                        shadow-[0_10px_22px_rgba(20,10,0,0.3)]
                                        transition-all duration-300 hover:-translate-y-0.5
                                        focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C59F75]/50
                                    "
                                >
                                    <Mail className="h-4 w-4" />
                                    Contact Support
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}