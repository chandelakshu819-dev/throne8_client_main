import { memo } from 'react';

interface StatCardProps {
  id: string;
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: string;
  isLoading?: boolean;
}

const StatCard = memo(function StatCard({ label, value, change, up, icon, isLoading }: StatCardProps) {
  return (
    <div className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-20 h-20 bg-[#4a3728]/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 bg-[#4a3728]/10 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-[#4a3728]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
          </div>
          {isLoading ? (
            <span className="w-10 h-5 bg-[#e0d8cf]/60 rounded-full animate-pulse" />
          ) : change ? (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {change}
            </span>
          ) : null}
        </div>
        {isLoading ? (
          <div className="w-20 h-7 bg-[#e0d8cf]/60 rounded-lg animate-pulse mb-1" />
        ) : (
          <p className="text-2xl font-bold text-[#4a3728]">{value}</p>
        )}
        <p className="text-xs text-[#4a3728]/60 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
});

export default StatCard;