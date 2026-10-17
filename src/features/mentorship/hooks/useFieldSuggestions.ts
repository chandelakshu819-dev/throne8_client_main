import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/api.intance';

export type SuggestionField = 'company' | 'college' | 'degree' | 'branch' | 'role' | 'skills';

// Backend route: GET <search router mount path>/field-suggestions
// Agar 404 aaye to sirf is path ko backend ke mount path se match karo.
const SEARCH_PATH = '/mentorship/search/field-suggestions';

const cache = new Map<string, string[]>();

export function useFieldSuggestions(field: SuggestionField, query: string, staticList: string[]) {
    const [remote, setRemote] = useState<string[]>([]);

    useEffect(() => {
        const q = (query || '').trim();
        if (q.length < 2) {
            setRemote([]);
            return;
        }

        const key = `${field}:${q.toLowerCase()}`;
        const cached = cache.get(key);
        if (cached) {
            setRemote(cached);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const { data } = await api.get(SEARCH_PATH, {
                    params: { field, q, limit: 8 },
                    signal: controller.signal,
                });
                const list: string[] = Array.isArray(data?.data)
                    ? data.data.filter((s: unknown): s is string => typeof s === 'string')
                    : [];
                cache.set(key, list);
                setRemote(list);
            } catch {
                // network error / abort: static list se kaam chalta rahega
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [field, query]);

    return useMemo(() => {
        const seen = new Set<string>();
        return [...remote, ...staticList].filter((s) => {
            const k = s.toLowerCase();
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });
    }, [remote, staticList]);
}