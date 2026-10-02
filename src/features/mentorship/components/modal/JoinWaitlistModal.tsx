"use client";

import React, { useState } from "react";
import { X, Clock, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import MentorService from "@/lib/api/mentorship.service";

interface JoinWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string;
  mentorName?: string;
  serviceId?: string;
  serviceTitle?: string;
  sessionType?: string;
  onSuccess?: (result: any) => void;
}

export default function JoinWaitlistModal({
  isOpen,
  onClose,
  mentorId,
  mentorName = "Mentor",
  serviceId,
  serviceTitle = "1-on-1 Mentorship",
  sessionType = "consultation",
  onSuccess,
}: JoinWaitlistModalProps) {
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("Morning (09:00 - 12:00)");
  const [notes, setNotes] = useState("");
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedResult, setJoinedResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const dates = preferredDate ? [new Date(preferredDate).toISOString()] : [new Date().toISOString()];
      const res = await MentorService.joinWaitlist({
        mentorId,
        serviceId,
        serviceTitle,
        preferredDates: dates,
        preferredTimeSlots: [preferredTimeSlot],
        sessionType: sessionType || "consultation",
        timezone,
        notes: notes.trim() || undefined,
      });

      const entry = res?.data || res;
      setJoinedResult(entry);
      if (onSuccess) onSuccess(entry);
    } catch (err: any) {
      setError(err.message || "Failed to join waitlist. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setJoinedResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#e0d8cf]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0ebe4]" style={{ backgroundColor: "#fbf7f3" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#4a3728] text-white">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#4a3728]">Join Waitlist</h3>
              <p className="text-xs text-[#8a7a6a]">With {mentorName}</p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7a5c3e] hover:bg-[#f3ece4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {joinedResult ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#dcfce7] text-[#15803d] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-[#4a3728]">You're on the Waitlist!</h4>
                <p className="text-sm text-[#8a7a6a] mt-1">
                  You are <span className="font-bold text-[#4a3728]">#{joinedResult.queuePosition || joinedResult.position || 1}</span> in line for <span className="font-semibold text-[#4a3728]">{serviceTitle}</span>.
                </p>
              </div>
              <div className="bg-[#fbf7f3] p-4 rounded-2xl border border-[#e0d8cf] text-xs text-[#7a5c3e] text-left space-y-1">
                <p>💡 We will notify you instantly in-app and via email as soon as a slot opens up.</p>
                <p>⏱️ Once notified, you will have 24 hours to claim your slot.</p>
              </div>
              <button
                onClick={resetAndClose}
                className="w-full py-3 rounded-xl font-bold text-sm bg-[#4a3728] text-white hover:bg-[#38291d] transition-colors shadow-md"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-[#fee2e2] border border-[#fca5a5] text-[#dc2626] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Service Info summary */}
              <div className="p-3.5 rounded-2xl bg-[#fbf7f3] border border-[#e0d8cf]">
                <span className="text-[11px] uppercase font-bold text-[#8a7a6a] tracking-wider block">Service</span>
                <span className="text-sm font-bold text-[#4a3728]">{serviceTitle}</span>
              </div>

              {/* Preferred Date */}
              <div>
                <label className="block text-xs font-bold text-[#7a5c3e] mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Preferred Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e0d8cf] text-sm text-[#4a3728] focus:outline-none focus:border-[#4a3728] transition-colors"
                />
              </div>

              {/* Preferred Time Window */}
              <div>
                <label className="block text-xs font-bold text-[#7a5c3e] mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Preferred Time Slot
                </label>
                <select
                  value={preferredTimeSlot}
                  onChange={(e) => setPreferredTimeSlot(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e0d8cf] text-sm text-[#4a3728] focus:outline-none focus:border-[#4a3728] transition-colors bg-white"
                >
                  <option value="Morning (09:00 - 12:00)">Morning (09:00 - 12:00)</option>
                  <option value="Afternoon (12:00 - 17:00)">Afternoon (12:00 - 17:00)</option>
                  <option value="Evening (17:00 - 21:00)">Evening (17:00 - 21:00)</option>
                  <option value="Anytime">Anytime available</option>
                </select>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-bold text-[#7a5c3e] mb-1.5">
                  Note for Mentor (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share a brief note about what you'd like to discuss..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e0d8cf] text-sm text-[#4a3728] placeholder-[#a09080] focus:outline-none focus:border-[#4a3728] transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm border border-[#e0d8cf] text-[#7a5c3e] hover:bg-[#fbf7f3] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#4a3728] text-white hover:bg-[#38291d] disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Waitlist"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
