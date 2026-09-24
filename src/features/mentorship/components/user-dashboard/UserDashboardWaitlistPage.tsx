"use client";
import { useState, useEffect, useCallback } from "react";
import MentorService from "@/lib/api/mentorship.service";
import { useRouter } from "next/navigation";

interface WaitlistItem {
  waitlistId: string;
  mentorId: string;
  mentorName?: string;
  serviceTitle?: string;
  sessionType: string;
  status: "active" | "notified" | "booked" | "expired" | "cancelled";
  queuePosition?: number;
  bookingWindowExpiresAt?: string;
  createdAt: string;
}

const WAITLIST_BADGE: Record<WaitlistItem["status"], { label: string; bg: string; fg: string }> = {
    active: { label: "Waiting", bg: "rgba(201,124,74,0.12)", fg: "#c97c4a" },
    notified: { label: "Approved", bg: "rgba(107,143,110,0.12)", fg: "#6b8f6e" },
    booked: { label: "Booked", bg: "rgba(74,55,40,0.08)", fg: "#7a5c3e" },
    expired: { label: "Expired", bg: "rgba(138,122,106,0.12)", fg: "#8a7a6a" },
    cancelled: { label: "Cancelled", bg: "rgba(200,80,80,0.10)", fg: "#c85050" },
};

function formatSessionDate(dateStr: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

export default function UserDashboardWaitlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | WaitlistItem["status"]>("all");
  const [sortBy, setSortBy] = useState<"recent" | "mentor" | "session">("recent");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchWaitlists = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
          const res = await MentorService.getMyWaitlists();
          setItems((res?.data ?? []) as WaitlistItem[]);
      } catch (e: any) {
          setError(e?.message || "Could not load your waitlists.");
      } finally {
          setLoading(false);
      }
  }, []);

  useEffect(() => {
      fetchWaitlists();
  }, [fetchWaitlists]);

  const goBook = (w: WaitlistItem) => {
      const slug = encodeURIComponent((w.mentorName || "mentor").toLowerCase().replace(/\s+/g, "-"));
      router.push(`/mentorship/mentor-card/${slug}/${w.mentorId}`);
  };

  const filteredAndSortedItems = items
    .filter((w) => statusFilter === "all" || w.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === "mentor") return (a.mentorName || "").localeCompare(b.mentorName || "");
      if (sortBy === "session") {
        const aName = a.serviceTitle || a.sessionType || "";
        const bName = b.serviceTitle || b.sessionType || "";
        return aName.localeCompare(bName);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const waitingCount = items.filter((w) => w.status === "active").length;
  const approvedCount = items.filter((w) => w.status === "notified").length;
  const expiredCount = items.filter((w) => w.status === "expired").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Waitlist</h1>
          <p className="text-sm mt-1" style={{ color: '#8a7a6a' }}>
            All your session requests in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-sm px-3 py-2 rounded-lg border"
                style={{ borderColor: '#e0d8cf', color: '#4a3728', backgroundColor: '#fff' }}
            >
                <option value="all">All statuses</option>
                <option value="active">Waiting</option>
                <option value="notified">Approved</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
            </select>
            <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm px-3 py-2 rounded-lg border"
                style={{ borderColor: '#e0d8cf', color: '#4a3728', backgroundColor: '#fff' }}
            >
                <option value="recent">Most recent</option>
                <option value="mentor">Mentor name</option>
                <option value="session">Session type</option>
            </select>
            <button
                onClick={fetchWaitlists}
                className="text-sm px-4 py-2 rounded-lg font-medium text-white flex items-center gap-1.5"
                style={{ backgroundColor: '#4a3728' }}
            >
                ↻ Refresh
            </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#4a3728' }}></div>
        </div>
      ) : error ? (
        <div className="py-16 text-center text-sm font-medium" style={{ color: '#c97c4a' }}>
            {error}
        </div>
      ) : items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl"
          style={{ backgroundColor: '#fff', border: '1px solid #e0d8cf' }}
        >
          <h3 className="text-lg font-bold mb-2" style={{ color: '#4a3728' }}>
            You're not on any waitlists
          </h3>
          <p className="text-sm max-w-md" style={{ color: '#7a5c3e' }}>
            When you join a waitlist for a full session, it will appear here so you can keep track of your position.
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl p-5 flex items-center gap-4" style={{ backgroundColor: '#fdf3ea' }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: '#fbe4cf', color: '#c97c4a' }}>⏳</div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>{waitingCount}</div>
                <div className="text-sm font-medium" style={{ color: '#4a3728' }}>Waiting</div>
                <div className="text-xs" style={{ color: '#8a7a6a' }}>Sessions in queue</div>
              </div>
            </div>
            <div className="rounded-2xl p-5 flex items-center gap-4" style={{ backgroundColor: '#eef6ef' }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: '#d9ecdb', color: '#6b8f6e' }}>✓</div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>{approvedCount}</div>
                <div className="text-sm font-medium" style={{ color: '#4a3728' }}>Approved</div>
                <div className="text-xs" style={{ color: '#8a7a6a' }}>Sessions confirmed</div>
              </div>
            </div>
            <div className="rounded-2xl p-5 flex items-center gap-4" style={{ backgroundColor: '#fdeeee' }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: '#fad4d4', color: '#c85050' }}>⏱</div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>{expiredCount}</div>
                <div className="text-sm font-medium" style={{ color: '#4a3728' }}>Expired</div>
                <div className="text-xs" style={{ color: '#8a7a6a' }}>Requests expired</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', border: '1px solid #e0d8cf' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#fbf7f3' }}>
                  <th className="text-left font-bold px-5 py-3" style={{ color: '#4a3728' }}>#</th>
                  <th className="text-left font-bold px-5 py-3" style={{ color: '#4a3728' }}>Session</th>
                  <th className="text-left font-bold px-5 py-3" style={{ color: '#4a3728' }}>Requested by</th>
                  <th className="text-left font-bold px-5 py-3" style={{ color: '#4a3728' }}>Date</th>
                  <th className="text-left font-bold px-5 py-3" style={{ color: '#4a3728' }}>Position</th>
                  <th className="text-left font-bold px-5 py-3" style={{ color: '#4a3728' }}>Status</th>
                  <th className="text-left font-bold px-5 py-3" style={{ color: '#4a3728' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedItems.map((w, idx) => {
                  const badge = WAITLIST_BADGE[w.status] || WAITLIST_BADGE.active;
                  return (
                    <tr key={w.waitlistId} style={{ borderTop: '1px solid #f0e9e0' }}>
                      <td className="px-5 py-4" style={{ color: '#8a7a6a' }}>{idx + 1}</td>
                      <td className="px-5 py-4 font-bold" style={{ color: '#1a1a1a' }}>
                        {w.serviceTitle || (w.sessionType ? w.sessionType.replace(/_/g, " ") : "Session")}
                      </td>
                      <td className="px-5 py-4" style={{ color: '#4a3728' }}>{w.mentorName || "-"}</td>
                      <td className="px-5 py-4" style={{ color: '#4a3728' }}>{formatSessionDate(w.createdAt)}</td>
                      <td className="px-5 py-4" style={{ color: '#4a3728' }}>
                        {w.status === "active" && w.queuePosition ? `#${w.queuePosition}` : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full inline-block"
                          style={{ background: badge.bg, color: badge.fg }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === w.waitlistId ? null : w.waitlistId)}
                          className="px-2 py-1 rounded"
                          style={{ color: '#8a7a6a' }}
                        >
                          •••
                        </button>
                        {openMenuId === w.waitlistId && (
                          <div
                            className="absolute right-5 top-10 z-10 rounded-lg shadow-lg py-1"
                            style={{ backgroundColor: '#fff', border: '1px solid #e0d8cf', minWidth: '140px' }}
                          >
                            {w.status === "notified" && (
                              <button
                                onClick={() => { goBook(w); setOpenMenuId(null); }}
                                className="w-full text-left px-4 py-2 text-sm hover:opacity-80"
                                style={{ color: '#4a3728' }}
                              >
                                Book now
                              </button>
                            )}
                            {w.status === "active" && (
                              <button
                                className="w-full text-left px-4 py-2 text-sm hover:opacity-80"
                                style={{ color: '#c85050' }}
                              >
                                Leave waitlist
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}