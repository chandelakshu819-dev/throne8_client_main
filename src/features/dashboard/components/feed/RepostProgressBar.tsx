//src/features/dashboard/components/feed/RepostProgressBar.tsx
'use client';
import React, { useEffect, useState } from 'react';

interface RepostProgressBarProps {
  isVisible: boolean;
  progress: number;
  isDarkMode: boolean;
}

const RepostProgressBar: React.FC<RepostProgressBarProps> = ({
  isVisible,
  progress,
  isDarkMode
}) => {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        setOpacity(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  if (!isVisible) return null;

  return (
    <div
      className={`w-full mb-8 transition-opacity duration-500 ${
        opacity === 0 ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`rounded-ful p-4 backdrop-blur-lg shadow-lg border max-w-2xl mx-auto ${
          isDarkMode
            ? 'bg-slate-800/60 border-slate-700'
            : 'bg-white/60 border-[#4a3728]/10'
        }`}
      >
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <i className="ri-repeat-line text-blue-500 text-lg"></i>
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
              Reposting...
            </span>
          </div>
          <span className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div
          className={`w-full h-2 rounded-full overflow-hidden ${
            isDarkMode ? 'bg-slate-700' : 'bg-[#e0d8cf]'
          }`}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Status Message */}
        <p className={`text-xs mt-3 text-center ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>
          {progress === 100 ? '✓ Repost successful!' : 'Please wait while your post is being shared...'}
        </p>
      </div>
    </div>
  );
};

export default RepostProgressBar;
