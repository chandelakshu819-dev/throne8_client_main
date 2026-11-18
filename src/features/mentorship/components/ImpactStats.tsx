//src/features/mentorship/components/ImpactStats.tsx
import React from "react";
import { Users, Clock, Briefcase } from "lucide-react";

export default function ImpactStats() {
  return (
    <section className="py-12 px-6 bg-[#FAF9F6] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#8b7355]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#4a3728]/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#4a3728] mb-3">
            Our <span className="text-[#8b7355]">Impact</span>
          </h2>
          <p className="text-slate-500 text-base font-medium max-w-2xl mx-auto">
            Transforming careers through meaningful connections and expert
            guidance
          </p>
        </div>

        {/* 3D Impact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Card 1 - Expert Members */}
          <div className="group perspective-1000">
            <div className="relative bg-white rounded-[32px] p-10 border-2 border-[#ece7e2] shadow-2xl hover:shadow-[0_20px_60px_rgba(74,55,40,0.15)] transition-all duration-700 transform-gpu hover:-translate-y-4 hover:rotate-y-5">
              {/* 3D Shadow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#4a3728]/10 to-transparent rounded-[32px] translate-x-2 translate-y-2 -z-10 group-hover:translate-x-4 group-hover:translate-y-4 transition-all duration-700" />

              {/* Floating orb */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#8b7355]/20 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />

              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#4a3728] to-[#634a36] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg relative z-10">
                <Users className="w-8 h-8 text-white" />
              </div>

              {/* Number */}
              <h3 className="text-5xl md:text-6xl font-black text-[#4a3728] mb-3 group-hover:text-[#8b7355] transition-colors">
                3000<span className="text-[#8b7355]">+</span>
              </h3>

              {/* Label */}
              <p className="text-base font-bold text-slate-600 uppercase tracking-[2px]">
                Expert Members
              </p>

              {/* Decorative line */}
              <div className="w-16 h-1 bg-gradient-to-r from-[#4a3728] to-[#8b7355] mt-6 rounded-full group-hover:w-full transition-all duration-700" />
            </div>
          </div>

          {/* Card 2 - Mentorship Minutes */}
          <div
            className="group perspective-1000"
            style={{ animationDelay: "100ms" }}
          >
            <div className="relative bg-white rounded-[32px] p-10 border-2 border-[#ece7e2] shadow-2xl hover:shadow-[0_20px_60px_rgba(74,55,40,0.15)] transition-all duration-700 transform-gpu hover:-translate-y-4 hover:rotate-y-5">
              {/* 3D Shadow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#8b7355]/10 to-transparent rounded-[32px] translate-x-2 translate-y-2 -z-10 group-hover:translate-x-4 group-hover:translate-y-4 transition-all duration-700" />

              {/* Floating orb */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#4a3728]/20 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />

              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#8b7355] to-[#a08368] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg relative z-10">
                <Clock className="w-8 h-8 text-white" />
              </div>

              {/* Number */}
              <h3 className="text-5xl md:text-6xl font-black text-[#4a3728] mb-3 group-hover:text-[#8b7355] transition-colors">
                350K<span className="text-[#8b7355]">+</span>
              </h3>

              {/* Label */}
              <p className="text-base font-bold text-slate-600 uppercase tracking-[2px]">
                Mentorship Minutes
              </p>

              {/* Decorative line */}
              <div className="w-16 h-1 bg-gradient-to-r from-[#8b7355] to-[#4a3728] mt-6 rounded-full group-hover:w-full transition-all duration-700" />
            </div>
          </div>

          {/* Card 3 - Career Domains */}
          <div
            className="group perspective-1000"
            style={{ animationDelay: "200ms" }}
          >
            <div className="relative bg-white rounded-[32px] p-10 border-2 border-[#ece7e2] shadow-2xl hover:shadow-[0_20px_60px_rgba(74,55,40,0.15)] transition-all duration-700 transform-gpu hover:-translate-y-4 hover:rotate-y-5">
              {/* 3D Shadow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#4a3728]/10 to-transparent rounded-[32px] translate-x-2 translate-y-2 -z-10 group-hover:translate-x-4 group-hover:translate-y-4 transition-all duration-700" />

              {/* Floating orb */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#8b7355]/20 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />

              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#4a3728] to-[#634a36] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg relative z-10">
                <Briefcase className="w-8 h-8 text-white" />
              </div>

              {/* Number */}
              <h3 className="text-5xl md:text-6xl font-black text-[#4a3728] mb-3 group-hover:text-[#8b7355] transition-colors">
                70<span className="text-[#8b7355]">+</span>
              </h3>

              {/* Label */}
              <p className="text-base font-bold text-slate-600 uppercase tracking-[2px]">
                Career Domains
              </p>

              {/* Decorative line */}
              <div className="w-16 h-1 bg-gradient-to-r from-[#4a3728] to-[#8b7355] mt-6 rounded-full group-hover:w-full transition-all duration-700" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}