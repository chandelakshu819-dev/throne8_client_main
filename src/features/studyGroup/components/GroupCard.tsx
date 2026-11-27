//studygroup/study/groups/components/groupcard.tsx

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Eye, EyeOff, Camera, CameraOff, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import {
  selectJoiningGroupId,
  selectJoinLoading,
  selectSendRequestLoading,
} from '@/hooks/studyGroup/features/groups/groupsSlice';
import { joinGroupThunk, sendJoinRequestThunk } from '@/hooks/studyGroup/features/groups/group.thunks';
import { useGroupData } from '@/features/study-group/hooks/useGroupData';
import JoinGroupModal from '@/features/study-group/modals/joinGroupModal';

// ── NEW ──────────────────────────────────────────────────────────────────────
// 1) copy GroupMembers.tsx and useMemberProfiles.ts into this same folder
// 2) fix the StudyGroupService import path (use the same one other files use)
import { MembersButton } from './GroupMembers';
import { useMemberProfiles, resolveProfile } from './useMemberProfiles';
import StudyGroupService from '@/lib/api/studyGroup.service'; // <-- adjust path
// (getMemberAvatarInitials import removed: no longer used)


// ─── Component ────────────────────────────────────────────────────────────────

interface GroupCardProps {
  // group: Group;
  group: any;
}

const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const joinLoading = useAppSelector(selectJoinLoading);
  const joiningGroupId = useAppSelector(selectJoiningGroupId);
  const sendRequestLoading = useAppSelector(selectSendRequestLoading);

  const isThisGroupJoining = joiningGroupId === group.groupId;
  const [joinModalGroup, setJoinModalGroup] = useState<any | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showOpenConfirm, setShowOpenConfirm] = useState(false);

  // Close the "Open Group" confirmation with the Escape key
  useEffect(() => {
    if (!showOpenConfirm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowOpenConfirm(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showOpenConfirm]);

  // CHANGED: also take getUserInfo (same lookup the Top Ranked section uses)
  const { getJoinRequestForGroup, addJoinRequestToCache, getUserInfo } = useGroupData();

  // NEW: add name + profile photo to the preview members (cached, no backend change)
  const previewMembers = useMemberProfiles(group.memberPreview ?? [], getUserInfo);

  const existingRequest = getJoinRequestForGroup(group.groupId);
  const isApiGroup = !!group.groupId;
  const isMember = isApiGroup ? (group.isMember ?? false) : false;
  const memberCount = isApiGroup ? group.currentMemberCount : group.members;
  const spotsLeft = group.capacity - memberCount;
  const isFilling = memberCount / group.capacity > 0.7;
  const isFull = spotsLeft <= 0;

  const handleJoinClick = async () => {
    if (isMember) {
      // already member — button says "Open Group": ask for confirmation first
      setShowOpenConfirm(true);
      return;
    }
    if (!isApiGroup) return;
    if (group.visibility === 'private') {
      setJoinModalGroup(group);
    } else {
      await handlePublicJoin(group.groupId);
    }
  };

  const handleConfirmOpen = () => {
    setShowOpenConfirm(false);
    console.log("Navigating to group room for groupId:", group.groupId || group.id);
    router.push(`/study/my-groups/${group.groupId || group.id}`); // Navigate to group room
  };

  const handlePublicJoin = async (groupId: string) => {
    const result = await dispatch(joinGroupThunk({ groupId }));
    if (joinGroupThunk.fulfilled.match(result)) {
      setJoinSuccess('Successfully joined!');
      setTimeout(() => setJoinSuccess(null), 3000);
    } else {
      setJoinError((result.payload as string) || 'Failed to join group');
      setTimeout(() => setJoinError(null), 3000);
    }
  };

  const handlePrivateJoin = async (joinCode: string) => {
    if (!joinModalGroup) return;
    const result = await dispatch(joinGroupThunk({ groupId: joinModalGroup.groupId, joinCode }));
    if (joinGroupThunk.fulfilled.match(result)) {
      setJoinModalGroup(null);
      setJoinSuccess('Successfully joined!');
      setTimeout(() => setJoinSuccess(null), 3000);
    } else {
      throw new Error((result.payload as string) || 'Invalid join code');
    }
  };

  const handleRequestAccess = async (message: string) => {
    const result = await dispatch(
      sendJoinRequestThunk({ groupId: joinModalGroup!.groupId, message })
    );
    if (sendJoinRequestThunk.fulfilled.match(result)) {
      // Cache mein add karo
      addJoinRequestToCache({
        _id: '',
        joinRequestId: result.payload.joinRequestId,
        groupId: joinModalGroup!.groupId,
        userId: '',
        message,
        status: 'pending',
        respondedAt: null,
        respondedBy: null,
        rejectionReason: null,
        expiresAt: result.payload.expiresAt,
        createdAt: result.payload.createdAt,
        updatedAt: result.payload.createdAt,
      });
    } else {
      throw new Error((result.payload as string) || 'Failed to send request');
    }
  };

  const spotsColor = isFull ? 'text-red-700' : spotsLeft <= 5 ? 'text-orange-700' : 'text-emerald-800';
  const cameraOn = group.cameraRequired ?? group.cameraOn;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-shadow duration-300 hover:shadow-xl">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-[#4a3728] to-[#8b6f47] px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-xl font-bold text-white">{group.title}</h3>
          <div className="flex shrink-0 gap-1.5">
            <div
              title={group.visibility === 'public' ? 'Public group' : 'Private group'}
              className="rounded-lg bg-white/15 p-1.5"
            >
              {group.visibility === 'public' ? (
                <Eye className="h-3.5 w-3.5 text-white" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-white" />
              )}
            </div>
            <div
              title={cameraOn ? 'Camera required' : 'Camera optional'}
              className="rounded-lg bg-white/15 p-1.5"
            >
              {cameraOn ? (
                <Camera className="h-3.5 w-3.5 text-white" />
              ) : (
                <CameraOff className="h-3.5 w-3.5 text-white" />
              )}
            </div>
          </div>
        </div>
        <span className="mt-2 inline-block rounded-full bg-[#f3e6d8] px-3 py-1 text-xs font-semibold text-[#4a3728]">
          {group.category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-4">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-[#6b5648]">{group.description}</p>

        {/* Avatars + members popup (CHANGED) */}
        <div className="flex flex-wrap items-center gap-x-3">
          <MembersButton
            groupName={group.title}
            members={previewMembers}
            memberCount={memberCount ?? 0}
            canViewAll={isMember}
            cacheKey={group.groupId}
            fetchMembers={() => StudyGroupService.getGroupMembers(group.groupId)}
            resolveProfile={(id) => resolveProfile(id, getUserInfo)}
          />
          {!isApiGroup && <p className="text-xs text-gray-500">by {group.leader}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-[#faf5ef] p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#8b6f47]" />
              <span className="text-xs text-[#6b5648]">Goal</span>
            </div>
            <p className="text-2xl font-bold text-[#3a281c]">{group.goalHours}h</p>
          </div>
          <div className="rounded-xl bg-[#faf5ef] p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#8b6f47]" />
              <span className="text-xs text-[#6b5648]">Attendance</span>
            </div>
            {group.attendanceRequired ? (
              <p className="text-2xl font-bold text-[#3a281c]">
                {group.minAttendancePercent ?? group.attendanceAvg ?? 0}%
              </p>
            ) : (
              <p className="pt-1.5 text-sm text-[#8a7667]">Not required</p>
            )}
          </div>
        </div>

        {/* Capacity Bar */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-[#6b5648]">{memberCount}/{group.capacity} joined</span>
            <span className={`font-bold ${spotsColor}`}>{isFull ? 'Full' : `${spotsLeft} spots left`}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#eadfd3]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isFilling
                ? 'bg-gradient-to-r from-[#d4a574] to-[#8b6f47]'
                : 'bg-gradient-to-r from-[#4a3728] to-[#c9a27a]'
                }`}
              style={{ width: `${Math.min((memberCount / group.capacity) * 100, 100)}%` }}
            />
          </div>
        </div>

        <button
          onClick={handleJoinClick}
          disabled={(isFull && !isMember) || isThisGroupJoining}
          className={`mt-auto w-full rounded-xl py-3 text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed ${isFull && !isMember
            ? 'bg-gray-200 text-gray-400'
            : isMember
              ? 'border-2 border-[#4a3728] bg-white text-[#4a3728] hover:bg-[#4a3728] hover:text-white'
              : 'bg-[#4a3728] text-white hover:bg-[#3a281c] active:scale-[0.98] disabled:opacity-60'
            }`}
        >
          {isMember ? 'Open Group' : isFull ? 'Full' : isThisGroupJoining ? 'Joining...' : 'Join Group'}
        </button>
      </div>
      {
        joinSuccess && (
          <div className="fixed bottom-6 right-6 z-50 bg-green-500 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold">
            ✓ {joinSuccess}
          </div>
        )
      }
      {
        joinError && (
          <div className="fixed bottom-6 right-6 z-50 bg-red-500 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold">
            ✕ {joinError}
          </div>
        )
      }
      {
        joinModalGroup && (
          <JoinGroupModal
            group={joinModalGroup}
            onClose={() => setJoinModalGroup(null)}
            onJoin={handlePrivateJoin}
            onRequest={handleRequestAccess}
            isLoading={joinLoading || sendRequestLoading}
            existingRequest={existingRequest}  // ADD
          />
        )}
      {
        showOpenConfirm &&
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
        )
      }
    </div >
  );
};

export default React.memo(GroupCard);