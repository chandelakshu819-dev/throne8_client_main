// src/features/mentorship/components/admin/SessionsView.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  CalendarClock,
  Clock,
  IndianRupee,
  AlertTriangle,
} from "lucide-react";
import AdminService from "@/lib/api/admin.service";

// ── Interfaces ───────────────────────────────────────────────────

interface SessionPricing {
  basePrice?: number;
  platformFee?: number;
  totalAmount?: number;
  currency?: string;
}

interface SessionPayment {
  status?: string;
  method?: string;
}

interface SessionItem {
  sessionId?: string;
  _id?: string;
  title?: string;
  description?: string;
  sessionType?: string;
  status?: string;
  scheduledAt?: string;
  duration?: number;
  timezone?: string;
  mentorId?: string;
  menteeId?: string;
  isBooked?: boolean;
  bookedBy?: string;
  pricing?: SessionPricing;
  payment?: SessionPayment;
  createdAt?: string;
  // Enriched from aggregation / backend
  mentorName?: string;
  mentorTitle?: string;
  mentorProfilePhoto?: string;
  menteeName?: string;
  bookedMenteeName?: string;
  menteeProfilePhoto?: string;
  mentor?: {
    name?: string | null;
    title?: string | null;
    profilePhotoId?: string | null;
  } | null;
  mentee?: {
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    profilePhotoId?: string | null;
  } | null;
}

// ── Helpers ──────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const inrFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

function formatINR(val: number | undefined | null): string {
  if (val == null) return "—";
  return `₹${inrFormatter.format(val)}`;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatTime(iso: string | undefined): string {
  if (!iso) return "";
  try {
    return timeFormatter.format(new Date(iso));
  } catch {
    return "";
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Status pill colors ───────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  available: { bg: "#e0f2fe", text: "#0369a1" },
  pending: { bg: "#fef3c7", text: "#92400e" },
  confirmed: { bg: "#d1fae5", text: "#065f46" },
  in_progress: { bg: "#dbeafe", text: "#1e40af" },
  completed: { bg: "#dcfce7", text: "#166534" },
  cancelled: { bg: "#fee2e2", text: "#991b1b" },
  rescheduled: { bg: "#fef9c3", text: "#854d0e" },
  no_show: { bg: "#fce7f3", text: "#9d174d" },
  refunded: { bg: "#f3e8ff", text: "#7c3aed" },
  missed: { bg: "#ffedd5", text: "#9a3412" },  
};

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
  no_show: "No Show",
  refunded: "Refunded",
  missed: "Missed",
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  quick_call: "Quick Call",
  deep_dive: "Deep Dive",
  resume_review: "Resume Review",
  mock_interview: "Mock Interview",
  career_planning: "Career Planning",
  portfolio_review: "Portfolio Review",
  ask_query: "Ask Query",
  group_session: "Group Session",
};

// ── Avatar ───────────────────────────────────────────────────────

function UserAvatar({
  name,
  initials,
  className = "w-8 h-8",
}: {
  name: string;
  initials: string;
  className?: string;
}) {
  return (
    <div
      className={`${className} rounded-full flex items-center justify-center font-bold text-xs shrink-0`}
      style={{ backgroundColor: "#f3ece4", color: "#4a3728" }}
      title={name}
    >
      {initials || "U"}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────

export default function SessionsView() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState<number | null>(null);

  // Filters
  const [kindFilter, setKindFilter] = useState("booked");
  const [statusFilter, setStatusFilter] = useState("");
  const [sessionTypeFilter, setSessionTypeFilter] = useState("");

  // Modal
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);

  const requestIdRef = useRef(0);

  const isFiltered = kindFilter !== "booked" || statusFilter !== "" || sessionTypeFilter !== "";

  const fetchSessions = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 20,
        kind: kindFilter,
      };
      if (statusFilter) params.status = statusFilter;
      if (sessionTypeFilter) params.sessionType = sessionTypeFilter;

      const res = await AdminService.getAllSessions(params);
      if (requestId !== requestIdRef.current) return; // stale

      const list = (res.data || []) as SessionItem[];
      const totalCount = res.meta?.total ?? list.length;
      const totalPages = res.meta?.totalPages ?? Math.max(1, Math.ceil(totalCount / 20));

      setSessions(list);
      setTotal(totalCount);
      setPages(totalPages);
      setHasLoaded(true);
    } catch (err: unknown) {
      if (requestId !== requestIdRef.current) return; // stale
      setError(err instanceof Error ? err.message : "Failed to load sessions.");
      setTotal(null);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, kindFilter, statusFilter, sessionTypeFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Escape closes modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedSession(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Filter change resets page
  const handleKindChange = (v: string) => {
    setKindFilter(v);
    setPage(1);
  };
  const handleStatusChange = (v: string) => {
    setStatusFilter(v);
    setPage(1);
  };
  const handleSessionTypeChange = (v: string) => {
    setSessionTypeFilter(v);
    setPage(1);
  };
  const clearFilters = () => {
    setKindFilter("booked");
    setStatusFilter("");
    setSessionTypeFilter("");
    setPage(1);
  };

  // ── Derived ────────────────────────────────────────────────────

  const getMenteeName = (s: SessionItem): string | null => {
    if (s.mentee?.name) return s.mentee.name;
    if (s.mentee?.firstName) {
      return `${s.mentee.firstName} ${s.mentee.lastName || ""}`.trim();
    }
    return s.bookedMenteeName || s.menteeName || null;
  };

  const getMentorName = (s: SessionItem): string => {
    return s.mentor?.name || s.mentorName || "—";
  };

  const getMentorTitle = (s: SessionItem): string | null => {
    return s.mentor?.title || s.mentorTitle || null;
  };

  const isSlot = (s: SessionItem): boolean => {
    return s.status === "available";
  };

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#ece4db]">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Kind filter */}
          <select
            id="sessions-filter-kind"
            value={kindFilter}
            onChange={(e) => handleKindChange(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
          >
            <option value="booked">Booked Sessions</option>
            <option value="slots">Open Slots</option>
            <option value="all">All</option>
          </select>

          {/* Status filter */}
          <select
            id="sessions-filter-status"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>

          {/* Session type filter */}
          <select
            id="sessions-filter-type"
            value={sessionTypeFilter}
            onChange={(e) => handleSessionTypeChange(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
          >
            <option value="">All Types</option>
            {Object.entries(SESSION_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-[#8a7a6a]">
            Total:{" "}
            <span className="font-bold text-[#4a3728]">
              {total !== null && !error ? total : "—"}
            </span>{" "}
            session{total === 1 && !error ? "" : "s"}
          </div>
          <button
            type="button"
            onClick={() => fetchSessions()}
            disabled={loading}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] hover:bg-[#f3ece4] disabled:opacity-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg text-xs bg-red-50 text-red-800 border border-red-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchSessions()}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded-md border border-red-300 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 font-medium transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* First-load spinner */}
      {loading && !hasLoaded ? (
        <div className="bg-white rounded-xl border border-[#ece4db] overflow-hidden">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#7a5c3e]" />
          </div>
        </div>
      ) : error && !hasLoaded ? null : (
        <div className="bg-white rounded-xl border border-[#ece4db] overflow-hidden">
          {!error && sessions.length === 0 && hasLoaded ? (
            <div className="text-center py-16 text-[#8a7a6a] text-sm space-y-2">
              <p>No sessions found.</p>
              {isFiltered && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-[#7a5c3e] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ece4db] bg-[#faf6f1] text-[#7a5c3e]">
                    <th className="py-3 px-4 font-semibold">Session</th>
                    <th className="py-3 px-4 font-semibold">Mentor</th>
                    <th className="py-3 px-4 font-semibold">Mentee</th>
                    <th className="py-3 px-4 font-semibold">Scheduled</th>
                    <th className="py-3 px-4 font-semibold">Duration</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Price</th>
                    <th className="py-3 px-4 font-semibold">Created</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece4db]">
                  {sessions.map((session) => {
                    const menteeName = getMenteeName(session);
                    const menteeInitials = menteeName ? getInitials(menteeName) : "";
                    const statusColor = STATUS_COLORS[session.status || ""] || {
                      bg: "#f3f4f6",
                      text: "#374151",
                    };
                    const typeLabel = SESSION_TYPE_LABELS[session.sessionType || ""] || session.sessionType || "—";

                    return (
                      <tr
                        key={session.sessionId || session._id}
                        className="hover:bg-[#faf6f1]/60 transition-colors"
                      >
                        {/* Session title + type pill */}
                        <td className="py-3.5 px-4 align-top max-w-[220px]">
                          <div className="font-semibold text-[#4a3728] line-clamp-1">
                            {session.title || "Untitled"}
                          </div>
                          <span
                            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
                            style={{
                              backgroundColor: "#f3ece4",
                              color: "#7a5c3e",
                            }}
                          >
                            {typeLabel}
                          </span>
                        </td>

                        {/* Mentor */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-[#4a3728] line-clamp-1 max-w-[150px]">
                            {getMentorName(session)}
                          </div>
                          {getMentorTitle(session) && (
                            <div className="text-[10px] text-[#8a7a6a] line-clamp-1 max-w-[150px]">
                              {getMentorTitle(session)}
                            </div>
                          )}
                        </td>

                        {/* Mentee */}
                        <td className="py-3.5 px-4 align-top">
                          {isSlot(session) || !menteeName ? (
                            <span className="text-[#8a7a6a] italic">Not booked</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <UserAvatar
                                name={menteeName}
                                initials={menteeInitials}
                                className="w-7 h-7"
                              />
                              <span className="font-semibold text-[#4a3728] line-clamp-1 max-w-[120px]">
                                {menteeName}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Scheduled date + time */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="flex items-center gap-1 text-[#4a3728]">
                            <CalendarClock className="w-3 h-3 text-[#8a7a6a]" />
                            <span>{formatDate(session.scheduledAt)}</span>
                          </div>
                          <div className="text-[10px] text-[#8a7a6a]">
                            {formatTime(session.scheduledAt)}
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="flex items-center gap-1 text-[#4a3728]">
                            <Clock className="w-3 h-3 text-[#8a7a6a]" />
                            <span>{session.duration ?? "—"} min</span>
                          </div>
                        </td>

                        {/* Status pill */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <span
                            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: statusColor.bg,
                              color: statusColor.text,
                            }}
                          >
                            {STATUS_LABELS[session.status || ""] || session.status || "—"}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="flex items-center gap-1 font-semibold text-[#4a3728]">
                            <IndianRupee className="w-3 h-3 text-[#8a7a6a]" />
                            <span>{formatINR(session.pricing?.totalAmount)}</span>
                          </div>
                        </td>

                        {/* Created */}
                        <td className="py-3.5 px-4 align-top text-[#8a7a6a] whitespace-nowrap">
                          {formatDate(session.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedSession(session)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#e0d8cf] text-[#4a3728] hover:bg-[#fbf7f3] transition-colors cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3 h-3 text-[#7a5c3e]" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#ece4db] bg-[#faf6f1]">
              <span className="text-xs text-[#8a7a6a]">
                Page {page} of {pages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="p-1 rounded border border-[#e0d8cf] disabled:opacity-40 hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-[#4a3728]" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages || loading}
                  className="p-1 rounded border border-[#e0d8cf] disabled:opacity-40 hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-[#4a3728]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Details Modal ──────────────────────────────────────── */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#ece4db] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#ece4db] flex items-start justify-between bg-[#faf6f1]">
              <div className="flex items-center gap-2.5">
                <CalendarClock className="w-5 h-5 text-[#7a5c3e]" />
                <div>
                  <h3 className="text-base font-bold text-[#4a3728]">Session Details</h3>
                  <p className="text-xs text-[#8a7a6a]">
                    ID:{" "}
                    <code className="text-[#4a3728]">
                      {selectedSession.sessionId || selectedSession._id || "—"}
                    </code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="p-1.5 rounded-lg text-[#8a7a6a] hover:bg-[#ece4db] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Title & description */}
              <div>
                <span className="text-[#8a7a6a] block text-[11px] font-medium">Title</span>
                <span className="font-semibold text-[#4a3728] text-sm">
                  {selectedSession.title || "Untitled"}
                </span>
              </div>
              {selectedSession.description && (
                <div>
                  <span className="text-[#8a7a6a] block text-[11px] font-medium mb-1">Description</span>
                  <p className="text-[#4a3728] leading-relaxed whitespace-pre-wrap bg-[#faf6f1] p-3 rounded-xl border border-[#ece4db]">
                    {selectedSession.description}
                  </p>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 bg-[#faf6f1] p-3 rounded-xl border border-[#ece4db]">
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Mentor</span>
                  <span className="font-semibold text-[#4a3728]">
                    {getMentorName(selectedSession)}
                  </span>
                  {getMentorTitle(selectedSession) && (
                    <div className="text-[10px] text-[#8a7a6a]">{getMentorTitle(selectedSession)}</div>
                  )}
                </div>
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Mentee</span>
                  <span className="font-semibold text-[#4a3728]">
                    {isSlot(selectedSession)
                      ? "Not booked (open slot)"
                      : getMenteeName(selectedSession) || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Session Type</span>
                  <span className="font-semibold text-[#4a3728]">
                    {SESSION_TYPE_LABELS[selectedSession.sessionType || ""] ||
                      selectedSession.sessionType ||
                      "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Status</span>
                  <span
                    className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor:
                        (STATUS_COLORS[selectedSession.status || ""] || { bg: "#f3f4f6" }).bg,
                      color:
                        (STATUS_COLORS[selectedSession.status || ""] || { text: "#374151" }).text,
                    }}
                  >
                    {STATUS_LABELS[selectedSession.status || ""] || selectedSession.status || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Scheduled</span>
                  <span className="font-semibold text-[#4a3728]">
                    {formatDate(selectedSession.scheduledAt)}{" "}
                    {formatTime(selectedSession.scheduledAt)}
                  </span>
                </div>
                <div>
                  <span className="text-[#8a7a6a] block text-[11px]">Duration</span>
                  <span className="font-semibold text-[#4a3728]">
                    {selectedSession.duration ?? "—"} min
                  </span>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="bg-[#faf6f1] p-3 rounded-xl border border-[#ece4db] space-y-2">
                <span className="text-[11px] font-semibold text-[#7a5c3e] flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5" />
                  Pricing Breakdown
                </span>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#8a7a6a] block">Base Price</span>
                    <span className="font-semibold text-[#4a3728]">
                      {formatINR(selectedSession.pricing?.basePrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8a7a6a] block">Platform Fee</span>
                    <span className="font-semibold text-[#4a3728]">
                      {formatINR(selectedSession.pricing?.platformFee)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8a7a6a] block">Total</span>
                    <span className="font-bold text-[#4a3728]">
                      {formatINR(selectedSession.pricing?.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment status */}
              <div className="flex items-start gap-2 bg-amber-50/60 border border-amber-200 p-3 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <span className="text-[#4a3728]">
                    Payment status:{" "}
                    <span className="font-semibold">
                      {selectedSession.payment?.status || "—"}
                    </span>
                  </span>
                  <p className="text-amber-700 mt-0.5">
                    Note: payment.status may not be reliable yet — it stays &quot;pending&quot; for
                    completed sessions (known BUG-16).
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#ece4db] bg-[#faf6f1] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#4a3728] text-white hover:bg-[#38291e] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
