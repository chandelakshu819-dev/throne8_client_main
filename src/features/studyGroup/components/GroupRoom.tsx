//src/app/(studyGroup)/study/my-groups/components/GroupRoom.tsx
'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Camera, Mic, MicOff, Video, VideoOff, Settings, LogOut, MessageCircle, UserPlus, Crown, Clock, Target, Award, TrendingUp, MoreVertical, X, Send, ChevronLeft, Info, Play, Pause, Menu, Bell, Zap, Megaphone
} from "lucide-react";
import { fetchGroupByIdThunk, fetchGroupMembersThunk, createLiveRoomThunk, fetchGroupActiveLiveRoomThunk, joinLiveRoomThunk, leaveLiveRoomThunk, endLiveRoomThunk, toggleCameraThunk, toggleMicThunk, toggleScreenShareThunk, fetchAllUsersThunk, attendanceAutoMarkThunk, fetchAttendanceStatusThunk, attendanceCheckInThunk } from "@/hooks/studyGroup/features/groups/group.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearSelectedGroup, selectGroupMembers, selectGroupMembersLoading, selectSelectedGroup, selectSelectedGroupLoading, selectActiveLiveRoom, selectActiveLiveRoomLoading, selectLiveRoomActionLoading, selectLocalCameraOn, selectLocalMicOn, selectLocalScreenShareOn, setLocalCamera, setLocalMic, setLocalScreenShare, clearActiveLiveRoom, selectAttendanceStatus, selectAttendanceCheckInLoading } from "@/hooks/studyGroup/features/groups/groupsSlice";
import { useAuth } from "@/features/auth/hooks/useAuth";
// import { useGroupData } from "@/hooks/studyGroup/useGroupData";
import { useGroupData } from "@/features/study-group/hooks/useGroupData";
import StudyGroupService from "@/lib/api/studyGroup.service";
import { useChatSocket } from "@/core/realtime/useChatSocket";
import { startTimerThunk, pauseTimerThunk, resumeTimerThunk, stopTimerThunk } from "@/hooks/studyGroup/features/timer/timer.thunks";
import { selectActiveSession, selectTimerApiLoading, selectTimerStats } from "@/hooks/studyGroup/features/timer/timerSlice";
import { getTimerStatsThunk, getActiveTimerThunk } from "@/hooks/studyGroup/features/timer/timer.thunks";
import { fetchMessagesThunk, sendMessageThunk } from "@/hooks/studyGroup/features/chats/chat.thunks";
import { selectMessagesByGroup, selectOnlineMembers, selectSendLoading } from "@/hooks/studyGroup/features/chats/chatSlice";
import { createLiveRoomSchema, type CreateLiveRoomInput } from "@/features/study-group/validators/liveroom.validation";
import { getSocket } from "@/core/realtime/socket.client";
import { useLiveRoom } from "@/core/webrtc/useLiveRoom";
import LiveRoomView from "./LiveRoomView";
 



interface GroupRoomProps {
  groupId: string;
}

const GroupRoom: React.FC<GroupRoomProps> = ({ groupId }) => {
  const router = useRouter();
  const pendingJoinRef = useRef(false);

  const [showAttendancePrompt, setShowAttendancePrompt] = useState(false);
  const attendanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const attendanceStatus = useAppSelector(selectAttendanceStatus);
  const attendanceCheckInLoading = useAppSelector(selectAttendanceCheckInLoading);
  const { fetchGroupMembers, groupMembers: enrichedMembers, isLoadingGroupMembers, getUserInfoSync } = useGroupData();
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showMembers, setShowMembers] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [studyTime, setStudyTime] = useState<number>(0);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState<boolean>(false);
  const [showChallengeModal, setShowChallengeModal] = useState<boolean>(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const groupData = useAppSelector(selectSelectedGroup);
  const isLoading = useAppSelector(selectSelectedGroupLoading);
  const rawMembers = useAppSelector(selectGroupMembers);
  const { user } = useAuth();
  const currentUserId = user?.userId ?? '';
  const activeSession = useAppSelector(selectActiveSession);
  const timerApiLoading = useAppSelector(selectTimerApiLoading);
  const activeSessionLoading = useAppSelector((state: any) => state.timer.activeSessionLoading);
  const timerStats = useAppSelector(selectTimerStats);
  const roomMessages = useAppSelector((state: any) => state.chat.messages?.[groupId] ?? []);
  const sendLoading = useAppSelector((state: any) => state.chat.sendLoading?.[groupId] ?? false);
  const activeLiveRoom = useAppSelector(selectActiveLiveRoom);
  const activeLiveRoomLoading = useAppSelector(selectActiveLiveRoomLoading);
  const liveRoomActionLoading = useAppSelector(selectLiveRoomActionLoading);
  const isCameraOn = useAppSelector(selectLocalCameraOn);
  const isMicOn = useAppSelector(selectLocalMicOn);
  const isScreenSharing = useAppSelector(selectLocalScreenShareOn);
  const [showLiveRoomModal, setShowLiveRoomModal] = useState(false);
  const [liveRoomTitle, setLiveRoomTitle] = useState('');
  const [liveRoomError, setLiveRoomError] = useState('');
  const [showLiveRoomView, setShowLiveRoomView] = useState(false);
  const isUserInLiveRoom =
    showLiveRoomView ||
    (activeLiveRoom?.participants?.some(
      (p: any) => (p.userId ?? p.user) === currentUserId
    ) ?? false);
  const onlineMembers = useAppSelector((state: any) => state.chat.onlineMembers?.[groupId] ?? []);
  const memberSessionTimes = useAppSelector(
    (state: any) => state.chat.memberSessionTimes?.[groupId] ?? {}
  );
  const members = enrichedMembers.length > 0
    ? enrichedMembers.map((m: any, idx: number) => ({
      id: idx + 1,
      name: m.name ?? m.userId?.slice(0, 8) ?? 'Member',
      avatar: m.avatar ?? null,
      isOnline: onlineMembers.includes(m.userId),
      isSpeaking: false,
      studyTime: 0,
      rank: idx + 1,
      videoEnabled: false,
      audioEnabled: false,
      userId: m.userId,
      role: m.role,
    })) : [];

  const liveRoomId = activeLiveRoom?.roomId ?? '';

 // REPLACE WITH:
  const {
    localStream,
    peers: webrtcPeers,
    isCameraOn: webrtcCameraOn,
    isMicOn: webrtcMicOn,
    isScreenSharing: webrtcScreenSharing,
    activeSpeakers,
    roomMode,
    error: webrtcError,
    joinRoom: joinWebRTCRoom,
    leaveRoom: leaveWebRTCRoom,
    toggleCamera: toggleWebRTCCamera,
    toggleMic: toggleWebRTCMic,
    toggleScreenShare: toggleWebRTCScreenShare,
    startLocalStream,  // ← ADD
  } = useLiveRoom({
    roomId: liveRoomId,
    userId: currentUserId,
    userName: user?.name ?? user?.email ?? 'User',
    onPeerJoined: (peer) => {
    },
    onPeerLeft: (socketId) => {
    },
    onQualityChange: (socketId, quality) => {
      if (quality === 'poor') {
        console.warn('[LiveRoom] Poor connection for socket:', socketId);
      }
    },
  });

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!message.trim()) return;
    const textToSend = message;
    setMessage('');
    try {
      await dispatch(sendMessageThunk({
        groupId,
        data: { content: textToSend, messageType: 'text' }
      })).unwrap();
    } catch (err) {
      setMessage(textToSend);
    }
  };

  const handleLeaveRoom = async (): Promise<void> => {
    if (window.confirm('Are you sure you want to leave this study session?')) {
      if (isSessionActive && activeSession?.sessionId) {
        try {
          await dispatch(stopTimerThunk(undefined)).unwrap();
          const hoursStudied = studyTime / 3600;
          if (hoursStudied > 0.1) {  // only mark if studied > 6 mins
            await dispatch(attendanceAutoMarkThunk({
              reason: 'study_session',
              studyHours: hoursStudied
            })).unwrap().catch(() => { });
          }
        } catch (err) { /* silent */ }
      }
      router.push('/study/my-groups');
    }
  };

  const handleStartLiveRoom = async (): Promise<void> => {
    const parsed = createLiveRoomSchema.safeParse({
      title: liveRoomTitle || `${groupData?.title ?? 'Study'} - Live Session`,
      maxParticipants: 50,
    });
    if (!parsed.success) {
      setLiveRoomError(parsed.error.errors[0].message);
      return;
    }
    try {
      // 1. Room create karo
      const createdRoom = await dispatch(createLiveRoomThunk({
        groupId,
        ...parsed.data,
      })).unwrap();

      const roomId = createdRoom?.roomId;
      if (!roomId) {
        setLiveRoomError('Failed to get room ID');
        return;
      }

      setShowLiveRoomModal(false);
      setLiveRoomTitle('');
      setLiveRoomError('');

      // 2. HTTP join
      await dispatch(joinLiveRoomThunk({
        roomId,
        options: { cameraOn: true, micOn: true },
      })).unwrap();

      // 3. Media
      const stream = await startLocalStream(true, true);
      if (!stream) return;

      // 4. Socket join — direct, stale hook bypass
      const socket = getSocket();
      if (!socket?.connected) {
        alert('Socket not connected');
        return;
      }
      socket.emit('join-live-room', {
        roomId,
        userId: currentUserId,
        userName: user?.name ?? user?.email ?? 'User',
      });

      setShowLiveRoomView(true);
    } catch (err: any) {
      setLiveRoomError(typeof err === 'string' ? err : 'Failed to start live room');
    }
  };

  const handleJoinLiveRoom = async (): Promise<void> => {
    if (!activeLiveRoom?.roomId) return;
    const roomId = activeLiveRoom.roomId;

    try {
      // 1. HTTP join
      await dispatch(joinLiveRoomThunk({
        roomId,
        options: { cameraOn: true, micOn: true },
      })).unwrap();

      // 2. Media get karo
      const stream = await startLocalStream(true, true);
      if (!stream) return;

      // 3. Socket se directly join karo — stale hook bypass
      const socket = getSocket();
      if (!socket?.connected) {
        alert('Socket not connected');
        return;
      }
      socket.emit('join-live-room', {
        roomId,
        userId: currentUserId,
        userName: user?.name ?? user?.email ?? 'User',
      });

      setShowLiveRoomView(true);
    } catch (err: any) {
      alert(err || 'Failed to join live room');
    }
  };

  const handleEndOrLeaveLiveRoom = async (): Promise<void> => {
    if (!activeLiveRoom) return;
    const isHost =
      activeLiveRoom.host?._id === currentUserId ||
      activeLiveRoom.host === currentUserId;

    try {
      // 1. WebRTC cleanup first
      leaveWebRTCRoom();
      setShowLiveRoomView(false);

      // 2. HTTP leave/end
      if (isHost) {
        if (!window.confirm('End the live room for everyone?')) return;
        await dispatch(endLiveRoomThunk(activeLiveRoom.roomId)).unwrap();
      } else {
        await dispatch(leaveLiveRoomThunk(activeLiveRoom.roomId)).unwrap();
      }
    } catch (err: any) {
      alert(err || 'Failed to leave live room');
    }
  };

  const handleToggleSession = async (): Promise<void> => {
    try {
      if (!isSessionActive) {
        if (activeSession?.status === 'paused') {
          const result = await dispatch(resumeTimerThunk()).unwrap();
          if (result?.elapsedTime) {
            setStudyTime(Math.floor(result.elapsedTime / 1000));
          }
          setIsSessionActive(true);
        } else {
          await dispatch(startTimerThunk({
            subject: groupData?.category ?? 'Study Session',
            notes: `Group: ${groupData?.title ?? groupId}`,
          })).unwrap();
        }
        setIsSessionActive(true);
        // Auto-mark attendance when session starts
        try {
          await dispatch(attendanceAutoMarkThunk({ reason: 'study_session', studyHours: 0 })).unwrap();
        } catch { /* silent */ }
      } else {
        await dispatch(pauseTimerThunk()).unwrap();
        setIsSessionActive(false);
      }
    } catch (err: any) {
      console.error('Timer error:', err);
      setIsSessionActive(prev => !prev); // fallback
    }
  };

  const handleSendNotification = (): void => {
    alert('Study reminder sent to all inactive members! 📚');
    setShowNotificationPopup(false);
  };

  const handleCreateChallenge = (): void => {
    setShowChallengeModal(true);
  };


  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isSessionActive) {
      timer = setInterval(() => {
        setStudyTime(prev => {
          const newTime = prev + 1;
          if (newTime % 5 === 0) {
            const socket = getSocket();
            if (socket?.connected) {
              socket.emit('broadcast-session-time', {
                groupId,
                elapsedTime: newTime,
              });
            }
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSessionActive, groupId]);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroupByIdThunk(groupId));
      dispatch(fetchGroupMembersThunk(groupId));
      dispatch(fetchAllUsersThunk()).then(() => {
        fetchGroupMembers(groupId);
      });
      dispatch(fetchAttendanceStatusThunk());

      dispatch(getActiveTimerThunk());
      dispatch(getTimerStatsThunk());
      dispatch(fetchMessagesThunk({ groupId, params: { page: 1, limit: 30 } }));
      dispatch(fetchGroupActiveLiveRoomThunk(groupId));
    }
    return () => {
      dispatch(clearSelectedGroup());
      dispatch(clearActiveLiveRoom());
    };
  }, [groupId, dispatch]);



  useEffect(() => {
    if (activeSession?.status === 'active') {
      setIsSessionActive(true);
      if (activeSession.elapsedTime) {
        setStudyTime(Math.floor(activeSession.elapsedTime / 1000));
      }
    } else if (activeSession?.status === 'paused') {
      setIsSessionActive(false);
      if (activeSession.elapsedTime) {
        setStudyTime(Math.floor(activeSession.elapsedTime / 1000));
      }
    } else if (!activeSession) {
      setIsSessionActive(false);
    }
  }, [activeSession]);

  useEffect(() => {
    // Start 5-min timer when session becomes active
    if (isSessionActive && !attendanceStatus?.hasCheckedInToday) {
      attendanceTimerRef.current = setTimeout(() => {
        setShowAttendancePrompt(true);
      }, 5 * 60 * 1000); // 5 minutes
    }
    return () => {
      if (attendanceTimerRef.current) {
        clearTimeout(attendanceTimerRef.current);
      }
    };
  }, [isSessionActive, attendanceStatus?.hasCheckedInToday]);

  useChatSocket(groupId);

  if (isLoading || activeSessionLoading) return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#f6ede8] to-[#e0d8cf] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#8b7355] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#4a3728] font-semibold">
          {activeSessionLoading ? 'Checking session...' : 'Loading group...'}
        </p>
      </div>
    </div>
  );

  if (!groupData) return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#f6ede8] to-[#e0d8cf] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[#4a3728] font-bold text-lg mb-2">Group not found</p>
        <button
          onClick={() => router.push('/study/my-groups')}
          className="px-4 py-2 bg-[#8b7355] text-white rounded-lg font-semibold"
        >
          Back to My Groups
        </button>
      </div>
    </div>
  );

  /*
ADD this block just before your main `return (` statement:
*/
  if (webrtcError) {
    // Non-blocking — just log, don't crash the component
    console.error('[WebRTC Error]', webrtcError);
  }

  return (

    <div className="fixed inset-0 bg-gradient-to-br from-[#f6ede8] to-[#e0d8cf] flex flex-col z-50">
      {/* Header - Responsive */}
      <div className="px-2 sm:px-4 py-3 sm:py-3 shrink-0 lg:backdrop-blur-md lg:bg-white/40 lg:border-b lg:border-[#d4c4b5] lg:shadow-md">
        {/* Mobile Header - Clean with Glassmorphism */}
        <div className="lg:hidden">
          {/* Top Row - Group name with announcement icon */}
          <div className="flex items-center gap-2 mb-3">
            <div className="min-w-0 flex-1 bg-white/70 backdrop-blur-md rounded-full px-4 py-2.5 shadow-lg border border-white/40 flex items-center justify-between">
              <h1 className="text-sm font-bold text-[#4a3728] truncate leading-tight flex-1">
                {groupData.title}
              </h1>
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="ml-2 p-1.5 bg-amber-100/80 backdrop-blur-sm hover:bg-amber-200/80 rounded-full transition-all shrink-0"
                title="Group announcements"
              >
                <Megaphone size={16} className="text-amber-600" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2.5 bg-white/70 backdrop-blur-md rounded-full shadow-lg border border-white/40 shrink-0">
              <Users size={16} className="text-[#4a3728]" />
              <span className="text-sm font-bold text-[#4a3728]">
                {onlineMembers.length > 0 ? onlineMembers.length : members.filter(m => m.isOnline).length}
              </span>
            </div>
          </div>

          {/* Timer & Actions Row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* Big Timer Display */}
            <div className="flex-1 bg-white/70 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg border border-white/40">
              <div className="flex items-center justify-center gap-2">
                <div className={`text-2xl font-bold tabular-nums ${isSessionActive ? 'text-green-600' : 'text-[#4a3728]'}`}>
                  {formatTime(studyTime)}
                </div>
                {isSessionActive && (
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] font-semibold text-green-600 uppercase tracking-wide">Live</span>
                  </div>
                )}
              </div>
            </div>

            {/* Session Control */}
            <button
              onClick={handleToggleSession}
              disabled={timerApiLoading}
              className={
                `px-4 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 text-sm shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${isSessionActive
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                }`}
            >
              {isSessionActive ? (
                <>
                  <Pause size={16} />
                  Pause
                </>
              ) : (
                <>
                  <Play size={16} />
                  Start
                </>
              )}
            </button>

            {/* Leave Button */}
            <button
              onClick={handleLeaveRoom}
              className="p-3 bg-white/70 backdrop-blur-md hover:bg-red-50/70 rounded-2xl transition-all shadow-lg border border-white/40"
            >
              <LogOut size={18} className="text-red-500" />
            </button>
          </div>



          {/* Go to Chat Room Button - Mobile/Tablet */}
          <button
            onClick={() => router.push(`/study/my-groups/${groupId}/chat`)}
            className="w-full px-4 py-3 bg-white/70 backdrop-blur-md hover:bg-[#8b7355]/10 text-[#8b7355] rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 text-sm shadow-lg border border-white/40"
          >
            <MessageCircle size={16} />
            Go to Chat Room
          </button>

          {/* Attendance Check-in */}
          {attendanceStatus && !attendanceStatus.hasCheckedInToday && (
            <button
              onClick={() => dispatch(attendanceCheckInThunk(undefined))}
              disabled={attendanceCheckInLoading}
              className="w-full px-4 py-3 bg-green-500/10 text-green-700 rounded-2xl font-semibold text-sm border border-green-500/20 flex items-center justify-center gap-2"
            >
              ✅ Mark Today's Attendance
            </button>
          )}
          {attendanceStatus?.hasCheckedInToday && (
            <div className="w-full px-4 py-3 bg-green-100 text-green-700 rounded-2xl text-sm text-center font-semibold">
              ✅ Attendance marked for today
            </div>
          )}
 

          {activeLiveRoom ? (
            <div className="flex gap-2">
              <button
                onClick={handleJoinLiveRoom}
                className="flex-1 px-4 py-3 bg-green-500/10 text-green-700 rounded-2xl font-semibold text-sm border border-green-500/20 flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Enter Live Room
              </button>
              {(activeLiveRoom.host === currentUserId || activeLiveRoom.host?._id === currentUserId) && (
                <button
                  onClick={handleEndOrLeaveLiveRoom}
                  className="px-4 py-3 bg-red-500/10 text-red-600 rounded-2xl font-semibold text-sm border border-red-500/20 flex items-center justify-center gap-2"
                >
                  End
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowLiveRoomModal(true)}
              className="w-full px-4 py-3 bg-purple-500/10 text-purple-700 rounded-2xl font-semibold text-sm border border-purple-500/20 flex items-center justify-center gap-2"
            >
              Start Live Room
            </button>
          )}
        </div>

        {/* Desktop Header - Professional & Elegant */}
        <div className="hidden lg:flex items-center justify-between gap-6 px-6 py-4">
          {/* Left Section - Group Identity */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/study/my-groups')}
              className="text-[#6b5847] hover:text-[#4a3728] transition-all text-sm font-medium flex items-center gap-1.5"
            >
              <ChevronLeft size={18} />
              <span>Back</span>
            </button>

            <div className="h-10 w-px bg-[#d4c4b5]"></div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl xl:text-2xl font-bold text-[#4a3728] tracking-tight">
                  {groupData.title}
                </h1>
                {groupData.leaderId === currentUserId && (
                  <span className="px-3 py-1 bg-[#8b7355] text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    Host
                  </span>
                )}
              </div>
              <p className="text-sm text-[#6b5847] mt-0.5">{groupData.category}</p>
            </div>
          </div>

          {/* Center Section - Live Stats */}
          <div className="flex items-center gap-8">
            {/* Session Timer */}
            <div className="text-center">
              <div className="text-xs font-semibold text-[#6b5847] uppercase tracking-wider mb-1">Session Time</div>
              <div className={`text-2xl xl:text-3xl font-bold tabular-nums tracking-tight ${isSessionActive ? 'text-green-600' : 'text-[#4a3728]'
                }`}>
                {formatTime(studyTime)}
              </div>
            </div>

            <div className="h-12 w-px bg-[#d4c4b5]"></div>

            {/* Online Members */}
            <div className="text-center">
              <div className="text-xs font-semibold text-[#6b5847] uppercase tracking-wider mb-1">Active Now</div>

              {/* {members.length} */}


              <div className="text-2xl xl:text-3xl font-bold text-[#4a3728] tabular-nums">
                {onlineMembers.length}
                <span className="text-lg text-[#6b5847] ml-1">/ {groupData.currentMemberCount}</span>
              </div>
            </div>

            <div className="h-12 w-px bg-[#d4c4b5]"></div>

            {/* Streak */}
            <div className="text-center">
              <div className="text-xs font-semibold text-[#6b5847] uppercase tracking-wider mb-1">Day Streak</div>
              <div className="text-2xl xl:text-3xl font-bold text-[#8b7355] tabular-nums">
                {/* {groupData.currentStreak ? groupData.currentStreak : 0} */}
                {(groupData as any).currentStreak ?? 0}
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="px-4 py-2 bg-white/60 hover:bg-white/80 text-[#6b5847] hover:text-[#4a3728] rounded-lg transition-all text-sm font-medium backdrop-blur-sm border border-[#d4c4b5]"
            >
              Announcements
            </button>

            {/* Desktop header ke actions section mein add karo */}
            {attendanceStatus && !attendanceStatus.hasCheckedInToday && (
              <button
                onClick={() => dispatch(attendanceCheckInThunk(undefined))}
                disabled={attendanceCheckInLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold disabled:opacity-50"
              >
                ✅ Check In
              </button>
            )}
            {attendanceStatus?.hasCheckedInToday && (
              <span className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                ✅ Attended
              </span>
            )}

             {activeLiveRoom ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 rounded-full text-xs font-semibold border border-red-500/20 animate-pulse">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Live
                </span>
                <button
                  onClick={handleJoinLiveRoom}
                  disabled={liveRoomActionLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  Enter Room
                </button>
                {(activeLiveRoom.host === currentUserId || activeLiveRoom.host?._id === currentUserId) && (
                  <button
                    onClick={handleEndOrLeaveLiveRoom}
                    disabled={liveRoomActionLoading}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                  >
                    End Room
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLiveRoomModal(true)}
                disabled={liveRoomActionLoading || activeLiveRoomLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold disabled:opacity-50"
              >
                Start Live Room
              </button>
            )}
            <button
              onClick={() => router.push(`/study/my-groups/${groupId}/chat`)}
              className="px-5 py-2.5 bg-[#8b7355] hover:bg-[#6b5847] text-white rounded-lg transition-all text-sm font-bold shadow-sm"
            >
              Chat Room
            </button>

            <button
              onClick={handleToggleSession}
              disabled={timerApiLoading}
              className={
                `px-5 py-2.5 rounded-lg font-bold transition-all text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed
                ${isSessionActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
            >
              {isSessionActive ? 'Pause Session' : 'Start Session'}
            </button>

            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 text-[#6b5847] hover:text-red-600 transition-all text-sm font-medium"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Video Grid - Scrollable */}
        <div className="flex-1 p-2 sm:p-4 md:p-6 overflow-y-auto">
          {/* Mobile View - Avatar/Video Cards with Study Time */}
          <div className="lg:hidden grid grid-cols-2 gap-2 max-w-2xl mx-auto">
            {/* Self Card */}
            <div className="bg-white/70 backdrop-blur-md rounded-xl p-3 shadow-lg border-2 border-[#8b7355]/50">
              <div className="flex flex-col items-center">

                {
                  // isCameraOn ? 
                  (activeLiveRoom ? webrtcCameraOn : isCameraOn) ?
                    (
                      <div className="w-full aspect-square bg-gradient-to-br from-[#8b7355] to-[#6b5847] rounded-lg mb-2 flex items-center justify-center">
                        <div className="text-5xl">📹</div>
                      </div>
                    ) : (
                      <div className="mb-2">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt="You"
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8b7355] to-[#6b5847] flex items-center justify-center border-2 border-white shadow">
                            <span className="text-white font-bold text-lg">
                              {(user?.name ?? user?.email ?? 'Y').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                <div className="font-bold text-[#4a3728] text-sm mb-1">You</div>
                <div className="text-base font-bold text-[#4a3728] mb-2 tabular-nums">
                  {formatTime(studyTime)}
                </div>
                <div className="flex gap-1">
                  {/* {isMicOn ? ( */}
                  {(activeLiveRoom ? webrtcMicOn : isMicOn) ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Mic size={12} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <MicOff size={12} className="text-white" />
                    </div>
                  )}
                  {(activeLiveRoom ? webrtcCameraOn : isCameraOn) ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Video size={12} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <VideoOff size={12} className="text-white" />
                    </div>
                  )}
                </div>
                {isSessionActive && (
                  <div className="mt-2 px-2 py-0.5 bg-green-500 rounded-full text-xs font-bold text-white flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    ACTIVE
                  </div>
                )}
              </div>
            </div>

            {/* Other Members Cards */}
            {members.filter(m => m.isOnline && m.userId !== currentUserId).map((member) => (
              <div
                key={member.id}
                className={`bg-white/70 backdrop-blur-md rounded-xl p-3 shadow-lg border-2 ${member.isSpeaking ? 'border-green-500' : 'border-white/40'
                  }`}
              >
                <div className="flex flex-col items-center">
                  {/* Avatar — real image ya emoji fallback */}
                  <div className="relative mb-2">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4a3728] to-[#6b5847] flex items-center justify-center border-2 border-white shadow">
                        <span className="text-white font-bold text-lg">
                          {member.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>

                  <div className="font-bold text-[#4a3728] text-sm mb-1 text-center truncate w-full">
                    {member.userId === currentUserId ? 'You' : member.name.split(' ')[0]}
                  </div>
                  <div className="text-base font-bold text-[#4a3728] mb-1 tabular-nums">
                    {member.userId === currentUserId
                      ? formatTime(studyTime)
                      : formatTime(memberSessionTimes[member.userId] ?? 0)
                    }
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <Award size={12} className="text-amber-500" />
                    <span className="text-xs font-semibold text-[#6b5847]">
                      {member.role === 'leader' ? '👑 Leader' : `Rank #${member.rank}`}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <MicOff size={12} className="text-white" />
                    </div>
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <VideoOff size={12} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

          </div>

          {/* Desktop View - Video Grid */}
          <div className="hidden lg:grid grid-cols-3 gap-4 max-w-6xl mx-auto">
            {/* Self Video */}
            <div className="relative aspect-video bg-gradient-to-br from-[#8b7355] to-[#6b5847] rounded-xl overflow-hidden border-4 border-[#8b7355] shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* {isCameraOn ? ( */}
                {(activeLiveRoom ? webrtcCameraOn : isCameraOn) ? (
                  <div className="w-full h-full bg-gradient-to-br from-[#8b7355] to-[#6b5847] flex items-center justify-center">
                    <div className="text-6xl">📹</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-2">👤</div>
                    <div className="text-white font-semibold">Camera Off</div>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-semibold text-sm">You</span>
                    <div className="flex items-center gap-1 text-xs text-white/80 tabular-nums">
                      <Clock size={10} />
                      {formatTime(studyTime)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {/* {isMicOn ? ( */}
                    {(activeLiveRoom ? webrtcMicOn : isMicOn) ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Mic size={14} className="text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <MicOff size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 rounded-full text-xs font-bold text-white">
                LIVE
              </div>
              {isSessionActive && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-green-500 rounded-full text-xs font-bold text-white flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  ACTIVE
                </div>
              )}
            </div>

            {/* Other Members — Desktop */}
            {members.filter(m => m.isOnline && m.userId !== currentUserId).map((member) => (
              <div
                key={member.id}
                className={`relative aspect-video bg-gradient-to-br from-[#4a3728] to-[#6b5847] rounded-xl overflow-hidden shadow-lg ${member.isSpeaking ? 'ring-4 ring-green-500' : 'border-2 border-[#e0d8cf]'
                  }`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-xl"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2 border-2 border-white/30">
                        <span className="text-white font-bold text-2xl">
                          {member.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-white font-semibold text-sm">{member.name}</div>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-semibold text-sm truncate">
                        {member.userId === currentUserId ? 'You' : member.name}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-white/80">

                        <div className="flex items-center gap-1 tabular-nums">
                          <Clock size={10} />
                          {member.userId === currentUserId
                            ? formatTime(studyTime)
                            : formatTime(memberSessionTimes[member.userId] ?? 0)
                          }
                        </div>
                        <div className="flex items-center gap-1">
                          {member.role === 'leader' ? '👑' : `#${member.rank}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <MicOff size={14} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 bg-[#8b7355] rounded-full text-xs font-bold text-white">
                  {member.role === 'leader' ? '👑' : `#${member.rank}`}
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* Right Sidebar - Chat & Members (Desktop & Tablet) */}
        {(showChat || showMembers) && (
          <div className="hidden md:flex w-64 lg:w-80 bg-white/80 backdrop-blur-md border-l-2 border-[#e0d8cf] flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-[#e0d8cf] shrink-0">
              <button
                onClick={() => { setShowChat(true); setShowMembers(false); }}
                className={`flex-1 px-3 lg:px-4 py-2.5 lg:py-3 font-semibold text-xs lg:text-sm transition-all ${showChat && !showMembers
                  ? 'bg-[#f6ede8] text-[#4a3728] border-b-4 border-[#8b7355]'
                  : 'text-[#6b5847] hover:bg-[#f6ede8]'
                  }`}
              >
                <MessageCircle size={14} className="inline mr-1.5 lg:mr-2" />
                Chat
              </button>
              <button
                onClick={() => { setShowMembers(true); setShowChat(false); }}
                className={`flex-1 px-3 lg:px-4 py-2.5 lg:py-3 font-semibold text-xs lg:text-sm transition-all ${showMembers && !showChat
                  ? 'bg-[#f6ede8] text-[#4a3728] border-b-4 border-[#8b7355]'
                  : 'text-[#6b5847] hover:bg-[#f6ede8]'
                  }`}
              >
                <Users size={14} className="inline mr-1.5 lg:mr-2" />
                Members ({groupData?.currentMemberCount ?? rawMembers.length})
              </button>
            </div>

            {/* Chat View */}
            {showChat && !showMembers && (
              <>
                <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3">
                  {roomMessages.length === 0 && (
                    <div className="text-center text-xs text-[#6b5847] mt-8">No messages yet. Say hi! 👋</div>
                  )}
                  {roomMessages.map((msg: any) => {
                    const isOwn = msg.sender === currentUserId;
                    const userInfo = getUserInfoSync(msg.sender);
                    return (
                      <div key={msg.messageId} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <div className="w-7 h-7 rounded-full bg-[#8b7355] flex items-center justify-center flex-shrink-0 text-xs font-bold text-white overflow-hidden">
                          {userInfo.avatar
                            ? <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full object-cover" />
                            : userInfo.name.charAt(0).toUpperCase()
                          }
                        </div>
                        <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-xs font-semibold text-[#4a3728] ${isOwn ? 'order-2' : ''}`}>
                              {isOwn ? 'You' : userInfo.name}
                            </span>
                            <span className="text-xs text-[#6b5847]">
                              {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className={`inline-block px-2.5 py-1.5 rounded-lg text-xs lg:text-sm break-words max-w-[180px] ${isOwn ? 'bg-[#8b7355] text-white rounded-tr-none' : 'bg-[#f6ede8] text-[#4a3728] rounded-tl-none'}`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 lg:p-4 border-t border-[#e0d8cf] shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-2.5 lg:px-3 py-1.5 lg:py-2 border-2 border-[#e0d8cf] rounded-lg focus:border-[#8b7355] outline-none text-xs lg:text-sm text-[#4a3728] placeholder:text-[#6b5847]/50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sendLoading}
                      className="px-3 lg:px-4 py-1.5 lg:py-2 bg-[#8b7355] hover:bg-[#6b5847] text-white rounded-lg transition-all disabled:opacity-50"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Members View */}
            {showMembers && !showChat && (
              <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2">
                {members.filter(m => m.userId !== currentUserId).map((member) => (
                  <div
                    key={member.id}
                    className={`p-2.5 lg:p-3 rounded-lg transition-all ${member.isOnline
                      ? 'bg-[#f6ede8] hover:bg-[#e0d8cf]'
                      : 'bg-gray-100 opacity-60'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 lg:gap-3">

                      <div className="relative flex-shrink-0">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 lg:w-9 lg:h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-[#8b7355] flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              {member.name.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {member.isOnline && (
                          <div className="absolute bottom-0 right-0 w-2.5 lg:w-3 h-2.5 lg:h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#4a3728] text-xs lg:text-sm truncate">{member.name}</div>
                        <div className="text-xs text-[#6b5847] tabular-nums">
                          {formatTime(member.studyTime)} • Rank #{member.rank}
                        </div>
                      </div>
                      {member.isOnline && (
                        <div className="flex gap-1 shrink-0">
                          {member.videoEnabled && (
                            <div className="w-5 lg:w-6 h-5 lg:h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Video size={10} className="text-white lg:w-3 lg:h-3" />
                            </div>
                          )}
                          {member.audioEnabled && (
                            <div className={`w-5 lg:w-6 h-5 lg:h-6 rounded-full flex items-center justify-center ${member.isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-green-500'
                              }`}>
                              <Mic size={10} className="text-white lg:w-3 lg:h-3" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Chat/Members Overlay */}
      {(showChat || showMembers) && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => { setShowChat(false); setShowMembers(false); }}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md rounded-t-2xl max-h-[70vh] flex flex-col border-t-2 border-white/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tabs */}
            <div className="flex border-b border-[#e0d8cf] shrink-0">
              <button
                onClick={() => { setShowChat(true); setShowMembers(false); }}
                className={`flex-1 px-4 py-3 font-semibold text-sm transition-all ${showChat && !showMembers
                  ? 'bg-[#f6ede8] text-[#4a3728] border-b-4 border-[#8b7355]'
                  : 'text-[#6b5847]'
                  }`}
              >
                <MessageCircle size={16} className="inline mr-2" />
                Chat
              </button>
              <button
                onClick={() => { setShowMembers(true); setShowChat(false); }}
                className={`flex-1 px-4 py-3 font-semibold text-sm transition-all ${showMembers && !showChat
                  ? 'bg-[#f6ede8] text-[#4a3728] border-b-4 border-[#8b7355]'
                  : 'text-[#6b5847]'
                  }`}
              >
                <Users size={16} className="inline mr-2" />
                Members ({members.filter(m => m.isOnline).length})
              </button>
              <button
                onClick={() => { setShowChat(false); setShowMembers(false); }}
                className="p-3 text-[#6b5847]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat View */}

            {showChat && !showMembers && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {roomMessages.length === 0 && (
                    <div className="text-center text-xs text-[#6b5847] mt-8">
                      No messages yet. Say hi! 👋
                    </div>
                  )}
                  {roomMessages.map((msg: any) => {
                    const isOwn = msg.sender === currentUserId;
                    const userInfo = getUserInfoSync(msg.sender);
                    return (
                      <div
                        key={msg.messageId}
                        className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-[#8b7355] flex items-center justify-center flex-shrink-0 text-xs font-bold text-white overflow-hidden">
                          {userInfo.avatar
                            ? <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full object-cover" />
                            : userInfo.name.charAt(0).toUpperCase()
                          }
                        </div>
                        <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold text-[#4a3728] ${isOwn ? 'order-2' : ''}`}>
                              {isOwn ? 'You' : userInfo.name}
                            </span>
                            <span className="text-xs text-[#6b5847]">
                              {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div
                            className={`inline-block px-3 py-2 rounded-lg text-sm break-words max-w-[200px] ${isOwn
                              ? 'bg-[#8b7355] text-white rounded-tr-none'
                              : 'bg-[#f6ede8] text-[#4a3728] rounded-tl-none'
                              }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border-t border-[#e0d8cf] shrink-0 bg-white/90 backdrop-blur-md">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border-2 border-[#e0d8cf] rounded-lg focus:border-[#8b7355] outline-none text-sm text-[#4a3728] placeholder:text-[#6b5847]/50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sendLoading}
                      className="px-4 py-2 bg-[#8b7355] hover:bg-[#6b5847] text-white rounded-lg transition-all disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Members View */}
            {showMembers && !showChat && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {members.filter(m => m.userId !== currentUserId).map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 rounded-lg transition-all ${member.isOnline
                      ? 'bg-[#f6ede8]'
                      : 'bg-gray-100 opacity-60'
                      }`}
                  >
                    <div className="flex items-center gap-3">

                      <div className="relative flex-shrink-0">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#8b7355] flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              {member.name.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {member.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#4a3728] text-sm">{member.name}</div>
                        <div className="text-xs text-[#6b5847] tabular-nums">
                          {formatTime(member.studyTime)} • Rank #{member.rank}
                        </div>
                      </div>
                      {member.isOnline && (
                        <div className="flex gap-1">
                          {member.videoEnabled && (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Video size={12} className="text-white" />
                            </div>
                          )}
                          {member.audioEnabled && (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${member.isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-green-500'
                              }`}>
                              <Mic size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Controls - Fixed, Responsive with Glassmorphism */}
      <div className="backdrop-blur-md bg-white/40 border-t border-[#d4c4b5] shadow-lg px-3 sm:px-4 md:px-6 py-3 sm:py-4 shrink-0 safe-area-bottom">
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
          <button  onClick={async () => {
            // WebRTC track toggle (immediate, no server round-trip)
              toggleWebRTCMic();
             
              const socket = getSocket();
              socket?.emit('toggle-mic', {
                roomId: activeLiveRoom?.roomId,
                micOn: !webrtcMicOn,
              });
              // Update Redux local state for UI
              dispatch(setLocalMic(!webrtcMicOn));
            }}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isMicOn
              ? 'bg-[#8b7355] hover:bg-[#6b5847] text-white'
              : 'bg-[#4a3728] hover:bg-[#4a3728] text-white'
              }`}
            title={(activeLiveRoom ? webrtcMicOn : isMicOn) ? "Mute" : "Unmute"}
          >
            {(activeLiveRoom ? webrtcMicOn : isMicOn) ? <Mic size={20} className="sm:w-6 sm:h-6" /> : <MicOff size={20} className="sm:w-6 sm:h-6" />}
          </button>

          <button

            onClick={async () => {
              await toggleWebRTCCamera();
              const socket = getSocket();
              socket?.emit('toggle-camera', {
                roomId: activeLiveRoom?.roomId,
                cameraOn: !webrtcCameraOn,
              });
              dispatch(setLocalCamera(!webrtcCameraOn));
            }}

            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isCameraOn
              ? 'bg-[#8b7355] hover:bg-[#6b5847] text-white'
              : 'bg-[#4a3728] hover:bg-[#4a3728] text-white'
              }`}
            title={(activeLiveRoom ? webrtcCameraOn : isCameraOn) ? "Turn off camera" : "Turn on camera"}
          >
            {(activeLiveRoom ? webrtcCameraOn : isCameraOn) ? <Video size={20} className="sm:w-6 sm:h-6" /> : <VideoOff size={20} className="sm:w-6 sm:h-6" />}
          </button>

          {/* Notify Button - All devices */}
          <button
            onClick={() => setShowNotificationPopup(!showNotificationPopup)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-lg bg-[#4a3728] text-white relative"
            title="Notify inactive members"
          >
            <Bell size={20} className="sm:w-6 sm:h-6" />
            {groupData.currentMemberCount - members.filter(m => m.isOnline).length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">
                  {groupData.currentMemberCount - members.filter(m => m.isOnline).length}
                </span>
              </div>
            )}
          </button>

          {/* Challenge Button - All devices */}
          <button
            onClick={handleCreateChallenge}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-lg bg-[#4a3728] text-white"
            title="Start group challenge"
          >
            <Zap size={20} className="sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={() => {
              setShowChat(!showChat);
              if (showMembers && !showChat) {
                setShowMembers(false);
              }
            }}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${showChat
              ? 'bg-[#8b7355] hover:bg-[#6b5847] text-white'
              : 'bg-[#4a3728] hover:bg-[#4a3728] text-white'
              }`}
            title="Toggle chat"
          >
            <MessageCircle size={20} className="sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={() => {
              setShowMembers(!showMembers);
              if (showChat && !showMembers) {
                setShowChat(false);
              }
            }}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${showMembers
              ? 'bg-[#8b7355] hover:bg-[#6b5847] text-white'
              : 'bg-[#4a3728] hover:bg-[#4a3728] text-white'
              }`}
            title="Toggle members"
          >
            <Users size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Notification Popup */}
      {showNotificationPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNotificationPopup(false)}>
          <div
            className="bg-white/90 backdrop-blur-md rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all border border-white/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#f6ede8] rounded-full flex items-center justify-center">
                <Bell size={24} className="text-[#8b7355]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#4a3728]">Send Study Reminder</h3>
                <p className="text-xs text-[#6b5847]">Motivate inactive members</p>
              </div>
            </div>

            <div className="bg-[#f6ede8] rounded-lg p-4 mb-4">
              <p className="text-sm text-[#4a3728] mb-2">
                <span className="font-semibold">Message to send:</span>
              </p>
              <p className="text-sm text-[#6b5847] italic">
                "Hey study buddy! 📚 Your group is in session right now. Join us and let's crush our goals together! 💪"
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-[#6b5847] mb-4">
              <span>Will notify:</span>
              <span className="font-semibold text-[#4a3728]">
                {groupData.currentMemberCount - members.filter(m => m.isOnline).length} inactive members
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNotificationPopup(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-[#4a3728] rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                className="flex-1 px-4 py-2.5 bg-[#8b7355] hover:bg-[#6b5847] text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Send Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowChallengeModal(false)}>
          <div
            className="bg-white/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all border border-white/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Zap size={24} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#4a3728]">Start Group Challenge</h3>
                <p className="text-xs text-[#6b5847]">Compete and motivate each other</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <button className="w-full p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all text-left border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#4a3728] mb-1">⏱️ Speed Challenge</div>
                    <div className="text-xs text-[#6b5847]">Who can study 2 hours fastest?</div>
                  </div>
                  <ChevronLeft className="rotate-180 text-purple-500" size={20} />
                </div>
              </button>

              <button className="w-full p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all text-left border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#4a3728] mb-1">🔥 Streak Battle</div>
                    <div className="text-xs text-[#6b5847]">7-day consistency challenge</div>
                  </div>
                  <ChevronLeft className="rotate-180 text-green-500" size={20} />
                </div>
              </button>

              <button className="w-full p-4 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 rounded-xl transition-all text-left border-2 border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#4a3728] mb-1">🎯 Daily Goal Race</div>
                    <div className="text-xs text-[#6b5847]">First to hit 8 hours today wins</div>
                  </div>
                  <ChevronLeft className="rotate-180 text-amber-500" size={20} />
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowChallengeModal(false)}
              className="w-full px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-[#4a3728] rounded-lg font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAnnouncementModal(false)}>
          <div
            className="bg-white/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all border border-white/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Megaphone size={24} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#4a3728]">Group Announcements</h3>
                <p className="text-xs text-[#6b5847]">Important updates from host</p>
              </div>
            </div>

            <div className="space-y-3 mb-5 max-h-96 overflow-y-auto">
              {/* Recent Announcement */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border-l-4 border-amber-500">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown size={14} className="text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">Host</span>
                  </div>
                  <span className="text-xs text-[#6b5847]">2 hours ago</span>
                </div>
                <p className="text-sm text-[#4a3728] font-medium mb-1">📚 Important: Today's Focus</p>
                <p className="text-sm text-[#6b5847]">
                  Let's aim for 6+ hours today! Remember to take breaks every 90 minutes. We're almost at our group goal! 💪
                </p>
              </div>

              {/* Older Announcement */}
              <div className="bg-[#f6ede8] rounded-xl p-4 border-l-4 border-[#8b7355]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown size={14} className="text-[#8b7355]" />
                    <span className="text-xs font-semibold text-[#6b5847]">Host</span>
                  </div>
                  <span className="text-xs text-[#6b5847]">Yesterday</span>
                </div>
                <p className="text-sm text-[#4a3728] font-medium mb-1">🎉 Milestone Achieved!</p>
                <p className="text-sm text-[#6b5847]">
                  Congrats everyone! We've completed 15 days streak as a group. Keep up the amazing work!
                </p>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700">System</span>
                  </div>
                  <span className="text-xs text-[#6b5847]">3 days ago</span>
                </div>
                <p className="text-sm text-[#4a3728] font-medium mb-1">ℹ️ New Feature</p>
                <p className="text-sm text-[#6b5847]">
                  You can now track your individual progress in real-time. Check the timer below your profile!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAnnouncementModal(false)}
              className="w-full px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-[#4a3728] rounded-lg font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Live Room Modal */}
      {showLiveRoomModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLiveRoomModal(false)}>
          <div
            className="bg-white/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/40"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#4a3728] mb-4">Start Live Room</h3>
            <input
              type="text"
              value={liveRoomTitle}
              onChange={(e) => { setLiveRoomTitle(e.target.value); setLiveRoomError(''); }}
              placeholder={`${groupData?.title ?? 'Study'} - Live Session`}
              className="w-full px-4 py-3 border-2 border-[#e0d8cf] rounded-xl mb-2 text-sm outline-none focus:border-[#8b7355]"
            />
            {liveRoomError && <p className="text-xs text-red-500 mb-3">{liveRoomError}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowLiveRoomModal(false); setLiveRoomError(''); }}
                className="flex-1 px-4 py-2.5 bg-gray-200 rounded-lg font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleStartLiveRoom}
                disabled={liveRoomActionLoading}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
              >
                {liveRoomActionLoading ? 'Starting...' : 'Start'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLiveRoomView && activeLiveRoom && (
        <div className="fixed inset-0 z-[100] bg-black">
         

          <LiveRoomView
            localStream={localStream}
            currentUserId={currentUserId}
            localUserName={user?.name ?? user?.email ?? 'You'}   // ← localUserName
            localUserAvatar={user?.avatar ?? null}               // ← localUserAvatar
            isCameraOn={webrtcCameraOn}
            isMicOn={webrtcMicOn}
            isScreenSharing={webrtcScreenSharing}
            peers={webrtcPeers}
            activeSpeakers={activeSpeakers}
            roomMode={roomMode}
            roomTitle={activeLiveRoom.title}
            onToggleCamera={async () => {
              await toggleWebRTCCamera();
              const socket = getSocket();
              socket?.emit('toggle-camera', { roomId: activeLiveRoom.roomId, cameraOn: !webrtcCameraOn });
              dispatch(setLocalCamera(!webrtcCameraOn));
            }}
            onToggleMic={() => {
              toggleWebRTCMic();
              const socket = getSocket();
              socket?.emit('toggle-mic', { roomId: activeLiveRoom.roomId, micOn: !webrtcMicOn });
              dispatch(setLocalMic(!webrtcMicOn));
            }}
            onToggleScreenShare={async () => {
              await toggleWebRTCScreenShare();
              const socket = getSocket();
              socket?.emit('toggle-screen-share', { roomId: activeLiveRoom.roomId, sharing: !webrtcScreenSharing });
              dispatch(setLocalScreenShare(!webrtcScreenSharing));
            }}
          onLeave={handleEndOrLeaveLiveRoom}
/>

        </div>
      )}

      {showAttendancePrompt && !attendanceStatus?.hasCheckedInToday && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/40">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-bold text-[#4a3728]">Mark Your Attendance</h3>
              <p className="text-sm text-[#6b5847] mt-1">You've been studying for 5 minutes. Mark today's attendance?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAttendancePrompt(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 rounded-lg font-semibold text-sm text-[#4a3728]"
              >
                Later
              </button>
              <button
                onClick={async () => {
                  await dispatch(attendanceCheckInThunk(undefined));
                  setShowAttendancePrompt(false);
                }}
                disabled={attendanceCheckInLoading}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
              >
                Mark Attendance
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GroupRoom;









