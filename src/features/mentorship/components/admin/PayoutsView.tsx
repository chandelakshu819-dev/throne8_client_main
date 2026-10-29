"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, CheckCircle, Wallet, AlertCircle, Copy, X, Banknote } from "lucide-react";
import PayoutService, { AdminPayoutRow, PayoutStatus } from "@/lib/api/payout.service";

const TABS: { key: PayoutStatus; label: string; hint: string }[] = [
  { key: "held", label: "On hold", hint: "Session completed? Verify it, then click Release" },
  { key: "released", label: "Approved", hint: "Send the money to the mentor, then click Mark Paid" },
  { key: "paid", label: "Paid",hint: "These payouts have been sent to the mentor" },
];

const PAGE_SIZE = 15;

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmt = (d?: string) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

function MethodBlock({ row }: { row: AdminPayoutRow }) {
  const m = row.payoutMethod;
  const copy = (text?: string) => text && navigator.clipboard?.writeText(text);
  if (!m) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#b91c1c" }}>
        <AlertCircle className="w-3.5 h-3.5" /> Mentor has not added a payout account
      </span>
    );
  }
  if (m.type === "upi") {
    return (
      <div className="text-xs" style={{ color: "#4a3728" }}>
        <p className="font-semibold">UPI · {m.upiName}</p>
        <button type="button" onClick={() => copy(m.upiId)} className="inline-flex items-center gap-1 font-mono" title="Copy">
          {m.upiId} <Copy className="w-3 h-3" />
        </button>
      </div>
    );
  }
  return (
    <div className="text-xs" style={{ color: "#4a3728" }}>
      <p className="font-semibold">{m.bankName} · {m.accountHolderName}</p>
      <button type="button" onClick={() => copy(m.accountNumber)} className="inline-flex items-center gap-1 font-mono" title="Copy">
        {m.accountNumber} <Copy className="w-3 h-3" />
      </button>
      <p className="font-mono">{m.ifscCode}</p>
    </div>
  );
}

export default function PayoutsView({ onHeldCountChange }: { onHeldCountChange?: (n: number) => void }) {
  const [tab, setTab] = useState<PayoutStatus>("held");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminPayoutRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRow, setConfirmRow] = useState<AdminPayoutRow | null>(null);
  const [paidRow, setPaidRow] = useState<AdminPayoutRow | null>(null);
  const [reference, setReference] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await PayoutService.adminList(tab, page, PAGE_SIZE);
      setRows(res.rows);
      setTotal(res.total);
      if (tab === "held") onHeldCountChange?.(res.total);
    } catch (e: any) {
      setError(e?.message || "Failed to load payouts.");
    } finally {
      setLoading(false);
    }
  }, [tab, page, onHeldCountChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const doRelease = async () => {
    if (!confirmRow) return;
    setBusyId(confirmRow.paymentId);
    setActionError(null);
    try {
      await PayoutService.release(confirmRow.paymentId);
      setConfirmRow(null);
      await load();
    } catch (e: any) {
      setActionError(e?.message || "Failed.");
    } finally {
      setBusyId(null);
    }
  };

  const doMarkPaid = async () => {
    if (!paidRow) return;
    setBusyId(paidRow.paymentId);
    setActionError(null);
    try {
      await PayoutService.markPaid(paidRow.paymentId, reference.trim());
      setPaidRow(null);
      setReference("");
      await load();
    } catch (e: any) {
      setActionError(e?.message || "Failed.");
    } finally {
      setBusyId(null);
    }
  };

  const sumMentor = rows.reduce((s, r) => s + r.mentorAmount, 0);
  const sumPlatform = rows.reduce((s, r) => s + r.platformAmount, 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div className="space-y-5">
      {/* Tabs */}
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

      {/* Totals for this page */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Entries", value: String(total) },
          { label: "Platform share (20%)", value: inr(sumPlatform) },   
          { label: "Platform share (20%)", value: inr(sumPlatform) },       
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
                {["Session", "Mentor", "Paid by user", "Mentor (80%)", "Platform (20%)", "Payout account", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: "#4a3728" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center" style={{ color: "#8a7a6a" }}>
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center" style={{ color: "#8a7a6a" }}>
                    <Wallet className="w-9 h-9 mx-auto mb-2 opacity-30" />
                    No payouts in this tab.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.paymentId} className="border-t" style={{ borderColor: "#ece4db" }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: "#4a3728" }}>{r.title || "Mentorship session"}</p>
                      <p className="text-xs" style={{ color: "#8a7a6a" }}>Slot: {fmt(r.scheduledAt)}</p>
                      <span
                      className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                      style={
                        r.bookingStatus === "completed"
                          ? { backgroundColor: "#e4f3ec", color: "#2f7d5c" }
                          : { backgroundColor: "#fbf1dc", color: "#b8860b" }
                      }
                    >
                      Session: {(r.bookingStatus || "unknown").replace("_", " ")}
                    </span>
                      <p className="text-[10px] font-mono" style={{ color: "#a3907e" }}>{r.paymentId.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "#4a3728" }}>{r.mentorName}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#4a3728" }}>{inr(r.totalPaid)}</td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: "#2f7d5c" }}>{inr(r.mentorAmount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#8a7a6a" }}>{inr(r.platformAmount)}</td>
                    <td className="px-4 py-3 min-w-[200px]"><MethodBlock row={r} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.payoutStatus === "paid" ? (
                        <div className="text-xs">
                          <span className="px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: "#e4f3ec", color: "#2f7d5c" }}>Paid</span>
                          <p className="mt-1 font-mono" style={{ color: "#8a7a6a" }}>{r.reference}</p>
                        </div>
                      ) : r.payoutStatus === "released" ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#e6edfc", color: "#2563eb" }}>Approved</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#fbf1dc", color: "#b8860b" }}>On hold</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.payoutStatus === "held" && (
                        <button
                          type="button"
                          onClick={() => { setActionError(null); setConfirmRow(r); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{ backgroundColor: "#4a3728" }}
                        >
                          Approve &amp; Release
                        </button>
                      )}
                      {r.payoutStatus === "released" && (
                        <button
                          type="button"
                          onClick={() => { setActionError(null); setReference(""); setPaidRow(r); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1"
                          style={{ backgroundColor: "#2f7d5c" }}
                        >
                          <Banknote className="w-3.5 h-3.5" /> Mark Paid
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

      {/* Release confirm */}
      {confirmRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: "#fff", border: "2px solid #e0d8cf" }}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold" style={{ color: "#4a3728" }}>Approve payout?</h3>
              <button type="button" onClick={() => setConfirmRow(null)}><X className="w-5 h-5" style={{ color: "#8a7a6a" }} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: "#4a3728" }}>
            <b>{inr(confirmRow.mentorAmount)}</b> will be released to <b>{confirmRow.mentorName}</b>. Please confirm that the session has taken place and there is no dispute.
            </p>
            {actionError && <p className="text-sm mb-3" style={{ color: "#b91c1c" }}>{actionError}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmRow(null)} className="flex-1 py-2.5 rounded-xl font-semibold"
                style={{ border: "1px solid #e0d8cf", color: "#4a3728" }}>Cancel</button>
              <button type="button" onClick={doRelease} disabled={busyId === confirmRow.paymentId}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#4a3728" }}>
                {busyId === confirmRow.paymentId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Release
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark paid */}
      {paidRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: "#fff", border: "2px solid #e0d8cf" }}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold" style={{ color: "#4a3728" }}>Payment sent?</h3>
              <button type="button" onClick={() => setPaidRow(null)}><X className="w-5 h-5" style={{ color: "#8a7a6a" }} /></button>
            </div>
            <p className="text-sm mb-3" style={{ color: "#4a3728" }}>
            After sending <b>{inr(paidRow.mentorAmount)}</b> to <b>{paidRow.mentorName}</b>, enter the UTR / transaction ID here.
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
              <button type="button" onClick={() => setPaidRow(null)} className="flex-1 py-2.5 rounded-xl font-semibold"
                style={{ border: "1px solid #e0d8cf", color: "#4a3728" }}>Cancel</button>
              <button type="button" onClick={doMarkPaid} disabled={reference.trim().length < 3 || busyId === paidRow.paymentId}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: "#2f7d5c" }}>
                {busyId === paidRow.paymentId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                Mark Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}