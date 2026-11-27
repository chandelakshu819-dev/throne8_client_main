//src/app/(studyGroup)/study/my-groups/components/GroupRoom.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  LogOut,
  MessageCircle,
  Crown,
  Clock,
  X,
  Send,
  ChevronLeft,
  Info,
  Play,
  Pause,
  Bell,
  Zap,
  Megaphone,
  CheckCircle2,
} from "lucide-react";
import {
  fetchGroupByIdThunk,
  fetchGroupMembersThunk,
  createLiveRoomThunk,
  fetchGroupActiveLiveRoomThunk,
  joinLiveRoomThunk,
  leaveLiveRoomThunk,
  endLiveRoomThunk,
  attendanceAutoMarkThunk,
  fetchAttendanceStatusThunk,
  attendanceCheckInThunk,
  fetchUserStreakThunk,
} from "@/hooks/studyGroup/features/groups/group.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearSelectedGroup,
  selectGroupMembers,
  selectSelectedGroup,
  selectSelectedGroupLoading,
  selectActiveLiveRoom,
  selectActiveLiveRoomLoading,
  selectLiveRoomActionLoading,
  selectLocalCameraOn,
  selectLocalMicOn,
  setLocalCamera,
  setLocalMic,
  setLocalScreenShare,
  clearActiveLiveRoom,
  selectAttendanceStatus,
  selectAttendanceCheckInLoading,
  selectUserStreak,
} from "@/hooks/studyGroup/features/groups/groupsSlice";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useGroupData } from "@/features/study-group/hooks/useGroupData";
import StudyGroupService from "@/lib/api/studyGroup.service";
import { useChatSocket } from "@/core/realtime/useChatSocket";
import {
  startTimerThunk,
  pauseTimerThunk,
  resumeTimerThunk,
  stopTimerThunk,
  getTimerStatsThunk,
  getActiveTimerThunk,
} from "@/hooks/studyGroup/features/timer/timer.thunks";
import {
  selectActiveSession,
  selectTimerApiLoading,
} from "@/hooks/studyGroup/features/timer/timerSlice";
import {
  fetchMessagesThunk,
  sendMessageThunk,
} from "@/hooks/studyGroup/features/chats/chat.thunks";
import {
  selectMessagesByGroup,
  selectOnlineMembers,
  selectMemberSessionTimes,
  selectActiveSessionMemberIds,
  selectSendLoading,
} from "@/hooks/studyGroup/features/chats/chatSlice";
import { createLiveRoomSchema } from "@/features/study-group/validators/liveroom.validation";
import { LIVE_ROOM_MAX_PARTICIPANTS } from "@/features/study-group/constants/liveRoom";
import { getSocket, initializeSocket } from "@/core/realtime/socket.client";
import { useLiveRoom } from "@/core/webrtc/useLiveRoom";

// Heavy, only needed after the user joins a call / opens the challenge dialog
const LiveRoomView = dynamic(() => import("./LiveRoomView"), { ssr: false });
const GroupChallengeModal = dynamic(() => import("./GroupChallengeModal"), {
  ssr: false,
});

interface GroupRoomProps {
  groupId: string;
}

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

const HDR_BTN =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const HDR_PRIMARY = `${HDR_BTN} bg-[#4a3728] text-white shadow-sm hover:bg-[#3a2a1e]`;
const HDR_AMBER = `${HDR_BTN} bg-[#b9803f] text-white shadow-sm hover:bg-[#a06e33]`;
const HDR_WARM = `${HDR_BTN} bg-[#8b7355] text-white shadow-sm hover:bg-[#6b5847]`;
const HDR_OUTLINE = `${HDR_BTN} border border-[#d4c4b5] bg-white/70 text-[#4a3728] hover:bg-white`;
const HDR_DANGER_OUTLINE = `${HDR_BTN} border border-red-200 bg-white/70 text-red-600 hover:bg-red-50`;
const HDR_DANGER = `${HDR_BTN} bg-red-600 text-white shadow-sm hover:bg-red-700`;

const DEFAULT_REMINDER_MESSAGE =
  "Hey study buddy! 📚 Your group is in session right now. Join us and let's crush our goals together! 💪";
const REMINDER_MAX_LENGTH = 200;

const CTRL_BASE =
  "relative flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full text-white shadow-md transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7355] focus-visible:ring-offset-2";
const CTRL_DARK = `${CTRL_BASE} bg-[#4a3728] hover:bg-[#3a2a1e]`;
const CTRL_TAN = `${CTRL_BASE} bg-[#8b7355] hover:bg-[#6b5847]`;
const CTRL_RED = `${CTRL_BASE} bg-red-600 hover:bg-red-700`;
const CTRL_LABEL = "text-[10px] font-medium text-[#4a3728] sm:text-xs";

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/* ------------------------------------------------------------------ */
/* Small presentational components                                     */
/* ------------------------------------------------------------------ */

const SelfVideo: React.FC<{ stream: MediaStream | null; className?: string }> = ({
  stream,
  className,
}) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.srcObject = stream;
    if (stream) {
      v.onloadedmetadata = () => {
        v.play().catch((e) => console.error("play() failed:", e));
      };
    }
    return () => {
      v.onloadedmetadata = null;
    };
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className={`${className ?? ""} scale-x-[-1]`}
    />
  );
};

const RoomSkeleton = () => (
  <div className="fixed inset-0 z-[60] flex h-[100dvh] animate-pulse flex-col bg-gradient-to-br from-[#f6ede8] to-[#e0d8cf] p-4">
    <div className="h-14 rounded-2xl bg-white/60" />
    <div className="mt-6 grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="aspect-video rounded-2xl bg-white/60" />
      <div className="hidden aspect-video rounded-2xl bg-white/40 sm:block" />
    </div>
    <div className="mx-auto mt-4 h-16 w-72 max-w-full rounded-full bg-white/60" />
  </div>
);

interface TileProps {
  name: string;
  initials: string;
  avatar?: string | null;
  time: number;
  isSelf?: boolean;
  stream?: MediaStream | null;
  camOn?: boolean;
  micOn?: boolean;
  badge?: React.ReactNode;
  speaking?: boolean;
}

const ParticipantTile: React.FC<TileProps> = ({
  name,
  initials,
  avatar,
  time,
  isSelf,
  stream,
  camOn,
  micOn,
  badge,
  speaking,
}) => (
  <div
    className={`relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-[#7a6350] to-[#3a2a1e] shadow-lg sm:aspect-video ${
      speaking
        ? "ring-4 ring-green-400"
        : isSelf
        ? "ring-2 ring-[#c9a97a]"
        : "ring-1 ring-white/20"
    }`}
  >
    <div className="absolute inset-0 flex items-center justify-center">
      {camOn && stream ? (
        <SelfVideo stream={stream} className="h-full w-full object-cover" />
      ) : avatar ? (
        <img
          src={avatar}
          alt={name}
          className="h-16 w-16 rounded-full border-4 border-white/30 object-cover sm:h-24 sm:w-24"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/30 bg-white/15 text-xl font-bold text-white sm:h-24 sm:w-24 sm:text-3xl">
          {initials}
        </div>
      )}
    </div>

    {isSelf && !camOn && (
      <div className="absolute inset-x-0 top-[62%] flex items-center justify-center gap-1.5 text-xs font-semibold text-white/90 sm:top-[68%] sm:text-sm">
        <VideoOff size={14} /> Camera off
      </div>
    )}

    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-8 sm:p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white sm:text-base">
          {name}
        </p>
        <p className="flex items-center gap-1 text-xs tabular-nums text-white/85 sm:text-sm">
          <Clock size={12} /> {formatTime(time)}
        </p>
      </div>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8 ${
          micOn ? "bg-green-500" : "bg-red-500"
        }`}
      >
        {micOn ? (
          <Mic size={14} className="text-white" />
        ) : (
          <MicOff size={14} className="text-white" />
        )}
      </span>
    </div>

    {badge && (
      <div className="absolute right-2 top-2 sm:right-3 sm:top-3">{badge}</div>
    )}
  </div>
);

const Avatar: React.FC<{
  src?: string | null;
  name: string;
  className?: string;
}> = ({ src, name, className = "h-8 w-8" }) => (
  <div
    className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#8b7355] text-xs font-bold text-white ${className}`}
  >
    {src ? (
      <img src={src} alt={name} className="h-full w-full object-cover" />
    ) : (
      name.slice(0, 2).toUpperCase()
    )}
  </div>
);

interface ChatPanelProps {
  messages: any[];
  currentUserId: string;
  getUserInfoSync: (id: string) => { name: string; avatar?: string | null };
  message: string;
  setMessage: (v: string) => void;
  onSend: () => void;
  sendLoading: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  getUserInfoSync,
  message,
  setMessage,
  onSend,
  sendLoading,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto p-3 lg:p-4">
        {messages.length === 0 && (
          <div className="mt-8 text-center text-xs text-[#6b5847]">
            No messages yet. Say hi! 👋
          </div>
        )}
        {messages.map((msg: any) => {
          const isOwn = msg.sender === currentUserId;
          const info = getUserInfoSync(msg.sender);
          return (
            <div
              key={msg.messageId}
              className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              <Avatar src={info.avatar} name={info.name} className="h-8 w-8" />
              <div className={`min-w-0 flex-1 ${isOwn ? "text-right" : ""}`}>
                <div
                  className={`mb-1 flex items-center gap-1.5 ${
                    isOwn ? "justify-end" : ""
                  }`}
                >
                  <span className="text-xs font-semibold text-[#4a3728]">
                    {isOwn ? "You" : info.name}
                  </span>
                  <span className="text-xs text-[#6b5847]">
                    {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`inline-block max-w-[85%] break-words rounded-2xl px-3 py-2 text-left text-sm ${
                    isOwn
                      ? "rounded-tr-sm bg-[#8b7355] text-white"
                      : "rounded-tl-sm bg-[#f6ede8] text-[#4a3728]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="shrink-0 border-t border-[#e0d8cf] bg-white/80 p-3 lg:p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Type a message..."
            className="min-w-0 flex-1 rounded-lg border-2 border-[#e0d8cf] px-3 py-2 text-sm text-[#4a3728] outline-none placeholder:text-[#6b5847]/50 focus:border-[#8b7355]"
          />
          <button
            onClick={onSend}
            disabled={sendLoading}
            aria-label="Send message"
            className="rounded-lg bg-[#8b7355] px-3 py-2 text-white transition-all hover:bg-[#6b5847] disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

interface MembersPanelProps {
  members: any[];
  currentUserId: string;
  memberSessionTimes: Record<string, number>;
}

const MembersPanel: React.FC<MembersPanelProps> = ({
  members,
  currentUserId,
  memberSessionTimes,
}) => (
  <div className="flex-1 space-y-2 overflow-y-auto p-3 lg:p-4">
    {members.length === 0 && (
      <div className="mt-8 text-center text-xs text-[#6b5847]">
        No members yet.
      </div>
    )}
    {members.map((m) => (
      <div
        key={m.userId || m.id}
        className={`rounded-lg p-3 transition-all ${
          m.isOnline ? "bg-[#f6ede8]" : "bg-gray-100 opacity-60"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar src={m.avatar} name={m.name} className="h-9 w-9" />
            {m.isOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-[#4a3728]">
              {m.userId === currentUserId ? "You" : m.name}
            </div>
            <div className="text-xs tabular-nums text-[#6b5847]">
              {formatTime(memberSessionTimes[m.userId] ?? 0)} •{" "}
              {m.role === "leader" ? "Leader" : `Rank #${m.rank}`}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

interface ControlProps {
  label: string;
  title?: string;
  className: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
  badge?: number;
}

const ControlButton: React.FC<ControlProps> = ({
  label,
  title,
  className,
  onClick,
  pressed,
  children,
  badge,
}) => (
  <div className="flex shrink-0 flex-col items-center gap-1">
    <button
      onClick={onClick}
      className={className}
      title={title ?? label}
      aria-label={title ?? label}
      aria-pressed={pressed}
    >
      {children}
      {!!badge && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
    <span className={CTRL_LABEL}>{label}</span>
  </div>
);

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

const GroupRoom: React.FC<GroupRoomProps> = ({ groupId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Render into document.body so the room escapes the app layout's stacking context
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [showAttendancePrompt, setShowAttendancePrompt] = useState(false);
  const attendanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const attendanceStatus = useAppSelector(selectAttendanceStatus);
  const attendanceCheckInLoading = useAppSelector(
    selectAttendanceCheckInLoading
  );

  const {
    fetchGroupMembers,
    groupMembers: enrichedMembers,
    getUserInfoSync,
  } = useGroupData();
  const fetchGroupMembersRef = useRef(fetchGroupMembers);
  useEffect(() => {
    fetchGroupMembersRef.current = fetchGroupMembers;
  }, [fetchGroupMembers]);

  const leaveWebRTCRoomRef = useRef<() => void>(() => {});

  // Side panel: one state instead of two booleans
  const [panel, setPanel] = useState<"chat" | "members" | null>(null);
  const togglePanel = (p: "chat" | "members") =>
    setPanel((prev) => (prev === p ? null : p));

  const [message, setMessage] = useState<string>("");
  const [studyTime, setStudyTime] = useState<number>(0);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const timerAnchorRef = useRef<{
    baseSeconds: number;
    anchorTimestamp: number;
  } | null>(null);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string>(
    DEFAULT_REMINDER_MESSAGE
  );
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  const groupData = useAppSelector(selectSelectedGroup);
  const isLoading = useAppSelector(selectSelectedGroupLoading);
  const rawMembers = useAppSelector(selectGroupMembers);
  const { user } = useAuth();
  const currentUserId = user?.userId ?? "";
  const activeSession = useAppSelector(selectActiveSession);
  const timerApiLoading = useAppSelector(selectTimerApiLoading);
  const activeSessionLoading = useAppSelector(
    (state: any) => state.timer.activeSessionLoading
  );
  const roomMessages = useAppSelector(selectMessagesByGroup(groupId));
  const sendLoading = useAppSelector(selectSendLoading);

  const activeLiveRoom = useAppSelector(selectActiveLiveRoom);
  const activeLiveRoomLoading = useAppSelector(selectActiveLiveRoomLoading);
  const liveRoomActionLoading = useAppSelector(selectLiveRoomActionLoading);
  const isCameraOn = useAppSelector(selectLocalCameraOn);
  const isMicOn = useAppSelector(selectLocalMicOn);

  /* ---------- camera preview (outside the live room) ---------- */
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

  const stopPreview = () => {
    previewStreamRef.current?.getTracks().forEach((t) => t.stop());
    previewStreamRef.current = null;
    setPreviewStream(null);
  };

  const toggleLocalCamera = async () => {
    if (isCameraOn) {
      stopPreview();
      dispatch(setLocalCamera(false));
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      previewStreamRef.current = s;
      setPreviewStream(s);
      dispatch(setLocalCamera(true));
    } catch (e) {
      console.error("Camera error:", e);
      alert("Camera access failed");
      dispatch(setLocalCamera(false));
    }
  };

  // unmount: camera off + Redux reset + WebRTC cleanup
  useEffect(() => {
    dispatch(setLocalCamera(false));
    dispatch(setLocalMic(false));
    return () => {
      previewStreamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        leaveWebRTCRoomRef.current?.();
      } catch {
        /* silent */
      }
    };
  }, [dispatch]);

  /* ---------- live room state ---------- */
  const [showLiveRoomModal, setShowLiveRoomModal] = useState(false);
  const [liveRoomTitle, setLiveRoomTitle] = useState("");
  const [liveRoomError, setLiveRoomError] = useState("");
  const [showLiveRoomView, setShowLiveRoomView] = useState(false);
  const liveRoomJoinInFlight = useRef(false);
  const isUserInLiveRoom = showLiveRoomView;

  const activeLiveRoomRef = useRef(activeLiveRoom);
  useEffect(() => {
    activeLiveRoomRef.current = activeLiveRoom;
  }, [activeLiveRoom]);

  const isLiveHost =
    !!activeLiveRoom &&
    (activeLiveRoom.host?._id === currentUserId ||
      activeLiveRoom.host === currentUserId);

  // Live room started / ended: socket events + resync on reconnect / visibility / every 15s
  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    let attached: ReturnType<typeof getSocket> = null;

    const closeCall = () => {
      leaveWebRTCRoomRef.current?.();
      setShowLiveRoomView(false);
      dispatch(clearActiveLiveRoom());
    };

    const handleLiveStarted = (payload: { groupId?: string }) => {
      if (payload?.groupId !== groupId) return;
      dispatch(fetchGroupActiveLiveRoomThunk(groupId));
    };
    const handleLiveEnded = (payload: { groupId?: string }) => {
      if (payload?.groupId !== groupId) return;
      closeCall();
    };

    const resync = async () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      )
        return;
      try {
        const room = await StudyGroupService.getGroupActiveLiveRoom(groupId);
        if (cancelled) return;
        const current = activeLiveRoomRef.current;

        if (!room) {
          if (current) closeCall();
          return;
        }
        if (current && current.roomId !== room.roomId) closeCall();
        if (!current || current.roomId !== room.roomId) {
          dispatch(fetchGroupActiveLiveRoomThunk(groupId));
        }
      } catch {
        // Network blip: keep current state
      }
    };

    const attachSocket = () => {
      const socket = getSocket();
      if (!socket || socket === attached) return;
      attached = socket;
      socket.on("live-room:started", handleLiveStarted);
      socket.on("live-room:ended", handleLiveEnded);
      socket.on("connect", resync);
    };

    attachSocket();
    const timer = setInterval(() => {
      attachSocket();
      void resync();
    }, 15_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void resync();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (attached) {
        attached.off("live-room:started", handleLiveStarted);
        attached.off("live-room:ended", handleLiveEnded);
        attached.off("connect", resync);
      }
    };
  }, [groupId, dispatch]);

  /* ---------- members / online ---------- */
  const rawOnlineMembers = useAppSelector(selectOnlineMembers(groupId));
  const onlineMembers = useMemo(() => {
    if (currentUserId && !rawOnlineMembers.includes(currentUserId)) {
      return [...rawOnlineMembers, currentUserId];
    }
    return rawOnlineMembers;
  }, [rawOnlineMembers, currentUserId]);

  const activeSessionMemberIds = useAppSelector(
    selectActiveSessionMemberIds(groupId)
  );
  const activeCount = useMemo(() => {
    const others = activeSessionMemberIds.filter(
      (id) => String(id) !== String(currentUserId)
    );
    return others.length + (isSessionActive ? 1 : 0);
  }, [activeSessionMemberIds, currentUserId, isSessionActive]);

  const userStreak = useAppSelector(selectUserStreak);
  const lastBroadcastRef = useRef<number>(0);
  const studyTimeRef = useRef<number>(studyTime);
  useEffect(() => {
    studyTimeRef.current = studyTime;
  }, [studyTime]);

  const memberSessionTimes = useAppSelector(selectMemberSessionTimes(groupId));
  const membersSource =
    enrichedMembers.length > 0 ? enrichedMembers : (rawMembers as any[]);
  const members =
    membersSource.length > 0
      ? membersSource.map((m: any, idx: number) => {
          const mUserId =
            typeof m.userId === "string"
              ? m.userId
              : m.userId?._id ||
                m.userId?.id ||
                m.userId?.userId ||
                m._id ||
                m.id ||
                "";
          const isOnline = onlineMembers.some(
            (onlineId) => String(onlineId) === String(mUserId)
          );
          const cachedUser = getUserInfoSync(mUserId);
          return {
            id: idx + 1,
            name:
              m.name ??
              cachedUser?.name ??
              (mUserId ? mUserId.slice(0, 8) : "Member"),
            avatar: m.avatar ?? cachedUser?.avatar ?? null,
            isOnline,
            isSpeaking: false,
            rank: idx + 1,
            userId: mUserId,
            role: m.role,
          };
        })
      : [];

  /* ---------- WebRTC ---------- */
  const liveRoomId = activeLiveRoom?.roomId ?? "";

  const {
    localStream,
    peers: webrtcPeers,
    isCameraOn: webrtcCameraOn,
    isMicOn: webrtcMicOn,
    isScreenSharing: webrtcScreenSharing,
    activeSpeakers,
    roomMode,
    error: webrtcError,
    roomEnded,
    joinRoom: joinWebRTCRoom,
    requestJoin: requestWebRTCJoin,
    leaveRoom: leaveWebRTCRoom,
    toggleCamera: toggleWebRTCCamera,
    toggleMic: toggleWebRTCMic,
    toggleScreenShare: toggleWebRTCScreenShare,
    startLocalStream,
  } = useLiveRoom({
    roomId: liveRoomId,
    userId: currentUserId,
    userName: user?.name ?? user?.email ?? "User",
    onPeerJoined: () => {},
    onPeerLeft: () => {},
    onQualityChange: (socketId, quality) => {
      if (quality === "poor") {
        console.warn("[LiveRoom] Poor connection for socket:", socketId);
      }
    },
  });

  useEffect(() => {
    leaveWebRTCRoomRef.current = leaveWebRTCRoom;
  }, [leaveWebRTCRoom]);

  const joinWebRTCRoomRef = useRef(joinWebRTCRoom);
  useEffect(() => {
    joinWebRTCRoomRef.current = joinWebRTCRoom;
  }, [joinWebRTCRoom]);

  const callPrefsRef = useRef({ cam: true, mic: true });
  callPrefsRef.current = { cam: webrtcCameraOn, mic: webrtcMicOn };

  // Network drop while in call: show "Reconnecting...", re-join automatically
  const [liveReconnecting, setLiveReconnecting] = useState(false);
  useEffect(() => {
    if (!showLiveRoomView || !groupId) return;
    const socket = getSocket();
    if (!socket) return;

    const RECONNECT_GRACE_MS = 30_000;
    let dropTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnecting = false;
    let busy = false;
    let prefs = { ...callPrefsRef.current };

    const clearDropTimer = () => {
      if (dropTimer) clearTimeout(dropTimer);
      dropTimer = null;
    };
    const stopReconnecting = () => {
      clearDropTimer();
      reconnecting = false;
      setLiveReconnecting(false);
    };
    const dropToJoinButton = (msg?: string) => {
      stopReconnecting();
      leaveWebRTCRoomRef.current?.();
      setShowLiveRoomView(false);
      dispatch(fetchGroupActiveLiveRoomThunk(groupId));
      if (msg) alert(msg);
    };

    const onDisconnect = (reason: string) => {
      if (reason === "io client disconnect") return;
      prefs = { ...callPrefsRef.current };
      reconnecting = true;
      setLiveReconnecting(true);
      if (reason === "io server disconnect") socket.connect();
      clearDropTimer();
      dropTimer = setTimeout(() => {
        if (reconnecting) {
          dropToJoinButton(
            "Connection lost. Press Join to re-enter the live room."
          );
        }
      }, RECONNECT_GRACE_MS);
    };

    const onConnect = async () => {
      if (!reconnecting || busy) return;
      busy = true;
      clearDropTimer();
      try {
        let room: any;
        try {
          room = await StudyGroupService.getGroupActiveLiveRoom(groupId);
        } catch {
          dropToJoinButton(
            "Connection lost. Press Join to re-enter the live room."
          );
          return;
        }
        const current = activeLiveRoomRef.current;
        if (!room || !current || room.roomId !== current.roomId) {
          stopReconnecting();
          leaveWebRTCRoomRef.current?.();
          setShowLiveRoomView(false);
          dispatch(clearActiveLiveRoom());
          if (room) dispatch(fetchGroupActiveLiveRoomThunk(groupId));
          return;
        }

        await dispatch(
          joinLiveRoomThunk({
            roomId: room.roomId,
            options: { cameraOn: prefs.cam, micOn: prefs.mic },
          })
        ).unwrap();
        leaveWebRTCRoomRef.current?.();
        const ok = await joinWebRTCRoomRef.current(prefs.cam, prefs.mic);
        if (ok) {
          stopReconnecting();
        } else {
          dropToJoinButton(
            "Could not reconnect to the live room. Press Join to try again."
          );
        }
      } catch {
        dropToJoinButton(
          "Could not reconnect to the live room. Press Join to try again."
        );
      } finally {
        busy = false;
      }
    };

    socket.on("disconnect", onDisconnect);
    socket.on("connect", onConnect);
    return () => {
      socket.off("disconnect", onDisconnect);
      socket.off("connect", onConnect);
      clearDropTimer();
      setLiveReconnecting(false);
    };
  }, [showLiveRoomView, groupId, dispatch]);

  // Host ended the live room
  useEffect(() => {
    if (!roomEnded) return;
    setShowLiveRoomView(false);
    if (groupId) dispatch(fetchGroupActiveLiveRoomThunk(groupId));
  }, [roomEnded]); // eslint-disable-line react-hooks/exhaustive-deps

  const camOn = showLiveRoomView ? webrtcCameraOn : isCameraOn;
  const micOn = showLiveRoomView ? webrtcMicOn : isMicOn;
  const selfStream = showLiveRoomView ? localStream : previewStream;

  /* ---------- handlers ---------- */
  const handleSendMessage = async (): Promise<void> => {
    if (!message.trim()) return;
    const textToSend = message;
    setMessage("");
    try {
      await dispatch(
        sendMessageThunk({
          groupId,
          data: { content: textToSend, messageType: "text" },
        })
      ).unwrap();
      // WORKAROUND: backend POST /chat/:groupId/send returns no saved message, so refetch.
      dispatch(fetchMessagesThunk({ groupId, params: { page: 1, limit: 30 } }));
    } catch (err) {
      setMessage(textToSend);
    }
  };

  const handleCheckIn = async () => {
    try {
      await dispatch(attendanceCheckInThunk(undefined)).unwrap();
      dispatch(fetchAttendanceStatusThunk({ force: true }));
      dispatch(fetchUserStreakThunk());
    } catch (err) {
      console.error("Check-in error:", err);
    }
  };

  const handleLeaveRoom = async (): Promise<void> => {
    if (window.confirm("Are you sure you want to leave this study session?")) {
      if (isSessionActive && activeSession?.sessionId) {
        try {
          await dispatch(stopTimerThunk(undefined)).unwrap();
          const socket = getSocket();
          if (socket?.connected) {
            socket.emit("session-paused", { groupId });
          }
          const hoursStudied = studyTime / 3600;
          if (hoursStudied > 0.1) {
            await dispatch(
              attendanceAutoMarkThunk({
                reason: "study_session",
                studyHours: hoursStudied,
              })
            )
              .unwrap()
              .catch(() => {});
            dispatch(fetchAttendanceStatusThunk({ force: true }));
            dispatch(fetchUserStreakThunk());
          }
        } catch (err) {
          /* silent */
        }
      }
      router.push("/study/my-groups");
    }
  };

  const handleStartLiveRoom = async (): Promise<void> => {
    const parsed = createLiveRoomSchema.safeParse({
      title: liveRoomTitle || `${groupData?.title ?? "Study"} - Live Session`,
      maxParticipants: LIVE_ROOM_MAX_PARTICIPANTS,
    });
    if (!parsed.success) {
      setLiveRoomError(parsed.error.errors[0].message);
      return;
    }
    if (liveRoomJoinInFlight.current || showLiveRoomView) return;
    liveRoomJoinInFlight.current = true;
    try {
      // 1. Create room
      const createdRoom = await dispatch(
        createLiveRoomThunk({ groupId, ...parsed.data })
      ).unwrap();

      const roomId = createdRoom?.roomId;
      if (!roomId) {
        setLiveRoomError("Failed to get room ID");
        return;
      }

      setShowLiveRoomModal(false);
      setLiveRoomTitle("");
      setLiveRoomError("");

      const userCam = isCameraOn;
      const userMic = isMicOn;

      // 2. HTTP join
      await dispatch(
        joinLiveRoomThunk({
          roomId,
          options: { cameraOn: userCam, micOn: userMic },
        })
      ).unwrap();

      // 3. Media
      stopPreview();
      const stream = await startLocalStream(userCam, userMic);
      if (!stream) {
        await dispatch(endLiveRoomThunk(roomId)).unwrap().catch(() => {});
        alert(
          "Could not access your camera/microphone. Allow access in the browser and try again."
        );
        return;
      }

      // 4. Socket join
      const socket = getSocket();
      if (!socket?.connected) {
        leaveWebRTCRoom();
        await dispatch(endLiveRoomThunk(roomId)).unwrap().catch(() => {});
        alert("Socket not connected");
        return;
      }
      const joined = await requestWebRTCJoin({
        roomId,
        cameraOn: userCam && stream.getVideoTracks().length > 0,
        micOn: userMic && stream.getAudioTracks().length > 0,
      });
      if (joined.status !== "ok") {
        leaveWebRTCRoom();
        await dispatch(endLiveRoomThunk(roomId)).unwrap().catch(() => {});
        alert(joined.message);
        return;
      }

      setShowLiveRoomView(true);
    } catch (err: any) {
      setLiveRoomError(
        typeof err === "string" ? err : "Failed to start live room"
      );
    } finally {
      liveRoomJoinInFlight.current = false;
    }
  };

  const handleJoinLiveRoom = async (): Promise<void> => {
    if (!activeLiveRoom?.roomId) return;
    if (liveRoomJoinInFlight.current || showLiveRoomView) return;
    liveRoomJoinInFlight.current = true;
    const roomId = activeLiveRoom.roomId;

    const userCam = isCameraOn;
    const userMic = isMicOn;
    // A host "leaving" ends the room, so never use leave to undo a host's join
    const joiningAsHost = isLiveHost;
    const undoHttpJoin = async () => {
      if (joiningAsHost) return;
      await dispatch(leaveLiveRoomThunk(roomId)).unwrap().catch(() => {});
    };

    try {
      await dispatch(
        joinLiveRoomThunk({
          roomId,
          options: { cameraOn: userCam, micOn: userMic },
        })
      ).unwrap();

      stopPreview();
      const stream = await startLocalStream(userCam, userMic);
      if (!stream) {
        await undoHttpJoin();
        return;
      }

      let socket = getSocket();
      if (socket && !socket.connected) {
        try {
          socket = initializeSocket();
        } catch {
          /* keep the current socket */
        }
        if (!socket.connected) {
          const sock = socket;
          await new Promise<void>((resolve) => {
            const t = setTimeout(resolve, 5000);
            sock.once("connect", () => {
              clearTimeout(t);
              resolve();
            });
          });
        }
      }
      if (!socket?.connected) {
        leaveWebRTCRoom();
        await undoHttpJoin();
        alert(
          "Could not reach the live server. Check your connection and try again."
        );
        return;
      }
      const joined = await requestWebRTCJoin({
        cameraOn: userCam && stream.getVideoTracks().length > 0,
        micOn: userMic && stream.getAudioTracks().length > 0,
      });
      if (joined.status !== "ok") {
        leaveWebRTCRoom();
        await undoHttpJoin();
        alert(joined.message);
        return;
      }

      setShowLiveRoomView(true);
    } catch (err: any) {
      alert(err || "Failed to join live room");
      if (groupId) dispatch(fetchGroupActiveLiveRoomThunk(groupId));
    } finally {
      liveRoomJoinInFlight.current = false;
    }
  };

  // Arrived from the "Live session started" popup (?joinLive=1)
  const autoJoinPending = useRef<boolean | null>(null);
  useEffect(() => {
    if (autoJoinPending.current === null) {
      autoJoinPending.current =
        new URLSearchParams(window.location.search).get("joinLive") === "1";
    }
    if (!autoJoinPending.current) return;

    const clearFlag = () => {
      autoJoinPending.current = false;
      const url = new URL(window.location.href);
      url.searchParams.delete("joinLive");
      window.history.replaceState(
        null,
        "",
        url.pathname + url.search + url.hash
      );
    };

    const roomId = activeLiveRoom?.roomId;
    if (roomId && !isLiveHost && !showLiveRoomView) {
      clearFlag();
      void handleJoinLiveRoom();
      return;
    }
    if (roomId) {
      clearFlag();
      return;
    }
    const t = setTimeout(clearFlag, 10000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLiveRoom?.roomId]);

  const handleEndOrLeaveLiveRoom = async (): Promise<void> => {
    if (!activeLiveRoom) return;
    if (isLiveHost && !window.confirm("End the live room for everyone?")) return;

    try {
      leaveWebRTCRoom();
      setShowLiveRoomView(false);

      if (isLiveHost) {
        await dispatch(endLiveRoomThunk(activeLiveRoom.roomId)).unwrap();
      } else {
        await dispatch(leaveLiveRoomThunk(activeLiveRoom.roomId)).unwrap();
      }
    } catch (err: any) {
      alert(err || "Failed to leave live room");
    }
  };

  const handleToggleSession = async (): Promise<void> => {
    try {
      if (!isSessionActive) {
        if (activeSession?.status === "paused") {
          const result = await dispatch(resumeTimerThunk()).unwrap();
          const resumedSeconds = Math.floor(
            result?.elapsedTime ?? activeSession?.elapsedTime ?? studyTime
          );
          setStudyTime(resumedSeconds);
          timerAnchorRef.current = {
            baseSeconds: resumedSeconds,
            anchorTimestamp: Date.now(),
          };
          setIsSessionActive(true);
        } else {
          await dispatch(
            startTimerThunk({
              subject: groupData?.category ?? "Study Session",
              notes: `Group: ${groupData?.title ?? groupId}`,
            })
          ).unwrap();
          setStudyTime(0);
          timerAnchorRef.current = {
            baseSeconds: 0,
            anchorTimestamp: Date.now(),
          };
          setIsSessionActive(true);
        }
        try {
          await dispatch(
            attendanceAutoMarkThunk({ reason: "study_session", studyHours: 0 })
          ).unwrap();
          dispatch(fetchAttendanceStatusThunk({ force: true }));
          dispatch(fetchUserStreakThunk());
        } catch {
          /* silent */
        }
      } else {
        await dispatch(pauseTimerThunk()).unwrap();
        timerAnchorRef.current = null;
        setIsSessionActive(false);
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("session-paused", { groupId });
        }
      }
    } catch (err: any) {
      console.error("Timer error:", err);
      setIsSessionActive((prev) => !prev);
    }
  };

  const handleSendNotification = (): void => {
    const text = reminderMessage.trim();
    if (!text) return;
    // TODO: wire to a real "remind inactive members" API
    alert(`Study reminder sent to all inactive members!\n\n"${text}"`);
    setShowNotificationPopup(false);
    setReminderMessage(DEFAULT_REMINDER_MESSAGE);
  };

  /* ---------- session timer ---------- */
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const broadcastCurrentTime = (forcedTime?: number) => {
      if (!timerAnchorRef.current) return;
      const elapsedSinceAnchor = Math.floor(
        (Date.now() - timerAnchorRef.current.anchorTimestamp) / 1000
      );
      const currentStudyTime =
        forcedTime ?? timerAnchorRef.current.baseSeconds + elapsedSinceAnchor;
      lastBroadcastRef.current = Date.now();
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("broadcast-session-time", {
          groupId,
          elapsedTime: currentStudyTime,
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && timerAnchorRef.current) {
        const elapsedSinceAnchor = Math.floor(
          (Date.now() - timerAnchorRef.current.anchorTimestamp) / 1000
        );
        const currentStudyTime =
          timerAnchorRef.current.baseSeconds + elapsedSinceAnchor;
        setStudyTime(currentStudyTime);
        broadcastCurrentTime(currentStudyTime);
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("get-active-members", { groupId });
        }
      }
    };

    if (isSessionActive) {
      if (!timerAnchorRef.current) {
        timerAnchorRef.current = {
          baseSeconds: studyTimeRef.current,
          anchorTimestamp: Date.now(),
        };
      }

      document.addEventListener("visibilitychange", handleVisibilityChange);

      timer = setInterval(() => {
        if (!timerAnchorRef.current) return;
        const elapsedSinceAnchor = Math.floor(
          (Date.now() - timerAnchorRef.current.anchorTimestamp) / 1000
        );
        const currentStudyTime =
          timerAnchorRef.current.baseSeconds + elapsedSinceAnchor;
        setStudyTime(currentStudyTime);

        const now = Date.now();
        if (now - lastBroadcastRef.current >= 5000) {
          broadcastCurrentTime(currentStudyTime);
        }
      }, 1000);
    } else {
      timerAnchorRef.current = null;
    }

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSessionActive, groupId]);

  /* ---------- data loading (critical first, the rest after first paint) ---------- */
  useEffect(() => {
    if (!groupId) return;

    // Critical for first paint
    dispatch(fetchGroupByIdThunk(groupId));
    dispatch(fetchGroupMembersThunk(groupId));
    fetchGroupMembersRef.current?.(groupId); // enriched names/avatars (useGroupData)
    dispatch(getActiveTimerThunk());
    dispatch(fetchGroupActiveLiveRoomThunk(groupId));

    // Non-critical: after first paint
    const w = window as any;
    const idle: (cb: () => void) => any =
      w.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300));
    const cancelIdle: (h: any) => void = w.cancelIdleCallback ?? clearTimeout;
    const handle = idle(() => {
      dispatch(fetchAttendanceStatusThunk());
      dispatch(fetchUserStreakThunk());
      dispatch(getTimerStatsThunk());
    });

    return () => {
      cancelIdle(handle);
      dispatch(clearSelectedGroup());
      dispatch(clearActiveLiveRoom());
    };
  }, [groupId, dispatch]);

  // Chat history loads only when the chat panel is first opened
  const chatLoadedRef = useRef(false);
  useEffect(() => {
    if (panel === "chat" && !chatLoadedRef.current) {
      chatLoadedRef.current = true;
      dispatch(fetchMessagesThunk({ groupId, params: { page: 1, limit: 30 } }));
    }
  }, [panel, groupId, dispatch]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleUserJoined = () => {
      dispatch(fetchGroupMembersThunk(groupId));
      fetchGroupMembersRef.current?.(groupId);
      dispatch(fetchGroupByIdThunk(groupId));
    };
    socket.on("user-joined-group", handleUserJoined);
    return () => {
      socket.off("user-joined-group", handleUserJoined);
    };
  }, [groupId, dispatch]);

  useEffect(() => {
    if (activeSession?.status === "active") {
      setIsSessionActive(true);
      if (
        activeSession.elapsedTime !== undefined &&
        activeSession.elapsedTime !== null
      ) {
        const serverSeconds = Math.floor(activeSession.elapsedTime);
        setStudyTime(serverSeconds);
        timerAnchorRef.current = {
          baseSeconds: serverSeconds,
          anchorTimestamp: Date.now(),
        };
      }
    } else if (activeSession?.status === "paused") {
      setIsSessionActive(false);
      timerAnchorRef.current = null;
      if (
        activeSession.elapsedTime !== undefined &&
        activeSession.elapsedTime !== null
      ) {
        setStudyTime(Math.floor(activeSession.elapsedTime));
      }
    } else if (!activeSession) {
      setIsSessionActive(false);
      timerAnchorRef.current = null;
      setStudyTime(0);
    }
  }, [activeSession]);

  useEffect(() => {
    if (isSessionActive && !attendanceStatus?.hasCheckedInToday) {
      attendanceTimerRef.current = setTimeout(() => {
        setShowAttendancePrompt(true);
      }, 5 * 60 * 1000);
    }
    return () => {
      if (attendanceTimerRef.current) {
        clearTimeout(attendanceTimerRef.current);
      }
    };
  }, [isSessionActive, attendanceStatus?.hasCheckedInToday]);

  useChatSocket(groupId);

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  if (!mounted) return null;

  // Block only while there is no data at all; otherwise show the page and let parts fill in
  if (isLoading && !groupData) {
    return createPortal(<RoomSkeleton />, document.body);
  }

  if (!groupData) {
    return createPortal(
      <div className="fixed inset-0 z-[60] flex h-[100dvh] items-center justify-center bg-gradient-to-br from-[#f6ede8] to-[#e0d8cf] p-4">
        <div className="text-center">
          <p className="mb-2 text-lg font-bold text-[#4a3728]">Group not found</p>
          <button
            onClick={() => router.push("/study/my-groups")}
            className="rounded-lg bg-[#8b7355] px-4 py-2 font-semibold text-white"
          >
            Back to My Groups
          </button>
        </div>
      </div>,
      document.body
    );
  }

  if (webrtcError) {
    console.error("[WebRTC Error]", webrtcError);
  }

  const onlineOthers = members.filter(
    (m) => m.isOnline && m.userId !== currentUserId
  );
  const onlineCount = members.filter((m) => m.isOnline).length;
  const inactiveCount = Math.max(
    0,
    (groupData.currentMemberCount ?? 0) - onlineCount
  );
  const tileCount = onlineOthers.length + 1;
  const selfName = user?.name ?? user?.email ?? "You";
  const selfInitials = (user?.name ?? user?.email ?? "Y")
    .slice(0, 2)
    .toUpperCase();

  const gridCols =
    tileCount === 1
      ? "grid-cols-1 max-w-3xl"
      : tileCount <= 4
      ? "grid-cols-2 max-w-5xl"
      : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl";

  const sessionBusy = timerApiLoading || activeSessionLoading;

  const renderTabs = (showClose: boolean) => (
    <div className="flex shrink-0 border-b border-[#e0d8cf]">
      {(
        [
          ["chat", "Chat", <MessageCircle key="c" size={15} />],
          [
            "members",
            `Members (${groupData.currentMemberCount ?? rawMembers.length})`,
            <Users key="m" size={15} />,
          ],
        ] as const
      ).map(([key, label, icon]) => (
        <button
          key={key}
          onClick={() => setPanel(key)}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-sm font-semibold transition-all ${
            panel === key
              ? "border-b-4 border-[#8b7355] bg-[#f6ede8] text-[#4a3728]"
              : "text-[#6b5847] hover:bg-[#f6ede8]"
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
      {showClose && (
        <button
          onClick={() => setPanel(null)}
          aria-label="Close panel"
          className="p-3 text-[#6b5847]"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );

  const panelBody =
    panel === "chat" ? (
      <ChatPanel
        messages={roomMessages}
        currentUserId={currentUserId}
        getUserInfoSync={getUserInfoSync as any}
        message={message}
        setMessage={setMessage}
        onSend={handleSendMessage}
        sendLoading={sendLoading}
      />
    ) : panel === "members" ? (
      <MembersPanel
        members={members}
        currentUserId={currentUserId}
        memberSessionTimes={memberSessionTimes as any}
      />
    ) : null;

  const modalOverlay =
    "fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4";

  return createPortal(
    <div className="fixed inset-0 z-[60] flex h-[100dvh] flex-col bg-gradient-to-br from-[#f6ede8] via-[#efe4da] to-[#e0d8cf]">
      {/* ================= Header ================= */}
      <header className="shrink-0 border-b border-white/50 bg-white/50 px-3 py-2 shadow-sm backdrop-blur-xl sm:px-6 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => router.push("/study/my-groups")}
            aria-label="Back"
            className="rounded-full p-2 text-[#6b5847] hover:bg-white/70"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-bold text-[#4a3728] sm:text-xl">
                {groupData.title}
              </h1>
              {groupData.leaderId === currentUserId && (
                <span className="hidden shrink-0 rounded-full bg-[#8b7355] px-2 py-0.5 text-[10px] font-bold text-white sm:inline">
                  Host
                </span>
              )}
            </div>
            <p className="truncate text-xs text-[#6b5847]">{groupData.category}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center gap-2 rounded-xl bg-white/70 px-2.5 py-1 text-base font-bold tabular-nums sm:px-4 sm:text-2xl ${
                isSessionActive ? "text-green-600" : "text-[#4a3728]"
              }`}
            >
              {isSessionActive && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              )}
              {formatTime(studyTime)}
            </div>
            <div
              className="hidden items-center gap-1 rounded-xl bg-white/70 px-3 py-1.5 text-sm font-bold text-[#4a3728] sm:flex"
              title="Active now"
            >
              <Users size={14} /> {activeCount}/{groupData.currentMemberCount}
            </div>
            <div
              className="hidden items-center gap-1 rounded-xl bg-white/70 px-3 py-1.5 text-sm font-bold text-[#8b7355] md:flex"
              title="Day streak"
            >
              🔥 {userStreak ?? 0}
            </div>
          </div>

          <button
            onClick={handleToggleSession}
            disabled={sessionBusy}
            className={isSessionActive ? HDR_AMBER : HDR_PRIMARY}
          >
            {isSessionActive ? <Pause size={15} /> : <Play size={15} />}
            <span className="hidden sm:inline">
              {isSessionActive
                ? "Pause"
                : activeSession?.status === "paused"
                ? "Resume"
                : "Start"}
            </span>
          </button>
          <button
            onClick={handleLeaveRoom}
            aria-label="Leave"
            className={HDR_DANGER_OUTLINE}
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Secondary actions: horizontal scroll chips, work at every width */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-sm:[mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]">
          <button
            onClick={() => setShowAnnouncementModal(true)}
            className={HDR_OUTLINE}
          >
            <Megaphone size={15} /> Announcements
          </button>

          {attendanceStatus?.hasCheckedInToday ? (
            <button
              disabled
              className={`${HDR_BTN} cursor-default border border-[#c9d4bd] bg-[#e6ece0] text-[#4f6b3a] disabled:opacity-100`}
            >
              <CheckCircle2 size={15} /> Checked in
            </button>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={attendanceCheckInLoading}
              className={HDR_WARM}
            >
              <CheckCircle2 size={15} />
              {attendanceCheckInLoading ? "Checking in..." : "Check in"}
            </button>
          )}

          {activeLiveRoom ? (
            <>
              <span className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-red-500/20 bg-red-500/10 px-3 text-xs font-semibold text-red-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                Live
              </span>
              {!isUserInLiveRoom && (
                <button
                  onClick={handleJoinLiveRoom}
                  disabled={liveRoomActionLoading}
                  className={HDR_WARM}
                >
                  Enter room
                </button>
              )}
              {isLiveHost && (
                <button
                  onClick={handleEndOrLeaveLiveRoom}
                  disabled={liveRoomActionLoading}
                  className={HDR_DANGER}
                >
                  End room
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setShowLiveRoomModal(true)}
              disabled={liveRoomActionLoading || activeLiveRoomLoading}
              className={HDR_OUTLINE}
            >
              <Video size={15} /> Start live room
            </button>
          )}

          <button
            onClick={() => router.push(`/study/my-groups/${groupId}/chat`)}
            className={HDR_OUTLINE}
          >
            <MessageCircle size={15} /> Chat room
          </button>
        </div>
      </header>

      {/* ================= Main ================= */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="mx-auto flex min-h-full flex-col items-center justify-center gap-5">
            <div className={`grid w-full gap-3 sm:gap-4 ${gridCols}`}>
              <ParticipantTile
                isSelf
                name="You"
                initials={selfInitials}
                avatar={user?.avatar}
                time={studyTime}
                stream={selfStream}
                camOn={camOn}
                micOn={micOn}
                badge={
                  <>
                    {isUserInLiveRoom && activeLiveRoom && (
                      <span className="mr-1.5 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        LIVE
                      </span>
                    )}
                    {isSessionActive ? (
                      <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        ACTIVE
                      </span>
                    ) : (
                      activeSession?.status === "paused" && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          PAUSED
                        </span>
                      )
                    )}
                  </>
                }
              />
              {onlineOthers.map((m) => (
                <ParticipantTile
                  key={m.userId || m.id}
                  name={m.name.split(" ")[0]}
                  initials={m.name.slice(0, 2).toUpperCase()}
                  avatar={m.avatar}
                  time={memberSessionTimes[m.userId] ?? 0}
                  micOn={false}
                  speaking={m.isSpeaking}
                  badge={
                    <span className="rounded-full bg-[#8b7355] px-2 py-0.5 text-[10px] font-bold text-white">
                      {m.role === "leader" ? "👑" : `#${m.rank}`}
                    </span>
                  }
                />
              ))}
            </div>

            {onlineOthers.length === 0 && (
              <div className="flex items-center gap-2 rounded-full border border-[#d4c4b5] bg-white/70 px-4 py-2 text-sm text-[#6b5847]">
                <Users size={16} className="text-[#8b7355]" />
                Waiting for other members to come online.
              </div>
            )}
          </div>
        </main>

        {/* Desktop / tablet side panel */}
        {panel && (
          <aside className="hidden w-72 shrink-0 flex-col overflow-hidden border-l-2 border-[#e0d8cf] bg-white/80 backdrop-blur-md md:flex lg:w-80">
            {renderTabs(false)}
            {panelBody}
          </aside>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {panel && (
        <div
          className="fixed inset-0 z-[65] bg-black/50 md:hidden"
          onClick={() => setPanel(null)}
        >
          <div
            className="absolute inset-x-0 bottom-0 flex h-[70dvh] flex-col rounded-t-2xl border-t-2 border-white/40 bg-white/95 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {renderTabs(true)}
            {panelBody}
          </div>
        </div>
      )}

      {/* ================= Bottom dock ================= */}
      <div className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto flex w-fit max-w-full items-start gap-2 overflow-x-auto rounded-3xl border border-white/60 bg-white/60 px-3 py-2 shadow-xl backdrop-blur-xl [scrollbar-width:none] sm:gap-4 sm:px-5 [&::-webkit-scrollbar]:hidden">
          <ControlButton
            label={micOn ? "Mute" : "Unmute"}
            title={micOn ? "Mute microphone" : "Unmute microphone"}
            className={micOn ? CTRL_TAN : CTRL_RED}
            pressed={!micOn}
            onClick={() => {
              if (showLiveRoomView) {
                toggleWebRTCMic();
                getSocket()?.emit("toggle-mic", {
                  roomId: activeLiveRoom?.roomId,
                  micOn: !webrtcMicOn,
                });
                dispatch(setLocalMic(!webrtcMicOn));
              } else {
                dispatch(setLocalMic(!isMicOn));
              }
            }}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </ControlButton>

          <ControlButton
            label={camOn ? "Stop video" : "Start video"}
            title={camOn ? "Turn off camera" : "Turn on camera"}
            className={camOn ? CTRL_TAN : CTRL_RED}
            pressed={!camOn}
            onClick={async () => {
              if (showLiveRoomView) {
                await toggleWebRTCCamera();
                getSocket()?.emit("toggle-camera", {
                  roomId: activeLiveRoom?.roomId,
                  cameraOn: !webrtcCameraOn,
                });
                dispatch(setLocalCamera(!webrtcCameraOn));
              } else {
                await toggleLocalCamera();
              }
            }}
          >
            {camOn ? <Video size={20} /> : <VideoOff size={20} />}
          </ControlButton>

          <ControlButton
            label="Remind"
            title="Remind inactive members"
            className={CTRL_DARK}
            badge={inactiveCount}
            onClick={() => setShowNotificationPopup((v) => !v)}
          >
            <Bell size={20} />
          </ControlButton>

          <ControlButton
            label="Challenge"
            title="Start group challenge"
            className={CTRL_DARK}
            onClick={() => setShowChallengeModal(true)}
          >
            <Zap size={20} />
          </ControlButton>

          <ControlButton
            label="Chat"
            title="Toggle chat panel"
            className={panel === "chat" ? CTRL_TAN : CTRL_DARK}
            pressed={panel === "chat"}
            onClick={() => togglePanel("chat")}
          >
            <MessageCircle size={20} />
          </ControlButton>

          <ControlButton
            label="Members"
            title="Toggle members panel"
            className={panel === "members" ? CTRL_TAN : CTRL_DARK}
            pressed={panel === "members"}
            onClick={() => togglePanel("members")}
          >
            <Users size={20} />
          </ControlButton>
        </div>
      </div>

      {/* ================= Modals ================= */}

      {/* Reminder */}
      {showNotificationPopup && (
        <div className={modalOverlay} onClick={() => setShowNotificationPopup(false)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f6ede8]">
                <Bell size={24} className="text-[#8b7355]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#4a3728]">
                  Send study reminder
                </h3>
                <p className="text-xs text-[#6b5847]">Motivate inactive members</p>
              </div>
            </div>

            <div className="mb-4 rounded-lg bg-[#f6ede8] p-4">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="reminder-message"
                  className="text-sm font-semibold text-[#4a3728]"
                >
                  Message to send
                </label>
                {reminderMessage !== DEFAULT_REMINDER_MESSAGE && (
                  <button
                    type="button"
                    onClick={() => setReminderMessage(DEFAULT_REMINDER_MESSAGE)}
                    className="text-xs font-medium text-[#8b7355] underline hover:text-[#4a3728]"
                  >
                    Reset to default
                  </button>
                )}
              </div>
              <textarea
                id="reminder-message"
                value={reminderMessage}
                onChange={(e) =>
                  setReminderMessage(e.target.value.slice(0, REMINDER_MAX_LENGTH))
                }
                rows={4}
                maxLength={REMINDER_MAX_LENGTH}
                className="w-full resize-none rounded-lg border-2 border-[#e0d8cf] bg-white px-3 py-2 text-sm text-[#4a3728] outline-none focus:border-[#8b7355]"
              />
              <p className="mt-1 text-right text-xs text-[#6b5847]">
                {reminderMessage.length}/{REMINDER_MAX_LENGTH}
              </p>
            </div>

            <div className="mb-4 flex items-center justify-between text-xs text-[#6b5847]">
              <span>Will notify:</span>
              <span className="font-semibold text-[#4a3728]">
                {inactiveCount} inactive members
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNotificationPopup(false)}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2.5 font-semibold text-[#4a3728] transition-all hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                disabled={!reminderMessage.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#8b7355] px-4 py-2.5 font-semibold text-white transition-all hover:bg-[#6b5847] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} /> Send reminder
              </button>
            </div>
          </div>
        </div>
      )}

      <GroupChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        groupId={groupId}
        resolveName={(id: string) => getUserInfoSync(id)?.name ?? ""}
      />

      {/* Announcements (demo content: replace with a real API) */}
      {showAnnouncementModal && (
        <div className={modalOverlay} onClick={() => setShowAnnouncementModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Megaphone size={24} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#4a3728]">
                  Group announcements
                </h3>
                <p className="text-xs text-[#6b5847]">Important updates from host</p>
              </div>
            </div>

            <div className="mb-5 max-h-[60vh] space-y-3 overflow-y-auto">
              <div className="rounded-xl border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Crown size={14} className="text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">Host</span>
                  </div>
                  <span className="text-xs text-[#6b5847]">2 hours ago</span>
                </div>
                <p className="mb-1 text-sm font-medium text-[#4a3728]">
                  📚 Important: Today&apos;s Focus
                </p>
                <p className="text-sm text-[#6b5847]">
                  Let&apos;s aim for 6+ hours today! Remember to take breaks every
                  90 minutes. We&apos;re almost at our group goal! 💪
                </p>
              </div>

              <div className="rounded-xl border-l-4 border-[#8b7355] bg-[#f6ede8] p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Crown size={14} className="text-[#8b7355]" />
                    <span className="text-xs font-semibold text-[#6b5847]">Host</span>
                  </div>
                  <span className="text-xs text-[#6b5847]">Yesterday</span>
                </div>
                <p className="mb-1 text-sm font-medium text-[#4a3728]">
                  🎉 Milestone Achieved!
                </p>
                <p className="text-sm text-[#6b5847]">
                  Congrats everyone! We&apos;ve completed 15 days streak as a
                  group. Keep up the amazing work!
                </p>
              </div>

              <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700">System</span>
                  </div>
                  <span className="text-xs text-[#6b5847]">3 days ago</span>
                </div>
                <p className="mb-1 text-sm font-medium text-[#4a3728]">ℹ️ New Feature</p>
                <p className="text-sm text-[#6b5847]">
                  You can now track your individual progress in real-time. Check
                  the timer at the top of the room!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAnnouncementModal(false)}
              className="w-full rounded-lg bg-gray-200 px-4 py-2.5 font-semibold text-[#4a3728] transition-all hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Start live room */}
      {showLiveRoomModal && (
        <div className={modalOverlay} onClick={() => setShowLiveRoomModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-[#4a3728]">Start live room</h3>
            <input
              type="text"
              value={liveRoomTitle}
              onChange={(e) => {
                setLiveRoomTitle(e.target.value);
                setLiveRoomError("");
              }}
              placeholder={`${groupData?.title ?? "Study"} - Live Session`}
              className="mb-2 w-full rounded-xl border-2 border-[#e0d8cf] px-4 py-3 text-sm outline-none focus:border-[#8b7355]"
            />
            {liveRoomError && (
              <p className="mb-3 text-xs text-red-500">{liveRoomError}</p>
            )}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setShowLiveRoomModal(false);
                  setLiveRoomError("");
                }}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleStartLiveRoom}
                disabled={liveRoomActionLoading}
                className="flex-1 rounded-lg bg-[#4a3728] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3a2a1e] disabled:opacity-50"
              >
                {liveRoomActionLoading ? "Starting..." : "Start"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLiveRoomView && liveReconnecting && (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-[110] -translate-x-1/2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-lg"
        >
          Connection lost. Reconnecting…
        </div>
      )}

      {showLiveRoomView && activeLiveRoom && (
        <div className="fixed inset-0 z-[100] bg-black">
          <LiveRoomView
            localStream={localStream}
            currentUserId={currentUserId}
            localUserName={selfName}
            localUserAvatar={user?.avatar ?? null}
            isCameraOn={webrtcCameraOn}
            isMicOn={webrtcMicOn}
            isScreenSharing={webrtcScreenSharing}
            peers={webrtcPeers}
            activeSpeakers={activeSpeakers}
            roomMode={roomMode}
            roomTitle={activeLiveRoom.title}
            onToggleCamera={async () => {
              await toggleWebRTCCamera();
              getSocket()?.emit("toggle-camera", {
                roomId: activeLiveRoom.roomId,
                cameraOn: !webrtcCameraOn,
              });
              dispatch(setLocalCamera(!webrtcCameraOn));
            }}
            onToggleMic={() => {
              toggleWebRTCMic();
              getSocket()?.emit("toggle-mic", {
                roomId: activeLiveRoom.roomId,
                micOn: !webrtcMicOn,
              });
              dispatch(setLocalMic(!webrtcMicOn));
            }}
            onToggleScreenShare={async () => {
              await toggleWebRTCScreenShare();
              getSocket()?.emit("toggle-screen-share", {
                roomId: activeLiveRoom.roomId,
                sharing: !webrtcScreenSharing,
              });
              dispatch(setLocalScreenShare(!webrtcScreenSharing));
            }}
            onLeave={handleEndOrLeaveLiveRoom}
          />
        </div>
      )}

      {showAttendancePrompt && !attendanceStatus?.hasCheckedInToday && (
        <div className={modalOverlay}>
          <div className="w-full max-w-sm rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl">
            <div className="mb-4 text-center">
              <div className="mb-2 text-4xl">✅</div>
              <h3 className="text-lg font-bold text-[#4a3728]">
                Mark your attendance
              </h3>
              <p className="mt-1 text-sm text-[#6b5847]">
                You&apos;ve been studying for 5 minutes. Mark today&apos;s
                attendance?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAttendancePrompt(false)}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-[#4a3728]"
              >
                Later
              </button>
              <button
                onClick={async () => {
                  await dispatch(attendanceCheckInThunk(undefined));
                  setShowAttendancePrompt(false);
                }}
                disabled={attendanceCheckInLoading}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                Mark attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default GroupRoom;