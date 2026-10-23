'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check, Plus } from 'lucide-react';

export interface Option {
  label: string;
  value: string;
}

export interface PickerModalProps {
  id: string;
  label: string;
  placeholder?: string;
  options: string[] | Option[];
  value: string;
  onChange: (val: string) => void;
  error?: string;
  allowCustom?: boolean;
}

const cleanValue = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export default function PickerModal({
  id,
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  error,
  allowCustom = true,
}: PickerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedOptions: Option[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const cleanedSearch = cleanValue(search);
  const isValidCustomLength = cleanedSearch.length >= 2 && cleanedSearch.length <= 60;

  // Case-insensitive exact match
  const exactMatch = normalizedOptions.find(
    (opt) =>
      opt.label.trim().toLowerCase() === cleanedSearch.toLowerCase() ||
      opt.value.trim().toLowerCase() === cleanedSearch.toLowerCase()
  );

  // Filter options based on typed search
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase().trim())
  );

  // Check if current selected value is custom (not in predefined options)
  const isCurrentValueCustom = Boolean(
    value && !normalizedOptions.some((opt) => opt.value === value)
  );

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    if (val === 'Other' && allowCustom) {
      // Focus search to allow typing custom value
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
      return;
    }
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleSelectCustom = (customText: string) => {
    const cleaned = cleanValue(customText);
    if (cleaned.length < 2 || cleaned.length > 60) return;

    // Case-insensitive duplicate check: if user typed "information technology", select existing option
    const duplicate = normalizedOptions.find(
      (opt) =>
        opt.label.trim().toLowerCase() === cleaned.toLowerCase() ||
        opt.value.trim().toLowerCase() === cleaned.toLowerCase()
    );

    const finalVal = duplicate ? duplicate.value : cleaned;
    onChange(finalVal);
    setIsOpen(false);
    setSearch('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      if (exactMatch) {
        handleSelect(exactMatch.value);
      } else if (allowCustom && isValidCustomLength) {
        handleSelectCustom(cleanedSearch);
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0].value);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={`${id}-options`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-5 py-4 rounded-xl border flex items-center justify-between text-left transition bg-white ${
          error ? 'border-red-500' : 'border-[#4a3728]'
        } focus:outline-none focus:ring-2 ${
          error ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
        }`}
      >
        <span
          className={`text-sm truncate mr-2 ${
            value ? 'text-black font-medium' : 'text-gray-400'
          }`}
        >
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Sheet */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-80 flex flex-col animate-in fade-in duration-150">
          {/* Search bar inside sheet */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/80 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={`Search ${label.toLowerCase()} or type custom...`}
              className="w-full bg-transparent text-sm text-black placeholder-gray-400 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div
            id={`${id}-options`}
            role="listbox"
            className="overflow-y-auto max-h-64 divide-y divide-gray-50"
          >
            {/* Show prefilled custom value if search is empty and not in list */}
            {!search && isCurrentValueCustom && (
              <div className="px-5 py-3 bg-[#4a3728]/5 text-[#4a3728] font-semibold text-sm flex items-center justify-between">
                <span className="truncate">{value}</span>
                <span className="text-[#4a3728] text-xs font-bold">✓</span>
              </div>
            )}

            {filteredOptions.length > 0 ? (
              <>
                {filteredOptions.map((opt) => {
                  const isSelected = value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full px-5 py-3 text-left text-sm transition hover:bg-[#4a3728]/10 flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#4a3728]/5 text-[#4a3728] font-semibold'
                          : 'text-gray-800'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#4a3728] flex-shrink-0" />}
                    </button>
                  );
                })}

                {/* Offer custom option at bottom even if matching options exist (if not exact match) */}
                {allowCustom && isValidCustomLength && !exactMatch && (
                  <div className="p-2 border-t border-gray-100 bg-gray-50/60">
                    <button
                      type="button"
                      onClick={() => handleSelectCustom(cleanedSearch)}
                      className="w-full px-4 py-2.5 text-left text-sm font-semibold text-[#4a3728] hover:bg-[#4a3728]/10 rounded-xl transition flex items-center gap-2 border border-[#4a3728]/20 bg-white"
                    >
                      <Plus className="w-4 h-4 text-[#4a3728] flex-shrink-0" />
                      <span className="truncate">
                        Use &quot;<span className="text-black font-bold">{cleanedSearch}</span>&quot; as my {label.toLowerCase()}
                      </span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 flex flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-gray-500">
                  No options match &quot;{search}&quot;
                </p>

                {allowCustom && (
                  <>
                    {isValidCustomLength ? (
                      <button
                        type="button"
                        onClick={() => handleSelectCustom(cleanedSearch)}
                        className="w-full px-4 py-3 bg-[#4a3728] hover:bg-[#3d2d21] text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          Use &quot;{cleanedSearch}&quot; as my {label.toLowerCase()}
                        </span>
                      </button>
                    ) : cleanedSearch.length > 0 && cleanedSearch.length < 2 ? (
                      <p className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                        Must be at least 2 characters
                      </p>
                    ) : cleanedSearch.length > 60 ? (
                      <p className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                        Cannot exceed 60 characters
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="text-red-500 text-sm mt-2">
          • {error}
        </p>
      )}
    </div>
  );
}
