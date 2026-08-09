'use client';

import { useAppSelector } from '@/core/store/store.hooks';
import TaskCard from './TaskCard';
import SkeletonLoader from '@/app/loading';

export default function OverdueTab() {
  const overdueTasks = useAppSelector(state => state.todos.overdueTasks);
  const isLoading = useAppSelector(state => state.todos.loading.overdue);

  if (isLoading) {
    return <SkeletonLoader  />;
 }

  if (overdueTasks.length === 0) {
    return (
      <div className="text-center py-10 text-[#6b5847]">
        <p className="text-sm">No overdue tasks.</p>
        <p className="text-xs text-green-600 mt-1">You are all caught up!</p>
      </div>
    );
  }

  // Past dates group karo
  const groups: Record<string, typeof overdueTasks> = {};
  overdueTasks.forEach(task => {
    if (!task.deadline) return;
    const dateKey = task.deadline.slice(0, 10);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(task);
  });

  return (
    <div>
      <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">
        {overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''} past deadline — edit disabled
      </div>
      {Object.entries(groups)
        .sort(([a], [b]) => b.localeCompare(a)) // latest first
        .map(([dateStr, tasks]) => (
          <div key={dateStr} className="mb-4">
            <div className="text-[10px] font-medium text-red-400 uppercase tracking-wide mb-1.5 pb-1 border-b border-red-100">
              {new Date(dateStr).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', weekday: 'short',
              })}
            </div>
            {tasks.map(task => (
              <TaskCard key={task.taskId} task={task} isOverdue={true} />
            ))}
          </div>
        ))}
    </div>
  );
}
