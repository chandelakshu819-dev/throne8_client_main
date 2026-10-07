'use client';

import React, { useEffect, useState } from "react";
import {
  CalendarClock,
  Clock,
  Users,
  Bookmark
} from "lucide-react";
import { useRouter } from "next/navigation";
import MentorService from "@/lib/api/mentorship.service";
import { useAuth } from "@/features/auth/hooks/useAuth";

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

type TabType = "upcoming" | "registered";

interface Props {
  // If we want to pass anything from layout in the future
}

// ✅ NEW: status badge palette for a mentee's own registration on a
// group session — mirrors REQUEST_STATUS_META used elsewhere in the
// mentorship feature (ServicesSection.tsx) so the wording/colors stay
// consistent across the app.
const REQUEST_STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "Request Pending", bg: "#fef3c7", fg: "#b45309" },
  accepted: { label: "Confirmed", bg: "#dcfce7", fg: "#15803d" },
  rejected: { label: "Declined", bg: "#fee2e2", fg: "#dc2626" },
};

function formatDateStr(iso?: string) {
  if (!iso) return "Date not set";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Date not set";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatTimeStr(iso?: string) {
  if (!iso) return "Time not set";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Time not set";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });
}

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "M";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function UserDashboardGroupSessionsPage({}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [registeredSessions, setRegisteredSessions] = useState<any[]>([]);
  const [mentorMap, setMentorMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [joinActionLoading, setJoinActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const myId = user?.userId ?? user?.id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const now = Date.now();
      try {
        // Fetch all group sessions
        let globalSessions: any[] = [];
        try {
          const sessionRes = await MentorService.getAllGroupSessions();
          globalSessions = sessionRes.data?.sessions || sessionRes.data || sessionRes.sessions || [];
          if (!Array.isArray(globalSessions)) globalSessions = [];
        } catch (fetchErr) {
          console.error("Failed to load global group sessions", fetchErr);
        }
        
        // Filter upcoming: exclude isTemplate and sessions without scheduledAt; only statuses 'open' or 'full'; scheduledAt must be in future
        const upcoming = globalSessions.filter((s: any) => {
          if (s.isTemplate || !s.scheduledAt) return false;
          if (s.status !== 'open' && s.status !== 'full') return false;
          const t = new Date(s.scheduledAt).getTime();
          return t > now;
        }).sort((a: any, b: any) => {
          const ta = new Date(a.scheduledAt).getTime();
          const tb = new Date(b.scheduledAt).getTime();
          return ta - tb;
        });

        setAllSessions(upcoming);

        // Fetch mentee's registered sessions
        let registered: any[] = [];
        try {
          const registeredRes = await MentorService.getMyGroupSessions('mentee');
          registered =
            registeredRes?.data?.sessions ||
            registeredRes?.data ||
            registeredRes?.sessions ||
            registeredRes ||
            [];
          if (!Array.isArray(registered)) registered = [];
        } catch (regErr) {
          console.error("Failed to load registered group sessions", regErr);
          registered = [];
        }

        // Sort registered: completed/cancelled last, then by scheduledAt ascending
        const isOver = (status?: string) => status === 'completed' || status === 'cancelled';
        registered.sort((a: any, b: any) => {
          const overA = isOver(a.status);
          const overB = isOver(b.status);
          if (overA !== overB) return overA ? 1 : -1;
          const ta = new Date(a.scheduledAt || a.startTime || 0).getTime();
          const tb = new Date(b.scheduledAt || b.startTime || 0).getTime();
          return ta - tb;
        });

        setRegisteredSessions(registered);

        // Fetch Mentors for both upcoming + registered sessions in its own try/catch
        const uniqueMentorIds = Array.from(
          new Set([...upcoming, ...registered].map((s: any) => s.mentorId))
        ).filter(Boolean) as string[];
        const map = new Map<string, any>();
        
        if (uniqueMentorIds.length > 0) {
          try {
            let page = 1;
            const limit = 50;
            let hasMore = true;

            while (hasMore) {
              const mRes = await MentorService.getAllMentors({ page, limit });
              const list = Array.isArray(mRes.data) ? mRes.data : (mRes.data?.mentors || []);
              
              if (!list || list.length === 0) {
                hasMore = false;
              } else {
                list.forEach((m: any) => {
                  if (m.mentorId) map.set(m.mentorId, m);
                });
                const allFound = uniqueMentorIds.every(id => map.has(id));
                if (list.length < limit || allFound) {
                  hasMore = false;
                }
              }
              page++;
            }
          } catch (mentorErr) {
            console.error("Failed to load mentors for group sessions", mentorErr);
          }
        }
        
        setMentorMap(map);

      } catch (error) {
        console.error("Failed to load group sessions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewDetails = (sessionId: string) => {
    router.push(`/mentorship/group-session/${sessionId}`);
  };

  const handleJoinMeet = async (sessionId: string) => {
    setJoinActionLoading(sessionId);
    try {
      await MentorService.markGroupAttendance(sessionId).catch(() => {});
      const freshRes = await MentorService.getGroupSessionById(sessionId);
      const fresh = freshRes?.data || freshRes?.session || freshRes;
      const url = fresh?.meeting?.meetingUrl || fresh?.meetingUrl;
      if (fresh?.status === 'in_progress' && url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        showToast("Session has not started yet or meeting link is unavailable.");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to join meet.");
    } finally {
      setJoinActionLoading(null);
    }
  };

  const renderUpcoming = () => {
    if (allSessions.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl text-center"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <Users className="w-6 h-6" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: COLORS.ink }}>No upcoming group sessions</h3>
            <p className="text-sm mt-0.5" style={{ color: COLORS.muted }}>
              There are currently no upcoming group sessions available.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {allSessions.map((session, idx) => {
          const uniqueKey = session.sessionId || session._id || session.id || `gs-${idx}`;
          
          const hostData = mentorMap.get(session.mentorId);
          const hostName = hostData 
              ? `${hostData.user?.firstName || ''} ${hostData.user?.lastName || ''}`.trim()
              : session.mentorName || "Mentor";
          const hostPic = hostData?.profilePic || hostData?.user?.profilePic || session.mentorProfilePhoto || "";

          // Calculate available seats if fields exist
          const maxSeats = session.maxParticipants;
          const currentCount = session.currentParticipants ?? (session.participantsCount ?? 0);
          const seatsLeft = typeof maxSeats === 'number' ? maxSeats - currentCount : undefined;
          let availableText = "";
          if (typeof session.availableSeats === 'number') {
            availableText = `${session.availableSeats} Seats Available`;
          } else if (typeof maxSeats === 'number') {
            availableText = `${Math.max(0, seatsLeft ?? 0)} Seats Available`;
          } else {
            availableText = "Seats Available";
          }

          const myParticipant = (session.participants || []).find(
            (p: any) => p.menteeId === myId || p.menteeId?.toString() === myId
          );
          const statusMeta = myParticipant ? REQUEST_STATUS_META[myParticipant.requestStatus] : undefined;
          const isFull = session.status === 'full' || (typeof seatsLeft === 'number' && seatsLeft <= 0);

          return (
            <div
              key={uniqueKey}
              className="flex flex-col bg-white rounded-2xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-md h-full flex-grow"
              style={{ borderColor: COLORS.hairline }}
            >
              <div className="relative w-full h-40 bg-[#f4ece1] shrink-0">
                {session.thumbnailImage || session.thumbnail ? (
                  <img 
                      src={session.thumbnailImage || session.thumbnail} 
                      alt={session.title || "Group Session"}
                      className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="w-12 h-12 text-[#e2d5c8]" />
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    {session.topic || session.category || 'Group Session'}
                  </span>
                </div>
                {maxSeats !== undefined && (
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm">
                    <span className="text-[10px] font-bold text-[#4a3728] uppercase tracking-wider">
                      {availableText}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-1 p-5">
                <div className="flex items-center gap-2 mb-3">
                  {hostPic ? (
                    <img 
                        src={hostPic} 
                        alt={hostName} 
                        className="w-6 h-6 rounded-full object-cover border border-[#ece7e2]"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#f4ece1] text-[#8b7355] flex items-center justify-center font-bold text-[10px]">
                        {initialsFrom(hostName)}
                    </div>
                  )}
                  <span className="text-xs font-semibold truncate" style={{ color: COLORS.muted }}>
                      Hosted by {hostName}
                  </span>
                </div>

                <h3 className="text-base font-bold leading-tight mb-4 line-clamp-2" style={{ color: COLORS.ink }} title={session.title}>
                  {session.title || "Mentorship Group Session"}
                </h3>

                <div className="space-y-2 mt-auto mb-5">
                  <div className="flex items-center gap-2 text-xs font-medium" style={{ color: COLORS.ink }}>
                    <CalendarClock className="w-4 h-4 shrink-0" style={{ color: COLORS.muted }} />
                    <span>{formatDateStr(session.scheduledAt || session.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium" style={{ color: COLORS.ink }}>
                    <Clock className="w-4 h-4 shrink-0" style={{ color: COLORS.muted }} />
                    <span>
                      {formatTimeStr(session.scheduledAt || session.startTime)}
                      {session.duration ? ` (${session.duration} min)` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t" style={{ borderColor: COLORS.hairline }}>
                  <button
                    onClick={() => handleViewDetails(uniqueKey)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors hover:bg-[#fbf7f3]"
                    style={{ borderColor: COLORS.hairline, color: COLORS.ink }}
                  >
                    View Details
                  </button>
                  {myParticipant ? (
                    <div
                      className="flex-1 py-2 text-xs font-semibold rounded-xl text-center flex items-center justify-center"
                      style={{
                        backgroundColor: statusMeta?.bg || COLORS.chip,
                        color: statusMeta?.fg || COLORS.ink,
                      }}
                    >
                      {statusMeta?.label || "Registered"}
                    </div>
                  ) : isFull ? (
                    <button
                      disabled
                      className="flex-1 py-2 text-xs font-semibold rounded-xl text-white opacity-60 cursor-not-allowed flex items-center justify-center"
                      style={{ backgroundColor: COLORS.muted }}
                    >
                      Session Full
                    </button>
                  ) : (
                    <button
                      onClick={() => handleViewDetails(uniqueKey)}
                      className="flex-1 py-2 text-xs font-semibold rounded-xl transition-colors hover:bg-[#8b7355] text-white flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: COLORS.ink }}
                    >
                      Reserve Seat
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRegistered = () => {
    if (registeredSessions.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl text-center"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <Bookmark className="w-6 h-6" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: COLORS.ink }}>You have not registered for any group sessions yet</h3>
            <p className="text-sm mt-0.5" style={{ color: COLORS.muted }}>
              When you reserve a seat for an upcoming session, it will appear here.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {registeredSessions.map((session, idx) => {
          const uniqueKey = session.sessionId || session._id || session.id || `reg-gs-${idx}`;

          const hostData = mentorMap.get(session.mentorId);
          const hostName = hostData
            ? `${hostData.user?.firstName || ''} ${hostData.user?.lastName || ''}`.trim()
            : session.mentorName || "Mentor";
          const hostPic = hostData?.profilePic || hostData?.user?.profilePic || session.mentorProfilePhoto || "";

          const myParticipant = (session.participants || []).find(
            (p: any) => p.menteeId === myId || p.menteeId?.toString() === myId
          );
          const statusMeta = myParticipant ? REQUEST_STATUS_META[myParticipant.requestStatus] : undefined;

          // Check Join Meet condition:
          // status === 'in_progress' AND myParticipant.requestStatus === 'accepted' AND scheduledAt + duration + 2h is not past
          const schedTime = new Date(session.scheduledAt || session.startTime || 0).getTime();
          const durationMinutes = Number(session.duration) || 60;
          const expireTime = schedTime + (durationMinutes * 60 * 1000) + (2 * 60 * 60 * 1000);
          const isNotPastWindow = expireTime > Date.now();
          const canJoinMeet = session.status === 'in_progress' && myParticipant?.requestStatus === 'accepted' && isNotPastWindow;

          // Session status chip labels
          const sessionStatus = session.status;
          let sessionStatusLabel = "";
          let sessionStatusBg = "";
          let sessionStatusFg = "";
          if (sessionStatus === 'in_progress') {
            sessionStatusLabel = "In Progress";
            sessionStatusBg = "#dcfce7";
            sessionStatusFg = "#15803d";
          } else if (sessionStatus === 'completed') {
            sessionStatusLabel = "Completed";
            sessionStatusBg = "#f3ece4";
            sessionStatusFg = "#7a5c3e";
          } else if (sessionStatus === 'cancelled') {
            sessionStatusLabel = "Cancelled";
            sessionStatusBg = "#fee2e2";
            sessionStatusFg = "#dc2626";
          }

          return (
            <div
              key={uniqueKey}
              className="flex flex-col bg-white rounded-2xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-md h-full flex-grow"
              style={{ borderColor: COLORS.hairline }}
            >
              <div className="relative w-full h-40 bg-[#f4ece1] shrink-0">
                {session.thumbnailImage || session.thumbnail ? (
                  <img
                    src={session.thumbnailImage || session.thumbnail}
                    alt={session.title || "Group Session"}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="w-12 h-12 text-[#e2d5c8]" />
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    {session.topic || session.category || 'Group Session'}
                  </span>
                </div>
                {statusMeta && (
                  <div
                    className="absolute top-3 right-3 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm"
                    style={{ backgroundColor: statusMeta.bg }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: statusMeta.fg }}>
                      {statusMeta.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-1 p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 truncate">
                    {hostPic ? (
                      <img
                        src={hostPic}
                        alt={hostName}
                        className="w-6 h-6 rounded-full object-cover border border-[#ece7e2]"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#f4ece1] text-[#8b7355] flex items-center justify-center font-bold text-[10px]">
                        {initialsFrom(hostName)}
                      </div>
                    )}
                    <span className="text-xs font-semibold truncate" style={{ color: COLORS.muted }}>
                      Hosted by {hostName}
                    </span>
                  </div>

                  {sessionStatusLabel && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 uppercase tracking-wider"
                      style={{ backgroundColor: sessionStatusBg, color: sessionStatusFg }}
                    >
                      {sessionStatusLabel}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold leading-tight mb-4 line-clamp-2" style={{ color: COLORS.ink }} title={session.title}>
                  {session.title || "Mentorship Group Session"}
                </h3>

                <div className="space-y-2 mt-auto mb-5">
                  <div className="flex items-center gap-2 text-xs font-medium" style={{ color: COLORS.ink }}>
                    <CalendarClock className="w-4 h-4 shrink-0" style={{ color: COLORS.muted }} />
                    <span>{formatDateStr(session.scheduledAt || session.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium" style={{ color: COLORS.ink }}>
                    <Clock className="w-4 h-4 shrink-0" style={{ color: COLORS.muted }} />
                    <span>
                      {formatTimeStr(session.scheduledAt || session.startTime)}
                      {session.duration ? ` (${session.duration} min)` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t" style={{ borderColor: COLORS.hairline }}>
                  <button
                    onClick={() => handleViewDetails(uniqueKey)}
                    className={`${canJoinMeet ? "flex-1" : "w-full"} py-2 text-xs font-semibold rounded-xl border transition-colors hover:bg-[#fbf7f3]`}
                    style={{ borderColor: COLORS.hairline, color: COLORS.ink }}
                  >
                    View Details
                  </button>
                  {canJoinMeet && (
                    <button
                      onClick={() => handleJoinMeet(uniqueKey)}
                      disabled={joinActionLoading === uniqueKey}
                      className="flex-1 py-2 text-xs font-semibold rounded-xl text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      style={{ backgroundColor: "#15803d" }}
                    >
                      {joinActionLoading === uniqueKey ? "Joining..." : "Join Meet"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl pt-2 pb-8">
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 99999,
            padding: "12px 20px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            background: "#fee2e2",
            color: "#dc2626",
            border: "1px solid #fca5a5",
          }}
        >
          {toastMessage}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          Group Sessions
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          Discover and join interactive group sessions led by expert mentors.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap border ${
            activeTab === "upcoming"
              ? "bg-white shadow-sm"
              : "bg-transparent border-transparent hover:bg-white/50"
          }`}
          style={{
            color: activeTab === "upcoming" ? COLORS.ink : COLORS.muted,
            borderColor: activeTab === "upcoming" ? COLORS.ink : "transparent",
            borderWidth: activeTab === "upcoming" ? "2px" : "1px",
          }}
        >
          Upcoming Group Sessions
        </button>
        <button
          onClick={() => setActiveTab("registered")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap border ${
            activeTab === "registered"
              ? "bg-white shadow-sm"
              : "bg-transparent border-transparent hover:bg-white/50"
          }`}
          style={{
            color: activeTab === "registered" ? COLORS.ink : COLORS.muted,
            borderColor: activeTab === "registered" ? COLORS.ink : "transparent",
            borderWidth: activeTab === "registered" ? "2px" : "1px",
          }}
        >
          My Registered Sessions
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-sm font-medium" style={{ color: COLORS.muted }}>
          Loading group sessions...
        </div>
      ) : (
        activeTab === "upcoming" ? renderUpcoming() : renderRegistered()
      )}
    </div>
  );
}