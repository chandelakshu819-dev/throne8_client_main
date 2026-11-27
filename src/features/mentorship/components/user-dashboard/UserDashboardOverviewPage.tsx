// src/features/mentorship/components/user-dashboard/UserDashboardOverviewPage.tsx
"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  ChevronRight,
  Sparkles,
  Trophy,
  History,
  Repeat,
  CalendarDays,
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
  inkDeep: "#3a2a1d",
  accent: "#7a5c3e",
  hairline: "#e6ddd3",
  wash: "#f6ede8",
  softWash: "#fbf7f3",
  chip: "#f3ece4",
  gold: "#c9a87c",
  goldSoft: "#f4e6d0",
  muted: "#85746a",
  faint: "#a08070",
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/50 focus-visible:ring-offset-2";
const CARD_SHADOW =
  "shadow-[0_1px_2px_rgba(74,55,40,0.05),0_4px_16px_-8px_rgba(74,55,40,0.10)]";
const NO_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

// Hours milestones for the journey card
const MILESTONES = [1, 5, 10, 25, 50, 100];

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
  if (isToday) return `Today, ${time}`;
  return `${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`;
}

function formatCountdown(ms: number) {
  if (!isFinite(ms)) return "";
  if (ms <= 0) return "Starting now";
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "Starting now";
  if (mins < 60) return `Starts in ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Starts in ${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `Starts in ${days} day${days > 1 ? "s" : ""}`;
}

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "S";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function resolveMentorName(s: any): string {
  return (
    s.mentorName ||
    s.mentor?.fullName ||
    s.mentor?.displayName ||
    s.mentorDisplayName ||
    (s.mentor?.firstName
      ? `${s.mentor.firstName} ${s.mentor.lastName || ""}`.trim()
      : "") ||
    "Mentor"
  );
}

function resolveMentorPhoto(s: any): string | null {
  const candidates = [
    s.mentorProfilePhoto,
    s.mentor?.profilePic,
    s.mentor?.profilePhoto,
    s.profilePic,
  ];
  // Only real image URLs: a bare photo ID would render as a broken image
  return (
    candidates.find((v) => typeof v === "string" && /^(https?:\/\/|data:image\/)/i.test(v)) ||
    null
  );
}

// ── Small pieces ──────────────────────────────────────────────────────────────

function Avatar({
  photo,
  name,
  className = "w-10 h-10",
  dark = false,
}: {
  photo?: string | null;
  name: string;
  className?: string;
  dark?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [photo]);

  if (photo && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name}
        onError={() => setBroken(true)}
        className={`${className} rounded-full object-cover shrink-0 ring-2 ${dark ? "ring-white/20" : "ring-white"}`}
        style={{ border: `1px solid ${COLORS.hairline}` }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${className} rounded-full flex items-center justify-center shrink-0 text-xs font-bold ring-2 ${
        dark ? "ring-white/20 text-[#4a3728] bg-[#f4e6d0]" : "ring-white text-white"
      }`}
      style={dark ? undefined : { backgroundColor: COLORS.ink }}
    >
      {initialsFrom(name)}
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  caption,
  icon: Icon,
  highlight,
  selected,
  onClick,
}: {
  label: string;
  value: string;
  unit?: string;
  caption?: string;
  icon: React.ElementType;
  highlight?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium truncate" style={{ color: COLORS.muted }}>
          {label}
        </span>
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative"
          style={{ backgroundColor: selected ? COLORS.ink : highlight ? COLORS.goldSoft : COLORS.chip }}
        >
          <Icon className="w-4 h-4" style={{ color: selected ? "#fff" : COLORS.accent }} />
          {highlight && !selected && (
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white"
              style={{ backgroundColor: COLORS.gold }}
            />
          )}
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-1 tabular-nums" style={{ color: COLORS.ink }}>
        <span className="text-[26px] font-bold leading-none tracking-tight">{value}</span>
        {unit && (
          <span className="text-sm font-semibold" style={{ color: COLORS.muted }}>
            {unit}
          </span>
        )}
      </div>
      <div className="mt-1.5 text-xs h-4 truncate" style={{ color: COLORS.muted }}>
        {caption || "\u00A0"}
      </div>
    </>
  );

  const base = `bg-white rounded-2xl p-4 text-left w-full h-full min-w-0 border ${CARD_SHADOW}`;
  const style = {
    borderColor: selected ? COLORS.ink : highlight ? COLORS.gold : COLORS.hairline,
    boxShadow: selected ? `0 0 0 1px ${COLORS.ink}` : undefined,
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`${base} transition-[border-color,transform] duration-150 hover:border-[#c9baa9] active:scale-[0.99] ${FOCUS_RING}`}
        style={style}
      >
        {content}
      </button>
    );
  }
  return (
    <div className={base} style={style}>
      {content}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: React.ElementType;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: COLORS.chip, border: `1px solid ${COLORS.hairline}` }}
      >
        <Icon className="w-5 h-5" style={{ color: COLORS.accent }} />
      </div>
      <div className="max-w-xs">
        <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
          {title}
        </p>
        {text && (
          <p className="text-xs mt-1 leading-relaxed" style={{ color: COLORS.muted }}>
            {text}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  badge,
  action,
  children,
  className = "",
}: {
  title: string;
  icon?: React.ElementType;
  badge?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-white rounded-2xl border ${CARD_SHADOW} ${className}`}
      style={{ borderColor: COLORS.hairline }}
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.ink }}>
          {Icon && <Icon className="w-4 h-4" style={{ color: COLORS.accent }} />}
          {title}
          {badge != null && badge > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums"
              style={{ backgroundColor: COLORS.goldSoft, color: COLORS.accent }}
            >
              {badge}
            </span>
          )}
        </h3>
        {action}
      </div>
      <div className="p-5 pt-4">{children}</div>
    </section>
  );
}

// Circular progress for the mentorship-hours journey
function ProgressRing({ value, size = 96 }: { value: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.chip} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={COLORS.ink}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        style={{ transition: "stroke-dashoffset 600ms ease" }}
      />
    </svg>
  );
}

function WeekStrip({ items, nowMs }: { items: NormalizedMenteeSession[]; nowMs: number }) {
  const days = useMemo(() => {
    const base = new Date(nowMs);
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, [nowMs]);

  const counts = days.map((d) => {
    const start = d.getTime();
    const end = start + 86400000;
    return items.filter((s) => {
      const t = s.timing.startMs || 0;
      return t >= start && t < end;
    }).length;
  });
  const total = counts.reduce((a, b) => a + b, 0);

  return (
    <Panel
      title="This week"
      icon={CalendarDays}
      action={
        <span className="text-xs tabular-nums" style={{ color: COLORS.muted }}>
          {total} booked
        </span>
      }
    >
      <ul className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const isToday = i === 0;
          const c = counts[i];
          return (
            <li
              key={d.toISOString()}
              className="flex flex-col items-center gap-1.5 py-2 rounded-lg"
              style={{
                backgroundColor: isToday ? COLORS.ink : c > 0 ? COLORS.chip : "transparent",
                border: `1px solid ${isToday ? COLORS.ink : c > 0 ? COLORS.hairline : "transparent"}`,
              }}
              aria-label={`${d.toLocaleDateString([], { weekday: "long" })}: ${c} sessions`}
            >
              <span className="text-[10px] font-medium" style={{ color: isToday ? "rgba(255,255,255,0.75)" : COLORS.muted }}>
                {d.toLocaleDateString([], { weekday: "narrow" })}
              </span>
              <span className="text-sm font-bold tabular-nums" style={{ color: isToday ? "#fff" : COLORS.ink }}>
                {d.getDate()}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: c > 0 ? (isToday ? "#fff" : COLORS.accent) : "transparent" }}
              />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto motion-safe:animate-pulse" aria-busy="true">
      <div className="space-y-2">
        <div className="h-8 w-60 bg-[#e6ddd3] rounded-md" />
        <div className="h-4 w-72 bg-[#e6ddd3]/60 rounded-md" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-44 rounded-2xl bg-[#e6ddd3]" />
        <div className="h-44 rounded-2xl bg-white border border-[#e6ddd3]" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white h-[116px] rounded-2xl border border-[#e6ddd3]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 h-64 bg-white rounded-2xl border border-[#e6ddd3]" />
        <div className="lg:col-span-2 h-64 bg-white rounded-2xl border border-[#e6ddd3]" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserDashboardOverviewPage({
  user,
  sessions: initialSessions = [],
  setActivePage,
}: UserDashboardOverviewPageProps) {
  const router = useRouter();
  const currentUserId: string = user?.userId || user?.id || user?._id || "";

  const nowMs = useNow(15000);

  const [isFindMentorOpen, setIsFindMentorOpen] = useState(false);
  const [findMentorMentors, setFindMentorMentors] = useState<any[]>([]);
  const [findMentorLoading, setFindMentorLoading] = useState(false);
  const [sessionsPanelTab, setSessionsPanelTab] = useState<"upcoming" | "missedEnded">("upcoming");

  const [extraGroupSessions, setExtraGroupSessions] = useState<any[]>([]);
  const [extraGroupLoading, setExtraGroupLoading] = useState(true);

  const [reviewedSessionIds, setReviewedSessionIds] = useState<Set<string>>(new Set());
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

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

  // ── Normalize sessions across 1:1, Senior, and Group sessions ───────────────
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
      const mentorName = resolveMentorName(s);
      const mentorProfilePhoto = resolveMentorPhoto(s);
      const title = s.title || s.serviceName || s.sessionType || "Mentorship Session";

      if (s.isGroupSession) {
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
          mentorProfilePhoto: mentorProfilePhoto ?? undefined,
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
            mentorProfilePhoto: mentorProfilePhoto ?? undefined,
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
        const timing = getSessionTiming(s, null, nowMs);
        items.push({
          sessionId: sid,
          bookingId: sid,
          mentorId: s.mentorId,
          mentorName,
          mentorProfilePhoto: mentorProfilePhoto ?? undefined,
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

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalSessions = normalizedSessions.filter((item) => !item.timing.isTerminal);

  const upcoming = [...normalizedSessions]
    .filter((item) => item.timing.isUpcoming && !item.timing.isStale)
    .sort((a, b) => (a.timing.startMs || 0) - (b.timing.startMs || 0));

  const completed = normalizedSessions.filter((item) => item.timing.isCompleted);

  const missedEnded = useMemo(() => {
    return [...normalizedSessions]
      .filter((item) => !item.timing.isTerminal && !item.timing.isCompleted && !item.timing.isUpcoming)
      .sort((a, b) => (b.timing.startMs || 0) - (a.timing.startMs || 0));
  }, [normalizedSessions]);

  // Only auto-switch when the counts change, so a manual tab click is never overridden
  const prevLens = useRef({ u: upcoming.length, m: missedEnded.length });
  useEffect(() => {
    if (prevLens.current.u === upcoming.length && prevLens.current.m === missedEnded.length) return;
    prevLens.current = { u: upcoming.length, m: missedEnded.length };
    if (upcoming.length === 0 && missedEnded.length > 0) setSessionsPanelTab("missedEnded");
    else if (upcoming.length > 0) setSessionsPanelTab("upcoming");
  }, [upcoming.length, missedEnded.length]);

  // Run once on first data so an empty Upcoming tab doesn't hide missed sessions
  const didInitTab = useRef(false);
  useEffect(() => {
    if (didInitTab.current) return;
    if (normalizedSessions.length === 0) return;
    didInitTab.current = true;
    if (upcoming.length === 0 && missedEnded.length > 0) setSessionsPanelTab("missedEnded");
  }, [normalizedSessions.length, upcoming.length, missedEnded.length]);

  // Unique mentors with how many sessions each (non-terminal sessions only)
  const mentorList = useMemo(() => {
    const map = new Map<string, { key: string; name: string; photo?: string; count: number }>();
    normalizedSessions.forEach((item) => {
      if (item.timing.isTerminal) return;
      const key = item.mentorId ? String(item.mentorId) : item.mentorName || "";
      if (!key) return;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        if (!existing.photo && item.mentorProfilePhoto) existing.photo = item.mentorProfilePhoto;
      } else {
        map.set(key, { key, name: item.mentorName, photo: item.mentorProfilePhoto, count: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [normalizedSessions]);
  const uniqueMentors = mentorList.length;

  // Strict fallback chain actualDuration -> duration -> slot length -> 0 (never a fake 60)
  const totalMinutes = completed.reduce((acc, item) => acc + item.timing.durationMinutes, 0);
  const totalHours = totalMinutes > 0 ? (totalMinutes / 60).toFixed(1) : "0";
  const hoursNum = parseFloat(totalHours);
  const hoursUnit = hoursNum === 1 ? "hr" : "hrs";

  // Journey: progress towards the next hours milestone
  const nextMilestone = MILESTONES.find((m) => m > hoursNum) ?? null;
  const prevMilestone = [...MILESTONES].reverse().find((m) => m <= hoursNum) ?? 0;
  const journeyPct = nextMilestone
    ? (hoursNum - prevMilestone) / (nextMilestone - prevMilestone)
    : 1;
  const hoursToGo = nextMilestone ? Math.max(0, nextMilestone - hoursNum) : 0;

  // Recent activity: last completed sessions
  const recentCompleted = [...completed]
    .sort((a, b) => (b.timing.startMs || 0) - (a.timing.startMs || 0))
    .slice(0, 3);

  const nextSession = upcoming[0];

  // ── Stat cards ──────────────────────────────────────────────────────────────
  const stats: {
    label: string;
    value: string;
    unit?: string;
    caption?: string;
    icon: React.ElementType;
    highlight?: boolean;
    selected?: boolean;
    page?: string;
    onClick?: () => void;
  }[] = [
    { label: "Total sessions", value: String(totalSessions.length), caption: "Active and done", icon: ClipboardList },
    {
      label: "Upcoming",
      value: String(upcoming.length),
      caption: upcoming.length > 0 ? "Booked ahead" : "Nothing booked",
      icon: CalendarClock,
      highlight: upcoming.length > 0,
      selected: sessionsPanelTab === "upcoming",
      onClick: () => setSessionsPanelTab("upcoming"),
    },
    { label: "Completed", value: String(completed.length), caption: "View history", icon: CheckCircle, page: "session-history" },
    {
      label: "Missed / Ended",
      value: String(missedEnded.length),
      caption: missedEnded.length > 0 ? "Rebook anytime" : "All clear",
      icon: AlertCircle,
      selected: sessionsPanelTab === "missedEnded",
      onClick: () => setSessionsPanelTab("missedEnded"),
    },
    { label: "My mentors", value: String(uniqueMentors), caption: "View mentors", icon: Users, page: "my-mentors" },
    {
      label: "Mentorship hours",
      value: totalHours,
      unit: hoursUnit,
      caption: nextMilestone ? `${nextMilestone} hrs next goal` : "Top milestone",
      icon: Clock3,
    },
  ];

  // ── Pending actions ─────────────────────────────────────────────────────────
  const profileChecks = user
    ? [
        Boolean(user.bio?.trim()),
        Boolean(user.jobTitle?.trim()),
        Boolean(user.profileImageUrl || user.profilePhoto || user.profilePic),
      ]
    : [];
  const profileDone = profileChecks.filter(Boolean).length;
  const profileIncomplete = user && profileDone < profileChecks.length;

  const pendingActions: {
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
    progress?: number;
  }[] = [];

  if (profileIncomplete) {
    pendingActions.push({
      title: "Complete your profile",
      description: `${profileDone} of ${profileChecks.length} done. Help mentors understand your goals`,
      icon: BookOpen,
      progress: profileDone / profileChecks.length,
      onClick: () => setActivePage?.("profile"),
    });
  }

  if (!reviewsLoading) {
    const unreviewed = completed.filter((item) => item.sessionId && !reviewedSessionIds.has(String(item.sessionId)));
    if (unreviewed.length > 0) {
      const count = unreviewed.length;
      const mentorName = count === 1 ? unreviewed[0].mentorName || "your mentor" : `${count} mentors`;
      pendingActions.push({
        title: `Rate your session${count > 1 ? "s" : ""} with ${mentorName}`,
        description: "Your feedback helps other students choose",
        icon: Star,
        onClick: () => setActivePage?.("session-history"),
      });
    }
  }

  if (initialSessions.length === 0 && extraGroupLoading && reviewsLoading) {
    return <OverviewSkeleton />;
  }

  const nowDate = new Date(nowMs);
  const dateLine = nowDate.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
  const displayedSessions = sessionsPanelTab === "upcoming" ? upcoming : missedEnded;

  const joinSession = (item: NormalizedMenteeSession) => {
    const destination = `/mentorship/session-room/${encodeURIComponent(item.sessionId)}${
      item.bookingId ? `?bookingId=${item.bookingId}` : ""
    }`;
    router.push(destination);
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Greeting + actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight leading-tight" style={{ color: COLORS.ink }}>
            {greetingFor(nowDate.getHours())}, {firstName}
          </h2>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
            {dateLine}.{" "}
            {upcoming.length > 0
              ? `${upcoming.length} session${upcoming.length > 1 ? "s" : ""} coming up.`
              : "Your calendar is open."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleOpenFindMentor}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 ${FOCUS_RING}`}
            style={{ backgroundColor: COLORS.ink }}
          >
            <Search className="w-4 h-4" />
            Quick book mentor
          </button>
          <button
            onClick={() => setActivePage?.("upcoming-sessions")}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white border transition-colors hover:bg-[#fbf7f3] hover:border-[#c9baa9] ${FOCUS_RING}`}
            style={{ color: COLORS.accent, borderColor: COLORS.hairline }}
          >
            <ClipboardList className="w-4 h-4" />
            View all sessions
          </button>
        </div>
      </div>

      {/* Hero: next session + journey */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <section
          className="lg:col-span-2 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${COLORS.inkDeep} 0%, ${COLORS.ink} 60%, ${COLORS.accent} 130%)`,
          }}
          aria-label="Next session"
        >
          {nextSession ? (
            <div className="relative flex flex-col h-full gap-5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
                  {nextSession.timing.isInProgress ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
                      Live now
                    </>
                  ) : (
                    <>
                      <CalendarClock className="w-3.5 h-3.5" />
                      Next session
                    </>
                  )}
                </span>
                {!nextSession.timing.isInProgress && (
                  <span className="text-sm font-semibold tabular-nums" style={{ color: COLORS.goldSoft }}>
                    {formatCountdown((nextSession.timing.startMs || 0) - nowMs)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 min-w-0">
                <Avatar photo={nextSession.mentorProfilePhoto} name={nextSession.mentorName} className="w-14 h-14" dark />
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold tracking-tight truncate">{nextSession.mentorName}</p>
                  <p className="text-sm text-white/70 truncate">{nextSession.title}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-auto">
                <p className="text-sm text-white/80 tabular-nums">
                  {formatWhen(nextSession.startTime || nextSession.scheduledAt)}
                </p>
                {nextSession.timing.canJoin ? (
                  <button
                    onClick={() => joinSession(nextSession)}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors bg-white text-[#4a3728] hover:bg-[#f4e6d0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#4a3728]`}
                  >
                    <Video className="w-4 h-4" />
                    Join session
                  </button>
                ) : (
                  <span className="text-xs text-white/60">Joining opens a few minutes before the start</span>
                )}
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col h-full justify-between gap-5">
              <span className="inline-flex self-start items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
                <Sparkles className="w-3.5 h-3.5" />
                Plan your next step
              </span>
              <div className="max-w-lg">
                <p className="text-xl sm:text-2xl font-bold tracking-tight">Nothing booked yet</p>
                <p className="text-sm text-white/70 mt-1.5 leading-relaxed">
                  {completed.length > 0
                    ? "You have momentum. Book your next session to keep it going."
                    : "Pick a mentor and book your first session in a couple of minutes."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleOpenFindMentor}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-[#4a3728] hover:bg-[#f4e6d0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#4a3728]"
                >
                  <Search className="w-4 h-4" />
                  Find a mentor
                </button>
                {uniqueMentors > 0 && (
                  <button
                    onClick={() => setActivePage?.("my-mentors")}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/25 text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#4a3728]"
                  >
                    <Repeat className="w-4 h-4" />
                    Book with a past mentor
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Journey */}
        <section
          className={`bg-white rounded-2xl border p-5 sm:p-6 flex flex-col justify-between gap-4 ${CARD_SHADOW}`}
          style={{ borderColor: COLORS.hairline }}
          aria-label="Mentorship journey"
        >
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.ink }}>
            <Trophy className="w-4 h-4" style={{ color: COLORS.accent }} />
            Your journey
          </h3>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <ProgressRing value={journeyPct} />
              <div className="absolute inset-0 flex flex-col items-center justify-center tabular-nums">
                <span className="text-xl font-bold leading-none" style={{ color: COLORS.ink }}>
                  {totalHours}
                </span>
                <span className="text-[10px] font-medium mt-0.5" style={{ color: COLORS.muted }}>
                  {hoursUnit}
                </span>
              </div>
            </div>
            <div className="min-w-0">
              {nextMilestone ? (
                <>
                  <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                    {hoursToGo.toFixed(1)} {hoursToGo === 1 ? "hr" : "hrs"} to your {nextMilestone}-hour milestone
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                    {completed.length} completed session{completed.length === 1 ? "" : "s"} so far
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                  You have reached the top milestone
                </p>
              )}
            </div>
          </div>
          <ul className="flex items-center gap-1.5" aria-label="Milestones">
            {MILESTONES.map((m) => {
              const reached = hoursNum >= m;
              return (
                <li
                  key={m}
                  className="flex-1 text-center text-[10px] font-bold py-1 rounded-md tabular-nums"
                  style={{
                    backgroundColor: reached ? COLORS.ink : COLORS.chip,
                    color: reached ? "#fff" : COLORS.faint,
                  }}
                >
                  {m}h
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-stretch">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            unit={stat.unit}
            caption={stat.caption}
            icon={stat.icon}
            highlight={stat.highlight}
            selected={stat.selected}
            onClick={stat.onClick ?? (stat.page ? () => setActivePage?.(stat.page!) : undefined)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left: sessions + recent activity */}
        <div className="lg:col-span-3 space-y-6 min-w-0">
          <section
            className={`bg-white rounded-2xl border ${CARD_SHADOW}`}
            style={{ borderColor: COLORS.hairline }}
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 border-b" style={{ borderColor: COLORS.hairline }}>
              <div role="tablist" aria-label="Sessions" className={`flex gap-5 sm:gap-6 overflow-x-auto ${NO_SCROLLBAR}`}>
                {(
                  [
                    { key: "upcoming", label: "Upcoming", count: upcoming.length },
                    { key: "missedEnded", label: "Missed / ended", count: missedEnded.length },
                  ] as const
                ).map((tab) => {
                  const active = sessionsPanelTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      role="tab"
                      type="button"
                      aria-selected={active}
                      onClick={() => setSessionsPanelTab(tab.key)}
                      className={`flex items-center gap-2 py-4 -mb-px border-b-2 text-sm font-semibold whitespace-nowrap transition-colors rounded-t ${FOCUS_RING}`}
                      style={{
                        borderColor: active ? COLORS.ink : "transparent",
                        color: active ? COLORS.ink : COLORS.muted,
                      }}
                    >
                      {tab.label}
                      <span
                        className="px-1.5 min-w-[20px] text-center rounded-full text-[11px] font-bold tabular-nums"
                        style={{
                          backgroundColor: active ? COLORS.ink : COLORS.chip,
                          color: active ? "#fff" : COLORS.accent,
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setActivePage?.("upcoming-sessions")}
                className={`text-xs font-semibold hover:underline flex items-center gap-0.5 shrink-0 rounded ${FOCUS_RING}`}
                style={{ color: COLORS.accent }}
              >
                View all
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {displayedSessions.length === 0 ? (
                <EmptyState
                  icon={sessionsPanelTab === "upcoming" ? CalendarClock : CheckCircle}
                  title={sessionsPanelTab === "upcoming" ? "No upcoming sessions" : "No missed or ended sessions"}
                  text={
                    sessionsPanelTab === "upcoming"
                      ? "Book a session and it will show up here with a join button."
                      : "Every session you booked was held."
                  }
                  action={
                    sessionsPanelTab === "upcoming" ? (
                      <button
                        onClick={handleOpenFindMentor}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 ${FOCUS_RING}`}
                        style={{ backgroundColor: COLORS.ink }}
                      >
                        Book a session
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {displayedSessions.slice(0, 5).map((item, idx) => {
                    const name = item.mentorName || "Mentor";
                    const isPending = item.status === "pending";
                    const isInProgress = item.timing.isInProgress && !item.timing.isStale;
                    const isStale = item.timing.isStale;
                    const canJoin = item.timing.canJoin;
                    const isMissedTab = sessionsPanelTab === "missedEnded";

                    return (
                      <li
                        key={item.bookingId || item.sessionId || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 rounded-xl border bg-white transition-colors hover:bg-[#fdfaf7]"
                        style={{ borderColor: COLORS.hairline }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar photo={item.mentorProfilePhoto} name={name} className="w-11 h-11" />
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
                              {isInProgress && (
                                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 motion-safe:animate-pulse" />
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
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                  <Users className="w-3 h-3" />
                                  Group
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.muted }}>
                              {item.title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap tabular-nums"
                            style={{ backgroundColor: COLORS.chip, color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
                          >
                            {formatWhen(item.startTime || item.scheduledAt)}
                          </span>

                          {canJoin && (
                            <button
                              onClick={() => joinSession(item)}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shrink-0 ${FOCUS_RING}`}
                            >
                              <Video className="w-3.5 h-3.5" />
                              Join
                            </button>
                          )}

                          {isMissedTab && (
                            <button
                              onClick={handleOpenFindMentor}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors hover:bg-[#fbf7f3] hover:border-[#c9baa9] shrink-0 ${FOCUS_RING}`}
                              style={{ color: COLORS.ink, borderColor: COLORS.hairline }}
                            >
                              <Repeat className="w-3.5 h-3.5" />
                              Rebook
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {displayedSessions.length > 5 && (
                <button
                  onClick={() => setActivePage?.("upcoming-sessions")}
                  className={`mt-4 w-full py-2.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-[#fbf7f3] ${FOCUS_RING}`}
                  style={{ color: COLORS.accent, borderColor: COLORS.hairline }}
                >
                  Show all {displayedSessions.length} sessions
                </button>
              )}
            </div>
          </section>

          {/* Recent activity */}
          {recentCompleted.length > 0 && (
            <Panel
              title="Recent activity"
              icon={History}
              action={
                <button
                  onClick={() => setActivePage?.("session-history")}
                  className={`text-xs font-semibold hover:underline flex items-center gap-0.5 rounded ${FOCUS_RING}`}
                  style={{ color: COLORS.accent }}
                >
                  Session history
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              }
            >
              <ol className="relative space-y-4 ml-3 border-l" style={{ borderColor: COLORS.hairline }}>
                {recentCompleted.map((item, idx) => {
                  const reviewed = reviewedSessionIds.has(String(item.sessionId));
                  return (
                    <li key={item.bookingId || item.sessionId || idx} className="pl-6 relative">
                      <span
                        className="absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-4 ring-white"
                        style={{ backgroundColor: COLORS.accent }}
                      />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
                            Session with {item.mentorName}
                          </p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.muted }}>
                            {item.title}, {formatWhen(item.startTime || item.scheduledAt)}
                          </p>
                        </div>
                        {!reviewsLoading &&
                          (reviewed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 shrink-0">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Reviewed
                            </span>
                          ) : (
                            <button
                              onClick={() => setActivePage?.("session-history")}
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 transition-colors hover:brightness-95 ${FOCUS_RING}`}
                              style={{ backgroundColor: COLORS.goldSoft, color: COLORS.accent }}
                            >
                              <Star className="w-3 h-3" />
                              Rate
                            </button>
                          ))}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Panel>
          )}
        </div>

        {/* Right column */}
        <aside className="lg:col-span-2 space-y-6 min-w-0">
          <Panel title="Pending actions" icon={ShieldCheck} badge={pendingActions.length}>
            {reviewsError && (
              <div role="alert" className="mb-3 flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Couldn’t check review status.</span>
                <button
                  onClick={fetchReviews}
                  className={`ml-auto flex items-center gap-1 font-semibold hover:underline rounded ${FOCUS_RING}`}
                >
                  <RotateCcw className="w-3 h-3" /> Retry
                </button>
              </div>
            )}

            {pendingActions.length === 0 ? (
              <EmptyState icon={CheckCircle} title="You’re all caught up" text="New to-dos will show up here." />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {pendingActions.map((action, idx) => (
                  <li key={idx}>
                    <button
                      onClick={action.onClick}
                      className={`group w-full flex items-center justify-between gap-3 p-3.5 rounded-xl text-left border transition-colors hover:border-[#c9baa9] hover:bg-[#fbf7f3] ${FOCUS_RING}`}
                      style={{ borderColor: COLORS.hairline }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                          className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: COLORS.chip }}
                        >
                          <action.icon className="w-4 h-4" style={{ color: COLORS.accent }} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold" style={{ color: COLORS.ink }}>
                            {action.title}
                          </span>
                          <span className="block text-xs" style={{ color: COLORS.muted }}>
                            {action.description}
                          </span>
                          {action.progress != null && (
                            <span
                              className="block mt-2 h-1.5 rounded-full overflow-hidden"
                              style={{ backgroundColor: COLORS.chip }}
                              aria-hidden="true"
                            >
                              <span
                                className="block h-full rounded-full"
                                style={{ width: `${action.progress * 100}%`, backgroundColor: COLORS.ink }}
                              />
                            </span>
                          )}
                        </span>
                      </div>
                      <ArrowUpRight
                        className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        style={{ color: COLORS.accent }}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <WeekStrip items={upcoming} nowMs={nowMs} />

          {/* My mentors */}
          <Panel
            title="Your mentors"
            icon={Users}
            action={
              mentorList.length > 0 ? (
                <button
                  onClick={() => setActivePage?.("my-mentors")}
                  className={`text-xs font-semibold hover:underline flex items-center gap-0.5 rounded ${FOCUS_RING}`}
                  style={{ color: COLORS.accent }}
                >
                  View all
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          >
            {mentorList.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No mentors yet"
                text="Mentors you book will appear here for quick rebooking."
                action={
                  <button
                    onClick={handleOpenFindMentor}
                    className={`text-xs font-semibold hover:underline rounded ${FOCUS_RING}`}
                    style={{ color: COLORS.accent }}
                  >
                    Find a mentor
                  </button>
                }
              />
            ) : (
              <ul className="space-y-1">
                {mentorList.slice(0, 4).map((m) => (
                  <li key={m.key} className="flex items-center justify-between gap-3 py-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar photo={m.photo} name={m.name} className="w-10 h-10" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
                          {m.name}
                        </p>
                        <p className="text-xs tabular-nums" style={{ color: COLORS.muted }}>
                          {m.count} session{m.count > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleOpenFindMentor}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors hover:bg-[#fbf7f3] hover:border-[#c9baa9] shrink-0 ${FOCUS_RING}`}
                      style={{ color: COLORS.ink, borderColor: COLORS.hairline }}
                    >
                      <Repeat className="w-3 h-3" />
                      Book again
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
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