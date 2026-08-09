// app/(studyGroup)/study/todo/components/MonthView.tsx

'use client';

import { useAppSelector } from '@/core/store/store.hooks';
import { useCallback, useState } from 'react';
import { Award } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  onDateClick: (day: number) => void;
  selectedDate: Date | null; // ✅ new prop
}

type CompletionFilter = 'all' | 'incomplete' | 'complete';

export default function MonthView({ currentDate, onDateClick, selectedDate }: MonthViewProps) {
  // ✅ apiTasks se data lo — deadline field se date match karenge
  const apiTasks = useAppSelector(state => state.todos.apiTasks);
  // ✅ local items bhi rakhte hain (newly created tasks jo abhi apiTasks mein nahi)
  const localItems = useAppSelector(state => state.todos.items);
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');

  const formatDate = useCallback((date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);

  const today = formatDate(new Date());
  const getApiTasksForDate = useCallback((dateStr: string) => {
    const tasksForDate = apiTasks.filter(task => {
      // deadline se match karo pehle
      if (task.deadline) {
        return task.deadline.slice(0, 10) === dateStr;
      }
      // deadline nahi hai toh createdAt se match karo
      return task.createdAt.slice(0, 10) === dateStr;
    });

    // Apply completion filter
    if (completionFilter === 'incomplete') return tasksForDate.filter(t => !t.completed);
    if (completionFilter === 'complete') return tasksForDate.filter(t => t.completed);
    return tasksForDate;
  }, [apiTasks, completionFilter]);

  const getStats = useCallback((dateStr: string) => {
    const apiForDate = getApiTasksForDate(dateStr);
    return {
      total: apiForDate.length,
      completed: apiForDate.filter(t => t.completed).length,
      overdue: apiForDate.filter(t => t.isOverdue).length,
    };
  }, [getApiTasksForDate]);

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return {
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      startingDayOfWeek: new Date(year, month, 1).getDay(),
    };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDaysMobile = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const days: JSX.Element[] = [];

  const selectedStr = selectedDate ? formatDate(selectedDate) : '';

  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="p-1 sm:p-2" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = formatDate(date);
    const stats = getStats(dateStr);
    const isToday = dateStr === today;
    const isSelected = dateStr === selectedStr;
    const isPast = dateStr < today;
    const isFuture = dateStr > today;
    const hasOverdue = stats.overdue > 0;

    // Border color logic
    let borderClass = 'border-[#e0d8cf] hover:border-[#8b7355]';
    if (isSelected) borderClass = 'border-[#8b7355] border-2';
    else if (isToday) borderClass = 'border-[#8b7355]';
    else if (hasOverdue && isPast) borderClass = 'border-red-400';

    // Background logic
    let bgClass = 'bg-white';
    if (isToday) bgClass = 'bg-[#f6ede8]';
    else if (isPast && stats.total === 0) bgClass = 'bg-gray-50';

    // Dots
    const apiForDate = getApiTasksForDate(dateStr);
    const dots = apiForDate.slice(0, 4).map((t, i) => {
      let dotColor = t.isOverdue
        ? 'bg-red-400'
        : t.completed
          ? 'bg-green-500'
          : isFuture
            ? 'bg-blue-400'
            : 'bg-amber-400';
      return <span key={i} className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />;
    });

    const allDone = stats.total > 0 && stats.completed === stats.total;

    days.push(
      <div
        key={day}
        onClick={() => onDateClick(day)}
        className={`relative p-1.5 sm:p-2 min-h-16 sm:min-h-20 md:min-h-24 border rounded-lg cursor-pointer transition-all hover:shadow-md ${borderClass} ${bgClass}`}
      >
        <div className="flex justify-between items-start mb-1">
          <span className={`text-xs sm:text-sm font-bold ${isToday ? 'text-[#8b7355]' : isPast ? 'text-gray-400' : 'text-[#4a3728]'
            }`}>
            {day}
          </span>
          {allDone && (
            <Award className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" fill="currentColor" />
          )}
        </div>

        {stats.total > 0 && (
          <div className="space-y-0.5 sm:space-y-1">
            <div className={`text-[10px] sm:text-xs ${hasOverdue && isPast ? 'text-red-500' : 'text-[#6b5847]'}`}>
              {stats.completed}/{stats.total}
            </div>
            <div className="w-full bg-[#e0d8cf] rounded-full h-1 sm:h-1.5">
              <div
                className={`h-1 sm:h-1.5 rounded-full transition-all ${hasOverdue && isPast ? 'bg-red-400' : 'bg-[#8b7355]'}`}
                style={{ width: `${Math.round((stats.completed / stats.total) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Dots row */}
        {dots.length > 0 && (
          <div className="flex gap-0.5 mt-1 flex-wrap">
            {dots}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4">
      {/* Completion status tabs */}
      <div className="flex gap-2 mb-4 border-b border-[#e0d8cf] pb-2">
        {['all', 'incomplete', 'complete'].map(filter => (
          <button
            key={filter}
            onClick={() => setCompletionFilter(filter as CompletionFilter)}
            className={`py-2 px-3 text-xs font-medium transition-all ${
              completionFilter === filter
                ? 'text-[#8b7355] border-b-2 border-[#8b7355]'
                : 'text-[#6b5847] hover:text-[#4a3728]'
            }`}
          >
            {filter === 'all' && 'All'}
            {filter === 'incomplete' && 'Incomplete'}
            {filter === 'complete' && 'Complete'}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap mb-2 px-1">
        {[
          { color: 'bg-green-500', label: 'Done' },
          { color: 'bg-amber-400', label: 'Pending' },
          { color: 'bg-red-400', label: 'Overdue' },
          { color: 'bg-blue-400', label: 'Upcoming' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-full ${l.color}`} />
            <span className="text-[10px] text-[#6b5847]">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day, index) => (
          <div key={day} className="text-center font-bold text-[#4a3728] py-1.5 sm:py-2 text-xs sm:text-sm">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{weekDaysMobile[index]}</span>
          </div>
        ))}
        {days}
      </div>
    </div>
  );
}
