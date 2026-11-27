'use client';

import React from 'react';
import { Target, Plus } from 'lucide-react';
import GoalCard from './GoalCard';
import { GoalWithUI } from '@/hooks/studyGroup/features/goals/goalsSlice';

interface GoalBoardProps {
  goals: GoalWithUI[];
  onEdit: (goal: GoalWithUI) => void;
  onDelete: (goalId: string) => void;
  onCreate?: () => void;
  loading?: boolean; // new: pass your slice's loading flag
}

const GoalSkeleton = () => (
  <div className="h-40 animate-pulse rounded-xl border border-[#e0d8cf] bg-white/70" />
);

export default function GoalBoard({ goals, onEdit, onDelete, onCreate, loading }: GoalBoardProps) {
  // Skeleton only while there is nothing to show yet
  if (loading && goals.length === 0) {
    return (
      <div className="mb-8 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        <GoalSkeleton />
        <GoalSkeleton />
        <GoalSkeleton />
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="mb-8 flex flex-col items-center rounded-2xl border border-dashed border-[#d4c4b5] bg-white/60 px-4 py-10 text-center sm:py-14">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f6ede8] text-[#8b7355]">
          <Target size={22} />
        </span>
        <p className="mb-1 text-lg font-bold text-[#4a3728]">No goals yet</p>
        <p className="max-w-xs text-sm text-[#6b5847]">
          A goal is a number of study hours you want to reach by a date.
        </p>
        {onCreate && (
          <button
            onClick={onCreate}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#4a3728] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3a2a1e] active:scale-95"
          >
            <Plus size={16} /> Create your first goal
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
      {goals.map((goal) => (
        <GoalCard key={goal.goalId} goal={goal} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}