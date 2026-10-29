//src/features/mentorship/components/user-dashboard/UserDashboardOverviewPage.tsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ShieldCheck,
  ArrowUpRight,
  Users,
  CheckCircle,
  Clock3,
  ClipboardList,
  Search,
  BookOpen,
  Star,
  Video,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import MentorService from "@/lib/api/mentorship.service";
import SessionService from "@/lib/api/session.service";
import ReviewService from "@/lib/api/review.service";
import FindMentorModal from "@/features/mentorship/components/sections/FindMentorModal";
import { capitalizeName } from "@/shared/utils/format";
import {
  getSessionTiming,
  useNow,
} from "@/features/mentorship/utils/sessionJoin";

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
};

interface UserDashboardOverviewPageProps {
  user?: any;
  sessions?: any[];
  setActivePage?: (page: string) => void;
}

interface NormalizedMenteeSession {
  sessionId: string;
  bookingId?: string;
  mentorId?: string;
  mentorName: string;
  mentorProfilePhoto?: string;
  title: string;
  sessionType?: string;
  scheduledAt?: string;
  startTime?: string;
  status: string;
  isGroupSession: boolean;
  timing: ReturnType<typeof getSessionTiming>;
  rawSession: any;
  rawBooking?: any;
}

function formatWhen(iso?: string) {
  if (!iso) return "Time not set";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Time not set";
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  if (isToday) return `Today · ${time}`;
  return `${d.toLocaleDateString([], { day: "numeric", month: "short" })} · ${time}`;
}

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "S";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-52 bg-[#e0d8cf] rounded-md" />
        <div className="h-4 w-64 bg-[#e0d8cf]/60 rounded-md" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-[#e0d8cf] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#f3ece4]" />
            <div className="h-6 w-16 bg-[#e0d8cf] rounded" />
            <div className="h-3 w-20 bg-[#e0d8cf]/60 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-[#e0d8cf] space-y-3">
          <div className="h-5 w-36 bg-[#e0d8cf] rounded" />
          {[1, 2].map((i) => (
            <div key={i} className="h-16 w-full bg-[#fbf7f3] rounded-xl border border-[#e0d8cf]" />
          ))}
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#e0d8cf] space-y-3">
          <div className="h-5 w-32 bg-[#e0d8cf] rounded" />
          {[1, 2].map((i) => (
            <div key={i} className="h-16 w-full bg-[#fbf7f3] rounded-xl border border-[#e0d8cf]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UserDashboardOverviewPage({
  user,
  sessions: initialSessions = [],
  setActivePage,
}: UserDashboardOverviewPageProps) {
  const router = useRouter();
  const currentUserId: string = user?.userId || user?.id || user?._id || "";

  // Ticking reference time every 15s to reactively update start/end windows and join eligibility
  const nowMs = useNow(15000);

  const [isFindMentorOpen, setIsFindMentorOpen] = useState(false);
  const [findMentorMentors, setFindMentorMentors] = useState<any[]>([]);
  const [findMentorLoading, setFindMentorLoading] = useState(false);
  const [sessionsPanelTab, setSessionsPanelTab] = useState<"upcoming" | "missedEnded">("upcoming");

  // Standalone group sessions state to guarantee group sessions are included even if parent layout omitted them
  const [extraGroupSessions, setExtraGroupSessions] = useState<any[]>([]);
  const [extraGroupLoading, setExtraGroupLoading] = useState(true);

  // Reviews fetched independently to know which completed sessions have been reviewed
  const [reviewedSessionIds, setReviewedSessionIds] = useState<Set<string>>(new Set());
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Fetch group sessions if initialSessions doesn't already contain tagged group sessions
  useEffect(() => {
    let isMounted = true;
    const hasGroup = initialSessions.some((s) => s.isGroupSession);
    if (hasGroup) {
      setExtraGroupLoading(false);
      return;
    }

    SessionService.getMyGroupSessions("mentee")
      .then((res: any) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.sessions || [];
        setExtraGroupSessions(list.map((g: any) => ({ ...g, isGroupSession: true })));
      })
      .catch((err) => {
        console.warn("[OverviewPage] Could not load group sessions:", err?.message);
      })
      .finally(() => {
        if (isMounted) setExtraGroupLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialSessions]);

  const fetchReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      const reviews = await ReviewService.getMyReviews();
      const ids = new Set<string>();
      (reviews || []).forEach((r: any) => {
        const sid = r.sessionId || r.session?._id || r.session?.sessionId;
        if (sid) ids.add(String(sid));
      });
      setReviewedSessionIds(ids);
    } catch (err: any) {
      console.warn("[OverviewPage] Could not load reviews:", err?.message);
      setReviewsError(err?.message || "Failed to load reviews");
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleOpenFindMentor = async () => {
    setIsFindMentorOpen(true);
    if (findMentorMentors.length === 0) {
      setFindMentorLoading(true);
      try {
        const res = await MentorService.getAllMentors({ page: 1, limit: 100 });
        const list = Array.isArray(res.data) ? res.data : res.data?.mentors || [];
        const mapped = list.map((m: any) => ({
          id: m.mentorId,
          userId: m.userId,
          name: `${m.user?.firstName ?? ""} ${m.user?.lastName ?? ""}`.trim(),
          role: m.experience?.currentRole?.split(" at ")[0] ?? "Mentor",
          company: m.experience?.currentRole?.split(" at ")[1] ?? "",
          rating: m.stats?.averageRating || 0,
          sessions: m.stats?.totalSessions || m.trustScore?.metrics?.totalCompletedSessions || 0,
          price: m.pricing?.quickCall || 0,
          tags: m.skills?.slice(0, 2) ?? [],
          image: m.profilePic ?? "",
        }));
        setFindMentorMentors(mapped);
      } catch (err) {
        console.error("Failed to fetch mentors", err);
      } finally {
        setFindMentorLoading(false);
      }
    }
  };

  const rawFirstName =
    user?.firstName?.trim() ||
    (user?.name ? user.name.trim().split(" ")[0] : null) ||
    "there";
  const firstName = capitalizeName(rawFirstName);

  // ── Normalize sessions across 1:1, Senior, and Group sessions ────────────────
  // Flattens each booking belonging to this mentee into a distinct item.
  // Computes timing via getSessionTiming (which bases Upcoming on session END time,
  // and uses the strict fallback chain actualDuration -> duration -> slot length -> 0).
  const normalizedSessions: NormalizedMenteeSession[] = useMemo(() => {
    const combinedRaw = [...initialSessions, ...extraGroupSessions];
    const uniqueSessionMap = new Map<string, any>();

    combinedRaw.forEach((s) => {
      const id = s.sessionId || s._id;
      if (id && !uniqueSessionMap.has(id)) {
        uniqueSessionMap.set(id, s);
      } else if (!id) {
        uniqueSessionMap.set(Math.random().toString(), s);
      }
    });

    const dedupedRaw = Array.from(uniqueSessionMap.values());
    const items: NormalizedMenteeSession[] = [];

    dedupedRaw.forEach((s: any) => {
      const sid = s.sessionId || s._id || "";
      const mentorName =
        s.mentorName ||
        s.mentor?.fullName ||
        (s.mentor?.firstName ? `${s.mentor.firstName} ${s.mentor.lastName || ""}`.trim() : "") ||
        "Mentor";
      const mentorProfilePhoto =
        s.mentorProfilePhoto || s.mentor?.profilePic || s.profilePic || null;
      const title = s.title || s.serviceName || s.sessionType || "Mentorship Session";

      if (s.isGroupSession) {
        // Group session: evaluate participant status for this mentee
        const participant = (s.participants || []).find(
          (p: any) => p.menteeId === currentUserId
        );
        if (!participant && s.menteeId !== currentUserId) return;

        let status = (s.status || "").toLowerCase();
        if (participant?.requestStatus === "pending") status = "pending";
        if (participant?.requestStatus === "rejected") status = "cancelled";

        const timing = getSessionTiming(s, null, nowMs);
        items.push({
          sessionId: sid,
          bookingId: `${sid}-${currentUserId}`,
          mentorId: s.mentorId,
          mentorName,
          mentorProfilePhoto,
          title: `${title} (Group)`,
          sessionType: s.sessionType || "group",
          scheduledAt: s.scheduledAt,
          startTime: s.startTime || s.scheduledAt,
          status,
          isGroupSession: true,
          timing,
          rawSession: s,
        });
        return;
      }

      // 1:1 or Senior Session:
      // Filter bookings belonging to this mentee
      const myBookings = (s.bookings || []).filter(
        (b: any) =>
          !currentUserId || b.menteeId === currentUserId || b.bookedBy === currentUserId
      );

      if (myBookings.length > 0) {
        myBookings.forEach((b: any) => {
          const timing = getSessionTiming(s, b, nowMs);
          const bStatus = (b.status || s.status || "confirmed").toLowerCase();

          items.push({
            sessionId: sid,
            bookingId: b._id || b.bookingId,
            mentorId: s.mentorId,
            mentorName,
            mentorProfilePhoto,
            title,
            sessionType: s.sessionType,
            scheduledAt: b.scheduledAt || s.scheduledAt,
            startTime: b.scheduledAt || b.startTime || s.startTime || s.scheduledAt,
            status: bStatus,
            isGroupSession: false,
            timing,
            rawSession: s,
            rawBooking: b,
          });
        });
      } else {
        // Fallback for sessions without a bookings array or legacy format
        const timing = getSessionTiming(s, null, nowMs);
        items.push({
          sessionId: sid,
          bookingId: sid,
          mentorId: s.mentorId,
          mentorName,
          mentorProfilePhoto,
          title,
          sessionType: s.sessionType,
          scheduledAt: s.scheduledAt,
          startTime: s.startTime || s.scheduledAt,
          status: (s.status || "confirmed").toLowerCase(),
          isGroupSession: false,
          timing,
          rawSession: s,
        });
      }
    });

    return items;
  }, [initialSessions, extraGroupSessions, currentUserId, nowMs]);

  // ── Stat computations ─────────────────────────────────────────────────────────

  // Total sessions: all non-terminal sessions (1:1, senior, group)
  const totalSessions = normalizedSessions.filter((item) => !item.timing.isTerminal);

  // Upcoming: based on session END time via getSessionTiming (nowMs <= endMs), sorted chronologically
  const upcoming = [...normalizedSessions]
    .filter((item) => item.timing.isUpcoming && !item.timing.isStale)
    .sort((a, b) => (a.timing.startMs || 0) - (b.timing.startMs || 0));

  // Completed: explicitly completed sessions (1:1, senior, group)
  const completed = normalizedSessions.filter((item) => item.timing.isCompleted);

  // Missed / Ended: non-terminal sessions that have expired or are past their scheduled end time
  const missedEnded = useMemo(() => {
    return [...normalizedSessions]
      .filter((item) => !item.timing.isTerminal && !item.timing.isCompleted && !item.timing.isUpcoming)
      .sort((a, b) => (b.timing.startMs || 0) - (a.timing.startMs || 0));
  }, [normalizedSessions]);

  // If no upcoming sessions exist but missed/ended sessions do, default panel tab to missed/ended
  useEffect(() => {
    if (upcoming.length === 0 && missedEnded.length > 0) {
      setSessionsPanelTab("missedEnded");
    } else if (upcoming.length > 0) {
      setSessionsPanelTab("upcoming");
    }
  }, [upcoming.length, missedEnded.length]);

  // My Mentors: unique mentors across all active and completed sessions
  const mentorKeys = new Set<string>();
  normalizedSessions.forEach((item) => {
    if (item.timing.isTerminal) return;
    const key = item.mentorId ? String(item.mentorId) : item.mentorName || "";
    if (key) mentorKeys.add(key);
  });
  const uniqueMentors = mentorKeys.size;

  // Mentorship Hours:
  // Strict fallback chain actualDuration -> duration -> slot length -> 0 (NEVER a fake 60!)
  const totalMinutes = completed.reduce(
    (acc, item) => acc + item.timing.durationMinutes,
    0
  );
  const totalHours = totalMinutes > 0 ? (totalMinutes / 60).toFixed(1) : "0";
  const hoursUnit = parseFloat(totalHours) === 1 ? "hr" : "hrs";

  // ── Stat cards ────────────────────────────────────────────────────────────────
  const stats: {
    label: string;
    value: string;
    unit?: string;
    icon: React.ElementType;
    highlight?: boolean;
    page?: string;
    onClick?: () => void;
  }[] = [
    { label: "Total sessions", value: String(totalSessions.length), icon: ClipboardList },
    {
      label: "Upcoming",
      value: String(upcoming.length),
      icon: CalendarClock,
      highlight: upcoming.length > 0,
      onClick: () => setSessionsPanelTab("upcoming"),
    },
    {
      label: "Completed",
      value: String(completed.length),
      icon: CheckCircle,
      page: "session-history",
    },
    {
      label: "Missed / Ended",
      value: String(missedEnded.length),
      icon: AlertCircle,
      highlight: false,
      onClick: () => setSessionsPanelTab("missedEnded"),
    },
    { label: "My Mentors", value: String(uniqueMentors), icon: Users, page: "my-mentors" },
    { label: "Mentorship Hours", value: totalHours, unit: hoursUnit, icon: Clock3 },
  ];

  // ── Pending Actions ──────────────────────────────────────────────────────────
  const pendingActions: {
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
  }[] = [];

  // 1. Profile incomplete check
  const profileIncomplete =
    user &&
    (!user.bio?.trim() ||
      !user.jobTitle?.trim() ||
      (!user.profileImageUrl && !user.profilePhoto && !user.profilePic));
  if (profileIncomplete) {
    pendingActions.push({
      title: "Complete your profile",
      description: "Help mentors understand your goals",
      icon: BookOpen,
      onClick: () => setActivePage?.("profile"),
    });
  }

  // 2. Completed sessions without a review
  if (!reviewsLoading) {
    const unreviewedSessions = completed.filter((item) => {
      const sid = item.sessionId;
      return sid && !reviewedSessionIds.has(String(sid));
    });
    if (unreviewedSessions.length > 0) {
      const count = unreviewedSessions.length;
      const mentorName =
        count === 1
          ? unreviewedSessions[0].mentorName || "your mentor"
          : `${count} mentors`;
      pendingActions.push({
        title: `Rate your session${count > 1 ? "s" : ""} with ${mentorName}`,
        description: "Share your feedback to help others",
        icon: Star,
        onClick: () => setActivePage?.("session-history"),
      });
    }
  }

  // Skeleton loader while initial sessions are still loading
  if (initialSessions.length === 0 && extraGroupLoading && reviewsLoading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-7xl mx-auto">
      {/* Greeting */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: COLORS.ink }}>
          Welcome back, {firstName}
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          Here's an overview of your mentorship journey
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((stat, idx) => {
          const showDot = stat.highlight && Number(stat.value) > 0;
          const clickable = Boolean(stat.page || stat.onClick);
          const handleClick = () => {
            if (stat.onClick) stat.onClick();
            else if (stat.page) setActivePage?.(stat.page);
          };
          return (
            <div
              key={idx}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? handleClick : undefined}
              onKeyDown={
                clickable
                  ? (e) => (e.key === "Enter" || e.key === " ") && handleClick()
                  : undefined
              }
              className={`relative bg-white p-4 rounded-2xl transition-colors hover:border-[#c9baa9] ${
                clickable ? "cursor-pointer" : ""
              }`}
              style={{
                border: `1px solid ${stat.highlight ? COLORS.gold : COLORS.hairline}`,
                boxShadow: stat.highlight ? "0 2px 10px rgba(201,168,124,0.22)" : undefined,
              }}
            >
              {showDot && (
                <span
                  className="absolute top-3 right-3 w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS.gold }}
                />
              )}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: stat.highlight ? "#f4e6d0" : COLORS.chip }}
              >
                <stat.icon className="w-4 h-4" style={{ color: COLORS.accent }} />
              </div>
              <div className="text-2xl font-bold flex items-baseline gap-1" style={{ color: COLORS.ink }}>
                {stat.value}
                {stat.unit && (
                  <span className="text-sm font-semibold" style={{ color: COLORS.muted }}>
                    {stat.unit}
                  </span>
                )}
              </div>
              <div className="text-xs mt-1" style={{ color: COLORS.muted }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleOpenFindMentor}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-[#8b7355] shadow-md"
          style={{ backgroundColor: COLORS.ink, color: "#fff" }}
        >
          <Search className="w-4 h-4" />
          Quick Book Mentor
        </button>
        <button
          onClick={() => setActivePage?.("upcoming-sessions")}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors hover:border-[#c9baa9]"
          style={{ backgroundColor: "#fff", color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
        >
          <ClipboardList className="w-4 h-4" />
          View All Sessions
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sessions panel (Upcoming & Missed/Ended) */}
        <div
          className="lg:col-span-3 bg-white p-6 rounded-2xl"
          style={{ border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSessionsPanelTab("upcoming")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: sessionsPanelTab === "upcoming" ? COLORS.ink : COLORS.chip,
                  color: sessionsPanelTab === "upcoming" ? "#fff" : COLORS.accent,
                }}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Upcoming ({upcoming.length})
              </button>
              {missedEnded.length > 0 && (
                <button
                  onClick={() => setSessionsPanelTab("missedEnded")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    backgroundColor: sessionsPanelTab === "missedEnded" ? COLORS.ink : COLORS.chip,
                    color: sessionsPanelTab === "missedEnded" ? "#fff" : COLORS.accent,
                  }}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Missed / Ended ({missedEnded.length})
                </button>
              )}
            </div>
            <button
              onClick={() => setActivePage?.("upcoming-sessions")}
              className="text-xs font-semibold hover:underline"
              style={{ color: COLORS.accent }}
            >
              View all
            </button>
          </div>

          {(() => {
            const displayedSessions = sessionsPanelTab === "upcoming" ? upcoming : missedEnded;

            if (displayedSessions.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: COLORS.chip }}
                  >
                    <CalendarClock className="w-5 h-5" style={{ color: COLORS.accent }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: COLORS.muted }}>
                    {sessionsPanelTab === "upcoming"
                      ? "No upcoming sessions booked yet."
                      : "No missed or ended sessions."}
                  </p>
                  {sessionsPanelTab === "upcoming" && (
                    <button
                      onClick={handleOpenFindMentor}
                      className="px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:bg-[#8b7355] shadow-sm"
                      style={{ backgroundColor: COLORS.ink, color: "#fff" }}
                    >
                      Book a session
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {displayedSessions.slice(0, 5).map((item, idx) => {
                  const name = item.mentorName || "Mentor";
                  const photo = item.mentorProfilePhoto;
                  const isPending = item.status === "pending";
                  const isInProgress = item.timing.isInProgress && !item.timing.isStale;
                  const isStale = item.timing.isStale;
                  const canJoin = item.timing.canJoin;

                  return (
                    <div
                      key={item.bookingId || item.sessionId || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 rounded-xl transition-colors hover:border-[#c9baa9]"
                      style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {photo ? (
                          <img
                            src={photo}
                            alt={name}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                            style={{ border: `1px solid ${COLORS.hairline}` }}
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                            style={{ backgroundColor: COLORS.ink }}
                          >
                            {initialsFrom(name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
                              {name}
                            </p>
                            {isPending && !isStale && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                Awaiting confirmation
                              </span>
                            )}
                            {isInProgress && !isStale && (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                Live
                              </span>
                            )}
                            {isStale && (
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                                  item.timing.staleLabel === "Expired"
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : item.timing.staleLabel === "Missed"
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                                }`}
                              >
                                {item.timing.staleLabel || "Ended"}
                              </span>
                            )}
                            {item.isGroupSession && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#f3ece4] text-[#7a5c3e] shrink-0">
                                Group
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.muted }}>
                            {item.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <span
                          className="text-xs font-semibold shrink-0 px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: COLORS.chip, color: COLORS.accent }}
                        >
                          {formatWhen(item.startTime || item.scheduledAt)}
                        </span>

                        {canJoin && (
                          <button
                            onClick={() => {
                              const destination = `/mentorship/session-room/${encodeURIComponent(item.sessionId)}${
                                item.bookingId ? `?bookingId=${item.bookingId}` : ""
                              }`;
                              router.push(destination);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 shadow-sm"
                            style={{
                              backgroundColor: "#dcfce7",
                              color: "#15803d",
                              border: "1px solid #86efac",
                            }}
                          >
                            <Video className="w-3.5 h-3.5" />
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Pending Actions panel */}
        <div
          className="lg:col-span-2 bg-white p-6 rounded-2xl"
          style={{ border: `1px solid ${COLORS.hairline}` }}
        >
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4" style={{ color: COLORS.ink }}>
            <ShieldCheck className="w-4 h-4" style={{ color: COLORS.accent }} />
            Pending Actions
            {pendingActions.length > 0 && (
              <span
                className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: "#f4e6d0", color: COLORS.accent }}
              >
                {pendingActions.length}
              </span>
            )}
          </h3>

          {/* Reviews fetch error — non-fatal, show inline retry */}
          {reviewsError && (
            <div className="mb-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Couldn't check review status.</span>
              <button
                onClick={fetchReviews}
                className="ml-auto flex items-center gap-1 font-semibold hover:underline"
              >
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {pendingActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.chip }}
              >
                <CheckCircle className="w-5 h-5" style={{ color: COLORS.accent }} />
              </div>
              <p className="text-sm font-medium" style={{ color: COLORS.muted }}>
                You're all caught up
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingActions.map((action, idx) => (
                <div
                  key={idx}
                  onClick={action.onClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && action.onClick()}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#c9baa9] cursor-pointer"
                  style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-white border border-[#e0d8cf]">
                      <action.icon className="w-4 h-4" style={{ color: COLORS.accent }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#4a3728]">{action.title}</p>
                      <p className="text-xs text-[#8a7a6a]">{action.description}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 shrink-0" style={{ color: COLORS.accent }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FindMentorModal
        isOpen={isFindMentorOpen}
        onClose={() => setIsFindMentorOpen(false)}
        mentors={findMentorMentors}
        loading={findMentorLoading}
      />
    </div>
  );
}