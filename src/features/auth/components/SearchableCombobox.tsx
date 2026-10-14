'use client';
// src/features/auth/components/SearchableCombobox.tsx
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: string[];
  placeholder?: string;
  className?: string;
  maxResults?: number;
  leading?: ReactNode;
  renderOption?: (option: string) => ReactNode;
}

export default function SearchableCombobox({
  id,
  value,
  onChange,
  onBlur,
  options,
  placeholder = 'Type to search...',
  className = '',
  maxResults = 10,
  leading,
  renderOption,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (query.length === 0) return options.slice(0, maxResults);
    const starts = options.filter((o) => o.toLowerCase().startsWith(query));
    const contains = options.filter(
      (o) => !o.toLowerCase().startsWith(query) && o.toLowerCase().includes(query)
    );
    return [...starts, ...contains].slice(0, maxResults);
  }, [query, options, maxResults]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showDropdown = open && suggestions.length > 0;

  return (
    <div ref={wrapperRef} className="relative">
      {leading && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          {leading}
        </div>
      )}
      <input
        id={id}
        type="text"
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={
          className ||
          'w-full px-5 py-4 rounded-xl border border-[#4a3728] bg-white text-black placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a3728] focus:border-transparent transition'
        }
      />

      {showDropdown && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-50 max-h-64 overflow-y-auto rounded-xl border border-[#e5d9cc] bg-white shadow-xl"
        >
          {suggestions.map((o, i) => (
            <li
              key={o}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                select(o);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-4 py-2.5 text-sm text-gray-800 flex items-center gap-3 ${
                i === activeIndex ? 'bg-[#f5ede4]' : 'hover:bg-[#f5ede4]'
              }`}
            >
              {renderOption ? renderOption(o) : o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}