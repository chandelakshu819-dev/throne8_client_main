"use client";
//src/features/mentorship/components/MentorSidebar.tsx
import React, { useRef, useState, useEffect } from "react";
import { Camera, Star, Briefcase } from "./Icons";
import { C } from "../types/data";
import ProfileService from "@/lib/api/profile.service";
import MentorService from "@/lib/api/mentorship.service";

interface MentorSidebarProps {
    mentorData: any;
    currentUserId?: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getNextAvailableSlot(
    daysAvailable: string[] | undefined,
    preferredHours: { start?: string; end?: string } | undefined
): string | null {
    if (!daysAvailable || daysAvailable.length === 0) return null;

    const normalized = daysAvailable.map((d) => d.toLowerCase());
    const today = new Date().getDay();

    for (let offset = 0; offset < 7; offset++) {
        const dayIndex = (today + offset) % 7;
        const dayName = DAY_NAMES[dayIndex];
        if (normalized.includes(dayName.toLowerCase())) {
            const label = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : dayName;
            return preferredHours?.start ? `${label}, ${preferredHours.start}` : label;
        }
    }
    return null;
}

const MentorSidebar: React.FC<MentorSidebarProps> = ({ mentorData, currentUserId }) => {
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [fetchedCoverUrl, setFetchedCoverUrl] = useState<string | null>(null);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const bgInputRef = useRef<HTMLInputElement>(null);

    const [isSaved, setIsSaved] = useState<boolean>(mentorData?.isSavedByCurrentUser ?? false);
    const [isSaving, setIsSaving] = useState(false);
    const [bioExpanded, setBioExpanded] = useState(false);
    const [showReportBox, setShowReportBox] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    useEffect(() => {
        setIsSaved(mentorData?.isSavedByCurrentUser ?? false);
    }, [mentorData?.isSavedByCurrentUser]);

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
    const tagline = mentorData?.tagline || "";
    const rating = mentorData?.stats?.averageRating ?? 0;
    const totalReviews = mentorData?.stats?.totalReviews ?? 0;
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
    const twitterUrl = mentorData?.socialProof?.twitterUrl || "";
    const websiteUrl = mentorData?.socialProof?.websiteUrl || "";
    const certifications = mentorData?.socialProof?.certifications || [];
    const achievements = mentorData?.achievements || [];
    const credentials = [...certifications, ...achievements];
    const skills = mentorData?.skills || [];
    const domains = mentorData?.domains || [];
    const languages = mentorData?.languages || [];
    const timezone = mentorData?.availability?.timezone;
    const daysAvailable: string[] = mentorData?.availability?.daysAvailable || [];
    const preferredHours = mentorData?.availability?.preferredHours;
    const company = mentorData?.company;

    const nextAvailableSlot = getNextAvailableSlot(daysAvailable, preferredHours);
    const hasAvailabilityInfo = !!timezone || daysAvailable.length > 0 || !!preferredHours;

    const isTopMentor =
        (typeof trustScoreVal === "number" && trustScoreVal >= 90) ||
        (verified && rating >= 4.8 && totalReviews >= 5);

    const BIO_LIMIT = 180;
    const isBioLong = about.length > BIO_LIMIT;
    const displayedBio = bioExpanded || !isBioLong ? about : `${about.slice(0, BIO_LIMIT)}...`;

    const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (!file) return;

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
                console.error("[MENTOR_SIDEBAR] Cover upload failed", error);
                setBackgroundImage(null);
            })
            .finally(() => {
                setIsUploadingCover(false);
                setBackgroundImage(null);
                if (bgInputRef.current) bgInputRef.current.value = "";
            });
    };

    const handleToggleSave = async () => {
        if (!mentorData?.mentorId || isSaving) return;
        setIsSaving(true);
        const previous = isSaved;
        setIsSaved(!previous);
        try {
            const res = await MentorService.toggleSaveMentor(mentorData.mentorId);
            setIsSaved(res.saved);
        } catch (error) {
            console.error("[MENTOR_SIDEBAR] Save toggle failed", error);
            setIsSaved(previous);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmitReport = async () => {
        if (!mentorData?.mentorId || !reportReason.trim() || reportSubmitting) return;
        setReportSubmitting(true);
        try {
            await MentorService.reportMentor(mentorData.mentorId, reportReason.trim());
            setShowReportBox(false);
            setReportReason("");
        } catch (error) {
            console.error("[MENTOR_SIDEBAR] Report submit failed", error);
        } finally {
            setReportSubmitting(false);
        }
    };

    const handleShare = async () => {
        const url = typeof window !== "undefined" ? window.location.href : "";
        if (typeof navigator !== "undefined" && (navigator as any).share) {
            try {
                await (navigator as any).share({ title: name, url });
                return;
            } catch {
                // user cancelled share sheet
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
        } catch (error) {
            console.error("[MENTOR_SIDEBAR] Copy link failed", error);
        }
    };

    const bannerBackground = backgroundImage
        ? `url(${backgroundImage}) center/cover`
        : fetchedCoverUrl
            ? `url(${fetchedCoverUrl}) center/cover`
            : C.grad;

    return (
        <div style={{ position: "sticky", top: "24px" }}>
            <div style={{ borderRadius: "24px", overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.08)", border: `1px solid ${C.border}`, background: C.bg }}>

                <div style={{ position: "relative", height: "140px", background: bannerBackground }}>
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
                    {!isOwner && (
                        <button
                            onClick={() => setShowReportBox((v) => !v)}
                            title="Report or block"
                            style={{ position: "absolute", top: "16px", right: "16px", padding: "8px 12px", borderRadius: "12px", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", fontSize: "18px", lineHeight: 1, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, color: C.dark, fontWeight: 700 }}
                        >
                            &#8942;
                        </button>
                    )}
                    {isTopMentor && (
                        <div
                            style={{
                                position: "absolute",
                                top: "16px",
                                left: "16px",
                                padding: "6px 14px",
                                borderRadius: "20px",
                                background: C.dark,
                                color: "#fff",
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.4px",
                                textTransform: "uppercase",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                                zIndex: 10,
                            }}
                        >
                            Top Mentor
                        </div>
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
                                <div style={{ position: "absolute", bottom: "4px", right: "4px", width: "26px", height: "26px", borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", border: `3px solid ${C.bg}`, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>&#10003;</div>
                            )}
                        </div>
                    </div>
                </div>

                {showReportBox && !isOwner && (
                    <div style={{ margin: "56px 20px 0", padding: "14px", borderRadius: "14px", background: C.surface, border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: C.dark, marginBottom: "8px" }}>Report this mentor</div>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="What's wrong with this profile?"
                            rows={3}
                            style={{ width: "100%", borderRadius: "10px", border: `1px solid ${C.border}`, padding: "8px", fontSize: "13px", resize: "vertical", marginBottom: "8px", fontFamily: "inherit" }}
                        />
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button onClick={() => setShowReportBox(false)} style={{ padding: "6px 14px", borderRadius: "10px", border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontSize: "13px", color: C.mid }}>Cancel</button>
                            <button
                                onClick={handleSubmitReport}
                                disabled={!reportReason.trim() || reportSubmitting}
                                style={{ padding: "6px 14px", borderRadius: "10px", border: "none", background: C.dark, color: "#fff", cursor: reportSubmitting ? "not-allowed" : "pointer", fontSize: "13px", opacity: reportSubmitting ? 0.6 : 1 }}
                            >
                                {reportSubmitting ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ padding: showReportBox && !isOwner ? "20px 28px 32px" : "64px 28px 32px", textAlign: "center" }}>
                    <h1 style={{ fontSize: "24px", fontWeight: "800", color: C.dark, marginBottom: tagline ? "4px" : "8px", letterSpacing: "-0.5px" }}>{name}</h1>

                    {tagline && (
                        <p style={{ fontSize: "13px", color: C.mid, fontStyle: "italic", marginBottom: "10px" }}>{tagline}</p>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "8px" }}>
                        <Star filled style={{ color: "#f59e0b", width: "18px", height: "18px" }} />
                        <span style={{ fontWeight: "700", color: C.dark, fontSize: "15px" }}>{rating}</span>
                        <span style={{ fontSize: "13px", color: C.mid }}>
                            {totalReviews > 0 ? `\u00B7 ${totalReviews} review${totalReviews === 1 ? "" : "s"}` : "\u00B7 No reviews yet"}
                        </span>
                    </div>
                    <p style={{ fontSize: "15px", color: C.mid, marginBottom: "16px", fontWeight: "500" }}>{currentRole}</p>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "30px", background: C.surface, border: `1px solid ${C.border}`, fontSize: "13px", color: C.dark, marginBottom: "20px", fontWeight: "600", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                        <Briefcase style={{ width: "16px", height: "16px", color: C.mid }} /> {experience}
                    </div>

                    {company ? (
                        <a
                            href={company.slug ? `/user-company/${company.slug}` : "#"}
                            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "14px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: "24px", textAlign: "left" }}
                        >
                            {company.logoUrl ? (
                                <img src={company.logoUrl} alt={company.name} style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: C.grad }} />
                            )}
                            <div>
                                <div style={{ fontSize: "13px", fontWeight: 700, color: C.dark }}>{currentRole}</div>
                                <div style={{ fontSize: "12px", color: C.mid }}>at {company.name}</div>
                            </div>
                        </a>
                    ) : null}

                    {!isOwner && (
                        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px", flexWrap: "wrap" }}>
                            <button
                                onClick={handleToggleSave}
                                disabled={isSaving}
                                style={{ padding: "10px 20px", borderRadius: "12px", background: isSaved ? C.dark : C.surface, border: `1px solid ${C.border}`, cursor: isSaving ? "not-allowed" : "pointer", color: isSaved ? "#fff" : C.dark, fontWeight: "600", fontSize: "13px", opacity: isSaving ? 0.6 : 1 }}
                            >
                                {isSaved ? "Saved" : "Save"}
                            </button>
                            <button onClick={handleShare} style={{ padding: "10px 20px", borderRadius: "12px", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", color: C.dark, fontWeight: "600", fontSize: "13px" }}>
                                {shareCopied ? "Link copied!" : "Share"}
                            </button>
                        </div>
                    )}

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

                    {hasAvailabilityInfo && (
                        <div style={{ textAlign: "left", marginBottom: "28px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                <h3 style={{ fontWeight: "700", color: C.dark, fontSize: "16px" }}>Availability</h3>
                                {nextAvailableSlot && (
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff", background: "#10b981", padding: "4px 10px", borderRadius: "20px" }}>
                                        Next: {nextAvailableSlot}
                                    </span>
                                )}
                            </div>
                            <div style={{ borderRadius: "16px", padding: "16px", background: C.surface, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: "10px" }}>
                                {timezone && (
                                    <div style={{ fontSize: "13px", color: C.dark }}>
                                        <span style={{ color: C.mid }}>Timezone: </span>{timezone}
                                    </div>
                                )}
                                {preferredHours?.start && preferredHours?.end && (
                                    <div style={{ fontSize: "13px", color: C.dark }}>
                                        <span style={{ color: C.mid }}>Preferred hours: </span>{preferredHours.start} - {preferredHours.end}
                                    </div>
                                )}
                                {daysAvailable.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {daysAvailable.map((day) => (
                                            <span key={day} style={{ padding: "4px 10px", borderRadius: "20px", background: C.bg, border: `1px solid ${C.border}`, fontSize: "12px", color: C.dark, fontWeight: "500" }}>
                                                {day}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                        {twitterUrl && (
                            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                <button style={{ padding: "10px 20px", borderRadius: "12px", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", color: C.dark, fontWeight: "600", fontSize: "13px", transition: "all 0.2s", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>Twitter</button>
                            </a>
                        )}
                        {websiteUrl && (
                            <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                <button style={{ padding: "10px 20px", borderRadius: "12px", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", color: C.dark, fontWeight: "600", fontSize: "13px", transition: "all 0.2s", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>Website</button>
                            </a>
                        )}
                    </div>

                    {domains.length > 0 && (
                        <div style={{ textAlign: "left", marginBottom: "28px" }}>
                            <h3 style={{ fontWeight: "700", color: C.dark, marginBottom: "12px", fontSize: "16px" }}>Focus Areas</h3>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {domains.map((domain: string) => (
                                    <span key={domain} style={{ padding: "6px 14px", borderRadius: "24px", background: C.dark, border: `1px solid ${C.dark}`, fontSize: "13px", color: "#fff", fontWeight: "600" }}>
                                        {domain}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

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

                    {languages.length > 0 && (
                        <div style={{ textAlign: "left", marginBottom: "28px" }}>
                            <h3 style={{ fontWeight: "700", color: C.dark, marginBottom: "12px", fontSize: "16px" }}>Languages</h3>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {languages.map((lang: string) => (
                                    <span key={lang} style={{ padding: "6px 14px", borderRadius: "24px", background: C.surface, border: `1px solid ${C.border}`, fontSize: "13px", color: C.dark, fontWeight: "500" }}>
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {credentials.length > 0 && (
                        <div style={{ textAlign: "left", marginBottom: "28px" }}>
                            <h3 style={{ fontWeight: "700", color: C.dark, marginBottom: "12px", fontSize: "16px" }}>Certifications & Achievements</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {credentials.map((item: any, i: number) => {
                                    const label = typeof item === "string" ? item : item?.name || item?.title || "";
                                    const issuer = typeof item === "object" ? item?.issuer : undefined;
                                    if (!label) return null;
                                    return (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "12px", background: C.surface, border: `1px solid ${C.border}` }}>
                                            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: C.dark, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0 }}>&#10003;</div>
                                            <div>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: C.dark }}>{label}</div>
                                                {issuer && <div style={{ fontSize: "12px", color: C.mid }}>{issuer}</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div style={{ textAlign: "left", marginBottom: "28px" }}>
                        <h3 style={{ fontWeight: "700", color: C.dark, marginBottom: "12px", fontSize: "16px" }}>About</h3>
                        <p style={{ fontSize: "14px", color: C.mid, lineHeight: "1.7" }}>{displayedBio}</p>
                        {isBioLong && (
                            <button
                                onClick={() => setBioExpanded((v) => !v)}
                                style={{ marginTop: "6px", background: "none", border: "none", padding: 0, color: C.dark, fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                            >
                                {bioExpanded ? "See less" : "See more"}
                            </button>
                        )}
                    </div>

                    <div style={{ textAlign: "left" }}>
                        <h3 style={{ fontWeight: "700", color: C.dark, marginBottom: "16px", fontSize: "16px" }}>Work Experience</h3>

                        <div style={{ borderRadius: "16px", padding: "18px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                            <div style={{ fontWeight: "700", color: C.dark, fontSize: "15px", marginBottom: "4px" }}>{currentRole}</div>
                            <div style={{ fontSize: "13px", color: C.mid, fontWeight: "500" }}>Present</div>
                        </div>

                        {previousRoles.length > 0 ? (
                            previousRoles.map((w: any, i: number) => (
                                <div key={i} style={{ borderRadius: "16px", padding: "18px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                                    <div style={{ fontWeight: "700", color: C.dark, fontSize: "15px", marginBottom: "4px" }}>{w.title || w.position}</div>
                                    <div style={{ color: C.dark, fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>{w.company}</div>
                                    <div style={{ display: "flex", gap: "12px", marginBottom: w.description ? "12px" : "0" }}>
                                        {w.location && <div style={{ fontSize: "12px", color: C.mid, display: "flex", alignItems: "center", gap: "4px" }}>{w.location}</div>}
                                        {w.duration && <div style={{ fontSize: "12px", color: C.mid, display: "flex", alignItems: "center", gap: "4px" }}>{w.duration}</div>}
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