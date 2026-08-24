// mentorDashboard/components/PaymentsPage.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  ArrowUp,
} from "lucide-react";
import SessionService from "@/lib/api/session.service";
import ProfileService from "@/lib/api/profile.service";

/**
 * Maps booking lifecycle status → a meaningful payment display label.
 *
 * WHY: booking.payment.status is set to "pending" at booking creation and is
 * NEVER updated by any backend lifecycle event (confirm / start / complete).
 * The model has an updatePaymentStatus() method but it has ZERO callers —
 * there is no Razorpay webhook that updates this field.
 *
 * booking.status IS reliably updated through the full lifecycle, so we derive
 * the payment display label from it.
 */
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

interface PaymentsPageProps {
  mentorData: any;
}

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
  bookingStatus: string; // kept separately — used for earnings calc
};

export default function PaymentsPage({ mentorData }: PaymentsPageProps) {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch mentor-specific sessions ────────────────────────────────────────
  useEffect(() => {
    if (!mentorData?.mentorId) return;

    setLoading(true);
    setError(null);

    SessionService.getMentorSessions(mentorData.mentorId)
      .then((res) => {
        const sessions: any[] = Array.isArray(res.data) ? res.data : [];

        // Flatten: one row per booking, enriched by backend with b.mentee
        const rows: TransactionRow[] = sessions.flatMap((s: any) =>
          (s.bookings || []).map((b: any) => ({
            bookingId: b._id,
            menteeId: b.menteeId || b.bookedBy || "",
            menteeName:
              b.mentee?.fullName ||
              s.bookedMenteeName ||
              s.menteeName ||
              "Unknown",
            menteeProfilePhotoId: b.mentee?.profilePic || null,
            date: b.bookedAt
              ? new Date(b.bookedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—",
            basePrice: b.pricing?.basePrice ?? s.pricing?.basePrice ?? 0,
            platformFee:
              b.pricing?.platformFee ?? s.pricing?.platformFee ?? 0,
            total: b.pricing?.totalAmount ?? s.pricing?.totalAmount ?? 0,
            method: b.payment?.method || s.payment?.method || "—",
            // ✅ Derive display payment status from booking.status.
            // Background: booking.payment.status is set to "pending" at creation
            // and is NEVER updated by confirm/start/complete lifecycle events
            // (updatePaymentStatus exists in the model but has zero callers).
            // booking.status IS reliably updated, so we map it to a payment label.
            paymentStatus: derivePaymentStatus(b.status),
            // Booking status kept separately for earnings calculations
            bookingStatus: b.status || "pending",
          }))
        );

        setTransactions(rows);
      })
      .catch((err) => {
        console.error("[PaymentsPage] Failed to fetch mentor sessions:", err);
        setError("Failed to load payment data. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [mentorData?.mentorId]);

  // ── Resolve mentee profile photos (same approach as BookingsPage) ──────────
  useEffect(() => {
    const mappings = transactions
      .filter(
        (t) => t.menteeId && t.menteeProfilePhotoId && !photoUrls[t.menteeId]
      )
      .map((t) => ({
        menteeId: t.menteeId,
        photoId: t.menteeProfilePhotoId as string,
      }));

    const unique = Array.from(
      new Map(mappings.map((m) => [m.menteeId, m])).values()
    );

    if (unique.length > 0) {
      Promise.all(
        unique.map((m) =>
          ProfileService.getProfilePhotoById(m.photoId)
            .then((res: any) => ({
              id: m.menteeId,
              url: res?.data?.photo?.cloudinarySecureUrl,
            }))
            .catch(() => ({ id: m.menteeId, url: null }))
        )
      ).then((results) => {
        setPhotoUrls((prev) => {
          const next = { ...prev };
          results.forEach(({ id, url }) => {
            if (url) next[id] = url;
          });
          return next;
        });
      });
    }
  }, [transactions]);

  // ── Earnings calculations (mentor-specific, from fetched data) ────────────
  // "Earned" = bookings in a confirmed/active/completed state
  const earnedRows = transactions.filter((t) =>
    ["confirmed", "rescheduled", "in_progress", "completed"].includes(
      t.bookingStatus
    )
  );
  const totalEarnings = earnedRows.reduce((sum, t) => sum + t.total, 0);

  const now = new Date();
  const thisMonthRows = earnedRows.filter((t) => {
    // Use the raw date string from the original booking; re-parse it
    const d = new Date(t.date);
    return (
      !isNaN(d.getTime()) &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });
  const thisMonthEarnings = thisMonthRows.reduce((sum, t) => sum + t.total, 0);

  // Pending = pending payment status rows
  const pendingRows = transactions.filter(
    (t) => t.paymentStatus === "pending"
  );
  const pendingAmount = pendingRows.reduce((sum, t) => sum + t.total, 0);

  const grandTotal = transactions.reduce((sum, t) => sum + t.total, 0);

  const earningsStats = [
    {
      label: "Total Earnings",
      amount: `₹${totalEarnings.toLocaleString("en-IN")}`,
      icon: TrendingUp,
      change:
        totalEarnings > 0
          ? `₹${totalEarnings.toLocaleString("en-IN")} earned`
          : "No earnings yet",
      showArrow: totalEarnings > 0,
    },
    {
      label: "This Month",
      amount: `₹${thisMonthEarnings.toLocaleString("en-IN")}`,
      icon: Calendar,
      change:
        thisMonthEarnings > 0
          ? `₹${thisMonthEarnings.toLocaleString("en-IN")} this month`
          : "No earnings this month",
      showArrow: thisMonthEarnings > 0,
    },
    {
      label: "Pending",
      amount: `₹${pendingAmount.toLocaleString("en-IN")}`,
      icon: Clock,
      change:
        pendingAmount > 0 ? "Awaiting confirmation" : "No pending payments",
      showArrow: false,
    },
  ];

  // ── Payment status badge ──────────────────────────────────────────────────
  const paymentStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed")
      return "bg-green-100 text-green-700";
    if (s === "pending")
      return "bg-yellow-100 text-yellow-700";
    if (s === "failed")
      return "bg-red-100 text-red-700";
    if (s === "refunded")
      return "bg-purple-100 text-purple-700";
    if (s === "cancelled")
      return "bg-gray-100 text-gray-600";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: "#4a3728" }}
        >
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2
            className="text-3xl font-bold"
            style={{ color: "#4a3728" }}
          >
            Payment &amp; Earnings
          </h2>
          <p style={{ color: "#8a7a6a" }} className="text-sm">
            Track your income
          </p>
        </div>
      </div>

      {/* Earnings Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {earningsStats.map((stat, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300"
            style={{ backgroundColor: "#4a3728" }}
          >
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

      {/* Transactions + Withdrawal Methods */}
      <div className="grid grid-cols-1 gap-6">
        {/* Transaction History Table */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-[#e0d8cf]">
          <h3
            className="text-2xl font-bold mb-6"
            style={{ color: "#4a3728" }}
          >
            Transaction History
          </h3>

          {loading ? (
            <div
              className="flex items-center justify-center py-12"
              style={{ color: "#8a7a6a" }}
            >
              <Clock className="w-5 h-5 animate-spin mr-3" />
              <span className="font-semibold">Loading transactions...</span>
            </div>
          ) : error ? (
            <div className="py-8 text-center" style={{ color: "#ef4444" }}>
              <p className="font-semibold">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#fbf7f3" }}>
                    {[
                      "Mentee",
                      "Date",
                      "Base Price",
                      "Platform Fee",
                      "Total",
                      "Method",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-semibold"
                        style={{ color: "#4a3728" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center"
                        style={{ color: "#8a7a6a" }}
                      >
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => {
                      const resolvedPhoto = t.menteeId
                        ? photoUrls[t.menteeId]
                        : null;
                      return (
                        <tr
                          key={t.bookingId}
                          className="border-t border-[#e0d8cf] hover:bg-[#fbf7f3] transition-colors"
                        >
                          {/* ── Mentee avatar + name ───────────────────── */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {resolvedPhoto ? (
                                <img
                                  src={resolvedPhoto}
                                  alt={t.menteeName}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const sib =
                                      e.currentTarget.nextElementSibling;
                                    if (sib)
                                      (sib as HTMLElement).classList.remove(
                                        "hidden"
                                      );
                                  }}
                                />
                              ) : null}
                              {/* Fallback initial — hidden when photo loads */}
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                                  resolvedPhoto ? "hidden" : ""
                                }`}
                                style={{ backgroundColor: "#4a3728" }}
                              >
                                {(t.menteeName || "?")[0].toUpperCase()}
                              </div>
                              <span
                                className="font-medium"
                                style={{ color: "#4a3728" }}
                              >
                                {t.menteeName}
                              </span>
                            </div>
                          </td>

                          {/* ── Date ───────────────────────────────────── */}
                          <td
                            className="px-4 py-3"
                            style={{ color: "#8a7a6a" }}
                          >
                            {t.date}
                          </td>

                          {/* ── Base price ─────────────────────────────── */}
                          <td
                            className="px-4 py-3 font-medium"
                            style={{ color: "#4a3728" }}
                          >
                            ₹{t.basePrice}
                          </td>

                          {/* ── Platform fee ───────────────────────────── */}
                          <td
                            className="px-4 py-3"
                            style={{ color: "#8a7a6a" }}
                          >
                            ₹{t.platformFee}
                          </td>

                          {/* ── Total ──────────────────────────────────── */}
                          <td className="px-4 py-3 font-bold text-green-600">
                            ₹{t.total}
                          </td>

                          {/* ── Payment method ─────────────────────────── */}
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-1 rounded-full text-xs font-semibold capitalize"
                              style={{
                                backgroundColor: "#fbf7f3",
                                color: "#4a3728",
                              }}
                            >
                              {t.method}
                            </span>
                          </td>

                          {/* ── Payment status (b.payment.status) ──────── */}
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${paymentStatusBadge(
                                t.paymentStatus
                              )}`}
                            >
                              {t.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Grand Total row */}
                {transactions.length > 0 && (
                  <tfoot>
                    <tr style={{ backgroundColor: "#4a3728" }}>
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-white font-bold"
                      >
                        Grand Total
                      </td>
                      <td className="px-4 py-3 text-white font-bold text-lg">
                        ₹{grandTotal.toLocaleString("en-IN")}
                      </td>
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
          <h3
            className="text-2xl font-bold mb-6"
            style={{ color: "#4a3728" }}
          >
            Withdrawal Methods
          </h3>
          <div className="space-y-4">
            <div
              className="p-4 rounded-xl border-2 hover:shadow-md transition-all"
              style={{ borderColor: "#e0d8cf", backgroundColor: "#fbf7f3" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: "#4a3728" }}>
                  Bank Transfer
                </span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm" style={{ color: "#8a7a6a" }}>
                HDFC Bank ****5678
              </p>
            </div>

            <div
              className="p-4 rounded-xl border-2 hover:shadow-md transition-all"
              style={{ borderColor: "#e0d8cf", backgroundColor: "#fbf7f3" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: "#4a3728" }}>
                  UPI
                </span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm" style={{ color: "#8a7a6a" }}>
                rajesh@upi
              </p>
            </div>

            <button
              className="w-full py-3 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              style={{ backgroundColor: "#4a3728" }}
            >
              Add New Method
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}