'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { GoalWithUI } from '@/hooks/studyGroup/features/goals/goalsSlice';
import { useAppSelector } from '@/core/store/store.hooks';
import GoalProgressModal from './GoalProgressModal';
import { statusConfig } from '@/features/studyGroup/data';
import { getStatus } from '@/features/studyGroup/helper';

interface GoalCardProps {
  goal: GoalWithUI;
  onEdit: (goal: GoalWithUI) => void;
  onDelete: (goalId: string) => void;
}





export default function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const allGoals = useAppSelector(state => state.goals.items);
  const [showModal, setShowModal] = useState(false);

  const freshGoal = allGoals.find(g => g.goalId === goal.goalId) ?? goal;
  const progress = freshGoal.progressPercentage ?? 0;
  const status = getStatus(freshGoal);
  const { label, className } = statusConfig[status];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('goal', JSON.stringify(freshGoal));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const startDate = new Date(goal.startDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  });
  const endDate = new Date(goal.endDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onClick={() => setShowModal(true)}
        className="group relative bg-[#f6ede8]/80 rounded-xl border border-[#e0d8cf]/50 p-3 hover:shadow-md transition-all cursor-pointer"
        style={{ borderLeft: `3px solid ${goal.color}` }}
      >
        {/* Drag handle */}
        <GripVertical
          size={14}
          className="absolute top-2.5 right-9 text-[#4a3728]/20 group-hover:text-[#4a3728]/50 transition-colors"
        />

        {/* Edit + Delete buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(freshGoal); }}
            className="w-6 h-6 flex items-center justify-center rounded-md bg-white/80 hover:bg-white text-[#4a3728] transition-all"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(goal.goalId); }}
            className="w-6 h-6 flex items-center justify-center rounded-md bg-red-50 hover:bg-red-100 text-red-500 transition-all"
          >
            <Trash2 size={11} />
          </button>
        </div>

        {/* Header — icon + title + status */}
        <div className="flex items-center gap-2 mb-2 pr-10">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0"
            style={{ backgroundColor: goal.color }}
          >
            {goal.title.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-xs text-[#4a3728] truncate">{goal.title}</h3>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${className}`}>
                {label}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar — freshGoal se */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-[#6b5847]">
              {freshGoal.currentHours}h / {freshGoal.targetHours}h
            </span>
            <span className="text-[10px] font-bold" style={{ color: goal.color }}>
              {(freshGoal?.currentHours && freshGoal?.targetHours
                ? ((freshGoal.currentHours / freshGoal.targetHours) * 100).toFixed(2)
                : '0.00')}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#e0d8cf]/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${goal?.currentHours && goal?.targetHours ? (goal.currentHours / goal.targetHours) * 100 : 0}%`, backgroundColor: goal.color }}
            />
          </div>
        </div>

        {/* Dates + category */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#6b5847]">{startDate} → {endDate}</span>
          {goal.category && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
            >
              {goal.category}
            </span>
          )}
        </div>

        {/* Tags */}
        {goal.tags && goal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {goal.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="text-[9px] px-1 py-0.5 rounded bg-[#e0d8cf]/50 text-[#4a3728]/60"
              >
                #{tag}
              </span>
            ))}
            {goal.tags.length > 2 && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-[#e0d8cf]/50 text-[#4a3728]/60">
                +{goal.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Overdue warning */}
        {status === 'overdue' && (
          <div className="mt-1.5 text-[9px] text-red-600 font-semibold">
            End date crossed
          </div>
        )}
      </div>

      {/* Progress Modal */}
      {showModal && (
        <GoalProgressModal
          goalId={goal.goalId}
          color={goal.color}
          title={goal.title}
          subtitle={goal.category || 'No category'}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}