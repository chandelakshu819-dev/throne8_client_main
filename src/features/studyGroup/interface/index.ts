import { RemotePeer, RoomMode } from "@/lib/webRtc/types";
import { TabId } from "../types";

export interface Group {
    id: number;
    title: string;
    description: string;
    category: string;
    rank: number;
    visibility: 'public' | 'private';
    cameraOn: boolean;
    members: number;
    capacity: number;
    leader: string;
    goalHours: number;
    attendanceAvg: number;
    // my-groups specific fields
    isCreator?: boolean;
    joinedDate?: string;
    lastActive?: string;
    streak?: number;
    studyTime?: number;
    attendance?: number;
    cameraRequired?: boolean;
}

export interface PublicGroup {
    id: number;
    title: string;
    members: number;
}

export interface Group {
    id: number;
    title: string;
    description: string;
    category: string;
    rank: number;
    visibility: 'public' | 'private';
    cameraOn: boolean;
    members: number;
    capacity: number;
    leader: string;
    goalHours: number;
    attendanceAvg: number;
    isCreator?: boolean;
    joinedDate?: string;
    lastActive?: string;
    streak?: number;
    studyTime?: number;
    attendance?: number;
    cameraRequired?: boolean;
}


export interface PublicGroup {
    id: number;
    title: string;
    members: number;
}

export interface ApiGroup {
    _id: string;
    groupId: string;
    title: string;
    description?: string;
    category: string;
    visibility: 'public' | 'private';
    capacity: number;
    currentMemberCount: number;
    leaderId: string;
    goalHours?: number;
    tags?: string[];
    joinCode?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    memberRole?: string;
    isMember?: boolean;
}

export interface PaginationResult {
    page: number;
    limit: number;
    skip: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface Member {
    id: number;
    name: string;
    avatar: string;
    isOnline: boolean;
    isSpeaking: boolean;
    studyTime: number;
    rank: number;
    videoEnabled: boolean;
    audioEnabled: boolean;
}

export interface Message {
    id: number;
    sender: string;
    avatar: string;
    message: string;
    timestamp: string;
    isOwn: boolean;
}

export interface GroupData {
    id: number;
    title: string;
    description: string;
    category: string;
    members: number;
    capacity: number;
    goalHours: number;
    cameraRequired: boolean;
    isCreator: boolean;
    currentStreak: number;
}


export interface VideoTileProps {
    stream: MediaStream | null;
    isMuted?: boolean;   // mute the <video> audio (always mute local)
    className?: string;
    autoPlay?: boolean;
}

export interface PeerTileProps {
    peer: RemotePeer;
    isPinned: boolean;
    isSpeaking: boolean;
    onPin: (socketId: string) => void;
}

export interface LocalTileProps {
    stream: MediaStream | null;
    isCameraOn: boolean;
    isMicOn: boolean;
    isScreenSharing: boolean;
    userName?: string;
    userAvatar?: string | null;
    isPinned: boolean;
    onPin: () => void;
}

// ✅ LAGAO
export interface LiveRoomViewProps {
    // Local media — GroupRoom se aata hai
    localStream: MediaStream | null;
    isCameraOn: boolean;
    isMicOn: boolean;
    isScreenSharing: boolean;

    // Remote peers — GroupRoom se aata hai
    peers: RemotePeer[];
    activeSpeakers: string[];
    roomMode: RoomMode;
    roomTitle?: string;

    // Local user display info
    currentUserId: string;
    localUserName?: string;
    localUserAvatar?: string | null;

    // Controls — GroupRoom ke handlers
    onToggleCamera: () => void;
    onToggleMic: () => void;
    onToggleScreenShare: () => void;
    onLeave: () => void;
}


export interface Tab {
    id: TabId;
    label: string;
}

export interface TabTimer {
  id: 'pomodoro' | 'focus' | 'timer';
  name: string;
}
