// src/features/dashboard/components/feed/DeleteConfirmModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  isDarkMode?: boolean;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  isDarkMode,
  title = 'Delete post?',
  description = 'Are you sure you want to delete this post permanently?',
  onCancel,
  onConfirm,
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Background scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${
          isDarkMode ? 'bg-slate-800' : 'bg-[#f6ede8]'
        }`}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#1a1a1a]'}`}>{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-black/5 text-gray-500'}`}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className={`px-6 pb-5 text-sm ${isDarkMode ? 'text-slate-300' : 'text-[#4a3728]/70'}`}>
          {description}
        </p>

        <div className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-[#4a3728]/10'}`}>
          <div className="flex items-center justify-end gap-3 px-6 py-4">
            <button
              onClick={onCancel}
              className={`px-5 py-2 rounded-full text-sm font-semibold border transition-colors ${
                isDarkMode
                  ? 'border-slate-600 text-white hover:bg-slate-700'
                  : 'border-[#4a3728]/30 text-[#4a3728] hover:bg-black/5'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DeleteConfirmModal;