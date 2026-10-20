"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface PhotoLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function PhotoLightbox({ src, alt = "Profile photo", onClose }: PhotoLightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}

      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
          <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close photo"
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center bg-white/90 hover:bg-white transition-colors shadow-md"
      >
        <X className="w-5 h-5" style={{ color: "#4a3728" }} />
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
        style={{ border: "4px solid #fff" }}
      />
    </div>,
    document.body
  );
}