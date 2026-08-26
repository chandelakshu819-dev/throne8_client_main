import React from 'react';
import { Company } from '@/features/networks/types';
import { CompanyCard } from './CompanyCard';

interface CompaniesGridProps {
    companies: Company[];
    followingCompanies: Set<string>;
    onFollow: (companyId: string) => void;
}

export const CompaniesGrid: React.FC<CompaniesGridProps> = ({
    companies,
    followingCompanies,
    onFollow
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
                <CompanyCard
                    key={company.id}
                    company={company}
                    isFollowing={followingCompanies.has(company.id)}
                    onFollow={onFollow}
                />
            ))}
        </div>
    );
};
