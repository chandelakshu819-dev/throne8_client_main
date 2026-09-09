"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    X, Save, User, Code2, Globe,
    ChevronDown, Plus, Check, Loader2,
    Link2, Github, Linkedin, AlertCircle
} from "lucide-react";
import { api } from "@/lib/api/auth.service";
import config from "@/config/env.config";

// ── Constants ────────────────────────────────────────────────
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

// ── Types ────────────────────────────────────────────────────
interface UpdateProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    mentorData: any;
    mentorId: string;
    onUpdateSuccess: (updated: any) => void;
}

type TabKey = "basic" | "expertise" | "social";

const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium text-[#4a3728] outline-none transition-colors focus:border-[#4a3728] bg-white border-[#e0d8cf] placeholder:text-[#b0a090]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold" style={{ color: "#4a3728" }}>
                {label}
            </label>
            {children}
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────
export default function UpdateProfileModal({
    isOpen,
    onClose,
    mentorData,
    mentorId,
    onUpdateSuccess,
}: UpdateProfileModalProps) {

    // ── Form State ───────────────────────────────────────────
    const [title, setTitle] = useState("");
    const [bio, setBio] = useState("");
    const [currentRole, setCurrentRole] = useState("");
    const [experienceTotal, setExperienceTotal] = useState<number>(1);
    const [domains, setDomains] = useState<string[]>([]);
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState("");

    const [domainOpen, setDomainOpen] = useState(false);
    const domainDropdownRef = useRef<HTMLDivElement>(null);

    // Dropdown only closes on an explicit outside click — never on
    // selecting an option, so multiple domains can be picked one by one.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (domainDropdownRef.current && !domainDropdownRef.current.contains(event.target as Node)) {
                setDomainOpen(false);
            }
        };
        if (domainOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [domainOpen]);

    // ✅ FIX: lock background page scroll while the modal is open — this
    // was the cause of the "2 scrollbars" issue (page behind + modal body
    // both scrollable at once).
    useEffect(() => {
        if (isOpen) {
            const original = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = original; };
        }
    }, [isOpen]);

    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [portfolioUrl, setPortfolioUrl] = useState("");

    // ── UI State ─────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<TabKey>("basic");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // ── Pre-fill on open ─────────────────────────────────────
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
        setActiveTab("basic");
        setError(null);
        setSuccess(false);
        setDomainOpen(false);
    }, [mentorData, isOpen]);

    if (!isOpen) return null;

    // ── Helpers ──────────────────────────────────────────────
    // NOTE: this never touches domainOpen — selecting/deselecting a
    // domain must never close the dropdown.
    const toggleDomain = (val: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
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

    const goToTab = (direction: 1 | -1) => {
        const order: TabKey[] = ["basic", "expertise", "social"];
        const idx = order.indexOf(activeTab);
        const next = order[idx + direction];
        if (next) setActiveTab(next);
    };

    // ── Submit ───────────────────────────────────────────────
    const handleSubmit = async () => {
        setError(null);
        if (!title.trim()) { setError("Title is required."); setActiveTab("basic"); return; }
        if (!bio.trim() || bio.length < 50) { setError("Bio must be at least 50 characters."); setActiveTab("basic"); return; }
        if (!currentRole.trim()) { setError("Current role is required."); setActiveTab("basic"); return; }
        if (domains.length === 0) { setError("Select at least 1 domain."); setActiveTab("expertise"); return; }
        if (skills.length === 0) { setError("Add at least 1 skill."); setActiveTab("expertise"); return; }
        if (!linkedinUrl.trim()) { setError("LinkedIn URL is required."); setActiveTab("social"); return; }
        if (!linkedinUrl.includes("linkedin.com")) { setError("Please enter a valid LinkedIn URL."); setActiveTab("social"); return; }
        try {
            new URL(linkedinUrl);
        } catch {
            setError("Please enter a valid LinkedIn URL (must start with https://)."); setActiveTab("social"); return;
        }
        if (githubUrl.trim() && !githubUrl.includes("github.com")) { setError("Please enter a valid GitHub URL."); setActiveTab("social"); return; }

        setSaving(true);
        try {
            const payload = {
                title,
                bio,
                domains,
                skills,
                experience: {
                    total: experienceTotal,
                    currentRole,
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
        { key: "social", label: "Social Links", icon: <Globe className="w-4 h-4" /> },
    ];

    return (
        <div
            className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-xl"
                style={{ backgroundColor: "#fdf9f6" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div
                    className="relative px-6 pt-6 pb-0 flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #4a3728 0%, #6b503a 100%)" }}
                >
                    <div className="relative flex items-start justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-bold text-white">Update Profile</h2>
                            <p className="text-white/60 text-xs mt-1">All fields are pre-filled from your current profile</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors mt-0.5"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="relative flex gap-1 bg-white/10 p-1 rounded-t-xl">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-colors duration-150 ${activeTab === tab.key
                                    ? "bg-white text-[#4a3728]"
                                    : "text-white/60 hover:text-white"
                                    }`}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Scrollable Body — the ONLY scroll container ── */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                    {/* Error / Success */}
                    {error && (
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <p className="text-xs text-red-600 font-medium">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-green-50 border border-green-200">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <p className="text-xs text-green-700 font-medium">Profile updated successfully! Closing...</p>
                        </div>
                    )}

                    {/* ── TAB: Basic Info ── */}
                    {activeTab === "basic" && (
                        <div className="space-y-4">
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
                                    rows={4}
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

                    {/* ── TAB: Expertise ── */}
                    {activeTab === "expertise" && (
                        <div className="space-y-4">
                            <Field label={`Domains * — ${domains.length}/5 selected`}>
                                <div className="relative" ref={domainDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setDomainOpen((p) => !p); }}
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
                                        <div
                                            className="absolute z-50 w-full mt-1 bg-white border border-[#e0d8cf] rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {DOMAINS_OPTIONS.map((d) => {
                                                const selected = domains.includes(d.value);
                                                const disabled = !selected && domains.length >= 5;
                                                return (
                                                    <button
                                                        key={d.value}
                                                        type="button"
                                                        disabled={disabled}
                                                        onClick={(e) => toggleDomain(d.value, e)}
                                                        className={`w-full px-3.5 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${selected ? "bg-[#f3ece4] text-[#4a3728] font-semibold" : "text-slate-600 hover:bg-[#fdf9f6]"
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
                                                <span key={d} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "#4a3728" }}>
                                                    {label}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => toggleDomain(d, e)}
                                                        className="hover:text-red-300 ml-0.5"
                                                    >
                                                        ×
                                                    </button>
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
                                        className="px-3.5 py-2.5 rounded-xl text-white font-bold transition-opacity hover:opacity-90 flex-shrink-0"
                                        style={{ backgroundColor: "#4a3728" }}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {skills.map((skill) => (
                                            <span key={skill} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: "#4a3728" }}>
                                                {skill}
                                                <button type="button" onClick={() => setSkills((p) => p.filter((s) => s !== skill))} className="hover:text-red-300 ml-0.5">×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </Field>
                        </div>
                    )}

                    {/* ── TAB: Social Links ── */}
                    {activeTab === "social" && (
                        <div className="space-y-4">
                            <Field label="LinkedIn URL *">
                                <div className="relative">
                                    <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                                    <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" className={`${inputCls} pl-9`} />
                                </div>
                            </Field>

                            <Field label="GitHub URL (optional)">
                                <div className="relative">
                                    <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                                    <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username" className={`${inputCls} pl-9`} />
                                </div>
                            </Field>

                            <Field label="Portfolio / Website URL (optional)">
                                <div className="relative">
                                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a5c3e]" />
                                    <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://yourportfolio.com" className={`${inputCls} pl-9`} />
                                </div>
                            </Field>

                            {/* Links preview */}
                            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: "#fbf7f3", borderColor: "#e0d8cf" }}>
                                <p className="text-[11px] font-bold text-[#7a5c3e] mb-2.5 uppercase tracking-wide">Preview</p>
                                <div className="space-y-2">
                                    {[
                                        { icon: <Linkedin className="w-4 h-4 text-blue-600" />, val: linkedinUrl, label: "LinkedIn" },
                                        { icon: <Github className="w-4 h-4 text-gray-700" />, val: githubUrl, label: "GitHub" },
                                        { icon: <Link2 className="w-4 h-4 text-[#7a5c3e]" />, val: portfolioUrl, label: "Portfolio" },
                                    ].map(({ icon, val, label }) => (
                                        <div key={label} className="flex items-center gap-2.5">
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

                {/* ── Footer ── */}
                <div
                    className="flex-shrink-0 px-6 py-3.5 flex items-center justify-between border-t"
                    style={{ borderColor: "#e0d8cf", backgroundColor: "#fdf9f6" }}
                >
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl font-semibold text-sm transition-colors hover:bg-[#f0ebe6]"
                        style={{ color: "#7a5c3e", backgroundColor: "#f5f0ea" }}
                    >
                        Cancel
                    </button>

                    <div className="flex items-center gap-2">
                        {activeTab !== "basic" && (
                            <button
                                onClick={() => goToTab(-1)}
                                className="px-3.5 py-2 rounded-xl font-semibold text-sm border transition-colors hover:bg-[#f3ece4]"
                                style={{ borderColor: "#e0d8cf", color: "#7a5c3e" }}
                            >
                                ← Back
                            </button>
                        )}
                        {activeTab !== "social" && (
                            <button
                                onClick={() => goToTab(1)}
                                className="px-4 py-2 rounded-xl font-semibold text-sm border transition-colors hover:bg-[#f3ece4]"
                                style={{ borderColor: "#4a3728", color: "#4a3728" }}
                            >
                                Next →
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={saving || success}
                            className="px-5 py-2 rounded-xl font-semibold text-sm text-white flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
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