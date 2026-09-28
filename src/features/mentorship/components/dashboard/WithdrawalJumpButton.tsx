"use client";

import React from "react";
import { Landmark } from "lucide-react";

interface WithdrawalJumpButtonProps {
  hasNoMethods?: boolean;
  targetId?: string;
  onScrollTriggered?: () => void;
}

export default function WithdrawalJumpButton({
  hasNoMethods = false,
  targetId = "withdrawal-methods",
  onScrollTriggered,
}: WithdrawalJumpButtonProps) {
  const handleClick = () => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (onScrollTriggered) {
        onScrollTriggered();
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      title="Go to Withdrawal Methods"
      aria-label="Go to Withdrawal Methods"
      className="relative p-2.5 rounded-xl border-2 border-[#4a3728] text-[#4a3728] hover:bg-[#4a3728] hover:text-white transition-all flex items-center justify-center shrink-0 shadow-sm hover:shadow-md"
    >
      <Landmark className="w-5 h-5" />
      {hasNoMethods && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3" title="No withdrawal methods added">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-600"></span>
        </span>
      )}
    </button>
  );
}
