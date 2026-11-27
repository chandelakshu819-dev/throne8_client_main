'use client';

import { X, Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';
import TodayTasksTab from './TodayTaskTab';
import UpcomingTab from './UpcomingTab';
import OverdueTab from './OverViewtab';
import CreateTaskTab from './CreateTasktab';
import { useAppDispatch } from '@/store/hooks';
import {
    fetchAllTasksThunk,
    fetchUpcomingTasksThunk,
    fetchOverdueTasksThunk,
} from '@/hooks/studyGroup/features/todo/todo.thunks';
import { TabId } from '../types';
import { useState, useEffect } from 'react';
import { getDateType, getTabs } from '../helper';

interface TaskDrawerProps {
    selectedDate: Date | null;
    showDrawer: boolean;
    setShowDrawer: (show: boolean) => void;
    formatDate: (date: Date) => string;
    groupId?: string | null;
}

export default function TaskDrawer({
    selectedDate,
    showDrawer,
    setShowDrawer,
    formatDate,
    groupId,
}: TaskDrawerProps) {
    const dispatch = useAppDispatch();
    const [activeTab, setActiveTab] = useState<TabId>('today-tasks');
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const dateType = selectedDate ? getDateType(selectedDate) : 'today';
    const tabs = getTabs(dateType);

    // Select the first tab when the date changes or the modal opens
    useEffect(() => {
        if (selectedDate && showDrawer) {
            setActiveTab(getTabs(getDateType(selectedDate))[0].id);
        }
    }, [selectedDate, showDrawer]);

    // Esc to close + lock page scroll (the app scrolls inside #study-main-scroll too)
    useEffect(() => {
        if (!showDrawer) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowDrawer(false);
        window.addEventListener('keydown', onKey);

        const main = document.getElementById('study-main-scroll');
        const prevBody = document.body.style.overflow;
        const prevMain = main?.style.overflow ?? '';
        document.body.style.overflow = 'hidden';
        if (main) main.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevBody;
            if (main) main.style.overflow = prevMain;
        };
    }, [showDrawer, setShowDrawer]);

    const handleActionDone = () => {
        dispatch(fetchAllTasksThunk(undefined));
        dispatch(fetchUpcomingTasksThunk(7));
        dispatch(fetchOverdueTasksThunk());
    };

    if (!mounted || !showDrawer || !selectedDate) return null;

    const dateStr = formatDate(selectedDate);
    const dateLabel = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    const badgeConfig = {
        today: { text: 'Today', cls: 'bg-[#f6ede8] text-[#6b5847]' },
        future: { text: 'Upcoming date', cls: 'bg-blue-50 text-blue-700' },
        past: { text: 'Past date', cls: 'bg-red-50 text-red-600' },
    }[dateType];

    return createPortal(
        <div
            className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center sm:p-4"
            onMouseDown={() => setShowDrawer(false)}
        >
            {/* Modal card: bottom sheet on phones, centered on larger screens */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="task-modal-title"
                onMouseDown={(e) => e.stopPropagation()}
                className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[85vh] sm:max-w-xl sm:rounded-2xl"
            >
                {/* Header */}
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e0d8cf] px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f6ede8] text-[#8b7355] sm:h-10 sm:w-10">
                            <Calendar size={20} />
                        </div>
                        <div className="min-w-0">
                            <h2
                                id="task-modal-title"
                                className="truncate text-base font-bold leading-tight text-[#4a3728] sm:text-xl"
                            >
                                {dateLabel}
                            </h2>
                            <span
                                className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeConfig.cls}`}
                            >
                                {badgeConfig.text}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowDrawer(false)}
                        aria-label="Close"
                        className="shrink-0 rounded-lg p-1.5 text-[#6b5847] transition-colors hover:bg-[#f6ede8] hover:text-[#4a3728]"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex shrink-0 overflow-x-auto border-b border-[#e0d8cf] px-1 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition-all sm:text-sm ${
                                activeTab === tab.id
                                    ? 'border-[#4a3728] text-[#4a3728]'
                                    : 'border-transparent text-[#8a7868] hover:text-[#4a3728]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content (scrolls inside the modal) */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:min-h-[320px] sm:p-6">
                    {activeTab === 'today-tasks' && (
                        <TodayTasksTab dateStr={dateStr} onActionDone={handleActionDone} />
                    )}
                    {activeTab === 'date-tasks' && (
                        <TodayTasksTab dateStr={dateStr} onActionDone={handleActionDone} />
                    )}
                    {activeTab === 'upcoming' && (
                        <UpcomingTab
                            selectedDate={selectedDate}
                            formatDate={formatDate}
                            groupId={groupId}
                        />
                    )}
                    {activeTab === 'overdue' && <OverdueTab />}
                    {activeTab === 'create' && (
                        <CreateTaskTab
                            selectedDate={selectedDate}
                            formatDate={formatDate}
                            groupId={groupId}
                            onCreated={() => {
                                handleActionDone();
                                setActiveTab('today-tasks');
                            }}
                        />
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}