"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Banknote, Copy, X, Undo2 } from "lucide-react";
import PayoutService, { AdminRefundRow, RefundStatus } from "@/lib/api/payout.service";

const TABS: { key: RefundStatus; label: string; hint: string }[] = [
  { key: "pending", label: "Pending", hint: "Student ko paisa bhejo, phir Mark Refunded karo" },
  { key: "refunded", label: "Refunded", hint: "Student ko refund ho chuka hai" },
];

const PAGE_SIZE = 15;

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmt = (d?: string) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

function DetailsBlock({ row }: { row: AdminRefundRow }) {
  const d = row.details || {};
  const copy = (text?: string) => text && navigator.clipboard?.writeText(text);
  return (
    <div className="text-xs space-y-0.5" style={{ color: "#4a3728" }}>
      {d.upiId && (
        <button type="button" onClick={() => copy(d.upiId)} className="inline-flex items-center gap-1 font-mono font-semibold" title="Copy UPI">
          {d.upiId} <Copy className="w-3 h-3" />
        </button>
      )}
      {d.phone && <p>Phone: {d.phone}</p>}
      {d.email && <p>{d.email}</p>}
      {d.note && <p style={{ color: "#8a7a6a" }}>Note: {d.note}</p>}
    </div>
  );
}

export default function RefundsView({ onPendingCountChange }: { onPendingCountChange?: (n: number) => void }) {
  const [tab, setTab] = useState<RefundStatus>("pending");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminRefundRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payRow, setPayRow] = useState<AdminRefundRow | null>(null);
  const [reference, setReference] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await PayoutService.adminListRefunds(tab, page, PAGE_SIZE);
      setRows(res.rows);
      setTotal(res.total);
      if (tab === "pending") onPendingCountChange?.(res.total);
    } catch (e: any) {
      setError(e?.message || "Failed to load refunds.");
    } finally {
      setLoading(false);
    }
  }, [tab, page, onPendingCountChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const doMarkRefunded = async () => {
    if (!payRow) return;
    setBusyId(payRow.bookingId);
    setActionError(null);
    try {
      await PayoutService.markRefunded(payRow.bookingId, reference.trim());
      setPayRow(null);
      setReference("");
      await load();
    } catch (e: any) {
      setActionError(e?.message || "Failed.");
    } finally {
      setBusyId(null);
    }
  };

  const sumAmount = rows.reduce((s, r) => s + r.amount, 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              setPage(1);
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={
              tab === t.key
                ? { backgroundColor: "#4a3728", color: "#fff" }
                : { backgroundColor: "#fff", color: "#4a3728", border: "1px solid #e0d8cf" }
            }
          >
            {t.label}
          </button>
        ))}
        <span className="text-xs ml-2" style={{ color: "#8a7a6a" }}>{active.hint}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: "Entries", value: String(total) },
          { label: "Refund amount (this page)", value: inr(sumAmount) },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl p-4" style={{ backgroundColor: "#fff", border: "1px solid #ece4db" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#a3907e" }}>{c.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "#4a3728" }}>{c.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: "#fdecea", color: "#b91c1c" }}>{error}</div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #ece4db" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "#fbf7f3" }}>
              <tr>
                {["Session", "Mentor", "Student", "Amount", "Student payout details", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: "#4a3728" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center" style={{ color: "#8a7a6a" }}>
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center" style={{ color: "#8a7a6a" }}>
                    <Undo2 className="w-9 h-9 mx-auto mb-2 opacity-30" />
                    Is tab mein koi refund nahi hai.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.bookingId} className="border-t" style={{ borderColor: "#ece4db" }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: "#4a3728" }}>{r.title || "Mentorship session"}</p>
                      <p className="text-xs" style={{ color: "#8a7a6a" }}>Slot: {fmt(r.scheduledAt)}</p>
                      <p className="text-[10px]" style={{ color: "#a3907e" }}>Requested: {fmt(r.requestedAt)}</p>
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "#4a3728" }}>{r.mentorName}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#4a3728" }}>{r.menteeName || "—"}</td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: "#2f7d5c" }}>{inr(r.amount)}</td>
                    <td className="px-4 py-3 min-w-[200px]"><DetailsBlock row={r} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.status === "refunded" ? (
                        <div className="text-xs">
                          <span className="px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: "#e4f3ec", color: "#2f7d5c" }}>
                            {r.refundMode === "gateway" ? "Refunded (auto)" : "Refunded"}
                          </span>
                          {r.reference && <p className="mt-1 font-mono" style={{ color: "#8a7a6a" }}>{r.reference}</p>}
                          <p className="mt-0.5" style={{ color: "#a3907e" }}>{fmt(r.refundedAt)}</p>
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#fbf1dc", color: "#b8860b" }}>Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => { setActionError(null); setReference(""); setPayRow(r); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1"
                          style={{ backgroundColor: "#2f7d5c" }}
                        >
                          <Banknote className="w-3.5 h-3.5" /> Mark Refunded
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#ece4db" }}>
            <span className="text-xs" style={{ color: "#8a7a6a" }}>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                style={{ border: "1px solid #e0d8cf", color: "#4a3728" }}>Previous</button>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                style={{ border: "1px solid #e0d8cf", color: "#4a3728" }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {payRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: "#fff", border: "2px solid #e0d8cf" }}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold" style={{ color: "#4a3728" }}>Refund bhej diya?</h3>
              <button type="button" onClick={() => setPayRow(null)}><X className="w-5 h-5" style={{ color: "#8a7a6a" }} /></button>
            </div>
            <p className="text-sm mb-3" style={{ color: "#4a3728" }}>
              Student ko <b>{inr(payRow.amount)}</b>{payRow.details?.upiId ? <> (<span className="font-mono">{payRow.details.upiId}</span>)</> : null} bhejne ke baad UTR / transaction ID yahan daalo.
            </p>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="UTR / Transaction ID"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3"
              style={{ border: "2px solid #e0d8cf", color: "#4a3728" }}
            />
            {actionError && <p className="text-sm mb-3" style={{ color: "#b91c1c" }}>{actionError}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setPayRow(null)} className="flex-1 py-2.5 rounded-xl font-semibold"
                style={{ border: "1px solid #e0d8cf", color: "#4a3728" }}>Cancel</button>
              <button type="button" onClick={doMarkRefunded} disabled={reference.trim().length < 3 || busyId === payRow.bookingId}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: "#2f7d5c" }}>
                {busyId === payRow.bookingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                Mark Refunded
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}