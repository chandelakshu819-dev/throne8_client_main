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

    // 16px font: iPhone par input focus par auto-zoom nahi hota
    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "12px 16px",
        borderRadius: "12px",
        border: `1px solid ${C.border}`,
        background: C.bg,
        color: C.dark,
        fontSize: "16px",
        boxSizing: "border-box",
        outline: "none",
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
    };

    const { selectedDate, selectedTime, currentMonth } = calendarData;

    return (
        <div className="min-h-screen w-full px-3 py-4 sm:px-4 sm:py-8" style={{ background: C.bg }}>
            <div
                className="mx-auto w-full max-w-[700px] rounded-2xl p-4 sm:rounded-3xl sm:p-8 lg:p-10"
                style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(74,55,40,0.15)" }}
            >
                <div className="mb-4">
                    <button
                        onClick={onBack}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
                        style={{ background: "transparent", border: `1px solid ${C.border}`, cursor: isSubmitting ? "not-allowed" : "pointer", color: C.dark }}
                    >
                        <ArrowLeft /> Back
                    </button>
                </div>
                <h2 className="mb-1 text-xl font-bold sm:text-[22px]" style={{ color: C.dark }}>Your Details</h2>
                <p className="mb-5 text-[13px] sm:mb-6" style={{ color: C.mid }}>Please fill in your information to complete the booking</p>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {FIELDS.map(({ label, name, type, placeholder }) => (
                        <div key={name} className="min-w-0">
                            <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: C.dark }}>{label}</label>
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

                <div className="mb-6 rounded-2xl p-4 sm:p-5" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                    <h3 className="mb-3 font-bold" style={{ color: C.dark }}>Session Summary</h3>
                    {([
                        ["Service", serviceTitle],
                        ["Date", `${selectedDate} ${MONTHS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`],
                        ["Time", selectedTime ? formatSlotRange(selectedTime.split(" - ")[0]) : ""],
                    ] as [string, string][]).map(([label, value]) => (
                        <div key={label} className="mb-1.5 flex justify-between gap-4 text-[13px]" style={{ color: C.dark }}>
                            <span className="shrink-0" style={{ color: C.mid }}>{label}:</span>
                            <span className="min-w-0 break-words text-right font-medium">{value}</span>
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