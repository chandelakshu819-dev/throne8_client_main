import { GoalWithUI } from "@/hooks/studyGroup/features/goals/goalsSlice";
import { DateType } from "../types";
import { Tab } from "../interface";
import { DAYS } from "../data";
import { DayName } from "../data";

export function getStatus(goal: GoalWithUI) {
  if (goal.completed) return 'completed';
  const now = new Date();
  if (new Date(goal.endDate) < now) return 'overdue';
  if (new Date(goal.startDate) > now) return 'upcoming';
  return 'active';
}

export const generateMemberAvatars = (count: number): string[] => {
  const names = [
    'Priya Kumar', 'Rahul Patel', 'Ananya Das', 'Arjun Singh',
    'Sneha Reddy', 'Vikram Joshi', 'Ishita Kapoor', 'Rohan Gupta',
  ];
  return Array.from({ length: Math.min(count, 3) }, () => {
    const name = names[Math.floor(Math.random() * names.length)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d4a574&color=fff&size=128`;
  });
};

export function getGridClass(total: number, hasPinned: boolean): string {
  if (hasPinned) return 'grid-cols-1'; // spotlight: pinned full, others strip
  if (total === 1) return 'grid-cols-1';
  if (total === 2) return 'grid-cols-2';
  if (total <= 4) return 'grid-cols-2';
  if (total <= 6) return 'grid-cols-3';
  if (total <= 9) return 'grid-cols-3';
  return 'grid-cols-4';
}

export function getDateType(date: Date): DateType {
    const today = new Date();
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (d.getTime() === t.getTime()) return 'today';
    if (d > t) return 'future';
    return 'past';
}

export function getTabs(type: DateType): Tab[] {
    if (type === 'today') return [
        { id: 'today-tasks', label: 'Today Tasks' },
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'create', label: '+ Create' },
    ];
    if (type === 'future') return [
        { id: 'date-tasks', label: 'Tasks' },
        { id: 'upcoming', label: 'Upcoming' },
    ];
    // past
    return [
        { id: 'overdue', label: 'Overdue' },
        { id: 'date-tasks', label: 'Tasks' },
        { id: 'upcoming', label: 'Upcoming' },
    ];
}


export function getWeekDates(offset: number) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// WeeklyTracker.tsx mein
export function getTodayDayName(): DayName {
  const idx = new Date().getDay();
  return DAYS[idx === 0 ? 6 : idx - 1] as DayName;
}

export function parseColorToRgb(color?: string | null) {
  if (!color || typeof color !== 'string') return null;

  const trimmed = color.trim();

  // Hex: #RGB, #RRGGBB
  if (trimmed.startsWith('#')) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return null;
    const int = parseInt(hex, 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
  }

  // rgb() or rgba()
  const rgbMatch = trimmed.match(/^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (rgbMatch) {
    return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) };
  }

  return null;
}

export function getContrastTextColor(color: string) {
  const rgb = parseColorToRgb(color);
  if (!rgb) return '#f8fafc';

  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.6 ? '#1f2937' : '#f8fafc';
}

export function withAlpha(color: string, alpha: number) {
  const rgb = parseColorToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

