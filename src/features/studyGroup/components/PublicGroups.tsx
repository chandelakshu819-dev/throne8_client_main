"use client";

import { Globe, Users } from "lucide-react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import {
  toggleSectionExpanded,
  selectExpandedSections,
  selectPublicGroupsFromApi,
  selectPublicGroupsFromApiLoading,
  selectJoinLoading,
  selectJoiningGroupId,
} from '@/hooks/studyGroup/features/groups/groupsSlice';
import SkeletonLoader from "@/app/loading";
import { GroupVisibility } from "@/lib/api/studyGroup.service";
import { useState } from "react";
import { joinGroupThunk, sendJoinRequestThunk } from "@/hooks/studyGroup/features/groups/group.thunks";
import { useGroupData } from "@/features/study-group/hooks/useGroupData";

// ─── Card ─────────────────────────────────────────────────────────────────────

interface PublicGroupCardProps {
  title: string;
  isMember: boolean;
  members: number;
  groupId: string;
  visibility: string;
  onJoin: (groupId: string, visibility: string) => void;
  isJoinLoading: boolean;
}

const PublicGroupCard: React.FC<PublicGroupCardProps> = ({ title, isMember, members, groupId, visibility, onJoin, isJoinLoading }) => (
  <div className="backdrop-blur-xl bg-white/70 rounded-2xl border-2 border-white/60 p-5 hover:border-[#8b7355]/50 hover:shadow-2xl transition-all duration-300 w-full">
    <div className="flex items-start gap-3 mb-3">
      <div className="p-2.5 rounded-xl bg-[#8b7355]/10 backdrop-blur-sm border border-[#8b7355]/20">
        <Globe className="w-5 h-5 text-[#8b7355]" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base sm:text-lg font-bold text-[#4a3728] line-clamp-2 leading-tight">
          {title}
        </h3>
      </div>
    </div>

    <div className="flex items-center gap-2 mb-3 text-sm text-[#6b5847] backdrop-blur-sm bg-[#fff8f0]/50 px-3 py-2 rounded-lg border border-white/40">
      <Users size={16} className="text-[#8b7355] flex-shrink-0" />
      <span className="font-semibold">{members}+ active members</span>
    </div>

    <p className="text-xs sm:text-sm text-[#6b5847] mb-4">Public group • Join instantly</p>

    {/* <button className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white hover:from-[#6b5847] hover:to-[#4a3728] transition-all duration-300 shadow-lg hover:shadow-xl border border-white/20">
      {isMember ? 'open group' : 'Join Now'}
    </button> */}

    <button
      onClick={() => {
        if(isMember) {
          console.log("Navigating to group room from public group for groupId:", groupId);
          window.location.href = `/study/my-groups/${groupId}`; // Navigate to group room if already a member
          return;
        }
        !isMember && onJoin(groupId, visibility)
      }}
      disabled={isJoinLoading}
      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl border border-white/20 bg-gradient-to-r from-[#8b7355] to-[#6b5847] hover:from-[#6b5847] hover:to-[#4a3728] text-white'
        `}
    >
      {isMember ? 'Open Group' : isJoinLoading ? 'Joining...' : 'Join Now'}
    </button>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

const INITIAL_COUNT = 3;

export default function PublicStudyGroups() {
  const dispatch = useAppDispatch();
  const { getJoinRequestForGroup, addJoinRequestToCache } = useGroupData();
  const publicGroups = useAppSelector(selectPublicGroupsFromApi) ?? [];
  const isLoading = useAppSelector(selectPublicGroupsFromApiLoading);
  const expandedSections = useAppSelector(selectExpandedSections);
  const showAll = expandedSections?.public ?? false;

  const displayedGroups = showAll ? publicGroups : publicGroups.slice(0, INITIAL_COUNT);
  const hasMore = publicGroups.length > INITIAL_COUNT;

  // ADD after existing selectors
  const joinLoading = useAppSelector(selectJoinLoading);
  const joiningGroupId = useAppSelector(selectJoiningGroupId);
  const [joinModalGroup, setJoinModalGroup] = useState<any | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoinClick = (groupId: string, visibility: string) => {
    const group = publicGroups.find((g: any) => g.groupId === groupId);
    if (!group) return;
    if (visibility === 'private') {
      setJoinModalGroup(group);
    } else {
      handlePublicJoin(groupId);
    }
  };

  const handlePublicJoin = async (groupId: string) => {
    const result = await dispatch(joinGroupThunk({ groupId }));
    if (joinGroupThunk.fulfilled.match(result)) {
      setJoinSuccess('Successfully joined the group!');
      setTimeout(() => setJoinSuccess(null), 3000);
    } else {
      setJoinError((result.payload as string) || 'Failed to join group');
      setTimeout(() => setJoinError(null), 3000);
    }
  };

  const handlePrivateJoin = async (joinCode: string) => {
    if (!joinModalGroup) return;
    const result = await dispatch(joinGroupThunk({
      groupId: joinModalGroup.groupId,
      joinCode,
    }));
    if (joinGroupThunk.fulfilled.match(result)) {
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
      sendJoinRequestThunk({ groupId: joinModalGroup.groupId, message })
    );
    if (sendJoinRequestThunk.rejected.match(result)) {
      throw new Error((result.payload as string) || 'Failed to send request');
    }
  };

  // ADD loading check before return
  if (isLoading) return <SkeletonLoader count={3} className="px-4" />;

  return (
    <div className="py-8 sm:py-10 lg:py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4a3728]">
            Public Groups
          </h2>
          <p className="text-sm sm:text-base text-[#6b5847]">
            Open groups with instant access • No approval required
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* {displayedGroups.map((group) => (
            <PublicGroupCard key={group.id} title={group.title} members={group.members} />
          // ))} */}
          {displayedGroups.map((group: any) => (
            <PublicGroupCard
              key={group.groupId}
              title={group.title}
              isMember={group.isMember}
              members={group.currentMemberCount}
              groupId={group.groupId}
              visibility={group.visibility}
              onJoin={handleJoinClick}
              // isJoinLoading={joinLoading}
              isJoinLoading={joiningGroupId === group.groupId}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={() => dispatch(toggleSectionExpanded(GroupVisibility.PUBLIC))}
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
    </div>
  );
}