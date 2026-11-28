"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { months } from "../data";

interface CalendarHeaderProps {
  currentDate: Date;
  view: "month" | "year";
  setView: (view: "month" | "year") => void;
  changeMonth: (increment: number) => void;
  setCurrentDate: (date: Date) => void;
  onAddTask?: () => void;
}

export default function CalendarHeader({
  currentDate,
  view,
  setView,
  changeMonth,
  setCurrentDate,
  onAddTask,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-[#4a3728] sm:text-3xl">
            Calendar &amp; Todos
          </h1>
          <p className="mt-0.5 text-sm font-medium text-[#6b5847] sm:text-base">
            {view === "month"
              ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : "All Years"}
          </p>
        </div>

        {onAddTask && (
          <button
            type="button"
            onClick={onAddTask}
            className="hidden shrink-0 items-center gap-2 rounded-xl bg-[#4a3728] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#6b4e3d] active:scale-95 sm:inline-flex"
          >
            <Plus size={18} />
            Add Task
          </button>
        )}
      </div>

      {/* Toolbar row */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* View toggle */}
        <div className="flex gap-1 rounded-xl bg-[#f6ede8] p-1">
          {(["month", "year"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:py-2 sm:text-sm ${
                view === v
                  ? "bg-[#4a3728] text-white shadow-sm"
                  : "text-[#4a3728] hover:bg-white"
              }`}
            >
              {v === "month" ? "Month" : "Years"}
            </button>
          ))}
        </div>

        {/* Navigation */}
        {view === "month" && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
              className="rounded-lg border border-[#e0d8cf] bg-white p-1.5 text-[#4a3728] shadow-sm transition-all hover:bg-[#4a3728] hover:text-white sm:p-2"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="rounded-lg border border-[#e0d8cf] bg-white px-3 py-1.5 text-xs font-semibold text-[#4a3728] shadow-sm transition-all hover:bg-[#4a3728] hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
              className="rounded-lg border border-[#e0d8cf] bg-white p-1.5 text-[#4a3728] shadow-sm transition-all hover:bg-[#4a3728] hover:text-white sm:p-2"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}