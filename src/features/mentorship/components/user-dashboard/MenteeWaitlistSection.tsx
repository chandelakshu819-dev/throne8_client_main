"use client";

import React, { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle, XCircle, ChevronRight, Sparkles } from "lucide-react";
import MentorService from "@/lib/api/mentorship.service";

function CountdownTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire?: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();

    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (!timeLeft) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] text-[#b45309] font-mono text-xs font-bold border border-[#fde68a]">
      <Clock className="w-3.5 h-3.5 animate-pulse" />
      <span>
        {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s left to claim
      </span>
    </div>
  );
}

export default function MenteeWaitlistSection() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadWaitlists = async () => {
    setLoading(true);
    try {
      const res = await MentorService.getMyWaitlists();
      setEntries(res?.data ?? res ?? []);
    } catch (err: any) {
      setToast({ message: err.message || "Failed to load waitlist entries", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaitlists();
  }, []);

  const handleClaim = async (waitlistId: string) => {
    setActionId(waitlistId);
    try {
      await MentorService.claimWaitlistSlot(waitlistId);
      setToast({ message: "🎉 Slot claimed successfully! Your booking is confirmed.", type: "success" });
      await loadWaitlists();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to claim slot.", type: "error" });
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (waitlistId: string) => {
    setActionId(waitlistId);
    try {
      await MentorService.declineWaitlistSlot(waitlistId, "Declined by mentee");
      setToast({ message: "Offer declined.", type: "success" });
      await loadWaitlists();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to decline offer.", type: "error" });
    } finally {
      setActionId(null);
    }
  };

  const handleLeave = async (waitlistId: string) => {
    setActionId(waitlistId);
    try {
      await MentorService.leaveWaitlist(waitlistId, "User left waitlist");
      setToast({ message: "Left waitlist.", type: "success" });
      await loadWaitlists();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to leave waitlist.", type: "error" });
    } finally {
      setActionId(null);
    }
  };

  const offeredEntries = entries.filter((e) => e.status === "notified");
  const otherEntries = entries.filter((e) => e.status !== "notified");

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-[#e0d8cf] text-center space-y-3">
        <Clock className="w-6 h-6 animate-spin text-[#7a5c3e] mx-auto" />
        <p className="text-sm font-semibold text-[#8a7a6a]">Loading your waitlists...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`p-4 rounded-2xl text-sm font-semibold flex items-center justify-between shadow-md border ${
            toast.type === "success"
              ? "bg-[#dcfce7] text-[#15803d] border-[#86efac]"
              : "bg-[#fee2e2] text-[#dc2626] border-[#fca5a5]"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-xs font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Offered Slots Banner Section */}
      {offeredEntries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-wider font-extrabold text-[#b45309] flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Offered Slots Ready to Claim ({offeredEntries.length})
          </h3>
          {offeredEntries.map((entry) => (
            <div
              key={entry.waitlistId}
              className="bg-gradient-to-r from-[#fffbeb] to-[#fff7ed] rounded-3xl p-6 border border-[#fde68a] shadow-md space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-[#b45309] uppercase tracking-wider block">
                    Slot Available!
                  </span>
                  <h4 className="text-xl font-bold text-[#4a3728]">
                    {entry.serviceTitle || entry.sessionType || "Mentorship Session"}
                  </h4>
                  <p className="text-sm text-[#7a5c3e] mt-0.5">With {entry.mentorName || "your mentor"}</p>
                </div>

                {entry.bookingWindowExpiresAt && (
                  <CountdownTimer expiresAt={entry.bookingWindowExpiresAt} onExpire={loadWaitlists} />
                )}
              </div>

              {entry.offeredSlot?.date && (
                <div className="p-3.5 rounded-2xl bg-white/80 border border-[#fde68a] text-xs text-[#7a5c3e] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#b45309]" />
                  <span>
                    Offered Slot: {new Date(entry.offeredSlot.date).toLocaleDateString()} {entry.offeredSlot.startTime ? `at ${entry.offeredSlot.startTime}` : ""}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleClaim(entry.waitlistId)}
                  disabled={actionId === entry.waitlistId}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#15803d] text-white hover:bg-[#166534] disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {actionId === entry.waitlistId ? "Claiming..." : "Claim Slot"}
                </button>
                <button
                  onClick={() => handleDecline(entry.waitlistId)}
                  disabled={actionId === entry.waitlistId}
                  className="px-5 py-3 rounded-xl font-semibold text-sm border border-[#fca5a5] text-[#dc2626] hover:bg-[#fee2e2] disabled:opacity-50 transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Waitlists Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#e0d8cf] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#f0ebe4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4a3728] text-white flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#4a3728]">My Waitlist Subscriptions</h3>
              <p className="text-xs text-[#8a7a6a]">Track your position for mentor availability</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#f3ece4] text-[#7a5c3e]">
            {entries.length} Total
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm font-semibold text-[#4a3728]">You are not on any waitlists</p>
            <p className="text-xs text-[#8a7a6a]">
              When a mentor has no free slots, you can join their waitlist from their profile.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const isWaiting = entry.status === "active" || entry.status === "waiting";
              const isConverted = entry.status === "converted" || entry.status === "booked";
              const isDeclined = entry.status === "declined" || entry.status === "cancelled";
              const isNotified = entry.status === "notified";

              return (
                <div
                  key={entry.waitlistId}
                  className="p-4 rounded-2xl border border-[#f0ebe4] hover:border-[#e0d8cf] transition-all bg-[#fbf7f3]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#4a3728]">
                        {entry.serviceTitle || entry.sessionType || "Mentorship"}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isWaiting
                            ? "bg-[#fef3c7] text-[#b45309]"
                            : isNotified
                            ? "bg-[#dcfce7] text-[#15803d]"
                            : isConverted
                            ? "bg-[#f3e8ff] text-[#7c3aed]"
                            : "bg-[#fee2e2] text-[#dc2626]"
                        }`}
                      >
                        {isWaiting ? "Waiting" : isNotified ? "Slot Offered!" : isConverted ? "Claimed / Booked" : entry.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#7a5c3e]">
                      Mentor: <span className="font-semibold text-[#4a3728]">{entry.mentorName || entry.mentorId}</span>
                    </p>

                    {entry.notes && (
                      <p className="text-xs text-[#8a7a6a] italic max-w-md truncate">"{entry.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {isWaiting && entry.queuePosition && (
                      <div className="text-right">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a7a6a] block">
                          Position
                        </span>
                        <span className="text-base font-bold text-[#4a3728]">
                          #{entry.queuePosition}
                        </span>
                      </div>
                    )}

                    {(isWaiting || isNotified) && (
                      <button
                        onClick={() => handleLeave(entry.waitlistId)}
                        disabled={actionId === entry.waitlistId}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[#e0d8cf] text-[#7a5c3e] hover:bg-[#fee2e2] hover:text-[#dc2626] hover:border-[#fca5a5] transition-colors"
                      >
                        Leave
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
