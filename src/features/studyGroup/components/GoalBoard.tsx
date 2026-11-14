'use client';

import React from 'react';
import GoalCard from './GoalCard';
import { GoalWithUI } from '@/hooks/studyGroup/features/goals/goalsSlice';

interface GoalBoardProps {
  goals: GoalWithUI[];
  onEdit: (goal: GoalWithUI) => void;
  onDelete: (goalId: string) => void;
  onCreate?: () => void;
}

export default function GoalBoard({ goals, onEdit, onDelete, onCreate }: GoalBoardProps) {
  if (goals.length === 0) {
    return (
      <div className="mb-8 rounded-xl border border-dashed border-[#d4c4b5] bg-white/60 px-4 py-12 text-center">
        <p className="mb-1 text-lg font-bold text-[#4a3728]">No goals yet</p>
        <p className="text-sm text-[#6b5847]">
          A goal is a number of study hours you want to reach by a date.
        </p>
        {onCreate && (
          <button
            onClick={onCreate}
            className="mt-4 rounded-lg bg-[#4a3728] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a2a1e]"
          >
            Create your first goal
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {goals.map((goal) => (
        <GoalCard
          key={goal.goalId}
          goal={goal}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
