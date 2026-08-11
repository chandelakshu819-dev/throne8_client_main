"use client";

import React, { useRef, useState } from "react";
import { Camera, Star, Briefcase } from "./Icons";
import { MENTOR, C } from "../types/data";

interface MentorSidebarProps {
    mentorData: any;
}

const MentorSidebar: React.FC<MentorSidebarProps> = ({ mentorData }) => {
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);

    const name = mentorData ? `${mentorData.user.firstName} ${mentorData.user.lastName}` : MENTOR.name;
    const rating = mentorData?.stats?.averageRating || MENTOR.rating;
    const title = mentorData?.title || MENTOR.title;
    const experience = mentorData?.experience?.total ? `${mentorData.experience.total} years of Experience` : MENTOR.experience;
    const about = mentorData?.bio || MENTOR.about;
    const image = mentorData?.profilePic || MENTOR.image;
    const verified = mentorData?.verification?.isVerified ?? MENTOR.verified;
    const totalSessions = mentorData?.stats?.totalSessions ?? MENTOR.totalEngagements;
    const completionRate = mentorData?.stats?.completionRate ? `${mentorData.stats.completionRate}%` : MENTOR.attendance;
    const responseTime = mentorData?.stats?.responseTime ? `< ${mentorData.stats.responseTime} hrs` : MENTOR.responseTime;
    const successRate = mentorData?.stats?.completionRate ? `${mentorData.stats.completionRate}%` : MENTOR.successRate;
    const currentRole = mentorData?.experience?.currentRole || MENTOR.title;
    const previousRoles = mentorData?.experience?.previousRoles || [];
    const linkedinUrl = mentorData?.socialProof?.linkedinUrl || "#";
    const skills = mentorData?.skills || [];

    const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setBackgroundImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    return (
        <div style={{ position: "sticky", top: "24px" }}>
            <div style={{ borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 60px rgba(74,55,40,0.15)", border: `1px solid ${C.border}` }}>

                {/* Banner */}
                <div style={{ position: "relative", height: "120px", background: backgroundImage ? `url(${backgroundImage}) center/cover` : C.grad }}>
                    <input type="file" ref={bgInputRef} onChange={handleBgUpload} accept="image/*" style={{ display: "none" }} />
                    <button onClick={() => bgInputRef.current?.click()} style={{ position: "absolute", top: "12px", right: "12px", padding: "8px", borderRadius: "8px", background: "rgba(251,247,243,0.9)", border: `1px solid ${C.border}`, cursor: "pointer" }}>
                        <Camera />
                    </button>
                    <div style={{ position: "absolute", bottom: "-48px", left: "50%", transform: "translateX(-50%)" }}>
                        <div style={{ position: "relative" }}>
                            <img src={image} alt={name} style={{ width: "96px", height: "96px", borderRadius: "50%", border: `4px solid ${C.bg}`, objectFit: "cover" }} />
                            {verified && (
                                <div style={{ position: "absolute", bottom: "2px", right: "2px", width: "24px", height: "24px", borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", border: "2px solid #fff" }}>✓</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body */}
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

                    {/* Stats */}
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

                    {/* Socials */}
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
                        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                            <button style={{ padding: "8px 18px", borderRadius: "8px", background: C.border, border: "none", cursor: "pointer", color: C.dark, fontWeight: "bold" }}>in</button>
                        </a>
                        {mentorData?.socialProof?.githubUrl && (
                            <a href={mentorData.socialProof.githubUrl} target="_blank" rel="noopener noreferrer">
                                <button style={{ padding: "8px 18px", borderRadius: "8px", background: C.border, border: "none", cursor: "pointer", color: C.dark, fontWeight: "bold" }}>GitHub</button>
                            </a>
                        )}
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                        <div style={{ textAlign: "left", marginBottom: "20px" }}>
                            <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "8px" }}>Skills</h3>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {skills.map((skill: string) => (
                                    <span key={skill} style={{ padding: "4px 10px", borderRadius: "20px", background: C.surface, border: `1px solid ${C.border}`, fontSize: "11px", color: C.dark }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* About */}
                    <div style={{ textAlign: "left", marginBottom: "20px" }}>
                        <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "8px" }}>About</h3>
                        <p style={{ fontSize: "13px", color: C.mid, lineHeight: "1.6" }}>{about}</p>
                    </div>

                    {/* Work Experience */}
                    <div style={{ textAlign: "left" }}>
                        <h3 style={{ fontWeight: "bold", color: C.dark, marginBottom: "12px" }}>Work Experience</h3>

                        {/* Current Role */}
                        <div style={{ borderRadius: "12px", padding: "14px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: "10px" }}>
                            <div style={{ fontWeight: "bold", color: C.dark, fontSize: "13px", marginBottom: "2px" }}>{currentRole}</div>
                            <div style={{ fontSize: "11px", color: C.mid }}>📅 Present</div>
                        </div>

                        {/* Previous Roles */}
                        {previousRoles.length > 0 ? (
                            previousRoles.map((w: any, i: number) => (
                                <div key={i} style={{ borderRadius: "12px", padding: "14px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: "10px" }}>
                                    <div style={{ fontWeight: "bold", color: C.dark, fontSize: "13px", marginBottom: "2px" }}>{w.title || w.position}</div>
                                    <div style={{ color: C.mid, fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>{w.company}</div>
                                    {w.location && <div style={{ fontSize: "11px", color: C.mid, marginBottom: "2px" }}>📍 {w.location}</div>}
                                    {w.duration && <div style={{ fontSize: "11px", color: C.mid, marginBottom: "6px" }}>📅 {w.duration}</div>}
                                    {w.description && <div style={{ fontSize: "12px", color: C.dark }}>{w.description}</div>}
                                </div>
                            ))
                        ) : (
                            // fallback dummy data agar previousRoles empty ho
                            MENTOR.workExperience.map((w, i) => (
                                <div key={i} style={{ borderRadius: "12px", padding: "14px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: "10px" }}>
                                    <div style={{ fontWeight: "bold", color: C.dark, fontSize: "13px", marginBottom: "2px" }}>{w.position}</div>
                                    <div style={{ color: C.mid, fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>{w.company}</div>
                                    <div style={{ fontSize: "11px", color: C.mid, marginBottom: "2px" }}>📍 {w.location}</div>
                                    <div style={{ fontSize: "11px", color: C.mid, marginBottom: "6px" }}>📅 {w.duration}</div>
                                    <div style={{ fontSize: "12px", color: C.dark }}>{w.description}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorSidebar;

