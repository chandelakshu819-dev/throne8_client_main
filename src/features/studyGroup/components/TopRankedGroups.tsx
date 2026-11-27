"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TrendingUp, Users, Award, Trophy } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectJoinLoading, selectTopRankedGroups, selectTopRankedGroupsLoading } from "@/hooks/studyGroup/features/groups/groupsSlice";
import { useGroupData } from "@/features/study-group/hooks/useGroupData";
import SkeletonLoader from "@/app/loading";
import { joinGroupThunk, sendJoinRequestThunk } from "@/hooks/studyGroup/features/groups/group.thunks";
import JoinGroupModal from "@/features/study-group/modals/joinGroupModal";
import {
  GROUP_GRID,
  SectionHeader,
  ShowMoreButton,
} from "./GroupSectionUI";


/* ===================== CARD ===================== */
const TopRankedCard = ({
  group,
  onJoinClick,
}: {
  group: any;
  onJoinClick: (group: any) => void;
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [showOpenConfirm, setShowOpenConfirm] = useState(false);

  // Close the "Open Group" confirmation with the Escape key
  useEffect(() => {
    if (!showOpenConfirm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowOpenConfirm(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showOpenConfirm]);

  const handleConfirmOpen = () => {
    setShowOpenConfirm(false);
    window.location.href = `/study/my-groups/${group.groupId || group.id}`;
  };

  const memberCount = group.currentMemberCount ?? group.members ?? 0;
  const spotsLeft = group.capacity - memberCount;
  const isFull = spotsLeft <= 0;
  const spotsColor = isFull
    ? "text-red-700"
    : spotsLeft <= 5
      ? "text-orange-700"
      : "text-emerald-800";
  const pct = group.capacity
    ? Math.min(100, Math.round((memberCount / group.capacity) * 100))
    : 0;
  const attendance = group.minAttendancePercent ?? group.attendanceAvg ?? 75;
  const hasRealLeader = group.leader && !/^Leader \d+$/.test(group.leader);
  const subtitle = hasRealLeader
    ? `Led by ${group.leader}`
    : group.category || "Study group";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-shadow duration-300 hover:shadow-xl">{/* Gradient header */}
      <div className="flex items-center gap-3 bg-gradient-to-br from-[#4a3728] to-[#8b6f47] px-5 pb-4 pt-5">
        {group.imgUrl && !imgFailed ? (
          <img
            src={group.imgUrl}
            alt={group.leader}
            onError={() => setImgFailed(true)}
            className="h-12 w-12 flex-shrink-0 rounded-full border-2 border-white/80 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
            {(group.title || "G").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-bold text-white">{group.title}</h3>
          <p className="flex items-center gap-1 text-sm text-[#f3e6d8]">
            <Award className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{subtitle}</span>
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-4">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-[#faf5ef] p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#8b6f47]" />
              <span className="text-xs text-[#6b5648]">Attendance</span>
            </div>
            <p className="text-2xl font-bold text-[#3a281c]">{attendance}%</p>
          </div>
          <div className="rounded-xl bg-[#faf5ef] p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#8b6f47]" />
              <span className="text-xs text-[#6b5648]">Members</span>
            </div>
            <p className="text-2xl font-bold text-[#3a281c]">
              {memberCount}/{group.capacity}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-[#6b5648]">
              {memberCount}/{group.capacity} joined
            </span>
            <span className={`font-bold ${spotsColor}`}>
              {isFull ? "Full" : `${spotsLeft} spots left`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#eadfd3]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4a3728] to-[#c9a27a] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <button
          disabled={isFull && !group.isMember}
          onClick={() => {
            if (group.isMember) {
              // already member — ask for confirmation before opening the room
              setShowOpenConfirm(true);
              return;
            }
            onJoinClick(group);
          }}
          className={`mt-auto w-full rounded-xl py-3 text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed ${
            group.isMember
              ? "border-2 border-[#4a3728] bg-white text-[#4a3728] hover:bg-[#4a3728] hover:text-white"
              : isFull
                ? "bg-gray-200 text-gray-400"
                : "bg-[#4a3728] text-white hover:bg-[#3a281c] active:scale-[0.98]"
          }`}
        >
          {group.isMember ? "Open Group" : isFull ? "Full" : "Join Group"}
        </button>
      </div>

      {showOpenConfirm &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowOpenConfirm(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="open-group-confirm-title"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="bg-gradient-to-br from-[#4a3728] to-[#8b6f47] px-6 py-5">
                <h3 id="open-group-confirm-title" className="text-lg font-bold text-white">
                  Open study room?
                </h3>
                <p className="mt-1 line-clamp-1 text-sm text-white/80">{group.title}</p>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm leading-relaxed text-[#6b5648]">
                  You are about to enter the study room for this group. Do you want to continue?
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOpenConfirm(false)}
                    className="flex-1 rounded-xl border-2 border-[#e0d8cf] bg-white py-2.5 text-sm font-bold text-[#4a3728] transition-colors hover:bg-[#faf5ef]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    autoFocus
                    onClick={handleConfirmOpen}
                    className="flex-1 rounded-xl bg-[#4a3728] py-2.5 text-sm font-bold text-white transition-all hover:bg-[#3a281c] active:scale-[0.98]"
                  >
                    Open Group
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

/* ===================== MAIN ===================== */
interface TopRankedGroupsProps {
  /** Becomes true once the page's Top Ranked request has finished. */
  fetched?: boolean;
  /** Called once this section is fully ready (cards shown, or nothing to show). */
  onReady?: () => void;
}

export default function TopRankedGroups({ fetched = true, onReady }: TopRankedGroupsProps) {
  const apiGroups = useAppSelector(selectTopRankedGroups) ?? [];
  const isLoading = useAppSelector(selectTopRankedGroupsLoading);
  const [error, setError] = useState<string | null>(null);

  const { getJoinRequestForGroup, addJoinRequestToCache, getUserInfo } = useGroupData();

  // Store enriched groups in local state
  const [topThreeGroups, setTopThreeGroups] = useState<any[]>([]);
  // True once the groups from the API have been enriched with leader info.
  // Until then we keep showing the skeleton so this section holds its place
  // above "University Groups" instead of popping in late.
  const [isEnriched, setIsEnriched] = useState(false);
  const isEnriching = apiGroups.length > 0 && !isEnriched;

  const INITIAL_CARDS = 3;
  const [showAll, setShowAll] = useState(false);
  const dispatch = useAppDispatch();
  const joinLoading = useAppSelector(selectJoinLoading);
  const [joinModalGroup, setJoinModalGroup] = useState<any>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  const displayedGroups = showAll ? topThreeGroups : topThreeGroups.slice(0, INITIAL_CARDS);
  const hasMoreGroups = topThreeGroups.length > INITIAL_CARDS;

  const handleJoinClick = (group: any) => {
    if (group.isMember) {
      return;
    }
    if (group.visibility === 'private') {
      setJoinModalGroup(group);
    } else {
      handlePublicJoin(group.groupId || '');
    }
  };

  const handlePublicJoin = async (groupId: string) => {
    const result = await dispatch(joinGroupThunk({ groupId }));
    if (joinGroupThunk.fulfilled.match(result)) {
      setJoinSuccess('Successfully joined the group!');
      setTimeout(() => setJoinSuccess(null), 3000);
      setTopThreeGroups(prev =>
        prev.map(g => g.groupId === groupId ? { ...g, isMember: true } : g)
      );
    } else {
      setJoinSuccess(null);
      const errMsg = result.payload as string;
      setError(errMsg || 'Failed to join group');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handlePrivateJoin = async (joinCode: string) => {
    if (!joinModalGroup) return;
    const result = await dispatch(joinGroupThunk({
      groupId: joinModalGroup.groupId || '',
      joinCode,
    }));
    if (joinGroupThunk.fulfilled.match(result)) {
      setTopThreeGroups(prev =>
        prev.map(g => g.groupId === joinModalGroup.groupId ? { ...g, isMember: true } : g)
      );
      setJoinModalGroup(null);
      setJoinSuccess('Successfully joined the group!');
      setTimeout(() => setJoinSuccess(null), 3000);
    } else {
      throw new Error((result.payload as string) || 'Invalid join code');
    }
  };

  const handleRequestAccess = async (message: string) => {
    if (!joinModalGroup) return;
    const result = await dispatch(
      sendJoinRequestThunk({ groupId: joinModalGroup.groupId || '', message })
    );
    if (sendJoinRequestThunk.rejected.match(result)) {
      throw new Error((result.payload as string) || 'Failed to send request');
    }
  };

  // Tell the page when this section is ready so it can show the sections below
  useEffect(() => {
    if (!fetched) return;
    if (apiGroups.length === 0 || isEnriched) onReady?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetched, apiGroups.length, isEnriched]);

  useEffect(() => {
    if (apiGroups.length === 0) return;

    const enrichGroups = async () => {
      const enriched = await Promise.all(
        apiGroups.slice(0, 10).map(async (g: any, index: number) => {
          const leaderInfo = await getUserInfo(g.leaderId);

          const leaderName = leaderInfo.name !== 'Unknown User'
            ? leaderInfo.name
            : `Leader ${index + 1}`;

          const leaderAvatar = leaderInfo.avatar
            ?? g.avatar
            ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(leaderName)}&background=8b7355&color=fff&size=400`;

          return {
            ...g,
            id: index + 1,
            rank: index + 1,
            attendanceAvg: g.minAttendancePercent ?? 75,
            members: g.currentMemberCount,
            leader: leaderName,
            imgUrl: leaderAvatar,
          };
        })
      );
      setTopThreeGroups(enriched);
      setIsEnriched(true);
    };

    enrichGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiGroups]);

  if (!fetched || isLoading || isEnriching) {
    return <SkeletonLoader count={3} className="px-4" />
  }

  if (topThreeGroups.length === 0) return null;

  return (
    <section className="w-full">
      <SectionHeader
        icon={<Trophy size={22} />}
        title="Top Ranked Groups"
        subtitle="Join the most active and successful study communities"
      />

      <div className={GROUP_GRID}>
        {displayedGroups.map(group => (
          <div key={group.id} className="h-full">
            <TopRankedCard group={group} onJoinClick={handleJoinClick} />
          </div>
        ))}
      </div>

      {hasMoreGroups && (
        <ShowMoreButton expanded={showAll} onClick={() => setShowAll(prev => !prev)} />
      )}

      {joinSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-500 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold animate-pulse">
          ✓ {joinSuccess}
        </div>
      )}

      {error && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-500 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold">
          ✕ {error}
        </div>
      )}

      {joinModalGroup && (
        <JoinGroupModal
          group={joinModalGroup}
          onClose={() => setJoinModalGroup(null)}
          onJoin={handlePrivateJoin}
          onRequest={handleRequestAccess}
          isLoading={joinLoading}
          existingRequest={joinModalGroup ? getJoinRequestForGroup(joinModalGroup.groupId || '') : null}
        />
      )}
    </section>
  )
}