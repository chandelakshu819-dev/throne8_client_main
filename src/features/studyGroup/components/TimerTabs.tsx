'use client';

import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import { setActiveTab } from '@/hooks/studyGroup/features/timer/timerSlice';
import { useState, useEffect } from 'react';

type TabId = 'pomodoro' | 'focus' | 'timer';

// Plain-language description of every mode, so nobody has to guess.
const MODES: { id: TabId; label: string; length: string; hint: string }[] = [
  {
    id: 'pomodoro',
    label: 'Pomodoro',
    length: '25 min',
    hint: '25 minutes of focus, then a 5 minute break. After 4 rounds you get a longer break.',
  },
  {
    id: 'focus',
    label: 'Focus',
    length: '45 min',
    hint: 'One long 45 minute block for deep work, with no break after it.',
  },
  {
    id: 'timer',
    label: 'Custom',
    length: 'You choose',
    hint: 'Set any length from 1 to 180 minutes.',
  },
];

export default function TimerTabs() {
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);
  const storeTab = useAppSelector(state => state.timer.activeTab);
  const isActive = useAppSelector(state => state.timer.isActive);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTab: TabId = mounted ? storeTab : 'pomodoro';
  const current = MODES.find(m => m.id === activeTab) ?? MODES[0];

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[#4a3728]">Choose a mode</p>
      <div
        role="tablist"
        aria-label="Timer mode"
        className="grid grid-cols-3 gap-1 rounded-xl bg-[#f6ede8] p-1"
      >
        {MODES.map(mode => {
          const selected = activeTab === mode.id;
          return (
            <button
              key={mode.id}
              role="tab"
              aria-selected={selected}
              onClick={() => dispatch(setActiveTab(mode.id))}
              disabled={isActive && !selected}
              title={isActive && !selected ? 'Pause or end the session to switch mode' : undefined}
              className={`rounded-lg px-2 py-2 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                selected
                  ? 'bg-[#4a3728] text-white shadow-sm'
                  : 'text-[#4a3728] hover:bg-white/70'
              }`}
            >
              <span className="block text-sm font-semibold">{mode.label}</span>
              <span className={`block text-xs ${selected ? 'text-white/80' : 'text-[#6b5847]'}`}>
                {mode.length}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs leading-5 text-[#6b5847]">{current.hint}</p>
    </div>
  );
}
