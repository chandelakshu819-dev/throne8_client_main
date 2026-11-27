'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import {
    createTaskThunk,
    fetchAllTasksThunk,
    fetchUpcomingTasksThunk,
} from '@/hooks/studyGroup/features/todo/todo.thunks';
import { addTodo } from '@/hooks/studyGroup/features/todo/todoSlice';

interface CreateTaskTabProps {
    selectedDate: Date | null;
    formatDate: (date: Date) => string;
    groupId?: string | null;
    onCreated?: () => void;
}

type Priority = 'low' | 'medium' | 'high' | 'urgent';

const PRIORITIES: { id: Priority; label: string; active: string }[] = [
    { id: 'low', label: 'Low', active: 'bg-emerald-600 border-emerald-600 text-white' },
    { id: 'medium', label: 'Medium', active: 'bg-amber-500 border-amber-500 text-white' },
    { id: 'high', label: 'High', active: 'bg-orange-600 border-orange-600 text-white' },
    { id: 'urgent', label: 'Urgent', active: 'bg-red-600 border-red-600 text-white' },
];

const inputCls =
    'w-full min-w-0 rounded-xl border border-[#e0d8cf] bg-white px-3.5 py-2.5 text-sm text-[#4a3728] ' +
    'placeholder:text-[#b3a597] outline-none transition focus:border-[#8b7355] focus:ring-2 focus:ring-[#8b7355]/20';
const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6b5847]';

// datetime-local needs LOCAL time (toISOString is UTC and shifts the time)
const toLocalInput = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function CreateTaskTab({ selectedDate, formatDate, groupId, onCreated }: CreateTaskTabProps) {
    const dispatch = useAppDispatch();
    const dateStr = selectedDate ? formatDate(selectedDate) : '';

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [deadline, setDeadline] = useState('');
    const [tags, setTags] = useState('');
    const [reminderAt, setReminderAt] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const minDeadline = toLocalInput(new Date());

    // Auto-fill deadline (11:59 PM) and reminder (10:00 AM) from the selected date, in local time
    useEffect(() => {
    if (!selectedDate) return;

    const dl = new Date(selectedDate);
    dl.setHours(23, 59, 0, 0);
    setDeadline(toLocalInput(dl));

    // Only pre-fill a reminder if it is still in the future
    const rm = new Date(selectedDate);
    rm.setHours(10, 0, 0, 0);
    setReminderAt(rm.getTime() > Date.now() ? toLocalInput(rm) : '');
}, [selectedDate]);

    const handleAdd = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!title.trim() || isAdding) return;
        setError(null);
        setIsAdding(true);
        try {
            const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10);
            const payload = {
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                deadline: deadline ? new Date(deadline).toISOString() : undefined,
                tags: parsedTags.length ? parsedTags : [],
                reminderAt: reminderAt ? new Date(reminderAt).toISOString() : undefined,
                groupId: groupId ?? null,
            };

            await dispatch(createTaskThunk(payload)).unwrap();

            // Local items update for MonthView
            dispatch(addTodo({
                dateStr,
                text: payload.title,
                description: payload.description,
                priority: payload.priority,
                deadline: payload.deadline,
                tags: payload.tags,
            }));

            // Refresh lists
            dispatch(fetchAllTasksThunk(undefined));
            dispatch(fetchUpcomingTasksThunk(7));

            // Reset form
            setTitle('');
            setDescription('');
            setPriority('medium');
            setTags('');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
            onCreated?.();
        } catch (err: any) {
    const details =
        err?.errors ?? err?.details ?? err?.data?.errors ?? err?.response?.data?.errors;
    const first = Array.isArray(details) ? details[0] : null;
    const msg =
        (first && (first.message || first.msg || (typeof first === 'string' ? first : null))) ||
        (typeof err === 'string' ? err : err?.message) ||
        'Could not create the task. Please try again.';
    console.error('Task create failed:', err);
    setError(msg);
} finally {
            setIsAdding(false);
        }
    };

    return (
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                    {error}
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                    <CheckCircle2 size={14} />
                    Task created successfully!
                </div>
            )}

            {/* Title */}
            <div>
                <label htmlFor="task-title" className={labelCls}>
                    Title <span className="text-red-500">*</span>
                </label>
                <input
                    id="task-title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="What do you need to do?"
                    className={inputCls}
                />
            </div>

            {/* Description */}
            <div>
                <label htmlFor="task-desc" className={labelCls}>Description</label>
                <textarea
                    id="task-desc"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Optional..."
                    rows={3}
                    className={`${inputCls} resize-none`}
                />
            </div>

            {/* Priority */}
            <div>
                <span className={labelCls}>Priority</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {PRIORITIES.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setPriority(p.id)}
                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                                priority === p.id
                                    ? p.active
                                    : 'border-[#e0d8cf] bg-white text-[#6b5847] hover:bg-[#f6ede8]'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Deadline + Reminder */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="task-deadline" className={labelCls}>Deadline</label>
                    <input
                        id="task-deadline"
                        type="datetime-local"
                        value={deadline}
                        min={minDeadline}
                        onChange={e => setDeadline(e.target.value)}
                        className={inputCls}
                    />
                </div>
                <div>
                    <label htmlFor="task-reminder" className={labelCls}>Reminder at</label>
                    <input
                        id="task-reminder"
                        type="datetime-local"
                        value={reminderAt}
                        onChange={e => setReminderAt(e.target.value)}
                        className={inputCls}
                    />
                </div>
            </div>

            {/* Tags */}
            <div>
                <label htmlFor="task-tags" className={labelCls}>Tags</label>
                <input
                    id="task-tags"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="dsa, math, coding"
                    className={inputCls}
                />
                <p className="mt-1 text-[11px] text-[#8a7868]">Separate with commas (max 10)</p>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={isAdding || !title.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a3728] py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#6b4e3d] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isAdding ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                    <Plus size={18} />
                )}
                {isAdding ? 'Adding...' : 'Add Task'}
            </button>
        </form>
    );
}