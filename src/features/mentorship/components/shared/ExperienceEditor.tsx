"use client";

import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { formatRoleDuration } from "@/shared/utils/mentorFormat";

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"] as const;
export const LOCATION_TYPES = ["On-site", "Hybrid", "Remote"] as const;
export const MAX_EXPERIENCES = 10;
const DESC_MAX = 300;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 51 }, (_, i) => String(THIS_YEAR - i));
const CURRENT_YM = new Date().toISOString().slice(0, 7);

const splitYM = (ym?: string): { y: string; m: string } => {
    const [y = "", m = ""] = (ym ?? "").split("-");
    return { y, m };
};
const joinYM = (y: string, m: string) => (y && m ? `${y}-${m}` : "");

export interface ExperienceRole {
    title: string;
    company: string;
    employmentType?: string;
    location?: string;
    locationType?: string;
    startDate?: string; // YYYY-MM
    endDate?: string;   // YYYY-MM
    isCurrent?: boolean;
    description?: string;
    companyLogo?: string;
    duration?: string;  // legacy free-text
}

interface FormState {
    title: string;
    company: string;
    location: string;
    locationType: string;
    employmentType: string;
    startMonth: string;
    startYear: string;
    endMonth: string;
    endYear: string;
    isCurrent: boolean;
    description: string;
}

const EMPTY: FormState = {
    title: "", company: "", location: "", locationType: "", employmentType: "",
    startMonth: "", startYear: "", endMonth: "", endYear: "", isCurrent: false, description: "",
};

interface Props {
    roles: ExperienceRole[];
    setRoles: React.Dispatch<React.SetStateAction<ExperienceRole[]>>;
    currentRole: string;
    currentCompany?: string;
    onEditCurrentRole: () => void;
    /** Lets the parent block "Save Changes" while a role form is still open. */
    onEditingChange?: (editing: boolean) => void;
    inputCls: string;
}

/** Normalise roles before sending to the API (matches server validator: YYYY-MM dates, 300 char description). */
export function cleanRolesForSave(roles: ExperienceRole[]) {
    return roles.map((r) => {
        const out: Record<string, unknown> = {
            title: r.title.trim(),
            company: r.company.trim(),
            isCurrent: Boolean(r.isCurrent),
        };
        if (r.employmentType) out.employmentType = r.employmentType;
        if (r.location?.trim()) out.location = r.location.trim();
        if (r.locationType) out.locationType = r.locationType;
        if (r.startDate) out.startDate = r.startDate;
        if (r.endDate && !r.isCurrent) out.endDate = r.endDate;
        if (r.description?.trim()) out.description = r.description.trim().slice(0, DESC_MAX);
        if (r.companyLogo) out.companyLogo = r.companyLogo;
        // legacy free-text duration is only kept for roles that have no real dates
        if (!r.startDate && r.duration) out.duration = r.duration;
        return out;
    });
}

function Label({ children }: { children: React.ReactNode }) {
    return <label className="block text-[11px] font-semibold mb-1" style={{ color: "#7a5c3e" }}>{children}</label>;
}

function Select({ value, onChange, inputCls, placeholder, children }: {
    value: string; onChange: (v: string) => void; inputCls: string; placeholder: string; children: React.ReactNode;
}) {
    return (
        <div className="relative">
            <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} appearance-none pr-8`}>
                <option value="">{placeholder}</option>
                {children}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>
    );
}

export default function ExperienceEditor({
    roles, setRoles, currentRole, currentCompany, onEditCurrentRole, onEditingChange, inputCls,
}: Props) {
    // null = form closed, -1 = adding new, >=0 = editing that index
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [formError, setFormError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    useEffect(() => { onEditingChange?.(editIndex !== null); }, [editIndex, onEditingChange]);

    const set = <K extends keyof FormState>(k: K, v: FormState[K]) => { setForm((f) => ({ ...f, [k]: v })); setFormError(null); };

    const openAdd = () => { setForm(EMPTY); setEditIndex(-1); setFormError(null); setConfirmDelete(null); };
    const openEdit = (i: number) => {
        const r = roles[i];
        const st = splitYM(r.startDate);
        const en = splitYM(r.endDate);
        setForm({
            title: r.title ?? "",
            company: r.company ?? "",
            location: r.location ?? "",
            locationType: r.locationType ?? "",
            employmentType: r.employmentType ?? "",
            startMonth: st.m,
            startYear: st.y,
            endMonth: en.m,
            endYear: en.y,
            isCurrent: Boolean(r.isCurrent),
            description: r.description ?? "",
        });
        setEditIndex(i);
        setFormError(null);
        setConfirmDelete(null);
    };
    const closeForm = () => { setEditIndex(null); setForm(EMPTY); setFormError(null); };

    const submit = () => {
        const title = form.title.trim();
        const company = form.company.trim();
        const location = form.location.trim();
        const startDate = joinYM(form.startYear, form.startMonth);
        const endDate = joinYM(form.endYear, form.endMonth);

        if (!title) return setFormError("Job title is required.");
        if (title.length > 100) return setFormError("Job title can't exceed 100 characters.");
        if (!company) return setFormError("Company is required.");
        if (company.length > 100) return setFormError("Company can't exceed 100 characters.");
        if (location.length > 100) return setFormError("Location can't exceed 100 characters.");
        if (!startDate) return setFormError("Select a start month and year.");
        if (startDate > CURRENT_YM) return setFormError("Start date can't be in the future.");
        if (!form.isCurrent) {
            if (!endDate) return setFormError("Select an end month and year, or tick \"I am currently working in this role\".");
            if (endDate < startDate) return setFormError("End date can't be before the start date.");
            if (endDate > CURRENT_YM) return setFormError("End date can't be in the future.");
        }
        if (form.description.length > DESC_MAX) return setFormError(`Highlights can't exceed ${DESC_MAX} characters.`);

        setRoles((prev) => {
            const base = editIndex !== null && editIndex >= 0 ? prev[editIndex] : undefined;
            const next: ExperienceRole = {
                ...(base ?? {}),
                title,
                company,
                location: location || undefined,
                locationType: form.locationType || undefined,
                employmentType: form.employmentType || undefined,
                startDate,
                endDate: form.isCurrent ? undefined : endDate,
                isCurrent: form.isCurrent,
                description: form.description.trim() || undefined,
                // company renamed → old logo no longer valid
                companyLogo: base && base.company.trim().toLowerCase() === company.toLowerCase() ? base.companyLogo : undefined,
            };
            if (editIndex !== null && editIndex >= 0) return prev.map((r, i) => (i === editIndex ? next : r));
            return [...prev, next];
        });
        closeForm();
    };

    const remove = (i: number) => {
        setRoles((prev) => prev.filter((_, idx) => idx !== i));
        setConfirmDelete(null);
        if (editIndex === i) closeForm();
        else if (editIndex !== null && editIndex > i) setEditIndex(editIndex - 1);
    };

    const initials = (name: string) => (name || "?").trim().slice(0, 2).toUpperCase();
    const limitReached = roles.length >= MAX_EXPERIENCES;

    const monthOptions = MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>);
    const yearOptions = YEARS.map((y) => <option key={y} value={y}>{y}</option>);

    const formCard = (
        <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: "#fff", border: "1.5px solid #4a3728" }}>
            <p className="text-sm font-bold" style={{ color: "#4a3728" }}>
                {editIndex === -1 ? "Add experience" : "Edit role"}
            </p>

            {formError && <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <Label>Job title *</Label>
                    <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Full Stack Developer" maxLength={100} className={inputCls} />
                </div>
                <div>
                    <Label>Company *</Label>
                    <input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Throne8" maxLength={100} className={inputCls} />
                </div>
                <div>
                    <Label>Location</Label>
                    <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Bhopal, Madhya Pradesh" maxLength={100} className={inputCls} />
                </div>
                <div>
                    <Label>Location type</Label>
                    <Select value={form.locationType} onChange={(v) => set("locationType", v)} inputCls={inputCls} placeholder="Select type">
                        {LOCATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </Select>
                </div>
            </div>

            <div>
                <Label>Employment type</Label>
                <Select value={form.employmentType} onChange={(v) => set("employmentType", v)} inputCls={inputCls} placeholder="Select type">
                    {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none" style={{ color: "#4a3728" }}>
                <input type="checkbox" checked={form.isCurrent} onChange={(e) => set("isCurrent", e.target.checked)} className="w-4 h-4 accent-[#4a3728]" />
                I am currently working in this role
            </label>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label>Start month *</Label>
                    <Select value={form.startMonth} onChange={(v) => set("startMonth", v)} inputCls={inputCls} placeholder="Month">{monthOptions}</Select>
                </div>
                <div>
                    <Label>Start year *</Label>
                    <Select value={form.startYear} onChange={(v) => set("startYear", v)} inputCls={inputCls} placeholder="Year">{yearOptions}</Select>
                </div>
                {!form.isCurrent && (
                    <>
                        <div>
                            <Label>End month *</Label>
                            <Select value={form.endMonth} onChange={(v) => set("endMonth", v)} inputCls={inputCls} placeholder="Month">{monthOptions}</Select>
                        </div>
                        <div>
                            <Label>End year *</Label>
                            <Select value={form.endYear} onChange={(v) => set("endYear", v)} inputCls={inputCls} placeholder="Year">{yearOptions}</Select>
                        </div>
                    </>
                )}
            </div>

            <div>
                <label className="flex justify-between text-[11px] font-semibold mb-1" style={{ color: "#7a5c3e" }}>
                    <span>Highlights</span>
                    <span className={form.description.length > DESC_MAX ? "text-red-500" : "text-[#8a7a6a]"}>{form.description.length}/{DESC_MAX}</span>
                </label>
                <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={3}
                    placeholder="Projects, problems you solved, or results you achieved"
                    className={`${inputCls} resize-none`}
                />
            </div>

            <div className="flex gap-2 pt-1">
                <button type="button" onClick={submit} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90" style={{ backgroundColor: "#4a3728" }}>
                    {editIndex === -1 ? "Add role" : "Update role"}
                </button>
                <button type="button" onClick={closeForm} className="px-4 py-2.5 rounded-xl font-bold text-sm border hover:bg-[#f3ece4]" style={{ borderColor: "#d6c9bb", color: "#4a3728" }}>
                    Cancel
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-5">
            {/* Current role (edited in Basic Info) */}
            <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: "#4a3728" }}>Current role</p>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#ece7e2", color: "#4a3728" }}>
                        {initials(currentCompany || currentRole)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "#4a3728" }}>{currentRole || "Not set"}</p>
                        <p className="text-xs truncate" style={{ color: "#7a5c3e" }}>{currentCompany ? `${currentCompany} · Present` : "Present"}</p>
                    </div>
                    <button type="button" onClick={onEditCurrentRole} className="text-xs font-semibold underline flex-shrink-0 whitespace-nowrap" style={{ color: "#7a5c3e" }}>
                        Edit in Basic Info
                    </button>
                </div>
            </div>

            {/* Work experience */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "#4a3728" }}>
                        Work experience <span className="font-normal text-[#8a7a6a]">· {roles.length} of {MAX_EXPERIENCES}</span>
                    </p>
                    {editIndex === null && (
                        <button
                            type="button"
                            onClick={openAdd}
                            disabled={limitReached}
                            title={limitReached ? `You can add up to ${MAX_EXPERIENCES} roles` : undefined}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                            style={{ backgroundColor: "#4a3728" }}
                        >
                            <Plus className="w-3.5 h-3.5" /> Add experience
                        </button>
                    )}
                </div>

                <div className="space-y-2">
                    {roles.length === 0 && editIndex === null && (
                        <div className="text-center py-6 rounded-xl border border-dashed" style={{ borderColor: "#d6c9bb" }}>
                            <p className="text-sm font-semibold" style={{ color: "#4a3728" }}>Add your first role</p>
                            <p className="text-xs mt-0.5 text-[#8a7a6a]">Past roles help mentees trust your background.</p>
                        </div>
                    )}

                    {roles.map((role, i) => {
                        if (editIndex === i) return <div key={i}>{formCard}</div>;
                        const duration = formatRoleDuration(role);
                        const place = [role.location, role.locationType].filter(Boolean).join(" · ");
                        return (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#ece7e2", color: "#4a3728" }}>
                                    {initials(role.company)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-bold truncate" style={{ color: "#4a3728" }}>{role.title}</p>
                                        {role.employmentType && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#ece7e2] text-[#4a3728]">{role.employmentType}</span>}
                                    </div>
                                    <p className="text-xs truncate" style={{ color: "#7a5c3e" }}>{role.company}</p>
                                    {duration && <p className="text-[11px]" style={{ color: "#8a7a6a" }}>{duration}</p>}
                                    {place && <p className="text-[11px]" style={{ color: "#8a7a6a" }}>{place}</p>}
                                    {!role.startDate && (
                                        <p className="text-[11px] mt-0.5 text-amber-700">Add start and end dates to sort this role properly.</p>
                                    )}
                                </div>
                                {confirmDelete === i ? (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button type="button" onClick={() => remove(i)} className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-red-500 hover:bg-red-600">Delete</button>
                                        <button type="button" onClick={() => setConfirmDelete(null)} className="px-2.5 py-1 rounded-lg text-[11px] font-bold border" style={{ borderColor: "#d6c9bb", color: "#4a3728" }}>Keep</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center flex-shrink-0">
                                        <button type="button" aria-label={`Edit ${role.title}`} onClick={() => openEdit(i)} className="p-2 rounded-lg hover:bg-[#f3ece4]" style={{ color: "#7a5c3e" }}><Pencil className="w-4 h-4" /></button>
                                        <button type="button" aria-label={`Delete ${role.title}`} onClick={() => setConfirmDelete(i)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {editIndex === -1 && formCard}
                </div>
            </div>
        </div>
    );
}
