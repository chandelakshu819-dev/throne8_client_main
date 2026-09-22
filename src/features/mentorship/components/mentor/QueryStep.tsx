// src/features/mentorship/components/mentor/QueryStep.tsx
"use client";

import React, { useState } from "react";
import { C, btnPrimary } from "../../types/data";
import type { Service } from "../../types/types";
import QueryService from "@/lib/api/query.service";

interface QueryStepProps {
    mentorId: string;
    selectedService: Service | null;
    onBack: () => void;
    onSubmitted: () => void;
}

const MIN_QUESTION_LENGTH = 20;
const MAX_QUESTION_LENGTH = 500;

const QueryStep: React.FC<QueryStepProps> = ({ mentorId, selectedService, onBack, onSubmitted }) => {
    const [question, setQuestion] = useState("");
    const [context, setContext] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit = question.trim().length >= MIN_QUESTION_LENGTH && !isSubmitting;

    const handleSubmit = async () => {
        if (!canSubmit || !mentorId) return;
        setIsSubmitting(true);
        setError(null);
        try {
            // ✅ Yehi call hai jo mentee ki query mentor ke paas bhejti hai —
            // backend (queryService.submitQuery) mentor ko in-app notification
            // bhi bhejta hai, alag se kuch karne ki zaroorat nahi.
            await QueryService.submitQuery({
                mentorId,
                question: question.trim(),
                context: context.trim() || undefined,
            });
            onSubmitted();
        } catch (err: any) {
            setError(err.message || "Failed to send your query. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px" }}>
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.mid, display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 500, marginBottom: "24px" }}>
                ← Back to Profile
            </button>

            <div style={{ maxWidth: "700px", margin: "0 auto", borderRadius: "24px", padding: "40px", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(74,55,40,0.15)" }}>
                <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "4px" }}>Ask a Query</h2>
                <p style={{ color: C.mid, fontSize: "13px", marginBottom: "24px" }}>
                    {selectedService?.title || "Send your question"} — the mentor will reply directly, no call scheduling needed.
                </p>

                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.dark, marginBottom: "8px" }}>
                        Your Question *
                    </label>
                    <textarea
                        rows={6}
                        maxLength={MAX_QUESTION_LENGTH}
                        placeholder="Describe what you'd like to ask in detail (min 20 characters)..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        style={{
                            width: "100%", padding: "12px 16px", borderRadius: "12px",
                            border: `1px solid ${C.border}`, background: C.bg,
                            color: C.dark, fontSize: "14px", boxSizing: "border-box",
                            outline: "none", resize: "vertical",
                        }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                        <span style={{ fontSize: "11px", color: question.trim().length < MIN_QUESTION_LENGTH ? "#dc2626" : C.mid }}>
                            {question.trim().length < MIN_QUESTION_LENGTH ? `At least ${MIN_QUESTION_LENGTH} characters` : "Looks good"}
                        </span>
                        <span style={{ fontSize: "11px", color: C.mid }}>{question.length}/{MAX_QUESTION_LENGTH}</span>
                    </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.dark, marginBottom: "8px" }}>
                        Additional Context (optional)
                    </label>
                    <textarea
                        rows={3}
                        maxLength={1000}
                        placeholder="Any extra background that will help the mentor answer..."
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        style={{
                            width: "100%", padding: "12px 16px", borderRadius: "12px",
                            border: `1px solid ${C.border}`, background: C.bg,
                            color: C.dark, fontSize: "14px", boxSizing: "border-box",
                            outline: "none", resize: "vertical",
                        }}
                    />
                </div>

                {error && (
                    <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "10px", background: "#fee2e2", color: "#dc2626", fontSize: "13px", fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    style={{
                        ...btnPrimary, width: "100%", padding: "16px", borderRadius: "12px", fontSize: "15px",
                        opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? "pointer" : "not-allowed",
                    }}
                >
                    {isSubmitting ? "Sending..." : "Send Query to Mentor →"}
                </button>
            </div>
        </div>
    );
};

export default QueryStep;