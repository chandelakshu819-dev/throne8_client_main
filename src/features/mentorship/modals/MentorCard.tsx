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
                    <div className="w-12 h-12 rounded-full border-4 border-[#FAF9F6] border-t-[#8b7355] animate-spin" />
                </div>
            )}
            <div
                onClick={handleClick}
                className="flex-shrink-0 w-[280px] p-6 bg-[#FAF9F6] border border-[#ece7e2] rounded-[32px] hover:border-[#8b7355] transition-all duration-500 group shadow-lg hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-[#4a3728]/0 to-[#4a3728]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#8b7355]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />

                <div className="relative z-10">
                    {/* Mentor Photo */}
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:scale-110 group-hover:border-[#8b7355] transition-all duration-500">
                            {mentor.image ? (
                                <img
                                    src={mentor.image}
                                    alt={mentor.name}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#e0d8cf] text-[#4a3728] text-xl font-black">
                                    {mentor.isDummy ? "?" : mentor.name?.[0] ?? "M"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mentor Name */}
                    <h5 className="font-black text-base mb-1 text-center group-hover:text-[#8b7355] transition-colors">
                        {mentor.isDummy ? "No Mentor Yet" : mentor.name}
                    </h5>

                    {/* Company & Role */}
                    <p className="text-[10px] text-slate-500 font-bold text-center mb-3 uppercase tracking-wider">
                        {mentor.role} @ {mentor.company}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center justify-center gap-1.5 mb-4">
                        {mentor.isDummy ? (
                            <span className="text-xs text-slate-400 italic">Slot Available</span>
                        ) : (
                            <>
                                <Star className="w-4 h-4 fill-[#8b7355] text-[#8b7355]" />
                                <span className="text-sm font-black text-[#4a3728]">{mentor.rating || "New"}</span>
                                <span className="text-[14px] text-black font-medium">
                                    ({mentor.sessions} sessions)
                                </span>
                            </>
                        )}
                    </div>
                    <div className="text-[12px] text-black text-center font-medium mb-4">
                        95% Attandance
                    </div>

                    {/* Expertise Tags */}
                    <div className="flex gap-2 justify-center flex-wrap mb-4">
                        {mentor.tags?.map((tag: string) => (
                            <span
                                key={tag}
                                className="text-[9px] bg-white px-3 py-1.5 rounded-full font-black text-[#4a3728] border border-[#ece7e2] uppercase tracking-wider"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Experience Badge */}
                    <div className="flex items-center justify-center gap-2 pt-3 border-t border-[#f0edea]">
                        <Award className="w-4 h-4 text-[#8b7355]" />
                        <span className="text-xs font-bold text-[#4a3728]">
                            {mentor.exp} Experience
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}