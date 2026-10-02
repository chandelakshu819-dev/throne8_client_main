'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface PickerModalProps {
  label: string;
  placeholder?: string;
  options: string[] | Option[];
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export default function PickerModal({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  error,
}: PickerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: Option[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

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
    if (val === 'Other') {
      setIsCustom(true);
      setCustomValue('');
      onChange('');
    } else {
      setIsCustom(false);
      onChange(val);
    }
    setIsOpen(false);
    setSearch('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    onChange(val);
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {!isCustom ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-5 py-4 rounded-xl border flex items-center justify-between text-left transition bg-white ${
            error ? 'border-red-500' : 'border-[#4a3728]'
          } focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
          }`}
        >
          <span className={`text-sm ${value ? 'text-black font-medium' : 'text-gray-400'}`}>
            {value || placeholder}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={customValue}
            onChange={handleCustomChange}
            placeholder={`Enter custom ${label.toLowerCase()}`}
            className={`w-full text-black px-5 py-4 pr-12 rounded-xl border ${
              error ? 'border-red-500' : 'border-[#4a3728]'
            } focus:outline-none focus:ring-2 ${
              error ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
            } transition`}
          />
          <button
            type="button"
            onClick={() => {
              setIsCustom(false);
              onChange('');
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Back to list"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Dropdown Menu Sheet */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-72 flex flex-col animate-in fade-in duration-150">
          {/* Search bar inside sheet */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/70 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-black placeholder-gray-400 focus:outline-none"
              autoFocus
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-56 divide-y divide-gray-50">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full px-5 py-3 text-left text-sm transition hover:bg-[#4a3728]/10 flex items-center justify-between ${
                    value === opt.value
                      ? 'bg-[#4a3728]/5 text-[#4a3728] font-semibold'
                      : 'text-gray-800'
                  }`}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <span className="text-[#4a3728] text-xs">✓</span>}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">No options match "{search}"</div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">• {error}</p>}
    </div>
  );
}
