//timer/components/CustomTimerControls.tsx
'use client';

import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import { setCustomMinutes } from '@/hooks/studyGroup/features/timer/timerSlice';

export default function CustomTimerControls() {
  const dispatch = useAppDispatch();
  const { customMinutes, isActive } = useAppSelector(state => ({
    customMinutes: state.timer.customMinutes,
    isActive: state.timer.isActive,
  }));

  const handleCustomTimerChange = (increment: number) => {
    const newValue = customMinutes + increment;
    if (newValue >= 1 && newValue <= 180) {
      dispatch(setCustomMinutes(newValue));
    }
  };

  return (
    <div>
      <label className="mb-2 block text-center text-sm font-semibold text-[#4a3728]">
        How long? (use + and - to change by 5 minutes)
      </label>
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <button
          onClick={() => handleCustomTimerChange(-5)}
          disabled={isActive}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-[#e0d8cf]/60 hover:bg-[#e0d8cf]/80 text-[#4a3728] rounded-lg font-bold transition-all duration-300 hover:scale-110 shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"/>
          </svg>
        </button>
        
        <div className="bg-gradient-to-r from-[#4a3728] to-[#6b4e3d] text-[#f6ede8] rounded-xl px-5 py-2.5 sm:px-6 sm:py-3 min-w-20 sm:min-w-25 text-center">
          <div className="text-2xl sm:text-3xl font-black">{customMinutes}</div>
          <div className="text-xs font-bold opacity-80">minutes</div>
        </div>

        <button
          onClick={() => handleCustomTimerChange(5)}
          disabled={isActive}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-[#e0d8cf]/60 hover:bg-[#e0d8cf]/80 text-[#4a3728] rounded-lg font-bold transition-all duration-300 hover:scale-110 shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
      </div>
    </div>
  );
}