'use client';

import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import {
  setMinutes,
  setSeconds,
  completeSession,
  startBreak,
  endBreak,
  resetTimer
} from '@/hooks/studyGroup/features/timer/timerSlice';
import { useEffect, useRef, useState } from 'react';

import TimerTabs from '@/features/studyGroup/components/TimerTabs';
import TimerDisplay from '@/features/studyGroup/components/TimerDisplay';
import CustomTimerControls from '@/features/studyGroup/components/CustomTimerControls';
import SubjectInput from '@/features/studyGroup/components/SubjectInput';
import TimerControls from '@/features/studyGroup/components/TimerControls';
import UnfinishedSessionPrompt from '@/features/studyGroup/components/UnfinishedSessionPrompt';
import MotivationalQuote from '@/features/studyGroup/components/MotivationalQuote';
import StudyProgress from '@/features/studyGroup/components/StudyProgress';
import { startTimerThunk, getActiveTimerThunk, getAllSessionsThunk, getTimerStatsThunk, getTodaySessionsThunk, stopTimerThunk } from '@/hooks/studyGroup/features/timer/timer.thunks';
import { fetchUserStreakThunk } from '@/hooks/studyGroup/features/groups/group.thunks';
import { STUDY_PAGE_WRAP } from "@/features/study-group/constants/pageLayout";

export default function PomodoroTimer() {
  const dispatch = useAppDispatch();

  const isActive = useAppSelector(state => state.timer.isActive);
  const minutes = useAppSelector(state => state.timer.minutes);
  const seconds = useAppSelector(state => state.timer.seconds);
  const isBreakMode = useAppSelector(state => state.timer.isBreakMode);
  const activeTab = useAppSelector(state => state.timer.activeTab);
  const customMinutes = useAppSelector(state => state.timer.customMinutes);
  const completedSessions = useAppSelector(state => state.timer.completedSessions);
  const subject = useAppSelector(state => state.timer.subject);
  const selectedGoalId = useAppSelector(state => state.timer.selectedGoalId);
  const autoStartPomodoros = useAppSelector(state => state.timer.settings?.autoStartPomodoros);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const finishing = useRef(false);

  useEffect(() => {
    dispatch(getActiveTimerThunk());
    dispatch(getTodaySessionsThunk());
    dispatch(getTimerStatsThunk());
    dispatch(fetchUserStreakThunk());
  }, [dispatch]);

  // Clock-based countdown. Counting 1-second ticks drifts (every tick re-creates the
  // interval, and browsers slow timers in background tabs), so a 5 min session ran
  // 6+ min. Instead we keep an absolute end time and derive the remaining seconds
  // from the real clock. The finish step below handles 0:00.
  const remainingRef = useRef(0);
  remainingRef.current = (minutes || 0) * 60 + (seconds || 0);
  const endAtRef = useRef<number | null>(null);
  const lastShownRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      endAtRef.current = null;
      lastShownRef.current = null;
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      // First tick, or the store was changed from outside (break started, re-sync
      // with the server, reset): restart the end time from what the store shows.
      if (endAtRef.current === null || remainingRef.current !== lastShownRef.current) {
        endAtRef.current = now + remainingRef.current * 1000;
        lastShownRef.current = remainingRef.current;
      }
      const left = Math.max(0, Math.ceil((endAtRef.current - now) / 1000));
      if (left !== lastShownRef.current) {
        lastShownRef.current = left;
        // seconds first: the in-between state is never 0:00, so the finish step can't fire early
        dispatch(setSeconds(left % 60));
        dispatch(setMinutes(Math.floor(left / 60)));
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isActive, dispatch]);

  // Finish step. It runs once per countdown: the flag stays set while the clock
  // is at 0:00 (including while the stop request is in flight) and is only
  // cleared when the clock shows time again (break started, clock reset).
  useEffect(() => {
    if (minutes !== 0 || seconds !== 0) {
      finishing.current = false;
      return;
    }
    if (!isActive || finishing.current) return;
    finishing.current = true;
    handleTimerComplete();
  }, [isActive, minutes, seconds]);

  const handleTimerComplete = async () => {
    // A break has no server session to stop. The next pomodoro is started on the server when the break ends.
    if (activeTab === 'pomodoro' && isBreakMode) {
      dispatch(endBreak());
      if (autoStartPomodoros) {
        const started: any = await dispatch(
          startTimerThunk({
            subject: subject || undefined,
            goalId: selectedGoalId || undefined,
          })
        );
        // Server refused (for example an old session exists): show the prompt
        if (started.meta.requestStatus === 'rejected') dispatch(getActiveTimerThunk());
      }
      return;
    }

    const result: any = await dispatch(stopTimerThunk(undefined));

    if (result.meta.requestStatus !== 'fulfilled') {
      // Could not save: put the clock back and re-sync with the server
      dispatch(resetTimer());
      dispatch(getActiveTimerThunk());
      return;
    }

    setSessionCompleted(true);
    setTimeout(() => setSessionCompleted(false), 4000);
    dispatch(completeSession());

    if (activeTab === 'pomodoro') {
      const isLongBreak = (completedSessions + 1) % 4 === 0;
      dispatch(startBreak(isLongBreak ? 'long' : 'short'));
    } else {
      // Back to the chosen length so Start does not run a 0:00 session
      dispatch(resetTimer());
    }

    dispatch(getTodaySessionsThunk());
    dispatch(getTimerStatsThunk({ force: true }));
    dispatch(getAllSessionsThunk({ limit: 10 }));
    dispatch(fetchUserStreakThunk({ force: true }));
  };

  const tabDuration = activeTab === 'timer'
    ? (customMinutes || 15)
    : (activeTab === 'pomodoro' ? 25 : 45);

  const totalSeconds = tabDuration * 60;
  const remainingSeconds = (minutes || 0) * 60 + (seconds || 0);
  const progress = Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100));

  return (
    <div className="min-h-screen bg-[#f7f3ee] py-5 sm:py-6 lg:py-8">

      {/* Session complete toast */}
      {sessionCompleted && (
        <div className="fixed top-4 right-4 bg-[#4a3728] text-[#f6ede8] px-5 py-3 rounded-xl shadow-lg text-sm font-bold z-50 flex items-center gap-2 animate-in">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          Session completed! Great work
        </div>
      )}

      <div className={STUDY_PAGE_WRAP}>
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#4a3728] sm:text-3xl">Study Timer</h1>
          <p className="mt-1 text-sm text-[#6b5847] sm:text-base">
            Pick a mode, add what you are studying, then press Start. Finished sessions are saved to Today&apos;s Progress.
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">

          {/* Left: the timer */}
          <section className="overflow-hidden rounded-2xl border border-[#e0d8cf] bg-white shadow-sm">
            <div className="h-1 bg-gradient-to-r from-[#4a3728] via-[#8b6f47] to-[#d4a574]" />
            <div className="space-y-6 p-5 sm:p-6">
              <UnfinishedSessionPrompt />
              <TimerTabs />
              <TimerDisplay progress={progress} />
              {activeTab === 'timer' && <CustomTimerControls />}
              <SubjectInput />
              <TimerControls />
            </div>
          </section>

          {/* Right: today's progress, then the quote */}
          <aside className="flex flex-col gap-4">
            <StudyProgress onViewSession={(id) => setViewingSessionId(id)} />
            <MotivationalQuote />

            {viewingSessionId && (
              <div>{/* SessionDetailModal yahan aayega */}</div>
            )}
          </aside>

        </div>
      </div>
    </div>
  );
}
