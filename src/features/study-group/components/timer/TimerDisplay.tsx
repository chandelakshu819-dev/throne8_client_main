'use client';

import { useAppSelector } from "@/store/hooks";
import { useState, useEffect } from 'react';

interface TimerDisplayProps {
  progress: number;
}

export default function TimerDisplay({ progress }: TimerDisplayProps) {
  const [mounted, setMounted] = useState(false);
  
  const { minutes, seconds, isBreakMode, activeTab } = useAppSelector(state => ({
    minutes: state.timer.minutes,
    seconds: state.timer.seconds,
    isBreakMode: state.timer.isBreakMode,
    activeTab: state.timer.activeTab,
  }));
  
  const completedSessions = useAppSelector(state => state.timer.completedSessions);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-[#f6ede8]/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl border border-[#e0d8cf]/50 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-[#8b6f47]/10 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-[#6b4e3d]/10 to-transparent rounded-full blur-2xl"></div>
        <div className="flex justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 relative">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#e0d8cf]/50"></div>
          ))}
        </div>
        <div className="text-center mb-4 sm:mb-6 relative">
          <div className="text-5xl sm:text-6xl md:text-7xl font-black text-[#4a3728] tracking-tight mb-1">
            25:00
          </div>
          <div className="text-xs font-bold text-[#4a3728]/60 uppercase tracking-wider">
            Pomodoro Session
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f6ede8]/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl border border-[#e0d8cf]/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-[#8b6f47]/10 to-transparent rounded-full blur-2xl"></div>
      <div className="absolute -bottom-10 -left-10 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-[#6b4e3d]/10 to-transparent rounded-full blur-2xl"></div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 relative">
        {[...Array(8)].map((_, idx) => (
          <div
            key={idx}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
              idx < Math.floor(progress / 12.5)
                ? 'bg-gradient-to-r from-[#4a3728] to-[#6b4e3d] shadow-sm'
                : 'bg-[#e0d8cf]/50'
            }`}
          ></div>
        ))}
      </div>

      {/* Timer Display */}
      <div className="text-center mb-4 sm:mb-6 relative">
        <div className="text-5xl sm:text-6xl md:text-7xl font-black text-[#4a3728] tracking-tight mb-1">
          {String(minutes || 0).padStart(2, '0')}:{String(seconds || 0).padStart(2, '0')}
        </div>
        <div className="text-xs font-bold text-[#4a3728]/60 uppercase tracking-wider">
          {isBreakMode ? (
            completedSessions % 4 === 0 ? 'Long Break' : 'Short Break'
          ) : (
            `${(activeTab || 'pomodoro').charAt(0).toUpperCase() + (activeTab || 'pomodoro').slice(1)} Session`
          )}
        </div>
      </div>
    </div>
  );
}