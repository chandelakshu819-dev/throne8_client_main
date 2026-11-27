'use client';

import { useState } from 'react';
import { CalendarDays, Plus, X } from 'lucide-react';
import { useAppSelector } from '@/core/store/store.hooks';
import TaskCard from './TaskCard';
import CreateTaskTab from './CreateTasktab';
import { CompletionFilter } from '../types';

interface UpcomingTabProps {
  selectedDate: Date;
  formatDate: (date: Date) => string;
  groupId?: string | null;
}

// Local-date helpers (avoid UTC shifts)
const toLocalDateStr = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const parseLocal = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const FILTERS: { id: CompletionFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'incomplete', label: 'Incomplete' },
  { id: 'complete', label: 'Complete' },
];

function ListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-9 rounded-xl bg-[#f0e6df]" />
      {[0, 1, 2].map(i => (
        <div key={i} className="h-20 rounded-xl bg-[#f0e6df]" />
      ))}
    </div>
  );
}

export default function UpcomingTab({ selectedDate, formatDate, groupId }: UpcomingTabProps) {
  const apiTasks = useAppSelector(state => state.todos.apiTasks);
  const isLoading = useAppSelector(state => state.todos.loading.fetchAll);

  const [showCreate, setShowCreate] = useState(false);
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');

  const selectedStr = toLocalDateStr(selectedDate);
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const isPastDate = selectedStr < todayStr;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tomorrow);

  // OPTIONAL: limit to 7 days after the selected date
  // const limit = new Date(selectedDate); limit.setDate(limit.getDate() + 7);
  // const limitStr = toLocalDateStr(limit);

  const upcomingTasks = apiTasks.filter(task => {
    if (!task.deadline) return false;
    const d = toLocalDateStr(new Date(task.deadline));
    return d >= selectedStr; // && d <= limitStr
  });

  const counts = {
    all: upcomingTasks.length,
    incomplete: upcomingTasks.filter(t => !t.completed).length,
    complete: upcomingTasks.filter(t => t.completed).length,
  };

  const filteredTasks = upcomingTasks.filter(task => {
    if (completionFilter === 'incomplete') return !task.completed;
    if (completionFilter === 'complete') return task.completed;
    return true;
  });

  // Group by local date
  const groups: Record<string, typeof filteredTasks> = {};
  filteredTasks.forEach(task => {
    const key = toLocalDateStr(new Date(task.deadline!));
    (groups[key] ||= []).push(task);
  });

  const getLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    return parseLocal(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  if (isLoading) return <ListSkeleton />;

  return (
    <div>
      {/* Filter pills */}
      <div className="mb-4 flex gap-1 rounded-xl bg-[#f6ede8] p-1">
        {FILTERS.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setCompletionFilter(f.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all sm:text-sm ${
              completionFilter === f.id
                ? 'bg-[#4a3728] text-white shadow-sm'
                : 'text-[#4a3728] hover:bg-white'
            }`}
          >
            {f.label}
            <span
              className={`rounded-full px-1.5 text-[10px] font-bold ${
                completionFilter === f.id ? 'bg-white/20 text-white' : 'bg-white text-[#6b5847]'
              }`}
            >
              {counts[f.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Create toggle */}
      {!isPastDate && (
        <button
          type="button"
          onClick={() => setShowCreate(prev => !prev)}
          className={`mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-2.5 text-sm font-semibold transition-all ${
            showCreate
              ? 'border-[#8b7355] bg-[#f6ede8] text-[#4a3728]'
              : 'border-[#e0d8cf] text-[#6b5847] hover:border-[#8b7355] hover:bg-[#faf6f2] hover:text-[#4a3728]'
          }`}
        >
          {showCreate ? (
            <>
              <X size={16} /> Hide create form
            </>
          ) : (
            <>
              <Plus size={16} /> Create new task
            </>
          )}
        </button>
      )}

      {/* Create form (collapsible) */}
      {showCreate && (
        <div className="mb-5 rounded-2xl border border-[#e0d8cf] bg-[#fdf8f5] p-3 shadow-sm sm:p-4">
          <CreateTaskTab
            selectedDate={selectedDate}
            formatDate={formatDate}
            groupId={groupId}
            onCreated={() => setShowCreate(false)}
          />
        </div>
      )}

      {/* Upcoming list */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#e0d8cf] bg-[#faf6f2] px-4 py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f6ede8] text-[#8b7355]">
            <CalendarDays size={24} />
          </div>
          <p className="text-sm font-semibold text-[#4a3728]">No upcoming tasks</p>
          <p className="mt-1 text-xs text-[#8a7868]">
            {isPastDate ? 'Nothing is scheduled after this date.' : 'Use the button above to create one.'}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs font-medium text-[#6b5847]">
            From{' '}
            {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} onward
          </p>

          <div className="space-y-5">
            {Object.entries(groups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dateStr, tasks]) => (
                <section key={dateStr}>
                  <div className="mb-2 flex items-center justify-between border-b border-[#e0d8cf] pb-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-[#8b7355]">
                      {getLabel(dateStr)}
                    </h4>
                    <span className="rounded-full bg-[#f6ede8] px-2 py-0.5 text-[10px] font-semibold text-[#6b5847]">
                      {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {tasks.map(task => (
                      <TaskCard key={task.taskId} task={task} isOverdue={false} />
                    ))}
                  </div>
                </section>
              ))}
          </div>
        </>
      )}
    </div>
  );
}