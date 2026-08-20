// src/app/message/[userid]/page.tsx
'use client';
import AuthService from "@/lib/api/auth.service";
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useMessaging } from "../../../features/messages/hooks/useMessaging";
import MessagingAPI, { MessageResponse } from "@/lib/api/messaging.service";
import ConnectionService from "@/lib/api/connection.service";
import ProfileService from "@/lib/api/profile.service";
import { COLORS, emojis, quotes } from "@/features/messages/constants";

// ============================================================
// ICONS
// ============================================================
const Icon = {
  Search: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" /></svg>,
  Send: (p: any) => <svg viewBox="0 0 24 24" fill="currentColor" className={"w-5 h-5 " + (p.className || "")}><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" /></svg>,
  Paperclip: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12.5 12.5 21a4.95 4.95 0 0 1-7-7l8.5-8.5a3.5 3.5 0 1 1 5 5L10 19" /></svg>,
  Smile: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><circle cx="12" cy="12" r="9" strokeWidth="2" /><path d="M9 10h.01M15 10h.01" strokeWidth="2" strokeLinecap="round" /><path d="M8 14s1.5 2 4 2 4-2 4-2" strokeWidth="2" strokeLinecap="round" /></svg>,
  Moon: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>,
  Sun: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><circle cx="12" cy="12" r="5" strokeWidth="2" /><path strokeWidth="2" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
  Mic: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path strokeWidth="2" d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" strokeWidth="2" /><line x1="8" y1="23" x2="16" y2="23" strokeWidth="2" /></svg>,
  Video: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><polygon points="23 7 16 12 23 17 23 7" strokeWidth="2" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeWidth="2" /></svg>,
  Phone: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  Pin: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-4 h-4 " + (p.className || "")}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 10H3m9-7v7m0 4v7m-4-4h8m-4-4V3" /></svg>,
  Users: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" strokeWidth="2" /><path strokeWidth="2" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  X: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" /><line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" /></svg>,
  ArrowUp: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-4 h-4 " + (p.className || "")}><path strokeWidth="2" strokeLinecap="round" d="M12 19V5m-7 7l7-7 7 7" /></svg>,
  Reply: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-4 h-4 " + (p.className || "")}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v.5" /></svg>,
  Edit: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-4 h-4 " + (p.className || "")}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>,
  Trash: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-4 h-4 " + (p.className || "")}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z" /></svg>,
  Link: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
  MoreVertical: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><circle cx="12" cy="12" r="1" strokeWidth="2"/><circle cx="12" cy="5" r="1" strokeWidth="2"/><circle cx="12" cy="19" r="1" strokeWidth="2"/></svg>,
  Archive: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-4 h-4 " + (p.className || "")}><polyline points="21 8 21 21 3 21 3 8" strokeWidth="2"/><rect x="1" y="3" width="22" height="5" strokeWidth="2"/><line x1="10" y1="12" x2="14" y2="12" strokeWidth="2"/></svg>,
  VolumeX: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-4 h-4 " + (p.className || "")}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" strokeWidth="2"/><line x1="23" y1="9" x2="17" y2="15" strokeWidth="2"/><line x1="17" y1="9" x2="23" y2="15" strokeWidth="2"/></svg>,
  Volume2: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-4 h-4 " + (p.className || "")}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" strokeWidth="2"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" strokeWidth="2"/></svg>,
};

// ============================================================
// HELPERS
// ============================================================
const POST_URL_REGEX = /(https?:\/\/[^\s]+\/post\/([a-zA-Z0-9-]+))/i;

function formatPreviewText(text?: string) {
  if (!text) return 'Start conversation...';
  if (POST_URL_REGEX.test(text)) return '📎 Shared a post';
  return text;
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function getInitials(name: string) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function AvatarCircle({ name, size = 12 }: { name: string; size?: number }) {
  const colors = ['#e07b39', '#5b8dd9', '#50c878', '#e06b7d', '#9b59b6'];
  const color = colors[name?.charCodeAt(0) % colors.length] || '#888';
  return (
    <div className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{ background: color, width: `${size * 4}px`, height: `${size * 4}px`, fontSize: size <= 6 ? '10px' : '14px' }}>
      {getInitials(name)}
    </div>
  );
}

function UserAvatarImg({ src, name, size = 12, showOnline = false }: { src?: string | null; name: string; size?: number; showOnline?: boolean }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="relative flex-shrink-0">
      {!src || errored ? (
        <AvatarCircle name={name || 'User'} size={size} />
      ) : (
        <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0"
          style={{ width: `${size * 4}px`, height: `${size * 4}px` }} onError={() => setErrored(true)} />
      )}
      {showOnline && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />}
    </div>
  );
}

function MessageStatus({ status }: { status: string }) {
  if (status === 'sending') return <span className="text-[10px] opacity-40">⏳</span>;
  if (status === 'sent') return <span className="text-[10px] opacity-50">✓</span>;
  if (status === 'delivered') return <span className="text-[10px] opacity-60">✓✓</span>;
  if (status === 'seen') return <span className="text-[10px] text-blue-500">✓✓</span>;
  if (status === 'failed') return <span className="text-[10px] text-red-500">✗</span>;
  return null;
}

// ============================================================
// LIGHTBOX + POST PREVIEW (same as before)
// ============================================================
function ImageLightbox({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentIndex(p => (p === 0 ? images.length - 1 : p - 1));
      if (e.key === 'ArrowRight') setCurrentIndex(p => (p === images.length - 1 ? 0 : p + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = ''; };
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2"><Icon.X className="w-6 h-6" /></button>
      {images.length > 1 && <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-white/10 px-3 py-1 rounded-full">{currentIndex + 1} / {images.length}</div>}
      <img src={images[currentIndex]} alt="" onClick={e => e.stopPropagation()} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" />
    </div>
  );
}

function PostPreviewCardRich({ preview, url, colors }: any) {
  const [expanded, setExpanded] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const images: string[] = preview.images?.length ? preview.images : (preview.image ? [preview.image] : []);
  const content = preview.content || preview.title || '';
  const isLong = content.length > 150;
  const displayText = expanded || !isLong ? content : content.slice(0, 150) + '…';

  return (
    <div className="rounded-xl overflow-hidden border bg-white/40 max-w-[300px]" style={{ borderColor: colors.bgSoft }}>
      <div className="flex items-start gap-2 p-3 pb-2">
        <UserAvatarImg src={preview.authorAvatar} name={preview.authorName || 'U'} size={10} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{preview.authorName || 'Someone'}</p>
          {preview.authorHeadline && <p className="text-xs opacity-60 truncate">{preview.authorHeadline}</p>}
        </div>
      </div>
      {content && (
        <div className="px-3 pb-2">
          <p className="text-sm whitespace-pre-wrap break-words">
            {displayText}
            {isLong && <button type="button" onClick={e => { e.preventDefault(); setExpanded(!expanded); }} className="text-blue-500 font-medium ml-1">{expanded ? 'less' : '...more'}</button>}
          </p>
        </div>
      )}
      {images.length > 0 && (
        <div className={`grid gap-0.5 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {images.slice(0, 4).map((img, i) => (
            <div key={i} onClick={e => { e.preventDefault(); setLightboxIndex(i); }} className={`relative overflow-hidden cursor-pointer ${images.length === 1 ? 'h-52' : 'h-32'}`}>
              <img src={img} className="w-full h-full object-cover" alt="" />
            </div>
          ))}
        </div>
      )}
      <a href={url} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-[12px] font-medium text-blue-500 border-t" style={{ borderColor: colors.bgSoft }}>View post →</a>
      {lightboxIndex !== null && <ImageLightbox images={images} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />}
    </div>
  );
}

function PostPreviewCardBasic({ url, colors }: any) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border p-3 bg-white/40" style={{ borderColor: colors.bgSoft }}>
      <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: colors.bgSoft }}><Icon.Link className="w-5 h-5 opacity-60" /></div>
      <div>
        <p className="text-sm font-semibold">Shared post</p>
        <p className="text-[11px] text-blue-500">View post →</p>
      </div>
    </a>
  );
}

// ============================================================
// CONVERSATION ITEM
// ============================================================
function ConversationItem({ conv, isActive, currentUserId, onClick, isTyping, colors, userCache, isOnline, isMuted }: any) {
  const otherMemberId = conv.members?.find((m: string) => m !== currentUserId);
  const cachedUser = userCache?.[otherMemberId];
  const displayName = conv.type === 'group' ? (conv.groupName || 'Group Chat') : (cachedUser?.name || 'Loading...');
  const avatarUrl = conv.type === 'group' ? conv.groupAvatar : cachedUser?.avatar;
  const lastMsgText = formatPreviewText(conv.lastMessage?.text);
  const timeStr = conv.lastMessage ? new Date(conv.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <button onClick={onClick}
      className={`w-full text-left rounded-2xl px-3 py-3 transition-all border ${isActive ? 'shadow-md' : 'border-transparent hover:shadow-sm'}`}
      style={{ background: isActive ? colors.bgSoft : 'transparent', borderColor: isActive ? colors.bgSoft : 'transparent' }}>
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <UserAvatarImg src={avatarUrl} name={displayName} size={12} showOnline={isOnline && conv.type === 'direct'} />
          {conv.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className={`truncate text-sm ${conv.unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}>{displayName}</p>
              {isMuted && <Icon.VolumeX className="w-3.5 h-3.5 opacity-50" />}
            </div>
            <span className="text-[11px] opacity-50 flex-shrink-0">{timeStr}</span>
          </div>
          <p className={`text-xs truncate mt-0.5 ${isTyping ? 'text-green-600 font-medium animate-pulse' : conv.unreadCount > 0 ? 'opacity-90 font-medium' : 'opacity-55'}`}>
            {isTyping ? 'typing...' : lastMsgText}
          </p>
        </div>
      </div>
    </button>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MessagingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => { setCurrentUser(AuthService.getCurrentUser()); }, []);
  const currentUserId = currentUser?.userId || '';
  const searchParams = useSearchParams();
  const chatWithUserId = searchParams.get('chatWith');

  const {
    conversations, activeConversationId, messages, isLoadingConversations, isLoadingMessages,
    isSending, hasMoreMessages, typingUsers, setActiveConversation, sendMessage, editMessage,
    loadMoreMessages, toggleReaction, togglePin, deleteMessage,
  } = useMessaging(currentUserId);

  const [isDark, setIsDark] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [search, setSearch] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageResponse | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userCache, setUserCache] = useState<Record<string, any>>({});
  const [connectionUsers, setConnectionUsers] = useState<any[]>([]);

  // New features state
  const [mutedConversations, setMutedConversations] = useState<Set<string>>(new Set());
  const [archivedConversations, setArchivedConversations] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [onlineUsers] = useState<Set<string>>(new Set());

  const attemptedResolveIdsRef = useRef<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const colors = isDark ? COLORS.dark : COLORS.light;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (currentUserId) loadAllUsers(); }, [currentUserId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) setShowHeaderMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeConversation = conversations.find(c => c.conversationId === activeConversationId);
  const otherMemberId = activeConversation?.members?.find(m => m !== currentUserId);
  const activeConvCachedUser = userCache[otherMemberId || ''];
  const activeConvName = activeConversation?.type === 'group' ? (activeConversation.groupName || 'Group Chat') : (activeConvCachedUser?.name || 'Loading...');
  const activeConvAvatar = activeConversation?.type === 'group' ? activeConversation.groupAvatar : activeConvCachedUser?.avatar;
  const isActiveMuted = activeConversationId ? mutedConversations.has(activeConversationId) : false;
  const isActiveOnline = otherMemberId ? (onlineUsers.has(otherMemberId) || !!typingUsers[activeConversationId || '']) : false;

  const filteredConversations = useMemo(() => {
    let list = showArchived
      ? conversations.filter(c => archivedConversations.has(c.conversationId))
      : conversations.filter(c => !archivedConversations.has(c.conversationId));
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(c => {
      const name = c.type === 'group' ? c.groupName?.toLowerCase() : userCache[c.members?.find(m => m !== currentUserId) || '']?.name?.toLowerCase();
      return name?.includes(q);
    });
  }, [conversations, search, userCache, currentUserId, archivedConversations, showArchived]);

  const pinnedMessages = messages.filter(m => m.isPinned);
  const todayQuote = useMemo(() => quotes[new Date().getDate() % quotes.length], []);

  const loadAllUsers = async () => {
    try {
      const connectionsResponse = await ConnectionService.getUserConnections(currentUserId);
      const connections = connectionsResponse.data.data || [];
      const connectedUserIds = connections.map((conn: any) => conn.fromUserId === currentUserId ? conn.toUserId : conn.fromUserId);
      const profileResponses = await Promise.all(connectedUserIds.map((id: string) => AuthService.getUserProfileById(id).catch(() => null)));
      const profiles = profileResponses.filter(Boolean).map(r => r!.data);
      const photoIds = profiles.map(u => u.profilePhotoId).filter(Boolean);
      let photosMap: Record<string, string> = {};
      if (photoIds.length) {
        const photosRes = await ProfileService.getMultipleProfilePhotosByIds(photoIds);
        photosMap = (photosRes.data.photos || []).reduce((acc: any, p: any) => { acc[p.photoId] = p.cloudinarySecureUrl; return acc; }, {});
      }
      const users = profiles.map(u => ({
        userId: u.userId,
        username: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        role: u.role,
        avatar: u.profilePhotoId ? photosMap[u.profilePhotoId] || null : null,
      }));
      setAllUsers(users);
      setConnectionUsers(users);
      const cache: Record<string, any> = {};
      users.forEach(u => { cache[u.userId] = { name: u.username, avatar: u.avatar }; });
      setUserCache(prev => ({ ...prev, ...cache }));
    } catch (e) { console.error(e); }
  };

  const resolveUsersByIds = useCallback(async (userIds: string[]) => {
    if (!userIds.length) return;
    try {
      const bulkRes = await AuthService.getUsersBulk(userIds);
      const users = bulkRes?.data?.users || bulkRes?.data || [];
      const photoIds = users.map((u: any) => u.profilePhotoId).filter(Boolean);
      let photosMap: Record<string, string> = {};
      if (photoIds.length) {
        try {
          const photosRes = await ProfileService.getMultipleProfilePhotosByIds(photoIds);
          photosMap = (photosRes?.data?.photos || []).reduce((acc: any, p: any) => { acc[p.photoId] = p.cloudinarySecureUrl; return acc; }, {});
        } catch {}
      }
      const cache: Record<string, any> = {};
      users.forEach((u: any) => {
        cache[u.userId] = {
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || u.userId,
          avatar: u.profilePhotoId ? photosMap[u.profilePhotoId] || null : null,
        };
      });
      setUserCache(prev => ({ ...prev, ...cache }));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!currentUserId || !conversations.length) return;
    const missing = Array.from(new Set(
      conversations.filter(c => c.type === 'direct')
        .map(c => c.members?.find((m: string) => m !== currentUserId))
        .filter((id): id is string => !!id && !userCache[id] && !attemptedResolveIdsRef.current.has(id))
    ));
    if (!missing.length) return;
    missing.forEach(id => attemptedResolveIdsRef.current.add(id));
    resolveUsersByIds(missing);
  }, [conversations, currentUserId, userCache, resolveUsersByIds]);

  const startDirectConversation = async (targetUserId: string) => {
    try {
      const conv = await MessagingAPI.getOrCreateDirectConversation(targetUserId);
      setShowNewConvModal(false);
      setActiveConversation(conv.conversationId);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (chatWithUserId && currentUserId && chatWithUserId !== currentUserId) startDirectConversation(chatWithUserId);
  }, [chatWithUserId, currentUserId]);

  const toggleMute = () => {
    if (!activeConversationId) return;
    setMutedConversations(prev => {
      const next = new Set(prev);
      next.has(activeConversationId) ? next.delete(activeConversationId) : next.add(activeConversationId);
      return next;
    });
    setShowHeaderMenu(false);
  };

  const toggleArchive = () => {
    if (!activeConversationId) return;
    setArchivedConversations(prev => {
      const next = new Set(prev);
      next.has(activeConversationId) ? next.delete(activeConversationId) : next.add(activeConversationId);
      return next;
    });
    setActiveConversation('');
    setShowHeaderMenu(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setSelectedFiles(prev => [...prev, ...files].slice(0, 5));
    e.target.value = '';
  };

  const removeSelectedFile = (index: number) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));

  const handleSend = async () => {
    if ((!messageInput.trim() && !selectedFiles.length) || !activeConversationId) return;
    const text = messageInput.trim();
    const replyToMessageId = replyingTo?.messageId;
    if (text) {
      setMessageInput('');
      setReplyingTo(null);
      await sendMessage(text, 'text', replyToMessageId ? { replyToMessageId } : undefined);
    }
    if (selectedFiles.length) {
      const names = selectedFiles.map(f => f.name).join(', ');
      await sendMessage(`📎 Sent ${selectedFiles.length} file(s): ${names}`, 'text');
      setSelectedFiles([]);
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(async () => {
        setIsRecording(false);
        await sendMessage('🎙️ Voice message (0:15)', 'voice');
      }, 3000);
    }
  };

  const startReply = (msg: MessageResponse) => { setEditingMessageId(null); setReplyingTo(msg); inputRef.current?.focus(); };
  const startEdit = (msg: MessageResponse) => { setReplyingTo(null); setEditingMessageId(msg.messageId); setEditText(msg.text || ''); };
  const saveEdit = async (msg: MessageResponse) => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== msg.text) await editMessage(msg.messageId, trimmed);
    setEditingMessageId(null);
  };
  const confirmDelete = (id: string) => { if (window.confirm('Delete this message?')) deleteMessage(id); };
  const replySenderLabel = (id: string) => id === currentUserId ? 'You' : (userCache[id]?.name || 'User');
  const isActiveTyping = activeConversationId ? typingUsers[activeConversationId] : false;

  return (
    <div className="h-screen flex flex-col overflow-hidden transition-colors duration-300" style={{ background: colors.bg, color: colors.text }}>
      {/* HEADER */}
      <header className="flex-shrink-0 z-30 w-full backdrop-blur-md" style={{ background: colors.dark + "ee" }}>
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><span className="text-xl">💬</span></div>
            <h1 className="text-2xl font-semibold">Messages</h1>
          </div>
          <div className="flex items-center gap-4 text-white/90">
            <button onClick={() => setIsDark(!isDark)} className="hover:bg-white/10 p-2 rounded-full">{isDark ? <Icon.Sun /> : <Icon.Moon />}</button>
            <button onClick={() => { setShowNewConvModal(true); loadAllUsers(); }} className="hover:bg-white/10 p-2 rounded-full"><Icon.Users /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 mx-auto w-full max-w-[1400px] px-4 py-4">
        <div className="grid h-full gap-4 md:grid-cols-[300px_1fr_300px] grid-cols-1">

          {/* LEFT SIDEBAR */}
          <aside className="rounded-3xl p-4 shadow-xl flex flex-col h-full overflow-hidden" style={{ background: colors.card }}>
            <div className="flex items-center gap-2 rounded-2xl px-3 py-2 mb-3 border flex-shrink-0" style={{ background: colors.bg, borderColor: colors.bgSoft }}>
              <Icon.Search />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations" className="bg-transparent outline-none w-full text-sm placeholder-gray-400" />
            </div>

            <div className="flex gap-2 mb-3 flex-shrink-0">
              <button onClick={() => setShowArchived(false)} className={`flex-1 text-xs py-1.5 rounded-full ${!showArchived ? 'font-semibold shadow' : 'opacity-60'}`} style={{ background: !showArchived ? colors.bgSoft : 'transparent' }}>All</button>
              <button onClick={() => setShowArchived(true)} className={`flex-1 text-xs py-1.5 rounded-full ${showArchived ? 'font-semibold shadow' : 'opacity-60'}`} style={{ background: showArchived ? colors.bgSoft : 'transparent' }}>Archived ({archivedConversations.size})</button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
              {isLoadingConversations ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="rounded-2xl p-3 animate-pulse" style={{ background: colors.bgSoft, height: 72 }} />)}</div>
              ) : (
                <>
                  {filteredConversations.map(conv => {
                    const otherId = conv.members?.find((m: string) => m !== currentUserId);
                    const isOnline = otherId ? (onlineUsers.has(otherId) || !!typingUsers[conv.conversationId]) : false;
                    return (
                      <ConversationItem key={conv.conversationId} conv={conv} isActive={activeConversationId === conv.conversationId}
                        currentUserId={currentUserId} onClick={() => setActiveConversation(conv.conversationId)}
                        isTyping={typingUsers[conv.conversationId] || false} colors={colors} userCache={userCache}
                        isOnline={isOnline} isMuted={mutedConversations.has(conv.conversationId)} />
                    );
                  })}
                  {!showArchived && connectionUsers.length > 0 && (
                    <>
                      <p className="text-xs opacity-40 px-2 pt-3 pb-1 font-semibold">CONNECTIONS</p>
                      {connectionUsers.filter(u => !conversations.some(c => c.members?.includes(u.userId))).map(user => (
                        <button key={user.userId} onClick={() => startDirectConversation(user.userId)} className="w-full text-left rounded-2xl px-3 py-3 hover:shadow-sm">
                          <div className="flex items-center gap-3">
                            <UserAvatarImg src={user.avatar} name={user.username || 'User'} size={12} />
                            <div className="min-w-0">
                              <p className="font-medium truncate text-sm">{user.username}</p>
                              <p className="text-xs opacity-50">Click to start chat</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </aside>

          {/* CHAT AREA */}
          <section className="rounded-3xl p-4 shadow-xl flex flex-col h-full overflow-hidden" style={{ background: colors.card }}>
            {!activeConversationId ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                <span className="text-6xl mb-4">💬</span>
                <p className="text-lg font-medium">Select a conversation</p>
              </div>
            ) : (
              <>
                {/* Header with fixed 3-dot menu */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b flex-shrink-0 relative z-20" style={{ borderColor: colors.bgSoft }}>
                  <div className="flex items-center gap-3">
                    <UserAvatarImg src={activeConvAvatar} name={activeConvName} size={12} showOnline={isActiveOnline && activeConversation?.type === 'direct'} />
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        {activeConvName}
                        {isActiveMuted && <Icon.VolumeX className="w-4 h-4 opacity-50" />}
                      </p>
                      <p className="text-xs opacity-50">
                        {isActiveTyping ? <span className="text-green-600 animate-pulse">typing...</span> :
                          isActiveOnline ? <span className="text-green-600">Active now</span> : 'Active'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 opacity-70">
                    <Icon.Phone className="cursor-pointer hover:opacity-100" />
                    <Icon.Video className="cursor-pointer hover:opacity-100" />
                    <div className="relative" ref={headerMenuRef}>
                      <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className="p-1.5 rounded-full hover:bg-black/5">
                        <Icon.MoreVertical />
                      </button>
                      {showHeaderMenu && (
                        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl shadow-2xl border z-[100] py-1.5 overflow-hidden"
                          style={{ background: colors.card, borderColor: colors.bgSoft }}>
                          <button onClick={toggleMute} className="w-full text-left px-4 py-2.5 text-sm hover:bg-black/5 flex items-center gap-2.5">
                            {isActiveMuted ? <Icon.Volume2 /> : <Icon.VolumeX />}
                            {isActiveMuted ? 'Unmute' : 'Mute'} conversation
                          </button>
                          <button onClick={toggleArchive} className="w-full text-left px-4 py-2.5 text-sm hover:bg-black/5 flex items-center gap-2.5">
                            <Icon.Archive /> {archivedConversations.has(activeConversationId!) ? 'Unarchive' : 'Archive'}
                          </button>
                          <button onClick={() => setShowHeaderMenu(false)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-black/5">Mark as unread</button>
                          <div className="border-t my-1" style={{ borderColor: colors.bgSoft }} />
                          <button onClick={() => { if (window.confirm('Delete this conversation?')) setActiveConversation(''); setShowHeaderMenu(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2.5">
                            <Icon.Trash /> Delete conversation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {pinnedMessages.length > 0 && (
                  <div className="mb-3 p-3 rounded-2xl border-l-4 border-yellow-400 flex-shrink-0" style={{ background: colors.bg }}>
                    <p className="text-xs font-semibold opacity-60 mb-2">📌 Pinned</p>
                    {pinnedMessages.map(m => (
                      <div key={m.messageId} className="flex justify-between text-sm py-1">
                        <span className="truncate">{formatPreviewText(m.text)}</span>
                        <button onClick={() => togglePin(m.messageId)} className="text-xs text-blue-500">Unpin</button>
                      </div>
                    ))}
                  </div>
                )}

                {hasMoreMessages && (
                  <button onClick={loadMoreMessages} className="mx-auto mb-3 px-4 py-1.5 text-xs rounded-full border flex items-center gap-1 flex-shrink-0" style={{ borderColor: colors.bgSoft }}>
                    <Icon.ArrowUp /> Load older messages
                  </button>
                )}

                {/* Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 relative z-0">
                  {isLoadingMessages ? (
                    <div className="space-y-3">{[1,2,3].map(i => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                        <div className="animate-pulse rounded-2xl px-4 py-3" style={{ background: colors.bgSoft, width: 200 + i * 30, height: 48 }} />
                      </div>
                    ))}</div>
                  ) : messages.map(msg => {
                    const isMe = msg.senderId === currentUserId;
                    const isSystem = msg.type === 'system' || msg.type === 'system_reminder';
                    const isEditing = editingMessageId === msg.messageId;
                    const postMatch = msg.text?.match(POST_URL_REGEX);
                    const postPreview = (msg.metadata as any)?.postPreview;

                    return (
                      <div key={msg.messageId} className={`max-w-[min(75%,420px)] w-fit ${isMe ? 'ml-auto' : isSystem ? 'mx-auto' : 'mr-auto'}`}>
                        <div className={`rounded-2xl px-4 py-3 shadow-sm relative group hover:shadow-md transition-all ${postPreview ? 'inline-block' : ''}`}
                          style={{ background: isSystem ? '#6b7280' : isMe ? colors.bgSoft : '#efe3da', color: isSystem ? '#fff' : colors.text }}>
                          
                          {msg.replyTo && !isEditing && (
                            <div className="mb-2 pl-2 py-1 border-l-2 text-xs opacity-70 truncate rounded-r" style={{ borderColor: colors.text, background: 'rgba(0,0,0,0.04)' }}>
                              <span className="font-semibold">{replySenderLabel(msg.replyTo.senderId)}</span>
                              <span className="ml-1">{formatPreviewText(msg.replyTo.text)}</span>
                            </div>
                          )}

                          {isEditing ? (
                            <div className="flex flex-col gap-2 min-w-[180px]">
                              <textarea value={editText} onChange={e => setEditText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(msg); } if (e.key === 'Escape') setEditingMessageId(null); }}
                                className="w-full bg-white/60 border rounded-lg p-2 text-[15px] outline-none resize-none" rows={2} autoFocus
                                style={{ borderColor: colors.bgSoft, color: colors.text }} />
                              <div className="flex gap-2 justify-end text-xs">
                                <button onClick={() => setEditingMessageId(null)} className="px-3 py-1 rounded-full opacity-60">Cancel</button>
                                <button onClick={() => saveEdit(msg)} className="px-3 py-1 rounded-full text-white" style={{ background: colors.dark }}>Save</button>
                              </div>
                            </div>
                          ) : postPreview ? (
                            <PostPreviewCardRich preview={postPreview} url={postMatch?.[1] || '#'} colors={colors} />
                          ) : postMatch ? (
                            <PostPreviewCardBasic url={postMatch[1]} colors={colors} />
                          ) : (
                            <p className="text-[15px] leading-snug whitespace-pre-wrap break-words">{msg.text}</p>
                          )}

                          {!isEditing && (
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <div className="flex items-center gap-1 flex-wrap">
                                {msg.reactions.map(r => (
                                  <button key={r.emoji} onClick={() => toggleReaction(msg.messageId, r.emoji)}
                                    className={`text-xs rounded-full px-2 py-0.5 border ${r.reactedByMe ? 'bg-blue-100 border-blue-300' : 'bg-white/20 border-transparent'}`}>
                                    {r.emoji} {r.count}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {msg.isEdited && <span className="text-[10px] opacity-40 italic">edited</span>}
                                <span className="text-[11px] opacity-50">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {isMe && <MessageStatus status={msg.status} />}
                              </div>
                            </div>
                          )}

                          {!isSystem && !isEditing && (
                            <div className={`absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${showEmojiPicker === msg.messageId ? 'opacity-100' : ''}`}>
                              <button onClick={() => startReply(msg)} className="bg-white shadow rounded-full p-1 text-gray-600 hover:bg-gray-100"><Icon.Reply /></button>
                              <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.messageId ? null : msg.messageId)} className="bg-white shadow rounded-full p-1 text-gray-600 hover:bg-gray-100"><Icon.Smile className="w-3 h-3" /></button>
                              <button onClick={() => togglePin(msg.messageId)} className="bg-white shadow rounded-full p-1 text-gray-600 hover:bg-gray-100"><Icon.Pin className="w-3 h-3" /></button>
                              {isMe && msg.type === 'text' && <button onClick={() => startEdit(msg)} className="bg-white shadow rounded-full p-1 text-gray-600 hover:bg-gray-100"><Icon.Edit className="w-3 h-3" /></button>}
                              {isMe && <button onClick={() => confirmDelete(msg.messageId)} className="bg-white shadow rounded-full p-1 text-red-400 hover:bg-red-50"><Icon.Trash className="w-3 h-3" /></button>}
                            </div>
                          )}

                          {showEmojiPicker === msg.messageId && (
                            <div className="absolute top-6 right-0 bg-white rounded-xl shadow-xl p-2 flex gap-1 z-20">
                              {emojis.map(emoji => (
                                <button key={emoji} onClick={() => { toggleReaction(msg.messageId, emoji); setShowEmojiPicker(null); }} className="text-xl hover:scale-125 p-1">{emoji}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {isActiveTyping && (
                  <div className="flex items-center gap-2 mt-2 ml-2 opacity-60 flex-shrink-0">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs">typing...</span>
                  </div>
                )}

                {replyingTo && (
                  <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2 border-l-4 flex-shrink-0" style={{ background: colors.bg, borderColor: colors.dark }}>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold opacity-60">Replying to {replyingTo.senderId === currentUserId ? 'yourself' : replySenderLabel(replyingTo.senderId)}</p>
                      <p className="text-sm truncate opacity-80">{formatPreviewText(replyingTo.text)}</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1 opacity-50 hover:opacity-100"><Icon.X className="w-4 h-4" /></button>
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 flex-shrink-0">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs border" style={{ background: colors.bg, borderColor: colors.bgSoft }}>
                        <span className="truncate max-w-[120px]">{file.name}</span>
                        <button onClick={() => removeSelectedFile(idx)}><Icon.X className="w-3.5 h-3.5 opacity-60" /></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="mt-3 flex items-center gap-2 flex-shrink-0">
                  <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileSelect} />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full opacity-60 hover:opacity-100 hover:bg-black/5"><Icon.Paperclip /></button>
                  <div className="flex-1 rounded-2xl border px-3 py-2 flex items-center gap-2 focus-within:border-blue-300 focus-within:shadow-md" style={{ background: colors.bg, borderColor: colors.bgSoft }}>
                    <input ref={inputRef} value={messageInput} onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Write a message..." className="bg-transparent outline-none w-full placeholder-gray-400" />
                    <button onClick={handleVoiceRecord} className={`p-1 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'opacity-60 hover:opacity-100'}`}>
                      <Icon.Mic className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={handleSend} disabled={(!messageInput.trim() && !selectedFiles.length) || isSending}
                    className="rounded-2xl px-4 py-2.5 shadow text-white hover:shadow-lg hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                    style={{ background: colors.dark }}>
                    <Icon.Send /><span>{isSending ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </>
            )}
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-4 h-full overflow-y-auto">
            <div className="rounded-3xl p-4 shadow-xl" style={{ background: colors.card }}>
              <p className="text-sm opacity-60 mb-2">Todays Thought</p>
              <div className="rounded-2xl p-4 border" style={{ background: colors.bg, borderColor: colors.bgSoft }}>
                <p className="font-semibold">{todayQuote.text}</p>
                <p className="text-sm mt-1 opacity-60">— {todayQuote.by}</p>
              </div>
            </div>
            <div className="rounded-3xl p-4 shadow-xl" style={{ background: colors.card }}>
              <p className="font-semibold mb-3">Activity Stats</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl px-4 py-3 text-center border" style={{ background: colors.bg, borderColor: colors.bgSoft }}>
                  <p className="text-2xl font-bold">{conversations.length}</p>
                  <p className="text-xs opacity-60">Conversations</p>
                </div>
                <div className="rounded-2xl px-4 py-3 text-center border" style={{ background: colors.bg, borderColor: colors.bgSoft }}>
                  <p className="text-2xl font-bold">{conversations.reduce((s, c) => s + (c.unreadCount || 0), 0)}</p>
                  <p className="text-xs opacity-60">Unread</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* New Conversation Modal */}
      {showNewConvModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl" style={{ background: colors.card }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">New Conversation</h3>
              <button onClick={() => setShowNewConvModal(false)} className="p-2 rounded-full hover:bg-gray-100"><Icon.X /></button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {allUsers.map(user => (
                <button key={user.userId} onClick={() => startDirectConversation(user.userId)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border hover:shadow-md text-left"
                  style={{ background: colors.bg, borderColor: colors.bgSoft }}>
                  <UserAvatarImg src={user.avatar} name={user.username || 'User'} size={10} />
                  <div>
                    <p className="font-medium text-sm">{user.username || user.email}</p>
                    <p className="text-xs opacity-50">{user.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}