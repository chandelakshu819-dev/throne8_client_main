"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, Award, Trophy } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectJoinLoading, selectTopRankedGroups, selectTopRankedGroupsLoading } from "@/hooks/studyGroup/features/groups/groupsSlice";
import { useGroupData } from "@/features/study-group/hooks/useGroupData";
import SkeletonLoader from "@/app/loading";
import { joinGroupThunk, sendJoinRequestThunk } from "@/hooks/studyGroup/features/groups/group.thunks";
import JoinGroupModal from "@/features/study-group/modals/joinGroupModal";
import {
  CardShell,
  GROUP_BTN_PRIMARY,
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
  const memberCount = group.currentMemberCount ?? group.members ?? 0;
  const spotsLeft = group.capacity - memberCount;
  const pct = group.capacity
    ? Math.min(100, Math.round((memberCount / group.capacity) * 100))
    : 0;
  const attendance = group.minAttendancePercent ?? group.attendanceAvg ?? 75;
  const hasRealLeader = group.leader && !/^Leader \d+$/.test(group.leader);
  const subtitle = hasRealLeader
    ? `Led by ${group.leader}`
    : group.category || "Study group";

  return (
    <CardShell>
      {/* Header: avatar, title, rank */}
      <div className="flex items-start gap-3">
        {group.imgUrl && !imgFailed ? (
          <img
            src={group.imgUrl}
            alt={group.leader}
            onError={() => setImgFailed(true)}
            className="h-12 w-12 flex-shrink-0 rounded-full border-2 border-[#e0d8cf] object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#f6ede8] text-lg font-bold text-[#4a3728]">
            {(group.title || "G").charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-[#4a3728]">
            {group.title}
          </h3>
          <p className="flex items-center gap-1 text-xs text-[#6b5847]">
            <Award className="h-3 w-3 flex-shrink-0 text-[#8b7355]" />
            <span className="truncate">{subtitle}</span>
          </p>
        </div>

        <span
          className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm ${
            group.rank <= 3
              ? "bg-gradient-to-br from-amber-400 to-orange-500"
              : "bg-[#8b7355]"
          }`}
        >
          #{group.rank}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#faf6f1] p-2">
          <div className="mb-1 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#8b6f47]" />
            <span className="text-xs text-gray-600">Attendance</span>
          </div>
          <p className="text-lg font-bold text-[#4a3728]">{attendance}%</p>
        </div>
        <div className="rounded-lg bg-[#faf6f1] p-2">
          <div className="mb-1 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-[#8b6f47]" />
            <span className="text-xs text-gray-600">Members</span>
          </div>
          <p className="text-lg font-bold text-[#4a3728]">
            {memberCount}/{group.capacity}
          </p>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="mt-3 mb-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">
            {memberCount}/{group.capacity} joined
          </span>
          <span
            className={`text-xs font-medium ${
              spotsLeft > 0 ? "text-green-700" : "text-red-600"
            }`}
          >
            {spotsLeft > 0 ? `${spotsLeft} left` : "Full"}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8b6f47] to-[#4a3728] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-auto pt-1">
        <button
          onClick={() => {
            if (group.isMember) {
              window.location.href = `/study/my-groups/${group.groupId || group.id}`;
              return;
            }
            onJoinClick(group);
          }}
          className={GROUP_BTN_PRIMARY}
        >
          {group.isMember ? "Open Group" : "Join Group"}
        </button>
      </div>
    </CardShell>
  );
};

/* ===================== MAIN ===================== */
export default function TopRankedGroups() {
  const apiGroups = useAppSelector(selectTopRankedGroups) ?? [];
  const isLoading = useAppSelector(selectTopRankedGroupsLoading);
  const [error, setError] = useState<string | null>(null);

  const { getJoinRequestForGroup, addJoinRequestToCache, getUserInfo } = useGroupData();

  // Store enriched groups in local state
  const [topThreeGroups, setTopThreeGroups] = useState<any[]>([]);

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
    };

    enrichGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiGroups]);

  if (isLoading) {
    return <SkeletonLoader count={3} className="px-4" />
  }

  if (topThreeGroups.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl">
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
