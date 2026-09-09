import { memo } from 'react';
import Link from 'next/link';

export interface PendingItem {
  id: string;
  label: string;
  action: string;
  href: string;
  urgency: 'high' | 'medium' | 'low';
}

interface PendingActionsProps {
  items: PendingItem[];
  isLoading?: boolean;
  error?: string | null;
}

const URGENCY_COLOR = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
} as const;

const PendingActions = memo(function PendingActions({
  items,
  isLoading = false,
  error = null,
}: PendingActionsProps) {
  return (
    <div className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#4a3728]">Action Needed</h3>
        {isLoading && (
          <span className="text-[11px] text-[#4a3728]/50 animate-pulse font-medium">Loading...</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#e0d8cf]/30 animate-pulse"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-2 h-2 rounded-full bg-[#4a3728]/20 flex-shrink-0" />
                <div className="h-3 bg-[#4a3728]/15 rounded w-3/4" />
              </div>
              <div className="h-5 w-14 bg-[#4a3728]/15 rounded-lg flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
          <p className="text-xs text-red-600 font-medium">Unable to load pending actions</p>
          <p className="text-[10px] text-red-500/80 mt-1">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-6 rounded-xl bg-[#e0d8cf]/30 border border-[#e0d8cf]/50 text-center">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-2 text-sm font-bold">
            ✓
          </div>
          <p className="text-xs font-semibold text-[#4a3728]">All caught up!</p>
          <p className="text-[11px] text-[#4a3728]/60 mt-0.5">
            No pending actions require your attention right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#e0d8cf]/50 hover:bg-[#e0d8cf]/80 transition-colors duration-200"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${URGENCY_COLOR[item.urgency]}`} />
                <p className="text-xs text-[#4a3728]/80 font-medium truncate">{item.label}</p>
              </div>
              <Link
                href={item.href}
                className="text-[10px] font-bold text-[#4a3728] bg-[#4a3728]/10 px-2 py-1 rounded-lg hover:bg-[#4a3728] hover:text-[#f6ede8] transition-all duration-200 whitespace-nowrap flex-shrink-0"
              >
                {item.action}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default PendingActions;