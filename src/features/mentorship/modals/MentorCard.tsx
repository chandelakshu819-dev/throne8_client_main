"use client";

import React, { useState } from "react";
import { Star, Award } from "lucide-react";
import { Mentor } from "@/features/index";
import { useRouter } from "next/navigation";

interface MentorCardProps {
    mentor: Mentor;
}

export default function MentorCard({ mentor }: MentorCardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleClick = () => {
        if (mentor.isDummy) return;
        const slugName = mentor.name.toLowerCase().replace(/\s+/g, "-");
        router.push(`/mentorship/mentor-card/${slugName}/${mentor.id}`);
    };
    return (
        <>
            {/* Full screen loader */}
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
                    <div className="w-12 h-12 rounded-full border-4 border-[#f5f0ea] border-t-[#c4963a] animate-spin" />
                </div>
            )}
            <div
                onClick={handleClick}
                className="flex-shrink-0 w-[280px] p-6 bg-[#f5f0ea] border border-[#ddd0c4] rounded-[32px] hover:border-[#3a2a1e] transition-all duration-500 group shadow-lg hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden cursor-pointer">
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#3a2a1e]/0 to-[#3a2a1e]/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Glow orb */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#c4963a]/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />

                <div className="relative z-10">
                    {/* Mentor Photo */}
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#f5f0ea] shadow-lg group-hover:scale-110 group-hover:border-[#c4963a] transition-all duration-500">
                            {mentor.image ? (
                                <img
                                    src={mentor.image}
                                    alt={mentor.name}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#d4c8be] text-[#4a3728] text-xl font-black">
                                    {mentor.isDummy ? "?" : mentor.name?.[0] ?? "M"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mentor Name */}
                    <h5 className="font-black text-base mb-1 text-center text-[#4a3728] group-hover:text-[#3a2a1e] transition-colors">
                        {mentor.isDummy ? "No Mentor Yet" : mentor.name}
                    </h5>

                    {/* Company & Role */}
                    <p className="text-[10px] text-[#8b7355] font-bold text-center mb-3 uppercase tracking-wider">
                        {mentor.role} @ {mentor.company}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center justify-center gap-1.5 mb-3">
                        {mentor.isDummy ? (
                            <span className="text-xs text-[#8b7355] italic">Slot Available</span>
                        ) : (
                            <>
                                <Star className="w-4 h-4 fill-[#c4963a] text-[#c4963a]" />
                                <span className="text-sm font-black text-[#4a3728]">{mentor.rating || "New"}</span>
                                <span className="text-[13px] text-[#6b5643] font-medium">
                                    ({mentor.sessions} sessions)
                                </span>
                            </>
                        )}
                    </div>

                    {/* Attendance Badge */}
                    <div className="flex justify-center mb-4">
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#4a3728]/10 text-[#4a3728] border border-[#4a3728]/15">
                            ✓ 95% Attendance
                        </span>
                    </div>

                    {/* Expertise Tags */}
                    <div className="flex gap-2 justify-center flex-wrap mb-4">
                        {mentor.tags?.map((tag: string) => (
                            <span
                                key={tag}
                                className="text-[9px] bg-[#f5ede3] px-3 py-1.5 rounded-full font-black text-[#4a3728] border border-[#e8d9cc] uppercase tracking-wider"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Experience Badge */}
                    <div className="flex items-center justify-center gap-2 pt-3 border-t border-[#ddd0c4]">
                        <Award className="w-4 h-4 text-[#c4963a]" />
                        <span className="text-xs font-bold text-[#4a3728]">
                            {mentor.exp} Experience
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}