//src/features/mentorship/components/dashboard/BookingsPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Eye,
  Users,
  Download,
  Play,
  RotateCw,
  XCircle,
  Check,
  X,
} from "lucide-react";
import SessionService from "@/lib/api/session.service";
import ProfileService from "@/lib/api/profile.service";
import { useSocket } from "@/core/realtime/useSocket";

interface BookingProps {
  mentorData: any;
}

// A single accepted participant inside a grouped group-session row.
type GroupParticipant = {
  menteeId: string;
  menteeName: string;
  menteeProfilePhoto: string | null;
  attendanceStatus: "registered" | "attended" | "absent" | "cancelled" | string;
  registeredAt?: string;
};

type MentorBookingRow = {
  bookingId: string;
  sessionId: string;
  menteeId?: string;
  menteeName: string;
  menteeProfilePhoto: string | null;
  serviceName: string;
  scheduledAt: string;
  slotTime: string;
  // distinguishes a 1:1 booking row from a group-session row (both a
  // still-PENDING join request and an already-ACCEPTED, grouped session)
  isGroupSession?: boolean;
  status:
    | "pending"
    | "confirmed"
    | "rescheduled"
    | "in_progress"
    | "completed"
    | "cancelled";
  // ✅ NEW: present only on grouped (accepted) group-session rows — one
  // row per session, carrying the full accepted-participant list instead
  // of the table spawning a duplicate row per student.
  enrolledCount?: number;
  maxParticipants?: number;
  participants?: GroupParticipant[];
};

type BookingTab =
  | "all"
  | "pending"
  | "upcoming"
  | "in_progress"
  | "completed";

const tabMeta: Record<
  BookingTab,
  { label: string; icon: React.ElementType }
> = {
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

const statusBadge: Record<
  string,
  { bg: string; fg: string; label: string }
> = {
  rescheduled: { bg: "#fed7aa", fg: "#c2410c", label: "Rescheduled" },
  pending: { bg: "#fef3c7", fg: "#b45309", label: "Pending" },
  confirmed: { bg: "#dcfce7", fg: "#15803d", label: "Upcoming" },
  in_progress: { bg: "#dbeafe", fg: "#1d4ed8", label: "In Progress" },
  completed: { bg: "#f3e8ff", fg: "#7c3aed", label: "Completed" },
  cancelled: { bg: "#fee2e2", fg: "#dc2626", label: "Cancelled" },
};

export default function BookingsPage({ mentorData }: BookingProps) {
  const router = useRouter();

  const [bookingTab, setBookingTab] = useState<BookingTab>("all");
  const [allBookings, setAllBookings] = useState<MentorBookingRow[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
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

  // Cancel / Reject modal (cancelling a confirmed session, declining a
  // pending group join request, or cancelling a whole group session)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSessionId, setCancelSessionId] = useState<string | null>(null);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Reschedule modal
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleSessionId, setRescheduleSessionId] = useState<string | null>(null);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  // Start Session modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [startModalBooking, setStartModalBooking] = useState<MentorBookingRow | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  // Details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsBooking, setDetailsBooking] = useState<MentorBookingRow | null>(null);

  // ✅ NEW: Participants modal — "View Participants" on a grouped group
  // session row.
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participantsModalTitle, setParticipantsModalTitle] = useState("");
  const [participantsModalList, setParticipantsModalList] = useState<GroupParticipant[]>([]);

  const openParticipantsModal = (booking: MentorBookingRow) => {
    setParticipantsModalTitle(booking.serviceName);
    setParticipantsModalList(booking.participants || []);
    setShowParticipantsModal(true);
  };

  // ✅ NEW: Attendance modal — shown before completing a group session so
  // the mentor can mark who actually attended, instead of everyone being
  // silently marked "attended".
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceBooking, setAttendanceBooking] = useState<MentorBookingRow | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});

  const openAttendanceModal = (booking: MentorBookingRow) => {
    const initial: Record<string, boolean> = {};
    (booking.participants || []).forEach((p) => {
      initial[p.menteeId] = true; // default: attended
    });
    setAttendanceMap(initial);
    setAttendanceBooking(booking);
    setShowAttendanceModal(true);
  };

  const toggleAttendance = (menteeId: string) => {
    setAttendanceMap((prev) => ({ ...prev, [menteeId]: !prev[menteeId] }));
  };

  // Receipt
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch mentor sessions: 1:1 bookings + accepted group-session rows
  // (grouped, one row per session) + still-PENDING group join requests
  // (one row per request), merged into one row shape so tabs/stat cards
  // work uniformly.
  const fetchSessions = async () => {
    if (!mentorData?.mentorId) return;
    setLoadingData(true);

    return Promise.all([
      SessionService.getMentorSessions(mentorData.mentorId),
      SessionService.getMentorGroupSessionParticipants().catch((err) => {
        console.error("Failed to fetch group session bookings:", err);
        return { data: [] } as any;
      }),
      SessionService.getMentorGroupJoinRequests().catch((err) => {
        console.error("Failed to fetch group join requests:", err);
        return { data: [] } as any;
      }),
    ])
      .then(([sessionsRes, groupRes, groupRequestsRes]) => {
        const _all = sessionsRes.data as any[];
        const filtered = _all.filter((s) => (s.bookings?.length ?? 0) > 0);

        const flattened: MentorBookingRow[] = filtered.flatMap((s: any) =>
          s.bookings.map((b: any) => ({
            bookingId: b._id,
            sessionId: s.sessionId,
            menteeId: b.menteeId,
            menteeName:
              b.mentee?.fullName || s.bookedMenteeName || s.menteeName || b.bookedBy || "Student",
            menteeProfilePhoto: b.mentee?.profilePic || s.menteeProfilePhoto || null,
            serviceName: s.title || s.sessionType || "Session",
            scheduledAt: b.scheduledAt || s.scheduledAt,
            slotTime: b.slotTime || s.slotTime,
            status: b.status,
            isGroupSession: false,
          }))
        );

        // ✅ NEW SHAPE: accepted group-session rows now come back grouped
        // — one row per session, with a `participants[]` array and
        // `enrolledCount`/`maxParticipants` instead of a flat per-mentee
        // row. No top-level menteeId/menteeName on these anymore.
        const groupRows: MentorBookingRow[] = ((groupRes?.data as any[]) || []).map((g: any) => ({
          bookingId: g.sessionId,
          sessionId: g.sessionId,
          menteeId: undefined,
          menteeName: "",
          menteeProfilePhoto: null,
          serviceName: g.serviceName,
          scheduledAt: g.scheduledAt,
          slotTime: "",
          status: g.status,
          isGroupSession: true,
          enrolledCount: g.enrolledCount,
          maxParticipants: g.maxParticipants,
          participants: g.participants || [],
        }));

        // Still-pending group join requests stay one row per request —
        // the mentor accepts/rejects each individually.
        const groupRequestRows: MentorBookingRow[] = ((groupRequestsRes?.data as any[]) || []).map(
          (g: any) => ({
            bookingId: `${g.sessionId}-${g.menteeId}-request`,
            sessionId: g.sessionId,
            menteeId: g.menteeId,
            menteeName: g.menteeName || "Student",
            menteeProfilePhoto: null,
            serviceName: g.sessionTitle ? `${g.sessionTitle} (Group Session)` : "Group Session",
            scheduledAt: g.scheduledAt,
            slotTime: "",
            status: "pending",
            isGroupSession: true,
          })
        );

        const combined = [...flattened, ...groupRows, ...groupRequestRows];

        const sorted = combined.sort((a, b) => {
          const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
          const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
          return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
        });

        setAllBookings(sorted);
      })
      .catch((err) => {
        console.error("Failed to fetch sessions:", err);
        showToast("Failed to load bookings.", "error");
      })
      .finally(() => setLoadingData(false));
  };

  useEffect(() => {
    fetchSessions();
  }, [mentorData?.mentorId]);

  // Socket: session ended from another tab/device
  const { sessionEnded } = useSocket();
  useEffect(() => {
    if (!sessionEnded) return;
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEnded]);

  // Load profile photos — now also pulls from each grouped row's
  // `participants[]`, not just top-level menteeId/menteeProfilePhoto.
  useEffect(() => {
    const mappings: { menteeId: string; photoId: string }[] = [];

    allBookings.forEach((b) => {
      if (b.menteeId && b.menteeProfilePhoto && !photoUrls[b.menteeId]) {
        mappings.push({ menteeId: b.menteeId, photoId: b.menteeProfilePhoto });
      }
      (b.participants || []).forEach((p) => {
        if (p.menteeId && p.menteeProfilePhoto && !photoUrls[p.menteeId]) {
          mappings.push({ menteeId: p.menteeId, photoId: p.menteeProfilePhoto });
        }
      });
    });

    const uniqueMappings = Array.from(new Map(mappings.map((m) => [m.menteeId, m])).values());
    if (uniqueMappings.length === 0) return;

    Promise.all(
      uniqueMappings.map((m) =>
        ProfileService.getProfilePhotoById(m.photoId)
          .then((res: any) => ({ id: m.menteeId, url: res?.data?.photo?.cloudinarySecureUrl }))
          .catch(() => ({ id: m.menteeId, url: null }))
      )
    ).then((results) => {
      setPhotoUrls((prev) => {
        const newMap = { ...prev };
        results.forEach(({ id, url }) => {
          if (url) newMap[id] = url;
        });
        return newMap;
      });
    });
  }, [allBookings]);

  // Booking categories
  const pendingBookings = allBookings.filter((b) => b.status === "pending");
  const upcomingBookings = allBookings.filter((b) => b.status === "confirmed" || b.status === "rescheduled");
  const inProgressBookings = allBookings.filter((b) => b.status === "in_progress");
  const completedBookings = allBookings.filter((b) => b.status === "completed");

  const getCurrentBookings = () => {
    switch (bookingTab) {
      case "all":
        return allBookings.filter((b) => b.status !== "completed");
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
        b.serviceName?.toLowerCase().includes(q) ||
        (b.participants || []).some((p) => p.menteeName?.toLowerCase().includes(q))
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

  const formatTime = (booking: MentorBookingRow) => {
    if (booking.slotTime) {
      const formattedSlot = formatSlotRange(booking.slotTime);
      if (formattedSlot) return formattedSlot;
    }
    if (!booking.scheduledAt) return "N/A";
    const date = new Date(booking.scheduledAt);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const handleConfirm = async (sessionId: string, bookingId?: string) => {
    setActionLoading(sessionId);
    try {
      const bookingRow = allBookings.find((b) => b.sessionId === sessionId && b.bookingId === bookingId);

      if (bookingRow?.isGroupSession) {
        if (!bookingRow.menteeId) {
          showToast("Could not identify the join request.", "error");
          return;
        }
        await SessionService.acceptGroupJoinRequest(sessionId, bookingRow.menteeId);
        showToast("Join request accepted", "success");
      } else {
        await SessionService.confirmSession(sessionId, bookingId);
        showToast("Booking confirmed successfully", "success");
      }

      await fetchSessions();
      setBookingTab("upcoming");
    } catch (err: any) {
      showToast(err?.message || "Failed to confirm booking.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const openStartModal = (booking: MentorBookingRow) => {
    setStartError(null);
    setStartModalBooking(booking);
    setShowStartModal(true);
  };

  const confirmStartSession = async () => {
    if (!startModalBooking) return;
    const { sessionId, bookingId, isGroupSession } = startModalBooking;

    setActionLoading(sessionId);
    setStartError(null);

    try {
      if (isGroupSession) {
        await SessionService.startGroupSession(sessionId);
        showToast("Group session started", "success");
        setShowStartModal(false);
        setStartModalBooking(null);
        await fetchSessions();
        return;
      }

      const res: any = await SessionService.startSession(sessionId, bookingId);
      const roomId = res?.data?.roomId || bookingId;

      showToast("Session started", "success");
      setShowStartModal(false);
      setStartModalBooking(null);

      router.push(
        `/mentorship/mentor-session?sessionId=${encodeURIComponent(sessionId)}&roomId=${encodeURIComponent(
          roomId
        )}&bookingId=${encodeURIComponent(bookingId)}&role=mentor`
      );
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to start session.";
      setStartError(message);
      showToast(message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const openDetailsModal = (booking: MentorBookingRow) => {
    setDetailsBooking(booking);
    setShowDetailsModal(true);
  };

  const handleDownloadReceipt = async (booking: MentorBookingRow) => {
    setDownloadingId(booking.bookingId);
    try {
      const res: any = await SessionService.getSessionReceipt(booking.sessionId, booking.bookingId);
      const r = res.data;
      const amount = r.pricing?.totalAmount ?? 0;
      const currency = r.pricing?.currency || "INR";
      const paymentStatus = r.payment?.status || "N/A";
      const completedAt = r.completedAt ? formatDate(r.completedAt) : formatDate(booking.scheduledAt);

      const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Session Receipt - ${r.menteeName || "Student"}</title>
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
  <div class="row"><span class="label">Booking ID</span><span class="value">${r.bookingId || booking.bookingId}</span></div>
  <div class="row"><span class="label">Student</span><span class="value">${r.menteeName || booking.menteeName}</span></div>
  <div class="row"><span class="label">Mentor</span><span class="value">${r.mentorName || "Mentor"}</span></div>
  <div class="row"><span class="label">Service</span><span class="value">${r.title || booking.serviceName}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${formatDate(r.scheduledAt || booking.scheduledAt)}</span></div>
  <div class="row"><span class="label">Time</span><span class="value">${r.slotTime ? formatSlotRange(r.slotTime) : formatTime(booking)}</span></div>
  <div class="row"><span class="label">Duration</span><span class="value">${r.duration ?? "N/A"} min</span></div>
  <div class="row"><span class="label">Payment Status</span><span class="value">${paymentStatus}</span></div>
  <div class="row"><span class="label">Completed On</span><span class="value">${completedAt}</span></div>
  <div class="total"><span>Total Amount</span><span>${currency} ${amount}</span></div>
</body>
</html>`;

      const blob = new Blob([receiptHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${(r.menteeName || booking.menteeName || "student").replace(/\s+/g, "_")}-${
        r.bookingId || booking.bookingId
      }.html`;
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

  // Complete a 1:1 booking OR a group session. `attendees` (menteeIds who
  // actually attended) is only meaningful for group sessions — the
  // Attendance modal supplies it before this gets called for a group row.
  const handleEnd = async (sessionId: string, bookingId?: string, attendees?: string[]) => {
    setActionLoading(sessionId);
    try {
      const bookingRow = allBookings.find((b) => b.sessionId === sessionId && b.bookingId === bookingId);

      if (bookingRow?.isGroupSession) {
        await SessionService.completeGroupSession(sessionId, {
          wasSuccessful: true,
          ...(attendees ? { attendees } : {}),
        });
      } else {
        await SessionService.completeSession(sessionId, { wasSuccessful: true, bookingId });
      }

      showToast("Session completed", "success");
      await fetchSessions();
      setBookingTab("completed");
    } catch (err: any) {
      showToast(err?.message || "Failed to complete session.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Router for the "End Session" button: group rows go through the
  // Attendance modal first; 1:1 rows complete immediately as before.
  const handleEndSessionClick = (booking: MentorBookingRow) => {
    if (booking.isGroupSession) {
      openAttendanceModal(booking);
    } else {
      handleEnd(booking.sessionId, booking.bookingId);
    }
  };

  const confirmAttendanceAndComplete = async () => {
    if (!attendanceBooking) return;
    const attendees = (attendanceBooking.participants || [])
      .filter((p) => attendanceMap[p.menteeId])
      .map((p) => p.menteeId);

    await handleEnd(attendanceBooking.sessionId, attendanceBooking.bookingId, attendees);

    setShowAttendanceModal(false);
    setAttendanceBooking(null);
  };

  const handleCancelSubmit = async () => {
    if (!cancelSessionId) {
      showToast("Something went wrong. Please try again.", "error");
      return;
    }

    const bookingRow = allBookings.find(
      (b) => b.sessionId === cancelSessionId && b.bookingId === cancelBookingId
    );

    const isPendingGroupRequest = bookingRow?.isGroupSession && bookingRow.status === "pending" && !bookingRow.participants;

    if (!isPendingGroupRequest && !cancelReason.trim()) {
      showToast("Please provide a reason.", "error");
      return;
    }

    setActionLoading(cancelSessionId);

    try {
      if (isPendingGroupRequest) {
        if (!bookingRow?.menteeId) {
          showToast("Could not identify the join request.", "error");
          return;
        }
        await SessionService.rejectGroupJoinRequest(cancelSessionId, bookingRow.menteeId);
        showToast("Join request declined", "success");
      } else if (bookingRow?.isGroupSession) {
        await SessionService.cancelGroupSession(cancelSessionId, cancelReason);
        showToast("Session cancelled successfully", "success");
      } else {
        if (!cancelBookingId) {
          showToast("Please provide a reason.", "error");
          return;
        }
        await SessionService.cancelSession(cancelSessionId, cancelReason, cancelBookingId);
        showToast("Session cancelled successfully", "success");
      }

      setShowCancelModal(false);
      setCancelReason("");
      setCancelSessionId(null);
      setCancelBookingId(null);

      await fetchSessions();
    } catch (err: any) {
      showToast(err?.message || "Failed to process request.", "error");
    } finally {
      setActionLoading(null);
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

      await SessionService.rescheduleSession(
        rescheduleSessionId,
        scheduledAtISO,
        rescheduleReason,
        rescheduleBookingId
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
      showToast(err?.message || "Failed to reschedule session.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* TOAST */}
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
            <h2 className="text-2xl font-bold" style={{ color: "#4a3728" }}>Bookings</h2>
            <p style={{ color: "#8a7a6a" }} className="text-sm">Manage your sessions</p>
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
                ? allBookings.filter((b) => b.status !== "completed").length
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
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y" style={{ borderColor: "#f0ebe4" }}>
                {currentBookings.map((booking, idx) => {
                  const resolvedPhoto = booking.menteeId ? photoUrls[booking.menteeId] : null;
                  const sb = statusBadge[booking.status] ?? statusBadge.pending;
                  const isGroupedRow = !!booking.participants; // accepted, session-level row

                  return (
                    <tr key={`${booking.sessionId}-${booking.bookingId}-${idx}`} className="transition-colors hover:bg-[#fbf7f3]">
                      {/* Student */}
                      <td className="px-5 py-3.5">
                        {isGroupedRow ? (
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: "#7c3aed" }}
                            >
                              <Users className="w-4 h-4" />
                            </div>
                            <span
                              className="px-2 py-1 rounded-full text-xs font-bold"
                              style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}
                            >
                              {booking.enrolledCount}/{booking.maxParticipants} Enrolled
                            </span>
                            <button
                              onClick={() => openParticipantsModal(booking)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-[#f3ece4]"
                              style={{ border: "1px solid #e0d8cf" }}
                              title="View Participants"
                            >
                              <Eye className="w-3.5 h-3.5" style={{ color: "#7a5c3e" }} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {resolvedPhoto ? (
                              <img
                                src={resolvedPhoto}
                                alt={booking.menteeName}
                                className="w-9 h-9 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                                }}
                              />
                            ) : null}

                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${resolvedPhoto ? "hidden" : ""}`}
                              style={{ backgroundColor: "#4a3728" }}
                            >
                              {booking.menteeName?.[0]?.toUpperCase() ?? "?"}
                            </div>

                            <span className="text-sm font-semibold" style={{ color: "#4a3728" }}>{booking.menteeName}</span>

                            {booking.isGroupSession && (
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}
                              >
                                Group
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Service */}
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#8a7a6a" }}>{booking.serviceName}</td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#8a7a6a" }}>{formatDate(booking.scheduledAt)}</td>

                      {/* Time */}
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#8a7a6a" }}>{formatTime(booking)}</td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: sb.bg, color: sb.fg }}
                        >
                          {sb.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5">
                          {/* Pending — only real pending join-request rows land here */}
                          {bookingTab === "pending" && (
                            <>
                              <button
                                onClick={() => handleConfirm(booking.sessionId, booking.bookingId)}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
                              >
                                <Check className="w-3.5 h-3.5" />
                                {actionLoading === booking.sessionId ? "..." : "Accept"}
                              </button>

                              <button
                                onClick={() => {
                                  setCancelSessionId(booking.sessionId);
                                  setCancelBookingId(booking.bookingId);
                                  setShowCancelModal(true);
                                }}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </>
                          )}

                          {/* Upcoming */}
                          {bookingTab === "upcoming" && (
                            <>
                              <button
                                onClick={() => openStartModal(booking)}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
                              >
                                <Play className="w-3.5 h-3.5" />
                                Start
                              </button>

                              {/* Reschedule not supported for group sessions yet */}
                              {!booking.isGroupSession && (
                                <button
                                  onClick={() => {
                                    setRescheduleSessionId(booking.sessionId);
                                    setRescheduleBookingId(booking.bookingId);
                                    setShowRescheduleModal(true);
                                  }}
                                  disabled={actionLoading === booking.sessionId}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                                  style={{ backgroundColor: "#fed7aa", color: "#c2410c" }}
                                >
                                  <RotateCw className="w-3.5 h-3.5" />
                                  Reschedule
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setCancelSessionId(booking.sessionId);
                                  setCancelBookingId(booking.bookingId);
                                  setShowCancelModal(true);
                                }}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            </>
                          )}

                          {/* In Progress */}
                          {bookingTab === "in_progress" && (
                            <button
                              onClick={() => handleEndSessionClick(booking)}
                              disabled={actionLoading === booking.sessionId}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-50"
                              style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {actionLoading === booking.sessionId ? "..." : "End Session"}
                            </button>
                          )}

                          {/* Completed */}
                          {bookingTab === "completed" && (
                            <>
                              {isGroupedRow ? (
                                <button
                                  onClick={() => openParticipantsModal(booking)}
                                  className="p-1.5 rounded-lg transition-colors hover:bg-[#f3ece4]"
                                  style={{ border: "1px solid #e0d8cf" }}
                                  title="View Participants"
                                >
                                  <Eye className="w-3.5 h-3.5" style={{ color: "#7a5c3e" }} />
                                </button>
                              ) : (
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
                            </>
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

      {/* CANCEL / REJECT MODAL */}
      {showCancelModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4" style={{ border: "1px solid #e0d8cf" }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: "#4a3728" }}>
                {allBookings.find((b) => b.sessionId === cancelSessionId && b.bookingId === cancelBookingId)?.status === "pending"
                  ? "Decline Join Request"
                  : "Confirm Cancellation"}
              </h3>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#8a7a6a" }}>
                  Reason (optional for join requests)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg p-3 outline-none text-sm"
                  style={{ border: "1px solid #e0d8cf", backgroundColor: "#fbf7f3", color: "#4a3728" }}
                  placeholder="e.g. Scheduling conflict, emergency, etc."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelSessionId(null);
                    setCancelBookingId(null);
                    setCancelReason("");
                  }}
                >
                  Go Back
                </button>

                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: "#dc2626" }}
                  onClick={handleCancelSubmit}
                  disabled={actionLoading === cancelSessionId}
                >
                  {actionLoading === cancelSessionId ? "Processing..." : "Confirm"}
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
              <h3 className="text-lg font-bold mb-4" style={{ color: "#4a3728" }}>Reschedule Session</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#8a7a6a" }}>New Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg p-3 outline-none text-sm"
                    style={{ border: "1px solid #e0d8cf", color: "#4a3728" }}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#8a7a6a" }}>Reason</label>
                  <input
                    type="text"
                    className="w-full rounded-lg p-3 outline-none text-sm"
                    style={{ border: "1px solid #e0d8cf", backgroundColor: "#fbf7f3", color: "#4a3728" }}
                    placeholder="Reason for rescheduling"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setRescheduleSessionId(null);
                    setRescheduleBookingId(null);
                    setRescheduleDate("");
                    setRescheduleReason("");
                  }}
                >
                  Cancel
                </button>

                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: "#4a3728" }}
                  onClick={handleRescheduleSubmit}
                  disabled={actionLoading === rescheduleSessionId}
                >
                  {actionLoading === rescheduleSessionId ? "Processing..." : "Confirm Reschedule"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* START SESSION MODAL */}
      {showStartModal &&
        startModalBooking &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4" style={{ border: "1px solid #e0d8cf" }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#4a3728" }}>Session Details</h3>
              <p className="text-xs mb-4" style={{ color: "#8a7a6a" }}>
                {startModalBooking.isGroupSession
                  ? "Review the group session before starting it."
                  : "Review the session before starting the video call."}
              </p>

              <div className="space-y-2.5 rounded-xl p-4 mb-4" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Session Title</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold">{startModalBooking.serviceName}</span>
                </div>

                {startModalBooking.isGroupSession ? (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#8a7a6a" }}>Enrolled</span>
                    <span style={{ color: "#4a3728" }} className="font-semibold">
                      {startModalBooking.enrolledCount}/{startModalBooking.maxParticipants}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#8a7a6a" }}>Mentee</span>
                    <span style={{ color: "#4a3728" }} className="font-semibold">{startModalBooking.menteeName}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Date</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold">{formatDate(startModalBooking.scheduledAt)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Time</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold">{formatTime(startModalBooking)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Status</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold capitalize">{startModalBooking.status.replace("_", " ")}</span>
                </div>
              </div>

              {startError && (
                <div className="text-xs font-semibold rounded-lg px-3 py-2 mb-4" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
                  {startError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                  onClick={() => {
                    setShowStartModal(false);
                    setStartModalBooking(null);
                    setStartError(null);
                  }}
                  disabled={actionLoading === startModalBooking.sessionId}
                >
                  Cancel
                </button>

                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2"
                  style={{ backgroundColor: "#1d4ed8", opacity: actionLoading === startModalBooking.sessionId ? 0.6 : 1 }}
                  onClick={confirmStartSession}
                  disabled={actionLoading === startModalBooking.sessionId}
                >
                  <Play className="w-3.5 h-3.5" />
                  {actionLoading === startModalBooking.sessionId ? "Starting..." : "Start Session"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* COMPLETED DETAILS MODAL (1:1 only) */}
      {showDetailsModal &&
        detailsBooking &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4" style={{ border: "1px solid #e0d8cf" }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#4a3728" }}>Session Details</h3>
              <p className="text-xs mb-4" style={{ color: "#8a7a6a" }}>Completed session summary.</p>

              <div className="space-y-2.5 rounded-xl p-4 mb-4" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8a7a6a" }}>Student</span>
                  <span style={{ color: "#4a3728" }} className="font-semibold">{detailsBooking.menteeName}</span>
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
                  <span style={{ color: "#4a3728" }} className="font-semibold">{formatTime(detailsBooking)}</span>
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

      {/* ✅ NEW: PARTICIPANTS MODAL */}
      {showParticipantsModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4 max-h-[80vh] flex flex-col" style={{ border: "1px solid #e0d8cf" }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#4a3728" }}>{participantsModalTitle}</h3>
              <p className="text-xs mb-4" style={{ color: "#8a7a6a" }}>
                {participantsModalList.length} accepted participant{participantsModalList.length === 1 ? "" : "s"}
              </p>

              <div className="space-y-2 overflow-y-auto flex-1">
                {participantsModalList.length === 0 ? (
                  <p className="text-sm" style={{ color: "#8a7a6a" }}>No accepted participants yet.</p>
                ) : (
                  participantsModalList.map((p) => {
                    const photo = photoUrls[p.menteeId];
                    return (
                      <div
                        key={p.menteeId}
                        className="flex items-center gap-3 rounded-xl p-2.5"
                        style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
                      >
                        {photo ? (
                          <img src={photo} alt={p.menteeName} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: "#4a3728" }}
                          >
                            {p.menteeName?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <span className="text-sm font-semibold flex-1" style={{ color: "#4a3728" }}>{p.menteeName}</span>
                        {p.attendanceStatus && p.attendanceStatus !== "registered" && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                            style={{
                              backgroundColor: p.attendanceStatus === "attended" ? "#dcfce7" : "#fee2e2",
                              color: p.attendanceStatus === "attended" ? "#15803d" : "#dc2626",
                            }}
                          >
                            {p.attendanceStatus}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end mt-5">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                  onClick={() => setShowParticipantsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ✅ NEW: ATTENDANCE MODAL (End Session flow for group sessions) */}
      {showAttendanceModal &&
        attendanceBooking &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4 max-h-[80vh] flex flex-col" style={{ border: "1px solid #e0d8cf" }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#4a3728" }}>Mark Attendance</h3>
              <p className="text-xs mb-4" style={{ color: "#8a7a6a" }}>
                {attendanceBooking.serviceName} — uncheck anyone who didn't attend before completing.
              </p>

              <div className="space-y-2 overflow-y-auto flex-1">
                {(attendanceBooking.participants || []).map((p) => {
                  const photo = photoUrls[p.menteeId];
                  const checked = !!attendanceMap[p.menteeId];
                  return (
                    <label
                      key={p.menteeId}
                      className="flex items-center gap-3 rounded-xl p-2.5 cursor-pointer"
                      style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAttendance(p.menteeId)}
                        className="w-4 h-4 shrink-0"
                      />

                      {photo ? (
                        <img src={photo} alt={p.menteeName} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: "#4a3728" }}
                        >
                          {p.menteeName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}

                      <span className="text-sm font-semibold flex-1" style={{ color: "#4a3728" }}>{p.menteeName}</span>

                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: checked ? "#dcfce7" : "#fee2e2",
                          color: checked ? "#15803d" : "#dc2626",
                        }}
                      >
                        {checked ? "Attended" : "Absent"}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                  onClick={() => {
                    setShowAttendanceModal(false);
                    setAttendanceBooking(null);
                  }}
                  disabled={actionLoading === attendanceBooking.sessionId}
                >
                  Cancel
                </button>

                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2"
                  style={{ backgroundColor: "#7c3aed" }}
                  onClick={confirmAttendanceAndComplete}
                  disabled={actionLoading === attendanceBooking.sessionId}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {actionLoading === attendanceBooking.sessionId ? "Completing..." : "Complete Session"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}