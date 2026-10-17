// src/features/mentorship/components/profile/discovery/MentorDiscovery.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Star,
  Scale,
  Filter,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Target,
  Briefcase,
} from "lucide-react";
import MentorService from "@/lib/api/mentorship.service";

interface ApiMentor {
  mentorId: string;
  userId?: string;
  title?: string;
  company?: string;
  profilePic?: string;
  skills?: string[];
  domains?: string[];
  experience?: { total?: number; currentRole?: string; level?: string };
  pricing?: { quickCall?: number };
  stats?: { averageRating?: number; completionRate?: number; totalSessions?: number };
  user?: { firstName?: string; lastName?: string; fullName?: string } | null;
}

interface MentorDiscoveryProps {
  // Purane parent ke saath compatible rakhne ke liye. Ab ye ignore hota hai.
  mentors?: unknown;
  compareList?: Array<string | number>;
  toggleCompare?: (id: any) => void;
}

const DOMAIN_FILTERS: Record<string, string[]> = {
  "Tech/Engineering": ["web", "software", "engineer", "development", "backend", "frontend", "mobile", "devops", "cloud", "tech"],
  "Product/Design": ["product", "design", "ux", "ui"],
  "Marketing/Growth": ["marketing", "growth", "seo", "sales", "brand"],
  "Data Science/AI": ["data", "ai", "ml", "machine", "analytics", "science"],
};

const EXPERIENCE_FILTERS: Record<string, [number, number]> = {
  "0-3 Yrs": [0, 3],
  "3-7 Yrs": [3, 7],
  "7-12 Yrs": [7, 12],
  "12+ Yrs": [12, 100],
};

const INITIAL_VISIBLE = 6;

const getName = (m: ApiMentor): string => {
  const full =
    m.user?.fullName ||
    `${m.user?.firstName || ""} ${m.user?.lastName || ""}`.trim();
  return full || "Mentor";
};

const slugify = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "mentor";

const initials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "M";

export default function MentorDiscovery({
  compareList,
  toggleCompare,
}: MentorDiscoveryProps) {
  const [mentors, setMentors] = useState<ApiMentor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [domainSel, setDomainSel] = useState<string[]>([]);
  const [expSel, setExpSel] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [localCompare, setLocalCompare] = useState<Array<string | number>>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await MentorService.getAllMentors({ page: 1, limit: 50 });
        const list: ApiMentor[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.mentors)
          ? res.data.mentors
          : Array.isArray(res?.mentors)
          ? res.mentors
          : [];
        if (!cancelled) setMentors(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load mentors.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCompare = compareList ?? localCompare;
  const onToggleCompare = (id: string) => {
    if (toggleCompare) {
      toggleCompare(id);
      return;
    }
    setLocalCompare((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleIn = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const filtered = useMemo(() => {
    return mentors.filter((m) => {
      if (domainSel.length > 0) {
        const haystack = [
          ...(m.domains || []),
          m.title || "",
          m.experience?.currentRole || "",
        ]
          .join(" ")
          .toLowerCase()
          .replace(/_/g, " ");
        const ok = domainSel.some((d) =>
          DOMAIN_FILTERS[d].some((kw) => haystack.includes(kw))
        );
        if (!ok) return false;
      }

      if (expSel.length > 0) {
        const years = m.experience?.total ?? 0;
        const ok = expSel.some((label) => {
          const [min, max] = EXPERIENCE_FILTERS[label];
          return years >= min && years < max;
        });
        if (!ok) return false;
      }

      const price = m.pricing?.quickCall ?? 0;
      if (price > maxPrice) return false;

      return true;
    });
  }, [mentors, domainSel, expSel, maxPrice]);

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);

  const clearAll = () => {
    setDomainSel([]);
    setExpSel([]);
    setMaxPrice(5000);
  };

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
      {/* STICKY SIDEBAR */}
      <aside className="hidden lg:block sticky top-28 space-y-6 max-h-[calc(100vh-120px)] overflow-visible">
        <div className="bg-white border border-[#ece7e2] rounded-[32px] p-6 shadow-sm">
          <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[3px] text-[#8b7355] mb-8">
            <Filter className="w-4 h-4" /> Refine Search
          </h4>
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Domain
              </p>
              {Object.keys(DOMAIN_FILTERS).map((domain) => (
                <label
                  key={domain}
                  className="flex items-center gap-3 text-sm font-bold cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={domainSel.includes(domain)}
                    onChange={() => toggleIn(domainSel, setDomainSel, domain)}
                    className="accent-[#4a3728] w-4 h-4 rounded border-[#ece7e2]"
                  />
                  <span className="group-hover:text-[#8b7355] transition-colors">
                    {domain}
                  </span>
                </label>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Experience
              </p>
              {Object.keys(EXPERIENCE_FILTERS).map((exp) => (
                <label
                  key={exp}
                  className="flex items-center gap-3 text-sm font-bold cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={expSel.includes(exp)}
                    onChange={() => toggleIn(expSel, setExpSel, exp)}
                    className="accent-[#4a3728] w-4 h-4 rounded border-[#ece7e2]"
                  />
                  <span className="group-hover:text-[#8b7355] transition-colors">
                    {exp}
                  </span>
                </label>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Max Price
              </p>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1 bg-[#f8f6f4] accent-[#4a3728] appearance-none rounded-full"
              />
              <div className="flex justify-between text-[10px] font-black text-slate-400">
                <span>Free</span>
                <span>{maxPrice >= 5000 ? "Any" : `Up to Rs ${maxPrice}`}</span>
              </div>
            </div>

            <button
              onClick={clearAll}
              className="w-full py-2.5 bg-[#f8f6f4] hover:bg-[#ece7e2] text-[#4a3728] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#4a3728] to-[#634a36] rounded-[32px] p-5 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700" />
          <Sparkles className="w-5 h-5 text-[#8b7355] mb-3" />
          <p className="text-[10px] font-black uppercase tracking-[3px] mb-1.5">
            AI Matcher
          </p>
          <p className="text-[10px] text-white/70 leading-relaxed mb-4 font-medium">
            Matching your profile with mentors on Throne8...
          </p>
          <button className="w-full py-2.5 bg-white/10 hover:bg-white text-white hover:text-[#4a3728] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md">
            Start Quiz
          </button>
        </div>
      </aside>

      {/* MENTOR CARDS */}
      <div>
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-80 rounded-[40px] bg-white border border-[#ece7e2] animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-white border border-[#ece7e2] rounded-[32px] p-8 text-center">
            <p className="text-sm font-bold text-[#4a3728] mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-[#4a3728] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white border border-[#ece7e2] rounded-[32px] p-8 text-center">
            <p className="text-sm font-bold text-[#4a3728]">
              No mentors found. Try changing the filters.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {visible.map((m) => {
                const name = getName(m);
                const role = m.experience?.currentRole || m.title || "Mentor";
                const rating = m.stats?.averageRating ?? 0;
                const tags = (m.skills || []).slice(0, 3);
                const price = m.pricing?.quickCall ?? 0;
                const href = `/mentorship/mentor-card/${slugify(name)}/${m.mentorId}`;

                return (
                  <div
                    key={m.mentorId}
                    className="relative group bg-white rounded-[40px] p-6 shadow-sm border border-[#ece7e2] hover:shadow-2xl transition-all duration-500"
                  >
                    <button
                      onClick={() => onToggleCompare(m.mentorId)}
                      className={`absolute top-5 right-5 z-10 p-2.5 rounded-full border transition-all ${
                        activeCompare.includes(m.mentorId)
                          ? "bg-[#4a3728] text-white"
                          : "bg-white text-slate-400 border-[#ece7e2]"
                      }`}
                      aria-label="Compare mentor"
                    >
                      <Scale className="w-4 h-4" />
                    </button>

                    <div className="flex justify-center mb-6">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#ece7e2] group-hover:border-[#8b7355] transition-all duration-500 shadow-lg group-hover:scale-110 bg-[#f8f6f4] flex items-center justify-center">
                        {m.profilePic ? (
                          <img
                            src={m.profilePic}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                            alt={name}
                          />
                        ) : (
                          <span className="text-3xl font-black text-[#8b7355]">
                            {initials(name)}
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-lg font-bold mb-1 text-center">{name}</h4>
                    <p className="text-[10px] font-black text-[#8b7355] uppercase tracking-[2px] mb-4 text-center">
                      {role}
                      {m.company ? ` @ ${m.company}` : ""}
                    </p>

                    {tags.length > 0 && (
                      <div className="flex gap-2 mb-6 flex-wrap justify-center">
                        {tags.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] bg-[#f8f6f4] px-3 py-1 rounded-lg font-bold text-slate-500 border border-[#ece7e2] max-w-[180px] truncate"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2 mb-5">
                      <div className="flex items-center gap-3 text-[#3d3d3d]">
                        <MessageSquare className="w-4 h-4 text-[#8b7355]" />
                        <span className="font-medium text-sm">1:1 Call Sessions</span>
                      </div>
                      <div className="flex items-center gap-3 text-[#3d3d3d]">
                        <Briefcase className="w-4 h-4 text-[#8b7355]" />
                        <span className="font-medium text-sm">
                          {m.experience?.total ?? 0} yr experience
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[#3d3d3d]">
                        <Target className="w-4 h-4 text-[#8b7355]" />
                        <span className="font-medium text-sm">
                          {m.stats?.completionRate ?? 100}% completion rate
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t border-[#f0edea]">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 fill-[#8b7355] text-[#8b7355]" />
                          <span className="text-sm font-black">
                            {rating > 0 ? rating.toFixed(1) : "New"}
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {price > 0 ? `Rs ${price}` : "Free"}
                        </span>
                      </div>
                      <Link
                        href={href}
                        className="px-6 py-2.5 bg-[#4a3728] text-white rounded-2xl active:scale-105 transition-all duration-500 font-bold text-[10px] uppercase tracking-widest"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length > INITIAL_VISIBLE && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="group relative w-full py-4 bg-[#FAF9F6] text-[#4a3728] text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:gap-3 overflow-hidden mt-8"
              >
                <span className="absolute inset-0 bg-[#ece7e2] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                <span className="relative z-10">
                  {showAll ? "Show less" : `Show all (${filtered.length})`}
                </span>
                <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-all duration-300" />
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}