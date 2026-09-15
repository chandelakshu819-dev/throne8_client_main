import React, { useState, useMemo } from "react";
import { Receipt, FileText, IndianRupee, TrendingUp, Clock, AlertCircle } from "lucide-react";

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  wash: "#f6ede8",
  softWash: "#fbf7f3",
  chip: "#f3ece4",
  paper: "#fffdfb",
  gold: "#c9a87c",
  muted: "#8a7a6a",
  danger: "#dc2626",
  dangerWash: "#fef2f2",
  success: "#15803d",
  successWash: "#f0fdf4",
  warning: "#b45309",
  warningWash: "#fffbeb",
};

type Session = {
  _id?: string;
  sessionId?: string;
  mentorName?: string;
  mentorProfilePhoto?: string;
  title?: string;
  sessionType?: string;
  scheduledAt?: string;
  startTime?: string;
  status?: string;
  pricing?: {
    totalAmount?: number;
    currency?: string;
  };
  payment?: {
    status?: string;
    method?: string;
    transactionId?: string;
  };
  invoiceUrl?: string;
  receiptUrl?: string;
};

interface Props {
  sessions?: Session[];
}

function formatDateStr(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function initialsFrom(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "M";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

type TabType = "all" | "successful" | "pending" | "failed";

export default function UserDashboardPaymentsPage({ sessions = [] }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Extract transactions from sessions that have a payment or pricing
  const transactions = useMemo(() => {
    return sessions
      .filter((s) => s.pricing?.totalAmount !== undefined || s.payment?.status)
      .map((s, idx) => {
        const rawStatus = s.payment?.status || "";
        const lowerRaw = rawStatus.toLowerCase();
        
        let filterCategory: "successful" | "pending" | "failed" = "pending";
        if (lowerRaw === "paid" || lowerRaw === "success" || lowerRaw === "completed" || lowerRaw === "successful") {
          filterCategory = "successful";
        } else if (lowerRaw === "failed" || lowerRaw === "error") {
          filterCategory = "failed";
        } else {
          filterCategory = "pending";
        }

        return {
          id: s._id || s.sessionId || `TX-${idx}`,
          mentorName: s.mentorName || "Mentor",
          mentorPhoto: s.mentorProfilePhoto,
          serviceName: s.title || "Mentorship Session",
          amount: s.pricing?.totalAmount || 0,
          currency: s.pricing?.currency || "INR",
          date: s.startTime || s.scheduledAt,
          rawStatus: rawStatus,
          filterCategory,
          method: s.payment?.method || "Not available",
          transactionId: s.payment?.transactionId,
          invoiceUrl: s.invoiceUrl || s.receiptUrl,
        };
      })
      .sort((a, b) => {
        const ta = new Date(a.date || 0).getTime();
        const tb = new Date(b.date || 0).getTime();
        return tb - ta; // Descending order (newest first)
      });
  }, [sessions]);

  const filteredTransactions = useMemo(() => {
    if (activeTab === "all") return transactions;
    return transactions.filter((t) => t.filterCategory === activeTab);
  }, [transactions, activeTab]);

  const stats = useMemo(() => {
    return {
      total: transactions.reduce((sum, t) => sum + t.amount, 0),
      successful: transactions.filter(t => t.filterCategory === "successful").reduce((sum, t) => sum + t.amount, 0),
      pending: transactions.filter(t => t.filterCategory === "pending").reduce((sum, t) => sum + t.amount, 0),
      failed: transactions.filter(t => t.filterCategory === "failed").reduce((sum, t) => sum + t.amount, 0),
    };
  }, [transactions]);

  const getStatusBadgeStyles = (category: string, raw: string) => {
    const label = raw || "Pending";
    if (category === "successful") return { bg: COLORS.successWash, text: COLORS.success, label };
    if (category === "failed") return { bg: COLORS.dangerWash, text: COLORS.danger, label };
    return { bg: COLORS.warningWash, text: COLORS.warning, label };
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl pt-2 pb-8">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
          Payments & Transactions
        </h2>
        <p style={{ color: COLORS.muted }} className="text-sm mt-1">
          View your payment history, invoices, and transaction details.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Payments", value: stats.total, icon: IndianRupee, color: COLORS.ink },
          { label: "Successful", value: stats.successful, icon: TrendingUp, color: COLORS.success },
          { label: "Pending", value: stats.pending, icon: Clock, color: COLORS.warning },
          { label: "Failed", value: stats.failed, icon: AlertCircle, color: COLORS.danger },
        ].map((stat, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-white flex flex-col gap-2 shadow-sm border" style={{ borderColor: COLORS.hairline }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>{stat.label}</span>
              <stat.icon className="w-4 h-4 opacity-70" style={{ color: stat.color }} />
            </div>
            <span className="text-xl font-bold" style={{ color: stat.color }}>{formatCurrency(stat.value)}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {(["all", "successful", "pending", "failed"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap capitalize border ${
              activeTab === tab
                ? "bg-white shadow-sm"
                : "bg-transparent border-transparent hover:bg-white/50"
            }`}
            style={{
              color: activeTab === tab ? COLORS.ink : COLORS.muted,
              borderColor: activeTab === tab ? COLORS.ink : "transparent",
              borderWidth: activeTab === tab ? "2px" : "1px",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center"
          style={{ backgroundColor: COLORS.softWash, border: `1px solid ${COLORS.hairline}` }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.chip }}>
            <Receipt className="w-8 h-8" style={{ color: COLORS.accent }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>No {activeTab !== "all" ? activeTab : ""} payments found</h3>
            <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
              You don't have any {activeTab !== "all" ? activeTab : ""} transactions to show.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTransactions.map((t) => {
            const statusStyle = getStatusBadgeStyles(t.filterCategory, t.rawStatus);

            return (
              <div
                key={t.id}
                className="flex flex-col md:flex-row items-start md:items-center gap-4 p-5 rounded-2xl transition-all hover:shadow-md bg-white border"
                style={{ borderColor: COLORS.hairline }}
              >
                {/* Mentor & Service Info */}
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  {t.mentorPhoto ? (
                    <img
                      src={t.mentorPhoto}
                      alt={t.mentorName}
                      className="w-12 h-12 rounded-full object-cover shrink-0 border"
                      style={{ borderColor: COLORS.hairline }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-base font-bold text-white bg-[#4a3728]"
                    >
                      {initialsFrom(t.mentorName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: COLORS.ink }}>
                      {t.serviceName}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: COLORS.muted }}>
                      with {t.mentorName}
                    </p>
                    {t.transactionId && (
                      <p className="text-[10px] font-mono mt-1 text-gray-500 truncate" title={t.transactionId}>
                        TXN: {t.transactionId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex items-center justify-between w-full md:w-auto md:gap-8 flex-wrap md:flex-nowrap pt-3 md:pt-0 border-t md:border-t-0 border-[#e0d8cf]">
                  <div className="flex flex-col gap-1 w-1/2 md:w-auto">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>Date</p>
                    <p className="text-sm font-medium" style={{ color: COLORS.ink }}>{formatDateStr(t.date)}</p>
                  </div>
                  <div className="flex flex-col gap-1 w-1/2 md:w-auto">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>Method</p>
                    <p className="text-sm font-medium capitalize" style={{ color: COLORS.ink }}>{t.method}</p>
                  </div>
                </div>

                {/* Amount & Status */}
                <div className="flex items-center justify-between w-full md:w-auto md:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-[#e0d8cf]">
                  <div className="flex flex-col gap-1 md:items-end w-1/2 md:w-auto">
                    <p className="text-[10px] font-bold uppercase tracking-wider md:text-right" style={{ color: COLORS.muted }}>Amount</p>
                    <p className="text-base font-bold" style={{ color: COLORS.ink }}>{formatCurrency(t.amount, t.currency)}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 w-1/2 md:w-auto">
                    {t.rawStatus && (
                      <span
                        className="inline-flex text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider items-center justify-center whitespace-nowrap"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                      >
                        {statusStyle.label}
                      </span>
                    )}
                    {!t.rawStatus && (
                       <span className="text-xs italic" style={{ color: COLORS.muted }}>Status unavailable</span>
                    )}
                    {t.invoiceUrl && (
                      <a
                        href={t.invoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] font-bold transition-colors hover:underline"
                        style={{ color: COLORS.accent }}
                      >
                        <FileText className="w-3 h-3" />
                        Invoice
                      </a>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
