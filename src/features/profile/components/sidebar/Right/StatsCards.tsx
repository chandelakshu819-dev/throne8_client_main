// app/(dashboard)/components/sidebar/StatsCards.tsx
'use client';
import React, { useEffect, useState } from 'react';
import AnalyticsService from '@/lib/api/analytics.service';

interface StatsCardsProps {
  isDarkMode: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ isDarkMode }) => {
  const [profileViews, setProfileViews] = useState<number>(0);
  const [viewsChangePercent, setViewsChangePercent] = useState<number>(0);
  const [postImpressions, setPostImpressions] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [viewsRes, changeRes, impressionsRes] = await Promise.all([
          AnalyticsService.getProfileViewsCount(90).catch(() => null),
          AnalyticsService.getProfileViewsChange(30).catch(() => null),
          AnalyticsService.getPostImpressionsCount(20).catch(() => null),
        ]);

        if (viewsRes?.data?.total !== undefined) {
          setProfileViews(viewsRes.data.total);
        }
        if (changeRes?.data?.change?.percentage !== undefined) {
          setViewsChangePercent(changeRes.data.change.percentage);
        }
        if (impressionsRes?.data?.total !== undefined) {
          setPostImpressions(impressionsRes.data.total);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCount = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return `${num}`;
  };

  return (
    <div className={`grid grid-cols-2 gap-3 mb-4 ${isDarkMode ? 'bg-slate-700/30' : 'bg-white/40'} p-4 rounded-2xl`}>
      {/* Profile Views */}
      <div className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl ${isDarkMode ? 'bg-slate-600/30' : 'bg-[#e0d8cf]/50'}`}>
        <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-600/50' : 'bg-[#e0d8cf]/80'}`}>
          <i className="ri-eye-line text-lg text-[#6b5643]"></i>
        </div>
        <p className={`text-xs font-medium text-center ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/70'}`}>
          Profile Views
        </p>
        <div className="flex items-center gap-1">
          <p className="text-base font-black bg-gradient-to-r from-[#6b5643] to-[#8b7355] bg-clip-text text-transparent">
            {isLoading ? '...' : formatCount(profileViews)}
          </p>
          {!isLoading && viewsChangePercent !== 0 && (
            <span className={`text-xs font-semibold ${viewsChangePercent >= 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
              {viewsChangePercent >= 0 ? '+' : ''}{viewsChangePercent}%
            </span>
          )}
        </div>
      </div>
      {/* Post Impressions */}
      <div className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl ${isDarkMode ? 'bg-slate-600/30' : 'bg-[#e0d8cf]/50'}`}>
        <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-600/50' : 'bg-[#e0d8cf]/80'}`}>
          <i className="ri-line-chart-line text-lg text-[#6b5643]"></i>
        </div>
        <p className={`text-xs font-medium text-center ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/70'}`}>
          Impressions
        </p>
        <div className="flex items-center gap-1">
          <p className="text-base font-black bg-gradient-to-r from-[#8b7355] to-[#6b5643] bg-clip-text text-transparent">
            {isLoading ? '...' : formatCount(postImpressions)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;