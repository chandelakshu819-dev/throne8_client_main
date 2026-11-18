// src/features/mentorship/components/admin/CollegeMentorsView.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  X,
  Search,
  GraduationCap,
  FileText,
  Clock,
} from "lucide-react";
import SeniorMentorApplicationService, {
  ApplicationStatus,
  CollegeMentorApplication,
  CollegeMentorDocumentType,
  CollegeMentorStats,
  isPlaceholderStorageUrl,
} from "@/lib/api/seniorMentorApplication.service";
import { safeUrl, safeLinkedInUrl } from "@/shared/utils/mentorFormat";

interface CollegeMentorsViewProps {
  /** Number of applications waiting for admin action (pending + under review) */
  onPendingCountChange?: (count: number) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

type DatePreset = "all" | "7" | "10" | "30" | "custom";

const DATE_PRESETS: Array<{ key: DatePreset; label: string }> = [
  { key: "all", label: "All time" },
  { key: "7", label: "Last 7 days" },
  { key: "10", label: "Last 10 days" },
  { key: "30", label: "Last 30 days" },
  { key: "custom", label: "Custom range" },
];

// Mirrors backend `Domain` enum (shared/constants/domains.ts)
const EXPERTISE_OPTIONS = [
  "web_development",
  "mobile_development",
  "data_science",
  "machine_learning",
  "devops",
  "cloud_computing",
  "cybersecurity",
  "blockchain",
  "ui_ux_design",
  "product_management",
  "digital_marketing",
  "business_analytics",
  "career_guidance",
  "interview_prep",
  "leadership",
];

const ROLE_LABELS: Record<string, string> = {
  senior_mentor: "Senior mentor",
  alumni: "Alumni",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const prettify = (value?: string) => (value ? value.replace(/_/g, " ") : "—");

const toInputDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const daysAgoLabel = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case ApplicationStatus.VERIFIED:
      return { label: "Verified", bg: "#d1fae5", text: "#065f46" };
    case ApplicationStatus.PENDING:
      return { label: "Pending", bg: "#fbf1dc", text: "#b8860b" };
    case ApplicationStatus.UNDER_REVIEW:
      return { label: "Under review", bg: "#e0e7ff", text: "#3730a3" };
    case ApplicationStatus.REJECTED:
      return { label: "Rejected", bg: "#fee2e2", text: "#991b1b" };
    default:
      return { label: status, bg: "#f3ece4", text: "#4a3728" };
  }
};

const canReview = (status: string) =>
  status === ApplicationStatus.PENDING || status === ApplicationStatus.UNDER_REVIEW;

function Avatar({ url, name, className = "w-9 h-9" }: { url?: string | null; name: string; className?: string }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => setImgError(false), [url]);

  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "M";

  if (url && !imgError) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={url}
        alt={name}
        loading="lazy"
        onError={() => setImgError(true)}
        className={`${className} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${className} rounded-full flex items-center justify-center font-bold text-xs shrink-0`}
      style={{ backgroundColor: "#f3ece4", color: "#4a3728" }}
    >
      {initials}
    </div>
  );
}

function TagList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <span className="text-[#8a7a6a]">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="px-2.5 py-1 rounded-lg font-medium bg-[#f3ece4] text-[#4a3728] capitalize"
        >
          {prettify(item)}
        </span>
      ))}
    </div>
  );
}

/** Resume / Proof: asks the backend for a signed URL, then opens the real document. */
function DocButton({
  seniorMentorId,
  type,
  label,
  color,
  fallbackUrl,
}: {
  seniorMentorId: string;
  type: CollegeMentorDocumentType;
  label: string;
  color: string;
  /** Stored document URL, used if the backend has no signed-URL route. */
  fallbackUrl?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const open = async () => {
    setErr("");
    setBusy(true);
    // Open the tab on click so popup blockers don't stop it.
    const tab = window.open("", "_blank");
    try {
      const url = await SeniorMentorApplicationService.adminGetDocumentUrl(seniorMentorId, type, fallbackUrl);
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        window.open(url, "_blank", "noopener");
      }
    } catch (e: any) {
      tab?.close();
      setErr(e?.message || "Could not open document");
    } finally {
      setBusy(false);
    }
  };

  if (isPlaceholderStorageUrl(fallbackUrl)) {
    return (
      <div className="flex flex-col">
        <button
          type="button"
          disabled
          title="This file was never stored, so it cannot be opened."
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e0d8cf] opacity-60 cursor-not-allowed"
          style={{ color }}
        >
          <span>{label}</span>
          <FileText className="w-3 h-3" />
        </button>
        <span className="text-[10px] mt-1 text-[#b45309]">
          File not available - applicant needs to re-upload.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e0d8cf] hover:bg-[#fbf7f3] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ color }}
      >
        <span>{label}</span>
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
      </button>
      {err && <span className="text-[10px] mt-1 text-red-600">{err}</span>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-bold text-[#4a3728] mb-1.5 uppercase text-[11px] tracking-wider">{children}</h4>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CollegeMentorsView({ onPendingCountChange }: CollegeMentorsViewProps) {
  const [items, setItems] = useState<CollegeMentorApplication[]>([]);
  const [stats, setStats] = useState<CollegeMentorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [expertiseFilter, setExpertiseFilter] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState<number | null>(null);

  const [selected, setSelected] = useState<CollegeMentorApplication | null>(null);
  const [rejecting, setRejecting] = useState<CollegeMentorApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const hasDateFilter = Boolean(fromDate || toDate);
  const invalidRange = Boolean(fromDate && toDate && fromDate > toDate);
  const hasAnyFilter = Boolean(
    searchQuery || statusFilter || roleFilter || expertiseFilter || hasDateFilter
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await SeniorMentorApplicationService.adminStats();
      setStats(s);
      onPendingCountChange?.((s?.pending ?? 0) + (s?.under_review ?? 0));
    } catch {
      // Stats are informational; the list still works without them
      setStats(null);
    }
  }, [onPendingCountChange]);

  const fetchList = useCallback(async () => {
    if (fromDate && toDate && fromDate > toDate) return;
    setLoading(true);
    setError(null);
    try {
      // Local-day boundaries -> ISO so IST users get correct day cut-offs
      const fromIso = fromDate ? new Date(`${fromDate}T00:00:00`).toISOString() : undefined;
      const toIso = toDate ? new Date(`${toDate}T23:59:59.999`).toISOString() : undefined;

      const res = await SeniorMentorApplicationService.adminList({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        mentorRole: roleFilter || undefined,
        primaryExpertise: expertiseFilter || undefined,
        search: debouncedSearch || undefined,
        from: fromIso,
        to: toIso,
      });

      let list = res.data || [];
      let totalCount = res.meta?.total ?? res.pagination?.total ?? list.length;
      let totalPages =
        res.meta?.totalPages ?? res.pagination?.totalPages ?? Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

      // Safety net: older backend builds ignore `from` / `to` / `mentorRole`
      // and return everything. Re-apply them here so the table always matches
      // the selected filters. A no-op when the backend already filtered.
      if (fromIso || toIso || roleFilter) {
        const fromMs = fromIso ? new Date(fromIso).getTime() : -Infinity;
        const toMs = toIso ? new Date(toIso).getTime() : Infinity;
        const matching = list.filter((app) => {
          const t = new Date(app.createdAt).getTime();
          const inRange = !isNaN(t) && t >= fromMs && t <= toMs;
          const roleOk = !roleFilter || app.mentorRole === roleFilter;
          return inRange && roleOk;
        });
        if (matching.length !== list.length) {
          list = matching;
          totalCount = matching.length;
          totalPages = 1;
        }
      }

      setItems(list);
      setTotal(totalCount);
      setPages(totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load college mentors.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, roleFilter, expertiseFilter, debouncedSearch, fromDate, toDate]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Escape closes modals
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || actionLoadingId) return;
      if (rejecting) {
        setRejecting(null);
        setRejectReason("");
      } else if (selected) {
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actionLoadingId, rejecting, selected]);

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    setPage(1);
    if (preset === "all") {
      setFromDate("");
      setToDate("");
    } else if (preset !== "custom") {
      const from = new Date();
      from.setDate(from.getDate() - Number(preset));
      setFromDate(toInputDate(from));
      setToDate(toInputDate(new Date()));
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setRoleFilter("");
    setExpertiseFilter("");
    setDatePreset("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const refreshAll = () => {
    void fetchList();
    void fetchStats();
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const runAction = async (
    app: CollegeMentorApplication,
    action: () => Promise<CollegeMentorApplication>,
    successMessage: string,
    failureMessage: string
  ): Promise<boolean> => {
    setActionLoadingId(app.seniorMentorId);
    setActionSuccess(null);
    setError(null);
    try {
      const updated = await action();
      setActionSuccess(successMessage);
      setTimeout(() => setActionSuccess(null), 4000);

      if (updated) {
        setItems((prev) =>
          prev.map((m) => (m.seniorMentorId === app.seniorMentorId ? { ...m, ...updated } : m))
        );
        setSelected((prev) =>
          prev && prev.seniorMentorId === app.seniorMentorId ? { ...prev, ...updated } : prev
        );
      }
      refreshAll();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : failureMessage);
      return false;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApprove = (app: CollegeMentorApplication) =>
    runAction(
      app,
      () => SeniorMentorApplicationService.adminApprove(app.seniorMentorId),
      `${app.fullName} approved.`,
      "Failed to approve application."
    );

  const handleUnderReview = (app: CollegeMentorApplication) =>
    runAction(
      app,
      () => SeniorMentorApplicationService.adminMarkUnderReview(app.seniorMentorId),
      `${app.fullName} marked as under review.`,
      "Failed to update application."
    );

  const handleConfirmReject = async () => {
    if (!rejecting) return;
    const reason = rejectReason.trim();
    if (reason.length < 5) {
      setError("Rejection reason must be at least 5 characters.");
      return;
    }
    const ok = await runAction(
      rejecting,
      () => SeniorMentorApplicationService.adminReject(rejecting.seniorMentorId, reason),
      `${rejecting.fullName} rejected.`,
      "Failed to reject application."
    );
    if (ok) {
      setRejecting(null);
      setRejectReason("");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const statCards: Array<{ label: string; value: number | undefined }> = [
    { label: "Total", value: stats?.total },
    { label: "Pending", value: stats ? stats.pending + stats.under_review : undefined },
    { label: "Verified", value: stats?.verified },
    { label: "Rejected", value: stats?.rejected },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-[#ece4db] px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#a3907e]">
              {card.label}
            </div>
            <div className="text-2xl font-bold text-[#4a3728] mt-1">
              {card.value != null ? card.value : "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#ece4db]">
        <div className="flex flex-col gap-1 flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a6a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, college, skills..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
            />
          </div>
          <span className="text-[10px] text-[#8a7a6a] pl-1">
            Searches name, college, degree, company and skills
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#4a3728]">
            Status:
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none font-normal"
            >
              <option value="">All statuses</option>
              <option value={ApplicationStatus.PENDING}>Pending</option>
              <option value={ApplicationStatus.UNDER_REVIEW}>Under review</option>
              <option value={ApplicationStatus.VERIFIED}>Verified</option>
              <option value={ApplicationStatus.REJECTED}>Rejected</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#4a3728]">
            Role:
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none font-normal"
            >
              <option value="">All roles</option>
              <option value="senior_mentor">Senior mentor</option>
              <option value="alumni">Alumni</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#4a3728]">
            Expertise:
            <select
              value={expertiseFilter}
              onChange={(e) => {
                setExpertiseFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none font-normal capitalize"
            >
              <option value="">All domains</option>
              {EXPERTISE_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {prettify(d)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#4a3728]">
            From:
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDatePreset("custom");
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none font-normal"
            />
          </label>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#4a3728]">
            To:
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => {
                setToDate(e.target.value);
                setDatePreset("custom");
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none font-normal"
            />
          </label>

          <button
            type="button"
            onClick={refreshAll}
            disabled={loading}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] hover:bg-[#f3ece4] disabled:opacity-50 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Applied-date quick ranges */}
        <div className="w-full flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-[#8a7a6a]">Applied:</span>
          {DATE_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.key)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                datePreset === p.key
                  ? "bg-[#4a3728] text-white border-[#4a3728]"
                  : "bg-[#fbf7f3] text-[#5c4a3a] border-[#e0d8cf] hover:bg-[#f3ece4]"
              }`}
            >
              {p.label}
            </button>
          ))}
          {hasAnyFilter && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[11px] text-[#7a5c3e] hover:underline font-semibold"
            >
              Clear filters
            </button>
          )}
          {hasDateFilter && !error && total !== null && !invalidRange && (
            <span className="ml-auto text-[11px] text-[#8a7a6a]">
              <span className="font-bold text-[#4a3728]">{total}</span> applied
              {fromDate && toDate
                ? ` between ${formatDate(`${fromDate}T00:00:00`)} and ${formatDate(`${toDate}T00:00:00`)}`
                : fromDate
                ? ` since ${formatDate(`${fromDate}T00:00:00`)}`
                : ` until ${formatDate(`${toDate}T00:00:00`)}`}
            </span>
          )}
          {invalidRange && (
            <span className="ml-auto text-[11px] text-red-700">
              &quot;From&quot; date must be before &quot;To&quot; date.
            </span>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-lg text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg text-xs bg-red-50 text-red-800 border border-red-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={refreshAll}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded-md border border-red-300 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 font-medium shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {loading && items.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#ece4db] flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#7a5c3e]" />
        </div>
      ) : error && items.length === 0 ? null : (
        <div className="bg-white rounded-xl border border-[#ece4db] overflow-hidden">
          {items.length === 0 ? (
            <div className="text-center py-16 text-[#8a7a6a] text-sm space-y-2">
              <GraduationCap className="w-8 h-8 mx-auto text-[#c0b0a0]" />
              <div>
                {hasAnyFilter
                  ? "No college mentors found matching your filters."
                  : "No college mentor applications yet."}
              </div>
              {hasAnyFilter && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-[#7a5c3e] hover:underline font-semibold"
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
                    <th className="py-3 px-4 font-semibold">Mentor</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">College and degree</th>
                    <th className="py-3 px-4 font-semibold">Expertise</th>
                    <th className="py-3 px-4 font-semibold">Applied on</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece4db]">
                  {items.map((app) => {
                    const badge = getStatusBadge(app.verificationStatus);
                    const busy = actionLoadingId === app.seniorMentorId;
                    const subline =
                      app.currentRole
                        ? `${app.currentRole}${app.currentCompany ? ` at ${app.currentCompany}` : ""}`
                        : app.fieldOfStudy;

                    return (
                      <tr key={app.seniorMentorId} className="hover:bg-[#fdfbf9] transition-colors">
                        <td className="py-3.5 px-4 align-top">
                          <button
                            type="button"
                            onClick={() => setSelected(app)}
                            className="flex items-center gap-3 text-left group cursor-pointer"
                            aria-label={`View details for ${app.fullName}`}
                          >
                            <Avatar url={app.profilePhoto} name={app.fullName} />
                            <div>
                              <div className="font-semibold text-[#4a3728] group-hover:underline">
                                {app.fullName}
                              </div>
                              <div className="text-[11px] text-[#8a7a6a] line-clamp-1">{subline}</div>
                            </div>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 align-top whitespace-nowrap text-[#4a3728]">
                          {ROLE_LABELS[app.mentorRole] ?? app.mentorRole}
                        </td>
                        <td className="py-3.5 px-4 align-top max-w-[220px]">
                          <div className="font-medium text-[#4a3728]">{app.college}</div>
                          <div className="text-[11px] text-[#8a7a6a]">
                            {app.degree}, {app.graduationYear}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top text-[#4a3728] capitalize">
                          {prettify(app.primaryExpertise)}
                        </td>
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="font-medium text-[#4a3728]">{formatDate(app.createdAt)}</div>
                          <div className="text-[10px] text-[#8a7a6a]">{daysAgoLabel(app.createdAt)}</div>
                        </td>
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <span
                            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                            style={{ backgroundColor: badge.bg, color: badge.text }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          {busy ? (
                            <Loader2 className="w-4 h-4 animate-spin inline-block text-[#7a5c3e]" />
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelected(app)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#e0d8cf] text-[#4a3728] hover:bg-[#fbf7f3]"
                              >
                                <Eye className="w-3 h-3 text-[#7a5c3e]" />
                                <span>View</span>
                              </button>
                              {canReview(app.verificationStatus) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(app)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejecting(app);
                                      setRejectReason("");
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>Reject</span>
                                  </button>
                                </>
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
          )}

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#ece4db] bg-[#faf6f1]">
              <span className="text-xs text-[#8a7a6a]">
                Page {page} of {pages}
                {total !== null ? ` · ${total} mentor${total === 1 ? "" : "s"}` : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="p-1 rounded border border-[#e0d8cf] disabled:opacity-40 hover:bg-white"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 text-[#4a3728]" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages || loading}
                  className="p-1 rounded border border-[#e0d8cf] disabled:opacity-40 hover:bg-white"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4 text-[#4a3728]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#ece4db] shadow-2xl flex flex-col">
            <div className="p-6 border-b border-[#ece4db] flex items-start justify-between bg-[#faf6f1] sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Avatar url={selected.profilePhoto} name={selected.fullName} className="w-11 h-11" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-[#4a3728]">{selected.fullName}</h3>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                      style={{
                        backgroundColor: getStatusBadge(selected.verificationStatus).bg,
                        color: getStatusBadge(selected.verificationStatus).text,
                      }}
                    >
                      {getStatusBadge(selected.verificationStatus).label}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-[#f3ece4] text-[#4a3728]">
                      {ROLE_LABELS[selected.mentorRole] ?? selected.mentorRole}
                    </span>
                  </div>
                  <p className="text-xs text-[#8a7a6a] mt-0.5">
                    {selected.degree} in {selected.fieldOfStudy} at {selected.college}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-[#f3ece4] text-[#8a7a6a]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "College", value: selected.college },
                  { label: "Degree", value: `${selected.degree}, ${selected.fieldOfStudy}` },
                  { label: "Graduation year", value: String(selected.graduationYear) },
                  {
                    label: "Experience",
                    value:
                      selected.yearsOfExperience != null
                        ? `${selected.yearsOfExperience} yrs (${prettify(selected.experienceLevel)})`
                        : prettify(selected.experienceLevel),
                  },
                  {
                    label: "Current role",
                    value: selected.currentRole
                      ? `${selected.currentRole}${selected.currentCompany ? `, ${selected.currentCompany}` : ""}`
                      : "—",
                  },
                  { label: "Applied on", value: formatDate(selected.createdAt) },
                  {
                    label: "Profile completion",
                    value: selected.profileCompletion != null ? `${selected.profileCompletion}%` : "—",
                  },
                  { label: "Primary expertise", value: prettify(selected.primaryExpertise) },
                ].map((m) => (
                  <div key={m.label} className="p-3 rounded-xl border border-[#ece4db] bg-[#fbf7f3]">
                    <div className="text-[#8a7a6a] mb-1">{m.label}</div>
                    <div className="font-semibold text-[#4a3728] capitalize">{m.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <SectionTitle>Biography</SectionTitle>
                <div className="p-4 rounded-xl border border-[#ece4db] bg-[#faf6f1] text-[#5c4a3a] leading-relaxed whitespace-pre-wrap">
                  {selected.shortBio || "No biography provided."}
                </div>
              </div>

              <div>
                <SectionTitle>Help areas</SectionTitle>
                <TagList items={selected.helpAreas} />
              </div>

              <div>
                <SectionTitle>Skills</SectionTitle>
                <TagList items={selected.otherSkills} />
              </div>

              <div>
                <SectionTitle>Technologies</SectionTitle>
                <TagList items={selected.technologies} />
              </div>

              <div>
                <SectionTitle>Achievements</SectionTitle>
                <TagList items={selected.achievements} />
              </div>

              <div>
                <SectionTitle>Certifications</SectionTitle>
                <TagList items={selected.certifications} />
              </div>

              <div>
                <SectionTitle>Why become a mentor</SectionTitle>
                <div className="p-4 rounded-xl border border-[#ece4db] bg-[#faf6f1] text-[#5c4a3a] leading-relaxed whitespace-pre-wrap">
                  {selected.motivation || "—"}
                </div>
              </div>

              <div>
                <SectionTitle>Advice to junior self</SectionTitle>
                <div className="p-4 rounded-xl border border-[#ece4db] bg-[#faf6f1] text-[#5c4a3a] leading-relaxed whitespace-pre-wrap">
                  {selected.adviceToJuniorSelf || "—"}
                </div>
              </div>

              <div>
                <SectionTitle>Links and documents</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "LinkedIn", url: selected.linkedinUrl, color: "#2563eb", icon: ExternalLink },
                    { label: "GitHub", url: selected.githubUrl, color: "#4a3728", icon: ExternalLink },
                    { label: "Portfolio", url: selected.portfolioUrl, color: "#0f766e", icon: ExternalLink },
                  ].map((link) => {
                    const href = link.label === "LinkedIn" ? safeLinkedInUrl(link.url) : safeUrl(link.url);
                    if (!href) return null;
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e0d8cf] hover:bg-[#fbf7f3]"
                        style={{ color: link.color }}
                      >
                        <span>{link.label}</span>
                        <Icon className="w-3 h-3" />
                      </a>
                    );
                  })}
                  {selected.resumeUrl && (
                    <DocButton seniorMentorId={selected.seniorMentorId} type="resume" label="Resume" color="#7a5c3e" fallbackUrl={selected.resumeUrl} />
                  )}
                  {selected.proofDocumentUrl && (
                    <DocButton seniorMentorId={selected.seniorMentorId} type="proof" label="Proof document" color="#7a5c3e" fallbackUrl={selected.proofDocumentUrl} />
                  )}
                </div>
              </div>

              <div>
                <SectionTitle>Verification</SectionTitle>
                <div className="p-4 rounded-xl border border-[#ece4db] bg-[#fbf7f3] text-[#5c4a3a] space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#8a7a6a]" />
                    <span>
                      Status: <strong>{getStatusBadge(selected.verificationStatus).label}</strong>
                    </span>
                  </div>
                  <div>
                    Reviewed on: {selected.verifiedAt ? formatDate(selected.verifiedAt) : "Not yet"}
                  </div>
                  {selected.rejectionReason && (
                    <div className="text-red-700">Rejection reason: {selected.rejectionReason}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#ece4db] bg-[#faf6f1] flex items-center justify-between sticky bottom-0">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#e0d8cf] text-[#5c4a3a] hover:bg-white text-xs font-medium"
              >
                Close
              </button>

              {canReview(selected.verificationStatus) && (
                <div className="flex items-center gap-2">
                  {selected.verificationStatus === ApplicationStatus.PENDING && (
                    <button
                      type="button"
                      onClick={() => handleUnderReview(selected)}
                      disabled={actionLoadingId === selected.seniorMentorId}
                      className="px-3.5 py-2 rounded-lg border border-[#e0d8cf] text-[#4a3728] hover:bg-white text-xs font-semibold disabled:opacity-50"
                    >
                      Mark under review
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setRejecting(selected);
                      setRejectReason("");
                    }}
                    disabled={actionLoadingId === selected.seniorMentorId}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selected)}
                    disabled={actionLoadingId === selected.seniorMentorId}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionLoadingId === selected.seniorMentorId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    <span>Approve</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject dialog */}
      {rejecting && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#ece4db] shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#4a3728]">Reject application</h3>
                <p className="text-xs text-[#8a7a6a] mt-0.5">
                  Mentor: <span className="font-semibold text-[#4a3728]">{rejecting.fullName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRejecting(null);
                  setRejectReason("");
                }}
                className="p-1 rounded-lg hover:bg-[#f3ece4] text-[#8a7a6a]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4a3728] mb-1.5">
                Reason (required) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Tell the applicant why this application was rejected..."
                rows={3}
                maxLength={500}
                className="w-full text-xs p-3 rounded-xl border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
              />
              <div className="flex items-center justify-between text-[10px] text-[#8a7a6a] mt-1">
                <span>Minimum 5 characters</span>
                <span>{rejectReason.trim().length}/500</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ece4db]">
              <button
                type="button"
                onClick={() => {
                  setRejecting(null);
                  setRejectReason("");
                }}
                disabled={actionLoadingId === rejecting.seniorMentorId}
                className="px-3.5 py-1.5 rounded-lg border border-[#e0d8cf] text-[#5c4a3a] hover:bg-[#fbf7f3] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={
                  rejectReason.trim().length < 5 || actionLoadingId === rejecting.seniorMentorId
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoadingId === rejecting.seniorMentorId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>Confirm rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
