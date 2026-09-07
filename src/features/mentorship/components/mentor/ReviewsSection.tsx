"use client";
// src/features/mentorship/components/mentor/ReviewsSection.tsx
import React, { useEffect, useState } from "react";
import { Star } from "./Icons";
import { C } from "../../types/data";
import MentorService from "@/lib/api/mentorship.service";

interface ReviewsSectionProps {
    mentorId: string;
}

interface ReviewItem {
    reviewId: string;
    rating: number;
    comment: string;
    tags?: string[];
    isVerified?: boolean;
    createdAt: string;
    mentee?: {
        firstName?: string;
        lastName?: string;
        profilePhotoId?: string | null;
    };
}

interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

const formatRelativeDate = (dateStr: string): string => {
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

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ mentorId }) => {
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState<boolean>(!!mentorId);

    useEffect(() => {
        if (!mentorId) {
            setReviews([]);
            setStats(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        Promise.all([
            MentorService.getMentorReviews(mentorId, { limit: 10 }),
            MentorService.getMentorReviewStats(mentorId),
        ])
            .then(([reviewsRes, statsRes]) => {
                setReviews(reviewsRes?.data ?? []);
                setStats(statsRes?.data ?? null);
            })
            .catch(() => {
                setReviews([]);
                setStats(null);
            })
            .finally(() => setLoading(false));
    }, [mentorId]);

    const totalReviews = stats?.totalReviews ?? 0;
    const averageRating = stats?.averageRating ?? 0;
    const distribution = stats?.distribution ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    return (
        <div style={{ borderRadius: "24px", padding: "32px", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 8px 32px rgba(74,55,40,0.08)" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "24px" }}>Ratings &amp; Reviews</h2>

            {loading && (
                <>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.dark}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        <span style={{ fontSize: "13px", color: C.mid }}>Fetching reviews...</span>
                    </div>
                </>
            )}

            {!loading && totalReviews === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: C.mid, fontSize: "13px" }}>
                    No reviews yet.
                </div>
            )}

            {!loading && totalReviews > 0 && (
                <>
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

                    <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "16px" }}>Recent Reviews</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {reviews.map((review) => {
                            const menteeName = review.mentee
                                ? `${review.mentee.firstName ?? ""} ${review.mentee.lastName ?? ""}`.trim()
                                : "";
                            const displayName = menteeName || "Anonymous";
                            return (
                                <div key={review.reviewId} style={{ borderRadius: "16px", padding: "20px", background: C.bg, border: `1px solid ${C.border}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            {review.mentee?.profilePhotoId ? (
                                                <img src={review.mentee.profilePhotoId} alt={displayName} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                                            ) : (
                                                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold" }}>
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ fontWeight: "bold", color: C.dark, fontSize: "14px" }}>{displayName}</span>
                                                {review.isVerified && <span style={{ fontSize: "10px", background: "#e0f2fe", color: "#0277bd", padding: "2px 8px", borderRadius: "10px" }}>✓ Verified</span>}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: "12px", color: C.mid }}>{formatRelativeDate(review.createdAt)}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                                        {[...Array(5)].map((_, i) => <Star key={i} filled={i < Math.floor(review.rating)} style={{ color: "#f59e0b", width: "13px", height: "13px" }} />)}
                                    </div>
                                    <p style={{ fontSize: "13px", color: C.dark, lineHeight: "1.6", marginBottom: "8px" }}>{review.comment}</p>
                                    {review.tags && review.tags.length > 0 && (
                                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                            {review.tags.map((tag) => (
                                                <span key={tag} style={{ fontSize: "11px", color: C.mid, background: C.border, padding: "3px 10px", borderRadius: "10px", textTransform: "capitalize" }}>
                                                    {tag.replace(/_/g, " ")}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default ReviewsSection;