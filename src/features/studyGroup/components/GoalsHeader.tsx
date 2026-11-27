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

// "2026-11-27" or "2026-11-27T00:00:00Z" -> local midnight.
// new Date('YYYY-MM-DD') is UTC, which shifts the day in zones like IST.
const parseLocalDate = (value: string) => {
  const [y, m, d] = String(value).split("T")[0].split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const CreateGoalModal = dynamic(() => import("./CreateGoalModal"), { ssr: false });
const EditGoalModal = dynamic(() => import("./EditGoalModal"), { ssr: false });

export default function GoalsHeader() {
  const dispatch = useAppDispatch();
  const goals = useAppSelector(selectAllGoals);
  const stats = useAppSelector(selectGoalStats);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithUI | null>(null);
  const [loadingGoals, setLoadingGoals] = useState(true);

  // useEffect(() => {
  //   dispatch(fetchAllGoalsThunk());
  //   dispatch(fetchGoalStatsThunk());
  // }, [dispatch]);
  useEffect(() => {
    dispatch(fetchAllGoalsThunk())
      .then((res: any) => {
        const goals = res.payload?.data ?? [];
        const todayName = getTodayDayName(); // WeeklyTracker se import karo ya duplicate karo
        // Compare whole days in local time, so a goal is still "active" on its last day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        goals.forEach((goal: GoalWithUI) => {
          // Auto add to today's column if goal is active today
          const start = parseLocalDate(goal.startDate);
          const end = parseLocalDate(goal.endDate);
          if (start <= today && end >= today) {
            dispatch(addGoalToDay({ goal, day: todayName }));
          }
        });
      })
      .finally(() => setLoadingGoals(false));
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
    const res: any = await dispatch(createGoalThunk(data));
    if (res?.error) {
      // Keep the modal open so the user does not lose what they typed
      alert(typeof res.payload === "string" ? res.payload : "Could not create the goal. Please try again.");
      return;
    }
    dispatch(fetchGoalStatsThunk({ force: true }));
    setIsCreateOpen(false);
  };

  const handleUpdate = async (data: any) => {
    if (!editingGoal) return;
    const res: any = await dispatch(updateGoalThunk({ goalId: editingGoal.goalId, data }));
    if (res?.error) {
      alert(typeof res.payload === "string" ? res.payload : "Could not save the goal. Please try again.");
      return;
    }
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
      progress: hoursTarget > 0 ? Math.min(100, Math.round((hoursDone / hoursTarget) * 100)) : null,
    },
  ];

  return (
    <div className="w-full">
      {/* Page title + main action */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#4a3728] sm:text-3xl md:text-4xl">
            Your Goals
          </h1>
          <p className="mt-1 text-sm text-[#6b5847] md:text-base">
            Set a target number of hours, then plan which days you will work on each goal.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#4a3728] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3a2a1e] active:scale-95 sm:w-auto"
        >
          <Plus size={16} />
          Create goal
        </button>
      </div>

      {/* Summary */}
      <div className="mb-8 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {tiles.map(({ label, value, Icon, tint, progress }: any) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-[#e0d8cf] bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4"
          >
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${tint}`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-bold tabular-nums text-[#4a3728] sm:text-xl">{value}</div>
              <div className="text-xs text-[#6b5847] sm:text-sm">{label}</div>
              {progress !== null && progress !== undefined && (
                <div
                  className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#efe6dc]"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Hours logged"
                >
                  <div
                    className="h-full rounded-full bg-[#8b7355] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
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
        loading={loadingGoals}
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