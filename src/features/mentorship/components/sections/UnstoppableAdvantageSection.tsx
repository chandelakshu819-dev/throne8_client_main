"use client";
//src/features/mentorship/components/sections/UnstoppableAdvantageSection.tsx
import React from "react";
import { ShieldCheck, Zap, Star, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ITEMS: {
    icon: LucideIcon;
    title: string;
    description: string;
    number: string;
}[] = [
    {
        icon: ShieldCheck,
        title: "Verified Experts",
        description: "Industry-vetted professionals",
        number: "01",
    },
    {
        icon: Zap,
        title: "Instant Booking",
        description: "Book sessions in seconds",
        number: "02",
    },
    {
        icon: Star,
        title: "Best Value",
        description: "Premium quality, fair pricing",
        number: "03",
    },
    {
        icon: Globe,
        title: "Global Reach",
        description: "Connect across time zones",
        number: "04",
    },
];

export default function UnstoppableAdvantageSection() {
    return (
        <section className="relative w-full overflow-hidden bg-[#f7f1e6] px-4 py-14 sm:px-6 md:py-20">
            {/* Decorative arcs */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full border border-[#e6d6bd]/60" />
            <div className="pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-[#eddcc0]/50 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#8b7355]/5 blur-3xl" />

            <div className="relative z-10 mx-auto max-w-5xl">
                {/* Header */}
                <div className="reveal-on-scroll mb-10 text-center md:mb-14">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8b7355]">
                        Why Choose Us
                    </p>
                    <h2 className="mt-3 font-serif text-[32px] font-bold leading-tight tracking-tight text-[#2a1a10] sm:text-5xl">
                        The Unstoppable Advantage
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-[15px] font-medium text-slate-500 sm:text-base">
                        Why thousands choose us for their career growth.
                    </p>
                </div>

                {/* Mobile: 2x2 grid. Tablet/desktop (md+): single row timeline */}
                <div className="reveal-on-scroll grid grid-cols-2 gap-x-4 gap-y-10 md:flex md:items-stretch md:justify-between md:gap-0">
                    {ITEMS.map((item, i) => (
                        <React.Fragment key={item.title}>
                            <div className="flex h-full w-full flex-col items-center text-center md:max-w-[160px]">
                                <div
                                    className="
                                        flex h-20 w-20 shrink-0 items-center justify-center rounded-full
                                        bg-gradient-to-br from-[#3a2718] to-[#6b4e37]
                                        shadow-[0_10px_28px_rgba(74,55,40,0.25)]
                                        ring-4 ring-white/60 md:h-24 md:w-24
                                    "
                                >
                                    <item.icon className="h-7 w-7 text-white md:h-8 md:w-8" strokeWidth={1.6} />
                                </div>

                                <p className="mt-4 text-[13px] font-black uppercase tracking-wider text-[#2a1a10] md:text-sm">
                                    {item.title}
                                </p>
                                <p className="mt-1 text-[13px] leading-snug text-slate-500">
                                    {item.description}
                                </p>

                                {/* mt-auto: description 2 ya 3 line ki ho, number hamesha ek hi line par rahega */}
                                <div className="mt-auto flex flex-col items-center gap-1.5 pt-4">
                                    <span className="text-sm font-bold text-[#8b7355]">
                                        {item.number}
                                    </span>
                                    <span className="h-0.5 w-6 rounded-full bg-[#8b7355]" />
                                </div>
                            </div>

                            {/* Connector between items (sirf md+ par, last ke baad nahi) */}
                            {i < ITEMS.length - 1 && (
                                <div className="mt-12 hidden flex-1 items-start justify-center md:flex">
                                    <div className="mt-0 flex w-full items-center">
                                        <div className="h-px w-full border-t border-dashed border-[#c9b493]" />
                                        <span className="mx-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8b7355]" />
                                        <div className="h-px w-full border-t border-dashed border-[#c9b493]" />
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Tagline */}
                <p className="reveal-on-scroll mt-12 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a08368] sm:text-[11px] sm:tracking-[0.3em] md:mt-14">
                    Same People. Bigger Possibilities.
                </p>
            </div>
        </section>
    );
}