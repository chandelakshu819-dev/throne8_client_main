// src/features/mentorship/components/community/ThreadDetailView.tsx
"use client";

import React, { useState } from "react";
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

  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  // Add Reply
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
      const newReply = await CommunityService.addReply(thread._id, {
        content: replyContent.trim(),
      });
      setReplies((prev) => [...prev, newReply]);
      setThread((prev) => ({
        ...prev,
        replyCount: (prev.replyCount || 0) + 1,
      }));
      setReplyContent("");
      onReplyAdded?.(newReply);
    } catch (err: any) {
      setReplyError(err.response?.data?.message || "Failed to post reply. Please try again.");
    } finally {
      setIsSubmittingReply(false);
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
        <h1 className="text-2xl font-bold mb-3" style={{ color: COLORS.ink }}>
          {thread.topic}
        </h1>

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

        {/* Thread Body/Description */}
        {thread.description ? (
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

          {/* Author/Admin Actions: Pin & Lock */}
          {isAuthorOrAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePin}
                disabled={isPinning || isDeleting}
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
                disabled={isLocking || isDeleting}
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

              <button
                onClick={handleDeleteThread}
                disabled={isDeleting || isPinning || isLocking}
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
            {replies.map((reply) => {
              const replyAuthorName = getAuthorDisplayName(reply.author);
              return (
                <div
                  key={reply._id}
                  className="p-4 rounded-xl"
                  style={{
                    backgroundColor: COLORS.softWash,
                    border: `1px solid ${COLORS.hairline}`,
                  }}
                >
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
                  <div
                    className="text-xs leading-relaxed whitespace-pre-wrap pl-8"
                    style={{ color: COLORS.ink }}
                  >
                    {reply.content}
                  </div>
                </div>
              );
            })}
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
          <textarea
            rows={4}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            disabled={thread.isLocked || isSubmittingReply}
            placeholder={
              thread.isLocked
                ? "This thread is locked. Replies cannot be submitted."
                : currentUser
                ? "Write your reply here..."
                : "Please log in to post a reply."
            }
            className="w-full text-sm p-3 rounded-xl mb-3 focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              border: `1px solid ${COLORS.hairline}`,
              backgroundColor: thread.isLocked ? "#f9f9f9" : "#fff",
              color: COLORS.ink,
            }}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: COLORS.muted }}>
              {thread.isLocked
                ? "Thread is locked"
                : !currentUser
                ? "Authentication required"
                : "Markdown formatting supported"}
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
