"use client";

import React from "react";
import { Filter, Search, Sparkles } from "lucide-react";

interface SidebarProps {
    companySearch: string;
    setCompanySearch: (v: string) => void;
    selectedDomains: string[];
    setSelectedDomains: (v: string[]) => void;
    selectedExps: string[];
    setSelectedExps: (v: string[]) => void;
    onApply: () => void;
    onClear: () => void;
}

const DOMAINS = ["Tech/Engineering", "Product/Design", "Marketing/Growth", "Data Science/AI"];
const EXPERIENCES = ["0-3 Yrs", "3-7 Yrs", "7-12 Yrs", "12+ Yrs"];

export default function Sidebar({
    companySearch, setCompanySearch,
    selectedDomains, setSelectedDomains,
    selectedExps, setSelectedExps,
    onApply, onClear,
}: SidebarProps) {

    const toggleDomain = (domain: string) => {
        setSelectedDomains(
            selectedDomains.includes(domain)
                ? selectedDomains.filter(d => d !== domain)
                : [...selectedDomains, domain]
        );
    };

    const toggleExp = (exp: string) => {
        setSelectedExps(
            selectedExps.includes(exp)
                ? selectedExps.filter(e => e !== exp)
                : [...selectedExps, exp]
        );
    };

    return (
        <aside className="hidden lg:block sticky top-28 space-y-6 self-start">
            <div className="bg-white border border-[#ece7e2] rounded-[32px] p-6 shadow-sm">
                <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[3px] text-[#8b7355] mb-8">
                    <Filter className="w-4 h-4" /> Refine Search
                </h4>

                <div className="space-y-8">
                    {/* Company Search */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Company</p>
                        <div className="relative">  
                            <input
                                type="text"
                                value={companySearch}
                                onChange={(e) => setCompanySearch(e.target.value)}
                                placeholder="Search companies..."
                                className="w-full px-4 py-2.5 text-sm font-bold bg-[#f8f6f4] border border-[#ece7e2] rounded-2xl focus:outline-none focus:border-[#8b7355] transition-colors"
                            />
                            <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    {/* Domain Filter */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Domain</p>
                        {DOMAINS.map((domain) => (
                            <label key={domain} className="flex items-center gap-3 text-sm font-bold cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selectedDomains.includes(domain)}
                                    onChange={() => toggleDomain(domain)}
                                    className="accent-[#4a3728] w-4 h-4 rounded border-[#ece7e2]"
                                />
                                <span className="group-hover:text-[#8b7355] transition-colors">{domain}</span>
                            </label>
                        ))}
                    </div>

                    {/* Experience Filter */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Experience</p>
                        {EXPERIENCES.map((exp) => (
                            <label key={exp} className="flex items-center gap-3 text-sm font-bold cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selectedExps.includes(exp)}
                                    onChange={() => toggleExp(exp)}
                                    className="accent-[#4a3728] w-4 h-4 rounded border-[#ece7e2]"
                                />
                                <span className="group-hover:text-[#8b7355] transition-colors">{exp}</span>
                            </label>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-between mt-8 space-x-3">
                        <button
                            onClick={onApply}
                            className="w-full py-3 bg-[#4a3728] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#634a36] transition-all"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={onClear}
                            className="w-full py-3 bg-[#f8f6f4] text-[#4a3728] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ece7e2] transition-all"
                        >
                            Clear All
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Card — same as before */}
            <div className="bg-gradient-to-br from-[#4a3728] to-[#634a36] rounded-[32px] p-5 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700" />
                <Sparkles className="w-5 h-5 text-[#8b7355] mb-3" />
                <p className="text-[10px] font-black uppercase tracking-[3px] mb-1.5">AI Matcher</p>
                <p className="text-[10px] text-white/70 leading-relaxed mb-4 font-medium">
                    Matching your profile with 500+ global mentors...
                </p>
                <button className="w-full py-2.5 bg-white/10 hover:bg-white text-white hover:text-[#4a3728] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md">
                    Start Quiz
                </button>
            </div>
        </aside>
    );
}