// src/shared/uiComponents/Toast.tsx
'use client';

import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  linkText?: string;
  linkHref?: string;
  avatarUrl?: string;
  avatarInitial?: string;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  linkText,
  linkHref,
  avatarUrl,
  avatarInitial = 'N',
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  return (
    <div className="fixed bottom-5 left-5 z-[300] flex items-center gap-3 bg-white rounded-full shadow-2xl border border-[#4a3728]/10 pl-1.5 pr-4 py-1.5 animate-[fadeIn_0.25s_ease-out]">
      <div className="relative w-9 h-9 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          avatarInitial
        )}
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
      </div>

      <p className="text-sm text-[#4a3728] font-medium whitespace-nowrap">
        {message}
        {linkText && linkHref && (
          <a href={linkHref} className="ml-2 underline font-semibold hover:text-[#6b5643]">
            {linkText}
          </a>
        )}
      </p>

      <button
        onClick={onClose}
        className="ml-1 text-[#4a3728]/50 hover:text-[#4a3728] p-1 rounded-full hover:bg-[#e0d8cf]/40 flex-shrink-0"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;