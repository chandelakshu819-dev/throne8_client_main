// src/features/study-group/components/my-groups/LiveRoomView.tsx
'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  memo,
} from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Pin,
  PinOff,
  Wifi,
  WifiOff,
  AlertTriangle,
  Monitor,
  Users,
} from 'lucide-react';
import { RemotePeer, ConnectionQuality, RoomMode, useLiveRoom } from '@/core/webrtc/useLiveRoom';

// ─── Prop types ─────────────────────────────────────────────────

interface VideoTileProps {
  stream?: MediaStream | null;
  isMuted?: boolean;
  className?: string;
  autoPlay?: boolean;
}

interface PeerTileProps {
  peer: RemotePeer;
  isPinned: boolean;
  isSpeaking: boolean;
  onPin: (socketId: string) => void;
}

interface LocalTileProps {
  stream?: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  userName?: string | null;
  userAvatar?: string | null;
  isPinned: boolean;
  onPin: () => void;
}

interface LiveRoomViewProps {
  localStream?: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  peers: RemotePeer[];
  activeSpeakers: string[];
  roomMode: RoomMode;
  roomTitle?: string;
  currentUserId?: string;
  localUserName?: string | null;
  localUserAvatar?: string | null;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}

// ─── Quality badge ─────────────────────────────────────────────
// ─── Quality badge ─────────────────────────────────────────────

const QualityBadge = memo(({ quality }: { quality: ConnectionQuality }) => {
  const map: Record<ConnectionQuality, { color: string; label: string }> = {
    excellent: { color: 'text-emerald-400', label: 'HD' },
    good: { color: 'text-amber-400', label: 'OK' },
    poor: { color: 'text-red-400', label: 'Poor' },
    disconnected: { color: 'text-gray-500', label: '—' },
  };
  const { color, label } = map[quality];
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>
      {label}
    </span>
  );
});
QualityBadge.displayName = 'QualityBadge';

// ─── Video element ─────────────────────────────────────────────

const VideoElement = memo(({
  stream,
  isMuted = false,
  className = '',
  autoPlay = true,
}: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (stream && el.srcObject !== stream) {
      el.srcObject = stream;
    } else if (!stream) {
      el.srcObject = null;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay={autoPlay}
      playsInline
      muted={isMuted}
      className={`w-full h-full object-cover ${className}`}
    />
  );
});
VideoElement.displayName = 'VideoElement';

// ─── Avatar fallback ───────────────────────────────────────────

const AvatarFallback = memo(({
  name = 'User',
  avatar,
  size = 'md',
}: {
  name?: string;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizeMap = { sm: 'w-10 h-10 text-sm', md: 'w-16 h-16 text-xl', lg: 'w-24 h-24 text-3xl' };
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col items-center gap-2">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className={`${sizeMap[size]} rounded-full object-cover border-2 border-white/20`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-[#8b7355] to-[#4a3728]
            flex items-center justify-center font-bold text-white border-2 border-white/20`}
        >
          {initials}
        </div>
      )}
      <span className="text-white/80 text-xs font-medium">{name}</span>
    </div>
  );
});
AvatarFallback.displayName = 'AvatarFallback';

// ─── Peer tile ─────────────────────────────────────────────────

const PeerTile = memo(({
  peer,
  isPinned,
  isSpeaking,
  onPin,
}: PeerTileProps) => {
  const hasVideo = peer.cameraOn && peer.stream !== null;

  return (
    <div
      className={`
        relative w-full h-full rounded-xl overflow-hidden
        bg-gradient-to-br from-[#2a1f18] to-[#1a1208]
        border transition-all duration-300 group cursor-pointer select-none
        ${isSpeaking
          ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
          : isPinned
            ? 'border-[#8b7355]/70'
            : 'border-white/10 hover:border-white/20'
        }
      `}
      onClick={() => onPin(peer.socketId)}
    >
      {/* Video or avatar */}
      {hasVideo ? (
        <VideoElement
          stream={peer.stream}
          isMuted={false}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <AvatarFallback name={peer.userName ?? peer.userId} size="lg" />
        </div>
      )}

      {/* Dark gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20
        bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Name + quality */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 flex items-end justify-between">
        <div>
          <p className="text-white text-sm font-semibold leading-tight truncate max-w-[120px]">
            {peer.userName ?? 'Participant'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <QualityBadge quality={peer.quality} />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mic indicator */}
          {peer.micOn ? (
            isSpeaking ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center
                animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                <Mic size={12} className="text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Mic size={12} className="text-white" />
              </div>
            )
          ) : (
            <div className="w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
              <MicOff size={12} className="text-white" />
            </div>
          )}

          {/* Camera indicator */}
          {!peer.cameraOn && (
            <div className="w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
              <VideoOff size={12} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Pin button */}
      <button
        onClick={(e) => { e.stopPropagation(); onPin(peer.socketId); }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm
          flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
          hover:bg-black/60"
        title={isPinned ? 'Unpin' : 'Pin'}
      >
        {isPinned
          ? <PinOff size={14} className="text-white" />
          : <Pin size={14} className="text-white" />
        }
      </button>

      {/* Connection state overlay */}
      {peer.connectionState === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full
              animate-spin mx-auto mb-2" />
            <p className="text-white text-xs">Connecting…</p>
          </div>
        </div>
      )}

      {peer.connectionState === 'failed' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <WifiOff size={24} className="text-red-400 mx-auto mb-1" />
            <p className="text-red-400 text-xs">Connection lost</p>
          </div>
        </div>
      )}
    </div>
  );
});
PeerTile.displayName = 'PeerTile';

// ─── Local tile ────────────────────────────────────────────────

const LocalTile = memo(({
  stream,
  isCameraOn,
  isMicOn,
  isScreenSharing,
  userName,
  userAvatar,
  isPinned,
  onPin,
}: LocalTileProps) => {
  const hasVideo = isCameraOn || isScreenSharing;

  return (
    <div
      className={`
        relative w-full h-full rounded-xl overflow-hidden
        bg-gradient-to-br from-[#3a2a1f] to-[#1a1208]
        border-2 transition-all duration-300 group cursor-pointer select-none
        ${isPinned
          ? 'border-[#8b7355] shadow-[0_0_16px_rgba(139,115,85,0.4)]'
          : 'border-[#8b7355]/40 hover:border-[#8b7355]/70'
        }
      `}
      onClick={onPin}
    >
      {/* "YOU" badge */}
      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-[#8b7355]/80
        backdrop-blur-sm rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
        You
      </div>

      {/* Screen share icon */}
      {isScreenSharing && (
        <div className="absolute top-2 left-10 z-10 px-2 py-0.5 bg-purple-500/80
          backdrop-blur-sm rounded-full text-[10px] font-bold text-white flex items-center gap-1">
          <Monitor size={10} />
          Screen
        </div>
      )}

      {/* Video / avatar */}
      {hasVideo ? (
        <VideoElement
          stream={stream}
          isMuted={true}  // always mute local to prevent echo
          className="w-full h-full object-cover scale-x-[-1]"  // mirror local
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <AvatarFallback name={userName ?? 'You'} avatar={userAvatar} size="lg" />
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 h-16
        bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
        <p className="text-white text-xs font-semibold truncate">
          {userName ?? 'You'}
        </p>
        <div className="flex items-center gap-1">
          {isMicOn ? (
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Mic size={10} className="text-white" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
              <MicOff size={10} className="text-white" />
            </div>
          )}
          {!isCameraOn && !isScreenSharing && (
            <div className="w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
              <VideoOff size={10} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Pin */}
      <button
        onClick={(e) => { e.stopPropagation(); onPin(); }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm
          flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
          hover:bg-black/60"
      >
        {isPinned
          ? <PinOff size={14} className="text-white" />
          : <Pin size={14} className="text-white" />
        }
      </button>
    </div>
  );
});
LocalTile.displayName = 'LocalTile';



// ─── Main component ────────────────────────────────────────────

// ✅ LAGAO
const LiveRoomView: React.FC<LiveRoomViewProps> = ({
  localStream,
  isCameraOn,
  isMicOn,
  isScreenSharing,
  peers,
  activeSpeakers,
  roomMode,
  roomTitle,
  currentUserId,
  localUserName,
  localUserAvatar,
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
  onLeave,
}) => {
  // Pinned state
  const [pinnedSocketId, setPinnedSocketId] = React.useState<string | null>(null);
  const handlePin = useCallback((socketId: string) => {
    setPinnedSocketId(prev => prev === socketId ? null : socketId);
  }, []);

  const totalTiles = peers.length + 1;
  const hasPinned = pinnedSocketId !== null;
  const pinnedPeer = pinnedSocketId && pinnedSocketId !== 'local'
    ? peers.find((p: any) => p.socketId === pinnedSocketId)
    : null;
  const otherPeers = pinnedPeer ? peers.filter((p: any) => p.socketId !== pinnedSocketId) : peers;

  // Helper to get grid class (same as before)
  const getGridClass = (total: number, hasPinned: boolean) => {
    if (hasPinned) return 'grid-cols-1';
    if (total === 1) return 'grid-cols-1';
    if (total === 2) return 'grid-cols-2';
    if (total <= 4) return 'grid-cols-2';
    if (total <= 6) return 'grid-cols-3';
    if (total <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#120d09] overflow-hidden">
      {roomMode === 'sfu' && (
        <div className="shrink-0 px-4 py-2 bg-amber-900/60 border-b border-amber-700/40 flex items-center gap-2 text-amber-300 text-xs">
          <AlertTriangle size={14} />
          <span>Large room – SFU recommended</span>
        </div>
      )}

      {hasPinned ? (
        <div className="flex-1 flex min-h-0 gap-2 p-2">
          <div className="flex-1 min-w-0">
            {pinnedSocketId === 'local' ? (
              <LocalTile
                stream={localStream}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                isScreenSharing={isScreenSharing}
                userName={localUserName}
userAvatar={localUserAvatar}
                isPinned={true}
                onPin={() => handlePin('local')}
              />
            ) : pinnedPeer ? (
              <PeerTile
                peer={pinnedPeer}
                isPinned={true}
                isSpeaking={activeSpeakers.includes(pinnedPeer.userId)}
                onPin={handlePin}
              />
            ) : null}
          </div>
          <div className="w-32 flex flex-col gap-2 overflow-y-auto">
            {pinnedSocketId !== 'local' && (
              <div className="aspect-video shrink-0">
                <LocalTile
                  stream={localStream}
                  isCameraOn={isCameraOn}
                  isMicOn={isMicOn}
                  isScreenSharing={isScreenSharing}
                  userName={localUserName}
userAvatar={localUserAvatar}
                  isPinned={false}
                  onPin={() => handlePin('local')}
                />
              </div>
            )}
            {otherPeers.map((peer: any) => (
              <div key={peer.socketId} className="aspect-video shrink-0">
                <PeerTile
                  peer={peer}
                  isPinned={false}
                  isSpeaking={activeSpeakers.includes(peer.userId)}
                  onPin={handlePin}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`flex-1 min-h-0 grid gap-2 p-2 auto-rows-fr ${getGridClass(totalTiles, false)}`}>
          <LocalTile
            stream={localStream}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            isScreenSharing={isScreenSharing}
            userName={localUserName}
userAvatar={localUserAvatar}
            isPinned={pinnedSocketId === 'local'}
            onPin={() => handlePin('local')}
          />
          {peers.map((peer: any) => (
            <PeerTile
              key={peer.socketId}
              peer={peer}
              isPinned={pinnedSocketId === peer.socketId}
              isSpeaking={activeSpeakers.includes(peer.userId)}
              onPin={handlePin}
            />
          ))}
          {peers.length === 0 && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5">
              <div className="text-center">
                <Users size={32} className="text-white/20 mx-auto mb-2" />
                <p className="text-white/30 text-sm">Waiting for others…</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls bar */}
      <div className="shrink-0 px-4 py-3 bg-black/60 backdrop-blur-md border-t border-white/5 flex items-center justify-center gap-3">
        <button onClick={onToggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button onClick={onToggleCamera} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCameraOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
          {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button onClick={onToggleScreenShare} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
          <Monitor size={20} />
        </button>
        <div className="w-px h-8 bg-white/10" />
        <button onClick={onLeave} className="px-5 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all">
          Leave
        </button>
      </div>
    </div>
  );
};

export default memo(LiveRoomView);
