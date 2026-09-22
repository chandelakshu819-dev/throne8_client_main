// src/features/mentorship/components/profile/discovery/MentorDiscovery.tsx
import React from "react";
import {
  Zap,
  Star,
  Scale,
  Filter,
  Sparkles,
  ArrowRight,
} from "lucide-react";
interface Mentor {
  id: number;
  name: string;
  role: string;
  company: string;
  rating: number;
  sessions: number;
  image: string;
  tags: string[];
  exp: string;
  match: number;
}
interface MentorDiscoveryProps {
  mentors: Mentor[];
  compareList: number[];
  toggleCompare: (id: number) => void;
}

export default function MentorDiscovery({
  mentors,
  compareList,
  toggleCompare,
}: MentorDiscoveryProps) {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
      {/* STICKY SIDEBAR */}
      <aside className="hidden lg:block sticky top-28 space-y-6 max-h-[calc(100vh-120px)] overflow-visible">
        {/* 1. Main Filter Card */}
        <div className="bg-white border border-[#ece7e2] rounded-[32px] p-6 shadow-sm">
          <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[3px] text-[#8b7355] mb-8">
            <Filter className="w-4 h-4" /> Refine Searching
          </h4>
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Domain
              </p>
              {[
                "Tech/Engineering",
                "Product/Design",
                "Marketing/Growth",
                "Data Science/AI",
              ].map((domain) => (
                <label
                  key={domain}
                  className="flex items-center gap-3 text-sm font-bold cursor-pointer group"
                >
                  <input
                    type="checkbox"
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
              {["0-3 Yrs", "3-7 Yrs", "7-12 Yrs", "12+ Yrs"].map((exp) => (
                <label
                  key={exp}
                  className="flex items-center gap-3 text-sm font-bold cursor-pointer group"
                >
                  <input
                    type="checkbox"
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
                Pricing
              </p>
              <input
                type="range"
                className="w-full h-1 bg-[#f8f6f4] accent-[#4a3728] appearance-none rounded-full"
              />
              <div className="flex justify-between text-[10px] font-black text-slate-400">
                <span>₹299</span>
                <span>₹5000+</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. AI Recommendation Card */}
        <div className="bg-gradient-to-br from-[#4a3728] to-[#634a36] rounded-[32px] p-5 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700" />
          <Sparkles className="w-5 h-5 text-[#8b7355] mb-3" />
          <p className="text-[10px] font-black uppercase tracking-[3px] mb-1.5">
            AI Matcher
          </p>
          <p className="text-[10px] text-white/70 leading-relaxed mb-4 font-medium">
            Matching your profile with 500+ global mentors...
          </p>
          <button className="w-full py-2.5 bg-white/10 hover:bg-white text-white hover:text-[#4a3728] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md">
            Start Quiz
          </button>
        </div>
      </aside>

      {/* Mentor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {mentors.map((m) => (
          <div
            key={m.id}
            className="relative group bg-white rounded-[40px] p-6 shadow-sm border border-[#ece7e2] hover:shadow-2xl transition-all duration-500"
          >
            <div className="absolute top-5 left-5 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#8b7355]/20 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#8b7355] fill-[#8b7355]" />
              <span className="text-[10px] font-black text-[#4a3728]">
                {m.match}% Match
              </span>
            </div>
            <button
              onClick={() => toggleCompare(m.id)}
              className={`absolute top-5 right-5 z-10 p-2.5 rounded-full border transition-all ${
                compareList.includes(m.id)
                  ? "bg-[#4a3728] text-white"
                  : "bg-white text-slate-400 border-[#ece7e2]"
              }`}
            >
              <Scale className="w-4 h-4" />
            </button>
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#ece7e2] group-hover:border-[#8b7355] transition-all duration-500 shadow-lg group-hover:scale-110">
                <img
                  src={m.image}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  alt={m.name}
                />
              </div>
            </div>
            <h4 className="text-lg font-bold mb-1 text-center">{m.name}</h4>
            <p className="text-[10px] font-black text-[#8b7355] uppercase tracking-[2px] mb-4 text-center">
              {m.role} @ {m.company}
            </p>
            <div className="flex gap-2 mb-6 flex-wrap justify-center">
              {m.tags.map((t: string) => (
                <span
                  key={t}
                  className="text-[9px] bg-[#f8f6f4] px-3 py-1 rounded-lg font-bold text-slate-500 border border-[#ece7e2]"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 text-[#3d3d3d]">
              <span className="text-xl">💬</span>
              <span className="font-medium">1:1 Call Sessions</span>
            </div>
            <div className="flex items-center gap-3 text-[#3d3d3d]">
              <span className="text-xl">⚡</span>
              <span className="font-medium">Replies within 2 hours</span>
            </div>
            <div className="flex items-center gap-3 text-[#3d3d3d]">
              <span className="text-xl">🎯</span>
              <span className="font-medium">95% Success Rate</span>
            </div>
            <div className="flex items-center justify-between pt-5 border-t border-[#f0edea]">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-[#8b7355] text-[#8b7355]" />
                <span className="text-sm font-black">{m.rating}</span>
              </div>
              <button className="px-6 py-2.5 bg-[#4a3728] text-white rounded-2xl hover:active:scale-105 transition-all duration-500 font-bold text-[10px] uppercase tracking-widest">
                Book
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Show All Button - Desktop */}
      <div className="hidden lg:block lg:col-start-2">
        <button className="group relative w-full py-4 bg-[#FAF9F6] text-[#4a3728] text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:gap-3 overflow-hidden mt-8">
          <span className="absolute inset-0 bg-[#ece7e2] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
          <span className="relative z-10 transition-colors duration-300">
            Show all
          </span>
          <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-all duration-300" />
        </button>
      </div>

      {/* Mobile Show All */}
      <div className="lg:hidden w-full mt-8">
        <button className="group relative w-full py-4 bg-[#FAF9F6] text-[#4a3728] text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:gap-3 overflow-hidden">
          <span className="absolute inset-0 bg-[#ece7e2] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
          <span className="relative z-10 transition-colors duration-300">
            Show all
          </span>
          <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-all duration-300" />
        </button>
      </div>
    </section>
  );
}