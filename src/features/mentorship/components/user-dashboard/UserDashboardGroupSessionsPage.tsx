import React, { useEffect, useState, useCallback } from "react";
import {
  CalendarClock,
  Clock,
  Video,
  MapPin,
  Users,
  ArrowRight,
  Bookmark
} from "lucide-react";
import { useRouter } from "next/navigation";
import MentorService from "@/lib/api/mentorship.service";

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
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "M";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function UserDashboardGroupSessionsPage({}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [registeredSessions, setRegisteredSessions] = useState<any[]>([]);
  const [mentorMap, setMentorMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  const now = Date.now();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all group sessions
        const sessionRes = await MentorService.getAllGroupSessions();
        const globalSessions = sessionRes.data?.sessions || sessionRes.data || sessionRes.sessions || [];
        
        // Filter upcoming
        const upcoming = globalSessions.filter((s: any) => {
          const t = new Date(s.scheduledAt || s.startTime || 0).getTime();
          return t > now;
        }).sort((a: any, b: any) => {
          const ta = new Date(a.scheduledAt || a.startTime || 0).getTime();
          const tb = new Date(b.scheduledAt || b.startTime || 0).getTime();
          return ta - tb;
        });

        setAllSessions(upcoming);

        // Fetch Mentors for these sessions
        const uniqueMentorIds = Array.from(new Set(upcoming.map((s: any) => s.mentorId))).filter(Boolean) as string[];
        const map = new Map<string, any>();
        
        if (uniqueMentorIds.length > 0) {
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
        }
        
        setMentorMap(map);
        
        // NOTE: No existing backend API provides the authenticated user's registered group sessions.
        // As per requirements, we will handle this gracefully and not invent fake registrations.
        setRegisteredSessions([]);

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

  const renderUpcoming = () => {
    if (allSessions.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <Users className="w-8 h-8" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>No upcoming group sessions</h3>
            <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
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
          const currentCount = session.currentParticipants || session.participantsCount || 0;
          let availableText = "";
          if (typeof session.availableSeats === 'number') {
            availableText = `${session.availableSeats} Seats Available`;
          } else if (typeof maxSeats === 'number') {
            const avail = maxSeats - currentCount;
            availableText = `${Math.max(0, avail)} Seats Available`;
          } else {
            availableText = "Seats Available";
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
                  <button
                    onClick={() => handleViewDetails(uniqueKey)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl transition-colors hover:bg-[#8b7355] text-white flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: COLORS.ink }}
                  >
                    Reserve Seat
                  </button>
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
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <Bookmark className="w-8 h-8" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>You have not registered for any group sessions yet</h3>
            <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
              When you reserve a seat for an upcoming session, it will appear here.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {/* Render registered sessions here if the API existed */}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl pt-2 pb-8">
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
