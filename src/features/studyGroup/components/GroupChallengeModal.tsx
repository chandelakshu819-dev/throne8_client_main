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
  type GroupChallengeResponse,
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
    tint: "from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-500",
    available: true,
  },
  {
    id: "daily",
    title: "Daily Goal Race",
    description: "First to hit 8 hours today wins",
    Icon: Target,
    tint: "from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-500",
    available: true,
  },
];

const MEDALS = ["🥇", "🥈", "🥉"];

const TITLES: Record<ChallengeId, string> = {
  streak: "Streak Battle",
  speed: "Speed Challenge",
  daily: "Daily Goal Race",
};

/** 4980 -> "1h 23m", 300 -> "5m", 0 -> "0m" */
const formatDuration = (totalSeconds: number) => {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatClock = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";

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
  const [raceData, setRaceData] = useState<GroupChallengeResponse | null>(null);

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

  // Speed Challenge and Daily Goal Race share one loader
  const loadRace = useCallback(
    async (challenge: "speed" | "daily") => {
      setLoading(true);
      setError(null);
      try {
        const result = await StudyGroupService.getGroupChallenge(
          groupId,
          challenge
        );
        setRaceData(result);
      } catch (err: any) {
        setError(err?.message || "Could not load the standings.");
      } finally {
        setLoading(false);
      }
    },
    [groupId]
  );

  const refresh = () => {
    if (selected === "streak") loadStreaks();
    else if (selected === "speed" || selected === "daily") loadRace(selected);
  };

  // Load standings when a challenge is opened
  useEffect(() => {
    if (!isOpen) return;
    if (selected === "streak") loadStreaks();
    else if (selected === "speed" || selected === "daily") {
      setRaceData(null);
      loadRace(selected);
    }
  }, [isOpen, selected, loadStreaks, loadRace]);

  // Keep the race standings live while the modal is open
  useEffect(() => {
    if (!isOpen || (selected !== "speed" && selected !== "daily")) return;
    const id = setInterval(() => loadRace(selected), 60000);
    return () => clearInterval(id);
  }, [isOpen, selected, loadRace]);

  // Reset when the modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelected(null);
      setData(null);
      setRaceData(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const nameFor = (userId: string, fallback?: string) => {
    const n = resolveName(userId);
    return n && n !== "Unknown User" ? n : fallback || n || "Member";
  };

  const leaderboard = Array.isArray(data?.leaderboard) ? data!.leaderboard : [];
  const raceBoard = Array.isArray(raceData?.leaderboard)
    ? raceData!.leaderboard
    : [];
  const isRace = selected === "speed" || selected === "daily";

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
              {selected ? TITLES[selected] : "Group Challenge"}
            </h3>
            <p className="text-xs text-[#6b5847]">
              Compete and motivate each other
            </p>
          </div>
          {selected !== null && (
            <button
              onClick={refresh}
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

        {/* Speed Challenge / Daily Goal Race standings */}
        {isRace && (
          <div className="mb-5">
            <p className="text-xs text-[#6b5847] mb-3">
              {selected === "speed"
                ? "Shortest time from your first session today to 2 hours of study wins."
                : "First member to study 8 hours today wins."}
            </p>

            {loading && !raceData && (
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

            {raceData && raceData.winnerId && (
              <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 text-center">
                🏆{" "}
                {raceBoard[0]?.isCurrentUser
                  ? "You are leading!"
                  : `${nameFor(raceBoard[0].userId, raceBoard[0].userName)} is leading`}
              </div>
            )}

            {raceBoard.length > 0 && (
              <ul className="space-y-2">
                {raceBoard.map((entry, index) => (
                  <li
                    key={entry.userId}
                    className={`rounded-xl px-3 py-2.5 border ${
                      entry.isCurrentUser
                        ? "bg-amber-50 border-amber-300"
                        : "bg-white border-[#ece7e2]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-center font-bold text-[#4a3728]">
                        {entry.reached
                          ? MEDALS[index] ?? `#${entry.rank}`
                          : `#${entry.rank}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[#4a3728] truncate">
                          {nameFor(entry.userId, entry.userName)}
                          {entry.isCurrentUser && (
                            <span className="ml-1 text-xs text-amber-600">
                              (you)
                            </span>
                          )}
                          {entry.isStudying && (
                            <span className="ml-2 text-[10px] font-bold uppercase text-green-600">
                              studying now
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#6b5847]">
                          {entry.reached
                            ? selected === "speed"
                              ? `Done in ${formatDuration(entry.elapsedSeconds ?? 0)} · ${formatClock(entry.reachedAt)}`
                              : `Reached at ${formatClock(entry.reachedAt)}`
                            : `${formatDuration(entry.studiedSeconds)} of ${formatDuration(raceData!.targetSeconds)}`}
                        </div>
                      </div>
                      <div className="font-bold text-sm text-[#4a3728]">
                        {entry.reached ? "✓" : `${entry.progressPercent}%`}
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-[#ece7e2] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          entry.reached ? "bg-green-500" : "bg-amber-400"
                        }`}
                        style={{ width: `${entry.progressPercent}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {raceData && (
              <p className="mt-3 text-xs text-[#6b5847] text-center">
                {raceData.myRank ? `Your rank: #${raceData.myRank} · ` : ""}
                {raceData.totalMembers} members · resets at midnight
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
