// src/features/mentorship/components/user-dashboard/UserDashboardMyBookingsPage.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, CheckCircle2, Play, XCircle, Eye, Download, History, RotateCw, Loader2 } from "lucide-react";
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
    | "cancelled"
    | "missed";
    duration?: number;
    amount?: number;
    isGroupSession: boolean;
  };

type BookingTab = "all" | "pending" | "upcoming" | "in_progress" | "completed" | "missed" | "history";

const tabMeta: Record<BookingTab, { label: string; icon: React.ElementType }> = {
  all: { label: "All Active", icon: Clock },
  pending: { label: "Pending", icon: Clock },
  upcoming: { label: "Upcoming", icon: Calendar },
  in_progress: { label: "In Progress", icon: Play },
  completed: { label: "Completed", icon: CheckCircle2 },
  missed: { label: "Missed", icon: XCircle },
  history: { label: "History", icon: History },
};

const statusBadge: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#fef3c7", fg: "#b45309", label: "Pending" },
  rescheduled: { bg: "#fed7aa", fg: "#c2410c", label: "Rescheduled" },
  confirmed: { bg: "#dcfce7", fg: "#15803d", label: "Upcoming" },
  in_progress: { bg: "#dbeafe", fg: "#1d4ed8", label: "In Progress" },
  completed: { bg: "#f3e8ff", fg: "#7c3aed", label: "Completed" },
  cancelled: { bg: "#fee2e2", fg: "#dc2626", label: "Cancelled" },
  missed: { bg: "#f3f4f6", fg: "#6b7280", label: "Missed" },
};

const ENDED_GRACE_MINUTES = 15; // mentor page ke saath same rakhna
const PAGE_SIZE = 20;

// "HH:mm - HH:mm" -> minutes
const slotMinutes = (slot?: string): number | null => {
  if (!slot) return null;
  const parts = slot.split("-").map((x) => x.trim());
  if (parts.length !== 2) return null;
  const toMin = (t: string) => {
    const m = t.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
  };
  const s = toMin(parts[0]);
  const e = toMin(parts[1]);
  return s !== null && e !== null && e > s ? e - s : null;
};

// DB status + current time -> row ka asli status (mentor page jaisa hi logic)
function computeDynamicStatus(
  baseStatus: MyBookingRow["status"],
  scheduledAt: string | undefined,
  durationMinutes?: number,
  slotTime?: string,
  isGroup: boolean = false
): MyBookingRow["status"] {
  if (["completed", "cancelled", "missed"].includes(baseStatus)) return baseStatus;
  if (!scheduledAt) return baseStatus;
  const startTime = new Date(scheduledAt).getTime();
  if (Number.isNaN(startTime)) return baseStatus;

  const minutes =
    slotMinutes(slotTime) ??
    (durationMinutes && durationMinutes > 0 ? durationMinutes : isGroup ? 120 : 60);
  const endTime = startTime + minutes * 60 * 1000;
  const now = Date.now();

  // Live tha, time + grace nikal gaya -> auto-complete
  if (baseStatus === "in_progress") {
    return now > endTime + ENDED_GRACE_MINUTES * 60 * 1000 ? "completed" : "in_progress";
  }
    // 1:1: start+15 min ke baad mentor start nahi kar sakta -> Missed. Group: slot end.
     // Pending 1:1 request slot start par expire; baaki start + 15 min par
     const missedAfter = isGroup
     ? endTime
     : baseStatus === "pending"
       ? startTime
       : startTime + 15 * 60 * 1000;
   if (now > missedAfter) return "missed";

   

  if (baseStatus === "pending") return "pending";
  if (now >= startTime) return "in_progress"; // time chal raha hai -> Join dikhao
  return baseStatus === "rescheduled" ? "rescheduled" : "confirmed";
}

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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [reschedRow, setReschedRow] = useState<MyBookingRow | null>(null);
  const [reschedDate, setReschedDate] = useState("");

  const handleRefund = async (row: MyBookingRow) => {
    if (!window.confirm(`Full refund of ₹${row.amount} ke liye confirm karo?`)) return;
    setBusyId(row.bookingId);
    try {
      await SessionService.refundMissedSession(row.sessionId, row.bookingId);
      setMsg({ text: "Refund initiated. 3-5 business days me aayega.", ok: true });
      fetchAll();
    } catch (e: any) {
      setMsg({ text: e?.message || "Refund failed.", ok: false });
    } finally {
      setBusyId(null);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!reschedRow || !reschedDate) return;
    setBusyId(reschedRow.bookingId);
    try {
      const iso = new Date(`${reschedDate}:00+05:30`).toISOString();
      await SessionService.rescheduleSession(
        reschedRow.sessionId,
        iso,
        "Rescheduled after missed session",
        reschedRow.bookingId
      );
      setMsg({ text: "Session rescheduled.", ok: true });
      setReschedRow(null);
      setReschedDate("");
      fetchAll();
    } catch (e: any) {
      setMsg({ text: e?.message || "Reschedule failed.", ok: false });
    } finally {
      setBusyId(null);
    }
  };



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
                duration: s.duration,
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
          duration: s.duration,
          slotTime: b.slotTime,
          status: b.status,
          amount: Number(b.pricing?.totalAmount ?? s.pricing?.totalAmount ?? 0),
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
          
          const baseStatus = resolveGroupRowStatus(participant.requestStatus, s.status);

          return {
            bookingId: `${s.sessionId}-${userId}`,
            sessionId: s.sessionId,
            serviceName: `${s.title} (Group Session)`,
            scheduledAt: s.scheduledAt,
            duration: s.duration,
            slotTime: undefined,
            status: baseStatus,
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

  // Har minute statuses dobara evaluate (page khula rahe tab bhi)
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [bookingTab]);

  // DB ka raw status -> time ke hisaab se asli status
  const rows = useMemo(
    () =>
      allBookings.map((r) => ({
        ...r,
        status: computeDynamicStatus(r.status, r.scheduledAt, r.duration, r.slotTime, r.isGroupSession),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allBookings, nowMs]
  );

  const timeOf = (r: MyBookingRow) => {
    const t = r.scheduledAt ? new Date(r.scheduledAt).getTime() : 0;
    return Number.isNaN(t) ? 0 : t;
  };
  const nearestFirst = (a: MyBookingRow, b: MyBookingRow) => timeOf(a) - timeOf(b);
  const latestFirst = (a: MyBookingRow, b: MyBookingRow) => timeOf(b) - timeOf(a);

  const pendingBookings = rows.filter((b) => b.status === "pending").sort(nearestFirst);
  const upcomingBookings = rows
    .filter((b) => b.status === "confirmed" || b.status === "rescheduled")
    .sort(nearestFirst);
  const inProgressBookings = rows.filter((b) => b.status === "in_progress");
  const completedBookings = rows.filter((b) => b.status === "completed");
  const missedBookings = rows.filter((b) => b.status === "missed");
  // All Active = sirf wahi jo abhi kaam ke hain (past nahi)
  const activeBookings = rows
    .filter((b) => ["pending", "confirmed", "rescheduled", "in_progress"].includes(b.status))
    .sort(nearestFirst);
  // History = poora past (completed + missed + cancelled)
  const historyBookings = rows
    .filter((b) => ["completed", "missed", "cancelled"].includes(b.status))
    .sort(latestFirst);

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
      case "missed":
        return missedBookings;
      case "history":
        return historyBookings;
      default:
        return activeBookings;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingTab, rows]);

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
          {(["all", "pending", "upcoming", "in_progress", "completed", "missed", "history"] as const).map((tab) => {
            const count = {
              all: activeBookings.length,
              pending: pendingBookings.length,
              upcoming: upcomingBookings.length,
              in_progress: inProgressBookings.length,
              completed: completedBookings.length,
              missed: missedBookings.length,
              history: historyBookings.length,
            }[tab];
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
                No {tabMeta[bookingTab].label.toLowerCase()} bookings found
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
                {currentBookings.slice(0, visibleCount).map((row, idx) => {
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
                                                   {row.status === "missed" && !row.isGroupSession && (
                            <>
                              {(row.amount ?? 0) > 0 && (
                                <button
                                  onClick={() => handleRefund(row)}
                                  disabled={busyId === row.bookingId}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                                  style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
                                >
                                  {busyId === row.bookingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                  Refund ₹{row.amount}
                                </button>
                              )}
                              <button
                                onClick={() => setReschedRow(row)}
                                disabled={busyId === row.bookingId}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: "#fed7aa", color: "#c2410c" }}
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                                Reschedule
                              </button>
                            </>
                          )}
                          {row.status === "missed" && row.isGroupSession && (
                            <span className="text-xs" style={{ color: "#8a7a6a" }}>Missed</span>
                          )}
                          {row.status !== "pending" &&
                            row.status !== "in_progress" &&
                            row.status !== "completed" &&
                            row.status !== "missed" && (
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

      
      {msg && (
        <div
          className="text-sm font-semibold rounded-lg px-4 py-3"
          style={{ backgroundColor: msg.ok ? "#dcfce7" : "#fee2e2", color: msg.ok ? "#15803d" : "#dc2626" }}
        >
          {msg.text}
          <button className="ml-3 underline" onClick={() => setMsg(null)}>close</button>
        </div>
      )}

      {reschedRow && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4" style={{ border: "1px solid #e0d8cf" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#4a3728" }}>Reschedule Session</h3>
            <input
              type="datetime-local"
              className="w-full rounded-lg p-3 outline-none text-sm"
              style={{ border: "1px solid #e0d8cf", color: "#4a3728" }}
              value={reschedDate}
              onChange={(e) => setReschedDate(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                onClick={() => { setReschedRow(null); setReschedDate(""); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#4a3728" }}
                onClick={handleRescheduleSubmit}
                disabled={!reschedDate || busyId === reschedRow.bookingId}
              >
                {busyId === reschedRow.bookingId ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && currentBookings.length > visibleCount && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-[#f3ece4]"
            style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
          >
            Load more ({currentBookings.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}