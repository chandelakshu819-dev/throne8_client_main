// src/shared/uiComponents/MentionAutocomplete.tsx
'use client';
import React from 'react';
import { MentionUser } from '@/shared/hooks/useMentionAutocomplete';

interface MentionAutocompleteProps {
    results: MentionUser[];
    isSearching: boolean;
    activeIndex: number;
    onSelect: (user: MentionUser) => void;
    onHover: (index: number) => void;
    isDarkMode?: boolean;
}

const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
    results,
    isSearching,
    activeIndex,
    onSelect,
    onHover,
    isDarkMode = false,
}) => {
    if (!isSearching && results.length === 0) return null;

    return (
        <div
            className={`absolute z-50 mt-1 w-72 max-h-64 overflow-y-auto rounded-xl shadow-2xl border ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#e0d8cf]'
            }`}
        >
            {isSearching ? (
                <div className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'}`}>
                    Searching...
                </div>
            ) : (
                results.map((user, idx) => {
                    const name = `${user.firstName} ${user.lastName || ''}`.trim();
                    return (
                        <button
                            key={user.userId}
                            type="button"
                            // ✅ onMouseDown (not onClick) + preventDefault so the
                            // textarea/input doesn't blur before the click registers.
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onSelect(user);
                            }}
                            onMouseEnter={() => onHover(idx)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                idx === activeIndex
                                    ? isDarkMode
                                        ? 'bg-slate-700'
                                        : 'bg-[#e0d8cf]/50'
                                    : isDarkMode
                                    ? 'hover:bg-slate-700/60'
                                    : 'hover:bg-[#e0d8cf]/30'
                            }`}
                        >
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#4a3728]/20 flex items-center justify-center">
                                {user.profilePhotoUrl ? (
                                    <img src={user.profilePhotoUrl} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-bold text-[#4a3728]">{name.charAt(0)}</span>
                                )}
                            </div>
                            <span className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                                {name}
                            </span>
                        </button>
                    );
                })
            )}
        </div>
    );
};

export default MentionAutocomplete;