// src/features/mentorship/components/layout/MentorshipFooter.tsx
import React from "react";
import Link from "next/link";
import { Crown, Linkedin, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { COMPANY } from "@/config/company.config";

interface FooterLink {
    label: string;
    href: string;
    /** false = abhi launch nahi hua, click par kahin nahi jayega */
    live: boolean;
}

interface FooterGroup {
    title: string;
    links: FooterLink[];
}

const LINK_GROUPS: FooterGroup[] = [
    {
        title: "Mentorship",
        links: [
            { label: "1-to-1 Services", href: "/mentorship/services", live: true },
            { label: "Senior Mentor Services", href: "/mentorship/senior-services", live: true },
            { label: "Group Sessions", href: "/mentorship/group-sessions", live: true },
        ],
    },
    {
        title: "Community",
        links: [
            { label: "Forums", href: "/mentorship/community/forums", live: true },
            { label: "Events", href: "/mentorship/community/events", live: true },
        ],
    },
    {
        title: "Throne8",
        links: [
            // Launch hone par live: true kar dena
            { label: "Home Feed", href: "/dashboard", live: false },
            { label: "Jobs", href: "/job/jobs", live: false },
        ],
    },
    {
        title: "Legal & Support",
        links: [
            { label: "Privacy Policy", href: "/privacy-policy", live: true },
            { label: "Terms & Conditions", href: "/terms", live: true },
            { label: "Refund & Cancellation", href: "/refund-policy", live: true },
            { label: "Shipping & Delivery", href: "/shipping-policy", live: true },
            { label: "Contact Us", href: "/contact", live: true },
        ],
    },
];

export default function MentorshipFooter() {
    return (
        <footer className="bg-[#2d2015] text-[#e8d9cc] px-6 pt-14 pb-8">
            <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)] gap-10">
                {/* Brand + contact */}
                <div>
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#4a3728] flex items-center justify-center">
                            <Crown className="w-5 h-5 text-[#e8c987]" />
                        </div>
                        <span className="text-xl font-black text-white tracking-tight">Throne8</span>
                    </div>
                    <p className="text-sm text-[#b9a794] max-w-xs leading-relaxed mb-5">
                        Learn from industry mentors, book focused sessions, and grow with a community of builders.
                    </p>

                    <ul className="space-y-2.5 text-sm text-[#e8d9cc]">
                        <li className="flex items-start gap-2.5">
                            <Mail className="w-4 h-4 mt-0.5 text-[#c4963a] flex-shrink-0" />
                            <a href={`mailto:${COMPANY.email}`} className="hover:text-white transition-colors">
                                {COMPANY.email}
                            </a>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <Phone className="w-4 h-4 mt-0.5 text-[#c4963a] flex-shrink-0" />
                            <a href={COMPANY.phoneHref} className="hover:text-white transition-colors">
                                {COMPANY.phone}
                            </a>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <MapPin className="w-4 h-4 mt-0.5 text-[#c4963a] flex-shrink-0" />
                            <span className="text-[#b9a794] leading-snug max-w-[260px]">{COMPANY.address}</span>
                        </li>
                    </ul>

                    <a
                        href={COMPANY.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Throne8 on LinkedIn"
                        className="inline-flex items-center justify-center w-9 h-9 mt-5 rounded-full border border-white/15 text-[#e8d9cc] hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <Linkedin className="w-4 h-4" />
                    </a>
                </div>

                {/* Link groups */}
                {LINK_GROUPS.map((group) => (
                    <div key={group.title}>
                        <h4 className="text-[11px] font-black uppercase tracking-[3px] text-[#c4963a] mb-4">
                            {group.title}
                        </h4>
                        <ul className="space-y-2.5">
                            {group.links.map((link) => (
                                <li key={link.label}>
                                    {link.live ? (
                                        <Link
                                            href={link.href}
                                            className="text-sm text-[#e8d9cc] hover:text-white transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    ) : (
                                        <span
                                            aria-disabled="true"
                                            title="Coming soon"
                                            className="inline-flex items-center gap-2 text-sm text-[#e8d9cc]/45 cursor-not-allowed select-none"
                                        >
                                            {link.label}
                                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-[#c4963a]/40 text-[#c4963a]/80">
                                                Soon
                                            </span>
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="max-w-[1240px] mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#9d8c7b]">
                <span>
                    © {new Date().getFullYear()} {COMPANY.legalName} All rights reserved.
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#c4963a]" />
                    Secure payments powered by Razorpay
                </span>
            </div>
        </footer>
    );
}