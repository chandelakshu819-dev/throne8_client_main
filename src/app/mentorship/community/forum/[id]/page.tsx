// src/app/mentorship/community/forum/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import CommunityService from "@/lib/api/community.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Forum, ForumReply } from "@/types/community.types";
import ThreadDetailView from "@/features/mentorship/components/community/ThreadDetailView";

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  chip: "#f3ece4",
  softWash: "#fbf7f3",
  muted: "#8a7a6a",
};

export default function ForumThreadPage({
  params,
}: {
  params?: Promise<{ id: string }> | { id: string };
}) {
  const routerParams = useParams();
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  const { user, isLoading: authLoading } = useAuth();
  const [thread, setThread] = useState<Forum | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [repliesPage, setRepliesPage] = useState(1);
  const [repliesTotalPages, setRepliesTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve params across Next.js versions (Promise vs Object vs useParams hook)
  useEffect(() => {
    if (params) {
      if (typeof (params as any).then === "function") {
        (params as Promise<{ id: string }>).then((p) => {
          if (p?.id) setResolvedId(p.id);
        });
      } else if ((params as any).id) {
        setResolvedId((params as any).id);
      }
    } else if (routerParams?.id) {
      setResolvedId(routerParams.id as string);
    }
  }, [params, routerParams]);

  const threadId = resolvedId || (routerParams?.id as string);

  useEffect(() => {
    if (!threadId) return;

    let cancelled = false;

    async function fetchThreadDetails() {
      setLoading(true);
      setError(null);
      try {
        const [threadData, repliesData] = await Promise.all([
          CommunityService.getForumById(threadId),
          CommunityService.listReplies(threadId),
        ]);

        if (!cancelled) {
          setThread(threadData);
          const replyList = Array.isArray(repliesData) ? repliesData : repliesData.items || [];
          setReplies(replyList);
          setRepliesPage(!Array.isArray(repliesData) && repliesData.page ? repliesData.page : 1);
          setRepliesTotalPages(!Array.isArray(repliesData) && repliesData.pages ? repliesData.pages : 1);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Could not load the discussion thread. It may have been removed or you may need to log in."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchThreadDetails();

    return () => {
      cancelled = true;
    };
  }, [threadId]);

  // Determine author / admin authorization
  const currentUserId = user?.userId || (user as any)?.id || (user as any)?._id;
  const isAdmin = user?.role === "admin";
  const authorId =
    typeof thread?.author === "object" && thread?.author !== null
      ? thread.author.userId
      : typeof thread?.author === "string"
      ? thread.author
      : null;
  const isAuthor = Boolean(currentUserId && authorId && currentUserId === authorId);
  const isAuthorOrAdmin = Boolean(isAuthor || isAdmin);

  if (loading || authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.softWash }}
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.accent }} />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: COLORS.softWash }}
      >
        <div
          className="bg-white p-8 rounded-2xl max-w-md w-full text-center shadow-sm"
          style={{ border: `1px solid ${COLORS.hairline}` }}
        >
          <p className="text-sm mb-6" style={{ color: "#b3543f" }}>
            {error || "Thread not found."}
          </p>
          <Link
            href="/mentorship"
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full"
            style={{
              backgroundColor: COLORS.ink,
              color: "#fff",
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Mentorship Community</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fdfbf9" }}>
      <ThreadDetailView
        thread={thread}
        replies={replies}
        repliesPage={repliesPage}
        repliesTotalPages={repliesTotalPages}
        currentUser={user}
        isAuthorOrAdmin={isAuthorOrAdmin}
        onThreadUpdate={(updated) => setThread(updated)}
        onReplyAdded={(newReply) => {
          setReplies((prev) => [...prev, newReply]);
        }}
      />
    </div>
  );
}
