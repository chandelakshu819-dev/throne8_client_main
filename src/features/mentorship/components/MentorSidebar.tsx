"use client";
//src/features/mentorship/components/MentorSidebar.tsx
import React, { useRef, useState, useEffect } from "react";
import { Camera, Star, Briefcase } from "./Icons";
import { C } from "../types/data";
import ProfileService from "@/lib/api/profile.service";

interface MentorSidebarProps {
    mentorData: any;
    currentUserId?: string;
}

const MentorSidebar: React.FC<MentorSidebarProps> = ({ mentorData, currentUserId }) => {
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [fetchedCoverUrl, setFetchedCoverUrl] = useState<string | null>(null);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const bgInputRef = useRef<HTMLInputElement>(null);

    // ✅ Fetch the mentor's real active cover photo (public — works for any viewer)
    useEffect(() => {
        const targetUserId = mentorData?.userId;
        if (!targetUserId) return;

        let cancelled = false;

        ProfileService.getActiveCoverPhotoByUserId(targetUserId)
            .then((res) => {
                if (cancelled) return;
                const url = res?.data?.cover?.cloudinarySecureUrl || null;
                setFetchedCoverUrl(url);
            })
            .catch(() => {
                if (!cancelled) setFetchedCoverUrl(null);
            });

        return () => {
            cancelled = true;
        };
    }, [mentorData?.userId]);

    if (!mentorData) {
        return (
            <div style={{ position: "sticky", top: "24px" }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ borderRadius: "24px", padding: "60px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", background: C.bg, border: `1px solid ${C.border}` }}>
                    <div style={{ width: "36px", height: "36px", border: `3px solid ${C.border}`, borderTop: `3px solid ${C.dark}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <span style={{ fontSize: "13px", color: C.mid }}>Loading mentor profile...</span>
                </div>
            </div>
        );
    }

    const isOwner = !!currentUserId && !!mentorData?.userId && currentUserId === mentorData.userId;

    const name = mentorData.user ? `${mentorData.user.firstName ?? ""} ${mentorData.user.lastName ?? ""}`.trim() : "Unnamed Mentor";
    const rating = mentorData?.stats?.averageRating ?? 0;
    const experience = mentorData?.experience?.total != null ? `${mentorData.experience.total} years of Experience` : "Experience not specified";
    const about = mentorData?.bio || "No bio added yet.";
    const image = mentorData?.profilePic || "";
    const verified = mentorData?.verification?.isVerified ?? false;
    const totalSessions = mentorData?.stats?.totalSessions ?? 0;
    const completionRate = mentorData?.stats?.completionRate != null ? `${mentorData.stats.completionRate}%` : "N/A";
    const responseTime = mentorData?.stats?.responseTime != null ? `< ${mentorData.stats.responseTime} hrs` : "N/A";
    const trustScoreVal = mentorData?.trustScore?.overall ?? "N/A";
    const currentRole = mentorData?.experience?.currentRole || "Not specified";
    const previousRoles = mentorData?.experience?.previousRoles || [];
    const linkedinUrl = mentorData?.socialProof?.linkedinUrl || "#";
    const skills = mentorData?.skills || [];

    // ✅ Upload flow: show instant local preview, then actually persist to server.
    // On success, swap the preview for the real Cloudinary URL so a page refresh
    // shows the same banner. On failure, fall back to whatever was there before.
    const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Instant local preview while the upload is in flight
        const reader = new FileReader();
        reader.onloadend = () => setBackgroundImage(reader.result as string);
        reader.readAsDataURL(file);

        setIsUploadingCover(true);

        ProfileService.uploadCoverPhoto(file, true)
            .then((res) => {
                const uploadedUrl = res?.data?.cover?.cloudinarySecureUrl;
                if (uploadedUrl) {
                    setFetchedCoverUrl(uploadedUrl);
                }
            })
            .catch((error: any) => {
                console.error("❌ [MENTOR_SIDEBAR] Cover upload failed", error);
                // Revert local preview since the upload didn't actually persist
                setBackgroundImage(null);
            })
            .finally(() => {
                setIsUploadingCover(false);
                // Clear the local preview once we've reconciled with the server URL
                setBackgroundImage(null);
                if (bgInputRef.current) bgInputRef.current.value = "";
            });
    };

    // Priority: local upload preview > real fetched cover > gradient fallback
    const bannerBackground = backgroundImage
        ? `url(${backgroundImage}) center/cover`
        : fetchedCoverUrl
            ? `url(${fetchedCoverUrl}) center/cover`
            : C.grad;

    return (
        <div style={{ position: "sticky", top: "24px" }}>
            <div style={{ borderRadius: "24px", overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.08)", border: `1px solid ${C.border}`, background: C.bg }}>

                {/* Banner */}
                <div style={{ position: "relative", height: "140px", background: bannerBackground }}>
                    {/* Add a subtle gradient overlay to the banner for a premium feel */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4))" }}></div>
                    {isOwner && (
                        <>
                            <input type="file" ref={bgInputRef} onChange={handleBgUpload} accept="image/*" style={{ display: "none" }} disabled={isUploadingCover} />
                            <button
                                onClick={() => bgInputRef.current?.click()}
                                disabled={isUploadingCover}
                                style={{ position: "absolute", top: "16px", right: "16px", padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.9)", border: "none", cursor: isUploadingCover ? "not-allowed" : "pointer", opacity: isUploadingCover ? 0.6 : 1, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <Camera />
                            </button>
                        </>
                    )}
                    <div style={{ position: "absolute", bottom: "-50px", left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
                        <div style={{ position: "relative" }}>
                            {image ? (
                                <img src={image} alt={name} style={{ width: "100px", height: "100px", borderRadius: "50%", border: `4px solid ${C.bg}`, objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            ) : (
                                <div style={{ width: "100px", height: "100px", borderRadius: "50%", border: `4px solid ${C.bg}`, background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "32px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                                    {name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {verified && (
                                <div style={{ position: "absolute", bottom: "4px", right: "4px", width: "26px", height: "26px", borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", border: `3px solid ${C.bg}`, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>✓</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: "64px 28px 32px", textAlign: "center" }}>
                    <h1 style={{ fontSize: "24px", fontWeight: "800", color: C.dark, marginBottom: "8px", letterSpacing: "-0.5px" }}>{name}</h1>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "8px" }}>
                        <Star filled style={{ color: "#f59e0b", width: "18px", height: "18px" }} />
                        <span style={{ fontWeight: "700", color: C.dark, fontSize: "15px" }}>{rating}</span>
                    </div>
                    <p style={{ fontSize: "15px", color: C.mid, marginBottom: "16px", fontWeight: "500" }}>{currentRole}</p>
                    
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "30px", background: C.surface, border: `1px solid ${C.border}`, fontSize: "13px", color: C.dark, marginBottom: "28px", fontWeight: "600", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                        <Briefcase style={{ width: "16px", height: "16px", color: C.mid }} /> {experience}
                    </div>

                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" }}>
                        {([
                            ["Total Sessions", totalSessions],
                            ["Completion Rate", completionRate],
                            ["Response Time", responseTime],
                            ["Trust Score", trustScoreVal],
                        ] as [string, string | number][]).map(([label, val]) => (
                            <div key={label} style={{ borderRadius: "16px", padding: "16px", background: C.surface, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: "4px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                                <div style={{ fontSize: "18px", fontWeight: "800", color: C.dark }}>{val}</div>
                                <div style={{ fontSize: "12px", color: C.mid, fontWeight: "500" }}>{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Socials */}
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "32px", flexWrap: "wrap" }}>
                        {linkedinUrl !== "#" && (
                            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                <button style={{ padding: "10px 20px", borderRadius: "12px", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", color: C.dark, fontWeight: "600", fontSize: "13px", transition: "all 0.2s", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>LinkedIn</button>
                            </a>
                        )}
                        {mentorData?.socialProof?.githubUrl && (
                            <a href={mentorData.socialProof.githubUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                <button style={{ padding: "10px 20px", borderRadius: "12px", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", color: C.dark, fontWeight: "600", fontSize: "13px", transition: "all 0.2s", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>GitHub</button>
                            </a>
                        )}
                        {mentorData?.socialProof?.portfolioUrl && (
                            <a href={mentorData.socialProof.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                <button style={{ padding: "10px 20px", borderRadius: "12px", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", color: C.dark, fontWeight: "600", fontSize: "13px", transition: "all 0.2s", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>Portfolio</button>
                            </a>
                        )}
                    </div>

                    {/* Skills */}
                    <div style={{ textAlign: "left", marginBottom: "28px" }}>
                        <h3 style={{ fontWeight: "700", color: C.dark, marginBottom: "12px", fontSize: "16px" }}>Skills</h3>
                        {skills.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {skills.map((skill: string) => (
                                    <span key={skill} style={{ padding: "6px 14px", borderRadius: "24px", background: C.surface, border: `1px solid ${C.border}`, fontSize: "13px", color: C.dark, fontWeight: "500", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: "14px", color: C.mid }}>No skills added yet.</p>
                        )}
                    </div>

                    {/* About */}
                    <div style={{ textAlign: "left", marginBottom: "28px" }}>
                        <h3 style={{ fontWeight: "700", color: C.dark, marginBottom: "12px", fontSize: "16px" }}>About</h3>
                        <p style={{ fontSize: "14px", color: C.mid, lineHeight: "1.7" }}>{about}</p>
                    </div>

                    {/* Work Experience */}
                    <div style={{ textAlign: "left" }}>
                        <h3 style={{ fontWeight: "700", color: C.dark, marginBottom: "16px", fontSize: "16px" }}>Work Experience</h3>

                        {/* Current Role */}
                        <div style={{ borderRadius: "16px", padding: "18px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                            <div style={{ fontWeight: "700", color: C.dark, fontSize: "15px", marginBottom: "4px" }}>{currentRole}</div>
                            <div style={{ fontSize: "13px", color: C.mid, fontWeight: "500" }}>Present</div>
                        </div>

                        {/* Previous Roles */}
                        {previousRoles.length > 0 ? (
                            previousRoles.map((w: any, i: number) => (
                                <div key={i} style={{ borderRadius: "16px", padding: "18px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                                    <div style={{ fontWeight: "700", color: C.dark, fontSize: "15px", marginBottom: "4px" }}>{w.title || w.position}</div>
                                    <div style={{ color: C.dark, fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>{w.company}</div>
                                    <div style={{ display: "flex", gap: "12px", marginBottom: w.description ? "12px" : "0" }}>
                                        {w.location && <div style={{ fontSize: "12px", color: C.mid, display: "flex", alignItems: "center", gap: "4px" }}>📍 {w.location}</div>}
                                        {w.duration && <div style={{ fontSize: "12px", color: C.mid, display: "flex", alignItems: "center", gap: "4px" }}>📅 {w.duration}</div>}
                                    </div>
                                    {w.description && <div style={{ fontSize: "13px", color: C.mid, lineHeight: "1.6" }}>{w.description}</div>}
                                </div>
                            ))
                        ) : (
                            <p style={{ fontSize: "14px", color: C.mid }}>No previous work experience added yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorSidebar;