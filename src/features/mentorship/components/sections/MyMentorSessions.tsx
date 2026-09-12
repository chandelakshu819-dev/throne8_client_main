'use client';

import { useState, useEffect, useCallback } from "react";
import SessionService from "@/lib/api/session.service";
import QueryService, { QueryItem } from "@/lib/api/query.service";
import WriteReviewModal from "@/features/mentorship/components/WriteReviewModal";

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
    bg: "#f6ede8",
    card: "#fbf7f3",
    primary: "#4a3728",
    secondary: "#7a5c3e",
    muted: "#8a7a6a",
    border: "#e0d8cf",
    btn: "#4a3728",
    track: "#d8cec4",
    accent: "#c9a87c",
    success: "#6b8f6e",
    warn: "#c97c4a",
} as const;

// ─── Session types (assumed shape — confirm against real API response) ────────
interface SessionMentorInfo {
    firstName?: string;
    lastName?: string;
    profilePhotoId?: string | null;
}

interface MenteeSession {
    sessionId: string;
    mentorId: string;
    title: string;
    scheduledAt: string;
    duration: number;
    status: string;
    mentor?: SessionMentorInfo;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ToastProps {
    msg: string;
    visible: boolean;
}

interface ReminderModalProps {
    sessionName: string;
    onClose: () => void;
    onSave: (time: string) => void;
}

interface StatCardProps {
    num: string;
    label: string;
}

interface OneOnOneTabProps {
    onReminder: (sessionName: string, onSave: () => void) => void;
    toast: (msg: string) => void;
}

interface QueriesTabProps {
    toast: (msg: string) => void;
}

interface ResourcesTabProps {
    toast: (msg: string) => void;
}

interface ModalState {
    open: boolean;
    session: string;
    onSave: (() => void) | null;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, visible }: ToastProps) {
    return (
        <div
            style={{
                background: C.primary,
                transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                transform: visible ? "translateY(0)" : "translateY(80px)",
                opacity: visible ? 1 : 0,
            }}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-white text-sm font-medium shadow-2xl"
        >
            {msg}
        </div>
    );
}

// ─── Reminder Modal ───────────────────────────────────────────────────────────
function ReminderModal({ sessionName, onClose, onSave }: ReminderModalProps) {
    const [selected, setSelected] = useState<string>("15 min pehle");
    const [notif, setNotif] = useState<string>("App Notification");
    const [note, setNote] = useState<string>("");

    const chips: string[] = ["15 min pehle", "30 min pehle", "1 ghanta pehle", "1 din pehle"];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(74,55,40,0.38)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
                style={{ background: C.card }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2
                        className="text-xl font-bold"
                        style={{ color: C.primary, fontFamily: "Georgia, serif" }}
                    >
                        Set Reminder
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm transition-colors hover:opacity-70"
                        style={{ borderColor: C.border, color: C.muted }}
                    >
                        X
                    </button>
                </div>

                <div className="mb-4">
                    <label
                        className="block text-xs font-semibold mb-1.5"
                        style={{ color: C.secondary }}
                    >
                        Session
                    </label>
                    <input
                        readOnly
                        value={sessionName}
                        className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none"
                        style={{ background: C.bg, borderColor: C.border, color: C.primary }}
                    />
                </div>

                <div className="mb-4">
                    <label
                        className="block text-xs font-semibold mb-1.5"
                        style={{ color: C.secondary }}
                    >
                        Reminder ka time
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {chips.map((c) => (
                            <button
                                key={c}
                                onClick={() => setSelected(c)}
                                className="rounded-lg py-2 text-xs font-medium border transition-all"
                                style={{
                                    borderColor: selected === c ? C.secondary : C.border,
                                    background: selected === c ? "rgba(122,92,62,0.09)" : "transparent",
                                    color: selected === c ? C.primary : C.muted,
                                }}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <label
                        className="block text-xs font-semibold mb-1.5"
                        style={{ color: C.secondary }}
                    >
                        Notification ka tarika
                    </label>
                    <select
                        value={notif}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNotif(e.target.value)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none"
                        style={{ background: C.bg, borderColor: C.border, color: C.primary }}
                    >
                        <option>App Notification</option>
                        <option>Email</option>
                        <option>SMS + App</option>
                    </select>
                </div>

                <div className="mb-6">
                    <label
                        className="block text-xs font-semibold mb-1.5"
                        style={{ color: C.secondary }}
                    >
                        Notes (optional)
                    </label>
                    <input
                        value={note}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNote(e.target.value)}
                        placeholder="Session ke liye kuch prepare karna hai?"
                        className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none"
                        style={{ background: C.bg, borderColor: C.border, color: C.primary }}
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
                        style={{ borderColor: C.border, color: C.secondary }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(selected)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: C.btn }}
                    >
                        Save Karein
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatCard({ num, label }: StatCardProps) {
    return (
        <div
            className="rounded-2xl border p-4 text-center"
            style={{ background: C.card, borderColor: C.border }}
        >
            <div
                className="text-3xl font-bold mb-1"
                style={{ color: C.primary, fontFamily: "Georgia, serif" }}
            >
                {num}
            </div>
            <div className="text-xs" style={{ color: C.muted }}>
                {label}
            </div>
        </div>
    );
}

// ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({
    children,
    inline,
}: {
    children: React.ReactNode;
    inline?: boolean;
}) {
    if (inline) {
        return (
            <h3
                className="text-lg font-bold"
                style={{ color: C.primary, fontFamily: "Georgia, serif" }}
            >
                {children}
            </h3>
        );
    }
    return (
        <div className="flex items-center gap-3 mb-4">
            <h3
                className="text-lg font-bold whitespace-nowrap"
                style={{ color: C.primary, fontFamily: "Georgia, serif" }}
            >
                {children}
            </h3>
            <div className="flex-1 h-px" style={{ background: C.border }} />
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatSessionDate(iso: string): string {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return iso;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
        ", " +
        date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function mentorDisplayName(mentor?: SessionMentorInfo): string {
    if (!mentor) return "Mentor";
    const name = `${mentor.firstName ?? ""} ${mentor.lastName ?? ""}`.trim();
    return name || "Mentor";
}

// ─── ONE-ON-ONE TAB (real data) ────────────────────────────────────────────────
function OneOnOneTab({ onReminder, toast }: OneOnOneTabProps) {
    const [upcoming, setUpcoming] = useState<MenteeSession[]>([]);
    const [completed, setCompleted] = useState<MenteeSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reviewTarget, setReviewTarget] = useState<MenteeSession | null>(null);
    const [reviewedIds, setReviewedIds] = useState<Record<string, boolean>>({});
    const [remindersSet, setRemindersSet] = useState<Record<string, boolean>>({});

    const loadSessions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [upcomingRes, completedRes] = await Promise.all([
                SessionService.getUpcomingSessions({ role: "mentee", limit: 10 }),
                SessionService.getAllSessions({ role: "mentee", status: "completed", limit: 10 }),
            ]);
            setUpcoming((upcomingRes?.data ?? []) as MenteeSession[]);
            setCompleted((completedRes?.data ?? []) as MenteeSession[]);
        } catch (e: any) {
            setError(e?.message || "Sessions load nahi ho paaye.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const handleReviewSuccess = () => {
        if (reviewTarget) {
            setReviewedIds((prev) => ({ ...prev, [reviewTarget.sessionId]: true }));
        }
        toast("Review submit ho gayi.");
    };

    if (loading) {
        return (
            <div className="py-16 text-center text-sm" style={{ color: C.muted }}>
                Sessions load ho rahe hain...
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-16 text-center text-sm" style={{ color: C.warn }}>
                {error}
            </div>
        );
    }

    return (
        <div>
            {/* Upcoming Timeline */}
            <SectionTitle>Upcoming Sessions</SectionTitle>
            {upcoming.length === 0 ? (
                <p className="text-sm mb-8" style={{ color: C.muted }}>
                    Koi upcoming session nahi hai.
                </p>
            ) : (
                <div className="flex flex-col gap-0 mb-8">
                    {upcoming.map((s, i) => {
                        const isSet = remindersSet[s.sessionId];
                        return (
                            <div key={s.sessionId} className="flex gap-4">
                                <div className="flex flex-col items-center w-10 flex-shrink-0">
                                    <div
                                        className="w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0 z-10"
                                        style={{
                                            background: C.warn,
                                            boxShadow: `0 0 0 3px rgba(201,124,74,0.2)`,
                                        }}
                                    />
                                    {i < upcoming.length - 1 && (
                                        <div
                                            className="flex-1 w-0.5 my-1"
                                            style={{ background: C.border }}
                                        />
                                    )}
                                </div>
                                <div
                                    className="flex-1 rounded-xl border p-4 mb-4 flex items-center justify-between gap-4 transition-all hover:shadow-md"
                                    style={{ background: C.card, borderColor: C.border }}
                                >
                                    <div>
                                        <div
                                            className="text-sm font-semibold mb-1"
                                            style={{ color: C.primary }}
                                        >
                                            {s.title}
                                        </div>
                                        <div className="text-xs" style={{ color: C.muted }}>
                                            {formatSessionDate(s.scheduledAt)} - {s.duration} min - {mentorDisplayName(s.mentor)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            isSet
                                                ? undefined
                                                : onReminder(s.title, () =>
                                                    setRemindersSet((p) => ({ ...p, [s.sessionId]: true }))
                                                )
                                        }
                                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                                        style={{
                                            borderColor: isSet ? "rgba(107,143,110,0.3)" : C.border,
                                            background: isSet ? "rgba(107,143,110,0.08)" : "transparent",
                                            color: isSet ? C.success : C.secondary,
                                            cursor: isSet ? "default" : "pointer",
                                        }}
                                    >
                                        {isSet ? "Reminder Set" : "Set Reminder"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Completed */}
            <SectionTitle>Completed Sessions</SectionTitle>
            {completed.length === 0 ? (
                <p className="text-sm" style={{ color: C.muted }}>
                    Abhi tak koi session complete nahi hui.
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {completed.map((s) => {
                        const alreadyReviewed = reviewedIds[s.sessionId];
                        return (
                            <div
                                key={s.sessionId}
                                className="rounded-2xl border p-5 transition-all hover:shadow-lg"
                                style={{ background: C.card, borderColor: C.border }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold"
                                        style={{ background: "rgba(74,55,40,0.09)", color: C.secondary }}
                                    >
                                        {mentorDisplayName(s.mentor).charAt(0).toUpperCase()}
                                    </div>
                                    <span
                                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                                        style={{ background: "rgba(74,55,40,0.08)", color: C.secondary }}
                                    >
                                        Completed
                                    </span>
                                </div>
                                <div
                                    className="text-base font-bold mb-1"
                                    style={{ color: C.primary, fontFamily: "Georgia, serif" }}
                                >
                                    {s.title}
                                </div>
                                <div className="text-xs mb-4" style={{ color: C.muted }}>
                                    {mentorDisplayName(s.mentor)} - {formatSessionDate(s.scheduledAt)}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => !alreadyReviewed && setReviewTarget(s)}
                                        disabled={alreadyReviewed}
                                        className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                                        style={{
                                            background: alreadyReviewed ? "rgba(107,143,110,0.12)" : C.btn,
                                            color: alreadyReviewed ? C.success : "#fff",
                                            cursor: alreadyReviewed ? "default" : "pointer",
                                            opacity: alreadyReviewed ? 1 : undefined,
                                        }}
                                    >
                                        {alreadyReviewed ? "Reviewed" : "Write a Review"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {reviewTarget && (
                <WriteReviewModal
                    sessionId={reviewTarget.sessionId}
                    mentorId={reviewTarget.mentorId}
                    mentorName={mentorDisplayName(reviewTarget.mentor)}
                    onClose={() => setReviewTarget(null)}
                    onSuccess={handleReviewSuccess}
                />
            )}
        </div>
    );
}

// ─── QUERIES TAB (real data) ────────────────────────────────────────────────────
function QueriesTab({ toast }: QueriesTabProps) {
    const [queries, setQueries] = useState<QueryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [followUpOpenId, setFollowUpOpenId] = useState<string | null>(null);
    const [followUpText, setFollowUpText] = useState("");
    const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

    const loadQueries = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await QueryService.getAllQueries({ role: "mentee", limit: 20 });
            setQueries(res.data ?? []);
        } catch (e: any) {
            setError(e?.message || "Queries load nahi ho payi.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadQueries();
    }, [loadQueries]);

    const handleFollowUpSubmit = async (queryId: string) => {
        if (followUpText.trim().length === 0) return;
        setSubmittingFollowUp(true);
        try {
            const res = await QueryService.submitFollowUp(queryId, followUpText.trim());
            setQueries((prev) => prev.map((q) => (q.queryId === queryId ? res.data : q)));
            setFollowUpOpenId(null);
            setFollowUpText("");
            toast("Follow-up bhej diya gaya.");
        } catch (e: any) {
            toast(e?.message || "Follow-up submit nahi ho paya.");
        } finally {
            setSubmittingFollowUp(false);
        }
    };

    const mentorName = (q: QueryItem) => {
        const name = `${q.mentor?.firstName ?? ""} ${q.mentor?.lastName ?? ""}`.trim();
        return name || "Mentor";
    };

    const timeAgo = (dateStr: string) => {
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const hrs = Math.floor(diffMs / 3600000);
        if (hrs < 1) return "abhi";
        if (hrs < 24) return `${hrs} ghante pehle`;
        const days = Math.floor(hrs / 24);
        return `${days} din pehle`;
    };

    if (loading) {
        return (
            <div className="py-16 text-center text-sm" style={{ color: C.muted }}>
                Queries load ho rahi hain...
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-16 text-center text-sm" style={{ color: C.warn }}>
                {error}
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <SectionTitle inline>Aapki Queries</SectionTitle>
                <button
                    onClick={() => toast("Query bhejne ke liye mentor profile se Query service select karo.")}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: C.btn }}
                >
                    + Nayi Query
                </button>
            </div>

            {queries.length === 0 ? (
                <p className="text-sm" style={{ color: C.muted }}>
                    Abhi tak koi query nahi bheji.
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {queries.map((q) => (
                        <div
                            key={q.queryId}
                            className="rounded-2xl border p-5 flex gap-4 transition-all hover:shadow-md"
                            style={{ background: C.card, borderColor: C.border }}
                        >
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                style={{
                                    background: `linear-gradient(135deg, ${C.secondary}, ${C.accent})`,
                                }}
                            >
                                {mentorName(q).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-semibold" style={{ color: C.primary }}>
                                        {mentorName(q)}
                                    </span>
                                    <span className="text-xs" style={{ color: C.muted }}>
                                        {timeAgo(q.createdAt)}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed mb-2" style={{ color: C.secondary }}>
                                    {q.question}
                                </p>

                                {q.answer && (
                                    <div
                                        className="rounded-xl p-3 mb-3"
                                        style={{ background: C.bg, border: `1px solid ${C.border}` }}
                                    >
                                        <p className="text-xs font-semibold mb-1" style={{ color: C.success }}>
                                            Mentor ka jawab
                                        </p>
                                        <p className="text-sm" style={{ color: C.primary }}>
                                            {q.answer}
                                        </p>
                                    </div>
                                )}

                                {q.followUp?.question && (
                                    <div
                                        className="rounded-xl p-3 mb-3"
                                        style={{ background: "rgba(74,55,40,0.04)", border: `1px solid ${C.border}` }}
                                    >
                                        <p className="text-xs font-semibold mb-1" style={{ color: C.secondary }}>
                                            Aapka follow-up
                                        </p>
                                        <p className="text-sm mb-2" style={{ color: C.primary }}>
                                            {q.followUp.question}
                                        </p>
                                        {q.followUp.answer && (
                                            <>
                                                <p className="text-xs font-semibold mb-1" style={{ color: C.success }}>
                                                    Mentor ka jawab
                                                </p>
                                                <p className="text-sm" style={{ color: C.primary }}>
                                                    {q.followUp.answer}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}

                                {followUpOpenId === q.queryId && (
                                    <div className="mb-3">
                                        <textarea
                                            value={followUpText}
                                            onChange={(e) => setFollowUpText(e.target.value)}
                                            placeholder="Apna follow-up sawaal likho..."
                                            rows={2}
                                            className="w-full rounded-xl px-3 py-2 text-sm border outline-none mb-2"
                                            style={{ background: C.bg, borderColor: C.border, color: C.primary }}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleFollowUpSubmit(q.queryId)}
                                                disabled={submittingFollowUp || followUpText.trim().length === 0}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                                                style={{ background: C.btn, opacity: submittingFollowUp ? 0.6 : 1 }}
                                            >
                                                {submittingFollowUp ? "Bhej rahe hain..." : "Bhejo"}
                                            </button>
                                            <button
                                                onClick={() => { setFollowUpOpenId(null); setFollowUpText(""); }}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                                                style={{ borderColor: C.border, color: C.secondary }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 flex-wrap">
                                    {q.category && (
                                        <span
                                            className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                                            style={{ background: "rgba(74,55,40,0.07)", color: C.secondary }}
                                        >
                                            {q.category}
                                        </span>
                                    )}

                                    {q.status === "answered" && (
                                        <span
                                            className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                                            style={{ background: "rgba(107,143,110,0.12)", color: C.success }}
                                        >
                                            Answered
                                        </span>
                                    )}
                                    {q.status === "pending" && (
                                        <span
                                            className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                                            style={{ background: "rgba(201,124,74,0.12)", color: C.warn }}
                                        >
                                            Pending
                                        </span>
                                    )}
                                    {q.status === "expired" && (
                                        <span
                                            className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                                            style={{ background: "rgba(0,0,0,0.06)", color: C.muted }}
                                        >
                                            Expired
                                        </span>
                                    )}

                                    {q.status === "answered" && !q.followUp?.askedAt && followUpOpenId !== q.queryId && (
                                        <button
                                            onClick={() => { setFollowUpOpenId(q.queryId); setFollowUpText(""); }}
                                            className="text-xs px-3 py-1 rounded-lg border font-medium transition-all hover:opacity-80 ml-1"
                                            style={{ borderColor: C.border, color: C.secondary }}
                                        >
                                            Follow-up
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── RESOURCES TAB (still mock — separate task) ────────────────────────────────
interface Resource {
    type: string;
    name: string;
    meta: string;
    btn: string;
    action: string;
}

function ResourcesTab({ toast }: ResourcesTabProps) {
    const resources: Resource[] = [
        { type: "PDF", name: "DSA Cheat Sheet - Top 100 Problems", meta: "2.4 MB - Rahul Sharma", btn: "Download", action: "Download ho raha hai..." },
        { type: "VIDEO", name: "System Design Interview - Complete Guide", meta: "45 min - Priya Gupta", btn: "Play", action: "Video play ho rahi hai..." },
        { type: "SHEET", name: "6-Month Study Plan - Software Engineering", meta: "180 KB - Amit Verma", btn: "Download", action: "Download ho raha hai..." },
        { type: "LINK", name: "LeetCode Top 150 Interview Questions List", meta: "External - Rahul Sharma", btn: "Open", action: "Link khul raha hai..." },
        { type: "NOTES", name: "Resume Writing Tips - ATS Friendly Format", meta: "32 KB - Amit Verma", btn: "Download", action: "Download ho raha hai..." },
        { type: "RECORDING", name: "Mock Interview Session Recording - March 22", meta: "28 min - Priya Gupta", btn: "Play", action: "Recording play ho rahi hai..." },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <SectionTitle inline>Shared Resources</SectionTitle>
                <button
                    onClick={() => toast("File upload ho raha hai...")}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: C.btn }}
                >
                    + Upload
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((r) => (
                    <div
                        key={r.name}
                        className="rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
                        style={{ background: C.card, borderColor: C.border }}
                    >
                        <div
                            className="text-xs font-bold tracking-wider mb-1"
                            style={{ color: C.muted }}
                        >
                            {r.type}
                        </div>
                        <div
                            className="text-sm font-semibold mb-4 leading-snug"
                            style={{ color: C.primary }}
                        >
                            {r.name}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs" style={{ color: C.muted }}>
                                {r.meta}
                            </span>
                            <button
                                onClick={() => toast(r.action)}
                                className="px-3 py-1.5 rounded-lg text-white flex items-center justify-center text-xs font-medium transition-all hover:opacity-90"
                                style={{ background: C.primary }}
                            >
                                {r.btn}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── HISTORY TAB (still mock — separate task) ──────────────────────────────────
interface SessionHistory {
    name: string;
    date: string;
    stars: number;
}

function HistoryTab() {
    const sessions: SessionHistory[] = [
        { name: "Career Goals Planning", date: "28 March 2026 - Rahul Sharma - 45 min", stars: 5 },
        { name: "DSA Mock Interview - Round 1", date: "21 March 2026 - Priya Gupta - 60 min", stars: 4 },
        { name: "Resume Review & Feedback", date: "15 March 2026 - Amit Verma - 30 min", stars: 5 },
        { name: "System Design Basics", date: "8 March 2026 - Priya Gupta - 45 min", stars: 4 },
        { name: "Intro Session - Goals Discussion", date: "1 March 2026 - Rahul Sharma - 30 min", stars: 5 },
        { name: "LinkedIn Profile Optimization", date: "22 Feb 2026 - Amit Verma - 30 min", stars: 4 },
        { name: "Behavioral Interview Prep", date: "14 Feb 2026 - Priya Gupta - 45 min", stars: 5 },
        { name: "OOP Concepts Deep Dive", date: "5 Feb 2026 - Rahul Sharma - 60 min", stars: 4 },
    ];

    return (
        <div>
            <SectionTitle>Completed Sessions</SectionTitle>
            <div className="flex flex-col gap-3">
                {sessions.map((s) => (
                    <div
                        key={s.name}
                        className="rounded-xl border p-4 flex items-center gap-4 transition-all hover:shadow-md hover:translate-x-1"
                        style={{ background: C.card, borderColor: C.border }}
                    >
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                                background: "rgba(107,143,110,0.12)",
                                color: C.success,
                                fontSize: "1rem",
                            }}
                        >
                            OK
                        </div>
                        <div className="flex-1">
                            <div
                                className="text-sm font-semibold mb-0.5"
                                style={{ color: C.primary }}
                            >
                                {s.name}
                            </div>
                            <div className="text-xs" style={{ color: C.muted }}>
                                {s.date}
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="text-sm mb-0.5" style={{ color: C.accent }}>
                                {"*".repeat(s.stars)}
                                {"-".repeat(5 - s.stars)}
                            </div>
                            <div className="text-xs" style={{ color: C.success }}>
                                Completed
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Tab Definition ───────────────────────────────────────────────────────────
type TabId = "one-on-one" | "queries" | "resources" | "history";

interface Tab {
    id: TabId;
    label: string;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function MentorDashboard() {
    const [activeTab, setActiveTab] = useState<TabId>("one-on-one");
    const [modal, setModal] = useState<ModalState>({
        open: false,
        session: "",
        onSave: null,
    });
    const [toastMsg, setToastMsg] = useState<string>("");
    const [toastVisible, setToastVisible] = useState<boolean>(false);

    const showToast = (msg: string): void => {
        setToastMsg(msg);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
    };

    const openReminder = (sessionName: string, onSave: () => void): void => {
        setModal({ open: true, session: sessionName, onSave });
    };

    const handleSaveReminder = (): void => {
        modal.onSave?.();
        setModal({ open: false, session: "", onSave: null });
        showToast("Reminder set ho gaya! Aapko samay par notification milegi.");
    };

    const tabs: Tab[] = [
        { id: "one-on-one", label: "1:1 Session" },
        { id: "queries", label: "Queries" },
        { id: "resources", label: "Resources" },
        { id: "history", label: "History" },
    ];

    return (
        <div
            className="min-h-screen"
            style={{ background: C.bg, fontFamily: "'DM Sans', sans-serif" }}
        >
            <header
                className="sticky top-0 z-40 flex items-center justify-between px-6 h-16 border-b shadow-sm"
                style={{ background: C.card, borderColor: C.border }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold"
                        style={{ background: C.primary, color: C.bg }}
                    >
                        M
                    </div>
                    <span
                        className="text-xl font-bold"
                        style={{ color: C.primary, fontFamily: "Georgia, serif" }}
                    >
                        MentorSpace
                    </span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-16">
                <div className="mb-6">
                    <h1
                        className="text-3xl font-bold mb-1"
                        style={{ color: C.primary, fontFamily: "Georgia, serif" }}
                    >
                        Mentor Sessions
                    </h1>
                    <p className="text-sm font-light" style={{ color: C.muted }}>
                        Apne saare mentor sessions ek jagah manage karein - queries, resources, aur history.
                    </p>
                </div>

                <div
                    className="flex flex-wrap gap-1 p-1.5 rounded-xl border mb-6 w-fit"
                    style={{ background: C.card, borderColor: C.border }}
                >
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                                background: activeTab === t.id ? C.primary : "transparent",
                                color: activeTab === t.id ? "white" : C.muted,
                                boxShadow:
                                    activeTab === t.id ? "0 2px 8px rgba(74,55,40,0.25)" : "none",
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {activeTab === "one-on-one" && <OneOnOneTab onReminder={openReminder} toast={showToast} />}
                {activeTab === "queries" && <QueriesTab toast={showToast} />}
                {activeTab === "resources" && <ResourcesTab toast={showToast} />}
                {activeTab === "history" && <HistoryTab />}
            </main>

            {modal.open && (
                <ReminderModal
                    sessionName={modal.session}
                    onClose={() => setModal({ open: false, session: "", onSave: null })}
                    onSave={handleSaveReminder}
                />
            )}

            <Toast msg={toastMsg} visible={toastVisible} />
        </div>
    );
}