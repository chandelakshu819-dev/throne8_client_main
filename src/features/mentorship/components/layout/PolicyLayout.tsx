// src/features/mentorship/components/layout/PolicyLayout.tsx
import React from "react";
import Link from "next/link";
import { ArrowLeft, Crown } from "lucide-react";
import MentorshipFooter from "./MentorshipFooter";
import { COMPANY } from "@/config/company.config";

export function PolicySection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="mb-9">
            <h2 className="text-lg sm:text-xl font-bold text-[#2d2116] mb-3">{title}</h2>
            <div className="space-y-3 text-sm sm:text-[15px] text-[#5c4a3d] leading-relaxed">
                {children}
            </div>
        </section>
    );
}

export function PolicyList({ items }: { items: React.ReactNode[] }) {
    return (
        <ul className="list-disc pl-5 space-y-1.5 marker:text-[#8b7355]">
            {items.map((item, idx) => (
                <li key={idx}>{item}</li>
            ))}
        </ul>
    );
}

interface PolicyLayoutProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

export default function PolicyLayout({ title, subtitle, children }: PolicyLayoutProps) {
    return (
        <div className="min-h-screen bg-[#fbf8f4] text-[#2d2116] font-sans flex flex-col">
            {/* Simple public header */}
            <header className="border-b border-[#ece7e2] bg-[#f8f3ee]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/mentorship" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#4a3728] flex items-center justify-center">
                            <Crown className="w-5 h-5 text-[#e8c987]" />
                        </div>
                        <span className="text-lg font-black tracking-tight text-[#2d2116]">Throne8</span>
                    </Link>
                    <Link
                        href="/mentorship"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#6e5849] hover:text-[#4a3426] transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Mentorship
                    </Link>
                </div>
            </header>

            <main className="flex-1">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#2d2116] mb-2">
                        {title}
                    </h1>
                    {subtitle && <p className="text-sm sm:text-base text-[#8e847c] mb-1">{subtitle}</p>}
                    <p className="text-xs text-[#8e847c] mb-10">
                        Last updated: {COMPANY.policyUpdatedOn}
                    </p>

                    <div className="bg-white border border-[#ece7e2] rounded-2xl p-6 sm:p-9 shadow-xs">
                        {children}
                    </div>
                </div>
            </main>

            <MentorshipFooter />
        </div>
    );
}