"use client";

import { useAppDispatch, useAppSelector } from "@/core/store/store.hooks";
import { continueUnfinishedSession } from "@/hooks/studyGroup/features/timer/timerSlice";
import {
  cancelTimerThunk,
  resumeTimerThunk,
  getTodaySessionsThunk,
  getTimerStatsThunk,
} from "@/hooks/studyGroup/features/timer/timer.thunks";

export default function UnfinishedSessionPrompt() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => state.timer.unfinishedSession);
  const activeTab = useAppSelector((state) => state.timer.activeTab);
  const customMinutes = useAppSelector((state) => state.timer.customMinutes);
  const settings = useAppSelector((state) => state.timer.settings);
  const apiLoading = useAppSelector((state) => state.timer.apiLoading);

  if (!session) return null;

  const totalSeconds =
    (activeTab === "pomodoro"
      ? settings?.pomodoroMinutes ?? 25
      : activeTab === "focus"
        ? settings?.focusMinutes ?? 45
        : customMinutes || 15) * 60;
  const elapsed = Math.max(0, Math.floor(session.elapsedTime ?? 0));
  const canResume = elapsed < totalSeconds;
  const elapsedMin = Math.floor(elapsed / 60);
  const startedOn = new Date(session.startTime).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

  const handleResume = async () => {
    const wasPaused = session.status === "paused";
    dispatch(continueUnfinishedSession());
    if (wasPaused) await dispatch(resumeTimerThunk());
  };

  const handleDiscard = async () => {
    await dispatch(cancelTimerThunk());
    dispatch(getTodaySessionsThunk());
    dispatch(getTimerStatsThunk());
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-bold text-[#4a3728]">You have an unfinished session</p>
      <p className="mt-1 text-sm text-[#6b5847]">
        {session.subject ? `"${session.subject}"` : "A session"} started on {startedOn} (
        {session.status}, {elapsedMin} min studied).{" "}
        {canResume
          ? "Resume it, or discard it to start a new one."
          : "It is too old to continue. Discard it to start a new session."}
      </p>
      <div className="mt-3 flex gap-2">
        {canResume && (
          <button
            onClick={handleResume}
            disabled={apiLoading}
            className="rounded-lg bg-[#4a3728] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a2a1e] disabled:opacity-60"
          >
            Resume
          </button>
        )}
        <button
          onClick={handleDiscard}
          disabled={apiLoading}
          className="rounded-lg border border-[#d4c4b5] bg-white px-4 py-2 text-sm font-semibold text-[#4a3728] hover:bg-[#f6ede8] disabled:opacity-60"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
