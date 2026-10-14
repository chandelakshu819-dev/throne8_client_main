"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft } from "@/features/mentorship/components/mentor/Icons";
import { MONTHS, C, btnPrimary, formatSlotRange } from "@/features/mentorship/types/data";
import type { CalendarData, FormData } from "@/features/mentorship/types/types";
import { useProfileData } from "@/features/profile/hooks/useProfileData";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface SeniorBookingDetailsStepProps {
    serviceTitle: string;
    calendarData: CalendarData;
    isSubmitting: boolean;
    onBack: () => void;
    onContinue: (data: FormData) => void;
}

const FIELDS: {
    label: string;
    name: keyof FormData;
    type: string;
    placeholder: string;
}[] = [
    { label: "Full Name *", name: "name", type: "text", placeholder: "Your full name" },
    { label: "Email Address *", name: "email", type: "email", placeholder: "you@example.com" },
    { label: "Phone Number *", name: "phone", type: "tel", placeholder: "+91 XXXXX XXXXX" },
    { label: "Referral Code (Optional)", name: "referralCode", type: "text", placeholder: "Enter code if any" },
];

const SeniorBookingDetailsStep: React.FC<SeniorBookingDetailsStepProps> = ({
    serviceTitle,
    calendarData,
    isSubmitting,
    onBack,
    onContinue,
}) => {
    const { user } = useAuth();
    const { userProfileData, fetchUserProfile } = useProfileData();
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        phone: "",
        referralCode: "",
    });

    useEffect(() => {
        if (user?.userId) fetchUserProfile(user.userId);
    }, [user?.userId, fetchUserProfile]);

    useEffect(() => {
        setFormData((previous) => ({
            ...previous,
            name: previous.name || `${userProfileData?.firstName || ""} ${userProfileData?.lastName || ""}`.trim(),
            email: previous.email || userProfileData?.email || user?.email || "",
            phone: previous.phone || userProfileData?.phoneNumber || "",
        }));
    }, [userProfileData, user]);

    const canContinue = Boolean(formData.name.trim() && formData.email.trim() && formData.phone.trim());
    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "12px 16px",
        borderRadius: "12px",
        border: `1px solid ${C.border}`,
        background: C.bg,
        color: C.dark,
        fontSize: "14px",
        boxSizing: "border-box",
        outline: "none",
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
    };

    const { selectedDate, selectedTime, currentMonth } = calendarData;

    return (
        <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px" }}>
            <div style={{ maxWidth: "700px", margin: "0 auto", borderRadius: "24px", padding: "40px", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(74,55,40,0.15)" }}>
                <div style={{ marginBottom: "16px" }}>
                    <button
                        onClick={onBack}
                        disabled={isSubmitting}
                        style={{ background: "transparent", border: `1px solid ${C.border}`, cursor: isSubmitting ? "not-allowed" : "pointer", color: C.dark, display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, padding: "8px 16px", borderRadius: "8px" }}
                    >
                        <ArrowLeft /> Back
                    </button>
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "4px" }}>Your Details</h2>
                <p style={{ color: C.mid, fontSize: "13px", marginBottom: "24px" }}>Please fill in your information to complete the booking</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                    {FIELDS.map(({ label, name, type, placeholder }) => (
                        <div key={name}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.dark, marginBottom: "6px" }}>{label}</label>
                            <input
                                type={type}
                                name={name}
                                placeholder={placeholder}
                                value={formData[name]}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>
                    ))}
                </div>

                <div style={{ borderRadius: "16px", padding: "20px", background: C.bg, border: `1px solid ${C.border}`, marginBottom: "24px" }}>
                    <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "12px" }}>Session Summary</h3>
                    {([
                        ["Service", serviceTitle],
                        ["Date", `${selectedDate} ${MONTHS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`],
                        ["Time", selectedTime ? formatSlotRange(selectedTime.split(" - ")[0]) : ""],
                    ] as [string, string][]).map(([label, value]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: C.dark, marginBottom: "5px" }}>
                            <span style={{ color: C.mid }}>{label}:</span>
                            <span style={{ fontWeight: 500 }}>{value}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => onContinue(formData)}
                    disabled={!canContinue || isSubmitting}
                    style={{ ...btnPrimary, width: "100%", padding: "16px", borderRadius: "12px", fontSize: "17px", opacity: canContinue && !isSubmitting ? 1 : 0.5, cursor: canContinue && !isSubmitting ? "pointer" : "not-allowed" }}
                >
                    {isSubmitting ? "Booking..." : "Book Session"}
                </button>
            </div>
        </div>
    );
};

export default SeniorBookingDetailsStep;
