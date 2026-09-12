"use client";
// src/features/mentorship/components/QueryModal.tsx
import React, { useState } from "react";
import { C } from "../types/data";
import QueryService from "@/lib/api/query.service";

interface QueryModalProps {
    mentorId: string;
    mentorName?: string;
    price: number; // Mentor.pricing.askQuery — 0 means free
    onClose: () => void;
    onSuccess?: () => void;
}

const QueryModal: React.FC<QueryModalProps> = ({ mentorId, mentorName, price, onClose, onSuccess }) => {
    const [question, setQuestion] = useState("");
    const [context, setContext] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFree = price === 0;
    const questionTooShort = question.trim().length > 0 && question.trim().length < 20;
    const canSubmit = question.trim().length >= 20 && question.trim().length <= 500 && !submitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        try {
            // NOTE: paid queries need a real payment step (Razorpay) before this call —
            // wire it the same way session booking does, then pass the resulting
            // transactionId here. Free queries skip straight to submit.
            await QueryService.submitQuery({
                mentorId,
                question: question.trim(),
                context: context.trim() || undefined,
                pricing: {
                    amount: price,
                    currency: "INR",
                },
            });
            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err?.message || "Query submit nahi ho payi. Try again.");
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
                    Ask a Query
                </h2>
                {mentorName && (
                    <p style={{ fontSize: "13px", color: C.mid, marginBottom: "20px" }}>
                        to {mentorName} - {isFree ? "Free" : `\u20B9${price}`}
                    </p>
                )}

                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.dark, marginBottom: "6px" }}>
                    Your question
                </label>
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Apna sawaal saaf tarike se likho (min 20 characters)"
                    maxLength={500}
                    rows={4}
                    style={{
                        width: "100%",
                        borderRadius: "12px",
                        border: `1px solid ${questionTooShort ? "#ef4444" : C.border}`,
                        padding: "12px",
                        fontSize: "13px",
                        color: C.dark,
                        resize: "vertical",
                        marginBottom: "6px",
                        fontFamily: "inherit",
                    }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontSize: "11px", color: questionTooShort ? "#ef4444" : C.mid }}>
                        {questionTooShort ? "Kam se kam 20 characters likho" : ""}
                    </span>
                    <span style={{ fontSize: "11px", color: C.mid }}>{question.length}/500</span>
                </div>

                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.dark, marginBottom: "6px" }}>
                    Context (optional)
                </label>
                <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Koi background detail jo mentor ko jaanni chahiye"
                    maxLength={1000}
                    rows={3}
                    style={{
                        width: "100%",
                        borderRadius: "12px",
                        border: `1px solid ${C.border}`,
                        padding: "12px",
                        fontSize: "13px",
                        color: C.dark,
                        resize: "vertical",
                        marginBottom: "20px",
                        fontFamily: "inherit",
                    }}
                />

                {!isFree && (
                    <div
                        style={{
                            borderRadius: "12px",
                            padding: "12px",
                            background: C.bg,
                            border: `1px solid ${C.border}`,
                            marginBottom: "20px",
                            fontSize: "12px",
                            color: C.mid,
                        }}
                    >
                        Payment step yahan aayega (Razorpay) - abhi seedha submit ho raha hai bina payment ke, isko session booking ke payment flow se connect karna baaki hai.
                    </div>
                )}

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
                        {submitting ? "Submitting..." : isFree ? "Submit query" : `Pay \u20B9${price} & submit`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QueryModal;