// src/app/mentorship/community/forums/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Pin,
  Lock,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
} from "lucide-react";

import CommunityService from "@/lib/api/community.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Forum, ForumCategory } from "@/types/community.types";

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

export default function AllForumsPage() {
  const { user } = useAuth();

  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // New thread form state
  const [showForumForm, setShowForumForm] = useState(false);
  const [forumTopic, setForumTopic] = useState("");
  const [forumCategory, setForumCategory] = useState<ForumCategory>("general");
  const [forumDescription, setForumDescription] = useState("");
  const [forumSubmitting, setForumSubmitting] = useState(false);
  const [forumSubmitError, setForumSubmitError] = useState<string | null>(null);

  const fetchForums = useCallback(
    async (targetPage: number, querySearch = activeSearch) => {
      setLoading(true);
      setError(null);
      try {
        const trimmed = querySearch.trim();
        const data = await CommunityService.listForums({
          page: targetPage,
          limit,
          ...(trimmed ? { search: trimmed } : {}),
        });
        if (Array.isArray(data)) {
          setForums(data);
          setTotal(data.length);
          setPages(1);
          setPage(1);
        } else {
          setForums(data.items || []);
          setTotal(data.total || 0);
          setPage(data.page || 1);
          setPages(data.pages || 1);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Couldn't load discussions right now.");
      } finally {
        setLoading(false);
      }
    },
    [limit, activeSearch]
  );

  useEffect(() => {
    fetchForums(page, activeSearch);
  }, [page, activeSearch, fetchForums]);

  // Debounced search handler (250ms delay)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      setActiveSearch(val);
    }, 250);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setPage(1);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
  };


  const handleCreateForum = async () => {
    if (!forumTopic.trim()) return;
    setForumSubmitting(true);
    setForumSubmitError(null);
    try {
      await CommunityService.createForum({
        topic: forumTopic.trim(),
        category: forumCategory,
        description: forumDescription.trim() || undefined,
      });
      setForumTopic("");
      setForumCategory("general");
      setForumDescription("");
      setShowForumForm(false);
      // Reload first page to show newly created thread
      if (page === 1) {
        fetchForums(1);
      } else {
        setPage(1);
      }
    } catch (err: any) {
      setForumSubmitError(err.response?.data?.message || "Couldn't create thread.");
    } finally {
      setForumSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fdfbf9" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation / Header */}
        <div className="mb-6">
          <Link
            href="/mentorship"
            className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline mb-3"
            style={{ color: COLORS.accent }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Mentorship Community</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: COLORS.ink }}
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
                  Discussion Forums
                </h1>
                <p className="text-xs" style={{ color: COLORS.muted }}>
                  Browse and join conversations across the mentorship community
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {total > 0 && (
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
                >
                  {total} {total === 1 ? "thread" : "threads"}
                </span>
              )}
              {user && (
                <button
                  type="button"
                  onClick={() => setShowForumForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: COLORS.ink, color: "#fff" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Thread</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* New Thread Form Modal / Inset */}
        {showForumForm && (
          <div
            className="mb-6 p-5 rounded-2xl space-y-3"
            style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.softWash }}
          >
            <h3 className="text-sm font-bold" style={{ color: COLORS.ink }}>
              Start a New Discussion Thread
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={forumTopic}
                onChange={(e) => setForumTopic(e.target.value)}
                placeholder="Thread topic (e.g. Tips for First-Time Mentors)"
                className="flex-1 text-sm px-3 py-2 rounded-lg"
                style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: "#fff" }}
              />
              <select
                value={forumCategory}
                onChange={(e) => setForumCategory(e.target.value as ForumCategory)}
                className="text-sm px-3 py-2 rounded-lg"
                style={{
                  border: `1px solid ${COLORS.hairline}`,
                  backgroundColor: "#fff",
                  color: COLORS.ink,
                }}
              >
                <option value="general">General</option>
                <option value="teaching-tips">Teaching Tips</option>
                <option value="pricing">Pricing</option>
                <option value="tech-stack">Tech Stack</option>
              </select>
            </div>
            <textarea
              rows={3}
              value={forumDescription}
              onChange={(e) => setForumDescription(e.target.value)}
              placeholder="Description or opening thoughts (optional)..."
              className="w-full text-sm px-3 py-2 rounded-lg"
              style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: "#fff" }}
            />
            {forumSubmitError && (
              <p className="text-xs" style={{ color: "#b3543f" }}>
                {forumSubmitError}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateForum}
                disabled={forumSubmitting || !forumTopic.trim()}
                className="text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50 transition-colors"
                style={{ backgroundColor: COLORS.accent, color: "#fff" }}
              >
                {forumSubmitting ? "Posting..." : "Post Thread"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForumForm(false);
                  setForumTopic("");
                  setForumDescription("");
                  setForumSubmitError(null);
                }}
                className="text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors"
                style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Content list */}
        <div
          className="bg-white p-6 rounded-2xl shadow-sm"
          style={{ border: `1px solid ${COLORS.hairline}` }}
        >
          {/* Search Input */}
          <div className="mb-5 relative">
            <div className="relative flex items-center">
              <Search
                className="w-4 h-4 absolute left-3.5 pointer-events-none"
                style={{ color: COLORS.muted }}
              />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search discussions by topic or keywords..."
                className="w-full text-xs pl-9 pr-9 py-2.5 rounded-xl focus:outline-none transition-colors"
                style={{
                  border: `1px solid ${COLORS.hairline}`,
                  backgroundColor: COLORS.softWash,
                  color: COLORS.ink,
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 p-1 rounded-full text-xs hover:bg-gray-200 transition-colors cursor-pointer"
                  style={{ color: COLORS.muted }}
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.accent }} />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm mb-4" style={{ color: "#b3543f" }}>
                {error}
              </p>
              <button
                type="button"
                onClick={() => fetchForums(page, activeSearch)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
              >
                Try Again
              </button>
            </div>
          ) : forums.length === 0 ? (
            <div className="text-center py-16">
              {activeSearch ? (
                <>
                  <p className="text-sm font-semibold mb-1" style={{ color: COLORS.ink }}>
                    No discussions found matching &ldquo;{activeSearch}&rdquo;
                  </p>
                  <p className="text-xs mb-4" style={{ color: COLORS.muted }}>
                    Try searching with different keywords or clear your search filter.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="text-xs font-semibold px-3.5 py-1.5 rounded-full cursor-pointer transition-colors"
                    style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <p className="text-sm" style={{ color: COLORS.muted }}>
                  No discussions found. Be the first to start a conversation!
                </p>
              )}
            </div>

          ) : (
            <div className="space-y-3">
              {forums.map((forum) => {
                const authorName =
                  typeof forum.author === "object" && forum.author !== null && forum.author.name
                    ? forum.author.name
                    : "Community Member";

                return (
                  <Link
                    key={forum._id}
                    href={`/mentorship/community/forum/${forum._id}`}
                    className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors hover:border-[#c9baa9] block"
                    style={{
                      border: `1px solid ${COLORS.hairline}`,
                      backgroundColor: COLORS.softWash,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: COLORS.chip }}
                    >
                      <MessageCircle className="w-4.5 h-4.5" style={{ color: COLORS.accent }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
                          {forum.topic}
                        </p>
                        {forum.isPinned && (
                          <span title="Pinned">
                            <Pin className="w-3.5 h-3.5 shrink-0" style={{ color: COLORS.accent }} />
                          </span>
                        )}
                        {forum.isLocked && (
                          <span title="Locked">
                            <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: COLORS.muted }} />
                          </span>
                        )}
                      </div>
                      {forum.description && (
                        <p
                          className="text-xs mt-1 line-clamp-2"
                          style={{ color: COLORS.ink, opacity: 0.8 }}
                        >
                          {forum.description}
                        </p>
                      )}
                      <p className="text-xs mt-1.5" style={{ color: COLORS.muted }}>
                        {authorName} · {forum.replyCount} {forum.replyCount === 1 ? "reply" : "replies"} ·{" "}
                        {timeAgo(forum.lastActivityAt || forum.createdAt)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && !error && pages > 1 && (
            <div
              className="flex items-center justify-between pt-6 mt-6 border-t"
              style={{ borderColor: COLORS.hairline }}
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-medium" style={{ color: COLORS.muted }}>
                Page {page} of {pages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.chip, color: COLORS.ink }}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
