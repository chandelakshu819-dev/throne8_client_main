// src/shared/hooks/useMentionAutocomplete.ts
'use client';
import { useState, useCallback, useRef } from 'react';
import AuthService from '@/lib/api/auth.service';

export interface MentionUser {
    userId: string;
    firstName: string;
    lastName?: string;
    profilePhotoUrl?: string | null;
}

interface UseMentionAutocompleteOptions {
    value: string;
    onChange: (newValue: string) => void;
}

/**
 * ✅ Reusable "@" mention detection hook.
 *
 * Storage format used everywhere in this codebase for a mention inside
 * post/comment content: `@[Display Name](userId)`. This is plain text —
 * no schema change needed on Post/Comment models, since `content` is
 * already a plain string field. The renderer (postContentFormat.tsx)
 * parses this same syntax back into a clickable profile link.
 *
 * Usage: wire `handleTextChange` to the textarea/input's onChange
 * (passing the new value + cursor position), and `selectMention` to
 * the dropdown's onSelect.
 */
export function useMentionAutocomplete({ value, onChange }: UseMentionAutocompleteOptions) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MentionUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    // Index in the text where the triggering "@" sits — null when no
    // mention is currently being typed.
    const mentionStartRef = useRef<number | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const searchUsers = useCallback((q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!q) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                setIsSearching(true);
                const res = await AuthService.getAllUsers({ search: q, limit: 5 } as any);
                const users = res?.data?.users || [];
                setResults(users);
            } catch {
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 250);
    }, []);

    /**
     * Call this from the textarea/input's onChange, passing the new full
     * value and the current cursor position (e.target.selectionStart).
     */
    const handleTextChange = useCallback(
        (newValue: string, cursorPos: number) => {
            onChange(newValue);

            const textBeforeCursor = newValue.slice(0, cursorPos);
            const atIndex = textBeforeCursor.lastIndexOf('@');

            if (atIndex === -1) {
                setIsOpen(false);
                mentionStartRef.current = null;
                return;
            }

            // "@" only starts a mention if it's at the very start of the
            // text or preceded by whitespace (so "email@domain.com" doesn't
            // trigger the dropdown).
            const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' ';
            const isValidStart = /\s/.test(charBeforeAt) || atIndex === 0;

            const textAfterAt = textBeforeCursor.slice(atIndex + 1);
            const hasSpaceAfterAt = /\s/.test(textAfterAt);

            if (isValidStart && !hasSpaceAfterAt) {
                mentionStartRef.current = atIndex;
                setQuery(textAfterAt);
                setActiveIndex(0);
                setIsOpen(true);
                searchUsers(textAfterAt);
            } else {
                setIsOpen(false);
                mentionStartRef.current = null;
            }
        },
        [onChange, searchUsers]
    );

    /**
     * Call this when the user picks someone from the dropdown. Returns
     * the new cursor position so the caller can restore focus/selection.
     */
    const selectMention = useCallback(
        (user: MentionUser, cursorPos: number): number => {
            if (mentionStartRef.current === null) return cursorPos;

            const start = mentionStartRef.current;
            const name = `${user.firstName} ${user.lastName || ''}`.trim();
            const mentionText = `@[${name}](${user.userId}) `;
            const newValue = value.slice(0, start) + mentionText + value.slice(cursorPos);

            onChange(newValue);
            setIsOpen(false);
            mentionStartRef.current = null;

            return start + mentionText.length;
        },
        [value, onChange]
    );

    const closeMention = useCallback(() => {
        setIsOpen(false);
        mentionStartRef.current = null;
    }, []);

    return {
        isOpen,
        query,
        results,
        isSearching,
        activeIndex,
        setActiveIndex,
        handleTextChange,
        selectMention,
        closeMention,
    };
}