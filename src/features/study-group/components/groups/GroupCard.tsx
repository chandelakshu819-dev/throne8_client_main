//studygroup/study/groups/components/groupcard.tsx

import React, { useState } from 'react';
import { Clock, Eye, EyeOff, Camera, CameraOff, TrendingUp, Award } from 'lucide-react';
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
import { generateMemberAvatars } from '@/features/studyGroup/helper';


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
  const { getJoinRequestForGroup, addJoinRequestToCache } = useGroupData();
  const existingRequest = getJoinRequestForGroup(group.groupId);
  const isApiGroup = !!group.groupId;
  const isMember = isApiGroup ? (group.isMember ?? false) : false;
  const memberCount = isApiGroup ? group.currentMemberCount : group.members;
  const spotsLeft = group.capacity - memberCount;
  const isFilling = memberCount / group.capacity > 0.7;
  const isFull = spotsLeft <= 0;

  const handleJoinClick = async () => {
    if (isMember) {
      console.log("Navigating to group room for groupId:", group.groupId || group.id);
      router.push(`/study/my-groups/${group.groupId || group.id}`); // Navigate to group room if already a member
      return;
    }; // already member — button says "Open Group"
    if (!isApiGroup) return;
    if (group.visibility === 'private') {
      setJoinModalGroup(group);
    } else {
      await handlePublicJoin(group.groupId);
    }
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

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 hover:border-[#d4a574]">
      <div className="h-1 bg-gradient-to-r from-[#4a3728] via-[#8b6f47] to-[#d4a574]" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-[#4a3728] line-clamp-1">{group.title}</h3>
              {group.rank <= 3 && (
                <Award className="w-4 h-4 text-[#d4a574] fill-[#d4a574] flex-shrink-0" />
              )}
            </div>
            <span className="inline-block bg-[#4a3728] text-white px-2 py-0.5 rounded-full text-xs font-medium">
              {group.category}
            </span>
          </div>

          <div className="flex gap-1.5 ml-2">
            <div className={`p-1.5 rounded ${group.visibility === 'public' ? 'bg-[#8b6f47]/10' : 'bg-gray-100'}`}>
              {group.visibility === 'public' ? (
                <Eye className="w-3.5 h-3.5 text-[#4a3728]" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-gray-600" />
              )}
            </div>

            <div className={`p-1.5 rounded ${(group.cameraRequired ?? group.cameraOn) ? 'bg-[#8b6f47]/10' : 'bg-gray-100'}`}>
              {(group.cameraRequired ?? group.cameraOn) ? (
                <Camera className="w-3.5 h-3.5 text-[#4a3728]" />
              ) : (
                <CameraOff className="w-3.5 h-3.5 text-gray-600" />
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-xs leading-relaxed mb-3 line-clamp-2">{group.description}</p>

        {/* Avatars */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex -space-x-2">
            {generateMemberAvatars(isApiGroup ? memberCount : group.members).map((avatar, idx) => (
              <img key={idx} src={avatar} alt={`Member ${idx + 1}`} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
            ))}
          </div>
          <div className="text-xs">
            <p className="text-[#4a3728] font-semibold">{memberCount} members</p>
            {!isApiGroup && (
              <p className="text-gray-500">by {group.leader}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-[#8b6f47]" />
              <span className="text-xs text-gray-600">Goal</span>
            </div>
            <p className="text-lg font-bold text-[#4a3728]">{group.goalHours}h</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#8b6f47]" />
              <span className="text-xs text-gray-600">Attendance</span>
            </div>
            {group.attendanceRequired ? (
              <p className="text-lg font-bold text-[#4a3728]">
                {group.minAttendancePercent ?? group.attendanceAvg ?? 0}%
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Not required</p>
            )}
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600 font-medium">{memberCount}/{group.capacity} joined</span>
            <span className="text-xs text-gray-500">{spotsLeft} left</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isFilling
                ? 'bg-gradient-to-r from-[#d4a574] to-[#8b6f47]'
                : 'bg-gradient-to-r from-[#8b6f47] to-[#4a3728]'
                }`}
              style={{ width: `${(memberCount / group.capacity) * 100}%` }}
            />
          </div>
        </div>
        <button
          onClick={handleJoinClick}
          disabled={(isFull && !isMember) || isThisGroupJoining}
          className={`w-full font-semibold py-2.5 rounded-lg text-sm transition-all duration-300 shadow-sm hover:shadow-md ${isFull && !isMember
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-[#4a3728] to-[#8b6f47] hover:from-[#8b6f47] hover:to-[#4a3728] text-white'
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
    </div >
  );
};

export default GroupCard;