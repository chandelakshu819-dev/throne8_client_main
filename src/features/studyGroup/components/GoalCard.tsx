'use client';

import React, { memo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Pencil, Trash2, GripVertical, CheckCircle2 } from 'lucide-react';
import { GoalWithUI } from '@/hooks/studyGroup/features/goals/goalsSlice';
import { statusConfig } from '../data';
import { getStatus } from '../helper';

const GoalProgressModal = dynamic(() => import('./GoalProgressModal'), { ssr: false });

interface GoalCardProps {
  goal: GoalWithUI;
  onEdit: (goal: GoalWithUI) => void;
  onDelete: (goalId: string) => void;
}





export default memo(function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const [showModal, setShowModal] = useState(false);

  const freshGoal = goal;
  const pct =
    freshGoal.targetHours > 0
      ? Math.min(100, Math.round(((freshGoal.currentHours ?? 0) / freshGoal.targetHours) * 100))
      : 0;
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
        className="group relative flex cursor-pointer flex-col rounded-xl border border-[#e0d8cf] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        style={{ borderLeft: `4px solid ${goal.color}` }}
      >
        {/* Header: icon, title, status, actions */}
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: goal.color }}
          >
            {goal.title.substring(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-[#4a3728]">{goal.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
                {status === 'completed' && <CheckCircle2 size={12} />}
                {label}
              </span>
              {goal.category && (
                <span className="rounded-full bg-[#f6ede8] px-2 py-0.5 text-xs font-medium text-[#6b5847]">
                  {goal.category}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(freshGoal); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b5847] transition-colors hover:bg-[#f6ede8] hover:text-[#4a3728]"
              title="Edit goal"
              aria-label="Edit goal"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(goal.goalId); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b5847] transition-colors hover:bg-red-50 hover:text-red-600"
              title="Delete goal"
              aria-label="Delete goal"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm text-[#6b5847]">
              <span className="font-semibold text-[#4a3728]">{freshGoal.currentHours ?? 0}h</span> of {freshGoal.targetHours}h
            </span>
            <span className="text-sm font-bold tabular-nums text-[#4a3728]">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#efe6dc]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: goal.color }}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="mt-3 text-xs text-[#6b5847]">{startDate} → {endDate}</div>

        {/* Tags */}
        {goal.tags && goal.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {goal.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="rounded bg-[#f6ede8] px-1.5 py-0.5 text-xs text-[#6b5847]">
                #{tag}
              </span>
            ))}
            {goal.tags.length > 3 && (
              <span className="rounded bg-[#f6ede8] px-1.5 py-0.5 text-xs text-[#6b5847]">
                +{goal.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {status === 'overdue' && (
          <div className="mt-2 text-xs font-semibold text-red-600">End date has passed</div>
        )}

        {/* Footer hints */}
        <div className="mt-3 flex items-center justify-between border-t border-[#f0e9e0] pt-2 text-xs text-[#6b5847]">
          <span>Click to log hours</span>
          <span className="flex items-center gap-1" title="Drag this card onto a day in the weekly plan">
            <GripVertical size={14} className="text-[#6b5847]/60" />
            Drag to plan
          </span>
        </div>
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
});