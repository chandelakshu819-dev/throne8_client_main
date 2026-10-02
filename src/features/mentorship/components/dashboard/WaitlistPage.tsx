"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Users, Clock, CheckCircle2, XCircle, Check, X, ArrowUp, ArrowDown, Sparkles, Filter, Search, ChevronDown } from "lucide-react";
import MentorService from "@/lib/api/mentorship.service";
import MenteeLink from "@/features/mentorship/components/shared/MenteeLink";

interface Props {
  mentorData: any;
}

type WaitTab = "waiting" | "approved" | "removed";

const TAB_STATUSES: Record<WaitTab, string[]> = {
  waiting: ["active", "waiting"],
  approved: ["notified", "booked", "converted"],
  removed: ["cancelled", "expired", "declined"],
};

const TAB_META: Record<WaitTab, { label: string; icon: React.ElementType }> = {
  waiting: { label: "Waiting", icon: Clock },
  approved: { label: "Offered / Converted", icon: CheckCircle2 },
  removed: { label: "Removed / Declined", icon: XCircle },
};

const badge: Record<string, { bg: string; fg: string; label: string }> = {
  waiting: { bg: "#fef3c7", fg: "#b45309", label: "Waiting" },
  active: { bg: "#fef3c7", fg: "#b45309", label: "Waiting" },
  notified: { bg: "#dcfce7", fg: "#15803d", label: "Offered (24h)" },
  converted: { bg: "#f3e8ff", fg: "#7c3aed", label: "Converted" },
  booked: { bg: "#f3e8ff", fg: "#7c3aed", label: "Booked" },
  declined: { bg: "#fee2e2", fg: "#dc2626", label: "Declined" },
  cancelled: { bg: "#fee2e2", fg: "#dc2626", label: "Cancelled" },
  expired: { bg: "#f0ebe4", fg: "#8a7a6a", label: "Expired" },
};

export default function WaitlistPage({ mentorData }: Props) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<WaitTab>("waiting");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<string>("ALL");
  const [autoOffer, setAutoOffer] = useState<boolean>(mentorData?.autoOfferWaitlist !== false);
  const [togglingAuto, setTogglingAuto] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => setToast({ message, type });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = async () => {
    if (!mentorData?.mentorId && !mentorData?.userId) return;
    const mId = mentorData.mentorId || mentorData.userId;
    setLoading(true);
    try {
      const res = await MentorService.getMentorWaitlist(mId);
      setEntries(res?.data ?? res ?? []);
    } catch (e: any) {
      showToast(e.message || "Failed to load waitlist.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [mentorData?.mentorId, mentorData?.userId]);

  // Unique services list for filter
  const serviceOptions = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach((e) => {
      if (e.serviceId && e.serviceTitle) {
        map.set(e.serviceId, e.serviceTitle);
      }
    });
    return Array.from(map.entries());
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return entries.filter((e) => {
      const matchesTab = TAB_STATUSES[tab].includes(e.status);
      const matchesService = selectedService === "ALL" || e.serviceId === selectedService;
      const matchesSearch =
        !q ||
        (e.menteeName && e.menteeName.toLowerCase().includes(q)) ||
        (e.serviceTitle && e.serviceTitle.toLowerCase().includes(q)) ||
        (e.sessionType && e.sessionType.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q));

      return matchesTab && matchesService && matchesSearch;
    });
  }, [entries, tab, selectedService, searchQuery]);

  const rows = useMemo(() => {
    return [...filteredEntries].sort((a, b) => (a.queuePosition ?? 9999) - (b.queuePosition ?? 9999));
  }, [filteredEntries]);

  const waitingCount = useMemo(() => entries.filter((e) => e.status === "waiting" || e.status === "active").length, [entries]);
  const offeredCount = useMemo(() => entries.filter((e) => e.status === "notified").length, [entries]);
  const convertedCount = useMemo(() => entries.filter((e) => e.status === "converted" || e.status === "booked").length, [entries]);

  const handleToggleAutoOffer = async () => {
    setTogglingAuto(true);
    const nextVal = !autoOffer;
    try {
      await MentorService.toggleAutoOffer(nextVal);
      setAutoOffer(nextVal);
      showToast(`Auto-offer slots is now ${nextVal ? "ENABLED" : "DISABLED"}`);
    } catch (e: any) {
      showToast(e.message || "Failed to update auto-offer setting.", "error");
    } finally {
      setTogglingAuto(false);
    }
  };

  const handleOfferSlot = async (id: string) => {
    setActionId(id);
    try {
      await MentorService.approveWaitlistEntry(id);
      showToast("Slot offered! The mentee has 24h to claim it.");
      await load();
      setTab("approved");
    } catch (e: any) {
      showToast(e.message || "Failed to offer slot.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleRemove = async (id: string) => {
    setActionId(id);
    try {
      await MentorService.removeWaitlistEntry(id, "Removed by mentor");
      showToast("Removed from waitlist.");
      await load();
    } catch (e: any) {
      showToast(e.message || "Failed to remove.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handlePriority = async (id: string, delta: number) => {
    setActionId(id);
    try {
      await MentorService.updateWaitlistPriority(id, delta);
      showToast(`Position ${delta > 0 ? "moved up" : "moved down"}.`);
      await load();
    } catch (e: any) {
      showToast(e.message || "Failed to change priority.", "error");
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
          className="fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg transition-all"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#4a3728] text-white shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#4a3728]">Waitlist Management</h2>
            <p className="text-sm text-[#8a7a6a]">Manage mentees waiting for slot openings</p>
          </div>
        </div>

        {/* Auto Offer Toggle Header Card */}
        <div className="bg-white px-4 py-2.5 rounded-2xl border border-[#e0d8cf] flex items-center gap-3 shadow-sm">
          <div>
            <span className="text-xs font-bold text-[#4a3728] block">Auto-Offer Slots</span>
            <span className="text-[11px] text-[#8a7a6a]">Offer opened slots automatically</span>
          </div>
          <button
            onClick={handleToggleAutoOffer}
            disabled={togglingAuto}
            className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${
              autoOffer ? "bg-[#15803d]" : "bg-[#d1c7bd]"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                autoOffer ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#e0d8cf] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#4a3728]">{waitingCount}</span>
            <span className="text-xs font-bold text-[#8a7a6a] block uppercase tracking-wider">People Waiting</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#e0d8cf] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#4a3728]">{offeredCount}</span>
            <span className="text-xs font-bold text-[#8a7a6a] block uppercase tracking-wider">Slots Offered</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#e0d8cf] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#4a3728]">{convertedCount}</span>
            <span className="text-xs font-bold text-[#8a7a6a] block uppercase tracking-wider">Converted Bookings</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-[#e0d8cf] flex gap-1.5 shadow-sm">
        {(Object.keys(TAB_META) as WaitTab[]).map((t) => {
          const { label, icon: Icon } = TAB_META[t];
          const active = tab === t;
          const countVal = entries.filter((e) => TAB_STATUSES[t].includes(e.status)).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: active ? "#4a3728" : "transparent", color: active ? "#fff" : "#7a5c3e" }}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-extrabold"
                style={{ backgroundColor: active ? "rgba(255,255,255,0.2)" : "#f3ece4", color: active ? "#fff" : "#7a5c3e" }}
              >
                {countVal}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sleek Search & Filter Control Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#e0d8cf] shadow-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input Box */}
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-[#8a7a6a] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mentee name, service, or notes..."
            className="w-full pl-10 pr-8 py-2 rounded-xl bg-[#fbf7f3] border border-[#e0d8cf] text-xs font-medium text-[#4a3728] placeholder-[#a09080] focus:outline-none focus:border-[#4a3728] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a7a6a] hover:text-[#4a3728]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Service Filter Dropdown with fixed width & truncated option text */}
        <div className="w-full sm:w-auto flex items-center gap-2 shrink-0">
          <div className="relative w-full sm:w-[220px]">
            <Filter className="w-3.5 h-3.5 text-[#7a5c3e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full pl-8 pr-7 py-2 rounded-xl bg-[#fbf7f3] border border-[#e0d8cf] text-xs font-bold text-[#4a3728] appearance-none focus:outline-none focus:border-[#4a3728] cursor-pointer truncate"
            >
              <option value="ALL">All Services</option>
              {serviceOptions.map(([id, title]) => (
                <option key={id} value={id} className="text-xs text-[#4a3728]">
                  {title.length > 35 ? title.substring(0, 35) + "..." : title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#7a5c3e] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl overflow-hidden border border-[#e0d8cf] shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#8a7a6a]">
              <Clock className="w-5 h-5 animate-spin mr-3" />
              <span className="text-sm font-semibold">Loading waitlist...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#8a7a6a] space-y-2">
              <Users className="w-10 h-10 text-[#d1c7bd]" />
              <p className="text-sm font-semibold text-[#4a3728]">No matching waitlist entries</p>
              <p className="text-xs">
                {searchQuery || selectedService !== "ALL"
                  ? "Try clearing your search filters."
                  : "When mentees request a spot, they will appear here in FIFO queue order."}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead style={{ backgroundColor: "#fbf7f3" }}>
                <tr>
                  {["Student", "Service", "Joined Date", "Queue Position", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#8a7a6a]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ebe4]">
                {rows.map((e) => {
                  const b = badge[e.status] ?? badge.waiting;
                  const busy = actionId === e.waitlistId;
                  const isWaiting = e.status === "waiting" || e.status === "active";
                  const sTitle = e.serviceTitle || e.sessionType?.replace(/_/g, " ") || "Mentorship Session";

                  return (
                    <tr key={e.waitlistId} className="hover:bg-[#fbf7f3]/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <MenteeLink
                            menteeId={e.menteeId || e.userId}
                            name={e.menteeName || "Student"}
                            avatar={e.menteeProfilePhoto || e.avatar}
                            avatarSize="w-9 h-9"
                          />
                          {e.notes && (
                            <div className="text-xs text-[#8a7a6a] max-w-[220px] truncate ml-11" title={e.notes}>
                              "{e.notes}"
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-[#4a3728] max-w-[240px]">
                        <span className="truncate block" title={sTitle}>
                          {sTitle}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#8a7a6a]">{fmt(e.createdAt)}</td>
                      <td className="px-5 py-4 text-xs font-bold text-[#4a3728]">
                        {e.queuePosition ? `#${e.queuePosition}` : e.position ? `#${e.position}` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold shrink-0" style={{ backgroundColor: b.bg, color: b.fg }}>
                          {b.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {isWaiting && (
                            <>
                              <button
                                onClick={() => handleOfferSlot(e.waitlistId)}
                                disabled={busy}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-[#dcfce7] text-[#15803d] hover:bg-[#bbf7d0] transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" /> {busy ? "..." : "Offer Slot"}
                              </button>

                              <button
                                onClick={() => handlePriority(e.waitlistId, 1)}
                                disabled={busy}
                                title="Move Priority Up"
                                className="p-1.5 rounded-lg border border-[#e0d8cf] text-[#7a5c3e] hover:bg-[#f3ece4] transition-colors"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handlePriority(e.waitlistId, -1)}
                                disabled={busy}
                                title="Move Priority Down"
                                className="p-1.5 rounded-lg border border-[#e0d8cf] text-[#7a5c3e] hover:bg-[#f3ece4] transition-colors"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {(isWaiting || e.status === "notified") && (
                            <button
                              onClick={() => handleRemove(e.waitlistId)}
                              disabled={busy}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 bg-[#fee2e2] text-[#dc2626] hover:bg-[#fca5a5] transition-colors"
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