import React, { useState } from 'react';
import { Company } from '@/features/networks/types';
import { SectionHeader } from '../ui/SectionHeader';
import { CompaniesGrid } from './CompaniesGrid';
import { PersonCardLoader } from './PersonCardLoader';

interface SuggestionsForCompaniesSectionProps {
    title?: string;
    companies: Company[];
    followingCompanies: Set<string>;
    onFollow: (companyId: string) => void;
    isLoading?: boolean;
}

export const SuggestionsForCompaniesSection: React.FC<SuggestionsForCompaniesSectionProps> = ({
    title = "Suggestions for Companies",
    companies,
    followingCompanies,
    onFollow,
    isLoading = false
}) => {
    const [showAll, setShowAll] = useState(false);

    // ✅ Loading state
    if (isLoading) {
        return (
            <div
                className="rounded-3xl shadow-2xl p-8 border-2"
                style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
                    {[...Array(3)].map((_, index) => (
                        <PersonCardLoader key={index} />
                    ))}
                </div>
            </div>
        );
    }

    // ✅ Empty state
    if (companies.length === 0) {
        return (
            <div
                className="rounded-3xl shadow-2xl p-8 border-2"
                style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}
            >
                <SectionHeader
                    icon={<i className="ri-building-2-fill"></i>}
                    title={title}
                />
                <p className="text-center text-[#4a3728]/70 py-8 font-medium">
                    No companies to show at the moment
                </p>
            </div>
        );
    }

    // ✅ Show first 4 or all based on state
    const displayedCompanies = showAll ? companies : companies.slice(0, 4);

    return (
        <div
            className="relative rounded-3xl shadow-2xl p-8 border-2"
            style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}
        >
            <SectionHeader
                icon={<i className="ri-building-2-fill"></i>}
                title={title}
            />

            <CompaniesGrid
                companies={displayedCompanies}
                followingCompanies={followingCompanies}
                onFollow={onFollow}
            />

            {/* ✅ Show More/Less Button - Only when companies > 4 */}
            {companies.length > 4 && (
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="px-8 py-2.5 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                        style={{
                            backgroundColor: '#f6ede8',
                            color: '#4a3728',
                            border: '2px solid #4a3728'
                        }}
                    >
                        {showAll ? "Show Less ↑" : "See all →"}
                    </button>
                </div>
            )}
        </div>
    );
};
