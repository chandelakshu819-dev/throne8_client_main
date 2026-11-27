'use client';

import { useAppSelector } from '@/core/store/store.hooks';
import TaskCard from './TaskCard';

interface TodayTasksTabProps {
    dateStr: string;          // selected date string YYYY-MM-DD (local)
    onActionDone?: () => void;
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

function TabSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-[#f0e6df]" />)}
            </div>
            {[0, 1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-[#f0e6df]" />)}
        </div>
    );
}

export default function TodayTasksTab({ dateStr, onActionDone }: TodayTasksTabProps) {
    const apiTasks = useAppSelector(state => state.todos.apiTasks);
    const isLoading = useAppSelector(state => state.todos.loading.fetchAll);

    const isToday = dateStr === toLocalDateStr(new Date());

    const todayTasks = apiTasks.filter(task => {
        if (!task.deadline) return false;
        return toLocalDateStr(new Date(task.deadline)) === dateStr;
    });

    const done = todayTasks.filter(t => t.completed).length;
    const overdue = todayTasks.filter(t => t.isOverdue).length;
    const percent = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0;

    if (isLoading) return <TabSkeleton />;

    if (todayTasks.length === 0) {
        const label = parseLocal(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#e0d8cf] bg-[#faf6f2] px-4 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f6ede8] text-2xl">📝</div>
                <p className="text-sm font-semibold text-[#4a3728]">
                    {isToday ? 'No tasks for today' : `No tasks for ${label}`}
                </p>
                <p className="mt-1 text-xs text-[#8a7868]">
                    {isToday
                        ? 'Switch to the + Create tab to add one.'
                        : 'Switch to the + Create tab to add a task for this date.'}
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Stats */}
            <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
                {[
                    { label: 'Total', value: todayTasks.length, cls: 'text-[#4a3728]' },
                    { label: 'Done', value: done, cls: 'text-emerald-600' },
                    { label: 'Overdue', value: overdue, cls: 'text-red-600' },
                ].map(s => (
                    <div key={s.label} className="rounded-xl border border-[#e0d8cf]/70 bg-[#f6ede8] p-2.5 text-center sm:p-3">
                        <div className={`text-lg font-bold sm:text-xl ${s.cls}`}>{s.value}</div>
                        <div className="text-[11px] font-medium text-[#6b5847]">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Progress */}
            <div className="mb-4">
                <div className="mb-1 flex justify-between text-xs font-medium text-[#6b5847]">
                    <span>Progress</span>
                    <span>{percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#e0d8cf]">
                    <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#8b7355] to-[#4a3728] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>

            {/* Task list */}
            <div className="space-y-3">
                {todayTasks.map(task => (
                    <TaskCard
                        key={task.taskId}
                        task={task}
                        isOverdue={task.isOverdue}
                        onActionDone={onActionDone}
                    />
                ))}
            </div>
        </div>
    );
}