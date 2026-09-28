"use client";

import React from "react";
import { Calendar, ChevronDown } from "lucide-react";

interface DateRangeFilterProps {
  value: string;
  onChange: (range: string) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (val: string) => void;
  onCustomToChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
}

const DATE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "Last 7 Days", value: "7days" },
  { label: "This Month", value: "this_month" },
  { label: "Last 3 Months", value: "3months" },
  { label: "Custom Range", value: "custom" },
];

export default function DateRangeFilter({
  value,
  onChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  disabled = false,
  className = "",
}: DateRangeFilterProps) {
  const isSelected = value !== "all";

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="relative flex items-center">
        <Calendar className="w-4 h-4 text-[#8a7a6a] absolute left-3 pointer-events-none" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label="Filter by date range"
          className={`w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl border-2 text-sm font-semibold cursor-pointer transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            isSelected
              ? "border-[#4a3728] bg-[#fbf7f3] text-[#4a3728]"
              : "border-[#e0d8cf] bg-white text-[#4a3728] hover:border-[#8a7a6a]"
          }`}
        >
          {DATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-[#8a7a6a] absolute right-2.5 pointer-events-none" />
      </div>

      {value === "custom" && (
        <div className="flex items-center gap-2 p-2 bg-[#fbf7f3] rounded-xl border border-[#e0d8cf] text-xs">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-[#8a7a6a] mb-0.5">FROM</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
              disabled={disabled}
              className="w-full px-2 py-1 rounded-lg border border-[#e0d8cf] text-xs text-[#4a3728] bg-white focus:outline-none focus:border-[#4a3728] disabled:opacity-50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-[#8a7a6a] mb-0.5">TO</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
              disabled={disabled}
              className="w-full px-2 py-1 rounded-lg border border-[#e0d8cf] text-xs text-[#4a3728] bg-white focus:outline-none focus:border-[#4a3728] disabled:opacity-50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
