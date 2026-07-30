'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CatchUpItem } from '../../hooks/useCatchUp';
import { SectionHeader } from '../ui/SectionHeader';
import { PersonCardLoader } from '../suggestions/PersonCardLoader';

interface CatchUpSectionProps {
    items: CatchUpItem[];
    isLoading: boolean;
}

function getMessage(item: CatchUpItem): { title: string; cta: string } {
    const name = `${item.firstName}${item.lastName ? ' ' + item.lastName : ''}`;

    switch (item.type) {
        case 'job_change':
            return {
                title: `${name} started a new position as ${item.position} at ${item.companyName}`,
                cta: 'Congrats on starting your new role...',
            };
        case 'work_anniversary':
            return {
                title: `${name} completed ${item.years} year${item.years && item.years > 1 ? 's' : ''} at ${item.companyName}`,
                cta: 'Congrats on your anniversary...',
            };
        case 'birthday':
            return {
                title: `Celebrate ${name}'s birthday today`,
                cta: 'Wishing you a very happy birthday!',
            };
        default:
            return { title: name, cta: '' };
    }
}

export const CatchUpSection: React.FC<CatchUpSectionProps> = ({ items, isLoading }) => {
    const router = useRouter();

    if (isLoading) {
        return (
            <div
                className="rounded-3xl shadow-2xl p-8 border-2"
                style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}
            >
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <PersonCardLoader key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div
                className="rounded-3xl shadow-2xl p-8 border-2"
                style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}
            >
                <SectionHeader icon={<i className="ri-calendar-event-fill"></i>} title="Catch Up" />
                <p className="text-center text-[#4a3728]/70 py-8 font-medium">
                    Abhi koi naya update nahi hai apne connections se. Baad mein check karo!
                </p>
            </div>
        );
    }

    return (
        <div
            className="rounded-3xl shadow-2xl p-8 border-2 space-y-4"
            style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}
        >
            <SectionHeader icon={<i className="ri-calendar-event-fill"></i>} title="Catch Up" />

            {items.map((item, index) => {
                const { title, cta } = getMessage(item);
                return (
                    <div
                        key={`${item.userId}-${item.type}-${index}`}
                        className="flex items-center gap-4 p-4 rounded-2xl shadow-lg"
                        style={{ backgroundColor: '#f6ede8' }}
                    >
                        <img
                            src={item.image}
                            alt={item.firstName}
                            onClick={() => router.push(`/profile/${item.userId}`)}
                            className="w-12 h-12 rounded-full object-cover cursor-pointer flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <p
                                onClick={() => router.push(`/profile/${item.userId}`)}
                                className="font-semibold cursor-pointer"
                                style={{ color: '#4a3728' }}
                            >
                                {title}
                            </p>
                            <button
                                onClick={() => router.push(`/profile/${item.userId}`)}
                                className="mt-2 text-sm font-bold px-4 py-1.5 rounded-xl transition hover:scale-105"
                                style={{ backgroundColor: '#4a3728', color: '#f6ede8' }}
                            >
                                {cta}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};