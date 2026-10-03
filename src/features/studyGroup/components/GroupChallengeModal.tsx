"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Zap,
  Flame,
  Timer,
  Target,
  ChevronLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import StudyGroupService, {
  type GroupStreakLeaderboardResponse,
} from "@/lib/api/studyGroup.service";

interface GroupChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  /** Returns a display name for a userId (use getUserInfoSync(...).name from useGroupData) */
  resolveName: (userId: string) => string;
}

type ChallengeId = "streak" | "speed" | "daily";

const CHALLENGES: Array<{
  id: ChallengeId;
  title: string;
  description: string;
  Icon: typeof Flame;
  tint: string;
  available: boolean;
}> = [
  {
    id: "streak",
    title: "Streak Battle",
    description: "Who has the longest study streak in the group?",
    Icon: Flame,
    tint: "from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-600",
    available: true,
  },
  {
    id: "speed",
    title: "Speed Challenge",
    description: "Who can study 2 hours fastest?",
    Icon: Timer,
    tint: "from-purple-50 to-purple-100 text-purple-500",
    available: false,
  },
  {
    id: "daily",
    title: "Daily Goal Race",
    description: "First to hit 8 hours today wins",
    Icon: Target,
    tint: "from-amber-50 to-amber-100 text-amber-500",
    available: false,
  },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function GroupChallengeModal({
  isOpen,
  onClose,
  groupId,
  resolveName,
}: GroupChallengeModalProps) {
  const [selected, setSelected] = useState<ChallengeId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GroupStreakLeaderboardResponse | null>(null);

  const loadStreaks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await StudyGroupService.getGroupStreakLeaderboard(groupId);
      setData(result);
    } catch (err: any) {
      setError(err?.message || "Could not load the standings.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Load standings when Streak Battle is opened
  useEffect(() => {
    if (isOpen && selected === "streak") loadStreaks();
  }, [isOpen, selected, loadStreaks]);

  // Reset when the modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelected(null);
      setData(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const nameFor = (userId: string, fallback?: string) => {
    const n = resolveName(userId);
    return n && n !== "Unknown User" ? n : fallback || n || "Member";
  };

  const leaderboard = Array.isArray(data?.leaderboard) ? data!.leaderboard : [];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/50 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <Zap size={24} className="text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#4a3728]">
              {selected === "streak" ? "Streak Battle" : "Group Challenge"}
            </h3>
            <p className="text-xs text-[#6b5847]">
              Compete and motivate each other
            </p>
          </div>
          {selected === "streak" && (
            <button
              onClick={loadStreaks}
              disabled={loading}
              title="Refresh"
              className="p-2 rounded-full hover:bg-black/5 text-[#6b5847] disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        {/* Challenge list */}
        {selected === null && (
          <div className="space-y-3 mb-5">
            {CHALLENGES.map(
              ({ id, title, description, Icon, tint, available }) => (
                <button
                  key={id}
                  disabled={!available}
                  onClick={() => available && setSelected(id)}
                  className={`w-full p-4 bg-gradient-to-r ${tint} rounded-xl text-left transition-all ${
                    available ? "" : "opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Icon size={20} className="mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-[#4a3728] mb-1">
                          {title}
                        </div>
                        <div className="text-xs text-[#6b5847]">
                          {description}
                        </div>
                      </div>
                    </div>
                    {available ? (
                      <ChevronLeft className="rotate-180 shrink-0" size={20} />
                    ) : (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide bg-white/80 text-[#6b5847] px-2 py-1 rounded-full">
                        Soon
                      </span>
                    )}
                  </div>
                </button>
              )
            )}
          </div>
        )}

        {/* Streak Battle standings */}
        {selected === "streak" && (
          <div className="mb-5">
            {loading && !data && (
              <div className="flex items-center justify-center py-10 text-[#6b5847]">
                <Loader2 className="animate-spin mr-2" size={18} /> Loading
                standings...
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && data && leaderboard.length === 0 && (
              <div className="text-center py-8 text-sm text-[#6b5847]">
                No active streaks yet.
                <br />
                Study today to start yours!
              </div>
            )}

            {leaderboard.length > 0 && (
              <ul className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <li
                    key={entry.userId}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${
                      entry.isCurrentUser
                        ? "bg-amber-50 border-amber-300"
                        : "bg-white border-[#ece7e2]"
                    }`}
                  >
                    <div className="w-8 text-center font-bold text-[#4a3728]">
                      {MEDALS[index] ?? `#${entry.rank ?? index + 1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#4a3728] truncate">
                        {nameFor(entry.userId, entry.userName)}
                        {entry.isCurrentUser && (
                          <span className="ml-1 text-xs text-amber-600">
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#6b5847]">
                        Best: {entry.longestStreak ?? 0} days
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-[#4a3728]">
                      <Flame size={16} className="text-orange-500" />
                      {entry.currentStreak ?? 0}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {data && (
              <p className="mt-3 text-xs text-[#6b5847] text-center">
                {data.myRank ? `Your rank: #${data.myRank} · ` : ""}
                {data.totalMembers ?? leaderboard.length} members in the group
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-2">
          {selected !== null && (
            <button
              onClick={() => setSelected(null)}
              className="flex-1 px-4 py-2.5 bg-white border border-[#d4a574]/40 hover:bg-[#f7f3ee] text-[#4a3728] rounded-lg font-semibold transition-all"
            >
              Back
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-[#4a3728] rounded-lg font-semibold transition-all"
          >
            {selected === null ? "Cancel" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
