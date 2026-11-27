//src/features/mentorship/components/mentor/MentorExtras.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  FileText,
  Mic,
  Compass,
  Briefcase,
  MessageCircle,
  Clock,
  ChevronRight,
  Share2,
  Link2,
  Check,
  Sparkles,
  ArrowDown,
} from "lucide-react";

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e6ddd3",
  softWash: "#fbf7f3",
  chip: "#f3ece4",
  muted: "#85746a",
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/50 focus-visible:ring-offset-2";

const CARD =
  "rounded-2xl border bg-[#fdfaf6] shadow-[0_1px_2px_rgba(74,55,40,0.05),0_4px_16px_-8px_rgba(74,55,40,0.10)]";

// ── helpers ───────────────────────────────────────────────────────────────────

export function formatSessionPrice(session: any): string {
  const base = session?.pricing?.basePrice;
  if (base === 0) return "Free";
  if (typeof base === "number") return `₹${base}`;
  return "";
}

function bookableSessions(sessions: any[]) {
  // Group sessions are booked through their own modal, not this flow
  return sessions.filter((s) => s?.sessionType && s.sessionType !== "group_session");
}

function normalizeSkills(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s: any) => (typeof s === "string" ? s : s?.name || s?.skill || s?.title || ""))
    .map((s: string) => s.trim())
    .filter(Boolean);
}

// ── 1. Goal finder ────────────────────────────────────────────────────────────

const GOALS: {
  key: string
  label: string
  hint: string
  icon: React.ElementType
  types: string[]
}[] = [
  { key: "resume", label: "Fix my resume", hint: "Get it ready for ATS and recruiters", icon: FileText, types: ["resume_review"] },
  { key: "interview", label: "Crack interviews", hint: "Practice with a real mock interview", icon: Mic, types: ["mock_interview"] },
  { key: "career", label: "Plan my career", hint: "Talk through your next move", icon: Compass, types: ["career_planning", "deep_dive"] },
  { key: "portfolio", label: "Review my portfolio", hint: "Honest feedback on your work", icon: Briefcase, types: ["portfolio_review"] },
  { key: "quick", label: "Ask a quick question", hint: "Short call or a written query", icon: MessageCircle, types: ["quick_call", "ask_query"] },
];

export function GoalFinder({
  sessions,
  onBook,
}: {
  sessions: any[];
  onBook: (session: any) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const bookable = useMemo(() => bookableSessions(sessions), [sessions]);

  // Only show goals this mentor actually offers, so there are no dead ends
  const goals = useMemo(
    () => GOALS.filter((g) => bookable.some((s) => g.types.includes(s.sessionType))),
    [bookable]
  );

  if (goals.length === 0) return null;

  const active = goals.find((g) => g.key === selected) || null;
  const matches = active ? bookable.filter((s) => active.types.includes(s.sessionType)) : [];

  return (
    <section className={`${CARD} p-4 sm:p-5`} style={{ borderColor: COLORS.hairline }} aria-label="Find the right session">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4" style={{ color: COLORS.accent }} />
        <h3 className="text-sm font-bold" style={{ color: COLORS.ink }}>
          What do you need help with?
        </h3>
      </div>
      <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
        Pick a goal and we will point you to the right session.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Goals">
        {goals.map((g) => {
          const isActive = selected === g.key;
          return (
            <button
              key={g.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSelected(isActive ? null : g.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${FOCUS_RING}`}
              style={{
                backgroundColor: isActive ? COLORS.ink : "#fff",
                color: isActive ? "#fff" : COLORS.accent,
                borderColor: isActive ? COLORS.ink : COLORS.hairline,
              }}
            >
              <g.icon className="w-3.5 h-3.5" />
              {g.label}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-4" aria-live="polite">
          <p className="text-xs font-medium mb-2" style={{ color: COLORS.muted }}>
            {active.hint}
          </p>
          <ul className="space-y-2">
            {matches.map((s) => {
              const id = s.sessionId || s._id || s.id;
              const price = formatSessionPrice(s);
              return (
                <li
                  key={String(id)}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-white"
                  style={{ borderColor: COLORS.hairline }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
                      {s.title}
                    </p>
                    <p className="text-xs mt-0.5 flex items-center gap-1.5 tabular-nums" style={{ color: COLORS.muted }}>
                      {s.duration ? (
                        <>
                          <Clock className="w-3 h-3" />
                          {s.duration} min
                        </>
                      ) : null}
                      {price && <span className="font-semibold" style={{ color: COLORS.ink }}>{price}</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBook(s)}
                    className={`shrink-0 inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 ${FOCUS_RING}`}
                    style={{ backgroundColor: COLORS.ink }}
                  >
                    Book
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

// ── 2. Skill overlap between the viewer and the mentor ───────────────────────

export function MatchInsight({
  mentorName,
  mentorSkills,
  user,
}: {
  mentorName: string;
  mentorSkills: unknown;
  user: any;
}) {
  const router = useRouter();

  const mentorList = useMemo(() => normalizeSkills(mentorSkills), [mentorSkills]);
  const userList = useMemo(() => normalizeSkills(user?.skills), [user]);

  if (!user || mentorList.length === 0) return null;

  const userSet = new Set(userList.map((s) => s.toLowerCase()));
  const shared = mentorList.filter((s) => userSet.has(s.toLowerCase()));
  const toLearn = mentorList.filter((s) => !userSet.has(s.toLowerCase()));
  const pct = Math.round((shared.length / mentorList.length) * 100);
  const first = mentorName.split(" ")[0] || "this mentor";

  return (
    <section className={`${CARD} p-4 sm:p-5`} style={{ borderColor: COLORS.hairline }} aria-label="How you match">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4" style={{ color: COLORS.accent }} />
        <h3 className="text-sm font-bold" style={{ color: COLORS.ink }}>
          How you match with {first}
        </h3>
      </div>

      {userList.length === 0 ? (
        <div className="mt-3">
          <p className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>
            Add your skills to your profile and we will show what you have in common with {first}.
          </p>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className={`mt-3 inline-flex items-center gap-1 text-xs font-bold hover:underline rounded ${FOCUS_RING}`}
            style={{ color: COLORS.accent }}
          >
            Add skills
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: COLORS.chip }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Skill overlap"
            >
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS.ink }} />
            </div>
            <span className="text-xs font-bold tabular-nums" style={{ color: COLORS.ink }}>
              {pct}% overlap
            </span>
          </div>

          {shared.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold mb-1.5" style={{ color: COLORS.muted }}>
                You both know
              </p>
              <div className="flex flex-wrap gap-1.5">
                {shared.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {toLearn.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold mb-1.5" style={{ color: COLORS.muted }}>
                You could learn from {first}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {toLearn.slice(0, 6).map((s) => (
                  <span
                    key={s}
                    className="text-[11px] font-semibold px-2 py-1 rounded-full"
                    style={{ backgroundColor: COLORS.chip, color: COLORS.accent, border: `1px solid ${COLORS.hairline}` }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ── 3. Share profile (WhatsApp first) ────────────────────────────────────────

export function ShareProfileCard({
  mentorName,
  skills,
}: {
  mentorName: string;
  skills: unknown;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  // Share the clean profile link, never ?book=true or other query params
  const getUrl = () => `${window.location.origin}${window.location.pathname}`;
  const topSkills = normalizeSkills(skills).slice(0, 2).join(" and ");
  const message = `${mentorName} is a mentor on Throne8${topSkills ? ` for ${topSkills}` : ""}. Take a look:`;

  const shareWhatsApp = () => {
    const text = `${message} ${getUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
    } catch {
      window.prompt("Copy this link", getUrl());
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: `${mentorName} on Throne8`, text: message, url: getUrl() });
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <section className={`${CARD} p-4 sm:p-5`} style={{ borderColor: COLORS.hairline }} aria-label="Share this mentor">
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4" style={{ color: COLORS.accent }} />
        <h3 className="text-sm font-bold" style={{ color: COLORS.ink }}>
          Know someone who needs this?
        </h3>
      </div>
      <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
        Send {mentorName.split(" ")[0] || "this mentor"}’s profile to a friend or your college group.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={shareWhatsApp}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold text-white bg-[#1f8f4e] hover:bg-[#187a42] transition-colors ${FOCUS_RING}`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={copyLink}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-white border transition-colors hover:bg-[#fbf7f3] hover:border-[#c9baa9] ${FOCUS_RING}`}
          style={{ color: COLORS.ink, borderColor: COLORS.hairline }}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Link2 className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </button>
        {canNativeShare && (
          <button
            type="button"
            onClick={nativeShare}
            className={`col-span-2 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-white border transition-colors hover:bg-[#fbf7f3] ${FOCUS_RING}`}
            style={{ color: COLORS.accent, borderColor: COLORS.hairline }}
          >
            More ways to share
          </button>
        )}
      </div>
    </section>
  );
}

// ── 4. Sticky book bar (mobile only) ─────────────────────────────────────────

export function StickyBookBar({
  sessions,
  targetId,
}: {
  sessions: any[];
  targetId: string;
}) {
  const [servicesVisible, setServicesVisible] = useState(false);

  // Hide the bar while the services list is already on screen
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setServicesVisible(entry.isIntersecting), {
      threshold: 0.15,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [targetId]);

  const bookable = bookableSessions(sessions);
  if (bookable.length === 0 || servicesVisible) return null;

  const prices = bookable
    .map((s) => s?.pricing?.basePrice)
    .filter((p): p is number => typeof p === "number");
  const min = prices.length ? Math.min(...prices) : null;

  const scrollToServices = () => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-[2500] px-3 pt-2 border-t bg-[#fdfaf6]/95 backdrop-blur"
      style={{
        borderColor: COLORS.hairline,
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center justify-between gap-3 max-w-[1400px] mx-auto">
        <div className="min-w-0">
          <p className="text-[11px]" style={{ color: COLORS.muted }}>
            {min === 0 ? "Sessions from" : "Sessions start at"}
          </p>
          <p className="text-base font-bold tabular-nums" style={{ color: COLORS.ink }}>
            {min === null ? "See options" : min === 0 ? "Free" : `₹${min}`}
          </p>
        </div>
        <button
          type="button"
          onClick={scrollToServices}
          className={`inline-flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 ${FOCUS_RING}`}
          style={{ backgroundColor: COLORS.ink }}
        >
          Book a session
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}