// components/mentor-profile/booking/DetailsStep.tsx
"use client";

import React, { useEffect, useState } from "react";
import { MONTHS, C, btnPrimary } from "../../types/data";
import type { Service, CalendarData, FormData } from "../../types/types";
import { useProfileData } from "@/features/profile/hooks/useProfileData";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface Field {
    label: string;
    name: keyof FormData;
    type: string;
    ph: string;
}

const FIELDS: Field[] = [
    { label: "Full Name *", name: "name", type: "text", ph: "Your full name" },
    { label: "Email Address *", name: "email", type: "email", ph: "you@example.com" },
    { label: "Phone Number *", name: "phone", type: "tel", ph: "+91 XXXXX XXXXX" },
    { label: "Referral Code (Optional)", name: "referralCode", type: "text", ph: "Enter code if any" },
];

interface DetailsStepProps {
    selectedService: Service | null;
    calendarData: CalendarData;
    onBack: () => void;
    onContinue: (data: FormData) => void;
}

const DetailsStep: React.FC<DetailsStepProps> = ({ selectedService, calendarData, onBack, onContinue }) => {
    const { user } = useAuth();
    const { userProfileData, fetchUserProfile } = useProfileData();


    useEffect(() => {
        if (user) {
            fetchUserProfile();
        }
    }, [user, fetchUserProfile]);

    const fullName = userProfileData
        ? `${userProfileData.firstName} ${userProfileData.lastName}`.trim()
        : '';
    const email = userProfileData?.email || '';
    const phone = userProfileData?.phoneNumber
        || '';

    console.log("👤 User Profile Data in Detail page-:",
        fullName, email, phone
    );

    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        phone: "",
        referralCode: ""
    });

    const { selectedDate, selectedTime, currentMonth } = calendarData;
    const month: number = currentMonth.getMonth();
    const year: number = currentMonth.getFullYear();
    const canProceed: boolean = !!(formData.name && formData.email && formData.phone);

    const inp: React.CSSProperties = {
        width: "100%", padding: "12px 16px", borderRadius: "12px",
        border: `1px solid ${C.border}`, background: C.bg,
        color: C.dark, fontSize: "14px", boxSizing: "border-box", outline: "none",
    };

    useEffect(() => {
        if (userProfileData) {
            setFormData((prev) => ({
                ...prev,
                name: `${userProfileData.firstName || ""} ${userProfileData.lastName || ""}`.trim(),
                email: userProfileData.email || "",
                phone: userProfileData.phoneNumber || "",
            }));
        }
    }, [userProfileData]);

    return (
        <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px" }}>
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.mid, display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 500, marginBottom: "24px" }}>
                ← Back to Calendar
            </button>

            <div style={{ maxWidth: "700px", margin: "0 auto", borderRadius: "24px", padding: "40px", background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(74,55,40,0.15)" }}>
                <h2 style={{ fontSize: "22px", fontWeight: "bold", color: C.dark, marginBottom: "4px" }}>Your Details</h2>
                <p style={{ color: C.mid, fontSize: "13px", marginBottom: "24px" }}>Please fill in your information to complete the booking</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                    {FIELDS.map(({ label, name, type, ph }) => (
                        <div key={name}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.dark, marginBottom: "6px" }}>{label}</label>
                            <input
                                type={type} 
                                name={name}
                                placeholder={ph}
                                value={formData[name]}
                                disabled={["name", "email", "phone"].includes(name)}
                                style={{
                                    ...inp,
                                    background: ["name", "email", "phone"].includes(name)
                                        ? "#f3f3f3"
                                        : C.bg,
                                    cursor: ["name", "email", "phone"].includes(name)
                                        ? "not-allowed"
                                        : "text",
                                    opacity: ["name", "email", "phone"].includes(name)
                                        ? 0.8
                                        : 1,
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div style={{ borderRadius: "16px", padding: "20px", background: C.bg, border: `1px solid ${C.border}`, marginBottom: "24px" }}>
                    <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "12px" }}>Order Summary</h3>
                    {([
                        ["Service", selectedService?.title ?? ""],
                        ["Date", `${selectedDate} ${MONTHS[month]} ${year}`],
                        ["Time", selectedTime],
                        ["Total", `₹${selectedService?.price}`],
                    ] as [string, string][]).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: C.dark, marginBottom: "5px" }}>
                            <span style={{ color: C.mid }}>{k}:</span><span style={{ fontWeight: 500 }}>{v}</span>
                        </div>
                    ))}
                </div>

                <button onClick={() => onContinue(formData)} disabled={!canProceed} style={{ ...btnPrimary, width: "100%", padding: "16px", borderRadius: "12px", fontSize: "17px", opacity: canProceed ? 1 : 0.5, cursor: canProceed ? "pointer" : "not-allowed" }}>
                    Proceed to Payment →
                </button>
            </div>
        </div>
    );
};

export default DetailsStep;