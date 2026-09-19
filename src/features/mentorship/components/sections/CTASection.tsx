"use client";

import React from "react";
import { Users, BookOpen, Globe, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CTASectionProps {
    /** Wire this to whatever your old "Get Started Now" button did */
    onJoinClick?: () => void;
}

const STATS: { icon: LucideIcon; value: string; label: string }[] = [
    { icon: Users, value: "10K+", label: "Learners" },
    { icon: BookOpen, value: "500+", label: "Mentors" },
    { icon: Globe, value: "70+", label: "Domains" },
];

export default function CTASection({ onJoinClick }: CTASectionProps) {
    return (
        <section className="px-4 sm:px-6 py-10 sm:py-12">
            <div
                className="
                    relative mx-auto max-w-[1240px] overflow-hidden
                    rounded-[28px] sm:rounded-[32px]
                    bg-gradient-to-br from-[#4A2E1B] via-[#3A2213] to-[#2A170C]
                    shadow-[0_24px_60px_rgba(40,20,5,0.4)]
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

                {/* Soft glow, top-right */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#C59F75]/25 blur-3xl"
                />

                <div className="relative z-10 flex flex-col gap-8 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:gap-0 lg:px-14 lg:py-12">
                    {/* ── Left: copy + button ─────────────────────────── */}
                    <div className="flex-1 lg:pr-12">
                        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#C59F75] sm:text-xs">
                            Join a Thriving Community
                        </p>

                        <h2 className="mt-3 font-serif text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-[44px]">
                            Be Part of Something Bigger.
                        </h2>

                        <p className="mt-3 max-w-[520px] text-[15px] leading-relaxed text-white/80 sm:text-base">
                            Connect with mentors, learn in-demand skills, and grow with a
                            community that believes in you.
                        </p>

                        <button
                            type="button"
                            onClick={onJoinClick}
                            className="
                                mt-6 inline-flex items-center gap-3 rounded-full
                                bg-white px-7 py-3.5
                                text-[15px] font-bold text-[#3A2718]
                                shadow-[0_12px_28px_rgba(20,10,0,0.35)]
                                transition-all duration-300
                                hover:-translate-y-0.5 hover:gap-4
                                hover:shadow-[0_16px_34px_rgba(20,10,0,0.42)]
                            "
                        >
                            <Users className="h-5 w-5" strokeWidth={1.8} />
                            Join the Community
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* ── Divider ─────────────────────────────────────── */}
                    <div
                        aria-hidden="true"
                        className="h-px w-full bg-white/15 lg:h-44 lg:w-px lg:self-center"
                    />

                    {/* ── Right: stats ────────────────────────────────── */}
                    <div className="flex items-start justify-between gap-6 sm:justify-start sm:gap-10 lg:pl-12">
                        {STATS.map(({ icon: Icon, value, label }) => (
                            <div key={label} className="flex flex-col items-center text-center">
                                <div
                                    className="
                                        flex h-16 w-16 items-center justify-center rounded-full
                                        border border-white/10
                                        bg-[#2A170C]/60
                                        shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_18px_rgba(0,0,0,0.3)]
                                        sm:h-[72px] sm:w-[72px]
                                    "
                                >
                                    <Icon className="h-6 w-6 text-white" strokeWidth={1.6} />
                                </div>

                                <p className="mt-3 text-xl font-extrabold leading-none text-white">
                                    {value}
                                </p>
                                <p className="mt-1 text-[13px] text-white/70">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}