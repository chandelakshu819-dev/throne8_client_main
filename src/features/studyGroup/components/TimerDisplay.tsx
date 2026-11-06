'use client';

import { useAppSelector } from "@/store/hooks";
import { useState, useEffect } from 'react';

interface TimerDisplayProps {
  progress: number;
}

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerDisplay({ progress }: TimerDisplayProps) {
  const [mounted, setMounted] = useState(false);
  const minutesStore = useAppSelector(state => state.timer.minutes);
  const secondsStore = useAppSelector(state => state.timer.seconds);
  const isBreakModeStore = useAppSelector(state => state.timer.isBreakMode);
  const activeTabStore = useAppSelector(state => state.timer.activeTab);
  const completedSessions = useAppSelector(state => state.timer.completedSessions);
  const isActiveStore = useAppSelector(state => state.timer.isActive);
  const activeSession = useAppSelector(state => state.timer.activeSession);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Same markup on server and first client render, so use defaults until mounted.
  const minutes = mounted ? minutesStore || 0 : 25;
  const seconds = mounted ? secondsStore || 0 : 0;
  const isBreakMode = mounted ? isBreakModeStore : false;
  const activeTab = mounted ? activeTabStore || 'pomodoro' : 'pomodoro';
  const isActive = mounted ? isActiveStore : false;
  const isPaused = mounted && !isActive && activeSession?.status === 'paused';
  const pct = mounted ? Math.min(100, Math.max(0, progress || 0)) : 0;

  const label = isBreakMode
    ? completedSessions % 4 === 0
      ? 'Long break'
      : 'Short break'
    : activeTab === 'pomodoro'
    ? 'Pomodoro session'
    : activeTab === 'focus'
    ? 'Focus session'
    : 'Custom session';

  // One clear sentence about what is happening and what to do next.
  const status = isActive
    ? { text: isBreakMode ? 'Break running. Rest and come back soon.' : 'Running. Stay focused.', dot: 'bg-green-500', pill: 'bg-green-50 text-green-800 border-green-200' }
    : isPaused
    ? { text: 'Paused. Press Resume to continue.', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800 border-amber-200' }
    : isBreakMode
    ? { text: 'Break ready. Press Start when you want it to begin.', dot: 'bg-sky-500', pill: 'bg-sky-50 text-sky-800 border-sky-200' }
    : { text: 'Ready. Press Start when you are set.', dot: 'bg-[#8b7355]', pill: 'bg-[#f6ede8] text-[#4a3728] border-[#e0d8cf]' };

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-56 w-56 sm:h-64 sm:w-64">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#efe6dc" strokeWidth="10" />
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke={isBreakMode ? '#5f8f6b' : '#4a3728'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - pct / 100)}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="text-5xl font-black tabular-nums tracking-tight text-[#4a3728] sm:text-6xl"
            role="timer"
            aria-live="off"
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#6b5847]">
            {label}
          </div>
        </div>
      </div>

      <div
        className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium ${status.pill}`}
        aria-live="polite"
      >
        <span className={`h-2 w-2 rounded-full ${status.dot} ${isActive ? 'animate-pulse' : ''}`} />
        {status.text}
      </div>
    </div>
  );
}
