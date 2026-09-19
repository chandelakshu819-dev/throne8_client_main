"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Users, Clock, CheckCircle2, XCircle, Check, X } from "lucide-react";
import MentorService from "@/lib/api/mentorship.service";

interface Props {
  mentorData: any;
}

type WaitTab = "waiting" | "approved" | "removed";

const TAB_STATUSES: Record<WaitTab, string[]> = {
  waiting: ["active"],
  approved: ["notified", "booked"],
  removed: ["cancelled", "expired"],
};

const TAB_META: Record<WaitTab, { label: string; icon: React.ElementType }> = {
  waiting: { label: "Waiting", icon: Clock },
  approved: { label: "Approved", icon: CheckCircle2 },
  removed: { label: "Removed", icon: XCircle },
};

const badge: Record<string, { bg: string; fg: string; label: string }> = {
  active: { bg: "#fef3c7", fg: "#b45309", label: "Waiting" },
  notified: { bg: "#dcfce7", fg: "#15803d", label: "Approved" },
  booked: { bg: "#f3e8ff", fg: "#7c3aed", label: "Booked" },
  cancelled: { bg: "#fee2e2", fg: "#dc2626", label: "Removed" },
  expired: { bg: "#f0ebe4", fg: "#8a7a6a", label: "Expired" },
};

export default function WaitlistPage({ mentorData }: Props) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<WaitTab>("waiting");
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => setToast({ message, type });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const load = async () => {
    if (!mentorData?.mentorId) return;
    setLoading(true);
    try {
      const res = await MentorService.getMentorWaitlist(mentorData.mentorId);
      setEntries(res?.data ?? []);
    } catch (e: any) {
      showToast(e.message || "Failed to load waitlist.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [mentorData?.mentorId]);

  const rows = useMemo(
    () =>
      entries
        .filter((e) => TAB_STATUSES[tab].includes(e.status))
        .sort((a, b) => (a.queuePosition ?? 9999) - (b.queuePosition ?? 9999)),
    [entries, tab]
  );

  const count = (t: WaitTab) => entries.filter((e) => TAB_STATUSES[t].includes(e.status)).length;

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      await MentorService.approveWaitlistEntry(id);
      showToast("Approved — the student has been notified.");
      await load();
      setTab("approved");
    } catch (e: any) {
      showToast(e.message || "Failed to approve.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleRemove = async (id: string) => {
    setActionId(id);
    try {
      await MentorService.leaveWaitlist(id, "Removed by mentor");
      showToast("Removed from waitlist.");
      await load();
    } catch (e: any) {
      showToast(e.message || "Failed to remove.", "error");
    } finally {
      setActionId(null);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6 animate-fadeIn">
      {toast && typeof document !== "undefined" && createPortal(
        <div
          className="fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg"
          style={{
            backgroundColor: toast.type === "success" ? "#dcfce7" : "#fee2e2",
            color: toast.type === "success" ? "#15803d" : "#dc2626",
            border: `1px solid ${toast.type === "success" ? "#86efac" : "#fca5a5"}`,
          }}
        >
          <span className="text-sm font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#4a3728" }}>
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#4a3728" }}>Waitlist</h2>
          <p className="text-sm" style={{ color: "#8a7a6a" }}>Students waiting for a slot with you</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1.5 rounded-2xl" style={{ border: "1px solid #e0d8cf" }}>
        <div className="flex gap-1.5">
          {(Object.keys(TAB_META) as WaitTab[]).map((t) => {
            const { label, icon: Icon } = TAB_META[t];
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ backgroundColor: active ? "#4a3728" : "transparent", color: active ? "#fff" : "#7a5c3e" }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: active ? "rgba(255,255,255,0.2)" : "#f3ece4", color: active ? "#fff" : "#7a5c3e" }}
                  >
                    {count(t)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #e0d8cf" }}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ color: "#8a7a6a" }}>
              <Clock className="w-5 h-5 animate-spin mr-3" />
              <span className="text-sm font-semibold">Loading waitlist...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: "#8a7a6a" }}>
              <p className="text-sm font-semibold" style={{ color: "#4a3728" }}>No {tab} entries</p>
              <p className="text-xs mt-1">Students who join your waitlist will appear here</p>
            </div>
          ) : (
            <table className="w-full">
              <thead style={{ backgroundColor: "#fbf7f3" }}>
                <tr>
                  {["Student", "Service", "Requested", "Position", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8a7a6a" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#f0ebe4" }}>
                {rows.map((e) => {
                  const b = badge[e.status] ?? badge.active;
                  const busy = actionId === e.waitlistId;
                  return (
                    <tr key={e.waitlistId} className="hover:bg-[#fbf7f3]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "#4a3728" }}>
                            {e.menteeName?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: "#4a3728" }}>{e.menteeName}</div>
                            {e.notes && <div className="text-xs max-w-[200px] truncate" style={{ color: "#8a7a6a" }} title={e.notes}>{e.notes}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#8a7a6a" }}>
                        {e.serviceTitle || e.sessionType?.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#8a7a6a" }}>{fmt(e.createdAt)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "#4a3728" }}>
                        {e.queuePosition ? `#${e.queuePosition}` : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: b.bg, color: b.fg }}>
                          {b.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5">
                          {e.status === "active" && (
                            <button
                              onClick={() => handleApprove(e.waitlistId)}
                              disabled={busy}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:opacity-80"
                              style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
                            >
                              <Check className="w-3.5 h-3.5" /> {busy ? "..." : "Approve"}
                            </button>
                          )}
                          {(e.status === "active" || e.status === "notified") && (
                            <button
                              onClick={() => handleRemove(e.waitlistId)}
                              disabled={busy}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:opacity-80"
                              style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Remove
                            </button>
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