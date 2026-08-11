// components/mentor-profile/ReviewsSection.tsx

import React from "react";
import { Star } from "./Icons";
import { REVIEWS, MENTOR, C } from "../../types/data";

const ReviewsSection: React.FC = () => {
    return (
        <div style={{ borderRadius: "24px", padding: "32px", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 8px 32px rgba(74,55,40,0.08)" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "24px" }}>Ratings &amp; Reviews</h2>

            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "32px", alignItems: "center", marginBottom: "28px" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "48px", fontWeight: "bold", color: C.dark }}>{MENTOR.rating}</div>
                    <div style={{ display: "flex", gap: "2px", justifyContent: "center", marginBottom: "4px" }}>
                        {[...Array(5)].map((_, i) => <Star key={i} filled style={{ color: "#f59e0b" }} />)}
                    </div>
                    <div style={{ fontSize: "12px", color: C.mid }}>Based on {REVIEWS.length} reviews</div>
                </div>
                <div>
                    {[5, 4, 3, 2, 1].map((stars) => {
                        const pct: number = stars === 5 ? 80 : stars === 4 ? 15 : 5;
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
                {REVIEWS.map((review) => (
                    <div key={review.id} style={{ borderRadius: "16px", padding: "20px", background: C.bg, border: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold" }}>
                                    {review.name.charAt(0)}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontWeight: "bold", color: C.dark, fontSize: "14px" }}>{review.name}</span>
                                    {review.verified && <span style={{ fontSize: "10px", background: "#e0f2fe", color: "#0277bd", padding: "2px 8px", borderRadius: "10px" }}>✓ Verified</span>}
                                </div>
                            </div>
                            <span style={{ fontSize: "12px", color: C.mid }}>{review.date}</span>
                        </div>
                        <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                            {[...Array(5)].map((_, i) => <Star key={i} filled={i < Math.floor(review.rating)} style={{ color: "#f59e0b", width: "13px", height: "13px" }} />)}
                        </div>
                        <p style={{ fontSize: "13px", color: C.dark, lineHeight: "1.6", marginBottom: "8px" }}>{review.comment}</p>
                        <span style={{ fontSize: "11px", color: C.mid, background: C.border, padding: "3px 10px", borderRadius: "10px" }}>📌 {review.service}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewsSection;