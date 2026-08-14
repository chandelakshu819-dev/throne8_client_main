'use client';

import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import { setActiveTab } from '@/hooks/studyGroup/features/timer/timerSlice';
import { useState, useEffect } from 'react';
import { tabs } from '@/features/studyGroup/data';
import { Tab as TabTimer } from '@/features/studyGroup/interface';


export default function TimerTabs() {
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);
  const activeTab = useAppSelector(state => state.timer.activeTab);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTabChange = (tabId: 'pomodoro' | 'focus' | 'timer') => {
    dispatch(setActiveTab(tabId));
  };

  if (!mounted) {
    return (
      <div className="bg-[#f6ede8]/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-lg border border-[#e0d8cf]/50 mb-3 sm:mb-4">
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs transition-all duration-300 ${
                tab.id === 'pomodoro'
                  ? 'bg-gradient-to-r from-[#4a3728] to-[#6b4e3d] text-white shadow-md ring-1 ring-[#f6ede8]/50'
                  : 'bg-transparent text-[#4a3728] hover:bg-[#e0d8cf]/50 hover:text-[#4a3728]'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f6ede8]/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-lg border border-[#e0d8cf]/50 mb-3 sm:mb-4">
      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#4a3728] to-[#6b4e3d] text-white shadow-md ring-1 ring-[#f6ede8]/50'
                : 'bg-transparent text-[#4a3728] hover:bg-[#e0d8cf]/50'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>
    </div>
  );
}