'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import {
  addGoalToDay,
  removeGoalFromDay,
  selectWeeklyGoals,
  GoalWithUI,
} from '@/hooks/studyGroup/features/goals/goalsSlice';
import { fetchAllGoalsThunk, updateGoalThunk } from '@/hooks/studyGroup/features/goals/goals.thunks';
import { Check, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import GoalProgressModal from './GoalProgressModal';
import { DAY_SHORT, DayName, DAYS } from '@/features/studyGroup/data';
import { getTodayDayName, getWeekDates } from '@/features/studyGroup/helper';

export default function WeeklyTracker() {
  const dispatch = useAppDispatch();
  const weeklyGoals = useAppSelector(selectWeeklyGoals);
  const allGoals = useAppSelector(state => state.goals.items);

  const [weekOffset, setWeekOffset] = useState(0);
  const [logModal, setLogModal] = useState<{ day: DayName; goalId: string; goalTitle: string; color: string } | null>(null);
  const [pickerDay, setPickerDay] = useState<DayName | null>(null);

  const weekDates = getWeekDates(weekOffset);
  const todayName = getTodayDayName();
  const [mobileDay, setMobileDay] = useState<DayName>(todayName);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.background = 'rgba(74,55,40,0.05)';
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = '';
  };

  // Put a goal on a day. If the day is outside the goal's dates, stretch the goal to include it.
  const assignGoalToDay = async (goal: GoalWithUI, day: DayName, date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

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
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, day: DayName, date: Date) => {
    e.preventDefault();
    e.currentTarget.style.background = '';
    try {
      const goal: GoalWithUI = JSON.parse(e.dataTransfer.getData('goal'));
      await assignGoalToDay(goal, day, date);
    } catch { }
  };

  const handlePick = async (goal: GoalWithUI, day: DayName, date: Date) => {
    setPickerDay(null);
    await assignGoalToDay(goal, day, date);
  };

  const handleChipClick = (day: DayName, goalId: string, goalTitle: string, color: string) => {
    setLogModal({ day, goalId, goalTitle, color });
  };

  const weekLabel = (() => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.getDate()} ${start.toLocaleString('en', { month: 'short' })} – ${end.getDate()} ${end.toLocaleString('en', { month: 'short' })}, ${end.getFullYear()}`;
  })();

  const goToThisWeek = () => {
    setWeekOffset(0);
    setMobileDay(todayName);
  };

  const renderDay = (day: DayName, i: number, single: boolean) => {
    const isToday = weekOffset === 0 && day === todayName;
    const date = weekDates[i];
    const dayGoals = (weeklyGoals[day] || [])
      .map((g: any) => allGoals.find(a => a.goalId === g.goalId))
      .filter(Boolean) as GoalWithUI[];
    const available = allGoals.filter(g => !dayGoals.some(d => d.goalId === g.goalId));

    return (
      <div
        key={day}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, day, date)}
        className={`flex min-h-[220px] flex-col rounded-xl border p-3 transition-colors ${
          isToday ? 'border-2 border-[#4a3728] bg-[#faf6f1]' : 'border-[#e0d8cf] bg-white'
        }`}
      >
        <div className="mb-3 border-b border-[#f0e9e0] pb-2 text-center">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#6b5847]">{DAY_SHORT[i]}</div>
          <div className="text-xl font-bold text-[#4a3728]">{date.getDate()}</div>
          {isToday && (
            <span className="mt-1 inline-block rounded-full bg-[#4a3728] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Today
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {dayGoals.map((goal) => {
            const color = typeof goal.color === 'string' && goal.color ? goal.color : '#4a3728';
            return (
              <div
                key={goal.goalId}
                onClick={() => handleChipClick(day, goal.goalId, goal.title, color)}
                className={`group relative flex cursor-pointer items-center gap-2 rounded-lg border border-[#e0d8cf] bg-white px-2 py-2 transition-shadow hover:shadow-sm ${
                  goal.completed ? 'opacity-75' : ''
                }`}
                style={{ borderLeft: `4px solid ${color}` }}
                title="Click to log hours"
              >
                <div
                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2"
                  style={{ borderColor: color, backgroundColor: goal.completed ? color : 'transparent' }}
                >
                  {goal.completed && <Check size={9} className="text-white" strokeWidth={3} />}
                </div>
                <span
                  className={`flex-1 truncate text-sm font-medium text-[#4a3728] ${goal.completed ? 'line-through' : ''}`}
                >
                  {goal.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(removeGoalFromDay({ day, goalId: goal.goalId }));
                  }}
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[#6b5847] transition-opacity hover:bg-red-50 hover:text-red-600 focus:opacity-100 ${
                    single ? '' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Remove from this day"
                  aria-label={`Remove ${goal.title} from this day`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}

          {dayGoals.length === 0 && pickerDay !== day && (
            <p className="py-3 text-center text-xs text-[#6b5847]/70">Nothing planned</p>
          )}
        </div>

        {/* Add a goal to this day */}
        {pickerDay === day ? (
          <div className="mt-2 rounded-lg border border-[#d4c4b5] bg-white p-1 shadow-md">
            <p className="px-2 py-1 text-xs font-semibold text-[#6b5847]">Add which goal?</p>
            {available.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-[#6b5847]">
                {allGoals.length === 0 ? 'Create a goal first.' : 'All your goals are already on this day.'}
              </p>
            ) : (
              available.map(g => (
                <button
                  key={g.goalId}
                  onClick={() => handlePick(g, day, date)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-[#4a3728] hover:bg-[#f6ede8]"
                >
                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: g.color || '#4a3728' }} />
                  <span className="truncate">{g.title}</span>
                </button>
              ))
            )}
            <button
              onClick={() => setPickerDay(null)}
              className="mt-1 w-full rounded-md px-2 py-1 text-xs text-[#6b5847] hover:bg-[#f6ede8]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setPickerDay(day)}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[#d4c4b5] py-2 text-xs font-medium text-[#6b5847] transition-colors hover:border-[#8b7355] hover:bg-[#faf6f1] hover:text-[#4a3728]"
          >
            <Plus size={14} />
            Add goal
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="rounded-xl border border-[#e0d8cf] bg-white/60 p-4 sm:p-5">

        <h2 className="text-lg font-bold text-[#4a3728]">Weekly plan</h2>
        <p className="mb-4 mt-1 text-sm text-[#6b5847]">
          Choose which days you will work on each goal. Drag a goal card onto a day, or press{' '}
          <span className="font-semibold">Add goal</span>. Click a goal in a day to log hours.
        </p>

        {/* Week navigation */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#d4c4b5] bg-white px-3 text-sm font-semibold text-[#4a3728] transition-colors hover:bg-[#f6ede8]"
          >
            <ChevronLeft size={16} /> <span className="hidden sm:inline">Prev week</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#4a3728]">{weekLabel}</span>
            {weekOffset !== 0 && (
              <button
                onClick={goToThisWeek}
                className="rounded-full bg-[#f6ede8] px-2.5 py-1 text-xs font-semibold text-[#4a3728] hover:bg-[#efe3d9]"
              >
                This week
              </button>
            )}
          </div>

          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#d4c4b5] bg-white px-3 text-sm font-semibold text-[#4a3728] transition-colors hover:bg-[#f6ede8]"
          >
            <span className="hidden sm:inline">Next week</span> <ChevronRight size={16} />
          </button>
        </div>

        {/* Desktop: 7 columns */}
        <div className="hidden grid-cols-7 gap-2 md:grid">
          {DAYS.map((day, i) => renderDay(day, i, false))}
        </div>

        {/* Mobile: day picker + the chosen day */}
        <div className="md:hidden">
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
            {DAYS.map((day, i) => {
              const isToday = weekOffset === 0 && day === todayName;
              const selected = mobileDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setMobileDay(day)}
                  className={`flex-shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    selected
                      ? 'bg-[#4a3728] text-white'
                      : 'border border-[#d4c4b5] bg-white text-[#4a3728]'
                  }`}
                >
                  {DAY_SHORT[i]} {weekDates[i].getDate()}
                  {isToday && !selected && <span className="ml-1 text-[#8b7355]">•</span>}
                </button>
              );
            })}
          </div>
          {renderDay(mobileDay, DAYS.indexOf(mobileDay), true)}
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
