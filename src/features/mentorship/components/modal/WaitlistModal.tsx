"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { C } from "../../types/data";

interface WaitlistModalProps {
  service: { title: string; sessionType: string; duration?: number; price?: number };
  mentorName?: string;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ service, mentorName, onClose, onConfirm }) => {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(note.trim());
      // parent closes the modal on success
    } catch (err: any) {
      setError(err?.message || "Failed to join waitlist.");
      setSubmitting(false);
    }
  };

  const rows: [string, string][] = [
    ["Service", service.title],
    ...(mentorName ? ([["Mentor", mentorName]] as [string, string][]) : []),
    ["Type", service.sessionType.replace(/_/g, " ")],
    ["Duration", service.duration ? `${service.duration} min` : "—"],
    ["Price", service.price ? `₹${service.price}` : "Free"],
  ];

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={submitting ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 440, margin: 16, background: "#fff", borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.dark }}>Join Waitlist</h3>
        <p style={{ margin: "6px 0 16px", fontSize: 13, color: C.mid, lineHeight: 1.5 }}>
          No slot is free right now. You'll be added to the queue and notified by email/SMS when a spot opens.
          You'll then have 48 hours to book it.
        </p>

        <div style={{ borderRadius: 12, padding: 14, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 16 }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, padding: "4px 0" }}>
              <span style={{ color: C.mid }}>{label}</span>
              <span style={{ color: C.dark, fontWeight: 600, textAlign: "right", textTransform: label === "Type" ? "capitalize" : "none" }}>{value}</span>
            </div>
          ))}
        </div>

        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
          Note for the mentor (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="e.g. Preferred evenings, or what you want to cover"
          style={{ width: "100%", borderRadius: 12, padding: 10, fontSize: 13, resize: "none", outline: "none", border: `1px solid ${C.border}`, background: C.bg, color: C.dark, boxSizing: "border-box" }}
        />

        {error && (
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, borderRadius: 8, padding: "8px 12px", background: "#fee2e2", color: "#dc2626" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{ padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "transparent", color: C.dark, border: `1px solid ${C.border}`, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: C.grad, color: "#fff", border: "none", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Joining..." : "Join Waitlist"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default WaitlistModal;