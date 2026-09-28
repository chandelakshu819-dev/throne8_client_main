"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  ariaLabel: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export default function FilterDropdown({
  label,
  value,
  onChange,
  options,
  ariaLabel,
  icon,
  disabled = false,
  className = "",
}: FilterDropdownProps) {
  const isSelected = value !== "all" && value !== "";

  return (
    <div className={`relative flex items-center ${className}`}>
      {icon && <span className="absolute left-3 text-[#8a7a6a] pointer-events-none">{icon}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`w-full appearance-none pr-8 py-2.5 rounded-xl border-2 text-sm font-semibold cursor-pointer transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
          icon ? "pl-9" : "pl-3"
        } ${
          isSelected
            ? "border-[#4a3728] bg-[#fbf7f3] text-[#4a3728]"
            : "border-[#e0d8cf] bg-white text-[#4a3728] hover:border-[#8a7a6a]"
        }`}
      >
        {label && <option value="all">{label}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-[#8a7a6a] absolute right-2.5 pointer-events-none" />
    </div>
  );
}
