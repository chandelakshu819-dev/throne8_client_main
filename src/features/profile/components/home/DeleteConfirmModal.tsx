'use client';
// src/features/profile/components/home/DeleteConfirmModal.tsx
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  title?: string;
  message?: string;
}

const DeleteConfirmModal = ({
  isOpen,
  onCancel,
  onConfirm,
  isDeleting = false,
  title = 'Delete post?',
  message = 'Are you sure you want to delete this post permanently?',
}: DeleteConfirmModalProps) => {
  // background scroll lock jab modal khula ho
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onCancel}
      className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#f6ede8] w-full max-w-sm rounded-2xl shadow-2xl border border-[#e0d8cf] relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#4a3728]">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-[#e0d8cf]/60 text-[#4a3728]/60 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message */}
        <div className="px-6 pb-6">
          <p className="text-sm text-[#4a3728]/70 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e0d8cf]/60 bg-[#e0d8cf]/20">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#4a3728] border-2 border-[#4a3728]/20 hover:border-[#4a3728]/40 hover:bg-[#4a3728]/5 transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmModal;