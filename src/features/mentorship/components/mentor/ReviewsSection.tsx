"use client";
// src/features/mentorship/components/mentor/ReviewsSection.tsx
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Star } from "./Icons";
import { C } from "../../types/data";
import ReviewService, {
    MentorReview,
    ReviewStats,
    ReviewSort,
    ReviewReaction,
} from "@/lib/api/review.service";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface ReviewsSectionProps {
    mentorId: string;
}

const PAGE_SIZE = 10;
const MAX_REPLY_LENGTH = 500;
const MIN_REPLY_LENGTH = 10;

const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "helpful", label: "Most helpful" },
    { value: "highest", label: "Highest rated" },
    { value: "lowest", label: "Lowest rated" },
];

const formatRelativeDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return "1 week ago";
    if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths <= 1) return "1 month ago";
    return `${diffMonths} months ago`;
};

// mentee object shape varies (firstName/lastName OR fullName OR name) — normalize here
const getMenteeName = (review: MentorReview): string => {
    const mentee = review.mentee;
    if (!mentee) return "Anonymous";
    const combined = `${mentee.firstName ?? ""} ${mentee.lastName ?? ""}`.trim();
    return combined || mentee.fullName || mentee.name || "Anonymous";
};

const getReviewKey = (review: MentorReview, idx: number): string =>
    review.reviewId || review.id || review._id || String(idx);

const isImageUrl = (v?: string | null): v is string => !!v && /^(https?:)?\/\//.test(v);

const linkBtn: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 600,
    color: C.mid,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "4px 6px",
};

const Spinner: React.FC<{ label: string }> = ({ label }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", gap: "12px" }}>
        <div style={{ width: "36px", height: "36px", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.dark}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "13px", color: C.mid }}>{label}</span>
    </div>
);

const ReactionButton: React.FC<{
    active: boolean;
    disabled: boolean;
    title: string;
    count: number;
    icon: React.ReactNode;
    onClick: () => void;
}> = ({ active, disabled, title, count, icon, onClick }) => (
    <button
        type="button"
        title={title}
        aria-pressed={active}
        disabled={disabled}
        onClick={onClick}
        style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            padding: "5px 12px",
            borderRadius: "999px",
            border: `1px solid ${active ? C.dark : C.border}`,
            background: active ? C.dark : "transparent",
            color: active ? "#fff" : C.mid,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled && !active ? 0.6 : 1,
        }}
    >
        {icon}
        <span>{count}</span>
    </button>
);

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ mentorId }) => {
    const { user, isAuthenticated } = useAuth();
    const currentUserId = user?.userId ? String(user.userId) : "";

    const [reviews, setReviews] = useState<MentorReview[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState<boolean>(!!mentorId);
    const [statsLoading, setStatsLoading] = useState<boolean>(!!mentorId);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<ReviewSort>("newest");
    const [reactions, setReactions] = useState<Record<string, ReviewReaction>>({});
    const [busyReactions, setBusyReactions] = useState<Record<string, boolean>>({});
    const [notice, setNotice] = useState<string | null>(null);

    // reply editor state
    const [replyingId, setReplyingId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [replySaving, setReplySaving] = useState(false);

    const showNotice = (msg: string) => {
        setNotice(msg);
        setTimeout(() => setNotice(null), 3500);
    };

    // stats only depend on the mentor
    useEffect(() => {
        if (!mentorId) {
            setStats(null);
            setStatsLoading(false);
            return;
        }
        setStatsLoading(true);
        ReviewService.getReviewStats(mentorId)
            .then((res) => setStats(res ?? null))
            .catch(() => setStats(null))
            .finally(() => setStatsLoading(false));
    }, [mentorId]);

    // first page (re-runs when the sort changes)
    useEffect(() => {
        if (!mentorId) {
            setReviews([]);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setPage(1);
        ReviewService.getMentorReviews(mentorId, 1, PAGE_SIZE, sort)
            .then((res) => {
                if (!cancelled) setReviews(res?.data ?? []);
            })
            .catch((err) => {
                console.error("Failed to load reviews", err);
                if (!cancelled) setReviews([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [mentorId, sort]);

    // the logged-in user's own like / dislike state
    useEffect(() => {
        if (!mentorId || !isAuthenticated) {
            setReactions({});
            return;
        }
        ReviewService.getMyReviewReactions(mentorId)
            .then(setReactions)
            .catch(() => setReactions({}));
    }, [mentorId, isAuthenticated]);

    const loadMore = useCallback(async () => {
        if (loadingMore) return;
        setLoadingMore(true);
        try {
            const next = page + 1;
            const res = await ReviewService.getMentorReviews(mentorId, next, PAGE_SIZE, sort);
            const incoming: MentorReview[] = res?.data ?? [];
            setReviews((prev) => {
                const seen = new Set(prev.map((r) => getReviewKey(r, -1)));
                return [...prev, ...incoming.filter((r) => !seen.has(getReviewKey(r, -1)))];
            });
            setPage(next);
        } catch (e: any) {
            showNotice(e?.message || "Failed to load more reviews.");
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, page, mentorId, sort]);

    const handleReact = async (review: MentorReview, type: ReviewReaction) => {
        if (!isAuthenticated) {
            showNotice("Please login to react to reviews.");
            return;
        }
        const id = review.reviewId || review.id || review._id;
        if (!id || busyReactions[id]) return;

        const previous = reactions[id];
        const next: ReviewReaction | undefined = previous === type ? undefined : type;

        // optimistic update
        const applyCounts = (r: MentorReview): MentorReview => {
            let like = r.helpfulCount ?? 0;
            let dislike = r.notHelpfulCount ?? 0;
            if (previous === "like") like -= 1;
            if (previous === "dislike") dislike -= 1;
            if (next === "like") like += 1;
            if (next === "dislike") dislike += 1;
            return { ...r, helpfulCount: Math.max(0, like), notHelpfulCount: Math.max(0, dislike) };
        };
        const setReaction = (val: ReviewReaction | undefined | null) =>
            setReactions((prev) => {
                const copy = { ...prev };
                if (val) copy[id] = val;
                else delete copy[id];
                return copy;
            });

        setBusyReactions((b) => ({ ...b, [id]: true }));
        setReviews((list) => list.map((r) => (getReviewKey(r, -1) === id ? applyCounts(r) : r)));
        setReaction(next);

        try {
            const result = await ReviewService.reactToReview(id, type);
            // reconcile with the server's truth
            setReviews((list) =>
                list.map((r) =>
                    getReviewKey(r, -1) === id
                        ? { ...r, helpfulCount: result.helpfulCount, notHelpfulCount: result.notHelpfulCount }
                        : r
                )
            );
            setReaction(result.userReaction);
        } catch (e: any) {
            // rollback
            setReviews((list) =>
                list.map((r) =>
                    getReviewKey(r, -1) === id
                        ? { ...r, helpfulCount: review.helpfulCount, notHelpfulCount: review.notHelpfulCount }
                        : r
                )
            );
            setReaction(previous);
            showNotice(e?.message || "Could not update your reaction.");
        } finally {
            setBusyReactions((b) => ({ ...b, [id]: false }));
        }
    };

    const openReply = (review: MentorReview) => {
        const id = review.reviewId || review.id || review._id || "";
        setReplyingId(id);
        setReplyText(review.mentorResponse?.comment ?? "");
    };

    const submitReply = async (review: MentorReview) => {
        const id = review.reviewId || review.id || review._id;
        if (!id) return;
        const text = replyText.trim();
        if (text.length < MIN_REPLY_LENGTH) {
            showNotice(`Reply must be at least ${MIN_REPLY_LENGTH} characters.`);
            return;
        }
        setReplySaving(true);
        try {
            const updated = await ReviewService.replyToReview(id, text);
            setReviews((list) =>
                list.map((r) =>
                    getReviewKey(r, -1) === id
                        ? {
                              ...r,
                              mentorResponse: updated?.mentorResponse ?? {
                                  comment: text,
                                  respondedAt: new Date().toISOString(),
                              },
                          }
                        : r
                )
            );
            setReplyingId(null);
            setReplyText("");
        } catch (e: any) {
            showNotice(e?.message || "Failed to post reply.");
        } finally {
            setReplySaving(false);
        }
    };

    const removeReply = async (review: MentorReview) => {
        const id = review.reviewId || review.id || review._id;
        if (!id) return;
        if (!window.confirm("Delete your reply?")) return;
        try {
            await ReviewService.deleteReviewReply(id);
            setReviews((list) =>
                list.map((r) => (getReviewKey(r, -1) === id ? { ...r, mentorResponse: undefined } : r))
            );
        } catch (e: any) {
            showNotice(e?.message || "Failed to delete reply.");
        }
    };

    const totalReviews = stats?.totalReviews ?? 0;
    const averageRating = stats?.averageRating ?? 0;
    const distribution = stats?.distribution ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    return (
        <div style={{ borderRadius: "24px", padding: "32px", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 8px 32px rgba(74,55,40,0.08)" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "24px" }}>Ratings &amp; Reviews</h2>

            {notice && (
                <div role="status" style={{ position: "sticky", top: "8px", zIndex: 5, marginBottom: "16px", padding: "10px 14px", borderRadius: "12px", background: "#fef3c7", color: "#92400e", fontSize: "13px" }}>
                    {notice}
                </div>
            )}

            {statsLoading && (
                <>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <Spinner label="Fetching reviews..." />
                </>
            )}

            {!statsLoading && totalReviews === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: C.mid, fontSize: "13px" }}>
                    No reviews yet.
                </div>
            )}

            {!statsLoading && totalReviews > 0 && (
                <>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "32px", alignItems: "center", marginBottom: "28px" }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "48px", fontWeight: "bold", color: C.dark }}>{averageRating.toFixed(1)}</div>
                            <div style={{ display: "flex", gap: "2px", justifyContent: "center", marginBottom: "4px" }}>
                                {[...Array(5)].map((_, i) => <Star key={i} filled={i < Math.round(averageRating)} style={{ color: "#f59e0b" }} />)}
                            </div>
                            <div style={{ fontSize: "12px", color: C.mid }}>Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}</div>
                        </div>
                        <div>
                            {[5, 4, 3, 2, 1].map((stars) => {
                                const count = distribution[stars as keyof typeof distribution] ?? 0;
                                const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                                return (
                                    <div key={stars} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                        <span style={{ fontSize: "12px", color: C.mid, width: "20px" }}>{stars}★</span>
                                        <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: C.border, overflow: "hidden" }}>
                                            <div style={{ height: "100%", borderRadius: "4px", background: C.mid, width: `${pct}%` }} />
                                        </div>
                                        <span style={{ fontSize: "12px", color: C.mid, width: "32px" }}>{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
                        <h3 style={{ fontWeight: "bold", color: C.dark, margin: 0 }}>Reviews</h3>
                        <select
                            value={sort}
                            disabled={loadingMore}
                            onChange={(e) => setSort(e.target.value as ReviewSort)}
                            aria-label="Sort reviews"
                            style={{ fontSize: "12px", padding: "6px 10px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.dark }}
                        >
                            {SORT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <Spinner label="Loading..." />
                    ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {reviews.map((review, idx) => {
                            const reviewId = getReviewKey(review, idx);
                            const displayName = getMenteeName(review);
                            const avatar = review.mentee?.profilePic || review.mentee?.profilePhotoId;
                            const profileHref = review.menteeUserId ? `/profile/${review.menteeUserId}` : null;

                            const isOwnReview = !!currentUserId && currentUserId === review.menteeUserId;
                            const isReviewedMentor = !!currentUserId && currentUserId === review.mentorUserId;
                            const myReaction = reactions[reviewId];
                            const reactDisabled = isOwnReview || !!busyReactions[reviewId];
                            const wasEdited =
                                !!review.updatedAt &&
                                !!review.createdAt &&
                                new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 60_000;
                            const isReplying = replyingId === reviewId;

                            const identity = (
                                <>
                                    {isImageUrl(avatar) ? (
                                        <img src={avatar} alt={displayName} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold" }}>
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span style={{ fontWeight: "bold", color: C.dark, fontSize: "14px" }}>{displayName}</span>
                                            {review.isVerified && <span style={{ fontSize: "10px", background: "#e0f2fe", color: "#0277bd", padding: "2px 8px", borderRadius: "10px" }}>✓ Verified</span>}
                                        </div>
                                        {review.mentee?.title && (
                                            <span style={{ fontSize: "11px", color: C.mid }}>{review.mentee.title}</span>
                                        )}
                                    </div>
                                </>
                            );

                            return (
                                <div key={reviewId} style={{ borderRadius: "16px", padding: "20px", background: C.bg, border: `1px solid ${C.border}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                        {profileHref ? (
                                            <Link
                                                href={profileHref}
                                                aria-label={`View ${displayName}'s profile`}
                                                style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", cursor: "pointer" }}
                                            >
                                                {identity}
                                            </Link>
                                        ) : (
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>{identity}</div>
                                        )}
                                        <span style={{ fontSize: "12px", color: C.mid, whiteSpace: "nowrap" }}>
                                            {formatRelativeDate(review.createdAt)}
                                            {wasEdited && " · edited"}
                                        </span>
                                    </div>

                                    <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                                        {[...Array(5)].map((_, i) => <Star key={i} filled={i < Math.floor(review.rating)} style={{ color: "#f59e0b", width: "13px", height: "13px" }} />)}
                                    </div>

                                    {review.session?.title && (
                                        <div style={{ fontSize: "11px", color: C.mid, marginBottom: "8px" }}>
                                            Session: <strong>{review.session.title}</strong>
                                            {review.session.sessionType ? ` · ${review.session.sessionType.replace(/_/g, " ")}` : ""}
                                        </div>
                                    )}

                                    <p style={{ fontSize: "13px", color: C.dark, lineHeight: "1.6", marginBottom: "8px", whiteSpace: "pre-wrap" }}>{review.comment}</p>

                                    {review.tags && review.tags.length > 0 && (
                                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                                            {review.tags.map((tag) => (
                                                <span key={tag} style={{ fontSize: "11px", color: C.mid, background: C.border, padding: "3px 10px", borderRadius: "10px", textTransform: "capitalize" }}>
                                                    {tag.replace(/_/g, " ")}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* like / dislike / reply actions */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                        <ReactionButton
                                            active={myReaction === "like"}
                                            disabled={reactDisabled}
                                            title={isOwnReview ? "You can't react to your own review" : "Helpful"}
                                            onClick={() => handleReact(review, "like")}
                                            count={review.helpfulCount ?? 0}
                                            icon={<ThumbsUp size={14} />}
                                        />
                                        <ReactionButton
                                            active={myReaction === "dislike"}
                                            disabled={reactDisabled}
                                            title={isOwnReview ? "You can't react to your own review" : "Not helpful"}
                                            onClick={() => handleReact(review, "dislike")}
                                            count={review.notHelpfulCount ?? 0}
                                            icon={<ThumbsDown size={14} />}
                                        />
                                        {isReviewedMentor && !isReplying && (
                                            <button type="button" onClick={() => openReply(review)} style={linkBtn}>
                                                {review.mentorResponse ? "Edit reply" : "Reply"}
                                            </button>
                                        )}
                                        {isReviewedMentor && review.mentorResponse && !isReplying && (
                                            <button type="button" onClick={() => removeReply(review)} style={{ ...linkBtn, color: "#b91c1c" }}>
                                                Delete reply
                                            </button>
                                        )}
                                    </div>

                                    {isReplying && (
                                        <div style={{ marginTop: "12px" }}>
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value.slice(0, MAX_REPLY_LENGTH))}
                                                rows={3}
                                                placeholder="Write a public reply to this review..."
                                                style={{ width: "100%", borderRadius: "12px", border: `1px solid ${C.border}`, padding: "10px 12px", fontSize: "13px", background: C.surface, color: C.dark, resize: "vertical" }}
                                            />
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                                                <span style={{ fontSize: "11px", color: C.mid }}>{replyText.length}/{MAX_REPLY_LENGTH}</span>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button type="button" onClick={() => { setReplyingId(null); setReplyText(""); }} style={linkBtn}>Cancel</button>
                                                    <button
                                                        type="button"
                                                        disabled={replySaving}
                                                        onClick={() => submitReply(review)}
                                                        style={{ fontSize: "12px", fontWeight: "bold", padding: "6px 16px", borderRadius: "10px", border: "none", background: C.dark, color: "#fff", cursor: replySaving ? "not-allowed" : "pointer", opacity: replySaving ? 0.6 : 1 }}
                                                    >
                                                        {replySaving ? "Posting..." : "Post reply"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {review.mentorResponse?.comment && !isReplying && (
                                        <div style={{ marginTop: "12px", padding: "12px 14px", borderRadius: "12px", background: C.surface, borderLeft: `3px solid ${C.mid}` }}>
                                            <div style={{ fontSize: "11px", color: C.mid, marginBottom: "4px" }}>
                                                <strong style={{ color: C.dark }}>Mentor's reply</strong>
                                                {review.mentorResponse.respondedAt ? ` · ${formatRelativeDate(review.mentorResponse.respondedAt)}` : ""}
                                            </div>
                                            <p style={{ fontSize: "13px", color: C.dark, lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" }}>
                                                {review.mentorResponse.comment}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    )}

                    {!loading && reviews.length < totalReviews && (
                        <div style={{ textAlign: "center", marginTop: "18px" }}>
                            <button
                                type="button"
                                onClick={loadMore}
                                disabled={loadingMore}
                                style={{ fontSize: "13px", fontWeight: "bold", padding: "8px 22px", borderRadius: "12px", border: `1px solid ${C.border}`, background: C.surface, color: C.dark, cursor: loadingMore ? "not-allowed" : "pointer", opacity: loadingMore ? 0.6 : 1 }}
                            >
                                {loadingMore ? "Loading..." : "Load more reviews"}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ReviewsSection;