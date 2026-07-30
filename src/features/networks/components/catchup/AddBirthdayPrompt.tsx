'use client';

import React, { useState } from 'react';
import DobService from '@/lib/api/dob.service';

interface AddBirthdayPromptProps {
    hasDateOfBirth: boolean;
    onSaved?: () => void;
}

export const AddBirthdayPrompt: React.FC<AddBirthdayPromptProps> = ({
    hasDateOfBirth,
    onSaved,
}) => {
    const [dob, setDob] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (hasDateOfBirth || saved) return null;

    const handleSave = async () => {
        if (!dob) return;
        try {
            setIsSaving(true);
            setError(null);
            await DobService.updateDateOfBirth(dob);
            setSaved(true);
            onSaved?.();
        } catch (err: any) {
            setError(err.message || 'Kuch gadbad ho gayi, dobara try karo');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="rounded-3xl shadow-2xl p-6 border-2 flex flex-col sm:flex-row items-center gap-4"
            style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}
        >
            <div className="flex-1">
                <h3 className="font-bold" style={{ color: '#4a3728' }}>
                    Apni birthday add karo 🎂
                </h3>
                <p className="text-sm opacity-70" style={{ color: '#4a3728' }}>
                    Taaki tumhare connections tumhe wish kar sakein, aur tumhe unki birthdays bhi
                    Catch Up mein dikhengi.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="px-3 py-2 rounded-xl border-2 outline-none"
                    style={{ borderColor: '#4a3728', color: '#4a3728', backgroundColor: '#f6ede8' }}
                />
                <button
                    onClick={handleSave}
                    disabled={!dob || isSaving}
                    className="px-4 py-2 rounded-xl font-bold shadow-lg disabled:opacity-50 transition hover:scale-105"
                    style={{ backgroundColor: '#4a3728', color: '#f6ede8' }}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>
            {error && <p className="text-red-600 text-sm w-full text-center sm:text-left">{error}</p>}
        </div>
    );
};