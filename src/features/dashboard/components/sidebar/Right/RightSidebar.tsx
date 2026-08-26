// app/(dashboard)/components/sidebar/RightSidebar.tsx
import React from 'react';
import CreatePostPrompt from './CreatePostPrompt';
import PostAnalyticsButton from './PostAnalyticsButton';
import RecentPosts from './RecentPosts';
import StatsCards from './StatsCards';
import TrendingNow from './TrendingNow';

interface RightSidebarProps {
  isDarkMode: boolean;
  userPosts: any[];
  isPostCreatorOpen: boolean;
  setIsPostCreatorOpen: (open: boolean) => void;
  isAnalyticsOpen: boolean;
  setIsAnalyticsOpen: (open: boolean) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  isDarkMode,
  userPosts,
  isPostCreatorOpen,
  setIsPostCreatorOpen,
  isAnalyticsOpen,
  setIsAnalyticsOpen,
}) => {
  return (
    <>
      {/* Mobile Version - Simplified Search Bar */}
      <div className="lg:hidden w-full">
        <div
          className={`p-4 rounded-2xl shadow-lg backdrop-blur-xl border transition-all duration-500 ${
            isDarkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-[#f6ede8]/95 border-[#4a3728]/20'
          }`}
        >
          <CreatePostPrompt
            isDarkMode={isDarkMode}
            setIsPostCreatorOpen={setIsPostCreatorOpen}
          />
        </div>
      </div>

      {/* Desktop Version - Full Sidebar */}
      {/* ✅ SPACING FIX: space-y-12 → space-y-5 — sidebar ke sections ke
          beech gap bohot zyada tha (48px), tight kiya (20px) */}
           <div className="hidden lg:block w-[320px] flex-shrink-0 space-y-5">
        <div
          className={`p-5 rounded-3xl shadow-2xl backdrop-blur-xl border transition-all duration-300 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto ${
            isDarkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-[#f6ede8]/95 border-[#4a3728]/20'
          }`}
        >
          <CreatePostPrompt
            isDarkMode={isDarkMode}
            setIsPostCreatorOpen={setIsPostCreatorOpen}
          />

          <PostAnalyticsButton
            isDarkMode={isDarkMode}
            setIsAnalyticsOpen={setIsAnalyticsOpen}
          />

          <RecentPosts isDarkMode={isDarkMode} userPosts={userPosts} />
        </div>

        {/* <StatsCards isDarkMode={isDarkMode} /> */}

        {/* <TrendingNow isDarkMode={isDarkMode} /> */}
      </div>
    </>
  );
};

export default RightSidebar;