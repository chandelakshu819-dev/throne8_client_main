'use client';

import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import {
  decrementTime,
  completeSession,
  startBreak,
  endBreak
} from '@/hooks/studyGroup/features/timer/timerSlice';
import { useEffect, useRef, useState } from 'react';

import TimerTabs from '@/features/studyGroup/components/TimerTabs';
import TimerDisplay from '@/features/studyGroup/components/TimerDisplay';
import CustomTimerControls from '@/features/studyGroup/components/CustomTimerControls';
import SubjectInput from '@/features/studyGroup/components/SubjectInput';
import TimerControls from '@/features/studyGroup/components/TimerControls';
import MotivationalQuote from '@/features/studyGroup/components/MotivationalQuote';
import StudyProgress from '@/features/studyGroup/components/StudyProgress';
import { getActiveTimerThunk, getAllSessionsThunk, getTimerStatsThunk, getTodaySessionsThunk, stopTimerThunk } from '@/hooks/studyGroup/features/timer/timer.thunks';

export default function PomodoroTimer() {
  const dispatch = useAppDispatch();

  const isActive = useAppSelector(state => state.timer.isActive);
  const minutes = useAppSelector(state => state.timer.minutes);
  const seconds = useAppSelector(state => state.timer.seconds);
  const isBreakMode = useAppSelector(state => state.timer.isBreakMode);
  const activeTab = useAppSelector(state => state.timer.activeTab);
  const customMinutes = useAppSelector(state => state.timer.customMinutes);
  const completedSessions = useAppSelector(state => state.timer.completedSessions);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const justCompleted = useRef(false);

  useEffect(() => {
    dispatch(getActiveTimerThunk());
    dispatch(getTodaySessionsThunk());
    dispatch(getTimerStatsThunk());
  }, [dispatch]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (minutes === 0 && seconds === 0) {
          if (!justCompleted.current) {
            justCompleted.current = true;
            handleTimerComplete();
          }
          return;
        }
        if (minutes === 0 && seconds === 1) {
          dispatch(decrementTime());
          if (!justCompleted.current) {
            justCompleted.current = true;
            setTimeout(() => handleTimerComplete(), 100);
          }
          return;
        }

        justCompleted.current = false;
        dispatch(decrementTime());
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds]);

  const handleTimerComplete = () => {
    justCompleted.current = false;

    if (activeTab === 'pomodoro') {
      if (isBreakMode) {
        dispatch(endBreak());
      } else {
        dispatch(stopTimerThunk(undefined)).then((result: any) => {
          if (result.meta.requestStatus === 'fulfilled') {
            setSessionCompleted(true);
            setTimeout(() => setSessionCompleted(false), 4000);
          }
          dispatch(completeSession());
          const isLongBreak = (completedSessions + 1) % 4 === 0;
          dispatch(startBreak(isLongBreak ? 'long' : 'short'));
          dispatch(getTodaySessionsThunk());
          dispatch(getTimerStatsThunk());
          dispatch(getAllSessionsThunk({ limit: 10 }));
        });
      }
    } else {
      dispatch(stopTimerThunk(undefined)).then((result: any) => {
        if (result.meta.requestStatus === 'fulfilled') {
          setSessionCompleted(true);
          setTimeout(() => setSessionCompleted(false), 4000);
        }
        dispatch(completeSession());
        dispatch(getTodaySessionsThunk());
        dispatch(getTimerStatsThunk());
        dispatch(getAllSessionsThunk({ limit: 10 }));
      });
    }
  };

  const tabDuration = activeTab === 'timer'
    ? (customMinutes || 15)
    : (activeTab === 'pomodoro' ? 25 : 45);

  const totalSeconds = tabDuration * 60;
  const remainingSeconds = (minutes || 0) * 60 + (seconds || 0);
  const progress = Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100));

  return (
    <div className="min-h-screen bg-[#f7f3ee] px-3 py-5 sm:px-4 sm:py-6 lg:px-8 lg:py-8">

      {/* Session complete toast */}
      {sessionCompleted && (
        <div className="fixed top-4 right-4 bg-[#4a3728] text-[#f6ede8] px-5 py-3 rounded-xl shadow-lg text-sm font-bold z-50 flex items-center gap-2 animate-in">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          Session completed! Great work
        </div>
      )}

      <div className="mx-auto w-full max-w-6xl">
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
