"use client";

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
        <section className="relative overflow-hidden bg-[#f7f1e6] px-6 py-20">
            {/* Decorative arcs */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full border border-[#e6d6bd]/60" />
            <div className="pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-[#eddcc0]/50 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#8b7355]/5 blur-3xl" />

            <div className="relative z-10 mx-auto max-w-5xl">
                {/* Header */}
                <div className="reveal-on-scroll mb-14 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8b7355]">
                        The Unstoppable Advantage
                    </p>
                    <h2 className="mt-3 font-serif text-4xl font-bold tracking-tight text-[#2a1a10] sm:text-5xl">
                        The Unstoppable Advantage
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-base font-medium text-slate-500">
                        Why thousands choose us for their career growth.
                    </p>
                </div>

                {/* Timeline */}
                <div className="reveal-on-scroll flex items-start justify-between">
                    {ITEMS.map((item, i) => (
                        <React.Fragment key={item.title}>
                            <div className="flex w-full max-w-[160px] flex-col items-center text-center">
                                <div
                                    className="
                                        flex h-24 w-24 items-center justify-center rounded-full
                                        bg-gradient-to-br from-[#3a2718] to-[#6b4e37]
                                        shadow-[0_10px_28px_rgba(74,55,40,0.25)]
                                        ring-4 ring-white/60
                                    "
                                >
                                    <item.icon className="h-8 w-8 text-white" strokeWidth={1.6} />
                                </div>

                                <p className="mt-4 text-sm font-black uppercase tracking-wider text-[#2a1a10]">
                                    {item.title}
                                </p>
                                <p className="mt-1 text-[13px] leading-snug text-slate-500">
                                    {item.description}
                                </p>

                                <div className="mt-4 flex flex-col items-center gap-1.5">
                                    <span className="text-sm font-bold text-[#8b7355]">
                                        {item.number}
                                    </span>
                                    <span className="h-0.5 w-6 rounded-full bg-[#8b7355]" />
                                </div>
                            </div>

                            {/* Connector between items (not after the last one) */}
                            {i < ITEMS.length - 1 && (
                                <div className="mt-12 hidden flex-1 items-center justify-center sm:flex">
                                    <div className="h-px w-full border-t border-dashed border-[#c9b493]" />
                                    <span className="mx-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8b7355]" />
                                    <div className="h-px w-full border-t border-dashed border-[#c9b493]" />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Tagline */}
                <p className="reveal-on-scroll mt-14 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a08368]">
                    Same People. Bigger Possibilities.
                </p>
            </div>
        </section>
    );
}