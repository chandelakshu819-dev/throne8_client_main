"use client";

import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/core/store/store.hooks";
import {
  toggleTimer,
  resetTimer,
} from "@/hooks/studyGroup/features/timer/timerSlice";
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

export default function TimerControls() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isActive = useAppSelector((state) => state.timer.isActive);
  const subject = useAppSelector((state) => state.timer.subject);
  const selectedGoalId = useAppSelector((state) => state.timer.selectedGoalId);
  const activeSession = useAppSelector((state) => state.timer.activeSession);
  const minutes = useAppSelector((state) => state.timer.minutes);
  const seconds = useAppSelector((state) => state.timer.seconds);
  const activeTab = useAppSelector((state) => state.timer.activeTab);
  const customMinutes = useAppSelector((state) => state.timer.customMinutes);

  // const handleStart = async () => {
  //   if (!isActive) {
  //     if (!activeSession) {
  //       await dispatch(
  //         startTimerThunk({
  //           subject: subject || undefined,
  //           goalId: selectedGoalId || undefined, // ADD
  //         })
  //       );
  //     } else if (activeSession.status === "paused") {
  //       await dispatch(resumeTimerThunk());
  //     }
  //   } else {
  //     await dispatch(pauseTimerThunk());
  //   }
  //   dispatch(toggleTimer());
  // };

  // const handleReset = async () => {
  //   if (activeSession) {
  //     const elapsed = activeSession.elapsedTime ?? 0;
  //     if (elapsed < 30) {
  //       await dispatch(cancelTimerThunk());
  //     } else {
  //       await dispatch(stopTimerThunk(undefined));
  //       dispatch(getTodaySessionsThunk());
  //       dispatch(getTimerStatsThunk());
  //     }
  //   }
  //   dispatch(resetTimer());
  // };

  const handleStart = async () => {
    let result: any;

    if (!isActive) {
      if (!activeSession) {
        // slice sets isActive = true when this succeeds
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
      // slice sets isActive = false when this succeeds
      result = await dispatch(pauseTimerThunk());
    }

    // If the server rejected it, re-sync with what the server actually has
    if (result?.meta?.requestStatus === "rejected") {
      dispatch(getActiveTimerThunk());
    }
  };
  const handleReset = async () => {
    if (activeSession) {
      const totalSeconds =
        (activeTab === "pomodoro"
          ? 25
          : activeTab === "focus"
            ? 45
            : customMinutes || 15) * 60;
      const studiedSeconds =
        totalSeconds - ((minutes || 0) * 60 + (seconds || 0));

      // A paused session may not be stoppable on the server, so resume it first
      if (activeSession.status === "paused") {
        await dispatch(resumeTimerThunk());
      }

      if (studiedSeconds < 30) {
        await dispatch(cancelTimerThunk());
      } else {
        await dispatch(stopTimerThunk(undefined));
        dispatch(getTodaySessionsThunk());
        dispatch(getTimerStatsThunk());
      }
    }
    dispatch(resetTimer());
  };

  const handleTodoRedirect = () => {
    router.push("/study/todo");
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 relative">
      {/* Todo Button */}
      <button
        onClick={handleTodoRedirect}
        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#e0d8cf]/60 hover:bg-[#e0d8cf]/80 text-[#4a3728] rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 hover:scale-105 shadow-md flex items-center gap-1.5"
      >
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <span className="hidden lg:inline">Todo</span>
      </button>

      {/* Start/Pause Button */}
      <button
        onClick={handleStart}
        className="px-5 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#4a3728] to-[#6b4e3d] hover:from-[#6b4e3d] hover:to-[#8b6f47] text-[#f6ede8] rounded-lg font-black text-xs sm:text-sm transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
      >
        {isActive ? (
          <>
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
            Pause
          </>
        ) : activeSession?.status === "paused" ? (
          <>
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            resume
          </>
        ) : (
          <>
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            start
          </>
        )}
      </button>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#e0d8cf]/60 hover:bg-[#e0d8cf]/80 text-[#4a3728] rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 hover:scale-105 shadow-md flex items-center gap-1.5"
      >
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span className="hidden lg:inline">Reset</span>
      </button>
    </div>
  );
}
