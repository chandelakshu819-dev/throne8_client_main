"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAppDispatch } from "@/store/hooks";
import CalendarHeader from "@/features/studyGroup/components/CalendarHeader";
import MonthView from "@/features/studyGroup/components/MonthView";

const YearView = dynamic(() => import("@/features/studyGroup/components/YearView"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-xl bg-white/70 animate-pulse" />,
});
const TaskDrawer = dynamic(() => import("@/features/studyGroup/components/TaskDrawer"), {
  ssr: false,
});
import {
  fetchAllTasksThunk,
  fetchUpcomingTasksThunk,
  fetchOverdueTasksThunk,
} from "@/hooks/studyGroup/features/todo/todo.thunks";
import { STUDY_PAGE_WRAP } from "@/features/study-group/constants/pageLayout";

export default function CalendarTodo() {
  const dispatch = useAppDispatch();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "year">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  // Page load pe teeno fetch karo
  useEffect(() => {
    dispatch(fetchAllTasksThunk(undefined));
    dispatch(fetchUpcomingTasksThunk(7));
    dispatch(fetchOverdueTasksThunk());
  }, [dispatch]);

  const formatDate = useCallback((date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }, []);

  const changeMonth = useCallback((increment: number): void => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + increment, 1)
    );
  }, []);

  const handleDateClick = useCallback(
    (day: number): void => {
      const clickedDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      setSelectedDate(clickedDate);
      setShowDrawer(true);
    },
    [currentDate]
  );

  const handleYearClick = useCallback((year: number): void => {
    setCurrentDate(new Date(year, 0, 1));
    setView("month");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br py-3 sm:py-4 md:py-6">
      <div className={STUDY_PAGE_WRAP}>
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          setView={setView}
          changeMonth={changeMonth}
          setCurrentDate={setCurrentDate}
        />

        {view === "month" ? (
          <MonthView
            currentDate={currentDate}
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
          />
        ) : (
          <YearView onYearClick={handleYearClick} />
        )}

        <TaskDrawer
          selectedDate={selectedDate}
          showDrawer={showDrawer}
          setShowDrawer={setShowDrawer}
          formatDate={formatDate}
          groupId={null}
        />
      </div>
    </div>
  );
}
