"use client";

import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { formatRoleDuration } from "@/shared/utils/mentorFormat";
import { ROLE_SUGGESTIONS, COMPANY_SUGGESTIONS } from "../../constants/suggestions";

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"] as const;
export const MAX_EXPERIENCES = 10;
const DESC_MAX = 300;

export interface ExperienceRole {
    title: string;
    company: string;
    employmentType?: string;
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
    employmentType: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
}

const EMPTY: FormState = { title: "", company: "", employmentType: "", startDate: "", endDate: "", isCurrent: false, description: "" };

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
        if (r.startDate) out.startDate = r.startDate;
        if (r.endDate && !r.isCurrent) out.endDate = r.endDate;
        if (r.description?.trim()) out.description = r.description.trim().slice(0, DESC_MAX);
        if (r.companyLogo) out.companyLogo = r.companyLogo;
        // legacy free-text duration is only kept for roles that have no real dates
        if (!r.startDate && r.duration) out.duration = r.duration;
        return out;
    });
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
        setForm({
            title: r.title ?? "",
            company: r.company ?? "",
            employmentType: r.employmentType ?? "",
            startDate: r.startDate ?? "",
            endDate: r.endDate ?? "",
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
        if (!title) return setFormError("Job title is required.");
        if (title.length > 100) return setFormError("Job title can't exceed 100 characters.");
        if (!company) return setFormError("Company is required.");
        if (company.length > 100) return setFormError("Company can't exceed 100 characters.");
        if (!form.startDate) return setFormError("Select a start month.");
        if (!form.isCurrent) {
            if (!form.endDate) return setFormError("Select an end month, or tick \"I currently work here\".");
            if (form.endDate < form.startDate) return setFormError("End month can't be before the start month.");
        }
        if (form.description.length > DESC_MAX) return setFormError(`Description can't exceed ${DESC_MAX} characters.`);

        setRoles((prev) => {
            const base = editIndex !== null && editIndex >= 0 ? prev[editIndex] : undefined;
            const next: ExperienceRole = {
                ...(base ?? {}),
                title,
                company,
                employmentType: form.employmentType || undefined,
                startDate: form.startDate,
                endDate: form.isCurrent ? undefined : form.endDate,
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

    const formCard = (
        <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: "#fff", border: "1.5px solid #4a3728" }}>
            <p className="text-sm font-bold" style={{ color: "#4a3728" }}>
                {editIndex === -1 ? "Add experience" : `Editing: ${roles[editIndex!]?.title ?? ""}`}
            </p>

            {formError && <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "#7a5c3e" }}>Job title *</label>
                    <input list="exp-role-suggestions" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Software Engineer" maxLength={100} className={inputCls} />
                    <datalist id="exp-role-suggestions">{ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}</datalist>
                </div>
                <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "#7a5c3e" }}>Company *</label>
                    <input list="exp-company-suggestions" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Acme Corp" maxLength={100} className={inputCls} />
                    <datalist id="exp-company-suggestions">{COMPANY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "#7a5c3e" }}>Employment type</label>
                    <div className="relative">
                        <select value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)} className={`${inputCls} appearance-none pr-8`}>
                            <option value="">Select type</option>
                            {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                    </div>
                </div>
                <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "#7a5c3e" }}>Start month *</label>
                    <input type="month" value={form.startDate} max={new Date().toISOString().slice(0, 7)} onChange={(e) => set("startDate", e.target.value)} className={inputCls} />
                </div>
                {!form.isCurrent && (
                    <div>
                        <label className="block text-[11px] font-semibold mb-1" style={{ color: "#7a5c3e" }}>End month *</label>
                        <input type="month" value={form.endDate} min={form.startDate || undefined} onChange={(e) => set("endDate", e.target.value)} className={inputCls} />
                    </div>
                )}
            </div>

            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none" style={{ color: "#4a3728" }}>
                <input type="checkbox" checked={form.isCurrent} onChange={(e) => set("isCurrent", e.target.checked)} className="w-4 h-4 accent-[#4a3728]" />
                I currently work here
            </label>

            <div>
                <label className="flex justify-between text-[11px] font-semibold mb-1" style={{ color: "#7a5c3e" }}>
                    <span>Description</span>
                    <span className={form.description.length > DESC_MAX ? "text-red-500" : "text-[#8a7a6a]"}>{form.description.length}/{DESC_MAX}</span>
                </label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="What did you work on? Tools, impact, achievements…" className={`${inputCls} resize-none`} />
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
                    <button type="button" onClick={onEditCurrentRole} className="text-xs font-semibold underline flex-shrink-0" style={{ color: "#7a5c3e" }}>
                        Edit in Basic Info
                    </button>
                </div>
            </div>

            {/* Previous / other experience */}
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
                                    {!role.startDate && (
                                        <p className="text-[11px] mt-0.5 text-amber-700">Add start and end months to sort this role properly.</p>
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
