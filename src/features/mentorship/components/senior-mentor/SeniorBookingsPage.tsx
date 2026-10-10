import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Play,
  XCircle,
  X,
  User as UserIcon,
  Eye,
  Download,
} from "lucide-react";
import SeniorSessionService from "@/lib/api/seniorSession.service";
import MenteeLink from "@/features/mentorship/components/shared/MenteeLink";

interface BookingProps {
  seniorData: any;
}

type MentorBookingRow = {
  bookingId: string;
  sessionId: string;
  menteeId: string;
  menteeName: string;
  menteeProfilePhoto: string | null;
  serviceName: string;
  scheduledAt: string;
  slotTime: string;
  status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "upcoming";
  timezone?: string;
  duration?: number;
  amount?: number;
  currency?: string;
  paymentStatus?: string;
  completedAt?: string;
};

type BookingTab = "all" | "pending" | "upcoming" | "in_progress" | "completed";

const tabMeta: Record<BookingTab, { label: string; icon: React.ElementType }> = {
  all: { label: "All Active", icon: Clock },
  pending: { label: "Pending", icon: Clock },
  upcoming: { label: "Upcoming", icon: Calendar },
  in_progress: { label: "In Progress", icon: Play },
  completed: { label: "Completed", icon: CheckCircle2 },
};

const statPalette: Record<string, { bg: string; fg: string }> = {
  amber: { bg: "#fef3c7", fg: "#b45309" },
  green: { bg: "#dcfce7", fg: "#15803d" },
  blue: { bg: "#dbeafe", fg: "#1d4ed8" },
  purple: { bg: "#f3e8ff", fg: "#7c3aed" },
};

const statusBadge: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#fef3c7", fg: "#b45309", label: "Pending" },
  confirmed: { bg: "#dcfce7", fg: "#15803d", label: "Upcoming" },
  in_progress: { bg: "#dbeafe", fg: "#1d4ed8", label: "In Progress" },
  completed: { bg: "#f3e8ff", fg: "#7c3aed", label: "Completed" },
  cancelled: { bg: "#fee2e2", fg: "#dc2626", label: "Cancelled" },
};

export default function SeniorBookingsPage({ seniorData }: BookingProps) {
  const router = useRouter();

  const [bookingTab, setBookingTab] = useState<BookingTab>("all");
  const [allBookings, setAllBookings] = useState<MentorBookingRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => setToast({ message, type });
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Cancel / Reject modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSessionId, setCancelSessionId] = useState<string | null>(null);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsBooking, setDetailsBooking] = useState<MentorBookingRow | null>(null);

  // Reschedule modal
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleSessionId, setRescheduleSessionId] = useState<string | null>(null);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  // Downloading State
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!seniorData?.userId) return;
    setLoadingData(true);

    try {
      const _all = await SeniorSessionService.getMySessions();
      const filtered = _all.filter((s: any) => (s.bookings?.length ?? 0) > 0);

      const flattened: MentorBookingRow[] = filtered.flatMap((s: any) =>
        s.bookings.map((b: any) => ({
          bookingId: b._id || b.id,
          sessionId: s.sessionId,
          menteeId: b.menteeId || b.bookedBy,
          menteeName: b.mentee?.fullName || "Student",
          menteeProfilePhoto: b.mentee?.profilePic || null,
          serviceName: s.title || "Session",
          scheduledAt: b.scheduledAt,
          slotTime: b.slotTime,
          status: b.status || "pending",
          timezone: s.timezone,
          duration: s.duration,
          amount: b.pricing?.totalAmount,
          currency: b.pricing?.currency || "INR",
          paymentStatus: b.payment?.status || "N/A",
          completedAt: b.completedAt || b.updatedAt,
        }))
      );

      const sorted = flattened.sort((a, b) => {
        const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
      });

      setAllBookings(sorted);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      showToast("Failed to load bookings.", "error");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [seniorData?.userId]);

  // Booking categories
  const pendingBookings = allBookings.filter((b) => b.status === "pending" || (b.status as string) === "upcoming");
  const upcomingBookings = allBookings.filter((b) => b.status === "confirmed");
  const inProgressBookings = allBookings.filter((b) => b.status === "in_progress");
  const completedBookings = allBookings.filter((b) => b.status === "completed");

  const getCurrentBookings = () => {
    switch (bookingTab) {
      case "all":
        return allBookings;
      case "pending":
        return pendingBookings;
      case "upcoming":
        return upcomingBookings;
      case "in_progress":
        return inProgressBookings;
      case "completed":
        return completedBookings;
      default:
        return allBookings.filter((b) => b.status !== "completed");
    }
  };

  const currentBookings = useMemo(() => {
    const base = getCurrentBookings();
    if (!searchQuery.trim()) return base;
    const q = searchQuery.trim().toLowerCase();
    return base.filter(
      (b) =>
        b.menteeName?.toLowerCase().includes(q) ||
        b.serviceName?.toLowerCase().includes(q)
    );
  }, [bookingTab, allBookings, searchQuery]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const to12Hour = (part: string): string => {
    const match = part.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (!match) return part;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${period}`;
  };

  const formatSlotRange = (slotTime?: string | null) => {
    if (!slotTime) return "";
    const value = String(slotTime).trim();
    if (!value) return "";
    const parts = value.split("-").map((part) => part.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      return `${to12Hour(parts[0])} - ${to12Hour(parts[1])}`;
    }
    return to12Hour(value);
  };

  const openDetailsModal = (booking: MentorBookingRow) => {
    setDetailsBooking(booking);
    setShowDetailsModal(true);
  };

  const handleDownloadReceipt = async (booking: MentorBookingRow) => {
    setDownloadingId(booking.bookingId);
    try {
      const amount = booking.amount ?? 0;
      const currency = booking.currency || "INR";
      const paymentStatus = booking.paymentStatus || "N/A";
      const completedAt = booking.completedAt ? formatDate(booking.completedAt) : formatDate(booking.scheduledAt);

      const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Session Receipt - ${booking.menteeName || "Student"}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #4a3728; }
  .header { border-bottom: 2px solid #4a3728; padding-bottom: 16px; margin-bottom: 24px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0ebe4; gap: 20px; }
  .label { color: #8a7a6a; font-size: 13px; }
  .value { font-weight: 600; text-align: right; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #f3e8ff; color: #7c3aed; font-size: 12px; font-weight: 600; }
  .total { margin-top: 16px; padding-top: 16px; border-top: 2px solid #4a3728; font-size: 18px; font-weight: 700; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="header"><h2>Session Receipt</h2><span class="badge">Completed</span></div>
  <div class="row"><span class="label">Booking ID</span><span class="value">${booking.bookingId}</span></div>
  <div class="row"><span class="label">Student</span><span class="value">${booking.menteeName}</span></div>
  <div class="row"><span class="label">Mentor</span><span class="value">${seniorData?.firstName || "Mentor"} ${seniorData?.lastName || ""}</span></div>
  <div class="row"><span class="label">Service</span><span class="value">${booking.serviceName}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${formatDate(booking.scheduledAt)}</span></div>
  <div class="row"><span class="label">Time</span><span class="value">${formatSlotRange(booking.slotTime)}</span></div>
  <div class="row"><span class="label">Duration</span><span class="value">${booking.duration ?? "N/A"} min</span></div>
  <div class="row"><span class="label">Payment Status</span><span class="value">${paymentStatus}</span></div>
  <div class="row"><span class="label">Completed On</span><span class="value">${completedAt}</span></div>
  <div class="total"><span>Total Amount</span><span>${currency} ${amount}</span></div>
</body>
</html>`;

      const blob = new Blob([receiptHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${(booking.menteeName || "student").replace(/\s+/g, "_")}-${booking.bookingId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("Receipt downloaded", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to download receipt.", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleSessionId || !rescheduleBookingId || !rescheduleDate || !rescheduleReason.trim()) {
      showToast("Please provide both new date and reason.", "error");
      return;
    }

    setActionLoading(rescheduleSessionId);
    try {
      const scheduledAtISO = new Date(`${rescheduleDate}:00+05:30`).toISOString();

      await SeniorSessionService.rescheduleBooking(
        rescheduleSessionId,
        rescheduleBookingId,
        scheduledAtISO,
        rescheduleReason
      );

      showToast("Session rescheduled successfully", "success");
      setShowRescheduleModal(false);
      setRescheduleDate("");
      setRescheduleReason("");
      setRescheduleSessionId(null);
      setRescheduleBookingId(null);

      await fetchSessions();
      setBookingTab("upcoming");
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || "Failed to reschedule session.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = async (sessionId: string, bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await SeniorSessionService.confirmBooking(sessionId, bookingId);
      showToast("Booking confirmed successfully", "success");
      await fetchSessions();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to confirm booking", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelClick = (sessionId: string, bookingId: string) => {
    setCancelSessionId(sessionId);
    setCancelBookingId(bookingId);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!cancelSessionId || !cancelBookingId) return;
    setActionLoading(cancelBookingId);
    try {
      await SeniorSessionService.cancelBooking(cancelSessionId, cancelBookingId, cancelReason);
      showToast("Booking cancelled successfully", "success");
      await fetchSessions();
      setShowCancelModal(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to cancel booking", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStart = async (sessionId: string, bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await SeniorSessionService.startBooking(sessionId, bookingId);
      showToast("Session started successfully", "success");
      await fetchSessions();
      
      // Navigate to standard session room logic
      router.push(
        `/mentorship/session-room/${encodeURIComponent(sessionId)}?bookingId=${encodeURIComponent(bookingId)}`
      );
    } catch (err: any) {
      showToast(err?.message || "Failed to start session.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (sessionId: string, bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await SeniorSessionService.completeBooking(sessionId, bookingId);
      showToast("Session completed successfully", "success");
      await fetchSessions();
      setBookingTab("completed");
    } catch (err: any) {
      showToast(err?.message || "Failed to complete session.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelSessionId || !cancelBookingId) {
      showToast("Something went wrong. Please try again.", "error");
      return;
    }

    if (!cancelReason.trim()) {
      showToast("Please provide a reason.", "error");
      return;
    }

    setActionLoading(cancelBookingId);

    try {
      await SeniorSessionService.cancelBooking(cancelSessionId, cancelBookingId, cancelReason);
      showToast("Booking cancelled successfully", "success");

      setShowCancelModal(false);
      setCancelReason("");
      setCancelSessionId(null);
      setCancelBookingId(null);

      await fetchSessions();
    } catch (err: any) {
      showToast(err?.message || "Failed to cancel booking.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {toast &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg"
            style={{
              backgroundColor: toast.type === "success" ? "#dcfce7" : "#fee2e2",
              color: toast.type === "success" ? "#15803d" : "#dc2626",
              border: toast.type === "success" ? "1px solid #86efac" : "1px solid #fca5a5",
            }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
            ) : (
              <XCircle className="w-4.5 h-4.5 shrink-0" />
            )}
            <span className="text-sm font-semibold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>,
          document.body
        )}

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#4a3728" }}>
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#4a3728" }}>Senior Bookings</h2>
            <p style={{ color: "#8a7a6a" }} className="text-sm">Manage your 1-to-1 senior sessions</p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {showSearch && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
              <Search className="w-4 h-4" style={{ color: "#8a7a6a" }} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or service..."
                className="bg-transparent outline-none text-sm w-48"
                style={{ color: "#4a3728" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-3.5 h-3.5" style={{ color: "#8a7a6a" }} />
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setShowSearch((v) => !v);
              if (showSearch) setSearchQuery("");
            }}
            className="px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors hover:bg-[#f3ece4]"
            style={{ backgroundColor: showSearch ? "#f3ece4" : "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: pendingBookings.length, icon: Clock, palette: "amber" },
          { label: "Upcoming", value: upcomingBookings.length, icon: Calendar, palette: "green" },
          { label: "In Progress", value: inProgressBookings.length, icon: Play, palette: "blue" },
          { label: "Completed", value: completedBookings.length, icon: CheckCircle2, palette: "purple" },
        ].map((stat, idx) => {
          const c = statPalette[stat.palette];
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl" style={{ border: "1px solid #e0d8cf" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: c.bg }}>
                <stat.icon className="w-4.5 h-4.5" style={{ color: c.fg }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: "#4a3728" }}>{stat.value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "#8a7a6a" }}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* TABS */}
      <div className="bg-white p-1.5 rounded-2xl overflow-x-auto" style={{ border: "1px solid #e0d8cf" }}>
        <div className="flex gap-1.5 min-w-max">
          {(["all", "pending", "upcoming", "in_progress", "completed"] as const).map((tab) => {
            const count =
              tab === "all"
                ? allBookings.length
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
                    style={{ backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "#f3ece4", color: isActive ? "#fff" : "#7a5c3e" }}
                  >
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #e0d8cf" }}>
        <div className="overflow-x-auto">
          {loadingData ? (
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
                  {searchQuery ? "No matching bookings" : `No ${bookingTab.replace("_", " ")} bookings found`}
                </p>
                <p className="text-xs mt-1">{searchQuery ? "Try a different search" : "Bookings will appear here when available"}</p>
             </div>
          ) : (
            <table className="w-full">
              <thead style={{ backgroundColor: "#fbf7f3" }}>
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Student</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Service</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Date</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Time</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Status</th>
                  {bookingTab !== "all" && (
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Actions</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y" style={{ borderColor: "#f0ebe4" }}>
                {currentBookings.map((booking, idx) => {
                  const sb = statusBadge[booking.status] || ((booking.status as string) === "upcoming" ? statusBadge.pending : { bg: "#f3ece4", fg: "#7a5c3e", label: booking.status });
                  const isActionLoading = actionLoading === booking.bookingId;

                  return (
                    <tr key={`${booking.sessionId}-${booking.bookingId}-${idx}`} className="transition-colors hover:bg-[#fbf7f3]">
                      <td className="px-5 py-3.5">
                        <MenteeLink
                          menteeId={booking.menteeId}
                          name={booking.menteeName}
                          avatar={booking.menteeProfilePhoto}
                          avatarSize="w-9 h-9"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#8a7a6a" }}>{booking.serviceName}</td>
                      <td className="px-5 py-3.5">
                          <span className="text-sm font-semibold" style={{ color: "#4a3728" }}>{formatDate(booking.scheduledAt)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {booking.slotTime && (
                           <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold" style={{ backgroundColor: "#f3ece4", color: "#7a5c3e" }}>
                             {formatSlotRange(booking.slotTime)}
                           </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                         <span
                           className="px-2.5 py-1 text-xs font-bold rounded-full inline-flex items-center"
                           style={{ backgroundColor: sb.bg, color: sb.fg }}
                         >
                           {sb.label}
                         </span>
                      </td>
                      {bookingTab !== "all" && (
                        <td className="px-5 py-3.5">
                         <div className="flex items-center gap-2">
                           {(booking.status === "pending" || (booking.status as string) === "upcoming") && (
                              <>
                                <button
                                  onClick={() => handleConfirm(booking.sessionId, booking.bookingId)}
                                  disabled={isActionLoading}
                                  className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors hover:bg-green-600 hover:text-white disabled:opacity-50"
                                  style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
                                >
                                  {isActionLoading ? "..." : "Accept"}
                                </button>
                                <button
                                  onClick={() => {
                                    setCancelSessionId(booking.sessionId);
                                    setCancelBookingId(booking.bookingId);
                                    setShowCancelModal(true);
                                  }}
                                  disabled={isActionLoading}
                                  className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
                                  style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                                >
                                  Decline
                                </button>
                              </>
                           )}
                           {(booking.status === "confirmed") && (
                              <>
                                <button
                                  onClick={() => handleStart(booking.sessionId, booking.bookingId)}
                                  disabled={isActionLoading}
                                  className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 text-white"
                                  style={{ backgroundColor: "#7c3aed" }}
                                >
                                  {isActionLoading ? "Starting..." : "Start"}
                                </button>
                                <button
                                  onClick={() => {
                                    setRescheduleSessionId(booking.sessionId);
                                    setRescheduleBookingId(booking.bookingId);
                                    setShowRescheduleModal(true);
                                  }}
                                  disabled={isActionLoading}
                                  className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 text-white"
                                  style={{ backgroundColor: "#1d4ed8" }}
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleCancelClick(booking.sessionId, booking.bookingId)}
                                  disabled={isActionLoading}
                                  className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
                                  style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                                >
                                  Cancel
                                </button>
                              </>
                           )}
                           {booking.status === "in_progress" && (
                              <button
                                onClick={() => handleComplete(booking.sessionId, booking.bookingId)}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {isActionLoading ? "..." : "End Session"}
                              </button>
                           )}
                           {booking.status === "completed" && (
                              <>
                                <button
                                  onClick={() => openDetailsModal(booking)}
                                  className="p-1.5 rounded-lg transition-colors hover:bg-[#f3ece4]"
                                  style={{ border: "1px solid #e0d8cf" }}
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5" style={{ color: "#7a5c3e" }} />
                                </button>
                                <button
                                  onClick={() => handleDownloadReceipt(booking)}
                                  disabled={downloadingId === booking.bookingId}
                                  className="p-1.5 rounded-lg transition-colors hover:bg-[#f3ece4] disabled:opacity-50"
                                  style={{ border: "1px solid #e0d8cf" }}
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" style={{ color: "#7a5c3e" }} />
                                </button>
                              </>
                           )}
                         </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

       {showCancelModal && (
        <div className="fixed inset-0 z-[9999] p-4 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col pointer-events-auto">
            <h3 className="text-xl font-bold mb-4" style={{ color: "#4a3728" }}>Reject Booking</h3>
            <p className="text-sm mb-4" style={{ color: "#8a7a6a" }}>
               Are you sure you want to decline this booking? This action cannot be undone and will notify the user.
            </p>
            <textarea
               className="w-full h-24 p-3 rounded-xl mb-4 text-sm resize-none outline-none focus:ring-2 focus:ring-[#7a5c3e] border border-[#e0d8cf]"
               placeholder="Reason for cancellation (required)"
               value={cancelReason}
               onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex items-center gap-3 w-full">
              <button
                 onClick={() => {
                   setShowCancelModal(false);
                   setCancelReason("");
                 }}
                 className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={actionLoading !== null || !cancelReason.trim()}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                Reject Booking
              </button>
            </div>
          </div>
    </div>
    )}

      {/* COMPLETED DETAILS MODAL */}
      {showDetailsModal &&
        detailsBooking &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4" style={{ border: "1px solid #e0d8cf" }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#4a3728" }}>Session Details</h3>
              <p className="text-xs mb-4" style={{ color: "#8a7a6a" }}>Completed session summary.</p>

              <div className="space-y-2.5 rounded-xl p-4 mb-4" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
                <div className="flex justify-between text-sm items-center">
                  <span style={{ color: "#8a7a6a" }}>Student</span>
                  <MenteeLink
                    menteeId={detailsBooking.menteeId}
                    name={detailsBooking.menteeName}
                    showAvatar={false}
                    underlineOnHover
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Service</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold">{detailsBooking.serviceName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Date</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold">{formatDate(detailsBooking.scheduledAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Time</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold">{formatSlotRange(detailsBooking.slotTime)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span style={{ color: "#8a7a6a" }}>Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}>
                    Completed
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                  onClick={() => {
                    setShowDetailsModal(false);
                    setDetailsBooking(null);
                  }}
                >
                  Close
                </button>

                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2"
                  style={{ backgroundColor: "#4a3728" }}
                  onClick={() => handleDownloadReceipt(detailsBooking)}
                  disabled={downloadingId === detailsBooking.bookingId}
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingId === detailsBooking.bookingId ? "Downloading..." : "Download Receipt"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4" style={{ border: "1px solid #e0d8cf" }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#4a3728" }}>Reschedule Session</h3>
              <p className="text-xs mb-4" style={{ color: "#8a7a6a" }}>
                Select a new date and provide a reason to reschedule this matching.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1" style={{ color: "#4a3728" }}>
                  New Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7a5c3e] border border-[#e0d8cf]"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-1" style={{ color: "#4a3728" }}>
                  Reason (Required)
                </label>
                <textarea
                  className="w-full h-24 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7a5c3e] border border-[#e0d8cf] resize-none"
                  placeholder="Why are you rescheduling?"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-80"
                  style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setRescheduleDate("");
                    setRescheduleReason("");
                    setRescheduleSessionId(null);
                    setRescheduleBookingId(null);
                  }}
                  disabled={actionLoading !== null}
                >
                  Cancel
                </button>

                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-700"
                  style={{ backgroundColor: "#1d4ed8" }}
                  onClick={handleRescheduleSubmit}
                  disabled={actionLoading !== null || !rescheduleDate || !rescheduleReason.trim()}
                >
                  {actionLoading === rescheduleSessionId ? "Rescheduling..." : "Confirm Reschedule"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

    </div>
  );
}
