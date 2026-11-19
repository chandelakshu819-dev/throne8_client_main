// src/features/mentorship/hooks/useCompanySearch.ts
import { useEffect, useState } from "react";
import CompanyService, { CompanySuggestion } from "../services/company.service";

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;
const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, { at: number; companies: CompanySuggestion[]; degraded: boolean }>();

/** Debounced (300ms) search-as-you-type; cancels in-flight requests when the query changes. */
export function useCompanySearch(query: string, enabled = true) {
    const [results, setResults] = useState<CompanySuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [degraded, setDegraded] = useState(false);

    useEffect(() => {
        const q = (query || "").trim();
        if (!enabled || q.length < MIN_CHARS) {
            setResults([]);
            setLoading(false);
            setDegraded(false);
            return;
        }

        const key = q.toLowerCase();
        const hit = cache.get(key);
        if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
            setResults(hit.companies);
            setDegraded(hit.degraded);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const r = await CompanyService.search(q, controller.signal);
                if (!r.degraded) cache.set(key, { at: Date.now(), ...r });
                setResults(r.companies);
                setDegraded(r.degraded);
            } catch (err: any) {
                if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError" || err?.name === "AbortError") return;
                setResults([]);
                setDegraded(true);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, enabled]);

    return { results, loading, degraded };
}

export default useCompanySearch;
