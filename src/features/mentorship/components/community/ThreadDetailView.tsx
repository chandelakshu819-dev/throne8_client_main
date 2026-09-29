// src/features/mentorship/components/community/ThreadDetailView.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pin,
  Lock,
  Unlock,
  ThumbsUp,
  MessageCircle,
  AlertCircle,
  Loader2,
  Send,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { Forum, ForumReply, ForumAuthor } from "@/types/community.types";
import CommunityService from "@/lib/api/community.service";
import AuthService from "@/lib/api/auth.service";
import ProfileService from "@/lib/api/profile.service";

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  chip: "#f3ece4",
  softWash: "#fbf7f3",
  muted: "#8a7a6a",
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function getAuthorDisplayName(author: ForumAuthor | string | null | undefined): string {
  if (!author) return "Community Member";
  if (typeof author === "string") return "Community Member";
  return author.name?.trim() || "Community Member";
}

function getCategoryLabel(category?: string): string {
  if (!category) return "General";
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface MentionCandidate {
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface MentionDropdownProps {
  candidates: MentionCandidate[];
  isSearching: boolean;
  activeIndex: number;
  onSelect: (candidate: MentionCandidate) => void;
  onHover: (index: number) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

function MentionDropdown({
  candidates,
  isSearching,
  activeIndex,
  onSelect,
  onHover,
  dropdownRef,
}: MentionDropdownProps) {
  if (!isSearching && candidates.length === 0) {
    return (
      <div
        ref={dropdownRef}
        className="absolute z-50 bottom-full left-0 mb-2 w-72 rounded-xl bg-white shadow-xl overflow-hidden"
        style={{ border: `1px solid ${COLORS.hairline}` }}
      >
        <div className="px-3.5 py-3 text-xs" style={{ color: COLORS.muted }}>
          No matching members found
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 bottom-full left-0 mb-2 w-72 max-h-56 overflow-y-auto rounded-xl bg-white shadow-xl"
      style={{
        border: `1px solid ${COLORS.hairline}`,
        boxShadow: "0 10px 25px -5px rgba(74, 55, 40, 0.12), 0 8px 10px -6px rgba(74, 55, 40, 0.08)",
      }}
    >
      <div
        className="px-3 py-1.5 text-[11px] font-semibold border-b tracking-wide"
        style={{ borderColor: COLORS.hairline, color: COLORS.muted, backgroundColor: COLORS.softWash }}
      >
        Mentions
      </div>
      {isSearching ? (
        <div className="flex items-center gap-2 px-3.5 py-3 text-xs" style={{ color: COLORS.muted }}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: COLORS.accent }} />
          <span>Searching members...</span>
        </div>
      ) : (
        candidates.map((user, idx) => (
          <button
            key={user.userId}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(user);
            }}
            onMouseEnter={() => onHover(idx)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer"
            style={{
              backgroundColor: idx === activeIndex ? COLORS.chip : "transparent",
            }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0"
                style={{
                  backgroundColor: COLORS.softWash,
                  color: COLORS.ink,
                  border: `1px solid ${COLORS.hairline}`,
                }}
              >
                {user.name[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate" style={{ color: COLORS.ink }}>
                {user.name}
              </span>
              {user.email && (
                <span className="text-[10px] truncate" style={{ color: COLORS.muted }}>
                  {user.email}
                </span>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

function formatReplyWithMentions(content: string) {
  if (!content) return "";
  const parts = content.split(/(@[a-zA-Z0-9_.-]+(?:\s+[a-zA-Z0-9_.-]+)?)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("@") && part.length > 1) {
      return (
        <span
          key={idx}
          className="font-semibold px-1.5 py-0.5 rounded-md text-[11px] inline-block my-0.5"
          style={{
            backgroundColor: COLORS.chip,
            color: COLORS.accent,
            border: `1px solid ${COLORS.hairline}`,
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

async function resolveMentionCandidates(users: any[]): Promise<MentionCandidate[]> {
  const photoIds = users
    .map((u: any) => u.profilePhotoId)
    .filter((id: any): id is string => Boolean(id));

  let photoMap: Record<string, string> = {};
  if (photoIds.length > 0) {
    try {
      const photosResponse = await ProfileService.getMultipleProfilePhotosByIds(photoIds);
      const photos = photosResponse?.data?.photos || [];
      photos.forEach((p: any) => {
        if (p.photoId && p.cloudinarySecureUrl) {
          photoMap[p.photoId] = p.cloudinarySecureUrl;
        }
      });
    } catch (err) {
      console.warn("Failed to fetch profile photos for mentions:", err);
    }
  }

  return users.map((u: any) => {
    const fullName =
      u.fullName ||
      `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
      u.email ||
      "Member";
    return {
      userId: u.userId,
      name: fullName,
      email: u.email,
      avatar: (u.profilePhotoId && photoMap[u.profilePhotoId]) || u.profileImageUrl || u.profilePhotoUrl || undefined,
    };
  });
}

interface ThreadDetailViewProps {
  thread: Forum;
  replies: ForumReply[];
  repliesPage?: number;
  repliesTotalPages?: number;
  currentUser: {
    userId?: string;
    role?: string;
    [key: string]: any;
  } | null;
  isAuthorOrAdmin: boolean;
  onThreadUpdate?: (updated: Forum) => void;
  onReplyAdded?: (newReply: ForumReply) => void;
}

export default function ThreadDetailView({
  thread: initialThread,
  replies: initialReplies,
  repliesPage: initialRepliesPage = 1,
  repliesTotalPages: initialRepliesTotalPages = 1,
  currentUser,
  isAuthorOrAdmin,
  onThreadUpdate,
  onReplyAdded,
}: ThreadDetailViewProps) {
  const router = useRouter();

  const [thread, setThread] = useState<Forum>(initialThread);
  const [replies, setReplies] = useState<ForumReply[]>(initialReplies);
  const [repliesPage, setRepliesPage] = useState<number>(initialRepliesPage);
  const [repliesTotalPages, setRepliesTotalPages] = useState<number>(initialRepliesTotalPages);
  const [isLoadingMoreReplies, setIsLoadingMoreReplies] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState<MentionCandidate[]>([]);
  const [isSearchingMentions, setIsSearchingMentions] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [selectedMentions, setSelectedMentions] = useState<Map<string, string>>(new Map());

  const mentionStartRef = useRef<number | null>(null);
  const mentionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  // Inline reply state
  const [replyingToReplyId, setReplyingToReplyId] = useState<string | null>(null);
  const [inlineReplyContent, setInlineReplyContent] = useState("");
  const [isSubmittingInlineReply, setIsSubmittingInlineReply] = useState(false);
  const [inlineReplyError, setInlineReplyError] = useState<string | null>(null);

  // Inline mention autocomplete state
  const [inlineMentionQuery, setInlineMentionQuery] = useState("");
  const [inlineMentionResults, setInlineMentionResults] = useState<MentionCandidate[]>([]);
  const [isSearchingInlineMentions, setIsSearchingInlineMentions] = useState(false);
  const [showInlineMentionDropdown, setShowInlineMentionDropdown] = useState(false);
  const [activeInlineMentionIndex, setActiveInlineMentionIndex] = useState(0);
  const [selectedInlineMentions, setSelectedInlineMentions] = useState<Map<string, string>>(new Map());

  const inlineMentionStartRef = useRef<number | null>(null);
  const inlineMentionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inlineReplyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inlineMentionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(target) &&
        replyTextareaRef.current &&
        !replyTextareaRef.current.contains(target)
      ) {
        setShowMentionDropdown(false);
      }
      if (
        inlineMentionDropdownRef.current &&
        !inlineMentionDropdownRef.current.contains(target) &&
        inlineReplyTextareaRef.current &&
        !inlineReplyTextareaRef.current.contains(target)
      ) {
        setShowInlineMentionDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (mentionDebounceRef.current) {
        clearTimeout(mentionDebounceRef.current);
      }
      if (inlineMentionDebounceRef.current) {
        clearTimeout(inlineMentionDebounceRef.current);
      }
    };
  }, []);

  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Edit-thread state
  const [isEditing, setIsEditing] = useState(false);
  const [editTopic, setEditTopic] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Sync state if props change
  React.useEffect(() => {
    setThread(initialThread);
  }, [initialThread]);

  React.useEffect(() => {
    setReplies(initialReplies);
  }, [initialReplies]);

  React.useEffect(() => {
    if (initialRepliesPage) setRepliesPage(initialRepliesPage);
  }, [initialRepliesPage]);

  React.useEffect(() => {
    if (initialRepliesTotalPages) setRepliesTotalPages(initialRepliesTotalPages);
  }, [initialRepliesTotalPages]);

  // Load More Replies
  const handleLoadMoreReplies = async () => {
    if (isLoadingMoreReplies || repliesPage >= repliesTotalPages) return;
    setIsLoadingMoreReplies(true);
    setLoadMoreError(null);
    try {
      const nextPage = repliesPage + 1;
      const res = await CommunityService.listReplies(thread._id, { page: nextPage });
      const newItems = Array.isArray(res) ? res : res.items || [];
      setReplies((prev) => [...prev, ...newItems]);
      setRepliesPage(res.page || nextPage);
      setRepliesTotalPages(res.pages || repliesTotalPages);
    } catch (err: any) {
      setLoadMoreError(err.response?.data?.message || "Failed to load more replies.");
    } finally {
      setIsLoadingMoreReplies(false);
    }
  };

  const currentUserId = currentUser?.userId || (currentUser as any)?.id || (currentUser as any)?._id;
  const hasUpvoted = Boolean(currentUserId && thread.upvotes?.includes(currentUserId));
  const upvoteCount = thread.upvotes?.length || 0;
  const authorName = getAuthorDisplayName(thread.author);

  // Upvote toggle
  const handleUpvote = async () => {
    if (!currentUser) {
      setActionError("Please log in to upvote this discussion.");
      return;
    }
    setActionError(null);
    setIsUpvoting(true);
    try {
      const updated = await CommunityService.toggleUpvote(thread._id);
      setThread(updated);
      onThreadUpdate?.(updated);
    } catch (err: any) {
      setActionError(err.response?.data?.message || "Failed to update upvote. Please try again.");
    } finally {
      setIsUpvoting(false);
    }
  };

  // Pin toggle (author or admin only)
  const handleTogglePin = async () => {
    setActionError(null);
    setIsPinning(true);
    try {
      const nextPinState = !thread.isPinned;
      const updated = await CommunityService.pinForum(thread._id, nextPinState);
      setThread(updated);
      onThreadUpdate?.(updated);
    } catch (err: any) {
      setActionError(err.response?.data?.message || "Failed to update pin status.");
    } finally {
      setIsPinning(false);
    }
  };

  // Lock toggle (author or admin only)
  const handleToggleLock = async () => {
    setActionError(null);
    setIsLocking(true);
    try {
      const nextLockState = !thread.isLocked;
      const updated = await CommunityService.lockForum(thread._id, nextLockState);
      setThread(updated);
      onThreadUpdate?.(updated);
    } catch (err: any) {
      setActionError(err.response?.data?.message || "Failed to update lock status.");
    } finally {
      setIsLocking(false);
    }
  };

  // Delete Thread (author or admin only)
  const handleDeleteThread = async () => {
    if (!window.confirm("Are you sure you want to delete this discussion thread? This action cannot be undone.")) {
      return;
    }
    setActionError(null);
    setIsDeleting(true);
    try {
      await CommunityService.deleteForum(thread._id);
      if (currentUserId) {
        router.push(`/mentorship/mentorProfile/${currentUserId}?tab=community`);
      } else {
        router.push("/mentorship");
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || "Failed to delete thread. Please try again.");
      setIsDeleting(false);
    }
  };

  // Edit Thread (author or admin only)
  const handleStartEdit = () => {
    setEditTopic(thread.topic);
    setEditDescription(thread.description || "");
    setEditError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTopic("");
    setEditDescription("");
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editTopic.trim()) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      const updated = await CommunityService.updateForum(thread._id, {
        topic: editTopic.trim(),
        description: editDescription.trim() || undefined,
      });
      setThread(updated);
      onThreadUpdate?.(updated);
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err.response?.data?.message || "Failed to save changes. Please try again.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Debounced search for @mentions
  const searchMentionUsers = useCallback((query: string) => {
    if (mentionDebounceRef.current) {
      clearTimeout(mentionDebounceRef.current);
    }

    if (!query) {
      setMentionResults([]);
      setIsSearchingMentions(false);
      return;
    }

    mentionDebounceRef.current = setTimeout(async () => {
      setIsSearchingMentions(true);
      try {
        const res = await AuthService.getAllUsers({ search: query, limit: 5 } as any);
        const users: any[] = res?.data?.users || [];
        const candidates = await resolveMentionCandidates(users);
        setMentionResults(candidates);
        setActiveMentionIndex(0);
      } catch (err) {
        console.error("Failed to search users for mentions:", err);
        setMentionResults([]);
      } finally {
        setIsSearchingMentions(false);
      }
    }, 250);
  }, []);

  // Text change handler in reply textarea to detect "@" token at cursor
  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setReplyContent(val);

    const textBeforeCursor = val.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex === -1) {
      setShowMentionDropdown(false);
      mentionStartRef.current = null;
      return;
    }

    // "@" must be at the very start of the text or preceded by whitespace / newline
    const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : " ";
    const isValidStart = /\s/.test(charBeforeAt) || atIndex === 0;

    const textAfterAt = textBeforeCursor.slice(atIndex + 1);
    const hasSpaceAfterAt = /\s/.test(textAfterAt);

    if (isValidStart && !hasSpaceAfterAt) {
      mentionStartRef.current = atIndex;
      setMentionQuery(textAfterAt);
      setShowMentionDropdown(true);
      searchMentionUsers(textAfterAt);
    } else {
      setShowMentionDropdown(false);
      mentionStartRef.current = null;
    }
  };

  // Keyboard navigation for mention dropdown (Arrow Up/Down, Enter, Esc)
  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionDropdown && mentionResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev + 1) % mentionResults.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev - 1 + mentionResults.length) % mentionResults.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelectMention(mentionResults[activeMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionDropdown(false);
        return;
      }
    }
  };

  // Select mention candidate and replace @partial with @FullName 
  const handleSelectMention = (candidate: MentionCandidate) => {
    const textarea = replyTextareaRef.current;
    const atIndex = mentionStartRef.current;
    if (atIndex === null || atIndex === undefined) return;

    const cursorPos = textarea?.selectionStart ?? (atIndex + mentionQuery.length + 1);
    const mentionToken = `@${candidate.name} `;

    const before = replyContent.slice(0, atIndex);
    const after = replyContent.slice(cursorPos);
    const updatedContent = before + mentionToken + after;

    setReplyContent(updatedContent);

    // Track userId mapped to candidate's name
    setSelectedMentions((prev) => {
      const next = new Map(prev);
      next.set(candidate.name, candidate.userId);
      return next;
    });

    setShowMentionDropdown(false);
    mentionStartRef.current = null;

    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        const newCursorPos = atIndex + mentionToken.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || thread.isLocked || isSubmittingReply) return;

    if (!currentUser) {
      setReplyError("Please log in to post a reply.");
      return;
    }

    setReplyError(null);
    setIsSubmittingReply(true);

    try {
      // Precise ID-based tracking: only submit userIds whose @Name token remains in replyContent
      const mentionIds: string[] = [];
      selectedMentions.forEach((userId, name) => {
        if (replyContent.includes(`@${name}`) && !mentionIds.includes(userId)) {
          mentionIds.push(userId);
        }
      });

      const newReply = await CommunityService.addReply(thread._id, {
        content: replyContent.trim(),
        ...(mentionIds.length > 0 && { mentions: mentionIds }),
      });
      setReplies((prev) => [...prev, newReply]);
      setThread((prev) => ({
        ...prev,
        replyCount: (prev.replyCount || 0) + 1,
      }));
      setReplyContent("");
      setSelectedMentions(new Map());
      onReplyAdded?.(newReply);
    } catch (err: any) {
      setReplyError(err.response?.data?.message || "Failed to post reply. Please try again.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Inline mention search
  const searchInlineMentionUsers = useCallback((query: string) => {
    if (inlineMentionDebounceRef.current) {
      clearTimeout(inlineMentionDebounceRef.current);
    }

    if (!query) {
      setInlineMentionResults([]);
      setIsSearchingInlineMentions(false);
      return;
    }

    inlineMentionDebounceRef.current = setTimeout(async () => {
      setIsSearchingInlineMentions(true);
      try {
        const res = await AuthService.getAllUsers({ search: query, limit: 5 } as any);
        const users: any[] = res?.data?.users || [];
        const candidates = await resolveMentionCandidates(users);
        setInlineMentionResults(candidates);
        setActiveInlineMentionIndex(0);
      } catch (err) {
        console.error("Failed to search users for inline mention:", err);
        setInlineMentionResults([]);
      } finally {
        setIsSearchingInlineMentions(false);
      }
    }, 250);
  }, []);

  const handleInlineReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setInlineReplyContent(val);

    const textBeforeCursor = val.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex === -1) {
      setShowInlineMentionDropdown(false);
      inlineMentionStartRef.current = null;
      return;
    }

    const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : " ";
    const isValidStart = /\s/.test(charBeforeAt) || atIndex === 0;

    const textAfterAt = textBeforeCursor.slice(atIndex + 1);
    const hasSpaceAfterAt = /\s/.test(textAfterAt);

    if (isValidStart && !hasSpaceAfterAt) {
      inlineMentionStartRef.current = atIndex;
      setInlineMentionQuery(textAfterAt);
      setShowInlineMentionDropdown(true);
      searchInlineMentionUsers(textAfterAt);
    } else {
      setShowInlineMentionDropdown(false);
      inlineMentionStartRef.current = null;
    }
  };

  const handleInlineReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showInlineMentionDropdown && inlineMentionResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveInlineMentionIndex((prev) => (prev + 1) % inlineMentionResults.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveInlineMentionIndex((prev) => (prev - 1 + inlineMentionResults.length) % inlineMentionResults.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelectInlineMention(inlineMentionResults[activeInlineMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowInlineMentionDropdown(false);
        return;
      }
    }
  };

  const handleSelectInlineMention = (candidate: MentionCandidate) => {
    const textarea = inlineReplyTextareaRef.current;
    const atIndex = inlineMentionStartRef.current;
    if (atIndex === null || atIndex === undefined) return;

    const cursorPos = textarea?.selectionStart ?? (atIndex + inlineMentionQuery.length + 1);
    const mentionToken = `@${candidate.name} `;

    const before = inlineReplyContent.slice(0, atIndex);
    const after = inlineReplyContent.slice(cursorPos);
    const updatedContent = before + mentionToken + after;

    setInlineReplyContent(updatedContent);

    setSelectedInlineMentions((prev) => {
      const next = new Map(prev);
      next.set(candidate.name, candidate.userId);
      return next;
    });

    setShowInlineMentionDropdown(false);
    inlineMentionStartRef.current = null;

    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        const newCursorPos = atIndex + mentionToken.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  // Create an inline reply directly to another reply
  const handleCreateInlineReply = async (parentReplyId: string) => {
    if (!inlineReplyContent.trim() || thread.isLocked || isSubmittingInlineReply) return;
    if (!currentUser) {
      setInlineReplyError("Please log in to post a reply.");
      return;
    }

    setInlineReplyError(null);
    setIsSubmittingInlineReply(true);

    try {
      const mentionIds: string[] = [];
      selectedInlineMentions.forEach((userId, name) => {
        if (inlineReplyContent.includes(`@${name}`) && !mentionIds.includes(userId)) {
          mentionIds.push(userId);
        }
      });

      const newReply = await CommunityService.addReply(thread._id, {
        content: inlineReplyContent.trim(),
        ...(mentionIds.length > 0 && { mentions: mentionIds }),
        parentReplyId,
      });

      setReplies((prev) => [...prev, newReply]);
      setThread((prev) => ({
        ...prev,
        replyCount: (prev.replyCount || 0) + 1,
      }));
      setInlineReplyContent("");
      setReplyingToReplyId(null);
      setSelectedInlineMentions(new Map());
      onReplyAdded?.(newReply);
    } catch (err: any) {
      setInlineReplyError(err.response?.data?.message || "Failed to post reply. Please try again.");
    } finally {
      setIsSubmittingInlineReply(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 transition-colors hover:opacity-80"
        style={{
          backgroundColor: COLORS.chip,
          color: COLORS.accent,
          border: `1px solid ${COLORS.hairline}`,
        }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Community</span>
      </button>

      {/* Action Error Banner */}
      {actionError && (
        <div
          className="mb-4 p-3 rounded-xl flex items-center gap-2 text-xs font-medium"
          style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Thread Card */}
      <div
        className="bg-white p-6 rounded-2xl mb-6 shadow-sm"
        style={{ border: `1px solid ${COLORS.hairline}` }}
      >
        {/* Header Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
              style={{ backgroundColor: COLORS.chip, color: COLORS.accent }}
            >
              {getCategoryLabel(thread.category)}
            </span>
            {thread.isPinned && (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
              >
                <Pin className="w-3 h-3" />
                Pinned
              </span>
            )}
            {thread.isLocked && (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
              >
                <Lock className="w-3 h-3" />
                Locked
              </span>
            )}
          </div>

          <p className="text-xs" style={{ color: COLORS.muted }}>
            Posted {timeAgo(thread.createdAt)}
          </p>
        </div>

        {/* Topic Title */}
        {isEditing ? (
          <div className="mb-4 space-y-2">
            <input
              type="text"
              value={editTopic}
              onChange={(e) => setEditTopic(e.target.value)}
              placeholder="Thread topic"
              className="w-full text-lg font-bold px-3 py-2 rounded-xl"
              style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: "#fff", color: COLORS.ink }}
            />
            <textarea
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)..."
              className="w-full text-sm px-3 py-2 rounded-xl"
              style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: "#fff", color: COLORS.ink }}
            />
            {editError && (
              <p className="text-xs" style={{ color: "#b3543f" }}>{editError}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editTopic.trim()}
                className="text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50 transition-colors"
                style={{ backgroundColor: COLORS.accent, color: "#fff" }}
              >
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSavingEdit}
                className="text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors"
                style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <h1 className="text-2xl font-bold mb-3" style={{ color: COLORS.ink }}>
            {thread.topic}
          </h1>
        )}

        {/* Author Byline */}
        <div className="flex items-center gap-2.5 mb-5 pb-4" style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
            style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
          >
            {authorName[0]?.toUpperCase() || "C"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: COLORS.ink }}>
              {authorName}
            </p>
            <p className="text-[11px]" style={{ color: COLORS.muted }}>
              Community Member
            </p>
          </div>
        </div>

        {/* Thread Body/Description — only shown when not editing */}
        {!isEditing && (
          thread.description ? (
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap mb-6"
              style={{ color: COLORS.ink }}
            >
              {thread.description}
            </div>
          ) : (
            <p className="text-sm italic mb-6" style={{ color: COLORS.muted }}>
              No additional description provided.
            </p>
          )
        )}

        {/* Action Bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 pt-4"
          style={{ borderTop: `1px solid ${COLORS.hairline}` }}
        >
          {/* Upvote & Reply count */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpvote}
              disabled={isUpvoting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
              style={{
                backgroundColor: hasUpvoted ? COLORS.accent : COLORS.softWash,
                color: hasUpvoted ? "#fff" : COLORS.ink,
                border: `1px solid ${hasUpvoted ? COLORS.accent : COLORS.hairline}`,
              }}
              title={hasUpvoted ? "Remove upvote" : "Upvote this discussion"}
            >
              {isUpvoting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? "fill-current" : ""}`} />
              )}
              <span>{upvoteCount}</span>
            </button>

            <span className="inline-flex items-center gap-1 text-xs" style={{ color: COLORS.muted }}>
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{replies.length} replies</span>
            </span>
          </div>

          {/* Author/Admin Actions: Pin, Lock, Edit & Delete */}
          {isAuthorOrAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePin}
                disabled={isPinning || isDeleting || isEditing}
                className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: thread.isPinned ? "#fef3c7" : COLORS.softWash,
                  color: thread.isPinned ? "#92400e" : COLORS.ink,
                  border: `1px solid ${thread.isPinned ? "#fde68a" : COLORS.hairline}`,
                }}
              >
                {isPinning ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Pin className="w-3 h-3" />
                )}
                <span>{thread.isPinned ? "Unpin" : "Pin Thread"}</span>
              </button>

              <button
                onClick={handleToggleLock}
                disabled={isLocking || isDeleting || isEditing}
                className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: thread.isLocked ? "#fee2e2" : COLORS.softWash,
                  color: thread.isLocked ? "#991b1b" : COLORS.ink,
                  border: `1px solid ${thread.isLocked ? "#fecaca" : COLORS.hairline}`,
                }}
              >
                {isLocking ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : thread.isLocked ? (
                  <Unlock className="w-3 h-3" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
                <span>{thread.isLocked ? "Unlock Thread" : "Lock Thread"}</span>
              </button>

              {/* Edit button */}
              {!isEditing && (
                <button
                  onClick={handleStartEdit}
                  disabled={isPinning || isLocking || isDeleting}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: COLORS.softWash,
                    color: COLORS.accent,
                    border: `1px solid ${COLORS.hairline}`,
                  }}
                  title="Edit topic and description"
                >
                  <span>✏ Edit</span>
                </button>
              )}

              <button
                onClick={handleDeleteThread}
                disabled={isDeleting || isPinning || isLocking || isEditing}
                className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 hover:opacity-80"
                style={{
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                }}
                title="Delete this discussion thread"
              >
                {isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                <span>{isDeleting ? "Deleting..." : "Delete Thread"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Locked Thread Banner */}
      {thread.isLocked && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
        >
          <Lock className="w-5 h-5 shrink-0" style={{ color: "#d97706" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#92400e" }}>
              This thread is locked
            </p>
            <p className="text-xs" style={{ color: "#b45309" }}>
              Replies have been disabled by the author or an administrator.
            </p>
          </div>
        </div>
      )}

      {/* Replies Section */}
      <div
        className="bg-white p-6 rounded-2xl mb-6 shadow-sm"
        style={{ border: `1px solid ${COLORS.hairline}` }}
      >
        <h2 className="text-base font-bold mb-4" style={{ color: COLORS.ink }}>
          Replies ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: COLORS.muted }}>
            No replies yet. Be the first to share your thoughts!
          </p>
        ) : (
          <div className="space-y-4">
            {(() => {
              // Group replies into top-level and 1-level nested children
              const topLevelReplies: ForumReply[] = [];
              const childRepliesMap = new Map<string, ForumReply[]>();
              const topLevelIds = new Set<string>();

              replies.forEach((r) => {
                if (!r.parentReplyId) {
                  topLevelReplies.push(r);
                  topLevelIds.add(r._id);
                }
              });

              replies.forEach((r) => {
                if (r.parentReplyId) {
                  if (topLevelIds.has(r.parentReplyId)) {
                    const list = childRepliesMap.get(r.parentReplyId) || [];
                    list.push(r);
                    childRepliesMap.set(r.parentReplyId, list);
                  } else {
                    // Fallback: if parent not in memory yet, render at top-level
                    topLevelReplies.push(r);
                    topLevelIds.add(r._id);
                  }
                }
              });

              return topLevelReplies.map((reply) => {
                const replyAuthorName = getAuthorDisplayName(reply.author);
                const isReplying = replyingToReplyId === reply._id;
                const childReplies = childRepliesMap.get(reply._id) || [];

                return (
                  <div
                    key={reply._id}
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: COLORS.softWash,
                      border: `1px solid ${COLORS.hairline}`,
                    }}
                  >
                    {/* Top-level reply header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0"
                          style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
                        >
                          {replyAuthorName[0]?.toUpperCase() || "C"}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: COLORS.ink }}>
                          {replyAuthorName}
                        </span>
                      </div>
                      <span className="text-[11px]" style={{ color: COLORS.muted }}>
                        {timeAgo(reply.createdAt)}
                      </span>
                    </div>

                    {/* Top-level reply content */}
                    <div
                      className="text-xs leading-relaxed whitespace-pre-wrap pl-8"
                      style={{ color: COLORS.ink }}
                    >
                      {formatReplyWithMentions(reply.content)}
                    </div>

                    {/* Action bar: Reply link */}
                    {currentUser && !thread.isLocked && (
                      <div className="pl-8 mt-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (isReplying) {
                              setReplyingToReplyId(null);
                              setInlineReplyContent("");
                              setInlineReplyError(null);
                              setShowInlineMentionDropdown(false);
                            } else {
                              setReplyingToReplyId(reply._id);
                              setInlineReplyContent(`@${replyAuthorName} `);
                              setInlineReplyError(null);
                              setShowInlineMentionDropdown(false);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80 cursor-pointer"
                          style={{ color: COLORS.accent }}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{isReplying ? "Cancel Reply" : "Reply"}</span>
                        </button>
                      </div>
                    )}

                    {/* Inline Reply Form */}
                    {isReplying && (
                      <div
                        className="mt-3 ml-8 p-3.5 rounded-xl bg-white shadow-sm"
                        style={{ border: `1px solid ${COLORS.hairline}` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold" style={{ color: COLORS.ink }}>
                            Replying to <span style={{ color: COLORS.accent }}>@{replyAuthorName}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToReplyId(null);
                              setInlineReplyContent("");
                              setInlineReplyError(null);
                              setShowInlineMentionDropdown(false);
                            }}
                            className="text-xs transition-colors hover:underline cursor-pointer"
                            style={{ color: COLORS.muted }}
                          >
                            Cancel
                          </button>
                        </div>

                        {inlineReplyError && (
                          <p className="text-xs mb-2" style={{ color: "#b3543f" }}>
                            {inlineReplyError}
                          </p>
                        )}

                        <div className="relative mb-2">
                          <textarea
                            ref={inlineReplyTextareaRef}
                            rows={2}
                            value={inlineReplyContent}
                            onChange={handleInlineReplyChange}
                            onKeyDown={handleInlineReplyKeyDown}
                            disabled={isSubmittingInlineReply}
                            placeholder={`Reply to ${replyAuthorName}... (@ to mention)`}
                            className="w-full text-xs p-2.5 rounded-lg focus:outline-none transition-colors"
                            style={{
                              border: `1px solid ${COLORS.hairline}`,
                              backgroundColor: "#fff",
                              color: COLORS.ink,
                            }}
                          />

                          {showInlineMentionDropdown && (
                            <MentionDropdown
                              candidates={inlineMentionResults}
                              isSearching={isSearchingInlineMentions}
                              activeIndex={activeInlineMentionIndex}
                              onSelect={handleSelectInlineMention}
                              onHover={setActiveInlineMentionIndex}
                              dropdownRef={inlineMentionDropdownRef}
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[11px]" style={{ color: COLORS.muted }}>
                            Use @Name to mention someone
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCreateInlineReply(reply._id)}
                            disabled={isSubmittingInlineReply || !inlineReplyContent.trim()}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            style={{ backgroundColor: COLORS.accent, color: "#fff" }}
                          >
                            {isSubmittingInlineReply ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Replying...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                <span>Post Reply</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Nested child replies (1 level of nesting) */}
                    {childReplies.length > 0 && (
                      <div
                        className="mt-3 ml-8 space-y-2.5 border-l-2 pl-3"
                        style={{ borderColor: COLORS.hairline }}
                      >
                        {childReplies.map((nested) => {
                          const nestedAuthorName = getAuthorDisplayName(nested.author);
                          return (
                            <div
                              key={nested._id}
                              className="p-3 rounded-xl"
                              style={{
                                backgroundColor: "#ffffff",
                                border: `1px solid ${COLORS.hairline}`,
                              }}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0"
                                    style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
                                  >
                                    {nestedAuthorName[0]?.toUpperCase() || "C"}
                                  </div>
                                  <span
                                    className="text-xs font-semibold"
                                    style={{ color: COLORS.ink }}
                                  >
                                    {nestedAuthorName}
                                  </span>
                                </div>
                                <span className="text-[10px]" style={{ color: COLORS.muted }}>
                                  {timeAgo(nested.createdAt)}
                                </span>
                              </div>
                              <div
                                className="text-xs leading-relaxed whitespace-pre-wrap pl-7"
                                style={{ color: COLORS.ink }}
                              >
                                {formatReplyWithMentions(nested.content)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Load More Replies */}
        {repliesPage < repliesTotalPages && (
          <div className="mt-6 text-center pt-2">
            {loadMoreError && (
              <p className="text-xs mb-2" style={{ color: "#b3543f" }}>
                {loadMoreError}
              </p>
            )}
            <button
              type="button"
              onClick={handleLoadMoreReplies}
              disabled={isLoadingMoreReplies}
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full transition-all disabled:opacity-50 hover:opacity-80"
              style={{
                backgroundColor: COLORS.chip,
                color: COLORS.ink,
                border: `1px solid ${COLORS.hairline}`,
              }}
            >
              {isLoadingMoreReplies ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: COLORS.accent }} />
                  <span>Loading replies...</span>
                </>
              ) : (
                <span>Load More Replies</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Reply Compose Form */}
      <div
        className="bg-white p-6 rounded-2xl shadow-sm"
        style={{ border: `1px solid ${COLORS.hairline}` }}
      >
        <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.ink }}>
          Leave a Reply
        </h3>

        {replyError && (
          <p className="text-xs mb-3" style={{ color: "#b3543f" }}>
            {replyError}
          </p>
        )}

        <form onSubmit={handleCreateReply}>
          <div className="relative mb-3">
            <textarea
              ref={replyTextareaRef}
              rows={4}
              value={replyContent}
              onChange={handleReplyChange}
              onKeyDown={handleReplyKeyDown}
              disabled={thread.isLocked || isSubmittingReply}
              placeholder={
                thread.isLocked
                  ? "This thread is locked. Replies cannot be submitted."
                  : currentUser
                  ? "Write your reply... Use @Name to mention someone."
                  : "Please log in to post a reply."
              }
              className="w-full text-sm p-3 rounded-xl focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                border: `1px solid ${COLORS.hairline}`,
                backgroundColor: thread.isLocked ? "#f9f9f9" : "#fff",
                color: COLORS.ink,
              }}
            />

            {/* Mention Autocomplete Dropdown */}
            {showMentionDropdown && (
              <MentionDropdown
                candidates={mentionResults}
                isSearching={isSearchingMentions}
                activeIndex={activeMentionIndex}
                onSelect={handleSelectMention}
                onHover={setActiveMentionIndex}
                dropdownRef={mentionDropdownRef}
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: COLORS.muted }}>
              {thread.isLocked
                ? "Thread is locked"
                : !currentUser
                ? "Authentication required"
                : "Use @Name to mention someone · Markdown supported"}
            </span>

            <button
              type="submit"
              disabled={
                thread.isLocked ||
                isSubmittingReply ||
                !replyContent.trim() ||
                !currentUser
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: COLORS.accent,
                color: "#fff",
              }}
            >
              {isSubmittingReply ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Reply</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
