"use client";

import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/core/store/store.hooks";
import { resetTimer } from "@/hooks/studyGroup/features/timer/timerSlice";
import {
  startTimerThunk,
  pauseTimerThunk,
  resumeTimerThunk,
  cancelTimerThunk,
  stopTimerThunk,
  getTodaySessionsThunk,
  getTimerStatsThunk,
  getActiveTimerThunk,
} from "@/hooks/studyGroup/features/timer/timer.thunks";
import { Play, Pause, RotateCcw, Square, ListTodo } from "lucide-react";

export default function TimerControls() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isActive = useAppSelector((state) => state.timer.isActive);
  const subject = useAppSelector((state) => state.timer.subject);
  const selectedGoalId = useAppSelector((state) => state.timer.selectedGoalId);
  const activeSession = useAppSelector((state) => state.timer.activeSession);
  const apiLoading = useAppSelector((state) => state.timer.apiLoading);

  const handleStart = async () => {
    let result: any;

    if (!isActive) {
      if (!activeSession) {
        result = await dispatch(
          startTimerThunk({
            subject: subject || undefined,
            goalId: selectedGoalId || undefined,
          })
        );
      } else if (activeSession.status === "paused") {
        result = await dispatch(resumeTimerThunk());
      }
    } else {
      result = await dispatch(pauseTimerThunk());
    }

    // If the server rejected it, re-sync with what the server actually has
    if (result?.meta?.requestStatus === "rejected") {
      dispatch(getActiveTimerThunk());
    }
  };

  const handleReset = async () => {
    if (activeSession) {
      const elapsed = activeSession.elapsedTime ?? 0;
      if (elapsed < 30) {
        await dispatch(cancelTimerThunk());
      } else {
        await dispatch(stopTimerThunk(undefined));
        dispatch(getTodaySessionsThunk());
        dispatch(getTimerStatsThunk());
      }
    }
    dispatch(resetTimer());
  };

  const isPaused = !isActive && activeSession?.status === "paused";
  const primaryLabel = isActive ? "Pause" : isPaused ? "Resume" : "Start";
  const PrimaryIcon = isActive ? Pause : Play;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          onClick={handleStart}
          disabled={apiLoading}
          className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-base font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            isActive ? "bg-[#b9803f] hover:bg-[#a06e33]" : "bg-[#4a3728] hover:bg-[#3a2a1e]"
          }`}
        >
          <PrimaryIcon size={18} fill="currentColor" />
          {primaryLabel}
        </button>

        <button
          onClick={handleReset}
          disabled={apiLoading}
          title={
            activeSession
              ? "Stop the timer and save this session (sessions under 30 seconds are discarded)"
              : "Reset the clock"
          }
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#d4c4b5] bg-white px-5 text-sm font-semibold text-[#4a3728] transition-colors hover:bg-[#f6ede8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {activeSession ? <Square size={15} fill="currentColor" /> : <RotateCcw size={15} />}
          {activeSession ? "End session" : "Reset"}
        </button>
      </div>

      <button
        onClick={() => router.push("/study/todo")}
        className="mx-auto flex items-center gap-1.5 text-sm text-[#6b5847] transition-colors hover:text-[#4a3728]"
      >
        <ListTodo size={16} />
        Need a task list? Open Todo
      </button>
    </div>
  );
}
