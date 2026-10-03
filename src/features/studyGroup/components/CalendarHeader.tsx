// app/(studyGroup)/study/todo/components/CalendarHeader.tsx

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { months } from "../data";

interface CalendarHeaderProps {
  currentDate: Date;
  view: "month" | "year";
  setView: (view: "month" | "year") => void;
  changeMonth: (increment: number) => void;
  setCurrentDate: (date: Date) => void;
}

export default function CalendarHeader({
  currentDate,
  view,
  setView,
  changeMonth,
  setCurrentDate,
}: CalendarHeaderProps) {
  return (
    <div className="mb-4 sm:mb-6 mt-24 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#4a3728]">
          Calendar & Todos
        </h1>
        <p className="text-sm sm:text-base text-[#6b5847] mt-1">
          {view === "month"
            ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            : "All Years"}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* View Toggle */}
        <div className="flex gap-1 sm:gap-2 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setView("month")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              view === "month"
                ? "bg-[#8b7355] text-white"
                : "text-[#4a3728] hover:bg-[#f6ede8]"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView("year")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              view === "year"
                ? "bg-[#8b7355] text-white"
                : "text-[#4a3728] hover:bg-[#f6ede8]"
            }`}
          >
            Years
          </button>
        </div>

        {/* Navigation */}
        {view === "month" && (
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 sm:p-2 bg-white text-[#4a3728] rounded-lg hover:bg-[#8b7355] hover:text-white transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-[#4a3728] rounded-lg hover:bg-[#8b7355] hover:text-white transition-all shadow-sm font-semibold text-xs sm:text-sm"
            >
              Today
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 sm:p-2 bg-white text-[#4a3728] rounded-lg hover:bg-[#8b7355] hover:text-white transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
