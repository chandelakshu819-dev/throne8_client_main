// src/app/message/[userid]/page.tsx
'use client';
import AuthService from "@/lib/api/auth.service";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useMessaging } from "../../../features/messages/hooks/useMessaging";
import MessagingAPI from "@/lib/api/messaging.service";
import ConnectionService from "@/lib/api/connection.service";
import ProfileService from "@/lib/api/profile.service";
import { COLORS, emojis, quotes } from "@/features/messages/constants";

// ============================================================
// COLORS & ICONS — Unchanged from your original
// ============================================================
export const Icon = {
  Search: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" /></svg>,
  Bell: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .53-.21 1.04-.59 1.41L4 17h5m6 0a3 3 0 1 1-6 0" /></svg>,
  Send: (p: any) => <svg viewBox="0 0 24 24" fill="currentColor" className={"w-5 h-5 " + (p.className || "")}><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" /></svg>,
  Paperclip: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12.5 12.5 21a4.95 4.95 0 0 1-7-7l8.5-8.5a3.5 3.5 0 1 1 5 5L10 19" /></svg>,
  Smile: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><circle cx="12" cy="12" r="9" strokeWidth="2" /><path d="M9 10h.01M15 10h.01" strokeWidth="2" strokeLinecap="round" /><path d="M8 14s1.5 2 4 2 4-2 4-2" strokeWidth="2" strokeLinecap="round" /></svg>,
  Moon: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>,
  Sun: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><circle cx="12" cy="12" r="5" strokeWidth="2" /><path strokeWidth="2" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
  Mic: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path strokeWidth="2" d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" strokeWidth="2" /><line x1="8" y1="23" x2="16" y2="23" strokeWidth="2" /></svg>,
  Video: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><polygon points="23 7 16 12 23 17 23 7" strokeWidth="2" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeWidth="2" /></svg>,
  Phone: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  Pin: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-4 h-4 " + (p.className || "")}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 10H3m9-7v7m0 4v7m-4-4h8m-4-4V3" /></svg>,
  Calendar: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" /><line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" /><line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" /><line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" /></svg>,
  Users: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><path strokeWidth="2" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" strokeWidth="2" /><path strokeWidth="2" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  X: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-5 h-5 " + (p.className || "")}><line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" /><line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" /></svg>,
  ArrowUp: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"w-4 h-4 " + (p.className || "")}><path strokeWidth="2" strokeLinecap="round" d="M12 19V5m-7 7l7-7 7 7" /></svg>,
};

// ============================================================
// HELPER: User avatar placeholder (jab real avatar na ho)
// ============================================================
export function getInitials(name: string) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export function AvatarCircle({ name, size = 12 }: { name: string; size?: number }) {
  const colors = ['#e07b39', '#5b8dd9', '#50c878', '#e06b7d', '#9b59b6'];
  const color = colors[name?.charCodeAt(0) % colors.length] || '#888';
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-semibold text-sm`}
      style={{ background: color, minWidth: `${size * 4}px`, minHeight: `${size * 4}px` }}
    >
      {getInitials(name)}
    </div>
  );
}

// ============================================================
// STATUS TICK COMPONENT
// ============================================================
export function MessageStatus({ status }: { status: string }) {
  if (status === 'sending') return <span className="text-[10px] opacity-40">⏳</span>;
  if (status === 'sent') return <span className="text-[10px] opacity-50">✓</span>;
  if (status === 'delivered') return <span className="text-[10px] opacity-60">✓✓</span>;
  if (status === 'seen') return <span className="text-[10px] text-blue-500">✓✓</span>;
  if (status === 'failed') return <span className="text-[10px] text-red-500">✗</span>;
  return null;
}

// ============================================================
// CONVERSATION LIST ITEM
// ============================================================
function ConversationItem({
  conv,
  isActive,
  currentUserId,
  onClick,
  isTyping,
  colors,
  userCache,
}: any) {
  // conv.members mein dono users hain, dusra user find karo
  const otherMemberId = conv.members?.find((m: string) => m !== currentUserId);
  const displayName = conv.type === 'group'
    ? (conv.groupName || 'Group Chat')
    : (userCache?.[otherMemberId]?.name || otherMemberId || 'User');

  const lastMsgText = conv.lastMessage?.text || 'Start conversation...';
  const timeStr = conv.lastMessage
    ? new Date(conv.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl px-3 py-3 transition-all duration-200 shadow-sm border transform hover:scale-[1.02] ${isActive ? 'border-blue-200 shadow-md' : 'hover:shadow-md'}`}
      style={{
        background: isActive ? 'linear-gradient(to right, #fff, #f9f9f9)' : undefined,
        borderColor: colors.bgSoft,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          {/* Avatar — real photo nahi hai toh initials */}
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <AvatarCircle name={displayName} size={12} />
          </div>
          {conv.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <p className="font-medium truncate text-sm">{displayName}</p>
            <span className="text-[11px] opacity-50 flex-shrink-0 ml-1">{timeStr}</span>
          </div>
          <p className={`text-xs opacity-60 truncate mt-0.5 ${isTyping ? 'text-green-600 font-medium animate-pulse' : ''}`}>
            {isTyping ? 'typing...' : lastMsgText}
          </p>
        </div>
      </div>
    </button>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function MessagingPage() {
  // ── Auth: current user ───────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Aapke existing AuthService se current user lo
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const currentUserId = currentUser?.userId || '';

  // ✅ FIX: agar URL mein ?chatWith=<userId> aaya hai (jaise Profile Views
  // modal se "Message" click karne par), toh us user ke saath conversation
  // automatically start/open karo
  const searchParams = useSearchParams();
  const chatWithUserId = searchParams.get('chatWith');

  // ── useMessaging hook — saara real-time logic yahan ─────────────────────
  const {
    conversations,
    activeConversationId,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    hasMoreMessages,
    typingUsers,
    setActiveConversation,
    sendMessage,
    loadMoreMessages,
    toggleReaction,
    togglePin,
    deleteMessage,
  } = useMessaging(currentUserId);

  // ── Local UI state ───────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [search, setSearch] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // New conversation modal
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userCache, setUserCache] = useState<Record<string, any>>({});
  const [connectionUsers, setConnectionUsers] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const colors = isDark ? COLORS.dark : COLORS.light;

  // ── Auto scroll to bottom on new messages ───────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Existing useEffect ke baad ye add karo:
  useEffect(() => {
    if (currentUserId) loadAllUsers();
  }, [currentUserId]);

  // ── Active conversation info ─────────────────────────────────────────────
  const activeConversation = conversations.find(c => c.conversationId === activeConversationId);
  const otherMemberId = activeConversation?.members?.find(m => m !== currentUserId);
  const activeConvName = activeConversation?.type === 'group'
    ? (activeConversation.groupName || 'Group Chat')
    : (userCache[otherMemberId || '']?.name || otherMemberId || 'Loading...');

  // ── Filter conversations by search ──────────────────────────────────────
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c => {
      const name = c.type === 'group'
        ? c.groupName?.toLowerCase()
        : userCache[c.members?.find(m => m !== currentUserId) || '']?.name?.toLowerCase();
      return name?.includes(q);
    });
  }, [conversations, search, userCache, currentUserId]);

  // ── Pinned messages in active conversation ───────────────────────────────
  const pinnedMessages = messages.filter(m => m.isPinned);

  const todayQuote = useMemo(() => quotes[new Date().getDate() % quotes.length], []);

  // ── Load all users for "New Conversation" modal ──────────────────────────
  // const loadAllUsers = async () => {
  //   try {
  //     const res = await AuthService.getAllUsers({ limit: 50 });
  //     const users = res?.data?.users || [];
  //     setAllUsers(users.filter((u: any) => u.userId !== currentUserId));
  //     // Cache by userId
  //     const cache: Record<string, any> = {};
  //     users.forEach((u: any) => { cache[u.userId] = u; });
  //     setUserCache(prev => ({ ...prev, ...cache }));
  //   } catch (e) {
  //     console.error('Failed to load users:', e);
  //   }
  // };

  const loadAllUsers = async () => {
    try {
      const connectionsResponse = await ConnectionService.getUserConnections(currentUserId);
      const connections = connectionsResponse.data.data || [];

      const connectedUserIds: string[] = connections.map((conn: any) =>
        conn.fromUserId === currentUserId ? conn.toUserId : conn.fromUserId
      );

      const profilePromises = connectedUserIds.map((userId: string) =>
        AuthService.getUserProfileById(userId).catch(() => null)
      );
      const profileResponses = await Promise.all(profilePromises);

      // Profile photos fetch
      const profiles = profileResponses.filter(r => r !== null).map(r => r!.data);
      const photoIds = profiles.map(u => u.profilePhotoId).filter(Boolean);
      let photosMap: Record<string, string> = {};
      if (photoIds.length > 0) {
        const photosRes = await ProfileService.getMultipleProfilePhotosByIds(photoIds);
        photosMap = (photosRes.data.photos || []).reduce((acc: any, p: any) => {
          acc[p.photoId] = p.cloudinarySecureUrl;
          return acc;
        }, {});
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

      // Cache update
      const cache: Record<string, any> = {};
      users.forEach(u => { cache[u.userId] = { name: u.username, avatar: u.avatar }; });
      setUserCache(prev => ({ ...prev, ...cache }));

    } catch (e) {
      console.error('Failed to load connections:', e);
    }
  };

  /// ── Start a new direct conversation ─────────────────────────────────────
  const startDirectConversation = async (targetUserId: string) => {
    try {
      const conv = await MessagingAPI.getOrCreateDirectConversation(targetUserId);
      setShowNewConvModal(false);
      setActiveConversation(conv.conversationId);
    } catch (e) {
      console.error('Failed to start conversation:', e);
    }
  };

  // ✅ FIX: jab currentUserId load ho jaye aur URL mein chatWith param ho,
  // us user ke saath conversation auto-start kar do
  useEffect(() => {
    if (chatWithUserId && currentUserId && chatWithUserId !== currentUserId) {
      startDirectConversation(chatWithUserId);
    }
  }, [chatWithUserId, currentUserId]);

  // ── Handle send ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!messageInput.trim() || !activeConversationId) return;
    const text = messageInput.trim();
    setMessageInput('');
    await sendMessage(text);
  };

  // ── Handle voice record (simulated) ─────────────────────────────────────
  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(async () => {
        setIsRecording(false);
        await sendMessage('🎙️ Voice message (0:15)', 'voice');
      }, 3000);
    }
  };

  // ── TYPING INDICATOR emit ────────────────────────────────────────────────
  // Optional: socket se typing event bhejo
  // const handleTyping = (e) => {
  //   setMessageInput(e.target.value);
  //   socket?.emit('user:typing', { conversationId: activeConversationId, isTyping: true });
  // };

  const isActiveTyping = activeConversationId ? typingUsers[activeConversationId] : false;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: colors.bg, color: colors.text }}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-md" style={{ background: colors.text + "ee" }}>
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-xl">💬</span>
            </div>
            <h1 className="text-2xl font-semibold">Messages</h1>
          </div>
          <div className="flex items-center gap-4 text-white/90">
            <button onClick={() => setIsDark(!isDark)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
              {isDark ? <Icon.Sun /> : <Icon.Moon />}
            </button>
            <button
              onClick={() => { setShowNewConvModal(true); loadAllUsers(); }}
              className="hover:bg-white/10 p-2 rounded-full transition-colors"
              title="New Conversation"
            >
              <Icon.Users />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="grid gap-6 md:grid-cols-[300px_1fr_300px] grid-cols-1">

          {/* ── SIDEBAR: Conversations ── */}
          <aside className="rounded-3xl p-4 shadow-xl backdrop-blur-sm" style={{ background: colors.card }}>
            {/* Search */}
            <div className="flex items-center gap-2 rounded-2xl px-3 py-2 mb-3 border" style={{ background: colors.bg, borderColor: colors.bgSoft }}>
              <Icon.Search />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations"
                className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
              />
            </div>

            {/* Loading state */}
            {isLoadingConversations && (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-2xl p-3 animate-pulse" style={{ background: colors.bgSoft, height: 72 }} />
                ))}
              </div>
            )}

            {/* Conversation list */}
            {/* {!isLoadingConversations && (
              <div className="space-y-2 max-h-[72vh] overflow-y-auto pr-1">
                {filteredConversations.length === 0 && (
                  <div className="text-center py-8 opacity-50 text-sm">
                    <p>Koi conversation nahi mili.</p>
                    <button
                      onClick={() => { setShowNewConvModal(true); loadAllUsers(); }}
                      className="mt-2 text-blue-500 hover:underline"
                    >
                      Nayi conversation shuru karo
                    </button>
                  </div>
                )}
                {filteredConversations.map(conv => (
                  <ConversationItem
                    key={conv.conversationId}
                    conv={conv}
                    isActive={activeConversationId === conv.conversationId}
                    currentUserId={currentUserId}
                    onClick={() => setActiveConversation(conv.conversationId)}
                    isTyping={typingUsers[conv.conversationId] || false}
                    colors={colors}
                    userCache={userCache}
                  />
                ))}
              </div>
            )} */}

            {!isLoadingConversations && (
              <div className="space-y-2 max-h-[72vh] overflow-y-auto pr-1">
                {/* Existing conversations pehle */}
                {filteredConversations.map(conv => (
                  <ConversationItem
                    key={conv.conversationId}
                    conv={conv}
                    isActive={activeConversationId === conv.conversationId}
                    currentUserId={currentUserId}
                    onClick={() => setActiveConversation(conv.conversationId)}
                    isTyping={typingUsers[conv.conversationId] || false}
                    colors={colors}
                    userCache={userCache}
                  />
                ))}

                {/* Divider — connections jo abhi conversation mein nahi hain */}
                {connectionUsers.length > 0 && (
                  <>
                    <p className="text-xs opacity-40 px-2 pt-3 pb-1 font-medium">CONNECTIONS</p>
                    {connectionUsers
                      .filter(u => !conversations.some(c =>
                        c.members?.includes(u.userId)
                      ))
                      .map(user => (
                        <button
                          key={user.userId}
                          onClick={() => startDirectConversation(user.userId)}
                          className="w-full text-left rounded-2xl px-3 py-3 transition-all duration-200 shadow-sm border transform hover:scale-[1.02] hover:shadow-md"
                          style={{ borderColor: colors.bgSoft }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              {user.avatar
                                ? <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
                                : <AvatarCircle name={user.username || 'User'} size={12} />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{user.username}</p>
                              <p className="text-xs opacity-50 truncate">Click to start chat</p>
                            </div>
                          </div>
                        </button>
                      ))
                    }
                  </>
                )}
              </div>
            )}
          </aside>

          {/* ── MAIN: Chat Area ── */}
          <section className="rounded-3xl p-4 shadow-xl min-h-[78vh] flex flex-col" style={{ background: colors.card }}>

            {/* No conversation selected */}
            {!activeConversationId && (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                <span className="text-6xl mb-4">💬</span>
                <p className="text-lg font-medium">Koi conversation select karo</p>
                <p className="text-sm mt-1">Ya nayi conversation shuru karo</p>
              </div>
            )}

            {activeConversationId && (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: colors.bgSoft }}>
                  <div className="flex items-center gap-3">
                    <AvatarCircle name={activeConvName} size={12} />
                    <div>
                      <p className="font-semibold">
                        {activeConvName}
                        {activeConversation?.type === 'group' && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Group</span>
                        )}
                      </p>
                      <p className="text-xs opacity-50">
                        {isActiveTyping
                          ? <span className="text-green-600 animate-pulse">typing...</span>
                          : `${activeConversation?.members?.length || 0} members`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-60">
                    <Icon.Phone className="cursor-pointer hover:opacity-100" />
                    <Icon.Video className="cursor-pointer hover:opacity-100" />
                  </div>
                </div>

                {/* Pinned Messages */}
                {pinnedMessages.length > 0 && (
                  <div className="mb-3 p-3 rounded-2xl border-l-4 border-yellow-400" style={{ background: colors.bg }}>
                    <p className="text-xs font-semibold opacity-60 mb-2">📌 Pinned Messages</p>
                    {pinnedMessages.map(m => (
                      <div key={m.messageId} className="flex justify-between items-center text-sm py-1">
                        <span className="truncate">{m.text}</span>
                        <button onClick={() => togglePin(m.messageId)} className="text-xs text-blue-500 ml-2 flex-shrink-0">Unpin</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Load More Button */}
                {hasMoreMessages && (
                  <button
                    onClick={loadMoreMessages}
                    className="mx-auto mb-3 px-4 py-1.5 text-xs rounded-full border flex items-center gap-1 hover:shadow transition-all"
                    style={{ borderColor: colors.bgSoft }}
                  >
                    <Icon.ArrowUp /> Load older messages
                  </button>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {isLoadingMessages && (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                          <div className="animate-pulse rounded-2xl px-4 py-3" style={{ background: colors.bgSoft, width: `${180 + i * 40}px`, height: 48 }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {!isLoadingMessages && messages.map(msg => {
                    const isMe = msg.senderId === currentUserId;
                    const isSystem = msg.type === 'system' || msg.type === 'system_reminder';

                    return (
                      <div
                        key={msg.messageId}
                        className={`max-w-[75%] ${isMe ? 'ml-auto' : isSystem ? 'mx-auto' : 'mr-auto'}`}
                      >
                        <div
                          className="rounded-2xl px-4 py-3 shadow-sm relative group hover:shadow-md transition-all duration-200"
                          style={{
                            background: isSystem
                              ? '#6b7280'
                              : isMe
                                ? colors.bg
                                : '#efe3da',
                            color: isSystem ? '#fff' : colors.text,
                          }}
                        >
                          {/* Sender name (group mein) */}
                          {!isMe && !isSystem && activeConversation?.type === 'group' && (
                            <p className="text-xs font-semibold opacity-60 mb-1">
                              {userCache[msg.senderId]?.name || msg.senderId}
                            </p>
                          )}

                          {/* Message text */}
                          <p className="text-[15px] leading-snug">{msg.text}</p>

                          {/* Footer: time + status + reactions */}
                          <div className="flex items-center justify-between mt-2 gap-2">
                            <div className="flex items-center gap-1 flex-wrap">
                              {msg.reactions.map(r => (
                                <button
                                  key={r.emoji}
                                  onClick={() => toggleReaction(msg.messageId, r.emoji)}
                                  className={`text-xs rounded-full px-2 py-0.5 border transition-all ${r.reactedByMe ? 'bg-blue-100 border-blue-300' : 'bg-white/20 border-transparent'}`}
                                >
                                  {r.emoji} {r.count}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-[11px] opacity-50">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && <MessageStatus status={msg.status} />}
                            </div>
                          </div>

                          {/* Hover actions: emoji + pin */}
                          {!isSystem && (
                            <div className={`absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${showEmojiPicker === msg.messageId ? 'opacity-100' : ''}`}>
                              <button
                                onClick={() => setShowEmojiPicker(showEmojiPicker === msg.messageId ? null : msg.messageId)}
                                className="bg-white shadow rounded-full p-1 text-gray-600 hover:bg-gray-100"
                              >
                                <Icon.Smile className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => togglePin(msg.messageId)}
                                className="bg-white shadow rounded-full p-1 text-gray-600 hover:bg-gray-100"
                              >
                                <Icon.Pin className="w-3 h-3" />
                              </button>
                              {isMe && (
                                <button
                                  onClick={() => deleteMessage(msg.messageId)}
                                  className="bg-white shadow rounded-full p-1 text-red-400 hover:bg-red-50"
                                >
                                  <Icon.X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Emoji picker */}
                          {showEmojiPicker === msg.messageId && (
                            <div className="absolute top-6 right-0 bg-white rounded-xl shadow-xl p-2 flex gap-1 z-20">
                              {emojis.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => { toggleReaction(msg.messageId, emoji); setShowEmojiPicker(null); }}
                                  className="text-xl hover:scale-125 transition-transform p-1"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Typing indicator */}
                {isActiveTyping && (
                  <div className="flex items-center gap-2 mt-2 ml-2 opacity-60">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs">typing...</span>
                  </div>
                )}

                {/* Input area */}
                <div className="mt-4 flex items-center gap-2">
                  <div
                    className="flex-1 rounded-2xl border px-3 py-2 flex items-center gap-2 focus-within:border-blue-300 focus-within:shadow-md transition-all"
                    style={{ background: colors.bg, borderColor: colors.bgSoft }}
                  >
                    <input
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Write a message..."
                      className="bg-transparent outline-none w-full placeholder-gray-400"
                    />
                    <button
                      onClick={handleVoiceRecord}
                      className={`p-1 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'opacity-60 hover:opacity-100'}`}
                    >
                      <Icon.Mic className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!messageInput.trim() || isSending}
                    className="rounded-2xl px-4 py-2.5 shadow text-white transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                    style={{ background: colors.text }}
                  >
                    <Icon.Send />
                    <span>{isSending ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </>
            )}
          </section>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="space-y-4">
            {/* Today's Quote */}
            <div className="rounded-3xl p-4 shadow-xl" style={{ background: colors.card }}>
              <p className="text-sm opacity-60 mb-2">Today's Thought</p>
              <div className="rounded-2xl p-4 border" style={{ background: colors.bg, borderColor: colors.bgSoft }}>
                <p className="font-semibold">{todayQuote.text}</p>
                <p className="text-sm mt-1 opacity-60">— {todayQuote.by}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-3xl p-4 shadow-xl" style={{ background: colors.card }}>
              <p className="font-semibold mb-3">Activity Stats</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl px-4 py-3 text-center border" style={{ background: colors.bg, borderColor: colors.bgSoft }}>
                  <p className="text-2xl font-bold" style={{ color: colors.text }}>{conversations.length}</p>
                  <p className="text-xs opacity-60">Conversations</p>
                </div>
                <div className="rounded-2xl px-4 py-3 text-center border" style={{ background: colors.bg, borderColor: colors.bgSoft }}>
                  <p className="text-2xl font-bold" style={{ color: colors.text }}>
                    {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
                  </p>
                  <p className="text-xs opacity-60">Unread</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── NEW CONVERSATION MODAL ── */}
      {showNewConvModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl" style={{ background: colors.card }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">New Conversation</h3>
              <button onClick={() => setShowNewConvModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                <Icon.X />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {allUsers.length === 0 && (
                <p className="text-center opacity-50 py-4">Loading users...</p>
              )}
              {allUsers.map(user => (
                <button
                  key={user.userId}
                  onClick={() => startDirectConversation(user.userId)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border hover:shadow-md transition-all text-left"
                  style={{ background: colors.bg, borderColor: colors.bgSoft }}
                >
                  {user.avatar
                    ? <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                    : <AvatarCircle name={user.username || user.email || 'User'} size={10} />
                  }
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