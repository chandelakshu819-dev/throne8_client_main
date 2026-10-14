"use client";
//src/features/mentorship/components/sections/CTASection.tsx
import React, { useEffect, useRef, useState } from "react";
import { Users, CalendarCheck, Globe, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CTAStats {
    mentors: number;
    sessions: number;
    domains: number;
}

interface CTASectionProps {
    /** Wire this to whatever your old "Get Started Now" button did */
    onJoinClick?: () => void;
    /** Real numbers from the page. `undefined` = still loading (skeleton dikhega) */
    stats?: CTAStats;
}

const STAT_ITEMS: { key: keyof CTAStats; icon: LucideIcon; label: string }[] = [
    { key: "mentors", icon: Users, label: "Mentors" },
    { key: "sessions", icon: CalendarCheck, label: "Sessions" },
    { key: "domains", icon: Globe, label: "Domains" },
];

/** 1234 -> "1.2K", 12000 -> "12K" */
function formatCount(n: number): string {
    if (n >= 1000) {
        const k = n / 1000;
        return `${k.toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K`;
    }
    return String(n);
}

function CountUp({ value, active }: { value: number; active: boolean }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (!active) return;

        const reduceMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduceMotion || value <= 0) {
            setDisplay(value);
            return;
        }

        let raf = 0;
        const duration = 1200;
        const start = performance.now();

        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setDisplay(Math.round(value * eased));
            if (progress < 1) raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, active]);

    return (
        <>
            {formatCount(display)}
            {value >= 10 ? "+" : ""}
        </>
    );
}

export default function CTASection({ onJoinClick, stats }: CTASectionProps) {
    const statsRef = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);

    // Count-up tabhi chalega jab stats screen par aayein
    useEffect(() => {
        const el = statsRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section className="px-4 sm:px-6 py-10 sm:py-12">
            <div
                className="
                    relative mx-auto max-w-[1240px] overflow-hidden
                    rounded-[28px] sm:rounded-[32px]
                    bg-gradient-to-br from-[#4A2E1B] via-[#3A2213] to-[#2A170C]
                    shadow-[0_24px_60px_rgba(40,20,5,0.4)]
                    ring-1 ring-white/5
                "
            >
                {/* Decorative waves */}
                <svg
                    aria-hidden="true"
                    viewBox="0 0 1240 340"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                >
                    <path
                        d="M0 250 C 160 220 320 260 440 340 L0 340 Z"
                        fill="white"
                        fillOpacity="0.05"
                    />
                    <path
                        d="M420 340 C 640 250 900 330 1240 230 L1240 340 Z"
                        fill="#1F1006"
                        fillOpacity="0.35"
                    />
                    <path
                        d="M760 340 C 940 300 1100 340 1240 300 L1240 340 Z"
                        fill="white"
                        fillOpacity="0.06"
                    />
                </svg>

                {/* Radiating diagonal lines, bottom-right */}
                <svg
                    aria-hidden="true"
                    viewBox="0 0 1240 340"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
                >
                    <g stroke="#C59F75" strokeWidth="1">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <line
                                key={i}
                                x1={1000 + i * 26}
                                y1="340"
                                x2={1240}
                                y2={340 - i * 30}
                            />
                        ))}
                    </g>
                </svg>

                {/* Soft glows */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#C59F75]/25 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-28 -left-16 h-60 w-60 rounded-full bg-[#7A5C3E]/30 blur-3xl"
                />

                <div className="relative z-10 flex flex-col gap-8 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:gap-0 lg:px-14 lg:py-14">
                    {/* ── Left: copy + button ─────────────────────────── */}
                    <div className="flex-1 lg:pr-12">
                        <div className="flex items-center gap-3">
                            <span className="h-px w-8 bg-[#C59F75]/60" />
                            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#C59F75] sm:text-xs">
                                Join a Thriving Community
                            </p>
                        </div>

                        <h2 className="mt-4 font-serif text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-[44px]">
                            Be Part of Something{" "}
                            <span className="bg-gradient-to-r from-[#F3DDBF] via-[#E2BE92] to-[#C59F75] bg-clip-text text-transparent">
                                Bigger.
                            </span>
                        </h2>

                        <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-white/80 sm:text-base">
                            Connect with mentors, learn in-demand skills, and grow with a
                            community that believes in you.
                        </p>

                        <button
                            type="button"
                            onClick={onJoinClick}
                            className="
                                group mt-7 inline-flex items-center gap-3 rounded-full
                                bg-white py-3 pl-6 pr-3
                                text-[15px] font-bold text-[#3A2718]
                                shadow-[0_12px_28px_rgba(20,10,0,0.35)]
                                transition-all duration-300
                                hover:-translate-y-0.5
                                hover:shadow-[0_16px_34px_rgba(20,10,0,0.42)]
                                focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C59F75]/50
                            "
                        >
                            <Users className="h-5 w-5" strokeWidth={1.8} />
                            Join the Community
                            <span
                                className="
                                    flex h-9 w-9 items-center justify-center rounded-full
                                    bg-[#4A3728] text-white
                                    transition-transform duration-300 group-hover:translate-x-1
                                "
                            >
                                <ArrowRight className="h-4 w-4" />
                            </span>
                        </button>
                    </div>

                    {/* ── Divider ─────────────────────────────────────── */}
                    <div
                        aria-hidden="true"
                        className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent lg:h-48 lg:w-px lg:bg-gradient-to-b"
                    />

                    {/* ── Right: real stats ───────────────────────────── */}
                    <div ref={statsRef} className="lg:pl-12">
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            {STAT_ITEMS.map(({ key, icon: Icon, label }) => {
                                const value = stats?.[key];

                                return (
                                    <div
                                        key={key}
                                        className="
                                            group flex min-w-0 flex-col items-center text-center
                                            rounded-2xl border border-white/10 bg-white/[0.04]
                                            px-3 py-5 backdrop-blur-sm sm:px-6 sm:py-6
                                            transition-all duration-300
                                            hover:-translate-y-1 hover:border-[#C59F75]/40 hover:bg-white/[0.08]
                                        "
                                    >
                                        <div
                                            className="
                                                flex h-12 w-12 items-center justify-center rounded-full
                                                border border-[#C59F75]/30
                                                bg-gradient-to-br from-[#5A3A22] to-[#2A170C]
                                                shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_8px_18px_rgba(0,0,0,0.3)]
                                                transition-transform duration-300 group-hover:scale-105
                                                sm:h-14 sm:w-14
                                            "
                                        >
                                            <Icon
                                                className="h-5 w-5 text-[#F3DDBF] sm:h-6 sm:w-6"
                                                strokeWidth={1.6}
                                            />
                                        </div>

                                        <div className="mt-4 flex h-7 items-center">
                                            {value === undefined ? (
                                                <span
                                                    aria-label="Loading"
                                                    className="h-6 w-12 animate-pulse rounded-md bg-white/15"
                                                />
                                            ) : (
                                                <p className="text-xl font-extrabold leading-none tabular-nums text-white sm:text-2xl">
                                                    <CountUp value={value} active={inView} />
                                                </p>
                                            )}
                                        </div>

                                        <p className="mt-1.5 text-[12px] font-medium uppercase tracking-wider text-white/60 sm:text-[13px]">
                                            {label}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}