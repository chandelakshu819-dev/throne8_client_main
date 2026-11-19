// src/features/mentorship/services/company.service.ts
// Mentor company autocomplete API (backend: /api/v1/mentorship/companies/*)
import api from "@/lib/api/api.intance";

export interface CompanyRef {
    id: string;
    name: string;
    domain?: string;
    logoUrl?: string;
}

export interface CompanySuggestion {
    id?: string;
    name: string;
    domain?: string;
    logoUrl?: string;
    logoPreviewPath?: string;
}

export interface CompanySearchResult {
    companies: CompanySuggestion[];
    degraded: boolean;
}

const BASE = "/mentorship/companies";

export const CompanyService = {
    async search(q: string, signal?: AbortSignal): Promise<CompanySearchResult> {
        const { data } = await api.get(`${BASE}/search`, { params: { q }, signal });
        const companies: CompanySuggestion[] = Array.isArray(data?.data?.companies) ? data.data.companies : [];
        return { companies, degraded: Boolean(data?.data?.degraded) };
    },

    /** Find-or-create the picked company. Pass `logo` only for the "not listed" flow. */
    async resolve(input: { name: string; domain?: string; logo?: File | null }): Promise<CompanyRef> {
        let body: FormData | Record<string, string>;
        if (input.logo) {
            const fd = new FormData();
            fd.append("name", input.name);
            if (input.domain) fd.append("domain", input.domain);
            fd.append("logo", input.logo);
            body = fd;
        } else {
            body = { name: input.name, ...(input.domain ? { domain: input.domain } : {}) };
        }
        const { data } = await api.post(`${BASE}/resolve`, body);
        const company = data?.data?.company;
        if (!company?.id) throw new Error("Could not save company. Please try again.");
        return company as CompanyRef;
    },
};

export default CompanyService;
