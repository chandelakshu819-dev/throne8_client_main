"use client";

import React from "react";
import { FilterState } from "@/features/mentorship/hooks/usePaymentFilters";
import FilterDropdown from "./FilterDropdown";
import { IndianRupee, Mail, Layers, Landmark } from "lucide-react";

interface MoreFiltersPanelProps {
  isOpen: boolean;
  filters: FilterState;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  availableSessionTypes?: string[];
  disabled?: boolean;
}

export default function MoreFiltersPanel({
  isOpen,
  filters,
  updateFilter,
  availableSessionTypes = ["1-on-1 Session", "Consultation", "Workshop", "Mentoring", "Coaching"],
  disabled = false,
}: MoreFiltersPanelProps) {
  if (!isOpen) return null;

  const sessionTypeOptions = [
    { label: "All Session Types", value: "all" },
    ...availableSessionTypes.map((t) => ({ label: t, value: t })),
  ];

  const payoutStatusOptions = [
    { label: "All Payout Statuses", value: "all" },
    { label: "Paid Out", value: "paid_out" },
    { label: "Pending Payout", value: "pending_payout" },
  ];

  return (
    <div className="p-4 bg-[#fbf7f3] border-2 border-[#e0d8cf] rounded-2xl space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-[#e0d8cf] pb-2">
        <span className="text-xs font-bold text-[#4a3728] uppercase tracking-wider">
          Advanced Filters
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Amount Range */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#4a3728]">
            Amount Range (₹)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <IndianRupee className="w-3.5 h-3.5 text-[#8a7a6a] absolute left-2.5 top-3 pointer-events-none" />
              <input
                type="number"
                placeholder="Min"
                value={filters.minAmount}
                onChange={(e) => updateFilter("minAmount", e.target.value)}
                disabled={disabled}
                className="w-full pl-7 pr-2 py-2 rounded-xl border border-[#e0d8cf] text-xs text-[#4a3728] bg-white focus:outline-none focus:border-[#4a3728] disabled:opacity-50"
              />
            </div>
            <span className="text-xs text-[#8a7a6a]">-</span>
            <div className="relative flex-1">
              <IndianRupee className="w-3.5 h-3.5 text-[#8a7a6a] absolute left-2.5 top-3 pointer-events-none" />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxAmount}
                onChange={(e) => updateFilter("maxAmount", e.target.value)}
                disabled={disabled}
                className="w-full pl-7 pr-2 py-2 rounded-xl border border-[#e0d8cf] text-xs text-[#4a3728] bg-white focus:outline-none focus:border-[#4a3728] disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Session / Service Type */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#4a3728]">
            Session / Service Type
          </label>
          <FilterDropdown
            value={filters.sessionType}
            onChange={(val) => updateFilter("sessionType", val)}
            options={sessionTypeOptions}
            disabled={disabled}
            ariaLabel="Filter by session type"
            icon={<Layers className="w-4 h-4" />}
          />
        </div>

        {/* Payout Status */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#4a3728]">
            Payout Status
          </label>
          <FilterDropdown
            value={filters.payoutStatus}
            onChange={(val) => updateFilter("payoutStatus", val)}
            options={payoutStatusOptions}
            disabled={disabled}
            ariaLabel="Filter by payout status"
            icon={<Landmark className="w-4 h-4" />}
          />
        </div>

        {/* Mentee Contact (Email / Phone) */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#4a3728]">
            Mentee Email / Phone
          </label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-[#8a7a6a] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="e.g. mentee@email.com"
              value={filters.menteeContact}
              onChange={(e) => updateFilter("menteeContact", e.target.value)}
              disabled={disabled}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#e0d8cf] text-xs text-[#4a3728] bg-white focus:outline-none focus:border-[#4a3728] disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
