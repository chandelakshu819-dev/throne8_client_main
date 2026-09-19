"use client";

import React from "react";
import { MessageSquare, ChevronDown, ArrowRight } from "lucide-react";
import { FAQS } from "@/features/index";

interface FAQSectionProps {
    openFaq: number | null;
    setOpenFaq: (index: number | null) => void;
}

export default function FAQSection({ openFaq, setOpenFaq }: FAQSectionProps) {
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

                <div className="relative z-10">
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

                    {/* Accordion */}
                    <div className="space-y-2.5">
                        {FAQS.map((f, i) => {
                            const isOpen = openFaq === i;

                            return (
                                <div
                                    key={i}
                                    className={`rounded-xl border bg-[#FFFDF9] transition-all duration-300 ${
                                        isOpen
                                            ? "border-[#E2CDAE] shadow-[0_8px_20px_rgba(120,90,50,0.10)]"
                                            : "border-[#F0E8DC] shadow-[0_2px_8px_rgba(120,90,50,0.05)] hover:shadow-[0_6px_16px_rgba(120,90,50,0.09)]"
                                    }`}
                                >
                                    <button
                                        type="button"
                                        id={`faq-question-${i}`}
                                        aria-expanded={isOpen}
                                        aria-controls={`faq-answer-${i}`}
                                        onClick={() => setOpenFaq(isOpen ? null : i)}
                                        className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5"
                                    >
                                        <span className="text-[14px] font-bold text-[#2A1A10] sm:text-[15px]">
                                            {f.q}
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
                                        id={`faq-answer-${i}`}
                                        role="region"
                                        aria-labelledby={`faq-question-${i}`}
                                        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                                            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                        }`}
                                    >
                                        <div className="overflow-hidden">
                                            <p className="px-4 pb-4 text-[13px] leading-relaxed text-[#7A6A5A] sm:px-5 sm:text-sm">
                                                {f.a}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* CTA */}
                    <div className="mt-8 text-center">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full bg-[#4A2F20] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(74,47,32,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:gap-3 hover:bg-[#5A3A28]"
                        >
                            View All Questions
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}