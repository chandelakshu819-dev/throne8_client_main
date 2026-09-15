"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Star, ChevronRight, User, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import MentorService from "@/lib/api/mentorship.service";
import { useProfile } from "@/features/profile/hooks/useProfile";

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  wash: "#f6ede8",
  softWash: "#fbf7f3",
  chip: "#f3ece4",
  paper: "#fffdfb",
  gold: "#c9a87c",
  muted: "#8a7a6a",
};

type Session = {
  _id?: string;
  title?: string;
  sessionType?: string;
};

interface UserDashboardRecommendedMentorsPageProps {
  sessions?: Session[];
  user?: any;
}

function extractKeywords(str: string): string[] {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export default function UserDashboardRecommendedMentorsPage({
  sessions = [],
  user,
}: UserDashboardRecommendedMentorsPageProps) {
  const router = useRouter();
  const { userProfileData } = useProfile();
  
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Derive user keywords from real profile and booking data
  const userKeywords = useMemo(() => {
    const words = new Set<string>();

    const addPhrases = (text?: string) => {
      if (!text) return;
      extractKeywords(text).forEach((w) => words.add(w));
    };

    // 1. Role / Career
    addPhrases(userProfileData?.currentPosition);
    addPhrases(userProfileData?.onboarding?.workingProfile?.jobTitle);
    
    // 2. Education/Interests
    addPhrases(userProfileData?.onboarding?.studentProfile?.fieldOfStudy);

    // 3. Past Sessions (Previous Bookings)
    sessions.forEach((s) => {
      addPhrases(s.title);
      addPhrases(s.sessionType);
    });

    return Array.from(words);
  }, [userProfileData, sessions]);

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      try {
        const res = await MentorService.getAllMentors({ page: 1, limit: 100 });
        const list = Array.isArray(res.data) ? res.data : res.data?.mentors || [];
        setMentors(list);
      } catch (err) {
        console.error("Failed to load mentors", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, []);

  const recommendedMentors = useMemo(() => {
    if (!mentors || mentors.length === 0) return [];
    if (userKeywords.length === 0) {
      // If user has no data, just fallback to highest rated
      return mentors
        .sort((a, b) => (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0))
        .slice(0, 10)
        .map(m => ({ ...m, recommendationReason: "Highly rated on Throne8" }));
    }

    const scored = mentors.map((m) => {
      let score = 0;
      const reasons = new Set<string>();

      const mentorRoleStr = m.experience?.currentRole || "";
      const mentorDomains = (m.domains || []).join(" ");
      const mentorSkills = (m.skills || []).join(" ");
      
      const mentorText = `${mentorRoleStr} ${mentorDomains} ${mentorSkills}`.toLowerCase();

      userKeywords.forEach((kw) => {
        if (mentorText.includes(kw)) {
          score += 1;
          
          if (mentorRoleStr.toLowerCase().includes(kw)) {
            reasons.add(`Matches your career role`);
          } else if (mentorDomains.toLowerCase().includes(kw)) {
            reasons.add(`Matches your interests`);
          } else if (mentorSkills.toLowerCase().includes(kw)) {
            reasons.add(`Matches your skills`);
          } else {
             reasons.add(`Matches your previous sessions`);
          }
        }
      });

      return {
        ...m,
        score,
        recommendationReason: Array.from(reasons)[0] || "Recommended for you",
      };
    });

    // Filter to only those with some match, sort by score
    return scored
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [mentors, userKeywords]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border flex flex-col gap-4 animate-pulse h-64"
              style={{ borderColor: COLORS.hairline }}
            >
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-full bg-[#f4ece1]" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-[#f4ece1] rounded w-3/4" />
                  <div className="h-3 bg-[#f4ece1] rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <div className="h-3 bg-[#f4ece1] rounded w-full" />
                <div className="h-3 bg-[#f4ece1] rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (recommendedMentors.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <Sparkles className="w-8 h-8" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>No matching mentors available</h3>
            <p className="text-sm mt-1 max-w-sm" style={{ color: COLORS.muted }}>
              We couldn't find mentors that strongly match your current profile skills, role, or previous bookings. Check back later or update your profile!
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {recommendedMentors.map((mentor) => {
          const name = `${mentor.user?.firstName || ""} ${mentor.user?.lastName || ""}`.trim() || "Mentor";
          const role = mentor.experience?.currentRole || "Mentor";
          const rating = mentor.stats?.averageRating || 0;
          const reviews = mentor.stats?.totalReviews || 0;
          const pic = mentor.profilePic || "";
          
          return (
            <div
              key={mentor.mentorId}
              className="group flex flex-col bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg h-full"
              style={{ borderColor: COLORS.hairline }}
            >
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                  {pic ? (
                    <img
                      src={pic}
                      alt={name}
                      className="w-16 h-16 rounded-full object-cover shrink-0 border-2"
                      style={{ borderColor: COLORS.chip }}
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-2"
                      style={{ backgroundColor: COLORS.ink, borderColor: COLORS.chip }}
                    >
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  
                  {rating > 0 && (
                    <div className="flex items-center gap-1 bg-[#fbf7f3] px-2 py-1 rounded-full border" style={{ borderColor: COLORS.hairline }}>
                      <Star className="w-3.5 h-3.5" style={{ color: COLORS.gold, fill: COLORS.gold }} />
                      <span className="text-xs font-bold" style={{ color: COLORS.ink }}>{rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold leading-tight" style={{ color: COLORS.ink }}>
                  {name}
                </h3>
                <p className="text-sm mt-1 line-clamp-1" style={{ color: COLORS.muted }}>
                  {role}
                </p>

                {mentor.recommendationReason && (
                   <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg w-fit" style={{ backgroundColor: COLORS.chip }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: COLORS.accent }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.accent }}>
                        {mentor.recommendationReason}
                      </span>
                   </div>
                )}

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(mentor.skills || []).slice(0, 3).map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs font-medium px-2 py-1 rounded-md"
                      style={{ backgroundColor: COLORS.softWash, color: COLORS.ink, border: `1px solid ${COLORS.hairline}` }}
                    >
                      {skill}
                    </span>
                  ))}
                  {(mentor.skills || []).length > 3 && (
                    <span className="text-xs font-medium px-2 py-1 rounded-md" style={{ color: COLORS.muted }}>
                      +{(mentor.skills || []).length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 p-4 border-t mt-auto group-hover:border-[#c9baa9] transition-colors" style={{ borderColor: COLORS.hairline }}>
                <button
                  onClick={() => router.push(`/mentorship/mentors/${mentor.mentorId}`)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors hover:bg-[#fbf7f3]"
                  style={{ borderColor: COLORS.hairline, color: COLORS.ink }}
                >
                  View Profile
                </button>
                <button
                  onClick={() => router.push(`/mentorship/mentors/${mentor.mentorId}?book=true`)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl transition-colors hover:bg-[#8b7355] text-white flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: COLORS.ink }}
                >
                  Book Session
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl pt-2 pb-8">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          Recommended Mentors
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          Mentors hand-picked for you based on your career goals, skills, and past sessions.
        </p>
      </div>

      {renderContent()}
    </div>
  );
}
