import React, { useState } from "react";
import {
  CalendarClock,
  Clock,
  Video,
  MapPin,
  Bookmark,
  Receipt,
  FileText
} from "lucide-react";

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
  faint: "#a08070",
  danger: "#dc2626",
  dangerWash: "#fef2f2",
  success: "#15803d",
  successWash: "#f0fdf4",
  warning: "#b45309",
  warningWash: "#fffbeb",
};

type Session = {
  _id?: string;
  sessionId?: string;
  mentorName?: string;
  mentorProfilePhoto?: string;
  title?: string;
  sessionType?: string;
  scheduledAt?: string;
  startTime?: string;
  status?: string;
  duration?: number;
  pricing?: {
    totalAmount?: number;
    currency?: string;
  };
  payment?: {
    status?: string;
  };
  invoiceUrl?: string;
  receiptUrl?: string;
};

interface Props {
  sessions?: Session[];
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
  if (parts.length === 0) return "S";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

type TabType = "upcoming" | "completed" | "cancelled" | "pending";

export default function UserDashboardMyBookingsPage({ sessions = [] }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const now = Date.now();

  const filteredSessions = sessions.filter((s) => {
    const status = (s.status || "").toLowerCase();
    const t = new Date(s.startTime || s.scheduledAt || 0).getTime();
    const isPast = t < now && t > 0;

    switch (activeTab) {
      case "upcoming":
        return (status === "confirmed" || status === "upcoming" || (status === "pending" && !isPast)) && status !== "cancelled" && status !== "completed" && !isPast;
      case "completed":
        return status === "completed";
      case "cancelled":
        return status === "cancelled" || status === "refunded";
      case "pending":
        return status === "pending";
      default:
        return false;
    }
  }).sort((a, b) => {
    const ta = new Date(a.startTime || a.scheduledAt || 0).getTime();
    const tb = new Date(b.startTime || b.scheduledAt || 0).getTime();
    if (activeTab === "completed" || activeTab === "cancelled") {
      return tb - ta; // Descending for past
    }
    return ta - tb; // Ascending for upcoming
  });

  const getStatusBadgeStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed") return { bg: COLORS.successWash, text: COLORS.success, border: "transparent" };
    if (s === "cancelled" || s === "refunded") return { bg: COLORS.dangerWash, text: COLORS.danger, border: "transparent" };
    if (s === "pending") return { bg: COLORS.warningWash, text: COLORS.warning, border: "transparent" };
    if (s === "confirmed" || s === "upcoming") return { bg: "#eff6ff", text: "#1d4ed8", border: "transparent" };
    return { bg: COLORS.chip, text: COLORS.accent, border: "transparent" };
  };

  const getPaymentBadgeStyles = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed" || s === "paid" || s === "success") return { bg: COLORS.successWash, text: COLORS.success };
    if (s === "pending") return { bg: COLORS.warningWash, text: COLORS.warning };
    if (s === "failed" || s === "refunded") return { bg: COLORS.dangerWash, text: COLORS.danger };
    return { bg: COLORS.chip, text: COLORS.muted };
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          My Bookings
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          Track and manage all your mentorship sessions and bookings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {(["upcoming", "completed", "cancelled", "pending"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap capitalize border ${
              activeTab === tab
                ? "bg-white shadow-sm"
                : "bg-transparent border-transparent hover:bg-white/50"
            }`}
            style={{
              color: activeTab === tab ? COLORS.ink : COLORS.muted,
              borderColor: activeTab === tab ? COLORS.hairline : "transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {filteredSessions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <Bookmark className="w-8 h-8" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>No {activeTab} bookings</h3>
            <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
              You don't have any {activeTab} bookings at the moment.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSessions.map((s, idx) => {
            const name = s.mentorName || "Mentor";
            const photo = s.mentorProfilePhoto;
            const isOnline = !s.sessionType || s.sessionType.toLowerCase() === "virtual" || s.sessionType.toLowerCase() === "online";
            const bookingId = s.sessionId || s._id || `BK-${idx}`;
            const amount = s.pricing?.totalAmount;
            const currency = s.pricing?.currency || "INR";
            const paymentStatus = s.payment?.status;
            const statusStyles = getStatusBadgeStyles(s.status || "Unknown");
            const paymentStyles = getPaymentBadgeStyles(paymentStatus);
            const invoiceLink = s.invoiceUrl || s.receiptUrl;

            return (
              <div
                key={bookingId}
                className="flex flex-col lg:flex-row items-start gap-4 p-5 rounded-2xl transition-shadow hover:shadow-sm bg-white"
                style={{ border: `1px solid ${COLORS.hairline}` }}
              >
                {/* Mentor Info */}
                <div className="flex items-start gap-3 w-full lg:w-[260px] shrink-0">
                  {photo ? (
                    <img
                      src={photo}
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover shrink-0 mt-1"
                      style={{ border: `1px solid ${COLORS.hairline}` }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-base font-bold text-white mt-1"
                      style={{ backgroundColor: COLORS.ink }}
                    >
                      {initialsFrom(name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: COLORS.ink }}>
                      {name}
                    </p>
                    <p className="text-xs truncate mt-0.5 mb-2" style={{ color: COLORS.muted }}>
                      Mentor
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex flex-col gap-1 text-[10px]">
                        <span className="text-gray-500 font-medium">BOOKING ID</span>
                        <span className="font-mono text-gray-700 truncate" title={bookingId}>
                          {bookingId.length > 18 ? bookingId.substring(0, 15) + '...' : bookingId}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session & Date */}
                <div className="w-full lg:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:px-4 lg:border-l" style={{ borderColor: COLORS.hairline }}>
                  <div className="space-y-3">
                    <p className="text-sm font-bold line-clamp-2" style={{ color: COLORS.ink }} title={s.title || "Mentorship Session"}>
                      {s.title || "Mentorship Session"}
                    </p>
                    <div className="flex items-center gap-2">
                       <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                        style={{ backgroundColor: statusStyles.bg, color: statusStyles.text }}
                      >
                        {s.status || "Scheduled"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 sm:pt-0">
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.ink }}>
                      <CalendarClock className="w-3.5 h-3.5 shrink-0" style={{ color: COLORS.muted }} />
                      <span>{formatDateStr(s.startTime || s.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.ink }}>
                      <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: COLORS.muted }} />
                      <span>
                        {formatTimeStr(s.startTime || s.scheduledAt)}
                        {s.duration ? ` (${s.duration} min)` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.muted }}>
                      {isOnline ? (
                        <Video className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{isOnline ? "Online Meeting" : "In Person"}</span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex flex-col gap-4 shrink-0 w-full lg:w-[180px] lg:border-l lg:pl-4 pt-4 lg:pt-0 border-t lg:border-t-0 mt-2 lg:mt-0" style={{ borderColor: COLORS.hairline }}>
                  
                  {/* Amount / Payment info */}
                  <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-start gap-2">
                    {amount !== undefined && amount !== null ? (
                      <div>
                         <p className="text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.muted }}>Amount</p>
                         <p className="text-base font-bold" style={{ color: COLORS.ink }}>{formatCurrency(amount, currency)}</p>
                      </div>
                    ) : (
                       <p className="text-xs italic" style={{ color: COLORS.muted }}>No price info</p>
                    )}
                    
                    {paymentStatus && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 mt-1"
                            style={{ backgroundColor: paymentStyles.bg, color: paymentStyles.text }}>
                        {paymentStatus}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mt-auto">
                    {invoiceLink && (
                      <a
                        href={invoiceLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:border-[#c9baa9] text-center"
                        style={{ backgroundColor: "transparent", color: COLORS.muted, border: `1px solid ${COLORS.hairline}` }}
                      >
                        <Receipt className="w-3 h-3" />
                        Invoice
                      </a>
                    )}
                    <button
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-[#8b7355] shadow-sm text-center"
                      style={{ backgroundColor: COLORS.ink, color: "#fff" }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
