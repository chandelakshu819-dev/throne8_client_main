"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Star, User, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import MentorService from "@/lib/api/mentorship.service";
import { useSkillsData } from "@/features/profile/hooks/useSkillsData";

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

interface UserDashboardRecommendedMentorsPageProps {
  sessions?: any[];
  user?: any;
}

function normalizeSkill(str: string): string {
  if (!str) return "";
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

function formatRecommendationReason(matchedSkills: string[]): string {
  if (matchedSkills.length === 0) return "";
  if (matchedSkills.length === 1) return `Matches on ${matchedSkills[0]}`;
  if (matchedSkills.length === 2) return `Matches on ${matchedSkills[0]} and ${matchedSkills[1]}`;
  return `Matches on ${matchedSkills[0]}, ${matchedSkills[1]}, and ${matchedSkills.length - 2} more`;
}

export default function UserDashboardRecommendedMentorsPage({
  sessions = [],
  user,
}: UserDashboardRecommendedMentorsPageProps) {
  const router = useRouter();
  
  const [mentors, setMentors] = useState<any[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);

  // Fetch real authenticated user skills
  const { skillsList, fetchSkillsData, isLoadingSkills } = useSkillsData();

  useEffect(() => {
    fetchSkillsData();
  }, [fetchSkillsData]);

  useEffect(() => {
    const fetchMentors = async () => {
      setLoadingMentors(true);
      try {
        const res = await MentorService.getAllMentors({ page: 1, limit: 100 });
        const list = Array.isArray(res.data) ? res.data : res.data?.mentors || [];
        setMentors(list);
      } catch (err) {
        console.error("Failed to load mentors", err);
      } finally {
        setLoadingMentors(false);
      }
    };
    fetchMentors();
  }, []);

  const recommendedMentors = useMemo(() => {
    if (!mentors || mentors.length === 0) return [];
    if (!skillsList || skillsList.length === 0) return [];

    const userSkillsRaw = skillsList.map((s) => s.skillName);
    const normalizedUserSkills = userSkillsRaw.map(normalizeSkill);
    const userSkillsCount = normalizedUserSkills.length;

    const scored = mentors.map((m) => {
      const mentorSkillsRaw: string[] = m.skills || [];
      const normalizedMentorSkills = mentorSkillsRaw.map(normalizeSkill);

      // Find which of the mentor's skills match the user's skills
      const matchedSkillsRaw = mentorSkillsRaw.filter((ms, index) => {
        return normalizedUserSkills.includes(normalizedMentorSkills[index]);
      });

      const matchCount = matchedSkillsRaw.length;
      const skillMatchScore = userSkillsCount > 0 ? Math.round((matchCount / userSkillsCount) * 100) : 0;
      
      const recommendationReason = formatRecommendationReason(matchedSkillsRaw);

      return {
        ...m,
        matchedSkillsRaw,
        matchCount,
        skillMatchScore,
        recommendationReason,
      };
    });

    // Filter to only those with at least one matching skill, sort by score
    return scored
      .filter((m) => m.matchCount > 0)
      .sort((a, b) => b.skillMatchScore - a.skillMatchScore)
      .slice(0, 10);
  }, [mentors, skillsList]);

  const loading = loadingMentors || isLoadingSkills;

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

    if (!skillsList || skillsList.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center px-4"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <Sparkles className="w-8 h-8" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>Profile Skills Required</h3>
            <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: COLORS.muted }}>
              To provide accurate mentor recommendations, please add your professional skills to your profile.
            </p>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="mt-4 px-5 py-2 text-sm font-semibold rounded-xl text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: COLORS.ink }}
          >
            Update Profile
          </button>
        </div>
      );
    }

    if (recommendedMentors.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center px-4"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <Sparkles className="w-8 h-8" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>No Skill Matches Found</h3>
            <p className="text-sm mt-1 max-w-md mx-auto" style={{ color: COLORS.muted }}>
              We currently don't have mentors that share your exact skill set. Check back later as new mentors join the platform!
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
          const pic = mentor.profilePic || "";
          
          return (
            <div
              key={mentor.mentorId}
              className="group flex flex-col bg-white rounded-2xl overflow-hidden border transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-[#c9baa9] motion-reduce:transition-none motion-reduce:hover:transform-none h-full"
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
                      <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: COLORS.accent }} />
                      <span className="text-[10.5px] font-bold uppercase tracking-wide leading-snug" style={{ color: COLORS.accent }}>
                        {mentor.recommendationReason}
                      </span>
                   </div>
                )}
                
                {mentor.skillMatchScore > 0 && (
                  <div className="mt-2 text-[12px] font-semibold" style={{ color: COLORS.ink }}>
                    Match Score: {mentor.skillMatchScore}%
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(mentor.skills || []).slice(0, 3).map((skill: string, i: number) => {
                    // Highlight matching skills
                    const isMatched = mentor.matchedSkillsRaw?.includes(skill);
                    return (
                      <span
                        key={i}
                        className={`text-xs font-medium px-2 py-1 rounded-md ${isMatched ? 'font-semibold' : ''}`}
                        style={{ 
                          backgroundColor: isMatched ? '#efe3d8' : COLORS.softWash, 
                          color: isMatched ? '#4a3728' : COLORS.ink, 
                          border: `1px solid ${isMatched ? '#d4c5b5' : COLORS.hairline}` 
                        }}
                      >
                        {skill}
                      </span>
                    )
                  })}
                  {(mentor.skills || []).length > 3 && (
                    <span className="text-xs font-medium px-2 py-1 rounded-md" style={{ color: COLORS.muted }}>
                      +{(mentor.skills || []).length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 p-4 border-t mt-auto transition-colors" style={{ borderColor: COLORS.hairline }}>
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
          Mentors strongly matched with your actual professional skills.
        </p>
      </div>

      {renderContent()}
    </div>
  );
}

