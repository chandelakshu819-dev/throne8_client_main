"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
//src/features/mentorship/components/modal/Updateprofilemodal.tsx
import React, { useState, useEffect } from "react";
import {
    X, Save, User, Code2, Globe,
    ChevronDown, Plus, Check, Loader2,
    Link2, Github, Linkedin, AlertCircle,
    Briefcase, Trash2, Clock
} from "lucide-react";
import { api } from "@/lib/api/auth.service";
import config from "@/config/env.config";

// Constants
const DOMAINS_OPTIONS = [
    { value: "web_development", label: "Web Development" },
    { value: "career_guidance", label: "Career Guidance" },
    { value: "interview_prep", label: "Interview Prep" },
    { value: "data_science", label: "Data Science / AI" },
    { value: "product_management", label: "Product Management" },
    { value: "ui_ux_design", label: "Design (UI/UX)" },
    { value: "mobile_development", label: "Mobile Development" },
    { value: "devops", label: "DevOps" },
    { value: "blockchain", label: "Blockchain" },
    { value: "cybersecurity", label: "Cybersecurity" },
];

const EXPERIENCE_OPTIONS = [
    { label: "0–1 Years", value: 1 },
    { label: "1–3 Years", value: 2 },
    { label: "3–5 Years", value: 4 },
    { label: "5–8 Years", value: 6 },
    { label: "8–12 Years", value: 9 },
    { label: "12+ Years", value: 13 },
];

// Common IANA timezones for a simple dropdown
const TIMEZONE_OPTIONS = [
    "UTC",
    "Asia/Kolkata",
    "Asia/Dubai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Europe/London",
    "Europe/Berlin",
    "America/New_York",
    "America/Chicago",
    "America/Los_Angeles",
    "Australia/Sydney",
];

// Suggested languages (user can still type a custom one)
const COMMON_LANGUAGES = ["English", "Hindi", "Spanish", "French", "German", "Mandarin", "Arabic", "Portuguese"];

// Types
interface UpdateProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    mentorData: any;
    mentorId: string;
    onUpdateSuccess: (updated: any) => void;
}

interface PreviousRole {
    title: string;
    company: string;
    duration: string;
}

type TabKey = "basic" | "expertise" | "experience" | "social";

const inputCls =
    "w-full px-4 py-3 rounded-xl border-2 text-sm font-medium text-[#4a3728] outline-none transition-all focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] bg-white border-[#e0d8cf] placeholder:text-[#b0a090]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-bold" style={{ color: "#4a3728" }}>
                {label}
            </label>
            {children}
        </div>
    );
}

// Main Component
export default function UpdateProfileModal({
    isOpen,
    onClose,
    mentorData,
    mentorId,
    onUpdateSuccess,
}: UpdateProfileModalProps) {

    // Form State
    const [title, setTitle] = useState("");
    const [bio, setBio] = useState("");
    const [currentRole, setCurrentRole] = useState("");
    const [experienceTotal, setExperienceTotal] = useState<number>(1);
    const [domains, setDomains] = useState<string[]>([]);
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState("");
    const [domainOpen, setDomainOpen] = useState(false);
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [portfolioUrl, setPortfolioUrl] = useState("");

    // Previous work experience state
    const [previousRoles, setPreviousRoles] = useState<PreviousRole[]>([]);
    const [newRoleTitle, setNewRoleTitle] = useState("");
    const [newRoleCompany, setNewRoleCompany] = useState("");
    const [newRoleDuration, setNewRoleDuration] = useState("");

    // Languages + Timezone state
    const [languages, setLanguages] = useState<string[]>([]);
    const [languageInput, setLanguageInput] = useState("");
    const [timezone, setTimezone] = useState("UTC");

    // UI State
    const [activeTab, setActiveTab] = useState<TabKey>("basic");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Pre-fill on open
    useEffect(() => {
        if (!mentorData || !isOpen) return;
        setTitle(mentorData.title ?? "");
        setBio(mentorData.bio ?? "");
        setCurrentRole(mentorData.experience?.currentRole ?? "");
        setExperienceTotal(mentorData.experience?.total ?? 1);
        setDomains(mentorData.domains ?? []);
        setSkills(mentorData.skills ?? []);
        setLinkedinUrl(mentorData.socialProof?.linkedinUrl ?? "");
        setGithubUrl(mentorData.socialProof?.githubUrl ?? "");
        setPortfolioUrl(mentorData.socialProof?.portfolioUrl ?? "");

        setPreviousRoles(
            (mentorData.experience?.previousRoles ?? []).map((r: any) => ({
                title: r.title || r.position || "",
                company: r.company || "",
                duration: r.duration || "",
            }))
        );
        setNewRoleTitle("");
        setNewRoleCompany("");
        setNewRoleDuration("");

        setLanguages(mentorData.languages ?? ["English"]);
        setLanguageInput("");
        setTimezone(mentorData.availability?.timezone ?? "UTC");

        setActiveTab("basic");
        setError(null);
        setSuccess(false);
        setDomainOpen(false);
    }, [mentorData, isOpen]);

    if (!isOpen) return null;

    // Helpers
    const toggleDomain = (val: string) => {
        setDomains((prev) =>
            prev.includes(val)
                ? prev.filter((d) => d !== val)
                : prev.length < 5
                    ? [...prev, val]
                    : prev
        );
    };

    const addSkill = () => {
        const trimmed = skillInput.trim();
        if (trimmed && !skills.includes(trimmed) && skills.length < 20) {
            setSkills((prev) => [...prev, trimmed]);
            setSkillInput("");
        }
    };

    const addPreviousRole = () => {
        if (!newRoleTitle.trim() || !newRoleCompany.trim() || !newRoleDuration.trim()) return;
        setPreviousRoles((prev) => [
            ...prev,
            { title: newRoleTitle.trim(), company: newRoleCompany.trim(), duration: newRoleDuration.trim() },
        ]);
        setNewRoleTitle("");
        setNewRoleCompany("");
        setNewRoleDuration("");
    };

    const removePreviousRole = (index: number) => {
        setPreviousRoles((prev) => prev.filter((_, i) => i !== index));
    };

    const addLanguage = (lang?: string) => {
        const val = (lang ?? languageInput).trim();
        if (val && !languages.includes(val)) {
            setLanguages((prev) => [...prev, val]);
        }
        setLanguageInput("");
    };

    const removeLanguage = (lang: string) => {
        setLanguages((prev) => prev.filter((l) => l !== lang));
    };

    const goToTab = (direction: 1 | -1) => {
        const order: TabKey[] = ["basic", "expertise", "experience", "social"];
        const idx = order.indexOf(activeTab);
        const next = order[idx + direction];
        if (next) setActiveTab(next);
    };

    // Submit
    const handleSubmit = async () => {
        setError(null);

        if (!title.trim()) { setError("Title is required."); setActiveTab("basic"); return; }
        if (!bio.trim() || bio.length < 50) { setError("Bio must be at least 50 characters."); setActiveTab("basic"); return; }
        if (domains.length === 0) { setError("Select at least 1 domain."); setActiveTab("expertise"); return; }
        if (skills.length === 0) { setError("Add at least 1 skill."); setActiveTab("expertise"); return; }
        if (languages.length === 0) { setError("Add at least 1 language."); setActiveTab("experience"); return; }

        setSaving(true);
        try {
            const payload = {
                title,
                bio,
                domains,
                skills,
                languages,
                experience: {
                    total: experienceTotal,
                    currentRole,
                    previousRoles,
                },
                availability: {
                    timezone,
                },
                socialProof: {
                    linkedinUrl,
                    ...(githubUrl && { githubUrl }),
                    ...(portfolioUrl && { portfolioUrl }),
                },
            };

            const { data } = await api.put(
                `${config.NEXT_PUBLIC_MENTOR_BY_ID_ENDPOINT || process.env.NEXT_PUBLIC_MENTOR_BY_ID_ENDPOINT}/${mentorId}`,
                payload
            );

            setSuccess(true);
            setTimeout(() => {
                onUpdateSuccess(data.data);
                onClose();
            }, 1200);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Update failed. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
        { key: "basic", label: "Basic Info", icon: <User className="w-4 h-4" /> },
        { key: "expertise", label: "Expertise", icon: <Code2 className="w-4 h-4" /> },
        { key: "experience", label: "Experience", icon: <Briefcase className="w-4 h-4" /> },
        { key: "social", label: "Social Links", icon: <Globe className="w-4 h-4" /> },
    ];

    return (
        <div
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
                style={{ backgroundColor: "#fdf9f6" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="relative px-8 pt-8 pb-0 flex-shrink-0 overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #4a3728 0%, #7a5c3e 100%)" }}
                >
                    <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-white/10" />
                    <div className="absolute bottom-0 -left-4 w-20 h-20 rounded-full bg-white/5" />

                    <div className="relative flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Update Profile</h2>
                            <p className="text-white/65 text-sm mt-1">All fields are pre-filled from your current profile</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all mt-0.5"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="relative flex gap-1 bg-white/10 p-1 rounded-t-2xl">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === tab.key
                                        ? "bg-white text-[#4a3728] shadow"
                                        : "text-white/65 hover:text-white"
                                    }`}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

                    {/* Error / Success */}
                    {error && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-200">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-50 border border-green-200">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <p className="text-sm text-green-700 font-medium">Profile updated successfully! Closing...</p>
                        </div>
                    )}

                    {/* TAB: Basic Info */}
                    {activeTab === "basic" && (
                        <div className="space-y-5">
                            <Field label="Mentor Title *">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Senior Full Stack Developer & Mentor"
                                    className={inputCls}
                                />
                            </Field>

                            <Field label="Current Role *">
                                <input
                                    type="text"
                                    value={currentRole}
                                    onChange={(e) => setCurrentRole(e.target.value)}
                                    placeholder="e.g. Backend and Technical Engineer"
                                    className={inputCls}
                                />
                            </Field>

                            <Field label="Years of Experience *">
                                <select
                                    value={experienceTotal}
                                    onChange={(e) => setExperienceTotal(Number(e.target.value))}
                                    className={inputCls}
                                >
                                    {EXPERIENCE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label={`Bio / About You * — ${bio.length} chars (min 50)`}>
                                <textarea
                                    rows={5}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about your journey, expertise, and what you love to mentor..."
                                    className={`${inputCls} resize-none`}
                                />
                                {bio.length > 0 && bio.length < 50 && (
                                    <p className="text-xs text-amber-600 mt-1">{50 - bio.length} more characters needed</p>
                                )}
                            </Field>
                        </div>
                    )}

                    {/* TAB: Expertise */}
                    {activeTab === "expertise" && (
                        <div className="space-y-5">
                            <Field label={`Domains * — ${domains.length}/5 selected`}>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setDomainOpen((p) => !p)}
                                        className={`${inputCls} flex items-center justify-between`}
                                    >
                                        <span className={domains.length ? "text-[#4a3728]" : "text-[#b0a090]"}>
                                            {domains.length
                                                ? `${domains.length} domain${domains.length > 1 ? "s" : ""} selected`
                                                : "Click to select domains"}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-[#7a5c3e] transition-transform ${domainOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {domainOpen && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-[#e0d8cf] rounded-2xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                                            {DOMAINS_OPTIONS.map((d) => {
                                                const selected = domains.includes(d.value);
                                                const disabled = !selected && domains.length >= 5;
                                                return (
                                                    <button
                                                        key={d.value}
                                                        type="button"
                                                        disabled={disabled}
                                                        onClick={() => toggleDomain(d.value)}
                                                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${selected ? "bg-[#f8f4f0] text-[#4a3728] font-semibold" : "text-slate-600 hover:bg-[#fdf9f6]"
                                                            } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                                                    >
                                                        {d.label}
                                                        {selected && <Check className="w-4 h-4 text-[#4a3728]" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {domains.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {domains.map((d) => {
                                            const label = DOMAINS_OPTIONS.find((o) => o.value === d)?.label ?? d;
                                            return (
                                                <span key={d} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#4a3728" }}>
                                                    {label}
                                                    <button type="button" onClick={() => toggleDomain(d)} className="hover:text-red-300 ml-0.5">×</button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </Field>

                            <Field label={`Skills * — ${skills.length}/20 (press Enter or + to add)`}>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                                        placeholder="Type a skill and press Enter..."
                                        className={`${inputCls} flex-1`}
                                    />
                                    <button
                                        type="button"
                                        onClick={addSkill}
                                        className="px-4 py-3 rounded-xl text-white font-bold transition-all hover:opacity-90 flex-shrink-0"
                                        style={{ backgroundColor: "#4a3728" }}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {skills.map((skill) => (
                                            <span key={skill} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: "#4a3728" }}>
                                                {skill}
                                                <button type="button" onClick={() => setSkills((p) => p.filter((s) => s !== skill))} className="hover:text-red-300 ml-0.5">×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </Field>
                        </div>
                    )}

                    {/* TAB: Experience (Previous Work Experience + Languages + Timezone) */}
                    {activeTab === "experience" && (
                        <div className="space-y-6">
                            {/* Previous Work Experience */}
                            <Field label={`Previous Work Experience (${previousRoles.length})`}>
                                <div className="space-y-2 mb-3">
                                    {previousRoles.length === 0 && (
                                        <p className="text-xs text-[#8a7a6a]">No previous roles added yet. Add one below.</p>
                                    )}
                                    {previousRoles.map((role, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: "#fbf7f3", borderColor: "#e0d8cf" }}>
                                            <div>
                                                <p className="text-sm font-bold" style={{ color: "#4a3728" }}>{role.title}</p>
                                                <p className="text-xs" style={{ color: "#7a5c3e" }}>{role.company} · {role.duration}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removePreviousRole(i)}
                                                className="p-2 rounded-lg hover:bg-red-50 text-red-500 flex-shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: "#fff", borderColor: "#e0d8cf" }}>
                                    <p className="text-xs font-bold" style={{ color: "#7a5c3e" }}>Add a role</p>
                                    <input
                                        type="text"
                                        value={newRoleTitle}
                                        onChange={(e) => setNewRoleTitle(e.target.value)}
                                        placeholder="Job title (e.g. Software Engineer)"
                                        className={inputCls}
                                    />
                                    <input
                                        type="text"
                                        value={newRoleCompany}
                                        onChange={(e) => setNewRoleCompany(e.target.value)}
                                        placeholder="Company (e.g. Acme Corp)"
                                        className={inputCls}
                                    />
                                    <input
                                        type="text"
                                        value={newRoleDuration}
                                        onChange={(e) => setNewRoleDuration(e.target.value)}
                                        placeholder="Duration (e.g. Jan 2020 - Mar 2022)"
                                        className={inputCls}
                                    />
                                    <button
                                        type="button"
                                        onClick={addPreviousRole}
                                        disabled={!newRoleTitle.trim() || !newRoleCompany.trim() || !newRoleDuration.trim()}
                                        className="w-full py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: "#4a3728" }}
                                    >
                                        <Plus className="w-4 h-4" /> Add Role
                                    </button>
                                </div>
                            </Field>

                            {/* Languages */}
                            <Field label={`Languages Spoken * — ${languages.length} added`}>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={languageInput}
                                        onChange={(e) => setLanguageInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLanguage(); } }}
                                        placeholder="Type a language and press Enter..."
                                        className={`${inputCls} flex-1`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addLanguage()}
                                        className="px-4 py-3 rounded-xl text-white font-bold flex-shrink-0"
                                        style={{ backgroundColor: "#4a3728" }}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Quick-add suggestions */}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {COMMON_LANGUAGES.filter((l) => !languages.includes(l)).map((l) => (
                                        <button
                                            key={l}
                                            type="button"
                                            onClick={() => addLanguage(l)}
                                            className="px-2.5 py-1 rounded-full text-xs font-semibold border"
                                            style={{ borderColor: "#e0d8cf", color: "#7a5c3e" }}
                                        >
                                            + {l}
                                        </button>
                                    ))}
                                </div>

                                {languages.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {languages.map((lang) => (
                                            <span key={lang} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: "#4a3728" }}>
                                                {lang}
                                                <button type="button" onClick={() => removeLanguage(lang)} className="hover:text-red-300 ml-0.5">×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </Field>

                            {/* Timezone */}
                            <Field label="Timezone *">
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a5c3e] pointer-events-none" />
                                    <select
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className={`${inputCls} pl-10`}
                                    >
                                        {TIMEZONE_OPTIONS.map((tz) => (
                                            <option key={tz} value={tz}>{tz}</option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-xs text-[#8a7a6a] mt-1">This helps mentees know when you&apos;re typically available.</p>
                            </Field>
                        </div>
                    )}

                    {/* TAB: Social Links */}
                    {activeTab === "social" && (
                        <div className="space-y-5">
                            <Field label="LinkedIn URL *">
                                <div className="relative">
                                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                                    <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" className={`${inputCls} pl-10`} />
                                </div>
                            </Field>

                            <Field label="GitHub URL (optional)">
                                <div className="relative">
                                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                                    <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username" className={`${inputCls} pl-10`} />
                                </div>
                            </Field>

                            <Field label="Portfolio / Website URL (optional)">
                                <div className="relative">
                                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a5c3e]" />
                                    <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://yourportfolio.com" className={`${inputCls} pl-10`} />
                                </div>
                            </Field>

                            {/* Links preview */}
                            <div className="p-4 rounded-2xl border" style={{ backgroundColor: "#fbf7f3", borderColor: "#e0d8cf" }}>
                                <p className="text-xs font-bold text-[#7a5c3e] mb-3 uppercase tracking-wide">Preview</p>
                                <div className="space-y-2">
                                    {[
                                        { icon: <Linkedin className="w-4 h-4 text-blue-600" />, val: linkedinUrl, label: "LinkedIn" },
                                        { icon: <Github className="w-4 h-4 text-gray-700" />, val: githubUrl, label: "GitHub" },
                                        { icon: <Link2 className="w-4 h-4 text-[#7a5c3e]" />, val: portfolioUrl, label: "Portfolio" },
                                    ].map(({ icon, val, label }) => (
                                        <div key={label} className="flex items-center gap-3">
                                            {icon}
                                            <span className="text-sm text-[#4a3728] truncate">
                                                {val || <span className="text-[#c0b0a0] italic text-xs">Not provided</span>}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="flex-shrink-0 px-8 py-4 flex items-center justify-between border-t"
                    style={{ borderColor: "#e0d8cf", backgroundColor: "#fdf9f6" }}
                >
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                        style={{ color: "#7a5c3e", backgroundColor: "#f0ebe6" }}
                    >
                        Cancel
                    </button>

                    <div className="flex items-center gap-2">
                        {activeTab !== "basic" && (
                            <button
                                onClick={() => goToTab(-1)}
                                className="px-4 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all"
                                style={{ borderColor: "#e0d8cf", color: "#7a5c3e" }}
                            >
                                ← Back
                            </button>
                        )}
                        {activeTab !== "social" && (
                            <button
                                onClick={() => goToTab(1)}
                                className="px-5 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all"
                                style={{ borderColor: "#4a3728", color: "#4a3728" }}
                            >
                                Next →
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={saving || success}
                            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                            style={{ backgroundColor: "#4a3728" }}
                        >
                            {saving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                            ) : success ? (
                                <><Check className="w-4 h-4" /> Saved!</>
                            ) : (
                                <><Save className="w-4 h-4" /> Save Changes</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}