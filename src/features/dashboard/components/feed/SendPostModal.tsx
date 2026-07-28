// src/features/dashboard/components/feed/SendPostModal.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Link as LinkIcon, Check } from 'lucide-react';
import { useConnectionsData } from '@/features/profile/hooks/useConnectionsData';
import MessagingAPI from '@/lib/api/messaging.service';

interface SendPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  postId: string;
  postOwnerName?: string;
  isDarkMode?: boolean;
}

interface ConnectionUser {
  id: string;
  name: string;
  headline: string;
  image: string;
}

const SendPostModal: React.FC<SendPostModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  postId,
  postOwnerName = 'this',
  isDarkMode = false,
}) => {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sentDone, setSentDone] = useState(false);

  const {
    followingList,
    followersList,
    isLoadingConnections,
    fetchConnectionsData,
  } = useConnectionsData();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchConnectionsData(currentUserId);
      setSearch('');
      setSelectedIds(new Set());
      setLinkCopied(false);
      setSentDone(false);
    }
  }, [isOpen, currentUserId, fetchConnectionsData]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ✅ Merge following + followers, de-duplicate by id
  const allConnections: ConnectionUser[] = useMemo(() => {
    const map = new Map<string, ConnectionUser>();
    [...followingList, ...followersList].forEach((u: any) => {
      if (!map.has(u.id)) {
        map.set(u.id, {
          id: u.id,
          name: u.name,
          headline: u.headline,
          image: u.image,
        });
      }
    });
    return Array.from(map.values());
  }, [followingList, followersList]);

  const filteredConnections = useMemo(() => {
    if (!search.trim()) return allConnections;
    const q = search.toLowerCase();
    return allConnections.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.headline || '').toLowerCase().includes(q)
    );
  }, [allConnections, search]);

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/post/${postId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleSend = async () => {
    if (selectedIds.size === 0 || isSending) return;
    setIsSending(true);

    try {
      const targetIds = Array.from(selectedIds);

      // Har selected user ke saath: direct conversation get/create karo, phir post link message bhejo
      await Promise.all(
        targetIds.map(async (targetUserId) => {
          const conversation = await MessagingAPI.getOrCreateDirectConversation(targetUserId);
          await MessagingAPI.sendMessage({
            conversationId: conversation.conversationId,
            text: postUrl,
            type: 'text',
          });
        })
      );

      setSentDone(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to send post:', err);
      alert(err?.message || 'Post send nahi ho paya, dubara try karo.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const bgCard = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-slate-100' : 'text-[#4a3728]';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60';
  const borderColor = isDarkMode ? 'border-slate-700' : 'border-[#e0d8cf]';
  const hoverRow = isDarkMode ? 'hover:bg-slate-700/60' : 'hover:bg-[#f6ede8]';

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className={`relative z-10 w-full max-w-md mx-auto max-h-[80vh] ${bgCard} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${borderColor}`}>
          <h2 className={`text-lg font-semibold ${textPrimary}`}>
            Send {postOwnerName}'s Post
          </h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#f6ede8]'}`}
          >
            <X className={`w-5 h-5 ${textPrimary}`} />
          </button>
        </div>

        {/* Search */}
        <div className={`px-5 py-3 border-b ${borderColor}`}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-[#f6ede8]'}`}>
            <Search className={`w-4 h-4 ${textMuted}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className={`flex-1 bg-transparent outline-none text-sm ${textPrimary} placeholder:${textMuted}`}
            />
          </div>
        </div>

        {/* Connections list */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConnections ? (
            <div className={`flex items-center justify-center py-10 text-sm ${textMuted}`}>
              Loading connections...
            </div>
          ) : filteredConnections.length > 0 ? (
            <div className="py-2">
              {filteredConnections.map((user) => {
                const isSelected = selectedIds.has(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleSelect(user.id)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${hoverRow}`}
                  >
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${textPrimary}`}>{user.name}</p>
                      {user.headline && (
                        <p className={`text-xs truncate ${textMuted}`}>{user.headline}</p>
                      )}
                    </div>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                        isSelected
                          ? 'bg-[#4a3728] border-[#4a3728]'
                          : `${isDarkMode ? 'border-slate-500' : 'border-[#4a3728]/40'}`
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center py-10 text-center ${textMuted}`}>
              <p className="text-sm">No connections found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-4 border-t ${borderColor} flex items-center justify-between gap-3`}>
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            <LinkIcon className="w-4 h-4" />
            {linkCopied ? 'Link copied!' : 'Copy link to post'}
          </button>

          <button
            onClick={handleSend}
            disabled={selectedIds.size === 0 || isSending}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedIds.size === 0 || isSending
                ? `${isDarkMode ? 'bg-slate-700 text-slate-500' : 'bg-[#e0d8cf] text-[#4a3728]/40'} cursor-not-allowed`
                : 'bg-[#4a3728] text-white hover:bg-[#3a2718]'
            }`}
          >
            {sentDone ? 'Sent ✓' : isSending ? 'Sending...' : `Send${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SendPostModal;