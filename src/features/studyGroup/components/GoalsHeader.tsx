"use client";
// src/features/studyGroup/components/goalsHeader.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useAppDispatch, useAppSelector } from "@/core/store/store.hooks";
import {
  addGoalToDay,
  GoalWithUI,
  selectAllGoals,
  selectGoalStats,
} from "@/hooks/studyGroup/features/goals/goalsSlice";
import {
  createGoalThunk,
  deleteGoalThunk,
  fetchAllGoalsThunk,
  fetchGoalStatsThunk,
  markGoalCompleteThunk,
  markGoalIncompleteThunk,
  updateGoalThunk,
} from "@/hooks/studyGroup/features/goals/goals.thunks";
import GoalBoard from "./GoalBoard";
import { getTodayDayName, getStatus } from "@/features/studyGroup/helper";
import { Plus, CheckCircle2, Target, AlertCircle, Clock } from "lucide-react";

const CreateGoalModal = dynamic(() => import("./CreateGoalModal"), { ssr: false });
const EditGoalModal = dynamic(() => import("./EditGoalModal"), { ssr: false });
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

  // Summary numbers, worked out from the goals themselves so they always match the cards.
  const { overdueCount, activeCount, doneCount, totalCount, hoursDone, hoursTarget } = useMemo(() => {
    let overdue = 0;
    let active = 0;
    let completed = 0;
    let doneHrs = 0;
    let targetHrs = 0;
    for (const g of goals as any[]) {
      const s = getStatus(g);
      if (s === "overdue") overdue++;
      else if (s === "active") active++;
      if (g.completed) completed++;
      doneHrs += g.currentHours ?? 0;
      targetHrs += g.targetHours ?? 0;
    }
    return {
      overdueCount: overdue,
      activeCount: active,
      doneCount: stats?.completedGoals ?? completed,
      totalCount: stats?.totalGoals ?? goals.length,
      hoursDone: doneHrs,
      hoursTarget: targetHrs,
    };
  }, [goals, stats]);
  const fmtHours = (n: number) => `${Math.round(n * 10) / 10}h`;

  const handleEditGoal = useCallback((goal: GoalWithUI) => setEditingGoal(goal), []);

  const handleCreate = async (data: any) => {
    await dispatch(createGoalThunk(data));
    dispatch(fetchGoalStatsThunk({ force: true }));
    setIsCreateOpen(false);
  };

  const handleUpdate = async (data: any) => {
    if (!editingGoal) return;
    await dispatch(updateGoalThunk({ goalId: editingGoal.goalId, data }));
    dispatch(fetchGoalStatsThunk({ force: true }));
    setEditingGoal(null);
  };

  const handleDelete = useCallback(async (goalId: string) => {
    if (!confirm("Delete this goal?")) return;
    await dispatch(deleteGoalThunk(goalId));
    dispatch(fetchGoalStatsThunk({ force: true }));
  }, [dispatch]);

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

  const tiles = [
    {
      label: "Goals done",
      value: `${doneCount}/${totalCount}`,
      Icon: CheckCircle2,
      tint: "bg-green-50 text-green-700",
    },
    {
      label: "In progress",
      value: String(activeCount),
      Icon: Target,
      tint: "bg-[#f6ede8] text-[#4a3728]",
    },
    {
      label: "Overdue",
      value: String(overdueCount),
      Icon: AlertCircle,
      tint: overdueCount > 0 ? "bg-red-50 text-red-600" : "bg-[#f6ede8] text-[#4a3728]",
    },
    {
      label: "Hours logged",
      value: `${fmtHours(hoursDone)} / ${fmtHours(hoursTarget)}`,
      Icon: Clock,
      tint: "bg-[#f6ede8] text-[#4a3728]",
    },
  ];

  return (
    <div className="w-full">
      {/* Page title + main action */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#4a3728] md:text-4xl">
            Your Goals
          </h1>
          <p className="mt-1 text-sm text-[#6b5847] md:text-base">
            Set a target number of hours, then plan which days you will work on each goal.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex h-10 items-center gap-2 rounded-lg bg-[#4a3728] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3a2a1e]"
        >
          <Plus size={16} />
          Create goal
        </button>
      </div>

      {/* Summary */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(({ label, value, Icon, tint }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-[#e0d8cf] bg-white p-4 shadow-sm"
          >
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${tint}`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-xl font-bold tabular-nums text-[#4a3728]">{value}</div>
              <div className="text-sm text-[#6b5847]">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Goal cards */}
      <h2 className="mb-3 text-lg font-bold text-[#4a3728]">
        All goals{" "}
        <span className="text-sm font-normal text-[#6b5847]">({goals.length})</span>
      </h2>
      <GoalBoard
        goals={goals}
        onEdit={handleEditGoal}
        onDelete={handleDelete}
        onCreate={() => setIsCreateOpen(true)}
      />

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
