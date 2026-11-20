"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { getSuggestedSkills, POPULAR_SKILLS } from "../../constants/domainSkills";

interface SkillsInputProps {
    skills: string[];
    setSkills: React.Dispatch<React.SetStateAction<string[]>>;
    domains: string[];
    max?: number;
    inputCls: string;
}

/**
 * Skills input with suggestions:
 *  - dropdown autocomplete while typing (suggested skills of selected domains first)
 *  - clickable "Suggested for your domains" chips below the input
 *  - comma-separated input ("HTML, CSS, JS") is split into separate skills
 */
export default function SkillsInput({ skills, setSkills, domains, max = 20, inputCls }: SkillsInputProps) {
    const [input, setInput] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const wrapRef = useRef<HTMLDivElement>(null);

    const pool = useMemo(() => {
        const fromDomains = getSuggestedSkills(domains);
        const base = fromDomains.length ? fromDomains : POPULAR_SKILLS;
        return base;
    }, [domains]);

    const taken = useMemo(() => new Set(skills.map((s) => s.toLowerCase())), [skills]);
    const available = useMemo(() => pool.filter((s) => !taken.has(s.toLowerCase())), [pool, taken]);

    const matches = useMemo(() => {
        const q = input.trim().toLowerCase();
        if (!q) return [];
        // search domain skills first, then every other known skill
        const all = [...pool, ...POPULAR_SKILLS];
        const uniq = Array.from(new Set(all)).filter((s) => !taken.has(s.toLowerCase()));
        const starts = uniq.filter((s) => s.toLowerCase().startsWith(q));
        const contains = uniq.filter((s) => !s.toLowerCase().startsWith(q) && s.toLowerCase().includes(q));
        return [...starts, ...contains].slice(0, 8);
    }, [input, pool, taken]);

    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    const addMany = (raw: string[]) => {
        setSkills((prev) => {
            const next = [...prev];
            for (const r of raw) {
                const t = r.trim();
                if (t && next.length < max && !next.some((s) => s.toLowerCase() === t.toLowerCase())) next.push(t);
            }
            return next;
        });
    };

    const commitInput = () => {
        if (active >= 0 && matches[active]) addMany([matches[active]]);
        else addMany(input.split(","));
        setInput("");
        setActive(-1);
        setOpen(false);
    };

    return (
        <div>
            <div className="flex gap-2" ref={wrapRef}>
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => { setInput(e.target.value); setOpen(true); setActive(-1); }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); commitInput(); }
                            else if (e.key === "ArrowDown" && matches.length) { e.preventDefault(); setActive((a) => (a + 1) % matches.length); }
                            else if (e.key === "ArrowUp" && matches.length) { e.preventDefault(); setActive((a) => (a <= 0 ? matches.length - 1 : a - 1)); }
                            else if (e.key === "Escape") setOpen(false);
                        }}
                        placeholder="Type a skill and press Enter..."
                        className={`${inputCls} w-full`}
                        autoComplete="off"
                    />
                    {open && matches.length > 0 && (
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#e5d9cd] rounded-xl shadow-lg max-h-52 overflow-y-auto">
                            {matches.map((s, i) => (
                                <button
                                    key={s}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { addMany([s]); setInput(""); setActive(-1); setOpen(false); }}
                                    className={`w-full text-left px-3.5 py-2 text-sm ${i === active ? "bg-[#f3ece4] text-[#4a3728] font-semibold" : "text-slate-600 hover:bg-[#fdf9f6]"}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={commitInput}
                    className="px-3.5 py-2.5 rounded-xl text-white font-bold transition-opacity hover:opacity-90 flex-shrink-0"
                    style={{ backgroundColor: "#4a3728" }}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {skills.map((skill) => (
                        <span key={skill} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: "#4a3728" }}>
                            {skill}
                            <button type="button" onClick={() => setSkills((p) => p.filter((s) => s !== skill))} className="hover:text-red-300 ml-0.5">×</button>
                        </span>
                    ))}
                </div>
            )}

            {available.length > 0 && skills.length < max && (
                <div className="mt-3">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                        {domains.length ? "Suggested for your domains — click to add" : "Popular skills — click to add"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {available.slice(0, 12).map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => addMany([s])}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-[#4a3728]/30 text-[#4a3728] bg-white hover:bg-[#f3ece4] transition-colors"
                            >
                                <Plus className="w-3 h-3" /> {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
