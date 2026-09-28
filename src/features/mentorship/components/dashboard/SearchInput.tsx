"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search by mentee name or transaction ID",
  disabled = false,
  className = "",
}: SearchInputProps) {
  return (
    <div className={`relative flex items-center min-w-[240px] flex-1 ${className}`}>
      <Search className="w-4 h-4 text-[#8a7a6a] absolute left-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Search transactions"
        className="w-full pl-9 pr-8 py-2.5 rounded-xl border-2 border-[#e0d8cf] focus:outline-none focus:border-[#4a3728] text-sm text-[#4a3728] placeholder-[#a09080] bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange("")}
          title="Clear search"
          aria-label="Clear search"
          className="absolute right-2.5 p-1 rounded-full text-[#8a7a6a] hover:text-[#4a3728] hover:bg-[#f5ede6] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
