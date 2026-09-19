import React from "react";
import { Star, Award } from "lucide-react";

// Optional: Agar chhota reusable card banana ho to alag MentorMarqueeCard.tsx bana sakte ho, 
// lekin abhi direct yahin rakh rahe hain jaise original tha

interface Mentor {
  image: string;
  name: string;
  role: string;
  company: string;
  rating: number;
  sessions: number;
  tags: string[];
  exp: string;
}

interface TopMentorsMarqueeProps {
  mentors: Mentor[];
}

export default function TopMentorsMarquee({ mentors }: TopMentorsMarqueeProps) {
  return (
    <section className="py-14 bg-[#f7f1e6] overflow-hidden border-y border-[#f0edea]">
      <div className="text-center mb-10 px-6">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">
          <span className="text-[#8b7355]">TOP</span> MENTORS
        </h2>
        <p className="text-slate-500 text-sm font-medium">
          Handpicked experts from leading tech companies
        </p>
      </div>
      <div className="group/marquee">
        <div className="animate-marquee group-hover/marquee:pause-animation flex gap-6">
          {[...mentors, ...mentors, ...mentors].map((mentor, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[280px] p-6 bg-[#FAF9F6] border border-[#ece7e2] rounded-[32px] hover:border-[#8b7355] transition-all duration-500 group shadow-lg hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#4a3728]/0 to-[#4a3728]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#8b7355]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
              <div className="relative z-10">
                {/* Mentor Photo */}
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:scale-110 group-hover:border-[#8b7355] transition-all duration-500">
                    <img
                      src={mentor.image}
                      alt={mentor.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                  </div>
                </div>
                {/* Mentor Name */}
                <h5 className="font-black text-base mb-1 text-center group-hover:text-[#8b7355] transition-colors">
                  {mentor.name}
                </h5>
                {/* Company & Role */}
                <p className="text-[10px] text-slate-500 font-bold text-center mb-3 uppercase tracking-wider">
                  {mentor.role} @ {mentor.company}
                </p>
                {/* Rating */}
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  <Star className="w-4 h-4 fill-[#8b7355] text-[#8b7355]" />
                  <span className="text-sm font-black text-[#4a3728]">
                    {mentor.rating}
                  </span>
                  <span className="text-[14px] text-black font-medium">
                    ({mentor.sessions} sessions)
                  </span>
                </div>
                <div className="text-[12px] text-black text-center font-medium">95% Attendance</div>
                {/* Expertise Tags */}
                <div className="flex gap-2 justify-center flex-wrap mb-4">
                  {mentor.tags.map((tag: string) => (
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
          ))}
        </div>
      </div>
    </section>
  );
}