"use client";

import React, { useState } from "react";
import SearchInput from "./SearchInput";
import FilterDropdown from "./FilterDropdown";
import DateRangeFilter from "./DateRangeFilter";
import MoreFiltersPanel from "./MoreFiltersPanel";
import { FilterState } from "@/features/mentorship/hooks/usePaymentFilters";
import { SlidersHorizontal, RotateCcw, X } from "lucide-react";

interface PaymentFiltersProps {
  filters: FilterState;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  clearAllFilters: () => void;
  moreFilterCount: number;
  isFilterActive: boolean;
  activeChips: { id: keyof FilterState; label: string; onRemove: () => void }[];
  totalCount: number;
  filteredCount: number;
  disabled?: boolean;
  withdrawalJumpButtonNode?: React.ReactNode;
  availableSessionTypes?: string[];
}

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

const METHOD_OPTIONS = [
  { label: "All Methods", value: "all" },
  { label: "Wallet", value: "wallet" },
  { label: "Razorpay", value: "razorpay" },
  { label: "UPI", value: "upi" },
  { label: "Bank Transfer", value: "bank_transfer" },
];

export default function PaymentFilters({
  filters,
  updateFilter,
  clearAllFilters,
  moreFilterCount,
  isFilterActive,
  activeChips,
  totalCount,
  filteredCount,
  disabled = false,
  withdrawalJumpButtonNode,
  availableSessionTypes,
}: PaymentFiltersProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <div className="space-y-4 mb-6">
      {/* Top Filter Bar Row */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search Box + Withdrawal Jump Button */}
        <div className="flex items-center gap-3 flex-1">
          <SearchInput
            value={filters.search}
            onChange={(val) => updateFilter("search", val)}
            disabled={disabled}
          />
          {withdrawalJumpButtonNode}
        </div>

        {/* Primary Filters (Status, Method, Date Range, More Filters button) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <FilterDropdown
            value={filters.status}
            onChange={(val) => updateFilter("status", val)}
            options={STATUS_OPTIONS}
            disabled={disabled}
            ariaLabel="Filter by payment status"
            className="w-[140px]"
          />

          {/* Payment Method */}
          <FilterDropdown
            value={filters.method}
            onChange={(val) => updateFilter("method", val)}
            options={METHOD_OPTIONS}
            disabled={disabled}
            ariaLabel="Filter by payment method"
            className="w-[145px]"
          />

          {/* Date Range */}
          <DateRangeFilter
            value={filters.dateRange}
            onChange={(val) => updateFilter("dateRange", val)}
            customFrom={filters.customFrom}
            customTo={filters.customTo}
            onCustomFromChange={(val) => updateFilter("customFrom", val)}
            onCustomToChange={(val) => updateFilter("customTo", val)}
            disabled={disabled}
            className="w-[145px]"
          />

          {/* More Filters Toggle */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            disabled={disabled}
            aria-expanded={isMoreOpen}
            aria-label="Toggle advanced filters"
            className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isMoreOpen || moreFilterCount > 0
                ? "border-[#4a3728] bg-[#4a3728] text-white shadow-sm"
                : "border-[#e0d8cf] bg-white text-[#4a3728] hover:border-[#4a3728]"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">More Filters</span>
            {moreFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-500 text-white">
                {moreFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Advanced Filters Panel */}
      <MoreFiltersPanel
        isOpen={isMoreOpen}
        filters={filters}
        updateFilter={updateFilter}
        availableSessionTypes={availableSessionTypes}
        disabled={disabled}
      />

      {/* Active Chips & Results Count Bar */}
      {isFilterActive && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#e0d8cf]/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#8a7a6a]">Active Filters:</span>
            {activeChips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fbf7f3] text-[#4a3728] border border-[#e0d8cf] shadow-sm"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onRemove}
                  disabled={disabled}
                  className="hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Remove filter"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={disabled}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 ml-1 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" /> Clear All
            </button>
          </div>

          <div className="text-xs font-medium text-[#8a7a6a]">
            Showing <span className="font-bold text-[#4a3728]">{filteredCount}</span> of{" "}
            <span className="font-bold text-[#4a3728]">{totalCount}</span> transactions
          </div>
        </div>
      )}
    </div>
  );
}
