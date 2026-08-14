'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import {
  addGoalToDay, toggleDayGoalCompletion,
  removeGoalFromDay, selectWeeklyGoals, GoalWithUI,
} from '@/hooks/studyGroup/features/goals/goalsSlice';
import { fetchAllGoalsThunk, markGoalCompleteThunk, markGoalIncompleteThunk, updateGoalProgressThunk, updateGoalThunk } from '@/hooks/studyGroup/features/goals/goals.thunks';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import GoalProgressModal from './GoalProgressModal';
import { DAY_SHORT, DayName, DAYS } from '@/features/studyGroup/data';
import { getContrastTextColor, getTodayDayName, getWeekDates, withAlpha } from '@/features/studyGroup/helper';



export default function WeeklyTracker() {
  const dispatch = useAppDispatch();
  const weeklyGoals = useAppSelector(selectWeeklyGoals);
  const [weekOffset, setWeekOffset] = useState(0);
  const [logModal, setLogModal] = useState<{ day: DayName; goalId: string; goalTitle: string; color: string } | null>(null);
  const [hoursInput, setHoursInput] = useState('');
  const [logLoading, setLogLoading] = useState(false);
  // WeeklyTracker component ke andar, dispatch ke baad add karo
  const allGoals = useAppSelector(state => state.goals.items);
  const [showModal, setShowModal] = useState(false);

  const weekDates = getWeekDates(weekOffset);
  const todayName = getTodayDayName();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.background = 'rgba(74,55,40,0.05)';
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = '';
  };

  const handleLogHoursOnly = async () => {
    if (!logModal || !hoursInput || Number(hoursInput) <= 0) return;
    setLogLoading(true);
    await dispatch(updateGoalProgressThunk({
      goalId: logModal.goalId,
      hoursToAdd: Number(hoursInput),
    }));
    dispatch(fetchAllGoalsThunk());
    setLogLoading(false);
    setLogModal(null);
  };

  const handleMarkComplete = async () => {
    if (!logModal) return;
    const goal = weeklyGoals[logModal.day]?.find((g: any) => g.goalId === logModal.goalId);
    if (goal?.completed) {
      await dispatch(markGoalIncompleteThunk(logModal.goalId));
    } else {
      await dispatch(markGoalCompleteThunk(logModal.goalId));
    }
    dispatch(fetchAllGoalsThunk());
    setLogModal(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, day: DayName, date: Date) => {
    e.preventDefault();
    e.currentTarget.style.background = '';
    try {
      const goal: GoalWithUI = JSON.parse(e.dataTransfer.getData('goal'));

      // FIX: Local date string use karo — UTC nahi
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

      // Local midnight comparison ke liye
      const dropDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const goalStart = new Date(goal.startDate.split('T')[0]);
      const goalEnd = new Date(goal.endDate.split('T')[0]);

      if (dropDate < goalStart) {
        await dispatch(updateGoalThunk({ goalId: goal.goalId, data: { startDate: dateStr } }));
        dispatch(fetchAllGoalsThunk());
      } else if (dropDate > goalEnd) {
        await dispatch(updateGoalThunk({ goalId: goal.goalId, data: { endDate: dateStr } }));
        dispatch(fetchAllGoalsThunk());
      }

      dispatch(addGoalToDay({ goal, day }));
    } catch { }
  };


  const handleChipClick = (day: DayName, goalId: string, goalTitle: string, color: string) => {
    setLogModal({ day, goalId, goalTitle, color });
    setHoursInput('');
  };


  const handleLogHours = async () => {
    if (!logModal || !hoursInput || Number(hoursInput) <= 0) return;

    const goal = allGoals.find(g => g.goalId === logModal.goalId);
    if (!goal) return;

    const remaining = goal.targetHours - goal.currentHours;

    if (Number(hoursInput) > remaining) {
      alert(`Sirf ${remaining}h remaining hai. ${remaining}h ya kam enter karo.`);
      return;
    }

    setLogLoading(true);
    await dispatch(updateGoalProgressThunk({
      goalId: logModal.goalId,
      hoursToAdd: Number(hoursInput),
    }));
    await dispatch(fetchAllGoalsThunk());
    setLogLoading(false);
    setLogModal(null);
    setHoursInput('');
  };

  const handleToggleComplete = async () => {
    if (!logModal) return;
    const goal = allGoals.find(g => g.goalId === logModal.goalId);
    setLogLoading(true);
    if (goal?.completed) {
      await dispatch(markGoalIncompleteThunk(logModal.goalId));
    } else {
      await dispatch(markGoalCompleteThunk(logModal.goalId));
    }
    await dispatch(fetchAllGoalsThunk());
    setLogLoading(false);
    setLogModal(null);
  };

  const weekLabel = (() => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.getDate()} ${start.toLocaleString('en', { month: 'short' })} – ${end.getDate()} ${end.toLocaleString('en', { month: 'short' })}, ${end.getFullYear()}`;
  })();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-[#f6ede8]/80 rounded-xl border border-[#e0d8cf]/50 p-4">

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e0d8cf]/60 hover:bg-[#e0d8cf] text-[#4a3728] rounded-lg text-sm font-semibold transition-all"
          >
            <ChevronLeft size={16} /> Prev week
          </button>
          <span className="text-sm font-bold text-[#4a3728]">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e0d8cf]/60 hover:bg-[#e0d8cf] text-[#4a3728] rounded-lg text-sm font-semibold transition-all"
          >
            Next week <ChevronRight size={16} />
          </button>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-7 gap-2">
          {DAYS.map((day, i) => {
            const isToday = weekOffset === 0 && day === todayName;
            const date = weekDates[i];
            const dayGoals = weeklyGoals[day] || [];
            return (
              <div
                key={day}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                // onDrop={(e) => handleDrop(e, day)}
                onDrop={(e) => handleDrop(e, day, weekDates[i])}
                className={`flex flex-col min-h-[200px] rounded-lg p-2 border transition-all ${isToday
                  ? 'border-[#4a3728] border-2 bg-[#f6ede8]'
                  : 'border-[#e0d8cf]/50 bg-white/40'
                  }`}
              >
                <div className={`text-center mb-2 pb-1.5 border-b border-[#e0d8cf]/50`}>
                  <div className={`text-xs font-bold ${isToday ? 'text-[#4a3728]' : 'text-[#6b5847]'}`}>
                    {DAY_SHORT[i]}
                  </div>
                  <div className={`text-sm font-black ${isToday ? 'text-[#4a3728]' : 'text-[#4a3728]/60'}`}>
                    {date.getDate()}
                  </div>
                  {isToday && <div className="text-[9px] text-[#4a3728] font-bold uppercase tracking-wide">Today</div>}
                </div>

                <div className="flex flex-col gap-1.5 flex-1">
                  {dayGoals.map((goal: any) => {
                    const safeColor = typeof goal.color === 'string' && goal.color ? goal.color : '#4a3728';
                    const previousTextColor = getContrastTextColor(safeColor);
                    const chipBg = withAlpha(previousTextColor, 0.18);
                    const chipBorder = withAlpha(previousTextColor, 0.55);
                    const chipTextColor = isToday ? '#4a3728' : '#6b5847';
                    const iconBg = goal.completed ? safeColor : 'transparent';
                    const iconBorder = safeColor;

                    return (
                      <div
                        key={goal.goalId}
                        onClick={() => handleChipClick(day, goal.goalId, goal.title, safeColor)}
                        className={`group relative flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer border transition-all hover:opacity-90 ${goal.completed ? 'opacity-60' : ''}`}
                        style={{ backgroundColor: chipBg, borderColor: chipBorder }}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all`}
                          style={{
                            borderColor: iconBorder,
                            backgroundColor: iconBg,
                          }}
                        >
                          {goal.completed && <Check size={9} className="text-white" strokeWidth={3} />}
                        </div>
                        <span
                          className={`text-[11px] font-semibold flex-1 truncate ${goal.completed ? 'line-through' : ''}`}
                          style={{ color: chipTextColor }}
                        >
                          {goal.title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(removeGoalFromDay({ day, goalId: goal.goalId }));
                          }}
                          className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-red-400 hover:text-red-600 transition-all flex-shrink-0"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}

                  <div
                    className="flex-1 flex items-center justify-center border border-dashed border-[#e0d8cf] rounded-md min-h-[32px] text-[10px] text-[#6b5847]/50"
                    style={{ minHeight: dayGoals.length === 0 ? 60 : 32 }}
                  >
                    Drop goal
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile — single day scroll */}
        <div className="md:hidden">
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
            {DAYS.map((day, i) => {
              const isToday = weekOffset === 0 && day === todayName;
              return (
                <button
                  key={day}
                  onClick={() => { }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isToday
                    ? 'bg-[#4a3728] text-[#f6ede8]'
                    : 'bg-[#e0d8cf]/50 text-[#4a3728]'
                    }`}
                >
                  {DAY_SHORT[i]} {weekDates[i].getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {logModal && (
  <GoalProgressModal
    goalId={logModal.goalId}
    color={logModal.color}
    title={logModal.goalTitle}
    subtitle={logModal.day}
    onClose={() => setLogModal(null)}
  />


      )}
    </div>
  );
}
