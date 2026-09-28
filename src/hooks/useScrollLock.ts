"use client";

import { useEffect, useRef } from "react";

let lockCount = 0;
let originalBodyOverflow = "";
let originalBodyPaddingRight = "";

// Store custom containers scroll lock states
const lockedContainers = new Map<HTMLElement, string>();

/**
 * Hook to lock background scrolling when a modal/dialog is open.
 * Saves/restores scroll position & overflow state, compensates for scrollbar width,
 * handles Escape key presses, and supports nested modals.
 */
export function useScrollLock(isOpen: boolean, onEscape?: () => void) {
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!isOpen) return;

    // 1. Escape key handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onEscapeRef.current?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // 2. Lock background scroll
    lockCount++;
    if (lockCount === 1) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // Save body styles
      originalBodyOverflow = document.body.style.overflow;
      originalBodyPaddingRight = document.body.style.paddingRight;

      // Apply body scroll lock & scrollbar width compensation to prevent layout shifts
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      // Check for custom scroll containers (e.g. <main> or [data-scroll-container])
      const customScrollContainers = document.querySelectorAll<HTMLElement>(
        "main, [data-scroll-container], .scroll-container"
      );
      customScrollContainers.forEach((container) => {
        const computedStyle = window.getComputedStyle(container);
        if (computedStyle.overflowY === "auto" || computedStyle.overflowY === "scroll") {
          lockedContainers.set(container, container.style.overflowY);
          container.style.overflowY = "hidden";
        }
      });
    }

    // Cleanup function runs when modal closes or component unmounts / routes change
    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;

        lockedContainers.forEach((origOverflow, element) => {
          element.style.overflowY = origOverflow;
        });
        lockedContainers.clear();
      }
    };
  }, [isOpen]);
}

export default useScrollLock;
