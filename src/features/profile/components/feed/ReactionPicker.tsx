// src/features/profile/components/feed/ReactionPicker.tsx
'use client';

import React, { useState } from 'react';
import { ReactionType } from '@/types/profile.types';

export const REACTION_CONFIG: { type: ReactionType; emoji: string; label: string; color: string }[] = [
    { type: 'like', emoji: '👍', label: 'Like', color: '#4a80f0' },
    { type: 'celebrate', emoji: '👏', label: 'Celebrate', color: '#6dae4f' },
    { type: 'support', emoji: '🤝', label: 'Support', color: '#7c5cbf' },
    { type: 'love', emoji: '❤️', label: 'Love', color: '#e0575b' },
    { type: 'insightful', emoji: '💡', label: 'Insightful', color: '#e0a336' },
    { type: 'funny', emoji: '😂', label: 'Funny', color: '#4a9e9e' },
];

interface ReactionPickerProps {
    onSelect: (type: ReactionType) => void;
    isDarkMode?: boolean;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, isDarkMode }) => {
    const [hoveredType, setHoveredType] = useState<ReactionType | null>(null);
    const hoveredConfig = REACTION_CONFIG.find(r => r.type === hoveredType);

    return (
        <div
            className={`absolute bottom-full left-0 mb-3 z-50 reaction-picker animate-in fade-in zoom-in-95 duration-150`}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Tooltip label above the pill */}
            {hoveredConfig && (
                <div
                    className={`absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg ${
                        isDarkMode ? 'bg-slate-900 text-white' : 'bg-[#4a3728] text-white'
                    }`}
                    style={{ transform: `translateX(-50%)` }}
                >
                    {hoveredConfig.label}
                </div>
            )}

            <div
                className={`flex items-center gap-1 px-2.5 py-2 rounded-full shadow-2xl border ${
                    isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#e0d8cf]'
                }`}
            >
                {REACTION_CONFIG.map((r) => (
                    <button
                        key={r.type}
                        onClick={() => onSelect(r.type)}
                        onMouseEnter={() => setHoveredType(r.type)}
                        onMouseLeave={() => setHoveredType(null)}
                        className="text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:scale-[1.35] hover:-translate-y-1.5 transition-transform duration-150 ease-out"
                    >
                        {r.emoji}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ReactionPicker;