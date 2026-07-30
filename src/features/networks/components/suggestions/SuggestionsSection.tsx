import React, { useState } from 'react';
import { Person } from '@/features/networks/types';
import { SectionHeader } from '../ui/SectionHeader';
import { PeopleGrid } from './PeopleGrid';
import { PersonCardLoader } from './PersonCardLoader';

interface SuggestionsSectionProps {
    title?: string;
    people: Person[];
    connectedUsers: Set<string>;
    onConnect: (userId: string) => void;
    isLoading?: boolean;
}

// Har "Show more" click pe itne naye cards add honge
const PAGE_SIZE = 4;

// Naya batch dikhne se pehle itni der ka chhota loading feel diya jaata hai
// (data toh already fetched hai, ye sirf smooth "loading" jaisa UX dene ke liye hai)
const LOAD_MORE_DELAY_MS = 400;

export const SuggestionsSection: React.FC<SuggestionsSectionProps> = ({
    title = "People You May Know",
    people,
    connectedUsers,
    onConnect,
    isLoading = false
}) => {
    // ✅ Ab "showAll" boolean ki jagah ek counter — batch-wise reveal ke liye
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // ✅ Loading state (initial fetch)
    if (isLoading) {
        return (
            <div
                className="rounded-3xl shadow-2xl p-8 border-2"
                style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-12">
                    {[...Array(4)].map((_, index) => (
                        <PersonCardLoader key={index} />
                    ))}
                </div>
            </div>
        );
    }

    // ✅ Empty state
    if (people.length === 0) {
        return (
            <div
                className="rounded-3xl shadow-2xl p-8 border-2"
                style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}
            >
                <SectionHeader
                    icon={<i className="ri-hand-coin-fill"></i>}
                    title={title}
                />
                <p className="text-center text-[#4a3728]/70 py-8 font-medium">
                    No users to show at the moment
                </p>
            </div>
        );
    }

    const displayedPeople = people.slice(0, visibleCount);
    const hasMore = visibleCount < people.length;
    const isFullyExpanded = !hasMore && people.length > PAGE_SIZE;

    const handleShowMore = () => {
        if (isLoadingMore) return; // double-click guard
        setIsLoadingMore(true);
        // Chhota sa delay — LinkedIn jaisa "loading next batch" feel dene ke liye
        setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, people.length));
            setIsLoadingMore(false);
        }, LOAD_MORE_DELAY_MS);
    };

    const handleShowLess = () => {
        setVisibleCount(PAGE_SIZE);
        // Section ke top pe smoothly scroll kar do taaki user disoriented na ho
        // (optional — agar chahiye toh ref lagakar scrollIntoView kar sakte hain)
    };

    return (
        <div
            className="relative rounded-3xl shadow-2xl p-8 border-2"
            style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}
        >
            <SectionHeader
                icon={<i className="ri-hand-coin-fill"></i>}
                title={title}
            />

            <PeopleGrid
                people={displayedPeople}
                connectedUsers={connectedUsers}
                onConnect={onConnect}
            />

            {/* ✅ Naya batch load hote waqt niche skeleton cards dikhte hain */}
            {isLoadingMore && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                    {[...Array(Math.min(PAGE_SIZE, people.length - visibleCount))].map((_, index) => (
                        <PersonCardLoader key={`loading-more-${index}`} />
                    ))}
                </div>
            )}

            {/* ✅ Show more / Show less button */}
            {(hasMore || isFullyExpanded) && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={isFullyExpanded ? handleShowLess : handleShowMore}
                        disabled={isLoadingMore}
                        className="text-sm font-bold px-6 py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#f6ede8', color: '#4a3728' }}
                    >
                        {isLoadingMore
                            ? 'Loading...'
                            : isFullyExpanded
                                ? 'Show less ▲'
                                : `Show more →`}
                    </button>
                </div>
            )}
        </div>
    );
};