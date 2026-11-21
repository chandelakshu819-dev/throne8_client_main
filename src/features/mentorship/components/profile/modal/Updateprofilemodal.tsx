"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    X, Save, Code2, Globe,
    ChevronDown, Plus, Check, Loader2,
    Link2, Github, Linkedin, AlertCircle, Briefcase
} from "lucide-react";
import { api } from "@/lib/api/auth.service";
import config from "@/config/env.config";
import SkillsInput from "../../shared/SkillsInput";
import ExperienceEditor, {
    cleanRolesForSave, type ExperienceRole,
    EMPLOYMENT_TYPES, LOCATION_TYPES, MONTHS, YEARS, CURRENT_YM, DESC_MAX, splitYM, joinYM,
} from "../../shared/ExperienceEditor";
import { splitSkills } from "@/shared/utils/mentorFormat";
import CompanyAutocomplete from "../../shared/CompanyAutocomplete";
import type { CompanyRef } from "../../../services/company.service";

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
    initialTab?: string;
}

type TabKey = "experience" | "expertise" | "social";

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
    initialTab,
}: UpdateProfileModalProps) {

    // ── Form State ───────────────────────────────────────────
    const [title, setTitle] = useState("");
    const [bio, setBio] = useState("");
    const [currentRole, setCurrentRole] = useState("");
    const [companyText, setCompanyText] = useState("");
    const [selectedCompany, setSelectedCompany] = useState<CompanyRef | null>(null);
    const [experienceTotal, setExperienceTotal] = useState<number>(1);
    // Current role (LinkedIn-style) — saved as an isCurrent entry in experience.previousRoles
    const [curIsCurrent, setCurIsCurrent] = useState(true);
    const [curEmploymentType, setCurEmploymentType] = useState("");
    const [curLocation, setCurLocation] = useState("");
    const [curLocationType, setCurLocationType] = useState("");
    const [curStartMonth, setCurStartMonth] = useState("");
    const [curStartYear, setCurStartYear] = useState("");
    const [curEndMonth, setCurEndMonth] = useState("");
    const [curEndYear, setCurEndYear] = useState("");
    const [curDescription, setCurDescription] = useState("");
    const [curLogo, setCurLogo] = useState<string | undefined>(undefined);
    const [domains, setDomains] = useState<string[]>([]);
    const [skills, setSkills] = useState<string[]>([]);
    const [previousRoles, setPreviousRoles] = useState<ExperienceRole[]>([]);
    const [experienceFormOpen, setExperienceFormOpen] = useState(false);

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
    const validTabs: TabKey[] = ["experience", "expertise", "social"];
    // "basic" (old Basic Info tab) now lives inside the Experience tab
    const resolveTab = (t?: string): TabKey =>
        t === "basic" ? "experience" : (t && validTabs.includes(t as TabKey)) ? (t as TabKey) : "experience";
    const resolvedInitialTab: TabKey = resolveTab(initialTab);
    const [activeTab, setActiveTab] = useState<TabKey>(resolvedInitialTab);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // which date field group to highlight when validation fails ("start" | "end")
    const [dateError, setDateError] = useState<"start" | "end" | null>(null);
    const startDateRef = useRef<HTMLDivElement>(null);
    const endDateRef = useRef<HTMLDivElement>(null);
    const [success, setSuccess] = useState(false);

    // ── Pre-fill on open ─────────────────────────────────────
    useEffect(() => {
        if (!mentorData || !isOpen) return;
        setTitle(mentorData.title ?? "");
        setBio(mentorData.bio ?? "");
        setCurrentRole(mentorData.experience?.currentRole ?? "");
        setCompanyText(mentorData.companyRef?.name ?? (typeof mentorData.company === "string" ? mentorData.company : "") ?? "");
        setSelectedCompany(mentorData.companyRef?.id ? mentorData.companyRef : null);
        setExperienceTotal(mentorData.experience?.total ?? 1);
        setDomains(mentorData.domains ?? []);
        // old data may hold "HTML,CSS, JS," as ONE string -> split into separate skills
        setSkills(splitSkills(mentorData.skills ?? []));
        const allRoles: ExperienceRole[] = (mentorData.experience?.previousRoles ?? []).map((r: any) => ({
            title: r.title || r.position || "",
            company: r.company || "",
            employmentType: r.employmentType || undefined,
            location: r.location || undefined,
            locationType: r.locationType || undefined,
            startDate: r.startDate || undefined,
            endDate: r.endDate || undefined,
            isCurrent: Boolean(r.isCurrent),
            description: r.description || undefined,
            companyLogo: r.companyLogo || undefined,
            duration: r.duration || undefined,
        }));
        // The current role is the isCurrent entry that matches experience.currentRole (else the first isCurrent one)
        const curTitle = (mentorData.experience?.currentRole ?? "").trim().toLowerCase();
        let curIdx = allRoles.findIndex((r) => r.isCurrent && r.title.trim().toLowerCase() === curTitle);
        if (curIdx < 0) curIdx = allRoles.findIndex((r) => r.isCurrent);
        const cur = curIdx >= 0 ? allRoles[curIdx] : undefined;
        const st = splitYM(cur?.startDate);
        const en = splitYM(cur?.endDate);
        setCurIsCurrent(true);
        setCurEmploymentType(cur?.employmentType ?? "");
        setCurLocation(cur?.location ?? "");
        setCurLocationType(cur?.locationType ?? "");
        setCurStartMonth(st.m);
        setCurStartYear(st.y);
        setCurEndMonth(en.m);
        setCurEndYear(en.y);
        setCurDescription(cur?.description ?? "");
        setCurLogo(cur?.companyLogo);
        setPreviousRoles(allRoles.filter((_, i) => i !== curIdx));
        setExperienceFormOpen(false);
        setLinkedinUrl(mentorData.socialProof?.linkedinUrl ?? "");
        setGithubUrl(mentorData.socialProof?.githubUrl ?? "");
        setPortfolioUrl(mentorData.socialProof?.portfolioUrl ?? "");
        setActiveTab(resolveTab(initialTab));
        setError(null);
        setSuccess(false);
        setDomainOpen(false);
    }, [mentorData, isOpen, initialTab]);

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


    const goToTab = (direction: 1 | -1) => {
        const order: TabKey[] = ["experience", "expertise", "social"];
        const idx = order.indexOf(activeTab);
        const next = order[idx + direction];
        if (next) setActiveTab(next);
    };

    // ── Submit ───────────────────────────────────────────────
    const handleSubmit = async () => {
        setError(null);
        const companyName = (selectedCompany?.name || companyText).trim();
        const curStartDate = joinYM(curStartYear, curStartMonth);
        const curEndDate = joinYM(curEndYear, curEndMonth);
        setDateError(null);
        const fail = (msg: string, tab: TabKey) => { setError(msg); setActiveTab(tab); };
        // Highlight the date fields, scroll them into view and focus the first empty dropdown,
        // so the user sees exactly what is missing even when the form is scrolled far away.
        const failDate = (msg: string, which: "start" | "end") => {
            fail(msg, "experience");
            setDateError(which);
            requestAnimationFrame(() => {
                const box = (which === "start" ? startDateRef : endDateRef).current;
                if (!box) return;
                box.scrollIntoView({ behavior: "smooth", block: "center" });
                const selects = Array.from(box.querySelectorAll("select"));
                (selects.find((el) => !el.value) ?? selects[0])?.focus({ preventScroll: true });
            });
        };

        if (!title.trim()) return fail("Title is required.", "experience");
        if (!bio.trim() || bio.length < 50) return fail("Bio must be at least 50 characters.", "experience");
        if (!currentRole.trim()) return fail("Current role is required.", "experience");
        if (!companyName) return fail("Company is required for your current role.", "experience");
        if (!curStartDate) return failDate("Start date is required: select both the start month and the start year.", "start");
        if (curStartDate > CURRENT_YM) return failDate("Start date can't be in the future.", "start");
        if (!curIsCurrent) {
            if (!curEndDate) return failDate("Select an end month and year, or tick \"I am currently working in this role\".", "end");
            if (curEndDate < curStartDate) return failDate("End date can't be before the start date.", "end");
            if (curEndDate > CURRENT_YM) return failDate("End date can't be in the future.", "end");
        }
        if (curLocation.trim().length > 100) return fail("Location can't exceed 100 characters.", "experience");
        if (curDescription.length > DESC_MAX) return fail(`Highlights can't exceed ${DESC_MAX} characters.`, "experience");
        if (domains.length === 0) { setError("Select at least 1 domain."); setActiveTab("expertise"); return; }
        if (skills.length === 0) { setError("Add at least 1 skill."); setActiveTab("expertise"); return; }
        if (experienceFormOpen) { setError("Finish or cancel the experience you are editing first."); setActiveTab("experience"); return; }
        if (!linkedinUrl.trim()) { setError("LinkedIn URL is required."); setActiveTab("social"); return; }
        if (!linkedinUrl.includes("linkedin.com")) { setError("Please enter a valid LinkedIn URL."); setActiveTab("social"); return; }
        if (!/^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/(in|pub)\/[^\s/?#]+\/?([?#]\S*)?$/i.test(linkedinUrl.trim())) { setError("Please enter your LinkedIn profile URL (e.g. https://www.linkedin.com/in/username), not the LinkedIn feed or home page."); setActiveTab("social"); return; }
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
                skills: splitSkills(skills),
                experience: {
                    total: experienceTotal,
                    currentRole,
                    // current role first (isCurrent entry), then past roles
                    previousRoles: cleanRolesForSave([
                        {
                            title: currentRole.trim(),
                            company: companyName,
                            employmentType: curEmploymentType || undefined,
                            location: curLocation.trim() || undefined,
                            locationType: curLocationType || undefined,
                            startDate: curStartDate,
                            endDate: curIsCurrent ? undefined : curEndDate,
                            isCurrent: curIsCurrent,
                            description: curDescription.trim() || undefined,
                            companyLogo: curLogo,
                        },
                        ...previousRoles,
                    ]),
                },
                // Only sent when the mentor picked a company from the list (backend keeps legacy text in sync)
                ...(selectedCompany?.id &&
                    selectedCompany.id !== mentorData?.companyRef?.id && {
                        mentorCompanyId: selectedCompany.id,
                        company: selectedCompany.name,
                    }),
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
        { key: "experience", label: "Experience", icon: <Briefcase className="w-4 h-4" /> },
        { key: "expertise", label: "Expertise", icon: <Code2 className="w-4 h-4" /> },
        { key: "social", label: "Social Links", icon: <Globe className="w-4 h-4" /> },
    ];

    return (
        <div
            className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-xl"
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
                    <div className="relative flex gap-1 bg-white/10 p-1 rounded-t-xl overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap py-2 px-2 rounded-lg text-[13px] font-semibold transition-colors duration-150 ${activeTab === tab.key
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
                        <div
                            role="alert"
                            className="sticky top-0 z-20 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 shadow-md"
                        >
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

                    {/* ── TAB: Experience (headline + current role + past roles) ── */}
                    {activeTab === "experience" && (
                        <div className="space-y-6">
                            {/* Headline & about */}
                            <section className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold" style={{ color: "#4a3728" }}>Headline &amp; about</h3>
                                    <p className="text-xs text-[#75665a] mt-0.5">This is the first thing mentees see on your profile.</p>
                                </div>
                                <Field label="Mentor Title *">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Senior Full Stack Developer & Mentor"
                                        className={inputCls}
                                    />
                                </Field>

                                <Field label="Total Years of Experience *">
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
                            </section>

                            {/* Current role */}
                            <section className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold" style={{ color: "#4a3728" }}>Current role</h3>
                                        <p className="text-xs text-[#75665a] mt-0.5">Shown at the top of your Experience on the profile.</p>
                                    </div>
                                    {curIsCurrent && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: "#4a3728" }}>Present</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Current Role / Job title *">
                                        <input
                                            type="text"
                                            value={currentRole}
                                            onChange={(e) => setCurrentRole(e.target.value)}
                                            placeholder="e.g. Backend and Technical Engineer"
                                            maxLength={100}
                                            className={inputCls}
                                        />
                                    </Field>
                                    <Field label="Employment type">
                                        <select value={curEmploymentType} onChange={(e) => setCurEmploymentType(e.target.value)} className={inputCls}>
                                            <option value="">Select type</option>
                                            {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </Field>
                                </div>

                                <Field label="Company *">
                                    <CompanyAutocomplete
                                        value={companyText}
                                        selected={selectedCompany}
                                        onTextChange={(v) => {
                                            setSelectedCompany(null);
                                            setCompanyText(v);
                                        }}
                                        onSelect={(c) => {
                                            setSelectedCompany(c);
                                            setCompanyText(c.name);
                                        }}
                                        placeholder="Search your company, e.g. Google"
                                        className={inputCls}
                                    />
                                </Field>

                                <label className="flex items-center gap-2 text-[13px] font-medium cursor-pointer select-none" style={{ color: "#4a3728" }}>
                                    <input
                                        type="checkbox"
                                        checked={curIsCurrent}
                                        onChange={(e) => setCurIsCurrent(e.target.checked)}
                                        className="w-4 h-4 accent-[#4a3728]"
                                    />
                                    I am currently working in this role
                                </label>

                                <div className={`grid grid-cols-1 ${curIsCurrent ? "" : "sm:grid-cols-2"} gap-4`}>
                                    <div ref={startDateRef} className="scroll-mt-24">
                                        <span className="block text-xs font-bold mb-1.5" style={{ color: dateError === "start" ? "#dc2626" : "#4a3728" }}>Start date *</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select aria-label="Start month" aria-invalid={dateError === "start" && !curStartMonth} value={curStartMonth} onChange={(e) => { setCurStartMonth(e.target.value); setDateError(null); }} className={`${inputCls} ${dateError === "start" && !curStartMonth ? "!border-red-500 !bg-red-50" : ""}`}>
                                                <option value="">Month</option>
                                                {MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
                                            </select>
                                            <select aria-label="Start year" aria-invalid={dateError === "start" && !curStartYear} value={curStartYear} onChange={(e) => { setCurStartYear(e.target.value); setDateError(null); }} className={`${inputCls} ${dateError === "start" && !curStartYear ? "!border-red-500 !bg-red-50" : ""}`}>
                                                <option value="">Year</option>
                                                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                        {dateError === "start" && (!curStartMonth || !curStartYear) && (
                                            <p className="mt-1.5 text-xs font-semibold text-red-600">
                                                {!curStartMonth && !curStartYear ? "Select start month and year" : !curStartMonth ? "Select start month" : "Select start year"}
                                            </p>
                                        )}
                                    </div>
                                    {!curIsCurrent && (
                                        <div ref={endDateRef} className="scroll-mt-24">
                                            <span className="block text-xs font-bold mb-1.5" style={{ color: dateError === "end" ? "#dc2626" : "#4a3728" }}>End date *</span>
                                            <div className="grid grid-cols-2 gap-2">
                                                <select aria-label="End month" aria-invalid={dateError === "end" && !curEndMonth} value={curEndMonth} onChange={(e) => { setCurEndMonth(e.target.value); setDateError(null); }} className={`${inputCls} ${dateError === "end" && !curEndMonth ? "!border-red-500 !bg-red-50" : ""}`}>
                                                    <option value="">Month</option>
                                                    {MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
                                                </select>
                                                <select aria-label="End year" aria-invalid={dateError === "end" && !curEndYear} value={curEndYear} onChange={(e) => { setCurEndYear(e.target.value); setDateError(null); }} className={`${inputCls} ${dateError === "end" && !curEndYear ? "!border-red-500 !bg-red-50" : ""}`}>
                                                    <option value="">Year</option>
                                                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                            {dateError === "end" && (!curEndMonth || !curEndYear) && (
                                                <p className="mt-1.5 text-xs font-semibold text-red-600">Select end month and year</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Location">
                                        <input
                                            type="text"
                                            value={curLocation}
                                            onChange={(e) => setCurLocation(e.target.value)}
                                            placeholder="Bhopal, Madhya Pradesh"
                                            maxLength={100}
                                            className={inputCls}
                                        />
                                    </Field>
                                    <Field label="Location type">
                                        <select value={curLocationType} onChange={(e) => setCurLocationType(e.target.value)} className={inputCls}>
                                            <option value="">Select type</option>
                                            {LOCATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </Field>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="flex justify-between text-xs font-bold" style={{ color: "#4a3728" }}>
                                        <span>Highlights</span>
                                        <span className={curDescription.length > DESC_MAX ? "text-red-500 font-medium" : "text-[#75665a] font-medium"}>
                                            {curDescription.length}/{DESC_MAX}
                                        </span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={curDescription}
                                        onChange={(e) => setCurDescription(e.target.value)}
                                        placeholder="Projects, problems you solved, or results you achieved"
                                        className={`${inputCls} resize-none`}
                                    />
                                </div>
                            </section>

                            {/* Past experience */}
                            <ExperienceEditor
                                roles={previousRoles}
                                setRoles={setPreviousRoles}
                                currentRole={currentRole}
                                currentCompany={selectedCompany?.name || companyText}
                                hideCurrentRole
                                onEditingChange={setExperienceFormOpen}
                                inputCls={inputCls}
                            />
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
                                <SkillsInput skills={skills} setSkills={setSkills} domains={domains} max={20} inputCls={inputCls} />
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
                        {activeTab !== "experience" && (
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