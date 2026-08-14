"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { TrendingUp, Users, Award, ChevronUp, ChevronDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectJoinLoading, selectTopRankedGroups, selectTopRankedGroupsLoading } from "@/hooks/studyGroup/features/groups/groupsSlice";
import { useGroupData } from "@/features/study-group/hooks/useGroupData";
import SkeletonLoader from "@/app/loading";
import { joinGroupThunk, sendJoinRequestThunk } from "@/hooks/studyGroup/features/groups/group.thunks";
import JoinGroupModal from "@/features/study-group/modals/joinGroupModal";


/* ===================== CARD ===================== */
const GroupCard = ({
  group,
  onJoinClick,
}: {
  group: any;
  onJoinClick: (group: any) => void;
}) => {
  const spotsLeft = group.capacity - (group.currentMemberCount ?? group.members ?? 0);
  const { getJoinRequestForGroup, addJoinRequestToCache } = useGroupData();

  return (
    <div className="relative backdrop-blur-xl bg-white/70 shadow-xl rounded-2xl p-5 hover:shadow-2xl transition-all duration-300 border-2 border-white/60 h-full">
      <div className="absolute -left-4 -top-4 w-20 h-24 rounded-xl overflow-hidden shadow-xl border-4 border-white">
        <Image
          src={group.imgUrl}
          alt={group.leader}
          width={80}
          height={96}
          className="object-cover w-full h-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://ui-avatars.com/api/?name=${encodeURIComponent(group.leader)}&background=8b7355&color=fff&size=400`;
          }}
        />
      </div>

      <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg flex items-center justify-center border-2 border-white">
        <span className="text-white font-bold text-sm">#{group.rank}</span>
      </div>

      <div className="ml-16 text-right pt-2">
        <h2 className="text-base text-[#4a3728] font-bold mb-1 leading-tight">{group.title}</h2>
        <p className="text-xs text-[#8b7355] mb-3 flex items-center justify-end gap-1">
          <Award className="w-3 h-3" />
          <span className="italic">{group.leader}</span>
        </p>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between backdrop-blur-sm bg-[#fff8f0]/80 px-3 py-2 rounded-lg border border-white/40">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#8b7355]" />
              <span className="text-xs text-[#8b7355] font-medium">Attendance</span>
            </div>
            <span className="text-sm font-bold text-[#4a3728]">
              {group.minAttendancePercent ?? group.attendanceAvg ?? 75}%
            </span>
          </div>

          <div className="flex items-center justify-between backdrop-blur-sm bg-[#fff8f0]/80 px-3 py-2 rounded-lg border border-white/40">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#8b7355]" />
              <span className="text-xs text-[#8b7355] font-medium">Members</span>
            </div>
            <span className="text-sm font-bold text-[#4a3728]">
              {group.currentMemberCount}/{group.capacity}
            </span>
          </div>
        </div>

        <div className="mb-3">
          {spotsLeft > 0 ? (
            <span className="inline-block bg-green-500/10 text-green-700 font-semibold text-xs px-3 py-1.5 rounded-full border border-green-500/20">
              {spotsLeft} spots left
            </span>
          ) : (
            <span className="inline-block bg-red-500/10 text-red-600 font-semibold text-xs px-3 py-1.5 rounded-full border border-red-500/20">
              Full
            </span>
          )}
        </div>

        <button
          onClick={() => {
            if (group.isMember) {
              console.log("Navigating to group room for groupId:", group.groupId || group.id);
              window.location.href = `/study/my-groups/${group.groupId || group.id}`;
              return;
            }
            onJoinClick(group);
          }}
          className="w-full bg-gradient-to-r from-[#8b7355] to-[#6b5847] hover:from-[#6b5847] hover:to-[#4a3728] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
          {group.isMember ? 'Open Group' : 'Join Group'}
        </button>
      </div>
    </div>
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
    <div className="py-8 sm:py-10 lg:py-12">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4a3728]">
            Top Ranked Groups
          </h1>
          <p className="text-[#6b5847] text-sm sm:text-base">
            Join the most active and successful study communities
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4">
          {displayedGroups.map(group => (
            <div key={group.id} className="max-w-[320px] mx-auto w-full">
              <GroupCard group={group} onJoinClick={handleJoinClick} />
            </div>
          ))}
        </div>

        {hasMoreGroups && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowAll(prev => !prev)}
              className="px-6 py-3 bg-gradient-to-r from-[#8b7355] to-[#6b5847] hover:from-[#6b5847] hover:to-[#4a3728] text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 border border-white/20"
            >
              {showAll ? (
                <>Show Less <ChevronUp size={18} /></>
              ) : (
                <>Show More <ChevronDown size={18} /></>
              )}
            </button>
          </div>
        )}
      </div>

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
    </div>
  )
}