// app/(dashboard)/components/feed/RepostMenuDropdown.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const RepostMenuDropdown = ({
  isDarkMode,
  index,
  post,
  onOpenWithPerspectiveModal,
  onRepostInstant,
  anchorRef, // optional: pass the trigger button's ref for perfect positioning
}: any) => {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const computePosition = () => {
      const anchorEl =
        anchorRef?.current ||
        document.querySelector(`[data-repost-trigger="${index}"]`);
      if (!anchorEl) return;

      const rect = (anchorEl as HTMLElement).getBoundingClientRect();
      const dropdownHeight = 180; // approx height of the menu
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < dropdownHeight;

      setCoords({
        top: openUp ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left: Math.max(8, rect.right - 288), // 288 = w-72
        openUp,
      });
    };

    computePosition();
    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition, true);
    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
    };
  }, [anchorRef, index]);

  if (!mounted || !coords) return null;

  const menu = (
    <div
      ref={dropdownRef}
      style={{ position: 'fixed', top: coords.top, left: coords.left }}
      className={`w-72 rounded-2xl shadow-2xl border z-[9999] overflow-hidden ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#4a3728]/20'
      }`}
    >
      <button
        onClick={() => onRepostInstant(index)}
        className={`w-full px-5 py-4 text-left transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#e0d8cf]/50'}`}
      >
        <div className="flex items-center gap-3 mb-1">
          <i className="ri-repeat-line text-xl text-[#6b5643]"></i>
          <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>Repost instantly</span>
        </div>
        <p className={`text-sm ml-8 ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>
          Instantly share this post
        </p>
      </button>

      <button
        onClick={() => onOpenWithPerspectiveModal(post, index)}
        className={`w-full px-5 py-4 text-left transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#e0d8cf]/50'}`}
      >
        <div className="flex items-center gap-3 mb-1">
          <i className="ri-edit-line text-xl text-[#6b5643]"></i>
          <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>Repost with perspective</span>
        </div>
        <p className={`text-sm ml-8 ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>
          Add your thoughts before sharing
        </p>
      </button>
    </div>
  );

  return createPortal(menu, document.body);
};

export default RepostMenuDropdown;