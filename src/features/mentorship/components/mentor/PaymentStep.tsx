"use client";

import React, { useEffect, useRef, useState } from "react";

import { ArrowLeft } from "./Icons";
import { C, btnPrimary } from "../../types/data";
import type { CalendarData, Service, FormData as BookingFormData } from "../../types/types";
import SessionService from "@/lib/api/session.service";
import MentorService from "@/lib/api/mentorship.service";
import PaymentService, { PaymentCancelledError } from "@/lib/api/payment.service";

interface PaymentStepProps {
    selectedService: Service | null;
    calendarData: CalendarData;
    formData: BookingFormData;
    mentorId: string;
    onBack: () => void;
    onConfirm: () => void;
    onBookingSuccess: () => void;
    onPickAnotherSlot?: () => void;
}

type Stage = "idle" | "preparing" | "paying" | "confirming";

const PaymentStep: React.FC<PaymentStepProps> = ({
    selectedService,
    calendarData,
    mentorId,
    onBack,
    onBookingSuccess,
    onPickAnotherSlot,
}) => {
    const [stage, setStage] = useState<Stage>("idle");
    const [bookingError, setBookingError] = useState<string | null>(null);
    // Payment ho chuki hai lekin confirmation fail hui: dobara pay nahi karne dena
    const [paidReference, setPaidReference] = useState<string | null>(null);

    // StrictMode / double click par duplicate request na jaye
    const lockRef = useRef(false);

    const isFree: boolean =
        selectedService?.price === "Free" || Number(selectedService?.price) === 0;
    const price: number = isFree ? 0 : Number(selectedService?.price);
    const gst: number = Math.round(price * 0.18);
    const total: number = price + gst;

    const isGroupSession = selectedService?.type === "GroupSession";

    const buildSlotInfo = () => {
        const { selectedDate, currentMonth, availabilityId, slotTime } = calendarData;
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate).padStart(2, "0");
        const startTime = slotTime.split(" - ")[0];
        const scheduledAt = new Date(`${year}-${month}-${day}T${startTime}:00+05:30`).toISOString();
        return { year, month, day, startTime, availabilityId, slotTime, scheduledAt };
    };

    // Free 1:1 session aur group join request: payment gateway ke bina
    const handleFreeOrGroupBooking = async () => {
        if (lockRef.current) return;
        lockRef.current = true;
        setBookingError(null);
        setStage("confirming");

        try {
            const slot = buildSlotInfo();

            if (isGroupSession) {
                await MentorService.joinGroupSessionBySlot(String(selectedService?.id || ""), {
                    date: `${slot.year}-${slot.month}-${slot.day}`,
                    startTime: slot.startTime,
                    availabilityId: slot.availabilityId,
                    transactionId: `PAY_${Date.now()}`,
                });
            } else {
                await SessionService.bookSession({
                    sessionId: String(selectedService?.id || ""),
                    mentorId,
                    availabilityId: slot.availabilityId,
                    slotTime: slot.slotTime,
                    scheduledAt: slot.scheduledAt,
                    timezone: "Asia/Kolkata",
                    paymentMethod: "wallet",
                    pricing: {
                        basePrice: price,
                        platformFee: Math.round(price * 0.15),
                        totalAmount: total,
                        currency: "INR",
                    },
                });
            }

            onBookingSuccess();
        } catch (error: any) {
            setBookingError(
                error?.response?.data?.message || error?.message || "Booking failed. Please try again."
            );
            lockRef.current = false;
            setStage("idle");
        }
    };

    // Paid 1:1 session: order -> Razorpay Checkout -> server verify + booking
    const handlePayment = async () => {
        if (lockRef.current) return;
        lockRef.current = true;
        setBookingError(null);

        let razorpayPaymentId: string | null = null;

        try {
            setStage("preparing");
            const slot = buildSlotInfo();

            const order = await PaymentService.createSessionOrder({
                sessionId: String(selectedService?.id || ""),
                mentorId,
                availabilityId: slot.availabilityId,
                slotTime: slot.slotTime,
                scheduledAt: slot.scheduledAt,
                timezone: "Asia/Kolkata",
            });

            // Server ka price screen ke price se alag ho to charge karne se pehle ruk jao
            if (order.pricing.totalAmount !== total) {
                throw new Error("The session price has changed. Please go back and select the session again.");
            }

            setStage("paying");
            const checkout = await PaymentService.openCheckout(order, {
                description: selectedService?.title,
                themeColor: C.dark,
            });
            razorpayPaymentId = checkout.razorpay_payment_id;

            setStage("confirming");
            await PaymentService.verifyPayment({
                paymentId: order.paymentId,
                razorpayOrderId: checkout.razorpay_order_id,
                razorpayPaymentId: checkout.razorpay_payment_id,
                razorpaySignature: checkout.razorpay_signature,
            });

            onBookingSuccess();
        } catch (error: any) {
            if (error instanceof PaymentCancelledError) {
                setBookingError(null);
                lockRef.current = false;
                setStage("idle");
                return;
            }

            const message = error?.message || "Payment failed. Please try again.";

            if (razorpayPaymentId) {
                // Paisa kat chuka hai: lock rakho taaki dobara payment na ho
                setPaidReference(razorpayPaymentId);
                setBookingError(message);
                setStage("idle");
                return;
            }

            setBookingError(message);
            lockRef.current = false;
            setStage("idle");
        }
    };

    // Free session: slot select + details ho chuki hain, seedha book kar do
    useEffect(() => {
        if (isFree) {
            handleFreeOrGroupBooking();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const spinnerScreen = (title: string, subtitle: string) => (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: "20px" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ width: "48px", height: "48px", border: `4px solid ${C.border}`, borderTop: `4px solid ${C.dark}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontSize: "18px", fontWeight: "bold", color: C.dark }}>{title}</p>
            <p style={{ fontSize: "13px", color: C.mid }}>{subtitle}</p>
        </div>
    );

    // Free session booking fail hui: error + retry/back (infinite loader nahi)
    if (isFree && bookingError && stage === "idle") {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: "16px", padding: "24px", textAlign: "center" }}>
                <p style={{ fontSize: "18px", fontWeight: "bold", color: C.dark }}>Could not book your session</p>
                <div style={{ padding: "12px 16px", borderRadius: "12px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: "13px", fontWeight: 600, maxWidth: "420px" }}>
                    {bookingError}
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${C.border}`, cursor: "pointer", color: C.dark, fontSize: "14px", fontWeight: 600, padding: "10px 20px", borderRadius: "10px" }}>
                        Back
                    </button>
                    <button onClick={() => handleFreeOrGroupBooking()} style={{ ...btnPrimary, padding: "10px 20px", borderRadius: "10px", fontSize: "14px" }}>
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    if (stage === "confirming" || (isFree && !bookingError)) {
        return spinnerScreen(
            paidReference || stage === "confirming" ? "Confirming your booking..." : "Booking your session...",
            "Please wait, do not close this page"
        );
    }

    const busy = stage === "preparing" || stage === "paying";

    const payLabel = (): string => {
        if (stage === "preparing") return "Preparing payment...";
        if (stage === "paying") return "Complete the payment in the Razorpay window";
        if (isGroupSession) return "Send Join Request";
        return `Pay \u20B9${total}`;
    };

    return (
        <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px" }}>
            <div style={{ maxWidth: "700px", margin: "0 auto", borderRadius: "24px", padding: "40px", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(74,55,40,0.15)" }}>
                <div style={{ marginBottom: "16px" }}>
                    <button
                        onClick={onBack}
                        disabled={busy}
                        style={{
                            background: "transparent",
                            border: `1px solid ${C.border}`,
                            cursor: busy ? "not-allowed" : "pointer",
                            color: C.dark,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            padding: "8px 16px",
                            borderRadius: "8px",
                        }}
                    >
                        <ArrowLeft /> Back
                    </button>
                </div>

                <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "4px" }}>Payment</h2>
                <p style={{ color: C.mid, fontSize: "13px", marginBottom: "24px" }}>
                    Review your order. You can pay using UPI, cards, net banking or wallets in the next step.
                </p>

                {/* Summary */}
                <div style={{ borderRadius: "16px", padding: "20px", background: C.bg, border: `1px solid ${C.border}`, marginBottom: "24px" }}>
                    <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "12px" }}>Payment Summary</h3>
                    {([["Service Fee", `\u20B9${price}`], ["Platform Fee", "\u20B90"], ["GST (18%)", `\u20B9${gst}`], ["Total", `\u20B9${total}`]] as [string, string][]).map(([k, v], i) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: i === 3 ? "15px" : "13px", fontWeight: i === 3 ? "bold" : "normal", color: C.dark, marginBottom: "5px", borderTop: i === 3 ? `1px solid ${C.border}` : "none", paddingTop: i === 3 ? "8px" : "0", marginTop: i === 3 ? "6px" : "0" }}>
                            <span style={{ color: i === 3 ? C.dark : C.mid }}>{k}:</span><span>{v}</span>
                        </div>
                    ))}
                </div>

                {bookingError && (
                    <div style={{ padding: "12px 16px", borderRadius: "12px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: "13px", fontWeight: 600, marginTop: "16px" }}>
                        {bookingError}
                    </div>
                )}

                {paidReference && (
                    <div style={{ padding: "12px 16px", borderRadius: "12px", background: C.bg, border: `1px solid ${C.border}`, color: C.dark, fontSize: "13px", marginTop: "12px" }}>
                        Your payment was received (reference: {paidReference}). Please do not pay again. Check My Bookings or contact support if you need help.
                    </div>
                )}

                {bookingError && /already|no longer available/i.test(bookingError) && onPickAnotherSlot && (
                    <button
                        onClick={onPickAnotherSlot}
                        style={{ width: "100%", marginTop: "12px", padding: "12px", borderRadius: "12px", border: `1px solid ${C.border}`, background: "transparent", color: C.dark, fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                    >
                        Choose another slot
                    </button>
                )}

                {!paidReference && (
                    <button
                        onClick={isGroupSession ? handleFreeOrGroupBooking : handlePayment}
                        disabled={busy}
                        style={{
                            ...btnPrimary,
                            width: "100%",
                            padding: "16px",
                            borderRadius: "12px",
                            fontSize: "17px",
                            marginTop: "16px",
                            opacity: busy ? 0.7 : 1,
                            cursor: busy ? "not-allowed" : "pointer",
                        }}
                    >
                        {payLabel()}
                    </button>
                )}

                <div style={{ marginTop: "20px", padding: "14px", borderRadius: "12px", background: C.bg, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: "12px", color: C.mid, margin: 0 }}>
                        Payments are processed securely by Razorpay. We never store your card details.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentStep;