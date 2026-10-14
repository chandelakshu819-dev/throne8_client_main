
// src/app/mentorship/mentor-session/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLiveRoom, RemotePeer, RoomEndedInfo } from "@/core/webrtc/useLiveRoom";
import { useRingtone } from "@/shared/hooks/useRingtone";
import SessionService from "@/lib/api/session.service";
import QueryService, { QueryItem } from "@/lib/api/query.service";
import { getSocket } from "@/core/realtime/socket.client";
import { useAuth } from "@/features/auth/hooks/useAuth"; // ⚠️ adjust import/shape if different
import {
    ToastProps,
    ModalState, Tab,
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
    isMentor,
    onRoomEnded,
    onLeave,
}: {
    roomId: string;
    userId: string;
    userName?: string;
    onEndSession: () => void;
    ending: boolean;
    isMentor: boolean;
    onRoomEnded: (info: RoomEndedInfo) => void;
    onLeave: () => void;
}) {
    const {
        localStream,
        peers,
        isCameraOn,
        isMicOn,
        isConnecting,
        error,
        roomEnded,
        joinRoom,
        leaveRoom,
        toggleCamera,
        toggleMic,
    } = useLiveRoom({ roomId, userId, userName });

    const [confirmEnd, setConfirmEnd] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    // Call timer
    useEffect(() => {
        const t = setInterval(() => setElapsed((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, []);
    const timerLabel = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;


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

    // Session end (socket se aaya) → parent ko batao, ended screen dikhegi
    useEffect(() => {
        if (roomEnded) onRoomEnded(roomEnded);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomEnded]);

    // Ringback tone: jab tak doosra participant join nahi karta (max 45s)
    const { start: startRing, stop: stopRing } = useRingtone({ volume: 0.5 });
    const waitingForPeer = !!localStream && !remotePeer && !isConnecting && !roomEnded && !error;
    useEffect(() => {
        if (!waitingForPeer) {
            stopRing();
            return;
        }
        startRing('outgoing');
        const t = setTimeout(stopRing, 45000);
        return () => {
            clearTimeout(t);
            stopRing();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [waitingForPeer]);


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

<div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span
                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ background: remotePeer ? C.success : C.warn }}
                        />
                        <span
                            className="relative inline-flex rounded-full h-2.5 w-2.5"
                            style={{ background: remotePeer ? C.success : C.warn }}
                        />
                    </span>
                    <span className="text-xs font-semibold" style={{ color: C.primary }}>
                        {remotePeer ? "LIVE" : "Waiting"}
                    </span>
                </div>
                <span className="text-xs font-mono" style={{ color: C.muted }}>{timerLabel}</span>
            </div>

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
                {isMentor ? (
                    confirmEnd ? (
                        <div
                            className="flex items-center gap-2 rounded-full px-3 py-1.5"
                            style={{ background: "rgba(176,74,58,0.10)" }}
                        >
                            <span className="text-xs font-medium" style={{ color: "#b04a3a" }}>
                                Sabke liye session end karein?
                            </span>
                            <button
                                onClick={() => { setConfirmEnd(false); onEndSession(); }}
                                disabled={ending}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                                style={{ background: "#b04a3a" }}
                            >
                                Haan, End
                            </button>
                            <button
                                onClick={() => setConfirmEnd(false)}
                                className="px-3 py-1.5 rounded-full text-xs font-medium border"
                                style={{ borderColor: C.border, color: C.secondary }}
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmEnd(true)}
                            disabled={ending}
                            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all"
                            style={{ background: "#b04a3a", opacity: ending ? 0.6 : 1 }}
                        >
                            {ending ? "Ending..." : "🔴 End Session"}
                        </button>
                    )
                ) : (
                    <button
                        onClick={() => { leaveRoom(); onLeave(); }}
                        className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all"
                        style={{ background: "#b04a3a" }}
                    >
                        Leave Call
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── ONE-ON-ONE TAB (unchanged — still mock data) ─────────────────────────────
// ─── SESSION ENDED CARD ───────────────────────────────────────────────────────
function SessionEndedCard({
    isMentor,
    endedByMe,
    onBack,
}: {
    isMentor: boolean;
    endedByMe: boolean;
    onBack: () => void;
}) {
    return (
        <div
            className="rounded-2xl p-8 mb-6 text-center shadow-lg"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
            <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl"
                style={{ background: "rgba(107,143,110,0.12)", color: C.success }}
            >
                ✓
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: C.primary, fontFamily: "Georgia, serif" }}>
                Session Ended
            </h2>
            <p className="text-sm mb-6" style={{ color: C.muted }}>
                {endedByMe
                    ? "Aapne session complete kar diya hai."
                    : "Mentor ne session complete kar diya hai. Review dena mat bhoolna!"}
            </p>
            <button
                onClick={onBack}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: C.btn }}
            >
                {isMentor ? "Back to Bookings" : "Back to My Sessions"}
            </button>
        </div>
    );
}

interface SessionListItem {
    _id?: string;
    sessionId?: string;
    title?: string;
    scheduledAt?: string;
    duration?: number;
}

function SessionListTab({ role, past }: { role: "mentor" | "mentee"; past: boolean }) {
    const [sessions, setSessions] = useState<SessionListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSessions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = past
                ? await SessionService.getPastSessions({ role })
                : await SessionService.getUpcomingSessions({ role });
            setSessions(Array.isArray(response.data) ? response.data : []);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load sessions.");
        } finally {
            setLoading(false);
        }
    }, [past, role]);

    useEffect(() => {
        void loadSessions();
    }, [loadSessions]);

    const heading = past ? "Completed Sessions" : "Upcoming Sessions";
    return (
        <div>
            <SectionTitle>{heading}</SectionTitle>
            {loading ? (
                <p className="py-8 text-sm" style={{ color: C.muted }}>Loading sessions...</p>
            ) : error ? (
                <div className="py-8 text-sm" style={{ color: C.warn }}>
                    <p>{error}</p>
                    <button onClick={() => void loadSessions()} className="mt-3 underline">Retry</button>
                </div>
            ) : sessions.length === 0 ? (
                <p className="py-8 text-sm" style={{ color: C.muted }}>
                    {past ? "No completed sessions." : "No upcoming sessions."}
                </p>
            ) : (
                <div className="flex flex-col gap-3">
                    {sessions.map((session, index) => (
                        <article
                            key={session._id || session.sessionId || `${session.scheduledAt || "session"}-${index}`}
                            className="rounded-xl border p-4"
                            style={{ background: C.card, borderColor: C.border }}
                        >
                            {session.title && <div className="text-sm font-semibold" style={{ color: C.primary }}>{session.title}</div>}
                            {session.scheduledAt && (
                                <time className="mt-1 block text-xs" style={{ color: C.muted }} dateTime={session.scheduledAt}>
                                    {new Date(session.scheduledAt).toLocaleString()}
                                </time>
                            )}
                            {typeof session.duration === "number" && (
                                <div className="mt-1 text-xs" style={{ color: C.muted }}>{session.duration} min</div>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

function QueriesTab() {
    const [queries, setQueries] = useState<QueryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadQueries = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await QueryService.getPendingQueries();
            setQueries(Array.isArray(response.data) ? response.data : []);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load queries.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadQueries();
    }, [loadQueries]);

    return (
        <div>
            <SectionTitle inline>Aapki Queries</SectionTitle>
            {loading ? (
                <p className="py-8 text-sm" style={{ color: C.muted }}>Loading queries...</p>
            ) : error ? (
                <div className="py-8 text-sm" style={{ color: C.warn }}>
                    <p>{error}</p>
                    <button onClick={() => void loadQueries()} className="mt-3 underline">Retry</button>
                </div>
            ) : queries.length === 0 ? (
                <p className="py-8 text-sm" style={{ color: C.muted }}>No pending queries.</p>
            ) : (
                <div className="flex flex-col gap-4">
                    {queries.map((query) => (
                        <article key={query.queryId} className="rounded-2xl border p-5" style={{ background: C.card, borderColor: C.border }}>
                            {query.category && <div className="mb-2 text-xs font-semibold" style={{ color: C.muted }}>{query.category}</div>}
                            <p className="text-sm leading-relaxed" style={{ color: C.secondary }}>{query.question}</p>
                            {query.createdAt && (
                                <time className="mt-3 block text-xs" style={{ color: C.muted }} dateTime={query.createdAt}>
                                    {new Date(query.createdAt).toLocaleString()}
                                </time>
                            )}
                        </article>
                    ))}
                </div>
            )}
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
    // Mentor "Start Session" se aata hai ?role=mentor ke saath. (Server phir bhi enforce karta hai.)
    const isMentor = searchParams.get("role") === "mentor";


    const [activeTab, setActiveTab] = useState<TabId>("one-on-one");
    const [toastMsg, setToastMsg] = useState<string>("");
    const [toastVisible, setToastVisible] = useState<boolean>(false);
    const [endingSession, setEndingSession] = useState<boolean>(false);
    const [sessionEndedInfo, setSessionEndedInfo] = useState<RoomEndedInfo | null>(null);


    const showToast = (msg: string): void => {
        setToastMsg(msg);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
    };

    // ✅ NEW: mentor/mentee jab is room me join kare, to doosre party ko
    // real-time "peer joined" signal + persistent notification bheja jaye.
    // Backend socket handler (`mentorshipHandler.ts`) already isko sunn
    // raha hai — bas frontend se emit karna baaki tha.
    useEffect(() => {
        if (!sessionId || !user?.userId) return;
        const socket = getSocket();
        socket?.emit('mentorship:notify-join', { sessionId });
    }, [sessionId, user?.userId]);

    
    const goBack = (): void => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push("/mentorship"); // ⚠️ fallback route apne hisaab se badlo
    };

    const handleEndSession = async (): Promise<void> => {
                if (!sessionId) {
            showToast("⚠️ Session ID missing in URL — cannot end session.");
            return;
        }
        setEndingSession(true);
        try {
            await SessionService.completeSession(sessionId, { bookingId, wasSuccessful: true });
            showToast("✅ Session completed!");
            // Turant push nahi — ended screen dikhao, mentor "Back" khud dabayega
            setSessionEndedInfo({
                sessionId,
                bookingId,
                endedBy: user?.userId,
                endedAt: new Date().toISOString(),
            });

        } catch (err: any) {
            showToast(`❌ ${err.message || "Failed to end session."}`);
        } finally {
            setEndingSession(false);
        }
    };

    const tabs: Tab[] = [
        { id: "one-on-one", label: "Upcoming Sessions" },
        { id: "queries", label: "❓ Queries" },
        { id: "history", label: "📋 History" },
    ];
    const userInitials = `${typeof user?.firstName === "string" ? user.firstName[0] || "" : ""}${typeof user?.lastName === "string" ? user.lastName[0] || "" : ""}`.toUpperCase();
    const userDisplayName = [user?.firstName, user?.lastName]
        .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
        .join(" ");

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
                    {userInitials && (
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white cursor-pointer"
                        style={{ background: `linear-gradient(135deg, ${C.secondary}, ${C.accent})` }}
                        aria-label={userDisplayName || undefined}
                    >
                        {userInitials}
                    </div>
                    )}
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-16">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-1" style={{ color: C.primary, fontFamily: "Georgia, serif" }}>
                        Mentor Session
                    </h1>
                    <p className="text-sm font-light" style={{ color: C.muted }}>
                        Live call and your session activity.
                    </p>
                </div>

                {/* Live video call — replaces the old static "Join Meeting" banner */}
                {sessionEndedInfo ? (
                    <SessionEndedCard
                        isMentor={isMentor}
                        endedByMe={sessionEndedInfo.endedBy === user?.userId}
                        onBack={goBack}
                    />
                ) : authLoading ? (
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
                        isMentor={isMentor}
                        onRoomEnded={(info) => setSessionEndedInfo(info)}
                        onLeave={goBack}
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

                {activeTab === "one-on-one" && <SessionListTab role={isMentor ? "mentor" : "mentee"} past={false} />}
                {activeTab === "queries" && <QueriesTab />}
                {activeTab === "history" && <SessionListTab role={isMentor ? "mentor" : "mentee"} past />}
            </main>

            <Toast msg={toastMsg} visible={toastVisible} />
        </div>
    );
}