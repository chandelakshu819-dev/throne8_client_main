// src/features/mentorship/components/admin/CommunityReportsView.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import CommunityService from "@/lib/api/community.service";

interface CommunityReportsViewProps {
  onReportCountChange?: (count: number) => void;
}

export default function CommunityReportsView({ onReportCountChange }: CommunityReportsViewProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await CommunityService.listCommunityReports({
        page,
        limit: 15,
        status: statusFilter ? (statusFilter as any) : undefined,
      });

      setReports(res.items || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
      setPage(res.page || 1);

      if (statusFilter === "pending") {
        onReportCountChange?.(res.total || 0);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load community reports.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, onReportCountChange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (reportId: string, newStatus: "resolved" | "dismissed") => {
    setActionLoadingId(reportId);
    setActionSuccess(null);
    try {
      await CommunityService.updateReportStatus(reportId, newStatus);
      setActionSuccess(`Report marked as ${newStatus}.`);

      // Optimistically update local list
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status: newStatus } : r))
      );

      // Auto clear message
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update report status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case "spam":
        return { label: "Spam", bg: "#fef3c7", text: "#92400e" };
      case "harassment":
        return { label: "Harassment", bg: "#fee2e2", text: "#991b1b" };
      case "inappropriate":
        return { label: "Inappropriate", bg: "#fce7f3", text: "#9d174d" };
      default:
        return { label: "Other", bg: "#f3ece4", text: "#4a3728" };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#ece4db]">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#4a3728]">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none"
          >
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="">All Statuses</option>
          </select>
        </div>

        <div className="text-xs font-medium text-[#8a7a6a]">
          Total: <span className="font-bold text-[#4a3728]">{total}</span> reports
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-lg text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
          {actionSuccess}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg text-xs bg-red-50 text-red-800 border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports Table / Card List */}
      <div className="bg-white rounded-xl border border-[#ece4db] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#7a5c3e]" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-[#8a7a6a] text-sm">
            No {statusFilter ? statusFilter : ""} community reports found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#ece4db] bg-[#faf6f1] text-[#7a5c3e]">
                  <th className="py-3 px-4 font-semibold">Target</th>
                  <th className="py-3 px-4 font-semibold">Content Preview</th>
                  <th className="py-3 px-4 font-semibold">Reason & Note</th>
                  <th className="py-3 px-4 font-semibold">Reporter</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece4db]">
                {reports.map((report) => {
                  const reasonBadge = getReasonBadge(report.reason);
                  const isUpdating = actionLoadingId === report._id;
                  const threadId = report.targetType === "forum" ? report.targetId : report.forumId;

                  return (
                    <tr key={report._id} className="hover:bg-[#fdfbf9] transition-colors">
                      {/* Target type */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                          style={{
                            backgroundColor: report.targetType === "forum" ? "#e0e7ff" : "#fef3c7",
                            color: report.targetType === "forum" ? "#3730a3" : "#92400e",
                          }}
                        >
                          {report.targetType === "forum" ? "Thread" : "Reply"}
                        </span>
                      </td>

                      {/* Content Preview */}
                      <td className="py-3.5 px-4 align-top max-w-xs">
                        {report.threadTopic && (
                          <div className="font-semibold text-[#4a3728] truncate mb-1">
                            {report.threadTopic}
                          </div>
                        )}
                        <p className="text-[#5c4a3a] line-clamp-2 italic">
                          &ldquo;{report.contentPreview || "No preview available"}&rdquo;
                        </p>
                        {threadId && (
                          <Link
                            href={`/mentorship/community/forum/${threadId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] text-[#7a5c3e] hover:underline mt-1.5"
                          >
                            <span>Open Thread</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </td>

                      {/* Reason & Note */}
                      <td className="py-3.5 px-4 align-top max-w-[200px]">
                        <span
                          className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: reasonBadge.bg, color: reasonBadge.text }}
                        >
                          {reasonBadge.label}
                        </span>
                        {report.note && (
                          <p className="text-[11px] text-[#8a7a6a] mt-1 line-clamp-2">
                            {report.note}
                          </p>
                        )}
                      </td>

                      {/* Reporter */}
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-semibold text-[#4a3728]">
                          {report.reporter?.name || "Community Member"}
                        </p>
                        <p className="text-[10px] text-[#8a7a6a]">
                          {report.reporter?.email || report.reporterId}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 align-top text-[#8a7a6a] whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                          style={{
                            backgroundColor:
                              report.status === "pending"
                                ? "#fee2e2"
                                : report.status === "resolved"
                                ? "#d1fae5"
                                : "#f3ece4",
                            color:
                              report.status === "pending"
                                ? "#991b1b"
                                : report.status === "resolved"
                                ? "#065f46"
                                : "#8a7a6a",
                          }}
                        >
                          {report.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin inline-block text-[#7a5c3e]" />
                        ) : report.status === "pending" ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(report._id, "resolved")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                              title="Resolve report"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Resolve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(report._id, "dismissed")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                              title="Dismiss report"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Dismiss</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(
                                report._id,
                                report.status === "resolved" ? "dismissed" : "resolved"
                              )
                            }
                            className="text-[11px] text-[#7a5c3e] hover:underline cursor-pointer"
                          >
                            Mark {report.status === "resolved" ? "Dismissed" : "Resolved"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
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
    </div>
  );
}
