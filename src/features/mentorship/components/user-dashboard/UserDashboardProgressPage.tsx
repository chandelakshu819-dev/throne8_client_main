"use client";

import React, { useEffect, useMemo } from "react";
import {
  TrendingUp,
  CheckCircle2,
  Users,
  Clock,
  Award,
  Star,
  Calendar,
  Sparkles,
  ArrowUpRight,
  BookOpen,
  Target,
  AlertCircle,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSkillsData } from "@/features/profile/hooks/useSkillsData";
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
  faint: "#a08070",
  success: "#15803d",
  successWash: "#f0fdf4",
};

interface Session {
  _id?: string;
  sessionId?: string;
  mentorId?: string;
  mentorName?: string;
  mentorProfilePhoto?: string;
  mentorJobTitle?: string;
  title?: string;
  sessionType?: string;
  scheduledAt?: string;
  startTime?: string;
  status?: string;
  duration?: number;
  actualDuration?: number;
  skills?: string[];
  tags?: string[];
  review?: {
    rating?: number;
    menteeReview?: string;
    createdAt?: string;
  };
  createdAt?: string;
}

interface UserDashboardProgressPageProps {
  sessions?: Session[];
  user?: any;
  setActivePage?: (page: string) => void;
}

function formatDate(iso?: string) {
  if (!iso) return "Date not recorded";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Date not recorded";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "M";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function UserDashboardProgressPage({
  sessions = [],
  user,
  setActivePage,
}: UserDashboardProgressPageProps) {
  const router = useRouter();

  // Profile data for career/profile context
  const { userProfileData, loadProfile, isLoadingProfile } = useProfile();

  useEffect(() => {
    if (!userProfileData && typeof loadProfile === "function") {
      loadProfile();
    }
  }, [userProfileData, loadProfile]);

  // Real skills data
  const { skillsList, fetchSkillsData, isLoadingSkills, skillsError } = useSkillsData();

  useEffect(() => {
    fetchSkillsData();
  }, [fetchSkillsData]);

  // 1. Sessions Completed (Only real completed sessions)
  const completedSessions = useMemo(() => {
    return sessions.filter((s) => {
      const status = (s.status || "").toLowerCase();
      return status === "completed" || status === "done";
    });
  }, [sessions]);

  // 2. Mentors Connected (Unique real mentors)
  const uniqueMentors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; photo?: string; jobTitle?: string }>();
    sessions.forEach((s) => {
      const key = s.mentorId || s.mentorName;
      if (key && !map.has(key)) {
        map.set(key, {
          id: key,
          name: s.mentorName || "Mentor",
          photo: s.mentorProfilePhoto,
          jobTitle: s.mentorJobTitle,
        });
      }
    });
    return Array.from(map.values());
  }, [sessions]);

  // 3. Total Hours (Calculated from actual backend duration data)
  const totalHoursInfo = useMemo(() => {
    if (completedSessions.length === 0) {
      return { display: "0 hrs", hasData: true, rawMinutes: 0 };
    }

    let recordedMinutes = 0;
    let hasValidDuration = false;

    completedSessions.forEach((s) => {
      const dur = s.actualDuration ?? s.duration;
      if (typeof dur === "number" && !isNaN(dur) && dur > 0) {
        recordedMinutes += dur;
        hasValidDuration = true;
      }
    });

    if (!hasValidDuration) {
      return { display: "Unavailable", hasData: false, rawMinutes: 0 };
    }

    const hours = (recordedMinutes / 60).toFixed(1).replace(/\.0$/, "");
    return {
      display: `${hours} ${parseFloat(hours) === 1 ? "hr" : "hrs"}`,
      hasData: true,
      rawMinutes: recordedMinutes,
    };
  }, [completedSessions]);

  // 4. Skills Discussed / Tracked (From actual profile skills and session skills)
  const allSkills = useMemo(() => {
    const set = new Set<string>();

    if (Array.isArray(skillsList)) {
      skillsList.forEach((sk: any) => {
        const name = sk.skillName || sk.name;
        if (typeof name === "string" && name.trim()) {
          set.add(name.trim());
        }
      });
    }

    sessions.forEach((s) => {
      if (Array.isArray(s.skills)) {
        s.skills.forEach((sk) => {
          if (typeof sk === "string" && sk.trim()) {
            set.add(sk.trim());
          }
        });
      }
      if (Array.isArray(s.tags)) {
        s.tags.forEach((tg) => {
          if (typeof tg === "string" && tg.trim()) {
            set.add(tg.trim());
          }
        });
      }
    });

    return Array.from(set);
  }, [skillsList, sessions]);

  // 5. Reviews Given (Real reviews submitted by mentee)
  const reviewsGiven = useMemo(() => {
    return sessions.filter((s) => {
      return s.review && (s.review.rating || s.review.menteeReview);
    });
  }, [sessions]);

  // 6. Monthly Activity (Real backend dates grouped by month)
  const monthlyActivity = useMemo(() => {
    const groups: Record<
      string,
      {
        monthKey: string;
        label: string;
        dateSort: number;
        completedCount: number;
        totalCount: number;
        sessions: Session[];
      }
    > = {};

    sessions.forEach((s) => {
      const rawDate = s.startTime || s.scheduledAt || s.createdAt;
      if (!rawDate) return;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return;

      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      if (!groups[monthKey]) {
        groups[monthKey] = {
          monthKey,
          label,
          dateSort: new Date(year, monthIndex, 1).getTime(),
          completedCount: 0,
          totalCount: 0,
          sessions: [],
        };
      }

      groups[monthKey].totalCount += 1;
      const status = (s.status || "").toLowerCase();
      if (status === "completed" || status === "done") {
        groups[monthKey].completedCount += 1;
      }
      groups[monthKey].sessions.push(s);
    });

    return Object.values(groups).sort((a, b) => b.dateSort - a.dateSort);
  }, [sessions]);

  const maxMonthlySessions = useMemo(() => {
    if (monthlyActivity.length === 0) return 1;
    return Math.max(...monthlyActivity.map((m) => m.totalCount), 1);
  }, [monthlyActivity]);

  // 7. Career / Mentorship Goals (Real profile data or clean empty state)
  const careerHeadline = userProfileData?.currentPosition || user?.headline || user?.bio;
  const userEducation = userProfileData?.education;
  const userLocation = userProfileData?.location;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl pb-12 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: COLORS.chip, color: COLORS.accent }}
            >
              Mentee Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: COLORS.ink }}>
            Mentorship Progress
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
            Real-time track of your completed sessions, learning hours, mentors, and skill milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (setActivePage) setActivePage("session-history");
              else router.push("/mentorship/sessions");
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-[#8b7355] text-white shadow-sm flex items-center gap-1.5"
            style={{ backgroundColor: COLORS.ink }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Session History
          </button>
        </div>
      </div>

      {/* Key Metric Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Sessions Completed */}
        <div
          className="bg-white p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md motion-reduce:transform-none"
          style={{ borderColor: COLORS.hairline }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.chip }}
            >
              <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.accent }} />
            </div>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ backgroundColor: COLORS.softWash, color: COLORS.muted }}
            >
              {sessions.length} total booked
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight" style={{ color: COLORS.ink }}>
            {completedSessions.length}
          </div>
          <div className="text-sm font-semibold mt-1" style={{ color: COLORS.ink }}>
            Sessions Completed
          </div>
          <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
            Verified completed mentorship meetings
          </p>
        </div>

        {/* Metric 2: Mentors Connected */}
        <div
          className="bg-white p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md motion-reduce:transform-none"
          style={{ borderColor: COLORS.hairline }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.chip }}
            >
              <Users className="w-5 h-5" style={{ color: COLORS.accent }} />
            </div>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ backgroundColor: COLORS.softWash, color: COLORS.muted }}
            >
              Network
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight" style={{ color: COLORS.ink }}>
            {uniqueMentors.length}
          </div>
          <div className="text-sm font-semibold mt-1" style={{ color: COLORS.ink }}>
            Mentors Connected
          </div>
          <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
            Unique advisors in your learning journey
          </p>
        </div>

        {/* Metric 3: Total Hours */}
        <div
          className="bg-white p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md motion-reduce:transform-none"
          style={{ borderColor: COLORS.hairline }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.chip }}
            >
              <Clock className="w-5 h-5" style={{ color: COLORS.accent }} />
            </div>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ backgroundColor: COLORS.softWash, color: COLORS.muted }}
            >
              {totalHoursInfo.hasData ? "Logged" : "No duration data"}
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight" style={{ color: COLORS.ink }}>
            {totalHoursInfo.display}
          </div>
          <div className="text-sm font-semibold mt-1" style={{ color: COLORS.ink }}>
            Mentorship Hours
          </div>
          <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
            {totalHoursInfo.hasData
              ? "Calculated from recorded session durations"
              : "Duration records not provided for sessions"}
          </p>
        </div>

        {/* Metric 4: Reviews Given */}
        <div
          className="bg-white p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md motion-reduce:transform-none"
          style={{ borderColor: COLORS.hairline }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.chip }}
            >
              <Star className="w-5 h-5" style={{ color: COLORS.accent }} />
            </div>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ backgroundColor: COLORS.softWash, color: COLORS.muted }}
            >
              Feedback
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight" style={{ color: COLORS.ink }}>
            {reviewsGiven.length}
          </div>
          <div className="text-sm font-semibold mt-1" style={{ color: COLORS.ink }}>
            Reviews Given
          </div>
          <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
            Real reviews submitted for past sessions
          </p>
        </div>
      </div>

      {/* Main Grid: Monthly Activity & Connected Mentors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section: Monthly Activity */}
        <div
          className="lg:col-span-2 bg-white p-6 rounded-2xl border"
          style={{ borderColor: COLORS.hairline }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.ink }}>
                <Calendar className="w-5 h-5" style={{ color: COLORS.accent }} />
                Monthly Mentorship Activity
              </h2>
              <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                Chronological breakdown of sessions conducted by month
              </p>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: COLORS.softWash, color: COLORS.accent }}
            >
              {monthlyActivity.length} {monthlyActivity.length === 1 ? "Active Month" : "Active Months"}
            </span>
          </div>

          {monthlyActivity.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 py-12 px-4 rounded-xl text-center"
              style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.chip }}
              >
                <Calendar className="w-6 h-6" style={{ color: COLORS.accent }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: COLORS.ink }}>
                  No Monthly Activity Recorded Yet
                </h3>
                <p className="text-xs mt-1 max-w-sm" style={{ color: COLORS.muted }}>
                  Once you participate in mentorship sessions, your activity by month will appear here with genuine session counts.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyActivity.map((item) => {
                const percentage = Math.round((item.totalCount / maxMonthlySessions) * 100);
                return (
                  <div
                    key={item.monthKey}
                    className="p-4 rounded-xl border transition-all duration-200 hover:border-[#c9baa9]"
                    style={{ backgroundColor: COLORS.softWash, borderColor: COLORS.hairline }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: COLORS.ink }}>
                          {item.label}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: COLORS.chip, color: COLORS.accent }}
                        >
                          {item.completedCount} completed
                        </span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: COLORS.ink }}>
                        {item.totalCount} {item.totalCount === 1 ? "session" : "sessions"}
                      </span>
                    </div>

                    {/* Progress representation */}
                    <div
                      className="w-full h-2.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: COLORS.chip }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(percentage, 8)}%`,
                          backgroundColor: COLORS.ink,
                        }}
                      />
                    </div>

                    {/* Compact session tags for this month */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-[#ece4db]">
                      {item.sessions.slice(0, 3).map((sess, idx) => (
                        <div
                          key={sess.sessionId || sess._id || idx}
                          className="text-xs px-2 py-0.5 rounded-md bg-white border truncate max-w-[220px]"
                          style={{ borderColor: COLORS.hairline, color: COLORS.ink }}
                          title={sess.title || "Session"}
                        >
                          {sess.title || sess.sessionType || "Mentorship Session"}
                        </div>
                      ))}
                      {item.sessions.length > 3 && (
                        <span className="text-xs font-semibold" style={{ color: COLORS.muted }}>
                          +{item.sessions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Connected Mentors List */}
        <div
          className="bg-white p-6 rounded-2xl border flex flex-col justify-between"
          style={{ borderColor: COLORS.hairline }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.ink }}>
                <Users className="w-5 h-5" style={{ color: COLORS.accent }} />
                Mentors
              </h2>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: COLORS.chip, color: COLORS.accent }}
              >
                {uniqueMentors.length} connected
              </span>
            </div>
            <p className="text-xs mb-4" style={{ color: COLORS.muted }}>
              Verified mentors you've connected with through bookings
            </p>

            {uniqueMentors.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-2 py-8 px-3 rounded-xl text-center"
                style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: COLORS.chip }}
                >
                  <Users className="w-5 h-5" style={{ color: COLORS.accent }} />
                </div>
                <p className="text-xs font-semibold" style={{ color: COLORS.ink }}>
                  No Mentors Connected Yet
                </p>
                <p className="text-xs" style={{ color: COLORS.muted }}>
                  Connect with experienced industry leaders to grow.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {uniqueMentors.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:border-[#c9baa9]"
                    style={{ backgroundColor: COLORS.softWash, borderColor: COLORS.hairline }}
                  >
                    {m.photo ? (
                      <img
                        src={m.photo}
                        alt={m.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0 border"
                        style={{ borderColor: COLORS.hairline }}
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                        style={{ backgroundColor: COLORS.ink }}
                      >
                        {initialsFrom(m.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
                        {m.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: COLORS.muted }}>
                        {m.jobTitle || "Mentor"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => router.push("/mentorship")}
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors border hover:bg-[#f3ece4]"
            style={{
              backgroundColor: COLORS.wash,
              color: COLORS.ink,
              borderColor: COLORS.hairline,
            }}
          >
            Explore Mentors
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two Column Section: Skills Discussed & Career/Mentorship Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section: Skills Discussed / Tracked */}
        <div
          className="bg-white p-6 rounded-2xl border"
          style={{ borderColor: COLORS.hairline }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.ink }}>
                <Award className="w-5 h-5" style={{ color: COLORS.accent }} />
                Skills Tracked
              </h2>
              <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                Authentic skills from your verified profile and mentorship sessions
              </p>
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: COLORS.chip, color: COLORS.accent }}
            >
              {allSkills.length} {allSkills.length === 1 ? "Skill" : "Skills"}
            </span>
          </div>

          {isLoadingSkills ? (
            <div className="py-8 flex items-center justify-center text-xs" style={{ color: COLORS.muted }}>
              Loading skills from profile...
            </div>
          ) : allSkills.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 py-10 px-4 rounded-xl text-center"
              style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.chip }}
              >
                <Award className="w-5 h-5" style={{ color: COLORS.accent }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: COLORS.ink }}>
                  No Skills Recorded
                </h3>
                <p className="text-xs mt-1 max-w-sm" style={{ color: COLORS.muted }}>
                  Add your target skills and competencies to your user profile to highlight learning areas during mentorship.
                </p>
              </div>
              <button
                onClick={() => router.push("/profile")}
                className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors hover:bg-white"
                style={{
                  backgroundColor: COLORS.chip,
                  color: COLORS.ink,
                  borderColor: COLORS.hairline,
                }}
              >
                Add Skills to Profile →
              </button>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2 pt-1">
                {allSkills.map((skill, idx) => (
                  <span
                    key={`${skill}-${idx}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:border-[#c9baa9]"
                    style={{
                      backgroundColor: COLORS.softWash,
                      borderColor: COLORS.hairline,
                      color: COLORS.ink,
                    }}
                  >
                    <Sparkles className="w-3 h-3 mr-1.5" style={{ color: COLORS.accent }} />
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-[#ece4db] flex items-center justify-between text-xs">
                <span style={{ color: COLORS.muted }}>
                  Sourced directly from your profile & verified sessions
                </span>
                <button
                  onClick={() => router.push("/profile")}
                  className="font-bold underline hover:opacity-80"
                  style={{ color: COLORS.accent }}
                >
                  Manage Profile Skills
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section: Career & Mentorship Goals */}
        <div
          className="bg-white p-6 rounded-2xl border"
          style={{ borderColor: COLORS.hairline }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.ink }}>
                <Target className="w-5 h-5" style={{ color: COLORS.accent }} />
                Career & Mentorship Goals
              </h2>
              <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                Your professional direction based on your active profile
              </p>
            </div>
          </div>

          {isLoadingProfile ? (
            <div className="py-8 flex items-center justify-center text-xs" style={{ color: COLORS.muted }}>
              Loading profile goals...
            </div>
          ) : careerHeadline || userEducation || userLocation ? (
            <div className="space-y-4">
              {careerHeadline && (
                <div
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: COLORS.softWash, borderColor: COLORS.hairline }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-4 h-4" style={{ color: COLORS.accent }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: COLORS.accent }}>
                      Current Role / Direction
                    </span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                    {careerHeadline}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userEducation && (
                  <div
                    className="p-3.5 rounded-xl border"
                    style={{ backgroundColor: COLORS.softWash, borderColor: COLORS.hairline }}
                  >
                    <span className="text-xs font-bold block mb-0.5" style={{ color: COLORS.accent }}>
                      Education
                    </span>
                    <p className="text-xs font-semibold" style={{ color: COLORS.ink }}>
                      {userEducation}
                    </p>
                  </div>
                )}

                {userLocation && (
                  <div
                    className="p-3.5 rounded-xl border"
                    style={{ backgroundColor: COLORS.softWash, borderColor: COLORS.hairline }}
                  >
                    <span className="text-xs font-bold block mb-0.5" style={{ color: COLORS.accent }}>
                      Location
                    </span>
                    <p className="text-xs font-semibold" style={{ color: COLORS.ink }}>
                      {userLocation}
                    </p>
                  </div>
                )}
              </div>

              {/* Notice regarding dedicated mentorship goals */}
              <div
                className="p-3 rounded-xl border flex items-start gap-2.5"
                style={{ backgroundColor: COLORS.wash, borderColor: COLORS.hairline }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: COLORS.accent }} />
                <div className="text-xs" style={{ color: COLORS.ink }}>
                  <p className="font-semibold">Target Mentorship Goals</p>
                  <p className="mt-0.5" style={{ color: COLORS.muted }}>
                    To align mentors specifically with custom milestones (e.g. interview prep, portfolio review), keep your profile summary up to date.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-3 py-10 px-4 rounded-xl text-center"
              style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.chip }}
              >
                <Target className="w-5 h-5" style={{ color: COLORS.accent }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: COLORS.ink }}>
                  No Career Goals Specified
                </h3>
                <p className="text-xs mt-1 max-w-sm" style={{ color: COLORS.muted }}>
                  Specify your current position, educational background, and aspirations in your profile to provide mentors with clear context.
                </p>
              </div>
              <button
                onClick={() => router.push("/settings/profile")}
                className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors hover:bg-white"
                style={{
                  backgroundColor: COLORS.chip,
                  color: COLORS.ink,
                  borderColor: COLORS.hairline,
                }}
              >
                Update Profile Goals →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
