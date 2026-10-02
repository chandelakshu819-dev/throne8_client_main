// src/features/mentorship/components/senior/SeniorPaymentStep.tsx
// This payment step is ISOLATED from normal Mentor booking.
// It calls: SeniorSessionService.bookSession(sessionId, {...})
// It does NOT import or call: SessionService.bookSession()
"use client";

import React, { useState } from "react";
import { PAY_METHODS, C, btnPrimary } from "@/features/mentorship/types/data";
import type { CalendarData, FormData as BookingFormData } from "@/features/mentorship/types/types";
import SeniorSessionService from "@/lib/api/seniorSession.service";

interface SeniorPaymentStepProps {
    sessionId: string;
    basePrice: number;
    calendarData: CalendarData;
    formData: BookingFormData;
    mentorId: string;
    onBack: () => void;
    onBookingSuccess: () => void;
}

const BANKS: string[] = [
    "State Bank of India", "HDFC Bank", "ICICI Bank",
    "Axis Bank", "Punjab National Bank", "Bank of Baroda"
];
const WALLETS: string[] = ["Paytm", "Amazon Pay", "PhonePe", "Mobikwik"];

const SeniorPaymentStep: React.FC<SeniorPaymentStepProps> = ({
    sessionId, basePrice, calendarData, formData, mentorId,
    onBack, onBookingSuccess
}) => {
    const [paymentMethod, setPaymentMethod] = useState<string>("");
    const [booking, setBooking] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const paymentMethodMap: Record<string, string> = {
        upi: "razorpay",
        netbanking: "razorpay",
        card: "razorpay",
        wallet: "wallet",
    };

    const price: number = basePrice;
    const gst: number = Math.round(price * 0.18);
    const total: number = price + gst;

    const handleBookSession = async () => {
        if (!paymentMethod) return;
        setBooking(true);
        setErrorMsg(null);

        try {
            const { selectedDate, currentMonth, availabilityId, slotTime } = calendarData;
            const year = currentMonth.getFullYear();
            const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
            const day = String(selectedDate).padStart(2, "0");
            // slotTime from CalendarStep is "HH:MM - HH:MM", take the start
            const startTime = slotTime.split(" - ")[0];
            const scheduledAt = new Date(
                `${year}-${month}-${day}T${startTime}:00+05:30`
            ).toISOString();

            // ISOLATED SENIOR API — does NOT call SessionService.bookSession
            await SeniorSessionService.bookSession(sessionId, {
                slotTime,
                scheduledAt,
                paymentMethod: paymentMethodMap[paymentMethod] || "razorpay",
                pricing: {
                    basePrice: price,
                    totalAmount: total,
                    currency: "INR",
                },
            });

            onBookingSuccess();
        } catch (error: any) {
            console.error("Senior booking failed:", error);
            const backendError = error?.response?.data?.message || error.message || "Failed to book session (Unknown Error)";
            setErrorMsg(backendError);
            setBooking(false);
        }
    };

    if (booking) {
        return (
            <div style={{
                minHeight: "100vh", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                background: C.bg, gap: "20px"
            }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{
                    width: "48px", height: "48px",
                    border: `4px solid ${C.border}`,
                    borderTop: `4px solid ${C.dark}`,
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                }} />
                <p style={{ fontSize: "18px", fontWeight: "bold", color: C.dark }}>
                    Booking your Senior Session...
                </p>
                <p style={{ fontSize: "13px", color: C.mid }}>
                    Please wait, do not close this page
                </p>
            </div>
        );
    }

    const inp: React.CSSProperties = {
        width: "100%", padding: "12px 16px", borderRadius: "12px",
        border: `1px solid ${C.border}`, background: C.bg,
        color: C.dark, fontSize: "14px", boxSizing: "border-box", marginBottom: "10px"
    };
    const sel: React.CSSProperties = { ...inp, marginBottom: "16px" };

    return (
        <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px" }}>
            <button
                onClick={onBack}
                style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: C.mid, display: "flex", alignItems: "center",
                    gap: "8px", fontSize: "14px", fontWeight: 500, marginBottom: "24px"
                }}
            >
                ← Back to Details
            </button>

            <div style={{
                maxWidth: "700px", margin: "0 auto", borderRadius: "24px",
                padding: "40px", background: C.surface,
                border: `1px solid ${C.border}`,
                boxShadow: "0 20px 60px rgba(74,55,40,0.15)"
            }}>
                <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "4px" }}>
                    Payment Method
                </h2>
                <p style={{ color: C.mid, fontSize: "13px", marginBottom: "24px" }}>
                    Choose your preferred payment method
                </p>

                {errorMsg && (
                    <div style={{
                        background: "#fee2e2", color: "#b91c1c",
                        padding: "12px", borderRadius: "8px",
                        marginBottom: "24px", fontSize: "13px", fontWeight: "bold"
                    }}>
                        {errorMsg}
                    </div>
                )}

                {/* Payment Method Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                    {PAY_METHODS.map((m) => {
                        const active: boolean = paymentMethod === m.id;
                        return (
                            <div
                                key={m.id}
                                onClick={() => setPaymentMethod(m.id)}
                                style={{
                                    borderRadius: "16px", padding: "24px", cursor: "pointer",
                                    textAlign: "center", transition: "all 0.2s",
                                    background: active ? C.mid : C.bg,
                                    border: active ? "none" : `2px solid ${C.border}`,
                                    color: active ? "#fff" : C.dark,
                                    boxShadow: active ? "0 8px 30px rgba(122,92,62,0.3)" : "none"
                                }}
                            >
                                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{m.icon}</div>
                                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{m.label}</div>
                                <div style={{ fontSize: "12px", opacity: 0.8 }}>{m.sub}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Payment Summary */}
                <div style={{
                    borderRadius: "16px", padding: "20px",
                    background: C.bg, border: `1px solid ${C.border}`, marginBottom: "24px"
                }}>
                    <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "12px" }}>
                        Payment Summary
                    </h3>
                    {(
                        [
                            ["Service Fee", `₹${price}`],
                            ["Platform Fee", "₹0"],
                            ["GST (18%)", `₹${gst}`],
                            ["Total", `₹${total}`],
                        ] as [string, string][]
                    ).map(([k, v], i) => (
                        <div
                            key={k}
                            style={{
                                display: "flex", justifyContent: "space-between",
                                fontSize: i === 3 ? "15px" : "13px",
                                fontWeight: i === 3 ? "bold" : "normal",
                                color: C.dark, marginBottom: "5px",
                                borderTop: i === 3 ? `1px solid ${C.border}` : "none",
                                paddingTop: i === 3 ? "8px" : "0",
                                marginTop: i === 3 ? "6px" : "0"
                            }}
                        >
                            <span style={{ color: i === 3 ? C.dark : C.mid }}>{k}:</span>
                            <span>{v}</span>
                        </div>
                    ))}
                </div>

                {/* Payment Method Inputs */}
                {paymentMethod === "upi" && (
                    <input type="text" placeholder="Enter UPI ID (e.g. name@upi)" style={inp} />
                )}
                {paymentMethod === "netbanking" && (
                    <select style={sel}>
                        <option>Select Your Bank</option>
                        {BANKS.map(b => <option key={b}>{b}</option>)}
                    </select>
                )}
                {paymentMethod === "card" && (
                    <>
                        <input type="text" placeholder="Card Number" style={inp} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <input type="text" placeholder="MM/YY" style={{ ...inp, marginBottom: 0 }} />
                            <input type="text" placeholder="CVV" style={{ ...inp, marginBottom: 0 }} />
                        </div>
                    </>
                )}
                {paymentMethod === "wallet" && (
                    <select style={sel}>
                        <option>Select Wallet</option>
                        {WALLETS.map(w => <option key={w}>{w}</option>)}
                    </select>
                )}

                {paymentMethod && (
                    <button
                        onClick={handleBookSession}
                        style={{ ...btnPrimary, width: "100%", padding: "16px", borderRadius: "12px", fontSize: "17px", marginTop: "16px" }}
                    >
                        Pay ₹{total} 💳
                    </button>
                )}

                <div style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    marginTop: "20px", padding: "14px", borderRadius: "12px",
                    background: C.bg, border: `1px solid ${C.border}`
                }}>
                    <span style={{ fontSize: "20px" }}>🔒</span>
                    <p style={{ fontSize: "12px", color: C.mid, margin: 0 }}>
                        Your payment information is secure and encrypted. We never store your card details.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SeniorPaymentStep;
