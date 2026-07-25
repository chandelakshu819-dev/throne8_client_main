//src/feature/components/feed/RepostMenuDropdown.tsx
import React from 'react';

const RepostMenuDropdown = ({ isDarkMode, index, post, onOpenWithPerspectiveModal, onRepostInstant }: any) => {
  return (
    <div
      className={`absolute right-0 bottom-full mb-2 w-72 rounded-2xl shadow-2xl border z-50 overflow-hidden ${
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
};

export default RepostMenuDropdown;