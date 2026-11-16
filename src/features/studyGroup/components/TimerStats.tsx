'use client';

import { selectTimerStats, selectTodayTotalMinutes } from "@/hooks/studyGroup/features/timer/timerSlice";
import { selectUserStreak } from "@/hooks/studyGroup/features/groups/groupsSlice";
import { useAppSelector } from "@/store/hooks";
import { useState, useEffect } from 'react';

export default function TimerStats() {
  const [mounted, setMounted] = useState(false);
  const timerStats = useAppSelector(selectTimerStats);
  const todayMinutes = useAppSelector(selectTodayTotalMinutes) ?? 0;
  // Real streak from /study-group/streak/current (the same one the groups pages use)
  const streakCount = useAppSelector(selectUserStreak) ?? 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const sessions = mounted ? timerStats?.sessionsToday ?? 0 : 0;
  const minutes = mounted ? todayMinutes : 0;
  const streak = mounted ? streakCount : 0;

  const items = [
    { value: sessions, label: 'Sessions' },
    { value: minutes, label: 'Minutes' },
    { value: streak, label: 'Day streak' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(item => (
        <div key={item.label} className="rounded-xl bg-[#faf6f1] px-2 py-3 text-center">
          <div className="text-2xl font-bold tabular-nums text-[#4a3728]">{item.value}</div>
          <div className="text-xs text-[#6b5847]">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
