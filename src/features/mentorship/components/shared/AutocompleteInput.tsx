"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

interface AutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (value: string) => void;
    onEnterFreeText?: (trimmed: string) => void;
    suggestions: string[];
    excludeValues?: string[];
    clearOnSelect?: boolean;
    placeholder?: string;
    className?: string;
    maxResults?: number;
    skipFilter?: boolean;
}

export default function AutocompleteInput({
    value,
    onChange,
    onSelect,
    onEnterFreeText,
    suggestions,
    excludeValues = [],
    clearOnSelect = false,
    placeholder,
    className,
    maxResults = 8,
    skipFilter = false,
}: AutocompleteInputProps) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
        const q = value.trim().toLowerCase();
        const excluded = new Set(excludeValues.map((v) => v.toLowerCase()));

        // suggestions pehle se filter/rank ho chuki hain (jaise domains ka keyword search)
        if (skipFilter) {
            return suggestions.filter((s) => !excluded.has(s.toLowerCase())).slice(0, maxResults);
        }

        if (!q) return [];
        const matches = suggestions.filter((s) => {
            const l = s.toLowerCase();
            return l.includes(q) && !excluded.has(l);
        });
        // prefix matches first, keep original order otherwise
        const starts = matches.filter((s) => s.toLowerCase().startsWith(q));
        const rest = matches.filter((s) => !s.toLowerCase().startsWith(q));
        return [...starts, ...rest].slice(0, maxResults);
    }, [value, suggestions, excludeValues, maxResults, skipFilter]);

    useEffect(() => {
        setActiveIndex(-1);
    }, [value]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const pick = (item: string) => {
        onChange(clearOnSelect ? "" : item);
        onSelect?.(item);
        setOpen(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : -1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (filtered.length ? (i <= 0 ? filtered.length - 1 : i - 1) : -1));
        } else if (e.key === "Enter") {
            if (open && activeIndex >= 0 && filtered[activeIndex]) {
                e.preventDefault();
                pick(filtered[activeIndex]);
            } else if (onEnterFreeText) {
                e.preventDefault();
                onEnterFreeText(value.trim());
                setOpen(false);
            }
            // otherwise let the form handle Enter (go to next step)
        } else if (e.key === "Escape") {
            if (open) {
                e.stopPropagation();
                setOpen(false);
            }
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
            />

            {open && filtered.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-[#ece7e2] rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                    {filtered.map((item, i) => (
                        <li key={item}>
                            <button
                                type="button"
                                // mousedown (not click) so input blur doesn't close the list first
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    pick(item);
                                }}
                                onMouseEnter={() => setActiveIndex(i)}
                                className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                                    i === activeIndex
                                        ? "bg-[#f8f6f4] text-[#4a3728]"
                                        : "text-slate-600 hover:bg-[#f8f6f4]"
                                }`}
                            >
                                {item}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}