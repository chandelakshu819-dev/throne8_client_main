"use client";
//src/features/mentorship/components/sections/OurImpactSection.tsx
import React from "react";
import Link from "next/link";
import { Users, CalendarCheck, Briefcase, ArrowRight } from "lucide-react";

interface OurImpactSectionProps {
    stats?: {
        mentors: number;
        sessions: number;
        domains: number;
    };
}

/** 1250 -> "1K+", 340 -> "340+", 12 -> "12" (chhote numbers ko inflate nahi karta) */
function formatImpact(n: number): string {
    if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
    if (n >= 100) return `${Math.floor(n / 10) * 10}+`;
    return String(n);
}

function Stat({ value }: { value: string }) {
    const hasPlus = value.endsWith("+");
    return (
        <>
            {hasPlus ? value.slice(0, -1) : value}
            {hasPlus && <span className="text-[#8b7355]">+</span>}
        </>
    );
}

interface SideCardProps {
    icon: React.ReactNode;
    value: string;
    title: string;
    caption: string;
}

function SideCard({ icon, value, title, caption }: SideCardProps) {
    return (
        <div className="group relative h-full rounded-[20px] border border-[#e5d9cc] bg-[#FFFDF9] px-4 py-5 shadow-[0_10px_30px_rgba(74,55,40,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(74,55,40,0.12)] sm:px-6 sm:py-6">
            <div className="flex items-start gap-4 sm:gap-5">
                <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-[#f4eadc] sm:h-[58px] sm:w-[58px]">
                    {icon}
                </div>
                <div className="min-w-0 pt-0.5">
                    <h3 className="text-[36px] font-black leading-none tracking-[-2px] text-[#4a3728] sm:text-[43px]">
                        <Stat value={value} />
                    </h3>
                    <p className="mt-1.5 text-[14px] font-bold text-[#4a3728] sm:text-[15px]">{title}</p>
                    <div className="mt-3 h-[2px] w-[55px] bg-[#b78b45]" />
                    <p className="mt-3 text-[13px] leading-[1.55] text-[#75685d]">{caption}</p>
                </div>
            </div>
        </div>
    );
}

export default function OurImpactSection({ stats }: OurImpactSectionProps) {
    // Real data nahi aaya (loading/error/0 mentors) to fake numbers dikhane ke bajay section hi nahi dikhega
    if (!stats || stats.mentors <= 0) return null;

    return (
        <section className="relative w-full overflow-hidden bg-[#f7f1e6] px-4 py-10 sm:px-6 md:py-16">
            {/* Background decoration: bade circles sirf desktop par, mobile par overflow ka kaaran bante the */}
            <div className="pointer-events-none absolute left-[-180px] top-[10%] hidden h-[450px] w-[450px] rounded-full bg-[#8b7355]/5 blur-3xl lg:block" />
            <div className="pointer-events-none absolute bottom-[-150px] right-[-150px] hidden h-[450px] w-[450px] rounded-full bg-[#4a3728]/5 blur-3xl lg:block" />
            <div className="pointer-events-none absolute right-[28%] top-[8%] hidden h-[460px] w-[460px] rounded-full border border-[#d4af37]/10 lg:block" />
            <div className="pointer-events-none absolute right-[31%] top-[13%] hidden h-[390px] w-[390px] rounded-full border border-[#d4af37]/10 lg:block" />

            <div className="relative z-10 mx-auto max-w-[1240px]">
                <div className="grid items-center gap-8 lg:grid-cols-[32%_30%_38%] lg:gap-0">
                    {/* LEFT: editorial content */}
                    <div className="relative z-20 lg:pr-10">
                        <span className="mb-3 block text-[10px] font-bold uppercase tracking-[5px] text-[#8b7355]">
                            By the numbers
                        </span>

                        <h2 className="whitespace-nowrap text-[40px] font-black leading-none tracking-[-2px] text-[#4a3728] md:text-[48px] lg:text-[50px]">
                            Our <span className="text-[#8b7355]">Impact</span>
                        </h2>

                        <p className="mt-5 max-w-[390px] text-[15px] leading-[1.65] text-[#75685d] md:text-[16px]">
                            Transforming careers through meaningful connections and expert guidance.
                        </p>

                        <div className="mt-6 h-[3px] w-[66px] rounded-full bg-[#b78b45]" />

                        <Link
                            href="/mentorship/community/forums"
                            className="group mt-6 inline-flex items-center gap-4 rounded-full bg-[#4a3728] px-6 py-3.5 text-[13px] font-bold text-white shadow-[0_12px_25px_rgba(74,55,40,0.18)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#5b4230]"
                        >
                            Join Our Community
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                    </div>

                    {/* CENTER: mentors count */}
                    <div className="relative flex items-center justify-center lg:h-[420px]">
                        {/* Mobile: ek simple circle card. Desktop: purane concentric rings */}
                        <div className="absolute left-1/2 top-1/2 hidden h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#eee5da] opacity-75 lg:block" />
                        <div className="absolute left-1/2 top-1/2 hidden h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d4af37]/15 lg:block" />
                        <div className="absolute left-1/2 top-1/2 hidden h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d4af37]/10 lg:block" />

                        <div className="relative z-10 w-full rounded-[28px] border border-[#e5d9cc] bg-[#eee5da]/60 px-6 py-8 text-center lg:w-auto lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
                            <div className="mx-auto mb-4 flex h-[54px] w-[54px] items-center justify-center rounded-full border border-[#dccdbb] bg-[#FFF9EF] shadow-[0_8px_20px_rgba(74,55,40,0.08)] lg:mb-5 lg:h-[62px] lg:w-[62px]">
                                <Users className="h-7 w-7 text-[#a27d48] lg:h-8 lg:w-8" />
                            </div>

                            <h3 className="text-[56px] font-black leading-none tracking-[-3px] text-[#4a3728] md:text-[64px] lg:text-[72px] lg:tracking-[-4px]">
                                <Stat value={formatImpact(stats.mentors)} />
                            </h3>

                            <p className="mt-3 text-[17px] font-bold text-[#4a3728] lg:text-[18px]">
                                {stats.mentors === 1 ? "Active Mentor" : "Active Mentors"}
                            </p>

                            <div className="mx-auto mt-4 h-[2px] w-[66px] bg-[#b78b45] lg:mt-5" />

                            <p className="mt-4 text-[14px] leading-[1.55] text-[#75685d] lg:mt-5">
                                A growing community
                                <br />
                                of industry leaders
                            </p>
                        </div>
                    </div>

                    {/* RIGHT: cards. Mobile: 1 column, tablet: 2 columns, desktop: stacked with side line */}
                    <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5 lg:border-l lg:border-[#d8c4aa] lg:pl-9">
                        {stats.sessions > 0 && (
                            <SideCard
                                icon={<CalendarCheck className="h-6 w-6 text-[#9b7542] sm:h-7 sm:w-7" />}
                                value={formatImpact(stats.sessions)}
                                title="Mentorship Sessions"
                                caption="Conversations that moved careers forward"
                            />
                        )}
                        {stats.domains > 0 && (
                            <SideCard
                                icon={<Briefcase className="h-6 w-6 text-[#9b7542] sm:h-7 sm:w-7" />}
                                value={formatImpact(stats.domains)}
                                title="Mentorship Domains"
                                caption="Guidance across diverse fields"
                            />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}