"use client";
// src/features/mentorship/components/WriteReviewModal.tsx
// Mentee-facing review submission modal — completed session ke baad open hota hai
import React, { useState } from "react";
import { Star } from "./Icons";
import { C } from "../types/data";
import MentorService from "@/lib/api/mentorship.service";

interface WriteReviewModalProps {
    sessionId: string;
    mentorId: string;
    mentorName?: string;
    onClose: () => void;
    onSuccess?: () => void;
}

const AVAILABLE_TAGS = [
    "helpful",
    "knowledgeable",
    "patient",
    "prepared",
    "punctual",
    "friendly",
    "professional",
    "insightful",
    "responsive",
    "exceeded_expectations",
] as const;

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
    sessionId,
    mentorId,
    mentorName,
    onClose,
    onSuccess,
}) => {
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const commentTooShort = comment.trim().length > 0 && comment.trim().length < 10;
    const canSubmit = rating > 0 && comment.trim().length >= 10 && comment.trim().length <= 1000 && !submitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        try {
            await MentorService.submitReview({
                sessionId,
                mentorId,
                rating,
                comment: comment.trim(),
                tags: selectedTags,
            });
            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err?.message || "Review submit nahi ho paayi. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "16px",
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: C.surface,
                    borderRadius: "20px",
                    padding: "28px",
                    width: "100%",
                    maxWidth: "480px",
                    border: `1px solid ${C.border}`,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                }}
            >
                <h2 style={{ fontSize: "18px", fontWeight: "bold", color: C.dark, marginBottom: "4px" }}>
                    Rate your session
                </h2>
                {mentorName && (
                    <p style={{ fontSize: "13px", color: C.mid, marginBottom: "20px" }}>
                        with {mentorName}
                    </p>
                )}

                {/* Star rating input */}
                <div style={{ display: "flex", gap: "6px", marginBottom: "20px", justifyContent: "center" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                        >
                            <Star
                                filled={star <= (hoverRating || rating)}
                                style={{ color: "#f59e0b", width: "32px", height: "32px" }}
                            />
                        </button>
                    ))}
                </div>

                {/* Comment */}
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Session ke baare mein batao — kya achha laga, kya improve ho sakta hai... (min 10 characters)"
                    maxLength={1000}
                    rows={4}
                    style={{
                        width: "100%",
                        borderRadius: "12px",
                        border: `1px solid ${commentTooShort ? "#ef4444" : C.border}`,
                        padding: "12px",
                        fontSize: "13px",
                        color: C.dark,
                        resize: "vertical",
                        marginBottom: "6px",
                        fontFamily: "inherit",
                    }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontSize: "11px", color: commentTooShort ? "#ef4444" : C.mid }}>
                        {commentTooShort ? "Kam se kam 10 characters likho" : ""}
                    </span>
                    <span style={{ fontSize: "11px", color: C.mid }}>{comment.length}/1000</span>
                </div>

                {/* Tags */}
                <p style={{ fontSize: "12px", fontWeight: 600, color: C.dark, marginBottom: "8px" }}>
                    Tags (optional)
                </p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "24px" }}>
                    {AVAILABLE_TAGS.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                style={{
                                    fontSize: "11px",
                                    padding: "5px 12px",
                                    borderRadius: "12px",
                                    border: `1px solid ${active ? C.dark : C.border}`,
                                    background: active ? C.dark : "transparent",
                                    color: active ? "#fff" : C.mid,
                                    cursor: "pointer",
                                    textTransform: "capitalize",
                                }}
                            >
                                {tag.replace(/_/g, " ")}
                            </button>
                        );
                    })}
                </div>

                {error && (
                    <p style={{ fontSize: "12px", color: "#ef4444", marginBottom: "12px" }}>{error}</p>
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        style={{
                            flex: 1,
                            padding: "12px",
                            borderRadius: "12px",
                            border: `1px solid ${C.border}`,
                            background: "transparent",
                            color: C.dark,
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        style={{
                            flex: 2,
                            padding: "12px",
                            borderRadius: "12px",
                            border: "none",
                            background: canSubmit ? C.dark : C.border,
                            color: "#fff",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: canSubmit ? "pointer" : "not-allowed",
                        }}
                    >
                        {submitting ? "Submitting..." : "Submit review"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WriteReviewModal;