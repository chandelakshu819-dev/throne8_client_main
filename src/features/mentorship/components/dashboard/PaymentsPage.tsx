"use client";
import React, { useEffect, useState } from "react";
import {
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  ArrowUp,
  Plus,
  Trash2,
  Star,
  Building2,
  Smartphone,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import SessionService from "@/lib/api/session.service";
import ProfileService from "@/lib/api/profile.service";
import WithdrawalService, {
  WithdrawalMethod,
  AddBankPayload,
  AddUpiPayload,
} from "@/lib/api/withdrawal.service";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function derivePaymentStatus(bookingStatus: string): string {
  switch (bookingStatus) {
    case "completed":
    case "confirmed":
    case "in_progress":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "rescheduled":
    case "pending":
    default:
      return "pending";
  }
}

function maskAccount(num: string): string {
  if (!num) return "";
  return "****" + num.slice(-4);
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TransactionRow = {
  bookingId: string;
  menteeId: string;
  menteeName: string;
  menteeProfilePhotoId: string | null;
  date: string;
  basePrice: number;
  platformFee: number;
  total: number;
  method: string;
  paymentStatus: string;
  bookingStatus: string;
};

type ModalType = "bank" | "upi" | null;

const BANKS = [
  "SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank",
  "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank",
  "IndusInd Bank", "Yes Bank", "IDFC First Bank", "Federal Bank", "Other",
];

// ─────────────────────────────────────────────────────────────────────────────
// Add Method Modal
// ─────────────────────────────────────────────────────────────────────────────

interface AddMethodModalProps {
  type: ModalType;
  mentorId: string;
  onClose: () => void;
  onSuccess: (method: WithdrawalMethod) => void;
}

function AddMethodModal({ type, mentorId, onClose, onSuccess }: AddMethodModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  // Bank state
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountType, setAccountType] = useState<"savings" | "current">("savings");

  // UPI state
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");

  const handleSubmit = async () => {
    setError(null);

    if (type === "bank") {
      if (!bankName || !accountHolder || !accountNumber || !ifsc) {
        return setError("All fields are required.");
      }
      if (accountNumber !== confirmAccount) {
        return setError("Account numbers do not match.");
      }
      if (ifsc.length !== 11) {
        return setError("IFSC code must be 11 characters.");
      }
    }

    if (type === "upi") {
      if (!upiId || !upiName) return setError("All fields are required.");
      if (!upiId.includes("@")) return setError("Invalid UPI ID format (must contain @).");
    }

    setLoading(true);
    try {
      let payload: AddBankPayload | AddUpiPayload;
      if (type === "bank") {
        payload = {
          type: "bank",
          bankName,
          accountHolderName: accountHolder,
          accountNumber,
          ifscCode: ifsc.toUpperCase(),
          accountType,
          isDefault,
        };
      } else {
        payload = { type: "upi", upiId: upiId.toLowerCase(), upiName, isDefault };
      }

      const res = await WithdrawalService.addMethod(mentorId, payload);
      onSuccess(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to add method.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border-2 border-[#e0d8cf] focus:outline-none focus:border-[#4a3728] text-[#4a3728] bg-white text-sm transition-colors";
  const labelClass = "block text-xs font-semibold text-[#4a3728] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-2 border-[#e0d8cf]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e0d8cf]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#4a3728" }}>
              {type === "bank" ? (
                <Building2 className="w-5 h-5 text-white" />
              ) : (
                <Smartphone className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#4a3728]">
                {type === "bank" ? "Add Bank Account" : "Add UPI ID"}
              </h3>
              <p className="text-xs text-[#8a7a6a]">
                {type === "bank" ? "For bank transfer withdrawals" : "For instant UPI withdrawals"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#fbf7f3] transition-colors">
            <X className="w-5 h-5 text-[#8a7a6a]" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-600 text-xs font-medium">{error}</p>
            </div>
          )}

          {type === "bank" && (
            <>
              <div>
                <label className={labelClass}>Bank Name *</label>
                <select value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputClass}>
                  <option value="">Select bank</option>
                  {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Account Holder Name *</label>
                <input
                  type="text"
                  placeholder="As per bank records"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Account Number *</label>
                <input
                  type="password"
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Confirm Account Number *</label>
                <input
                  type="text"
                  placeholder="Re-enter account number"
                  value={confirmAccount}
                  onChange={(e) => setConfirmAccount(e.target.value.replace(/\D/g, ""))}
                  className={inputClass}
                />
                {confirmAccount && accountNumber !== confirmAccount && (
                  <p className="text-red-500 text-xs mt-1">Account numbers do not match</p>
                )}
              </div>

              <div>
                <label className={labelClass}>IFSC Code *</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={ifsc}
                  maxLength={11}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Account Type *</label>
                <div className="flex gap-3">
                  {(["savings", "current"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAccountType(t)}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                        accountType === t
                          ? "border-[#4a3728] bg-[#4a3728] text-white"
                          : "border-[#e0d8cf] text-[#8a7a6a] hover:border-[#4a3728]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === "upi" && (
            <>
              <div>
                <label className={labelClass}>UPI ID *</label>
                <input
                  type="text"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className={inputClass}
                />
                <p className="text-[#8a7a6a] text-xs mt-1">
                  Formats: name@paytm, name@okaxis, name@ybl, etc.
                </p>
              </div>

              <div>
                <label className={labelClass}>Account Name *</label>
                <input
                  type="text"
                  placeholder="Name linked to UPI"
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {/* Set as default toggle */}
          <div
            onClick={() => setIsDefault(!isDefault)}
            className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
              isDefault ? "border-[#4a3728] bg-[#fbf7f3]" : "border-[#e0d8cf]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className={`w-4 h-4 ${isDefault ? "text-[#4a3728] fill-[#4a3728]" : "text-[#8a7a6a]"}`} />
              <span className="text-sm font-semibold text-[#4a3728]">Set as default method</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-all ${isDefault ? "bg-[#4a3728]" : "bg-gray-200"}`}>
              <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-all shadow ${isDefault ? "ml-5" : "ml-1"}`} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[#e0d8cf]">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-[#e0d8cf] text-[#4a3728] font-semibold hover:bg-[#fbf7f3] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: "#4a3728" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? "Saving..." : "Add Method"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Method Card
// ─────────────────────────────────────────────────────────────────────────────

interface MethodCardProps {
  method: WithdrawalMethod;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  deleting: boolean;
}

function MethodCard({ method, onDelete, onSetDefault, deleting }: MethodCardProps) {
  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
        method.isDefault ? "border-[#4a3728] bg-[#fbf7f3]" : "border-[#e0d8cf] bg-white"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: method.isDefault ? "#4a3728" : "#f0ebe4" }}
          >
            {method.type === "bank" ? (
              <Building2 className={`w-5 h-5 ${method.isDefault ? "text-white" : "text-[#4a3728]"}`} />
            ) : (
              <Smartphone className={`w-5 h-5 ${method.isDefault ? "text-white" : "text-[#4a3728]"}`} />
            )}
          </div>

          <div>
            {method.type === "bank" ? (
              <>
                <p className="font-bold text-[#4a3728] text-sm">{method.bankName}</p>
                <p className="text-[#8a7a6a] text-xs">
                  {method.accountHolderName} • {maskAccount(method.accountNumber || "")}
                </p>
                <p className="text-[#8a7a6a] text-xs capitalize">
                  {method.accountType} • IFSC: {method.ifscCode}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-[#4a3728] text-sm">{method.upiName}</p>
                <p className="text-[#8a7a6a] text-xs">{method.upiId}</p>
                <p className="text-[#8a7a6a] text-xs">UPI Payment</p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {method.isDefault && (
            <span className="flex items-center gap-1 text-xs font-semibold text-[#4a3728] bg-[#e8ddd4] px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3 fill-[#4a3728]" /> Default
            </span>
          )}
          {method.isVerified && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-[#e0d8cf]">
        {!method.isDefault && (
          <button
            onClick={() => onSetDefault(method._id)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-[#4a3728] border border-[#4a3728] hover:bg-[#4a3728] hover:text-white transition-all"
          >
            Set as Default
          </button>
        )}
        <button
          onClick={() => onDelete(method._id)}
          disabled={deleting}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3" />
          Remove
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main PaymentsPage
// ─────────────────────────────────────────────────────────────────────────────

interface PaymentsPageProps {
  mentorData: any;
}

export default function PaymentsPage({ mentorData }: PaymentsPageProps) {
  // ── Transactions state ──────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState<string | null>(null);

  // ── Withdrawal methods state ────────────────────────────────────────────
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [addModal, setAddModal] = useState<ModalType>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mentorId = mentorData?.mentorId;

  // ── Fetch transactions ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mentorId) return;
    setTxLoading(true);
    setTxError(null);

    SessionService.getMentorSessions(mentorId)
      .then((res) => {
        const sessions: any[] = Array.isArray(res.data) ? res.data : [];
        const rows: TransactionRow[] = sessions.flatMap((s: any) =>
          (s.bookings || []).map((b: any) => ({
            bookingId: b._id,
            menteeId: b.menteeId || b.bookedBy || "",
            menteeName: b.mentee?.fullName || s.bookedMenteeName || "Unknown",
            menteeProfilePhotoId: b.mentee?.profilePic || null,
            date: b.bookedAt
              ? new Date(b.bookedAt).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                })
              : "—",
            basePrice: b.pricing?.basePrice ?? s.pricing?.basePrice ?? 0,
            platformFee: b.pricing?.platformFee ?? s.pricing?.platformFee ?? 0,
            total: b.pricing?.totalAmount ?? s.pricing?.totalAmount ?? 0,
            method: b.payment?.method || s.payment?.method || "—",
            paymentStatus: derivePaymentStatus(b.status),
            bookingStatus: b.status || "pending",
          }))
        );
        setTransactions(rows);
      })
      .catch(() => setTxError("Failed to load payment data. Please try again."))
      .finally(() => setTxLoading(false));
  }, [mentorId]);

  // ── Fetch withdrawal methods ────────────────────────────────────────────
  useEffect(() => {
    if (!mentorId) return;
    setMethodsLoading(true);
    WithdrawalService.getMethods(mentorId)
      .then((res) => setMethods(res.data.data || []))
      .catch(() => setMethods([]))
      .finally(() => setMethodsLoading(false));
  }, [mentorId]);

  // ── Resolve mentee photos ───────────────────────────────────────────────
  useEffect(() => {
    const mappings = transactions
      .filter((t) => t.menteeId && t.menteeProfilePhotoId && !photoUrls[t.menteeId])
      .map((t) => ({ menteeId: t.menteeId, photoId: t.menteeProfilePhotoId as string }));

    const unique = Array.from(new Map(mappings.map((m) => [m.menteeId, m])).values());
    if (unique.length === 0) return;

    Promise.all(
      unique.map((m) =>
        ProfileService.getProfilePhotoById(m.photoId)
          .then((res: any) => ({ id: m.menteeId, url: res?.data?.photo?.cloudinarySecureUrl }))
          .catch(() => ({ id: m.menteeId, url: null }))
      )
    ).then((results) => {
      setPhotoUrls((prev) => {
        const next = { ...prev };
        results.forEach(({ id, url }) => { if (url) next[id] = url; });
        return next;
      });
    });
  }, [transactions]);

  // ── Earnings calculations ───────────────────────────────────────────────
  const earnedRows = transactions.filter((t) =>
    ["confirmed", "rescheduled", "in_progress", "completed"].includes(t.bookingStatus)
  );
  const totalEarnings = earnedRows.reduce((sum, t) => sum + t.total, 0);

  const now = new Date();
  const thisMonthEarnings = earnedRows
    .filter((t) => {
      const d = new Date(t.date);
      return !isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.total, 0);

  const pendingAmount = transactions
    .filter((t) => t.paymentStatus === "pending")
    .reduce((sum, t) => sum + t.total, 0);

  const grandTotal = transactions.reduce((sum, t) => sum + t.total, 0);

  const earningsStats = [
    {
      label: "Total Earnings", amount: `₹${totalEarnings.toLocaleString("en-IN")}`,
      icon: TrendingUp, change: totalEarnings > 0 ? `₹${totalEarnings.toLocaleString("en-IN")} earned` : "No earnings yet",
      showArrow: totalEarnings > 0,
    },
    {
      label: "This Month", amount: `₹${thisMonthEarnings.toLocaleString("en-IN")}`,
      icon: Calendar, change: thisMonthEarnings > 0 ? `₹${thisMonthEarnings.toLocaleString("en-IN")} this month` : "No earnings this month",
      showArrow: thisMonthEarnings > 0,
    },
    {
      label: "Pending", amount: `₹${pendingAmount.toLocaleString("en-IN")}`,
      icon: Clock, change: pendingAmount > 0 ? "Awaiting confirmation" : "No pending payments",
      showArrow: false,
    },
  ];

  // ── Withdrawal method handlers ──────────────────────────────────────────
  const handleMethodAdded = (method: WithdrawalMethod) => {
    setMethods((prev) => {
      const updated = method.isDefault
        ? prev.map((m) => ({ ...m, isDefault: false }))
        : prev;
      return [method, ...updated];
    });
    setAddModal(null);
  };

  const handleDelete = async (methodId: string) => {
    if (!mentorId) return;
    setDeletingId(methodId);
    try {
      await WithdrawalService.deleteMethod(mentorId, methodId);
      setMethods((prev) => prev.filter((m) => m._id !== methodId));
    } catch {
      alert("Failed to delete method.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    if (!mentorId) return;
    try {
      await WithdrawalService.setDefault(mentorId, methodId);
      setMethods((prev) =>
        prev.map((m) => ({ ...m, isDefault: m._id === methodId }))
      );
    } catch {
      alert("Failed to update default method.");
    }
  };

  // ── Status badge ────────────────────────────────────────────────────────
  const paymentStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed") return "bg-green-100 text-green-700";
    if (s === "pending") return "bg-yellow-100 text-yellow-700";
    if (s === "failed") return "bg-red-100 text-red-700";
    if (s === "refunded") return "bg-purple-100 text-purple-700";
    if (s === "cancelled") return "bg-gray-100 text-gray-600";
    return "bg-yellow-100 text-yellow-700";
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Modal */}
      {addModal && mentorId && (
        <AddMethodModal
          type={addModal}
          mentorId={mentorId}
          onClose={() => setAddModal(null)}
          onSuccess={handleMethodAdded}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: "#4a3728" }}>
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold" style={{ color: "#4a3728" }}>Payment &amp; Earnings</h2>
          <p style={{ color: "#8a7a6a" }} className="text-sm">Track your income</p>
        </div>
      </div>

      {/* Earnings Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {earningsStats.map((stat, idx) => (
          <div key={idx} className="p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300" style={{ backgroundColor: "#4a3728" }}>
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm opacity-90 font-semibold">{stat.label}</p>
              <stat.icon className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-4xl font-bold mb-2">{stat.amount}</p>
            <div className="flex items-center gap-2 text-sm opacity-80">
              {stat.showArrow && <ArrowUp className="w-4 h-4" />}
              <span>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-[#e0d8cf]">
        <h3 className="text-2xl font-bold mb-6" style={{ color: "#4a3728" }}>Transaction History</h3>

        {txLoading ? (
          <div className="flex items-center justify-center py-12 text-[#8a7a6a]">
            <Loader2 className="w-5 h-5 animate-spin mr-3" />
            <span className="font-semibold">Loading transactions...</span>
          </div>
        ) : txError ? (
          <div className="py-8 text-center text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">{txError}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#fbf7f3" }}>
                  {["Mentee", "Date", "Base Price", "Platform Fee", "Total", "Method", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: "#4a3728" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#8a7a6a]">
                      <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold">No transactions yet</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    const photo = t.menteeId ? photoUrls[t.menteeId] : null;
                    return (
                      <tr key={t.bookingId} className="border-t border-[#e0d8cf] hover:bg-[#fbf7f3] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {photo ? (
                              <img src={photo} alt={t.menteeName} className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = "none"; }} />
                            ) : null}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${photo ? "hidden" : ""}`}
                              style={{ backgroundColor: "#4a3728" }}>
                              {(t.menteeName || "?")[0].toUpperCase()}
                            </div>
                            <span className="font-medium text-[#4a3728]">{t.menteeName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#8a7a6a]">{t.date}</td>
                        <td className="px-4 py-3 font-medium text-[#4a3728]">₹{t.basePrice}</td>
                        <td className="px-4 py-3 text-[#8a7a6a]">₹{t.platformFee}</td>
                        <td className="px-4 py-3 font-bold text-green-600">₹{t.total}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize" style={{ backgroundColor: "#fbf7f3", color: "#4a3728" }}>
                            {t.method}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${paymentStatusBadge(t.paymentStatus)}`}>
                            {t.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {transactions.length > 0 && (
                <tfoot>
                  <tr style={{ backgroundColor: "#4a3728" }}>
                    <td colSpan={4} className="px-4 py-3 text-white font-bold">Grand Total</td>
                    <td className="px-4 py-3 text-white font-bold text-lg">₹{grandTotal.toLocaleString("en-IN")}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Methods */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-[#e0d8cf]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-[#4a3728]">Withdrawal Methods</h3>
            <p className="text-sm text-[#8a7a6a] mt-1">Add bank account or UPI to receive payouts</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAddModal("bank")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-[#4a3728] text-[#4a3728] hover:bg-[#4a3728] hover:text-white transition-all"
            >
              <Building2 className="w-4 h-4" /> Bank
            </button>
            <button
              onClick={() => setAddModal("upi")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: "#4a3728" }}
            >
              <Smartphone className="w-4 h-4" /> UPI
            </button>
          </div>
        </div>

        {methodsLoading ? (
          <div className="flex items-center justify-center py-8 text-[#8a7a6a]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm font-semibold">Loading methods...</span>
          </div>
        ) : methods.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-[#e0d8cf] rounded-2xl">
            <CreditCard className="w-12 h-12 mx-auto text-[#c0b8b0] mb-3" />
            <p className="font-bold text-[#4a3728] mb-1">No withdrawal methods added</p>
            <p className="text-sm text-[#8a7a6a] mb-4">Add a bank account or UPI ID to receive your earnings</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setAddModal("bank")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-[#4a3728] text-[#4a3728] hover:bg-[#4a3728] hover:text-white transition-all">
                <Building2 className="w-4 h-4" /> Add Bank
              </button>
              <button onClick={() => setAddModal("upi")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ backgroundColor: "#4a3728" }}>
                <Smartphone className="w-4 h-4" /> Add UPI
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((m) => (
              <MethodCard
                key={m._id}
                method={m}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
                deleting={deletingId === m._id}
              />
            ))}
            <button
              onClick={() => setAddModal("bank")}
              className="w-full py-3 rounded-xl border-2 border-dashed border-[#e0d8cf] text-[#8a7a6a] text-sm font-semibold hover:border-[#4a3728] hover:text-[#4a3728] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Another Method
            </button>
          </div>
        )}
      </div>
    </div>
  );
}