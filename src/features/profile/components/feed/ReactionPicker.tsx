// src/features/profile/components/feed/ReactionPicker.tsx
'use client';

import React from 'react';
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
    return (
        <div
            className={`absolute bottom-full left-0 mb-2 flex items-center gap-1 px-2 py-2 rounded-full shadow-2xl border z-50 reaction-picker ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#4a3728]/20'
            }`}
            onClick={(e) => e.stopPropagation()}
        >
            {REACTION_CONFIG.map((r) => (
                <button
                    key={r.type}
                    onClick={() => onSelect(r.type)}
                    title={r.label}
                    className="text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:scale-125 hover:-translate-y-1 transition-transform duration-150"
                >
                    {r.emoji}
                </button>
            ))}
        </div>
    );
};

export default ReactionPicker;