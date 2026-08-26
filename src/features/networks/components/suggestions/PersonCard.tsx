'use client';
// src/features/networks/components/suggestions/PersonCard.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Person } from '@/features/networks/types';

interface PersonCardProps {
    person: Person;
    isConnected: boolean;
    onConnect: (userId: string) => void;
    isLoading?: boolean;
    onDismiss?: (userId: string) => void;
}

export const PersonCard: React.FC<PersonCardProps> = ({
    person,
    isConnected,
    onConnect,
    isLoading = false,
    onDismiss
}) => {
    const router = useRouter();
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const goToProfile = () => {
        router.push(`/profile/${person.id}`);
    };

    return (
        <div
            className="group relative overflow-hidden rounded-2xl shadow-md border border-[#4a3728]/15 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            style={{ backgroundColor: '#f6ede8' }}
        >
                        {/* Top Banner Cover */}
                        <div className="relative h-10 w-full bg-gradient-to-r from-[#e0d8cf] via-[#ebdcd0] to-[#e0d8cf] overflow-hidden">
                {/* Dismiss button (X) top-right */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onDismiss) onDismiss(person.id);
                        else setDismissed(true);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#4a3728]/20 hover:bg-[#4a3728]/40 text-[#4a3728] flex items-center justify-center text-[10px] font-bold transition z-20"
                    title="Dismiss suggestion"
                >
                    ✕            
                </button>
            </div>

            {/* Profile Body */}
            <div className="px-3 pb-3 flex flex-col items-center text-center flex-1">
                {/* Profile Image overlapping banner */}
                <div
                    className="relative -mt-8 mb-1.5 cursor-pointer group-hover:scale-105 transition-transform duration-300"
                    onClick={goToProfile}
                >
                    <img
                        src={person.image}
                        alt={person.name}
                        className="w-14 h-14 rounded-full object-cover border-[3px] border-[#f6ede8] shadow-md bg-white"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s';
                        }}
                    />
                </div>

                                {/* Name */}
                                <h3
                    onClick={goToProfile}
                    className="cursor-pointer font-bold text-xs sm:text-sm mb-0.5 line-clamp-1 hover:underline transition-colors"
                    style={{ color: '#4a3728' }}
                >
                    {person.name}
                </h3>

                {/* Title / Headline */}
                <p
                    className="text-[11px] opacity-75 line-clamp-2 min-h-[26px] font-medium leading-tight mb-1.5 px-1"
                    style={{ color: '#4a3728' }}
                >
                    {person.title || (person.location ? `Based in ${person.location}` : 'Professional Member')}
                </p>

                                {/* Mutual Connection Section (LinkedIn Style) */}
                                <div className="w-full min-h-[34px] flex items-center justify-center gap-1.5 my-1.5 px-1">
                    {person.mutuals ? (
                        <>
                            {person.mutualAvatars && person.mutualAvatars.length > 0 ? (
                                <div className="flex -space-x-1.5 shrink-0">
                                    {person.mutualAvatars.slice(0, 2).map((avatarUrl: string, idx: number) => (
                                        <img
                                            key={idx}
                                            src={avatarUrl}
                                            alt="mutual"
                                            className="w-3.5 h-3.5 rounded-full object-cover border border-white shadow-xs"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="w-3.5 h-3.5 rounded-full bg-[#4a3728]/15 flex items-center justify-center shrink-0">
                                    <i className="ri-user-shared-line text-[9px] text-[#4a3728]"></i>
                                </div>
                            )}
                            <span
                                className="text-[10px] font-medium opacity-80 line-clamp-3 leading-[1.25] text-left"
                                style={{ color: '#4a3728' }}
                            >
                                {person.mutuals}
                            </span>
                        </>
                    ) : (
                        <span className="text-[11px] opacity-40 font-medium text-center" style={{ color: '#4a3728' }}>
                            Suggested for you
                        </span>
                    )}
                </div>

                {/* Connect Button */}
                <button
                    onClick={() => onConnect(person.id)}
                    disabled={isConnected || isLoading}
                    className={`w-full mt-auto py-1.5 px-4 rounded-full text-xs sm:text-sm font-bold border-2 transition-all duration-300 shadow-sm flex items-center justify-center gap-1.5 ${
                        isConnected
                            ? 'bg-[#4a3728] border-[#4a3728] text-white cursor-not-allowed opacity-90'
                            : 'border-[#4a3728] text-[#4a3728] hover:bg-[#4a3728] hover:text-white active:scale-95'
                    }`}
                >
                    {isLoading ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Connecting...
                        </>
                    ) : isConnected ? (
                        <>
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pending...
                        </>
                    ) : (
                        <>
                            <span className="text-base font-semibold">+</span>
                            Connect
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};