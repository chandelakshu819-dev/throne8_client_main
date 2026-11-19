"use client";
// src/features/mentorship/components/shared/CompanyAutocomplete.tsx
//
// Search-as-you-type company picker (logo + name + domain) for the mentor forms.
// - 300ms debounced search, results from our backend (Logo.dev behind it)
// - keyboard: ArrowUp/Down, Enter, Escape, Tab
// - ARIA combobox/listbox pattern, click-outside to close
// - "My company is not listed" flow: name + optional website + optional logo upload

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import config from "@/config/env.config";
import CompanyService, { CompanyRef, CompanySuggestion } from "../../services/company.service";
import useCompanySearch from "../../hooks/useCompanySearch";
import { resolveLogoSrc } from "../../utils/companyLogo";
import CompanyLogoBadge from "./CompanyLogoBadge";

export const NOT_LISTED_LABEL = "➕ My company is not listed";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

interface CompanyAutocompleteProps {
    /** Text shown in the input. */
    value: string;
    /** Company the mentor picked (null while they are only typing). */
    selected?: CompanyRef | null;
    /** Called on every keystroke; the parent should clear its selected company. */
    onTextChange: (text: string) => void;
    /** Called once a company is picked / created. */
    onSelect: (company: CompanyRef) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    id?: string;
}

type Row = { kind: "company"; item: CompanySuggestion } | { kind: "not-listed" };

const apiBase = () => config.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CompanyAutocomplete({
    value,
    selected = null,
    onTextChange,
    onSelect,
    placeholder = "Search your company",
    className = "",
    disabled = false,
    id,
}: CompanyAutocompleteProps) {
    const reactId = useId();
    const listId = `${reactId}-listbox`;
    const rootRef = useRef<HTMLDivElement>(null);

    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // "not listed" panel
    const [panelOpen, setPanelOpen] = useState(false);
    const [panelName, setPanelName] = useState("");
    const [panelDomain, setPanelDomain] = useState("");
    const [panelLogo, setPanelLogo] = useState<File | null>(null);

    const trimmed = value.trim();
    const searchEnabled = open && !selected && !panelOpen;
    const { results, loading } = useCompanySearch(value, searchEnabled);

    const rows: Row[] = useMemo(() => {
        const list: Row[] = results.map((item) => ({ kind: "company" as const, item }));
        if (trimmed.length >= 2) list.push({ kind: "not-listed" });
        return list;
    }, [results, trimmed]);

    const showList = open && !panelOpen && !selected && trimmed.length >= 2;

    // click outside
    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
                setActive(-1);
            }
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    useEffect(() => setActive(-1), [results]);

    const finish = useCallback(
        (company: CompanyRef) => {
            onSelect(company);
            setOpen(false);
            setActive(-1);
            setPanelOpen(false);
            setError(null);
        },
        [onSelect]
    );

    const pick = useCallback(
        async (item: CompanySuggestion) => {
            setError(null);
            if (item.id) {
                finish({ id: item.id, name: item.name, domain: item.domain, logoUrl: item.logoUrl });
                return;
            }
            setBusy(true);
            try {
                finish(await CompanyService.resolve({ name: item.name, domain: item.domain }));
            } catch (err: any) {
                setError(err?.response?.data?.message || err?.message || "Could not select this company. Please try again.");
            } finally {
                setBusy(false);
            }
        },
        [finish]
    );

    const openPanel = () => {
        setPanelName(trimmed);
        setPanelDomain("");
        setPanelLogo(null);
        setError(null);
        setPanelOpen(true);
        setOpen(false);
    };

    const activate = (row: Row) => (row.kind === "not-listed" ? openPanel() : void pick(row.item));

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                if (!open) setOpen(true);
                else if (rows.length) setActive((i) => (i + 1) % rows.length);
                break;
            case "ArrowUp":
                e.preventDefault();
                if (rows.length) setActive((i) => (i <= 0 ? rows.length - 1 : i - 1));
                break;
            case "Enter":
                if (showList && active >= 0 && rows[active]) {
                    e.preventDefault(); // do not submit the surrounding form
                    activate(rows[active]);
                } else if (showList) {
                    e.preventDefault();
                }
                break;
            case "Escape":
                if (open) {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(false);
                    setActive(-1);
                }
                break;
            case "Tab":
                setOpen(false);
                break;
        }
    };

    const onLogoChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        e.target.value = "";
        if (!file) return;
        if (file.size > MAX_LOGO_BYTES) {
            setError("Logo must be 2MB or smaller.");
            return;
        }
        setError(null);
        setPanelLogo(file);
    };

    const submitPanel = async () => {
        const name = panelName.trim();
        if (!name || !/[a-z0-9]/i.test(name)) {
            setError("Please enter your company name.");
            return;
        }
        setBusy(true);
        setError(null);
        try {
            finish(await CompanyService.resolve({ name, domain: panelDomain.trim() || undefined, logo: panelLogo }));
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || "Could not save company. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const selectedSrc = selected ? resolveLogoSrc(selected, apiBase()) : undefined;
    const activeId = active >= 0 ? `${listId}-opt-${active}` : undefined;

    return (
        <div ref={rootRef} className="relative">
            <div className="relative">
                {selected && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                        <CompanyLogoBadge name={selected.name} src={selectedSrc} size={22} />
                    </span>
                )}
                <input
                    id={id}
                    type="text"
                    role="combobox"
                    aria-expanded={showList}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={activeId}
                    autoComplete="off"
                    disabled={disabled}
                    value={value}
                    placeholder={placeholder}
                    maxLength={100}
                    onChange={(e) => {
                        setError(null);
                        onTextChange(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    className={`${className} ${selected ? "pl-11" : ""}`}
                />
                {(loading || busy) && (
                    <Loader2
                        aria-hidden="true"
                        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#8B7355]"
                    />
                )}
            </div>

            {showList && (
                <ul
                    id={listId}
                    role="listbox"
                    aria-label="Company suggestions"
                    className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-[#e0d8cf] bg-white py-1 shadow-xl"
                >
                    {!loading && results.length === 0 && (
                        <li role="presentation" className="px-3.5 py-2 text-xs font-medium text-[#8B7355]">
                            No matches found
                        </li>
                    )}
                    {rows.map((row, i) => {
                        const isActive = i === active;
                        const base = `flex cursor-pointer items-center gap-3 px-3.5 py-2 text-sm ${isActive ? "bg-[#f7f1e6]" : "hover:bg-[#faf6ee]"}`;
                        if (row.kind === "not-listed") {
                            return (
                                <li
                                    key="not-listed"
                                    id={`${listId}-opt-${i}`}
                                    role="option"
                                    aria-selected={isActive}
                                    className={`${base} border-t border-[#f0e9de] font-bold text-[#4a3728]`}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onMouseEnter={() => setActive(i)}
                                    onClick={() => activate(row)}
                                >
                                    {NOT_LISTED_LABEL}
                                </li>
                            );
                        }
                        const { item } = row;
                        return (
                            <li
                                key={`${item.id || item.domain || item.name}-${i}`}
                                id={`${listId}-opt-${i}`}
                                role="option"
                                aria-selected={isActive}
                                className={base}
                                onMouseDown={(e) => e.preventDefault()}
                                onMouseEnter={() => setActive(i)}
                                onClick={() => activate(row)}
                            >
                                <CompanyLogoBadge name={item.name} src={resolveLogoSrc(item, apiBase())} size={28} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-bold text-[#4a3728]">{item.name}</span>
                                    {item.domain && <span className="block truncate text-xs text-[#8B7355]">{item.domain}</span>}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}

            {panelOpen && (
                <div className="mt-2 space-y-3 rounded-xl border border-[#e0d8cf] bg-[#fdfaf4] p-3.5">
                    <p className="text-xs font-bold text-[#4a3728]">Add your company</p>
                    <input
                        type="text"
                        value={panelName}
                        maxLength={100}
                        onChange={(e) => setPanelName(e.target.value)}
                        placeholder="Company name"
                        aria-label="Company name"
                        className={className}
                    />
                    <input
                        type="text"
                        value={panelDomain}
                        onChange={(e) => setPanelDomain(e.target.value)}
                        placeholder="Website, e.g. acme.com (optional)"
                        aria-label="Company website (optional)"
                        className={className}
                    />
                    <div className="flex items-center gap-3">
                        <label className="cursor-pointer rounded-lg border border-[#e0d8cf] bg-white px-3 py-1.5 text-xs font-bold text-[#4a3728] hover:bg-[#f7f1e6]">
                            {panelLogo ? "Change logo" : "Upload logo (optional)"}
                            <input type="file" accept={LOGO_ACCEPT} className="sr-only" onChange={onLogoChosen} />
                        </label>
                        {panelLogo && <span className="truncate text-xs text-[#8B7355]">{panelLogo.name}</span>}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={submitPanel}
                            className="rounded-lg bg-[#4a3728] px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                        >
                            {busy ? "Saving..." : "Use this company"}
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                                setPanelOpen(false);
                                setError(null);
                            }}
                            className="rounded-lg border border-[#e0d8cf] bg-white px-3.5 py-1.5 text-xs font-bold text-[#4a3728]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <p role="alert" className="mt-1 text-xs text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
}
