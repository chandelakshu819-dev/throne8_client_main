
// src/app/mentorship/mentor-session/page.tsx
'use client';

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLiveRoom, RemotePeer } from "@/core/webrtc/useLiveRoom";
import SessionService from "@/lib/api/session.service";
import { useAuth } from "@/features/auth/hooks/useAuth"; // ⚠️ adjust import/shape if different
import {
    ToastProps, ReminderModalProps, StatCardProps, ProgressBarProps,
    OneOnOneTabProps, QueriesTabProps, ResourcesTabProps,
    UpcomingSession, ModalState, Tab, SessionHistory, Resource, Query, BookableSession,
} from "@/features/mentorship/interface";
import { TabId } from "@/features/mentorship/types";

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
                    <h2 className="text-xl font-bold" style={{ color: C.primary, fontFamily: "Georgia, serif" }}>
                        🔔 Reminder Set Karein
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm transition-colors hover:opacity-70"
                        style={{ borderColor: C.border, color: C.muted }}
                    >
                        ✕
                    </button>
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.secondary }}>
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
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.secondary }}>
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
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.secondary }}>
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
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.secondary }}>
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
                        ✓ Save Karein
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatCard({ num, label }: StatCardProps) {
    return (
        <div className="rounded-2xl border p-4 text-center" style={{ background: C.card, borderColor: C.border }}>
            <div className="text-3xl font-bold mb-1" style={{ color: C.primary, fontFamily: "Georgia, serif" }}>
                {num}
            </div>
            <div className="text-xs" style={{ color: C.muted }}>{label}</div>
        </div>
    );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, label }: ProgressBarProps) {
    const [width, setWidth] = useState<number>(0);
    useEffect(() => {
        const timer = setTimeout(() => setWidth(value), 400);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: C.muted }}>
                <span>{label}</span>
                <span>{value}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: C.track }}>
                <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${width}%`, background: `linear-gradient(90deg, ${C.secondary}, ${C.accent})` }}
                />
            </div>
        </div>
    );
}

// ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({ children, inline }: { children: React.ReactNode; inline?: boolean }) {
    if (inline) {
        return (
            <h3 className="text-lg font-bold" style={{ color: C.primary, fontFamily: "Georgia, serif" }}>
                {children}
            </h3>
        );
    }
    return (
        <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-bold whitespace-nowrap" style={{ color: C.primary, fontFamily: "Georgia, serif" }}>
                {children}
            </h3>
            <div className="flex-1 h-px" style={{ background: C.border }} />
        </div>
    );
}

// ─── VIDEO TILE ───────────────────────────────────────────────────────────────
function VideoTile({
    stream,
    label,
    muted,
    isLocal,
}: {
    stream: MediaStream | null;
    label: string;
    muted?: boolean;
    isLocal?: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video" style={{ minHeight: 180 }}>
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className="w-full h-full object-cover"
                    style={{ transform: isLocal ? "scaleX(-1)" : undefined }}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: C.primary }}>
                    <span className="text-white text-sm">{label} — camera off</span>
                </div>
            )}
            <div
                className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-xs font-medium text-white"
                style={{ background: "rgba(0,0,0,0.5)" }}
            >
                {label}
            </div>
        </div>
    );
}

// ─── VIDEO CALL SECTION ───────────────────────────────────────────────────────
function VideoCallSection({
    roomId,
    userId,
    userName,
    onEndSession,
    ending,
}: {
    roomId: string;
    userId: string;
    userName?: string;
    onEndSession: () => void;
    ending: boolean;
}) {
    const {
        localStream,
        peers,
        isCameraOn,
        isMicOn,
        isConnecting,
        error,
        joinRoom,
        leaveRoom,
        toggleCamera,
        toggleMic,
    } = useLiveRoom({ roomId, userId, userName });

    const joinedRef = useRef(false);

    useEffect(() => {
        if (!roomId || joinedRef.current) return;
        joinedRef.current = true;
        joinRoom(true, true);

        return () => {
            leaveRoom();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // 1:1 mentorship session — at most one remote peer expected
    const remotePeer: RemotePeer | undefined = peers[0];

    return (
        <div className="rounded-2xl p-4 mb-6 shadow-lg" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            {error && (
                <div
                    className="mb-3 text-sm rounded-lg px-3 py-2"
                    style={{ background: "rgba(201,124,74,0.12)", color: C.warn }}
                >
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <VideoTile stream={localStream} label={`${userName || "You"} (You)`} muted isLocal />
                {remotePeer ? (
                    <VideoTile stream={remotePeer.stream} label={remotePeer.userName || "Participant"} />
                ) : (
                    <div
                        className="rounded-2xl flex items-center justify-center aspect-video"
                        style={{ background: C.bg, border: `1px dashed ${C.border}`, minHeight: 180 }}
                    >
                        <div className="text-center">
                            <div className="text-2xl mb-2">⏳</div>
                            <div className="text-sm font-medium" style={{ color: C.secondary }}>
                                {isConnecting ? "Connecting..." : "Waiting for the other participant..."}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={toggleMic}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all"
                    style={{ background: isMicOn ? C.primary : C.border, color: isMicOn ? "white" : C.secondary }}
                    title={isMicOn ? "Mute" : "Unmute"}
                >
                    {isMicOn ? "🎤" : "🔇"}
                </button>
                <button
                    onClick={toggleCamera}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all"
                    style={{ background: isCameraOn ? C.primary : C.border, color: isCameraOn ? "white" : C.secondary }}
                    title={isCameraOn ? "Turn camera off" : "Turn camera on"}
                >
                    {isCameraOn ? "📹" : "📵"}
                </button>
                <button
                    onClick={onEndSession}
                    disabled={ending}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all"
                    style={{ background: "#b04a3a", opacity: ending ? 0.6 : 1 }}
                >
                    {ending ? "Ending..." : "🔴 End Session"}
                </button>
            </div>
        </div>
    );
}

// ─── ONE-ON-ONE TAB (unchanged — still mock data) ─────────────────────────────
function OneOnOneTab({ onReminder }: OneOnOneTabProps) {
    const [remindersSet, setRemindersSet] = useState<Record<string, boolean>>({ r2: false, r3: false });

    const upcoming: UpcomingSession[] = [
        { id: "r1", name: "Career Roadmap Discussion", date: "Kal, 4:00 PM • 45 min • Rahul Sharma", set: true },
        { id: "r2", name: "DSA Mock Interview", date: "5 April, 11:00 AM • 60 min • Priya Gupta", set: false },
        { id: "r3", name: "Resume Review", date: "8 April, 3:00 PM • 30 min • Amit Verma", set: false },
    ];

    const bookable: BookableSession[] = [
        { icon: "🎯", name: "Career Growth Session", mentor: "Rahul Sharma", match: 92 },
        { icon: "💻", name: "System Design Prep", mentor: "Priya Gupta", match: 85 },
    ];

    return (
        <div>
            <SectionTitle>Upcoming Sessions</SectionTitle>
            <div className="flex flex-col gap-0 mb-8">
                {upcoming.map((s, i) => {
                    const isSet = s.set || remindersSet[s.id];
                    return (
                        <div key={s.id} className="flex gap-4">
                            <div className="flex flex-col items-center w-10 flex-shrink-0">
                                <div
                                    className="w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0 z-10"
                                    style={{ background: C.warn, boxShadow: `0 0 0 3px rgba(201,124,74,0.2)` }}
                                />
                                {i < upcoming.length - 1 && <div className="flex-1 w-0.5 my-1" style={{ background: C.border }} />}
                            </div>
                            <div
                                className="flex-1 rounded-xl border p-4 mb-4 flex items-center justify-between gap-4 transition-all hover:shadow-md"
                                style={{ background: C.card, borderColor: C.border }}
                            >
                                <div>
                                    <div className="text-sm font-semibold mb-1" style={{ color: C.primary }}>{s.name}</div>
                                    <div className="text-xs" style={{ color: C.muted }}>📅 {s.date}</div>
                                </div>
                                <button
                                    onClick={() =>
                                        isSet ? undefined : onReminder(s.name, () => setRemindersSet((p) => ({ ...p, [s.id]: true })))
                                    }
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                                    style={{
                                        borderColor: isSet ? "rgba(107,143,110,0.3)" : C.border,
                                        background: isSet ? "rgba(107,143,110,0.08)" : "transparent",
                                        color: isSet ? C.success : C.secondary,
                                        cursor: isSet ? "default" : "pointer",
                                    }}
                                >
                                    {isSet ? "✅ Reminder Set" : "🔔 Reminder Set Karein"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <SectionTitle>Completed Session</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {bookable.map((b) => (
                    <div
                        key={b.name}
                        className="rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
                        style={{ background: C.card, borderColor: C.border }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                                style={{ background: "rgba(74,55,40,0.09)" }}
                            >
                                {b.icon}
                            </div>
                            <span
                                className="text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ background: "rgba(74,55,40,0.08)", color: C.secondary }}
                            >
                                Completed
                            </span>
                        </div>
                        <div className="text-base font-bold mb-1" style={{ color: C.primary, fontFamily: "Georgia, serif" }}>
                            {b.name}
                        </div>
                        <div className="text-xs mb-4" style={{ color: C.muted }}>{b.mentor} • Available</div>
                        <ProgressBar value={b.match} label="Profile Match" />
                        <div className="flex gap-2">
                            <button
                                onClick={() => onReminder(b.name, () => {})}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                                style={{ background: C.btn }}
                            >
                                Review
                            </button>
                            <button
                                className="px-4 py-2 rounded-xl border text-xs font-medium transition-all hover:opacity-80"
                                style={{ borderColor: C.border, color: C.secondary }}
                            >
                                Profile
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── QUERIES TAB (unchanged) ───────────────────────────────────────────────────
function QueriesTab({ toast }: QueriesTabProps) {
    const queries: Query[] = [
        {
            initials: "RS", name: "Rahul Sharma", time: "2 ghante pehle",
            text: "DSA mein Dynamic Programming ke saath main bohot struggle kar raha hoon. Kya aap kuch practice problems suggest kar sakte hain jo beginner level se start ho?",
            tags: ["DSA", "Dynamic Programming"], answered: false,
        },
        {
            initials: "PG", name: "Priya Gupta", time: "1 din pehle",
            text: "Mujhe system design interview ki preparation ke liye kahan se start karna chahiye? Koi roadmap denge?",
            tags: ["System Design", "Interview"], answered: false,
        },
        {
            initials: "AV", name: "Amit Verma", time: "3 din pehle",
            text: "Resume mein projects section kaise improve karein? Kya STAR method yahan bhi kaam karta hai?",
            tags: ["Resume"], answered: true,
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <SectionTitle inline>Aapki Queries</SectionTitle>
                <button
                    onClick={() => toast("✏️ New query form khul raha hai...")}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: C.btn }}
                >
                    + Nayi Query
                </button>
            </div>
            <div className="flex flex-col gap-4">
                {queries.map((q) => (
                    <div
                        key={q.name}
                        className="rounded-2xl border p-5 flex gap-4 transition-all hover:shadow-md"
                        style={{ background: C.card, borderColor: C.border }}
                    >
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${C.secondary}, ${C.accent})` }}
                        >
                            {q.initials}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-semibold" style={{ color: C.primary }}>{q.name}</span>
                                <span className="text-xs" style={{ color: C.muted }}>{q.time}</span>
                            </div>
                            <p className="text-sm leading-relaxed mb-3" style={{ color: C.secondary }}>{q.text}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                {q.tags.map((t) => (
                                    <span
                                        key={t}
                                        className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                                        style={{ background: "rgba(74,55,40,0.07)", color: C.secondary }}
                                    >
                                        {t}
                                    </span>
                                ))}
                                {q.answered ? (
                                    <span
                                        className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                                        style={{ background: "rgba(107,143,110,0.12)", color: C.success }}
                                    >
                                        ✅ Answered
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => toast("💬 Reply box khul raha hai...")}
                                        className="text-xs px-3 py-1 rounded-lg border font-medium transition-all hover:opacity-80 ml-1"
                                        style={{ borderColor: C.border, color: C.secondary }}
                                    >
                                        Reply
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── RESOURCES TAB (unchanged) ──────────────────────────────────────────────────
function ResourcesTab({ toast }: ResourcesTabProps) {
    const resources: Resource[] = [
        { icon: "📄", type: "PDF", name: "DSA Cheat Sheet — Top 100 Problems", meta: "2.4 MB • Rahul Sharma", btn: "⬇", action: "⬇️ Download ho raha hai..." },
        { icon: "🎥", type: "VIDEO", name: "System Design Interview — Complete Guide", meta: "45 min • Priya Gupta", btn: "▶", action: "▶️ Video play ho rahi hai..." },
        { icon: "📊", type: "SHEET", name: "6-Month Study Plan — Software Engineering", meta: "180 KB • Amit Verma", btn: "⬇", action: "⬇️ Download ho raha hai..." },
        { icon: "🔗", type: "LINK", name: "LeetCode Top 150 Interview Questions List", meta: "External • Rahul Sharma", btn: "↗", action: "🔗 Link khul raha hai..." },
        { icon: "📝", type: "NOTES", name: "Resume Writing Tips — ATS Friendly Format", meta: "32 KB • Amit Verma", btn: "⬇", action: "⬇️ Download ho raha hai..." },
        { icon: "🎤", type: "RECORDING", name: "Mock Interview Session Recording — March 22", meta: "28 min • Priya Gupta", btn: "▶", action: "▶️ Recording play ho rahi hai..." },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <SectionTitle inline>Shared Resources</SectionTitle>
                <button
                    onClick={() => toast("📎 File upload ho raha hai...")}
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
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: "rgba(74,55,40,0.08)" }}>
                            {r.icon}
                        </div>
                        <div className="text-xs font-bold tracking-wider mb-1" style={{ color: C.muted }}>{r.type}</div>
                        <div className="text-sm font-semibold mb-4 leading-snug" style={{ color: C.primary }}>{r.name}</div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs" style={{ color: C.muted }}>{r.meta}</span>
                            <button
                                onClick={() => toast(r.action)}
                                className="w-8 h-8 rounded-lg text-white flex items-center justify-center text-sm transition-all hover:scale-105 hover:opacity-90"
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

// ─── HISTORY TAB (unchanged) ────────────────────────────────────────────────────
function HistoryTab() {
    const sessions: SessionHistory[] = [
        { name: "Career Goals Planning", date: "28 March 2026 • Rahul Sharma • 45 min", stars: 5 },
        { name: "DSA Mock Interview — Round 1", date: "21 March 2026 • Priya Gupta • 60 min", stars: 4 },
        { name: "Resume Review & Feedback", date: "15 March 2026 • Amit Verma • 30 min", stars: 5 },
        { name: "System Design Basics", date: "8 March 2026 • Priya Gupta • 45 min", stars: 4 },
        { name: "Intro Session — Goals Discussion", date: "1 March 2026 • Rahul Sharma • 30 min", stars: 5 },
        { name: "LinkedIn Profile Optimization", date: "22 Feb 2026 • Amit Verma • 30 min", stars: 4 },
        { name: "Behavioral Interview Prep", date: "14 Feb 2026 • Priya Gupta • 45 min", stars: 5 },
        { name: "OOP Concepts Deep Dive", date: "5 Feb 2026 • Rahul Sharma • 60 min", stars: 4 },
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
                            style={{ background: "rgba(107,143,110,0.12)", color: C.success, fontSize: "1rem" }}
                        >
                            ✓
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-semibold mb-0.5" style={{ color: C.primary }}>{s.name}</div>
                            <div className="text-xs" style={{ color: C.muted }}>📅 {s.date}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="text-sm mb-0.5" style={{ color: C.accent }}>
                                {"★".repeat(s.stars)}
                                {"☆".repeat(5 - s.stars)}
                            </div>
                            <div className="text-xs" style={{ color: C.success }}>Completed</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function MentorDashboard() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();


    // roomId doubles as the bookingId (backend reuses booking._id as the room name)
    const sessionId = searchParams.get("sessionId") || searchParams.get("id") || "";
    const roomId = searchParams.get("roomId") || "";
    const bookingId = searchParams.get("bookingId") || roomId;

    const [activeTab, setActiveTab] = useState<TabId>("one-on-one");
    const [modal, setModal] = useState<ModalState>({ open: false, session: "", onSave: null });
    const [toastMsg, setToastMsg] = useState<string>("");
    const [toastVisible, setToastVisible] = useState<boolean>(false);
    const [endingSession, setEndingSession] = useState<boolean>(false);

    const showToast = (msg: string): void => {
        setToastMsg(msg);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
    };

    const openReminder = (sessionName: string, onSave: () => void): void => {
        setModal({ open: true, session: sessionName, onSave });
    };

    const handleSaveReminder = (time: string): void => {
        modal.onSave?.();
        setModal({ open: false, session: "", onSave: null });
        showToast("✅ Reminder set ho gaya! Aapko samay par notification milegi.");
    };

    const handleEndSession = async (): Promise<void> => {
        if (!sessionId) {
            showToast("⚠️ Session ID missing in URL — cannot end session.");
            return;
        }
        setEndingSession(true);
        try {
            await SessionService.completeSession(sessionId, { bookingId });
            showToast("✅ Session completed!");
            router.push("/mentorship"); // ⚠️ adjust to wherever mentor should land post-session
        } catch (err: any) {
            showToast(`❌ ${err.message || "Failed to end session."}`);
        } finally {
            setEndingSession(false);
        }
    };

    const tabs: Tab[] = [
        { id: "one-on-one", label: "👤 1:1 Session" },
        { id: "queries", label: "❓ Queries" },
        { id: "resources", label: "📚 Resources" },
        { id: "history", label: "📋 History" },
    ];

    return (
        <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
            <header
                className="sticky top-0 z-40 flex items-center justify-between px-6 h-16 border-b shadow-sm"
                style={{ background: C.card, borderColor: C.border }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ background: C.primary, color: C.bg }}>
                        🎓
                    </div>
                    <span className="text-xl font-bold" style={{ color: C.primary, fontFamily: "Georgia, serif" }}>
                        MentorSpace
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => showToast("🔔 2 upcoming sessions this week!")}
                        className="relative w-9 h-9 rounded-full border flex items-center justify-center transition-all hover:opacity-80"
                        style={{ borderColor: C.border, color: C.secondary }}
                    >
                        🔔
                        <span
                            className="absolute top-1 right-1 w-2 h-2 rounded-full border-2"
                            style={{ background: C.warn, borderColor: C.card }}
                        />
                    </button>
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white cursor-pointer"
                        style={{ background: `linear-gradient(135deg, ${C.secondary}, ${C.accent})` }}
                    >
                        RK
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-16">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-1" style={{ color: C.primary, fontFamily: "Georgia, serif" }}>
                        Mentor Session
                    </h1>
                    <p className="text-sm font-light" style={{ color: C.muted }}>
                        Live call, queries, resources aur history — sab ek jagah.
                    </p>
                </div>

                {/* Live video call — replaces the old static "Join Meeting" banner */}
                {authLoading ? (
                    <div className="rounded-2xl p-5 mb-6 text-sm" style={{ background: C.card, color: C.muted }}>
                        Loading session...
                    </div>
                ) : roomId && user?.userId ? (
                    <VideoCallSection
                        roomId={roomId}
                        userId={user.userId}
                        // ⚠️ 'fullName' is a guess — useAuth's type only guarantees
                        // userId/email/role. Check TokenStorage.getUserData() in
                        // devtools (Application → Local/Session storage) to see
                        // what extra fields actually exist, then swap this.
                        userName={(user as any).fullName || user.email}
                        onEndSession={handleEndSession}
                        ending={endingSession}
                    />
                ) : (
                    <div
                        className="rounded-2xl p-5 mb-6 text-sm"
                        style={{ background: "rgba(201,124,74,0.12)", color: C.warn }}
                    >
                        Session/room info missing in the URL — open this page via "Start Session", not directly.
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <StatCard num="12" label="Total Sessions" />
                    <StatCard num="8" label="Completed" />
                    <StatCard num="3" label="Upcoming" />
                    <StatCard num="24h" label="Total Time" />
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
                                boxShadow: activeTab === t.id ? "0 2px 8px rgba(74,55,40,0.25)" : "none",
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {activeTab === "one-on-one" && <OneOnOneTab onReminder={openReminder} />}
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