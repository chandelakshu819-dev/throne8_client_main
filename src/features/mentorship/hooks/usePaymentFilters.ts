"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export type TransactionRow = {
  bookingId: string;
  transactionId: string;
  menteeId: string;
  menteeName: string;
  menteeEmail?: string;
  menteePhone?: string;
  menteeProfilePhotoId: string | null;
  rawDate: Date;
  date: string;
  basePrice: number;
  platformFee: number;
  total: number;
  method: string;
  paymentStatus: string;
  bookingStatus: string;
  sessionType?: string;
  payoutStatus?: string;
};

export type FilterState = {
  search: string;
  status: string;
  method: string;
  dateRange: string;
  customFrom: string;
  customTo: string;
  minAmount: string;
  maxAmount: string;
  sessionType: string;
  payoutStatus: string;
  menteeContact: string;
};

export const INITIAL_FILTERS: FilterState = {
  search: "",
  status: "all",
  method: "all",
  dateRange: "all",
  customFrom: "",
  customTo: "",
  minAmount: "",
  maxAmount: "",
  sessionType: "all",
  payoutStatus: "all",
  menteeContact: "",
};

const VALID_STATUSES = ["all", "completed", "pending", "failed", "refunded"];
const VALID_METHODS = ["all", "wallet", "razorpay", "upi", "bank_transfer"];
const VALID_RANGES = ["all", "7days", "this_month", "3months", "custom"];
const VALID_PAYOUTS = ["all", "paid_out", "pending_payout"];

export function usePaymentFilters(transactions: TransactionRow[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse initial filters from URL query parameters safely
  const initialFiltersFromUrl = useMemo<FilterState>(() => {
    const statusParam = searchParams.get("status") || "all";
    const methodParam = searchParams.get("method") || "all";
    const rangeParam = searchParams.get("range") || "all";
    const payoutParam = searchParams.get("payout") || "all";

    return {
      search: searchParams.get("search") || "",
      status: VALID_STATUSES.includes(statusParam.toLowerCase()) ? statusParam.toLowerCase() : "all",
      method: VALID_METHODS.includes(methodParam.toLowerCase()) ? methodParam.toLowerCase() : "all",
      dateRange: VALID_RANGES.includes(rangeParam.toLowerCase()) ? rangeParam.toLowerCase() : "all",
      customFrom: searchParams.get("from") || "",
      customTo: searchParams.get("to") || "",
      minAmount: searchParams.get("minAmount") || "",
      maxAmount: searchParams.get("maxAmount") || "",
      sessionType: searchParams.get("sessionType") || "all",
      payoutStatus: VALID_PAYOUTS.includes(payoutParam.toLowerCase()) ? payoutParam.toLowerCase() : "all",
      menteeContact: searchParams.get("contact") || "",
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<FilterState>(initialFiltersFromUrl);
  const [debouncedSearch, setDebouncedSearch] = useState(initialFiltersFromUrl.search);

  // Sync debounced search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // URL Persistence effect: sync filters to URL query params
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Keep active tab parameter intact
    if (!params.has("tab")) {
      params.set("tab", "payment");
    }

    // Update or clean filter params
    if (filters.search.trim()) params.set("search", filters.search.trim());
    else params.delete("search");

    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    else params.delete("status");

    if (filters.method && filters.method !== "all") params.set("method", filters.method);
    else params.delete("method");

    if (filters.dateRange && filters.dateRange !== "all") params.set("range", filters.dateRange);
    else params.delete("range");

    if (filters.customFrom) params.set("from", filters.customFrom);
    else params.delete("from");

    if (filters.customTo) params.set("to", filters.customTo);
    else params.delete("to");

    if (filters.minAmount !== "") params.set("minAmount", filters.minAmount);
    else params.delete("minAmount");

    if (filters.maxAmount !== "") params.set("maxAmount", filters.maxAmount);
    else params.delete("maxAmount");

    if (filters.sessionType && filters.sessionType !== "all") params.set("sessionType", filters.sessionType);
    else params.delete("sessionType");

    if (filters.payoutStatus && filters.payoutStatus !== "all") params.set("payout", filters.payoutStatus);
    else params.delete("payout");

    if (filters.menteeContact.trim()) params.set("contact", filters.menteeContact.trim());
    else params.delete("contact");

    const newQueryString = params.toString();
    const currentQueryString = searchParams.toString();

    if (newQueryString !== currentQueryString) {
      router.replace(`${pathname}?${newQueryString}`, { scroll: false });
    }
  }, [filters, pathname, router, searchParams]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilter = (key: keyof FilterState) => {
    setFilters((prev) => ({ ...prev, [key]: INITIAL_FILTERS[key] }));
  };

  const clearAllFilters = () => {
    setFilters(INITIAL_FILTERS);
    setDebouncedSearch("");
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((row) => {
      // 1. Search Box (mentee name or transaction ID / booking ID)
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const nameMatch = row.menteeName.toLowerCase().includes(q);
        const txMatch = (row.transactionId || "").toLowerCase().includes(q);
        const bookingMatch = (row.bookingId || "").toLowerCase().includes(q);
        if (!nameMatch && !txMatch && !bookingMatch) return false;
      }

      // 2. Status
      if (filters.status !== "all") {
        const rowStatus = row.paymentStatus.toLowerCase();
        if (rowStatus !== filters.status.toLowerCase()) return false;
      }

      // 3. Payment Method
      if (filters.method !== "all") {
        const rowMethod = row.method.toLowerCase().replace(/\s+/g, "_");
        const filterMethod = filters.method.toLowerCase().replace(/\s+/g, "_");
        if (!rowMethod.includes(filterMethod) && !filterMethod.includes(rowMethod)) return false;
      }

      // 4. Date Range
      if (filters.dateRange !== "all") {
        const rowTime = new Date(row.rawDate).getTime();
        const now = new Date();

        if (filters.dateRange === "7days") {
          const sevenDaysAgo = new Date().setDate(now.getDate() - 7);
          if (rowTime < sevenDaysAgo) return false;
        } else if (filters.dateRange === "this_month") {
          const d = new Date(row.rawDate);
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        } else if (filters.dateRange === "3months") {
          const ninetyDaysAgo = new Date().setDate(now.getDate() - 90);
          if (rowTime < ninetyDaysAgo) return false;
        } else if (filters.dateRange === "custom") {
          if (filters.customFrom) {
            const fromTime = new Date(filters.customFrom).setHours(0, 0, 0, 0);
            if (rowTime < fromTime) return false;
          }
          if (filters.customTo) {
            const toTime = new Date(filters.customTo).setHours(23, 59, 59, 999);
            if (rowTime > toTime) return false;
          }
        }
      }

      // 5. Amount Range
      if (filters.minAmount !== "") {
        const min = Number(filters.minAmount);
        if (!isNaN(min) && row.total < min) return false;
      }
      if (filters.maxAmount !== "") {
        const max = Number(filters.maxAmount);
        if (!isNaN(max) && row.total > max) return false;
      }

      // 6. Session / Service Type
      if (filters.sessionType !== "all") {
        const sType = (row.sessionType || "").toLowerCase();
        if (!sType.includes(filters.sessionType.toLowerCase())) return false;
      }

      // 7. Payout Status
      if (filters.payoutStatus !== "all") {
        const pStatus = (row.payoutStatus || "").toLowerCase().replace(/\s+/g, "_");
        const filterPStatus = filters.payoutStatus.toLowerCase().replace(/\s+/g, "_");
        if (pStatus !== filterPStatus) return false;
      }

      // 8. Mentee Contact (Email / Phone)
      if (filters.menteeContact.trim()) {
        const contactQ = filters.menteeContact.toLowerCase().trim();
        const emailMatch = (row.menteeEmail || "").toLowerCase().includes(contactQ);
        const phoneMatch = (row.menteePhone || "").toLowerCase().includes(contactQ);
        if (!emailMatch && !phoneMatch) return false;
      }

      return true;
    });
  }, [transactions, debouncedSearch, filters]);

  // Count active filters in "More Filters" panel
  const moreFilterCount = useMemo(() => {
    let count = 0;
    if (filters.minAmount !== "") count++;
    if (filters.maxAmount !== "") count++;
    if (filters.sessionType !== "all") count++;
    if (filters.payoutStatus !== "all") count++;
    if (filters.menteeContact.trim() !== "") count++;
    return count;
  }, [filters]);

  // Is any search or filter currently active?
  const isFilterActive = useMemo(() => {
    return (
      filters.search.trim() !== "" ||
      filters.status !== "all" ||
      filters.method !== "all" ||
      filters.dateRange !== "all" ||
      filters.minAmount !== "" ||
      filters.maxAmount !== "" ||
      filters.sessionType !== "all" ||
      filters.payoutStatus !== "all" ||
      filters.menteeContact.trim() !== ""
    );
  }, [filters]);

  // Filter chips array for active filters
  const activeChips = useMemo(() => {
    const chips: { id: keyof FilterState; label: string; onRemove: () => void }[] = [];

    if (filters.search.trim()) {
      chips.push({
        id: "search",
        label: `Search: "${filters.search}"`,
        onRemove: () => clearFilter("search"),
      });
    }
    if (filters.status !== "all") {
      const formattedStatus = filters.status.charAt(0).toUpperCase() + filters.status.slice(1);
      chips.push({
        id: "status",
        label: `Status: ${formattedStatus}`,
        onRemove: () => clearFilter("status"),
      });
    }
    if (filters.method !== "all") {
      const formattedMethod = filters.method.toUpperCase().replace("_", " ");
      chips.push({
        id: "method",
        label: `Method: ${formattedMethod}`,
        onRemove: () => clearFilter("method"),
      });
    }
    if (filters.dateRange !== "all") {
      let rangeLabel = "Date Range";
      if (filters.dateRange === "7days") rangeLabel = "Last 7 Days";
      else if (filters.dateRange === "this_month") rangeLabel = "This Month";
      else if (filters.dateRange === "3months") rangeLabel = "Last 3 Months";
      else if (filters.dateRange === "custom") {
        rangeLabel = `Custom: ${filters.customFrom || "..."} to ${filters.customTo || "..."}`;
      }
      chips.push({
        id: "dateRange",
        label: `Date: ${rangeLabel}`,
        onRemove: () => {
          setFilters((prev) => ({
            ...prev,
            dateRange: "all",
            customFrom: "",
            customTo: "",
          }));
        },
      });
    }
    if (filters.minAmount !== "") {
      chips.push({
        id: "minAmount",
        label: `Min: ₹${filters.minAmount}`,
        onRemove: () => clearFilter("minAmount"),
      });
    }
    if (filters.maxAmount !== "") {
      chips.push({
        id: "maxAmount",
        label: `Max: ₹${filters.maxAmount}`,
        onRemove: () => clearFilter("maxAmount"),
      });
    }
    if (filters.sessionType !== "all") {
      chips.push({
        id: "sessionType",
        label: `Type: ${filters.sessionType}`,
        onRemove: () => clearFilter("sessionType"),
      });
    }
    if (filters.payoutStatus !== "all") {
      const pLabel = filters.payoutStatus === "paid_out" ? "Paid Out" : "Pending Payout";
      chips.push({
        id: "payoutStatus",
        label: `Payout: ${pLabel}`,
        onRemove: () => clearFilter("payoutStatus"),
      });
    }
    if (filters.menteeContact.trim()) {
      chips.push({
        id: "menteeContact",
        label: `Contact: "${filters.menteeContact}"`,
        onRemove: () => clearFilter("menteeContact"),
      });
    }

    return chips;
  }, [filters]);

  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, row) => sum + row.total, 0);
  }, [filteredTransactions]);

  return {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    filteredTransactions,
    filteredTotal,
    moreFilterCount,
    isFilterActive,
    activeChips,
    totalCount: transactions.length,
    filteredCount: filteredTransactions.length,
  };
}
