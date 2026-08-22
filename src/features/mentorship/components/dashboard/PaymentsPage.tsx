// mentorDashboard/components/PaymentsPage.tsx
import React from "react"
import {
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  ArrowUp,
} from "lucide-react"

interface PaymentsPageProps {
  sessions?: any[];
}

export default function PaymentsPage({ sessions = [] }: PaymentsPageProps) {
  // Compute earnings from real session data by mapping bookings to their resolved pricing
  const allBookings = sessions.flatMap((s: any) => 
    (s.bookings || []).map((b: any) => ({
      ...b,
      resolvedTotalAmount: b.pricing?.totalAmount ?? s.pricing?.totalAmount ?? 0
    }))
  );

  // Consider any booking that the mentor has accepted as "earned"
  const earnedBookings = allBookings.filter((b: any) => 
    ["confirmed", "rescheduled", "in_progress", "completed"].includes(b.status)
  );

  const totalEarnings = earnedBookings.reduce((sum: number, b: any) => sum + b.resolvedTotalAmount, 0);

  const now = new Date();
  const thisMonthBookings = earnedBookings.filter((b: any) => {
    const d = new Date(b.scheduledAt || b.bookedAt || now);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthEarnings = thisMonthBookings.reduce((sum: number, b: any) => sum + b.resolvedTotalAmount, 0);

  // Pending Amount = requests waiting for mentor to accept
  const pendingBookings = allBookings.filter((b: any) => b.status === "pending");
  const pendingAmount = pendingBookings.reduce((sum: number, b: any) => sum + b.resolvedTotalAmount, 0);

  const earningsStats = [
    {
      label: "Total Earnings",
      amount: `₹${totalEarnings.toLocaleString("en-IN")}`,
      icon: TrendingUp,
      change: totalEarnings > 0 ? `₹${totalEarnings.toLocaleString("en-IN")} earned` : "No earnings yet",
      showArrow: totalEarnings > 0,
    },
    {
      label: "This Month",
      amount: `₹${thisMonthEarnings.toLocaleString("en-IN")}`,
      icon: Calendar,
      change: thisMonthEarnings > 0 ? `₹${thisMonthEarnings.toLocaleString("en-IN")} this month` : "No earnings this month",
      showArrow: thisMonthEarnings > 0,
    },
    {
      label: "Pending",
      amount: `₹${pendingAmount.toLocaleString("en-IN")}`,
      icon: Clock,
      change: pendingAmount > 0 ? "Awaiting confirmation" : "No pending payments",
      showArrow: false,
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: "#4a3728" }}>
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold" style={{ color: "#4a3728" }}>
            Payment & Earnings
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
        {/* Recent Transactions Table */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-[#e0d8cf]">
          <h3 className="text-2xl font-bold mb-6" style={{ color: "#4a3728" }}>
            Transaction History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#fbf7f3" }}>
                  {["Mentee", "Date", "Base Price", "Platform Fee", "Total", "Method", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: "#4a3728" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.flatMap((s: any) =>
                  (s.bookings || []).map((b: any) => ({
                    mentee: s.bookedMenteeName || b.menteeId?.slice(0, 8) || "Unknown",
                    date: b.bookedAt ? new Date(b.bookedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
                    basePrice: b.pricing?.basePrice ?? s.pricing?.basePrice ?? 0,
                    platformFee: b.pricing?.platformFee ?? s.pricing?.platformFee ?? 0,
                    total: b.pricing?.totalAmount ?? s.pricing?.totalAmount ?? 0,
                    method: b.payment?.method || s.payment?.method || "—",
                    status: b.status || "—",
                    id: b._id,
                  }))
                ).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center" style={{ color: "#8a7a6a" }}>
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  sessions.flatMap((s: any) =>
                    (s.bookings || []).map((b: any) => {
                      const basePrice = b.pricing?.basePrice ?? s.pricing?.basePrice ?? 0;
                      const platformFee = b.pricing?.platformFee ?? s.pricing?.platformFee ?? 0;
                      const total = b.pricing?.totalAmount ?? s.pricing?.totalAmount ?? 0;
                      const status = b.status || "pending";
                      return (
                        <tr key={b._id} className="border-t border-[#e0d8cf] hover:bg-[#fbf7f3] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#4a3728" }}>
                                {(s.bookedMenteeName || "?")[0].toUpperCase()}
                              </div>
                              <span className="font-medium" style={{ color: "#4a3728" }}>
                                {s.bookedMenteeName || b.menteeId?.slice(0, 8) || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3" style={{ color: "#8a7a6a" }}>
                            {b.bookedAt ? new Date(b.bookedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-4 py-3 font-medium" style={{ color: "#4a3728" }}>₹{basePrice}</td>
                          <td className="px-4 py-3" style={{ color: "#8a7a6a" }}>₹{platformFee}</td>
                          <td className="px-4 py-3 font-bold text-green-600">₹{total}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize" style={{ backgroundColor: "#fbf7f3", color: "#4a3728" }}>
                              {b.payment?.method || s.payment?.method || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>
              {/* Grand Total Row */}
              {sessions.flatMap((s: any) => s.bookings || []).length > 0 && (
                <tfoot>
                  <tr style={{ backgroundColor: "#4a3728" }}>
                    <td colSpan={4} className="px-4 py-3 text-white font-bold">Grand Total</td>
                    <td className="px-4 py-3 text-white font-bold text-lg">
                      ₹{sessions.flatMap((s: any) => (s.bookings || []).map((b: any) => b.pricing?.totalAmount ?? s.pricing?.totalAmount ?? 0)).reduce((a: number, b: number) => a + b, 0).toLocaleString("en-IN")}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Withdrawal Methods */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-[#e0d8cf]">
          <h3 className="text-2xl font-bold mb-6" style={{ color: "#4a3728" }}>
            Withdrawal Methods
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border-2 hover:shadow-md transition-all" style={{ borderColor: "#e0d8cf", backgroundColor: "#fbf7f3" }}>
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

            <div className="p-4 rounded-xl border-2 hover:shadow-md transition-all" style={{ borderColor: "#e0d8cf", backgroundColor: "#fbf7f3" }}>
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
  )
}