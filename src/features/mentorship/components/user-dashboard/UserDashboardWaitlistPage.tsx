"use client";
import { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
import MentorService from "@/lib/api/mentorship.service";
import { useRouter } from "next/navigation";

interface WaitlistItem {
  waitlistId: string;
  mentorId: string;
  mentorName?: string;
  serviceTitle?: string;
  sessionType: string;
  status: "active" | "notified" | "booked" | "expired" | "cancelled";
  queuePosition?: number;
  bookingWindowExpiresAt?: string;
  createdAt: string;
}

const WAITLIST_BADGE: Record<WaitlistItem["status"], { label: string; bg: string; fg: string }> = {
    active: { label: "Waiting", bg: "rgba(201,124,74,0.12)", fg: "#c97c4a" },
    notified: { label: "Approved", bg: "rgba(107,143,110,0.12)", fg: "#6b8f6e" },
    booked: { label: "Booked", bg: "rgba(74,55,40,0.08)", fg: "#7a5c3e" },
    expired: { label: "Removed", bg: "rgba(0,0,0,0.06)", fg: "#8a7a6a" },
    cancelled: { label: "Removed", bg: "rgba(0,0,0,0.06)", fg: "#8a7a6a" },
};

function formatSessionDate(dateStr: string) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

export default function UserDashboardWaitlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWaitlists = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
          const res = await MentorService.getMyWaitlists();
          setItems((res?.data ?? []) as WaitlistItem[]);
      } catch (e: any) {
          setError(e?.message || "Could not load your waitlists.");
      } finally {
          setLoading(false);
      }
  }, []);

  useEffect(() => {
      fetchWaitlists();
  }, [fetchWaitlists]);

  const goBook = (w: WaitlistItem) => {
      const slug = encodeURIComponent((w.mentorName || "mentor").toLowerCase().replace(/\s+/g, "-"));
      router.push(`/mentorship/mentor-card/${slug}/${w.mentorId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold" style={{ color: '#4a3728' }}>Waitlist</h1>
            <button
                onClick={fetchWaitlists}
                className="text-sm px-3 py-1.5 rounded-lg border hover:opacity-80 transition-opacity font-medium"
                style={{ borderColor: '#e0d8cf', color: '#7a5c3e', backgroundColor: '#fff' }}
            >
                Refresh
            </button>
        </div>
        <p className="text-sm font-medium" style={{ color: '#7a5c3e' }}>
          Manage the sessions you are waiting for.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#4a3728' }}></div>
        </div>
      ) : error ? (
        <div className="py-16 text-center text-sm font-medium" style={{ color: '#c97c4a' }}>
            {error}
        </div>
      ) : items.length === 0 ? (
        <div 
          className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl"
          style={{ backgroundColor: '#fff', border: '1px solid #e0d8cf' }}
        >
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}
          >
            <Clock className="w-8 h-8" style={{ color: '#c0b0a0' }} />
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#4a3728' }}>
            You're not on any waitlists
          </h3>
          <p className="text-sm max-w-md" style={{ color: '#7a5c3e' }}>
            When you join a waitlist for a full session, it will appear here so you can keep track of your position.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
            {items.map((w) => {
                const badge = WAITLIST_BADGE[w.status] || WAITLIST_BADGE.active;
                return (
                    <div
                        key={w.waitlistId}
                        className="rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-4"
                        style={{ background: '#fff', borderColor: '#e0d8cf' }}
                    >
                        <div>
                            <div className="text-sm font-bold mb-1" style={{ color: '#4a3728' }}>
                                {w.serviceTitle || (w.sessionType ? w.sessionType.replace(/_/g, " ") : "Session")}
                            </div>
                            <div className="text-xs" style={{ color: '#8a7a6a' }}>
                                {w.mentorName || "Mentor"} - Requested {formatSessionDate(w.createdAt)}
                                {w.status === "active" && w.queuePosition ? ` - Position #${w.queuePosition}` : ""}
                            </div>
                            {w.status === "notified" && w.bookingWindowExpiresAt && (
                                <div className="text-xs mt-1 font-medium" style={{ color: '#6b8f6e' }}>
                                    Book before {formatSessionDate(w.bookingWindowExpiresAt)}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className="text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ background: badge.bg, color: badge.fg }}
                            >
                                {badge.label}
                            </span>
                            {w.status === "notified" && (
                                <button
                                    onClick={() => goBook(w)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                                    style={{ background: '#4a3728' }}
                                >
                                    Book now
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
}
