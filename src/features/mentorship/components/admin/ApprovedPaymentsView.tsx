"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, ChevronLeft, ChevronRight, X } from "lucide-react";
import PayoutService, { AdminPayoutRow, ApprovedListStatus } from "@/lib/api/payout.service";

const LIMIT = 10;
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

const methodLabel = (m: AdminPayoutRow["payoutMethod"]) => {
  if (!m) return "—";
  if (m.type === "upi") return `UPI · ${m.upiId ?? ""}`;
  return `Bank · ${m.bankName ?? ""} ••${(m.accountNumber ?? "").slice(-4)}`;
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  paid: { bg: "#e4f3ec", color: "#2f7d5c", label: "Paid" },
  released: { bg: "#fbf1dc", color: "#b8860b", label: "Approved" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.released;
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function Initials({ name }: { name: string }) {
  const text = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{ backgroundColor: "#f3ece4", color: "#4a3728" }}>{text || "M"}</span>
  );
}

export default function ApprovedPaymentsView() {
  const [rows, setRows] = useState<AdminPayoutRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<ApprovedListStatus>("paid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminPayoutRow | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await PayoutService.adminListApproved(status, page, LIMIT);
      setRows(res.rows);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.message || "Failed to load approved payments.");
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { void load(); }, [load]);

  const th = "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6" style={{ backgroundColor: "#fff", border: "1px solid #ece4db" }}>
        <h2 className="text-xl font-bold" style={{ color: "#4a3728" }}>Approved Payments</h2>
        <p className="text-sm mt-1" style={{ color: "#8a7a6a" }}>
          Permanent record of payouts approved by admin. Total: <b>{total}</b>
        </p>
        <select
          value={status}
          onChange={(e) => { setPage(1); setStatus(e.target.value as ApprovedListStatus); }}
          className="mt-5 w-64 rounded-xl px-3 py-2.5 text-sm"
          style={{ border: "1px solid #ece4db", color: "#4a3728", backgroundColor: "#fff" }}
        >
          <option value="approved">Status: All</option>
          <option value="released">Approved (awaiting transfer)</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm flex justify-between items-center" style={{ backgroundColor: "#fdecea", color: "#b91c1c" }}>
          <span>{error}</span>
          <button onClick={() => void load()} className="px-2.5 py-1 rounded-md text-xs font-semibold"
            style={{ backgroundColor: "#fff", border: "1px solid #b91c1c" }}>Retry</button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #ece4db" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: "#4a3728" }}>
            <thead>
              <tr style={{ color: "#8a7a6a", borderBottom: "1px solid #ece4db" }}>
                {["Mentor", "Amount", "Payment ID", "Method", "Approved By", "Approved", "Paid On", "Status", "Actions"].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={9} className="px-4 py-4">
                    <div className="h-8 rounded-lg animate-pulse" style={{ backgroundColor: "#f3ece4" }} />
                  </td></tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center" style={{ color: "#8a7a6a" }}>No approved payments yet.</td></tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.paymentId} style={{ borderBottom: "1px solid #f3ece4" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3"><Initials name={p.mentorName} />
                        <span className="font-semibold">{p.mentorName}</span></div>
                    </td>
                    <td className="px-4 py-3 font-bold">₹{inr.format(p.mentorAmount)}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "#8a7a6a" }}>{p.paymentId}</td>
                    <td className="px-4 py-3">{methodLabel(p.payoutMethod)}</td>
                    <td className="px-4 py-3">{p.releasedBy ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(p.releasedAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(p.payoutPaidAt)}</td>
                    <td className="px-4 py-3"><StatusPill status={p.payoutStatus} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(p)} aria-label="View details" style={{ color: "#7a5c3e" }}>
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 text-sm" style={{ color: "#8a7a6a", borderTop: "1px solid #ece4db" }}>
          <span>Showing page <b>{page}</b> of <b>{totalPages}</b> (<b>{total}</b> total)</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-40" style={{ border: "1px solid #ece4db" }}>
              <ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-40" style={{ border: "1px solid #ece4db" }}>
              <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: "#fff" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: "#4a3728" }}>Payment details</h3>
              <button onClick={() => setSelected(null)} aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <dl className="space-y-2.5 text-sm" style={{ color: "#4a3728" }}>
              {([
                ["Mentor", selected.mentorName],
                ["Session", selected.title ?? "—"],
                ["Total paid by student", `₹${inr.format(selected.totalPaid)}`],
                ["Platform fee", `₹${inr.format(selected.platformAmount)}`],
                ["Mentor payout", `₹${inr.format(selected.mentorAmount)}`],
                ["Payment ID", selected.paymentId],
                ["Transfer reference (UTR)", selected.reference ?? "—"],
                ["Method", methodLabel(selected.payoutMethod)],
                ["Approved by", selected.releasedBy ?? "—"],
                ["Approved", fmtDate(selected.releasedAt)],
                ["Paid on", fmtDate(selected.payoutPaidAt)],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt style={{ color: "#8a7a6a" }}>{k}</dt>
                  <dd className="font-semibold text-right break-all">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between"><dt style={{ color: "#8a7a6a" }}>Status</dt><dd><StatusPill status={selected.payoutStatus} /></dd></div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}