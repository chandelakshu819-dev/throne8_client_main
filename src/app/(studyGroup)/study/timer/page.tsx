// app/(studyGroup)/study/todo/components/TodoPanelModal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface TodoPanelModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Centered modal (bottom sheet on phones) in the same style as the
 * "Create Study Group" dialog: white card, header with title/subtitle + X,
 * scrollable body, dimmed backdrop, Esc / backdrop click to close.
 */
export default function TodoPanelModal({
  open,
  onClose,
  title = "Tasks",
  subtitle,
  children,
}: TodoPanelModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // lock page scroll behind the modal
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="todo-panel-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[85vh] sm:max-w-xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e0d8cf] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="todo-panel-title"
              className="truncate text-lg font-bold text-[#4a3728] sm:text-xl"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-[#6b5847]">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-[#6b5847] transition-colors hover:bg-[#f6ede8] hover:text-[#4a3728]"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable body (put your tabs + lists + form here) */}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}