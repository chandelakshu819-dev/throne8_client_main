"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
//src/features/mentorship/components/mentor/MentorSidebar.tsx
import React, { useEffect, useRef, useState } from "react";
import { Camera, Star, Briefcase, ArrowLeft } from "./Icons";
import { C } from "../../types/data";
import MentorService from "@/lib/api/mentorship.service";

interface MentorSidebarProps {
    mentorData: any;
    currentUserId?: string;
    onBack?: () => void;
    onEditClick?: () => void;
}

const MentorSidebar: React.FC<MentorSidebarProps> = ({ mentorData, currentUserId, onBack, onEditClick }) => {
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);

    const [saved, setSaved] = useState<boolean>(false);
    const [savingToggle, setSavingToggle] = useState<boolean>(false);

    const [reportOpen, setReportOpen] = useState<boolean>(false);
    const [reportReason, setReportReason] = useState<string>("");
    const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);
    const [reportError, setReportError] = useState<string | null>(null);
    const [reportSuccess, setReportSuccess] = useState<boolean>(false);

    useEffect(() => {
        if (mentorData?.savedBy && currentUserId) {
            setSaved(mentorData.savedBy.includes(currentUserId));
        } else {
            setSaved(false);
        }
    }, [mentorData?.savedBy, currentUserId]);

    // Camera (change-photo) button sirf tab dikhega jab logged-in user hi is mentor ka owner ho
    const isOwner = !!currentUserId && !!mentorData?.userId && currentUserId === mentorData.userId;

    const backButton = onBack && (
        <button
            onClick={onBack}
            aria-label="Go back"
            style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                padding: "8px",
                borderRadius: "8px",
                background: "rgba(251,247,243,0.9)",
                border: `1px solid ${C.border}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
            }}
        >
            <ArrowLeft />
        </button>
    );

    if (!mentorData) {
        return (
            <div style={{ position: "sticky", top: "100px" }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ position: "relative", borderRadius: "24px", padding: "60px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", background: C.bg, border: `1px solid ${C.border}` }}>
                    {backButton}
                    <div style={{ width: "36px", height: "36px", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.dark}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <span style={{ fontSize: "13px", color: C.mid }}>Loading mentor profile...</span>
                </div>
            </div>
        );
    }

    const name = mentorData.user ? `${mentorData.user.firstName ?? ""} ${mentorData.user.lastName ?? ""}`.trim() : "Unnamed Mentor";
    const rating = (mentorData?.stats?.averageRating ?? 0).toFixed(1);
    const about = mentorData?.bio || "No bio added yet.";
    const image = mentorData?.profilePic || "";
    const verified = mentorData?.verification?.isVerified ?? false;
    const totalSessions = mentorData?.stats?.totalSessions ?? 0;
    const completionRate = mentorData?.stats?.completionRate != null ? `${mentorData.stats.completionRate}%` : "N/A";

    const responseTime =
        mentorData?.stats?.responseTime == null
            ? "N/A"
            : mentorData.stats.responseTime === 0
                ? "Under 1 hr"
                : `< ${mentorData.stats.responseTime} hr${mentorData.stats.responseTime > 1 ? "s" : ""}`;

    const successRate = mentorData?.stats?.successRate != null ? `${mentorData.stats.successRate}%` : "N/A";

    const currentRole = mentorData?.experience?.currentRole || "Not specified";
    const experience = mentorData?.experience?.total != null ? `${mentorData.experience.total} years of Experience` : "Experience not specified";
    const previousRoles = mentorData?.experience?.previousRoles || [];
    const linkedinUrl = mentorData?.socialProof?.linkedinUrl || "#";
    const skills = mentorData?.skills || [];
    const languages: string[] = mentorData?.languages || [];
    const timezone: string = mentorData?.availability?.timezone || "";

    const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setBackgroundImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleToggleSave = async () => {
        if (!mentorData?.mentorId || savingToggle) return;
        setSavingToggle(true);
        const previous = saved;
        setSaved(!previous);
        try {
            const res = await MentorService.toggleSaveMentor(mentorData.mentorId);
            setSaved(res.saved);
        } catch {
            setSaved(previous);
        } finally {
            setSavingToggle(false);
        }
    };

    const handleSubmitReport = async () => {
        if (!mentorData?.mentorId) return;
        if (reportReason.trim().length < 10) {
            setReportError("Please provide at least 10 characters explaining the issue.");
            return;
        }
        setReportSubmitting(true);
        setReportError(null);
        try {
            await MentorService.reportMentor(mentorData.mentorId, reportReason.trim());
            setReportSuccess(true);
            setTimeout(() => {
                setReportOpen(false);
                setReportReason("");
                setReportSuccess(false);
            }, 1500);
        } catch (err: unknown) {
            setReportError(err instanceof Error && err.message ? err.message : "Failed to submit report. Please try again.");
        } finally {
            setReportSubmitting(false);
        }
    };

    return (
        <div style={{ position: "sticky", top: "100px" }}>
            <div style={{ borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 60px rgba(74,55,40,0.15)", border: `1px solid ${C.border}` }}>

                <div style={{ position: "relative", height: "120px", background: backgroundImage ? `url(${backgroundImage}) center/cover` : C.grad }}>
                    {backButton}
                    {isOwner && (
                        <>
                            <input type="file" ref={bgInputRef} onChange={handleBgUpload} accept="image/*" style={{ display: "none" }} />
                            <button onClick={() => bgInputRef.current?.click()} style={{ position: "absolute", top: "12px", right: "12px", padding: "8px", borderRadius: "8px", background: "rgba(251,247,243,0.9)", border: `1px solid ${C.border}`, cursor: "pointer" }}>
                                <Camera />
                            </button>
                        </>
                    )}
                    <div style={{ position: "absolute", bottom: "-48px", left: "50%", transform: "translateX(-50%)" }}>
                        <div style={{ position: "relative" }}>
                            {image ? (
                                <img src={image} alt={name} style={{ width: "96px", height: "96px", borderRadius: "50%", border: `4px solid ${C.bg}`, objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: "96px", height: "96px", borderRadius: "50%", border: `4px solid ${C.bg}`, background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "28px" }}>
                                    {name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {verified && (
                                <div style={{ position: "absolute", bottom: "2px", right: "2px", width: "24px", height: "24px", borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", border: "2px solid #fff" }}>✓</div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ background: C.bg, padding: "60px 24px 28px", textAlign: "center" }}>
                    <h1 style={{ fontSize: "20px", fontWeight: "bold", color: C.dark, marginBottom: "4px" }}>{name}</h1>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "10px" }}>
                        <Star filled style={{ color: "#f59e0b" }} />
                        <span style={{ fontWeight: "bold", color: C.dark }}>{rating}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: C.mid, marginBottom: "4px" }}>{currentRole}</p>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", background: C.border, fontSize: "12px", color: C.dark, marginBottom: "20px", marginTop: "8px" }}>
                        <Briefcase /> {experience}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
                        {([
                            ["Total Sessions", totalSessions],
                            ["Completion Rate", completionRate],
                            ["Response Time", responseTime],
                            ["Success Rate", successRate],
                        ] as [string, string | number][]).map(([label, val]) => (
                            <div key={label} style={{ borderRadius: "12px", padding: "12px", background: C.surface, border: `1px solid ${C.border}` }}>
                                <div style={{ fontSize: "15px", fontWeight: "bold", color: C.dark }}>{val}</div>
                                <div style={{ fontSize: "11px", color: C.mid }}>{label}</div>
                            </div>
                        ))}
                    </div>

                    {isOwner ? (
                        <div style={{ marginBottom: "16px" }}>
                            <button
                                onClick={() => onEditClick?.()}
                                style={{
                                    width: "100%", padding: "10px", borderRadius: "10px",
                                    border: "1px solid #4a3728", background: "#4a3728", color: "#fff",
                                    fontWeight: 600, fontSize: "13px", cursor: "pointer",
                                }}
                            >
                                Edit Profile
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                            <button
                                onClick={handleToggleSave}
                                disabled={savingToggle}
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    borderRadius: "10px",
                                    border: `1px solid ${saved ? "#4a3728" : C.border}`,
                                    background: saved ? "#4a3728" : C.surface,
                                    color: saved ? "#fff" : C.dark,
                                    fontWeight: 600,
                                    fontSize: "13px",
                                    cursor: savingToggle ? "not-allowed" : "pointer",
                                    opacity: savingToggle ? 0.6 : 1,
                                }}
                            >
                                {saved ? "Saved" : "Save Mentor"}
                            </button>
                            <button
                                onClick={() => setReportOpen(true)}
                                style={{
                                    padding: "10px 14px",
                                    borderRadius: "10px",
                                    border: `1px solid ${C.border}`,
                                    background: C.surface,
                                    color: "#b91c1c",
                                    fontWeight: 600,
                                    fontSize: "13px",
                                    cursor: "pointer",
                                }}
                            >
                                Report
                            </button>
                        </div>
                    )}

                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
                        {linkedinUrl !== "#" && (
                            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                                <button style={{ padding: "8px 18px", borderRadius: "8px", background: C.border, border: "none", cursor: "pointer", color: C.dark, fontWeight: "bold" }}>in</button>
                            </a>
                        )}
                        {mentorData?.socialProof?.githubUrl && (
                            <a href={mentorData.socialProof.githubUrl} target="_blank" rel="noopener noreferrer">
                                <button style={{ padding: "8px 18px", borderRadius: "8px", background: C.border, border: "none", cursor: "pointer", color: C.dark, fontWeight: "bold" }}>GitHub</button>
                            </a>
                        )}
                    </div>

                    {(languages.length > 0 || timezone) && (
                        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", textAlign: "left" }}>
                            {languages.length > 0 && (
                                <div style={{ flex: 1, borderRadius: "12px", padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}` }}>
                                    <div style={{ fontSize: "10px", color: C.mid, marginBottom: "4px", textTransform: "uppercase", fontWeight: 700 }}>Languages</div>
                                    <div style={{ fontSize: "12px", color: C.dark, fontWeight: 600 }}>{languages.join(", ")}</div>
                                </div>
                            )}
                            {timezone && (
                                <div style={{ flex: 1, borderRadius: "12px", padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}` }}>
                                    <div style={{ fontSize: "10px", color: C.mid, marginBottom: "4px", textTransform: "uppercase", fontWeight: 700 }}>Timezone</div>
                                    <div style={{ fontSize: "12px", color: C.dark, fontWeight: 600 }}>{timezone}</div>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ textAlign: "left", marginBottom: "20px" }}>
                        <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "8px" }}>Skills</h3>
                        {skills.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {skills.map((skill: string) => (
                                    <span key={skill} style={{ padding: "4px 10px", borderRadius: "20px", background: C.surface, border: `1px solid ${C.border}`, fontSize: "11px", color: C.dark }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: "12px", color: C.mid }}>No skills added yet.</p>
                        )}
                    </div>

                    <div style={{ textAlign: "left", marginBottom: "20px" }}>
                        <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "8px" }}>About</h3>
                        <p style={{ fontSize: "13px", color: C.mid, lineHeight: "1.6" }}>{about}</p>
                    </div>

                    <div style={{ textAlign: "left" }}>
                        <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "12px" }}>Work Experience</h3>

                        <div style={{ borderRadius: "12px", padding: "14px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: "10px" }}>
                            <div style={{ fontWeight: "bold", color: C.dark, fontSize: "13px", marginBottom: "2px" }}>{currentRole}</div>
                            <div style={{ fontSize: "11px", color: C.mid }}>Present</div>
                        </div>

                        {previousRoles.length > 0 ? (
                            previousRoles.map((w: any, i: number) => (
                                <div key={i} style={{ borderRadius: "12px", padding: "14px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: "10px" }}>
                                    <div style={{ fontWeight: "bold", color: C.dark, fontSize: "13px", marginBottom: "2px" }}>{w.title || w.position}</div>
                                    <div style={{ color: C.mid, fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>{w.company}</div>
                                    {w.location && <div style={{ fontSize: "11px", color: C.mid, marginBottom: "2px" }}>{w.location}</div>}
                                    {w.duration && <div style={{ fontSize: "11px", color: C.mid, marginBottom: "6px" }}>{w.duration}</div>}
                                    {w.description && <div style={{ fontSize: "12px", color: C.dark }}>{w.description}</div>}
                                </div>
                            ))
                        ) : (
                            <p style={{ fontSize: "12px", color: C.mid }}>No previous work experience added yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {!isOwner && reportOpen && (
                <div
                    style={{
                        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 2000, padding: "16px",
                    }}
                    onClick={() => !reportSubmitting && setReportOpen(false)}
                >
                    <div
                        style={{ background: "#fff", borderRadius: "16px", padding: "24px", maxWidth: "420px", width: "100%" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontWeight: "bold", fontSize: "16px", color: C.dark, marginBottom: "6px" }}>Report this mentor</h3>
                        <p style={{ fontSize: "12px", color: C.mid, marginBottom: "14px" }}>
                            Tell us what&apos;s wrong. Our team will review this report.
                        </p>

                        {reportSuccess ? (
                            <div style={{ padding: "12px", borderRadius: "10px", background: "#dcfce7", color: "#15803d", fontSize: "13px", fontWeight: 600 }}>
                                Report submitted. Thank you.
                            </div>
                        ) : (
                            <>
                                <textarea
                                    rows={4}
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    placeholder="Describe the issue (min 10 characters)..."
                                    style={{
                                        width: "100%", padding: "10px", borderRadius: "10px",
                                        border: `1px solid ${C.border}`, fontSize: "13px", resize: "none",
                                        marginBottom: "8px",
                                    }}
                                    disabled={reportSubmitting}
                                />
                                {reportError && (
                                    <p style={{ fontSize: "12px", color: "#dc2626", marginBottom: "8px" }}>{reportError}</p>
                                )}
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        onClick={() => setReportOpen(false)}
                                        disabled={reportSubmitting}
                                        style={{
                                            flex: 1, padding: "10px", borderRadius: "10px",
                                            border: `1px solid ${C.border}`, background: "#fff",
                                            color: C.dark, fontWeight: 600, fontSize: "13px", cursor: "pointer",
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitReport}
                                        disabled={reportSubmitting}
                                        style={{
                                            flex: 1, padding: "10px", borderRadius: "10px",
                                            border: "none", background: "#b91c1c",
                                            color: "#fff", fontWeight: 600, fontSize: "13px",
                                            cursor: reportSubmitting ? "not-allowed" : "pointer",
                                            opacity: reportSubmitting ? 0.6 : 1,
                                        }}
                                    >
                                        {reportSubmitting ? "Submitting..." : "Submit Report"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorSidebar;