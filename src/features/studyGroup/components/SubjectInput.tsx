'use client';

import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import { setSubject, setSelectedGoalId } from '@/hooks/studyGroup/features/timer/timerSlice';
import { useState, useEffect } from 'react';
import { fetchActiveGoalsThunk } from '@/hooks/studyGroup/features/goals/goals.thunks';
import { selectActiveGoals } from '@/hooks/studyGroup/features/goals/goalsSlice';

const FIELD =
  'w-full rounded-lg border border-[#d4c4b5] bg-white px-3 py-2.5 text-sm text-[#4a3728] placeholder:text-[#4a3728]/40 focus:border-[#8b7355] focus:outline-none focus:ring-2 focus:ring-[#8b7355]/25 disabled:cursor-not-allowed disabled:bg-[#f6ede8] disabled:text-[#4a3728]/60';

export default function SubjectInput() {
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);

  const subject = useAppSelector(state => state.timer.subject);
  const isActive = useAppSelector(state => state.timer.isActive);
  const isBreakMode = useAppSelector(state => state.timer.isBreakMode);
  const completedSessions = useAppSelector(state => state.timer.completedSessions);
  const selectedGoalId = useAppSelector(state => state.timer.selectedGoalId);
  const activeGoals = useAppSelector(selectActiveGoals);

  useEffect(() => {
    dispatch(fetchActiveGoalsThunk());
  }, [dispatch]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (mounted && isBreakMode) {
    return (
      <div className="rounded-xl bg-[#f6ede8] px-4 py-3 text-center text-sm font-medium text-[#4a3728]">
        {completedSessions % 4 === 0
          ? 'Take a long break. Stretch, drink water, rest your eyes.'
          : 'Take a short break. Stand up and stretch.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="timer-subject" className="mb-1.5 block text-sm font-semibold text-[#4a3728]">
          What are you studying?{' '}
          <span className="font-normal text-[#6b5847]">(optional)</span>
        </label>
        <input
          id="timer-subject"
          type="text"
          value={mounted ? subject || '' : ''}
          onChange={(e) => dispatch(setSubject(e.target.value))}
          placeholder="e.g. Data Structures, Chapter 4"
          disabled={isActive}
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="timer-goal" className="mb-1.5 block text-sm font-semibold text-[#4a3728]">
          Link to a goal{' '}
          <span className="font-normal text-[#6b5847]">(optional)</span>
        </label>
        <select
          id="timer-goal"
          value={mounted ? selectedGoalId ?? '' : ''}
          onChange={(e) => dispatch(setSelectedGoalId(e.target.value || null))}
          disabled={isActive}
          className={FIELD}
        >
          <option value="">No goal</option>
          {activeGoals.map((goal: any) => (
            <option key={goal.goalId} value={goal.goalId}>
              {goal.title} ({goal.progressPercentage}%)
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-[#6b5847]">
          {isActive
            ? 'Locked while the timer is running.'
            : 'Study time is added to the goal you pick.'}
        </p>
      </div>
    </div>
  );
}
