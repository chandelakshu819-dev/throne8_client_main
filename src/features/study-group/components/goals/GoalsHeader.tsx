'use client';
// src/features/studyGroup/components/goals/GoalsHeader.tsx
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import { addGoalToDay, GoalWithUI, selectAllGoals, selectGoalStats } from '@/hooks/studyGroup/features/goals/goalsSlice';
import {
  createGoalThunk, deleteGoalThunk,
  fetchAllGoalsThunk, fetchGoalStatsThunk, markGoalCompleteThunk, markGoalIncompleteThunk, updateGoalThunk
} from '@/hooks/studyGroup/features/goals/goals.thunks';
import CreateGoalModal from './CreateGoalModal';
import EditGoalModal from '@/features/studyGroup/components/EditGoalModal';
import GoalBoard from '@/features/studyGroup/components/GoalBoard';
import { getTodayDayName } from '@/features/studyGroup/helper';

export default function GoalsHeader() {
  const dispatch = useAppDispatch();
  const goals = useAppSelector(selectAllGoals);
  const stats = useAppSelector(selectGoalStats);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithUI | null>(null);

  // useEffect(() => {
  //   dispatch(fetchAllGoalsThunk());
  //   dispatch(fetchGoalStatsThunk());
  // }, [dispatch]);
  useEffect(() => {
    dispatch(fetchAllGoalsThunk()).then((res: any) => {
      const goals = res.payload?.data ?? [];
      const todayName = getTodayDayName(); // WeeklyTracker se import karo ya duplicate karo
      goals.forEach((goal: GoalWithUI) => {
        // Auto add to today's column if goal is active today
        const now = new Date();
        const start = new Date(goal.startDate);
        const end = new Date(goal.endDate);
        if (start <= now && end >= now) {
          dispatch(addGoalToDay({ goal, day: todayName }));
        }
      });
    });
    dispatch(fetchGoalStatsThunk());
  }, [dispatch]);

  // Overdue check — frontend only
  const overdueGoals = goals.filter((g: any) =>
    !g.completed && new Date(g.endDate) < new Date()
  );
  const bestGoal = goals.reduce((best: any, g: any) =>
    (g.progressPercentage ?? 0) > (best?.progressPercentage ?? 0) ? g : best
    , goals[0]);

  const weeklyCompletion = stats
    ? Math.round((stats.completedGoals / Math.max(stats.totalGoals, 1)) * 100)
    : 0;

  const handleCreate = async (data: any) => {
    await dispatch(createGoalThunk(data));
    dispatch(fetchGoalStatsThunk());
    setIsCreateOpen(false);
  };

  const handleUpdate = async (data: any) => {
    if (!editingGoal) return;
    await dispatch(updateGoalThunk({ goalId: editingGoal.goalId, data }));
    dispatch(fetchGoalStatsThunk());
    setEditingGoal(null);
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Delete this goal?')) return;
    await dispatch(deleteGoalThunk(goalId));
    dispatch(fetchGoalStatsThunk());
  };

  // handleDelete ke baad ye function add karo
  const handleMarkComplete = async (goal: GoalWithUI) => {
    if (goal.completed) {
      await dispatch(markGoalIncompleteThunk(goal.goalId));
    } else {
      await dispatch(markGoalCompleteThunk(goal.goalId));
    }
    dispatch(fetchAllGoalsThunk());
    dispatch(fetchGoalStatsThunk());
  };

  return (
    <div className="max-w-7xl mx-auto">

      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#4a3728]">Your Goals</h1>
        <p className="text-sm text-[#6b5847] mt-1">Track progress, stay consistent</p>
      </div>

      {/* Section 1 — Summary bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-[#f6ede8]/80 rounded-xl border border-[#e0d8cf]/50">
        {bestGoal && (
          <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-lg">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Best: {bestGoal.title} — {bestGoal.progressPercentage ?? 0}%
          </div>
        )}
        {overdueGoals.length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
            </svg>
            {overdueGoals.length} Overdue goal{overdueGoals.length > 1 ? 's' : ''}
          </div>
        )}
        <div className="flex items-center gap-2 bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-lg">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" strokeWidth="2" />
          </svg>
          {weeklyCompletion}% completed
        </div>
        {stats && (
          <div className="flex items-center gap-2 bg-[#e0d8cf]/60 text-[#4a3728] text-xs font-semibold px-3 py-1.5 rounded-lg ml-auto">
            {stats.completedGoals}/{stats.totalGoals} goals done
          </div>
        )}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#4a3728] to-[#6b4e3d] text-[#f6ede8] text-xs font-bold px-4 py-1.5 rounded-lg hover:opacity-90 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Create goal
        </button>
      </div>

      {/* Section 2 — Goal cards 2 column grid */}
      <GoalBoard
        goals={goals}
        onEdit={(goal) => setEditingGoal(goal)}
        onDelete={handleDelete}
      />
      {/* <GoalBoard
  goals={goals}
  onEdit={(goal) => setEditingGoal(goal)}
  onDelete={handleDelete}
  onMarkComplete={handleMarkComplete}  // ADD
/> */}

      {/* Modals */}
      {isCreateOpen && (
        <CreateGoalModal
          onClose={() => setIsCreateOpen(false)}
          onSave={handleCreate}
        />
      )}
      {editingGoal && (
        <EditGoalModal
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}

