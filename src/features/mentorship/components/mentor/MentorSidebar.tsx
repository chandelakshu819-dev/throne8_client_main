"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
//src/features/mentorship/components/mentor/MentorSidebar.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Camera, Star, Briefcase } from "./Icons";
import { ArrowLeft, Bookmark, Flag, GraduationCap, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { C } from "../../types/data";
import MentorService from "@/lib/api/mentorship.service";
import SocialLinkTile from "../SocialLinkTile";
import CompanyLogo from "../CompanyLogo";
import { formatRoleDuration, sortRolesNewestFirst } from "@/shared/utils/mentorFormat";

interface MentorSidebarProps {
    mentorData: any;
    currentUserId?: string;
    onBack?: () => void;
    onEditClick?: () => void;
}

const ABOUT_LINES = 4;

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

    const [aboutExpanded, setAboutExpanded] = useState<boolean>(false);
    const [aboutClamped, setAboutClamped] = useState<boolean>(false);
    const aboutRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (mentorData?.savedBy && currentUserId) {
            setSaved(mentorData.savedBy.includes(currentUserId));
        } else {
            setSaved(false);
        }
    }, [mentorData?.savedBy, currentUserId]);

    // About text 4 line se lamba hai ya nahi, yeh measure karta hai
    const measureAbout = () => {
        const el = aboutRef.current;
        if (!el || aboutExpanded) return;
        setAboutClamped(el.scrollHeight > el.clientHeight + 1);
    };

    useLayoutEffect(() => {
        measureAbout();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mentorData?.bio, !!mentorData]);

    useEffect(() => {
        window.addEventListener("resize", measureAbout);
        return () => window.removeEventListener("resize", measureAbout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aboutExpanded]);

    // Camera (change-photo) button sirf tab dikhega jab logged-in user hi is mentor ka owner ho
    const isOwner = !!currentUserId && !!mentorData?.userId && currentUserId === mentorData.userId;
    // Save / Report sirf logged-in visitor ko dikhenge, owner ko nahi
    const canInteract = !!currentUserId && !isOwner;
    const router = useRouter();
    const [backHovered, setBackHovered] = useState<boolean>(false);

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    const backButton = (
        <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            onMouseEnter={() => setBackHovered(true)}
            onMouseLeave={() => setBackHovered(false)}
            className="transition-all duration-200 active:scale-95"
            style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                zIndex: 10,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                minHeight: "40px",
                minWidth: "40px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: backHovered ? "#ffffff" : "rgba(255, 255, 255, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                boxShadow: backHovered ? "0 4px 12px rgba(0, 0, 0, 0.12)" : "0 2px 6px rgba(0, 0, 0, 0.08)",
                color: C.dark,
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                lineHeight: 1,
            }}
        >
            <ArrowLeft size={18} />
            <span></span>
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
    const totalSessions = mentorData?.stats?.totalSessions;

    const currentRole = mentorData?.experience?.currentRole || "Not specified";
    const expTotal = mentorData?.experience?.total;
    const experience =
        expTotal != null
            ? `${expTotal} ${Number(expTotal) === 1 ? "year" : "years"} of Experience`
            : "Experience not specified";
    const sortedRoles = sortRolesNewestFirst(mentorData?.experience?.previousRoles || []);
    const skills = mentorData?.skills || [];
    const languages: string[] = mentorData?.languages || [];
    const timezone: string = mentorData?.availability?.timezone || "";
    const domains: string[] = Array.isArray(mentorData?.domains) ? mentorData.domains.filter(Boolean) : [];

    const college: string = mentorData?.college || "";
    const degree: string = mentorData?.degree || "";
    const branch: string = mentorData?.branch || "";
    const hasEducation = !!(college || degree || branch);
    const educationLine = [degree, branch].filter(Boolean).join(" · ");

    const aboutClampStyle: React.CSSProperties = aboutExpanded
        ? {}
        : {
            display: "-webkit-box",
            WebkitLineClamp: ABOUT_LINES,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
        };

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

    const closeReport = () => {
        if (reportSubmitting) return;
        setReportOpen(false);
        setReportReason("");
        setReportError(null);
        setReportSuccess(false);
    };

    const iconBtnStyle: React.CSSProperties = {
        width: "40px",
        height: "40px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "8px",
        background: "rgba(255, 255, 255, 0.9)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
        color: C.dark,
        cursor: "pointer",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
    };

    return (
        <div style={{ position: "sticky", top: "100px" }}>
            <div style={{ position: "relative", borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 60px rgba(74,55,40,0.15)", border: `1px solid ${C.border}` }}>

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
                    {canInteract && (
                        <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 10, display: "flex", gap: "8px" }}>
                            <button
                                type="button"
                                onClick={handleToggleSave}
                                disabled={savingToggle}
                                aria-label={saved ? "Remove from saved mentors" : "Save mentor"}
                                title={saved ? "Saved" : "Save mentor"}
                                style={{ ...iconBtnStyle, opacity: savingToggle ? 0.6 : 1 }}
                            >
                                <Bookmark size={18} fill={saved ? C.dark : "none"} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setReportOpen(true)}
                                aria-label="Report mentor"
                                title="Report mentor"
                                style={iconBtnStyle}
                            >
                                <Flag size={18} />
                            </button>
                        </div>
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
                                <div style={{ position: "absolute", bottom: "2px", right: "2px", width: "24px", height: "24px", borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", border: "2px solid #fff" }}>&#10003;</div>
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

                    {domains.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px", marginTop: "8px" }}>
                            {domains.map((d) => (
                                <span
                                    key={d}
                                    style={{ padding: "3px 10px", borderRadius: "20px", background: C.border, color: C.dark, fontSize: "11px", fontWeight: 700 }}
                                >
                                    {d}
                                </span>
                            ))}
                        </div>
                    )}

                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", background: C.border, fontSize: "12px", color: C.dark, marginBottom: "20px", marginTop: "10px" }}>
                        <Briefcase /> {experience}
                    </div>

                    {typeof totalSessions === "number" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px", marginBottom: "18px" }}>
                            <div style={{ borderRadius: "12px", padding: "12px", background: C.surface, border: `1px solid ${C.border}` }}>
                                <div style={{ fontSize: "15px", fontWeight: "bold", color: C.dark }}>{totalSessions}</div>
                                <div style={{ fontSize: "11px", color: C.mid }}>Total Sessions</div>
                            </div>
                        </div>
                    )}

                    {isOwner && (
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
                    )}

                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
                        <SocialLinkTile href={mentorData?.socialProof?.linkedinUrl} type="linkedin" variant="iconOnly" />
                        <SocialLinkTile href={mentorData?.socialProof?.githubUrl} type="github" variant="iconOnly" />
                        <SocialLinkTile href={mentorData?.socialProof?.twitterUrl} type="twitter" variant="iconOnly" />
                        <SocialLinkTile href={mentorData?.socialProof?.leetcodeUrl} type="leetcode" variant="iconOnly" />
                        <SocialLinkTile href={mentorData?.socialProof?.portfolioUrl} type="portfolio" variant="iconOnly" />
                        <SocialLinkTile href={mentorData?.socialProof?.websiteUrl} type="website" variant="iconOnly" />
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
                        <p
                            ref={aboutRef}
                            style={{
                                fontSize: "13px",
                                color: C.mid,
                                lineHeight: "1.6",
                                whiteSpace: "pre-line",
                                overflowWrap: "anywhere",
                                ...aboutClampStyle,
                            }}
                        >
                            {about}
                        </p>
                        {(aboutClamped || aboutExpanded) && (
                            <button
                                type="button"
                                onClick={() => setAboutExpanded((v) => !v)}
                                style={{
                                    marginTop: "6px",
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    color: C.dark,
                                    fontWeight: 700,
                                    fontSize: "12px",
                                    cursor: "pointer",
                                }}
                            >
                                {aboutExpanded ? "See less" : "See more"}
                            </button>
                        )}
                    </div>

                    <div style={{ textAlign: "left", marginBottom: hasEducation ? "20px" : 0 }}>
                        <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "12px" }}>Work Experience</h3>

                        {/* Current Role (if specified) */}
                        {currentRole && currentRole !== "Not specified" && (
                            <div style={{ borderRadius: "12px", padding: "14px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <CompanyLogo
                                        src={mentorData?.companyLogo || sortedRoles.find((r: any) => r.isCurrent)?.companyLogo}
                                        companyName={mentorData?.company || currentRole}
                                        size={28}
                                    />
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div
                                            title={`${currentRole}${mentorData?.company ? ` at ${mentorData.company}` : ""}`}
                                            style={{ fontWeight: "bold", color: C.dark, fontSize: "13px", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                        >
                                            {currentRole}
                                        </div>
                                        {mentorData?.company && (
                                            <div style={{ color: C.mid, fontSize: "12px", fontWeight: 600, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {mentorData.company}
                                            </div>
                                        )}
                                        <div style={{ fontSize: "11px", color: C.mid }}>Present</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {sortedRoles.length > 0 ? (
                            sortedRoles.map((w: any, i: number) => {
                                const durationLabel = formatRoleDuration(w);
                                return (
                                    <div key={i} style={{ borderRadius: "12px", padding: "14px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: "10px" }}>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                            <CompanyLogo src={w.companyLogo} companyName={w.company} size={28} />
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div
                                                    title={`${w.title || w.position || "Role"} at ${w.company}`}
                                                    style={{ fontWeight: "bold", color: C.dark, fontSize: "13px", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                                >
                                                    {w.title || w.position}
                                                </div>
                                                <div style={{ color: C.mid, fontSize: "12px", fontWeight: 600, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {w.company}
                                                </div>
                                                {w.employmentType && (
                                                    <span style={{ display: "inline-block", fontSize: "10px", padding: "1px 6px", borderRadius: "4px", background: C.border, color: C.dark, fontWeight: 600, marginBottom: "4px" }}>
                                                        {w.employmentType}
                                                    </span>
                                                )}
                                                {w.location && <div style={{ fontSize: "11px", color: C.mid, marginBottom: "2px" }}>{w.location}</div>}
                                                {durationLabel && <div style={{ fontSize: "11px", color: C.mid, marginBottom: "6px" }}>{durationLabel}</div>}
                                                {w.description && <div style={{ fontSize: "12px", color: C.dark, lineHeight: "1.5" }}>{w.description}</div>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : !currentRole || currentRole === "Not specified" ? (
                            <p style={{ fontSize: "12px", color: C.mid }}>No previous work experience added yet.</p>
                        ) : null}
                    </div>

                    {hasEducation && (
                        <div style={{ textAlign: "left" }}>
                            <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "12px" }}>Education</h3>
                            <div style={{ borderRadius: "12px", padding: "14px", background: C.surface, border: `1px solid ${C.border}` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: C.border, color: C.dark, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <GraduationCap size={16} />
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        {college && (
                                            <div style={{ fontWeight: "bold", color: C.dark, fontSize: "13px", marginBottom: "2px", overflowWrap: "anywhere" }}>
                                                {college}
                                            </div>
                                        )}
                                        {educationLine && (
                                            <div style={{ color: C.mid, fontSize: "12px", fontWeight: 600, overflowWrap: "anywhere" }}>
                                                {educationLine}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {reportOpen && (
                <div
                    onClick={closeReport}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(30,20,10,0.55)",
                        backdropFilter: "blur(4px)",
                        WebkitBackdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: "16px",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: C.surface,
                            borderRadius: "20px",
                            maxWidth: "440px",
                            width: "100%",
                            padding: "22px",
                            border: `1px solid ${C.border}`,
                            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                            textAlign: "left",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                            <h3 style={{ fontSize: "17px", fontWeight: 700, color: C.dark, margin: 0 }}>Report mentor</h3>
                            <button
                                type="button"
                                onClick={closeReport}
                                aria-label="Close"
                                style={{ background: "none", border: "none", cursor: "pointer", color: C.mid, padding: "4px" }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p style={{ fontSize: "12.5px", color: C.mid, marginBottom: "14px", lineHeight: 1.5 }}>
                            Tell us what is wrong with this profile. Our team will review it.
                        </p>

                        {reportSuccess ? (
                            <div style={{ padding: "12px 14px", borderRadius: "10px", background: "#dcfce7", color: "#15803d", fontSize: "13px", fontWeight: 600 }}>
                                Report submitted. Thank you.
                            </div>
                        ) : (
                            <>
                                <textarea
                                    rows={4}
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    disabled={reportSubmitting}
                                    placeholder="Describe the issue (minimum 10 characters)"
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "10px",
                                        border: `1px solid ${C.border}`,
                                        background: C.bg,
                                        color: C.dark,
                                        fontSize: "13px",
                                        resize: "none",
                                        outline: "none",
                                    }}
                                />
                                {reportError && (
                                    <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "8px", background: "#fee2e2", color: "#dc2626", fontSize: "12.5px", fontWeight: 600 }}>
                                        {reportError}
                                    </div>
                                )}
                                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                                    <button
                                        type="button"
                                        onClick={closeReport}
                                        disabled={reportSubmitting}
                                        style={{ flex: 1, padding: "11px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, background: C.border, color: C.dark, border: "none", cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmitReport}
                                        disabled={reportSubmitting}
                                        style={{ flex: 1, padding: "11px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, background: "#dc2626", color: "#fff", border: "none", cursor: reportSubmitting ? "not-allowed" : "pointer", opacity: reportSubmitting ? 0.6 : 1 }}
                                    >
                                        {reportSubmitting ? "Submitting..." : "Submit report"}
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