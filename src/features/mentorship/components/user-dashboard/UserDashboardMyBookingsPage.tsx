// src/features/mentorship/components/user-dashboard/UserDashboardMyBookingsPage.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, CheckCircle2, Play, XCircle, Eye, Download } from "lucide-react";
import SessionService from "@/lib/api/session.service";

interface UserDashboardMyBookingsPageProps {
  user?: any;
  [key: string]: any;
}

type MyBookingRow = {
  bookingId: string;
  sessionId: string;
  serviceName: string;
  scheduledAt: string;
  slotTime?: string;
  status:
    | "pending"
    | "confirmed"
    | "rescheduled"
    | "in_progress"
    | "completed"
    | "cancelled";
  isGroupSession: boolean;
};

type BookingTab = "all" | "pending" | "upcoming" | "in_progress" | "completed";

const tabMeta: Record<BookingTab, { label: string; icon: React.ElementType }> = {
  all: { label: "All Active", icon: Clock },
  pending: { label: "Pending", icon: Clock },
  upcoming: { label: "Upcoming", icon: Calendar },
  in_progress: { label: "In Progress", icon: Play },
  completed: { label: "Completed", icon: CheckCircle2 },
};

const statusBadge: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#fef3c7", fg: "#b45309", label: "Pending" },
  rescheduled: { bg: "#fed7aa", fg: "#c2410c", label: "Rescheduled" },
  confirmed: { bg: "#dcfce7", fg: "#15803d", label: "Upcoming" },
  in_progress: { bg: "#dbeafe", fg: "#1d4ed8", label: "In Progress" },
  completed: { bg: "#f3e8ff", fg: "#7c3aed", label: "Completed" },
  cancelled: { bg: "#fee2e2", fg: "#dc2626", label: "Cancelled" },
};

// Maps a GroupSession participant's requestStatus + the parent session's
// status into the same status vocabulary used for 1:1 bookings, so both
// kinds of rows can share one set of tabs/badges.
function resolveGroupRowStatus(requestStatus: string, sessionStatus: string): MyBookingRow["status"] {
  if (requestStatus === "pending") return "pending";
  if (requestStatus === "rejected") return "cancelled";
  // requestStatus === 'accepted' from here on
  if (sessionStatus === "cancelled") return "cancelled";
  if (sessionStatus === "completed") return "completed";
  if (sessionStatus === "in_progress") return "in_progress";
  return "confirmed";
}

export default function UserDashboardMyBookingsPage({ user }: UserDashboardMyBookingsPageProps) {
  const router = useRouter();
  const userId: string | undefined = user?.userId || user?.id || user?._id;

  const [bookingTab, setBookingTab] = useState<BookingTab>("all");
  const [allBookings, setAllBookings] = useState<MyBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchAll = () => {
    setLoading(true);

    Promise.all([
      SessionService.getAllSessions({ role: "mentee", limit: 100 }).catch((err) => {
        console.error("Failed to fetch 1:1 sessions:", err);
        return { data: [] } as any;
      }),
      SessionService.getMyGroupSessions("mentee").catch((err) => {
        console.error("Failed to fetch group sessions:", err);
        return { data: [] } as any;
      }),
    ]).then(([oneOnOneRes, groupRes]) => {
      // ── Flatten 1:1 sessions → one row per booking belonging to this mentee ──
      const oneOnOneSessions = (oneOnOneRes?.data as any[]) || [];
      const oneOnOneRows: MyBookingRow[] = oneOnOneSessions.flatMap((s: any) => {
        const bookings = (s.bookings || []).filter(
          (b: any) => b.menteeId === userId || b.bookedBy === userId
        );

        if (bookings.length === 0) {
          // Older/simple sessions may carry menteeId/status directly on
          // the session rather than in a bookings[] array.
          if (s.menteeId === userId) {
            return [
              {
                bookingId: s.sessionId,
                sessionId: s.sessionId,
                serviceName: s.title || "Session",
                scheduledAt: s.scheduledAt,
                slotTime: s.slotTime,
                status: s.status,
                isGroupSession: false,
              },
            ];
          }
          return [];
        }

        return bookings.map((b: any) => ({
          bookingId: b._id,
          sessionId: s.sessionId,
          serviceName: s.title || "Session",
          scheduledAt: b.scheduledAt || s.scheduledAt,
          slotTime: b.slotTime,
          status: b.status,
          isGroupSession: false,
        }));
      });

      // ── Flatten group sessions → one row per session this mentee is in ──
      const groupSessions = (groupRes?.data as any[]) || [];
      const groupRows: MyBookingRow[] = groupSessions
        .map((s: any) => {
          const participant = (s.participants || []).find(
            (p: any) => p.menteeId === userId
          );
          if (!participant) return null;

          return {
            bookingId: `${s.sessionId}-${userId}`,
            sessionId: s.sessionId,
            serviceName: `${s.title} (Group Session)`,
            scheduledAt: s.scheduledAt,
            slotTime: undefined,
            status: resolveGroupRowStatus(participant.requestStatus, s.status),
            isGroupSession: true,
          } as MyBookingRow;
        })
        .filter((r): r is MyBookingRow => r !== null);

      const combined = [...oneOnOneRows, ...groupRows].sort((a, b) => {
        const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
      });

      setAllBookings(combined);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (userId) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const pendingBookings = allBookings.filter((b) => b.status === "pending");
  const upcomingBookings = allBookings.filter(
    (b) => b.status === "confirmed" || b.status === "rescheduled"
  );
  const inProgressBookings = allBookings.filter((b) => b.status === "in_progress");
  const completedBookings = allBookings.filter((b) => b.status === "completed");

  const currentBookings = useMemo(() => {
    switch (bookingTab) {
      case "pending":
        return pendingBookings;
      case "upcoming":
        return upcomingBookings;
      case "in_progress":
        return inProgressBookings;
      case "completed":
        return completedBookings;
      default:
        return allBookings.filter((b) => b.status !== "completed" && b.status !== "cancelled");
    }
  }, [bookingTab, allBookings]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (row: MyBookingRow) => {
    if (row.slotTime) return row.slotTime;
    if (!row.scheduledAt) return "N/A";
    const date = new Date(row.scheduledAt);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const handleDownloadReceipt = async (row: MyBookingRow) => {
    if (row.isGroupSession) return; // receipts only wired for 1:1 sessions currently
    setDownloadingId(row.bookingId);
    try {
      const res: any = await SessionService.getSessionReceipt(row.sessionId, row.bookingId);
      const r = res.data;
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Receipt</title></head>
        <body style="font-family:Arial,sans-serif;padding:40px;color:#4a3728;">
          <h2>Session Receipt</h2>
          <p><b>Service:</b> ${r.title || row.serviceName}</p>
          <p><b>Mentor:</b> ${r.mentorName || "Mentor"}</p>
          <p><b>Date:</b> ${formatDate(r.scheduledAt || row.scheduledAt)}</p>
          <p><b>Amount:</b> ${r.pricing?.currency || "INR"} ${r.pricing?.totalAmount ?? 0}</p>
        </body></html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${row.bookingId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Failed to download receipt:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#4a3728" }}>
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#4a3728" }}>My Bookings</h2>
          <p className="text-sm" style={{ color: "#8a7a6a" }}>Your sessions and group session requests</p>
        </div>
      </div>

      <div className="bg-white p-1.5 rounded-2xl overflow-x-auto" style={{ border: "1px solid #e0d8cf" }}>
        <div className="flex gap-1.5 min-w-max">
          {(["all", "pending", "upcoming", "in_progress", "completed"] as const).map((tab) => {
            const count =
              tab === "all"
                ? allBookings.filter((b) => b.status !== "completed" && b.status !== "cancelled").length
                : tab === "pending"
                ? pendingBookings.length
                : tab === "upcoming"
                ? upcomingBookings.length
                : tab === "in_progress"
                ? inProgressBookings.length
                : completedBookings.length;
            const { label, icon: Icon } = tabMeta[tab];
            const isActive = bookingTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setBookingTab(tab)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
                style={{ backgroundColor: isActive ? "#4a3728" : "transparent", color: isActive ? "#fff" : "#7a5c3e" }}
              >
                <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "#f3ece4",
                      color: isActive ? "#fff" : "#7a5c3e",
                    }}
                  >
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #e0d8cf" }}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ color: "#8a7a6a" }}>
              <Clock className="w-5 h-5 animate-spin mr-3" />
              <span className="text-sm font-semibold">Loading bookings...</span>
            </div>
          ) : currentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: "#8a7a6a" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#f3ece4" }}>
                <Calendar className="w-6 h-6" style={{ color: "#a08070" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "#4a3728" }}>
                No {bookingTab.replace("_", " ")} bookings found
              </p>
              <p className="text-xs mt-1">Bookings will appear here when available</p>
            </div>
          ) : (
            <table className="w-full">
              <thead style={{ backgroundColor: "#fbf7f3" }}>
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Service</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Date</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Time</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#f0ebe4" }}>
                {currentBookings.map((row, idx) => {
                  const sb = statusBadge[row.status] ?? statusBadge.pending;
                  return (
                    <tr key={`${row.sessionId}-${row.bookingId}-${idx}`} className="transition-colors hover:bg-[#fbf7f3]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: "#4a3728" }}>{row.serviceName}</span>
                          {row.isGroupSession && (
                            <span
                              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}
                            >
                              Group
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#8a7a6a" }}>{formatDate(row.scheduledAt)}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#8a7a6a" }}>{formatTime(row)}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: sb.bg, color: sb.fg }}
                        >
                          {sb.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5">
                          {row.status === "in_progress" && !row.isGroupSession && (
                            <button
                              onClick={() => router.push(`/mentorship/session-room/${row.sessionId}?bookingId=${row.bookingId}`)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80"
                              style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
                            >
                              <Play className="w-3.5 h-3.5" />
                              Join
                            </button>
                          )}
                          {row.status === "completed" && !row.isGroupSession && (
                            <button
                              onClick={() => handleDownloadReceipt(row)}
                              disabled={downloadingId === row.bookingId}
                              className="p-1.5 rounded-lg transition-colors hover:bg-[#f3ece4] disabled:opacity-50"
                              style={{ border: "1px solid #e0d8cf" }}
                              title="Download Receipt"
                            >
                              <Download className="w-3.5 h-3.5" style={{ color: "#7a5c3e" }} />
                            </button>
                          )}
                          {row.status === "pending" && (
                            <span className="text-xs" style={{ color: "#8a7a6a" }}>
                              Awaiting mentor response
                            </span>
                          )}
                          {row.status !== "pending" && row.status !== "in_progress" && row.status !== "completed" && (
                            <span className="text-xs" style={{ color: "#8a7a6a" }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}