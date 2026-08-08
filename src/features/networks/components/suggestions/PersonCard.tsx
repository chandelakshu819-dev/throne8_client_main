'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Person } from '@/features/networks/types';

interface PersonCardProps {
    person: Person; 
    isConnected: boolean;
    onConnect: (userId: string) => void;
    isLoading?: boolean;
}

export const PersonCard: React.FC<PersonCardProps> = ({
    person,
    isConnected,
    onConnect,
    isLoading = false
}) => {
    const router = useRouter();

    const goToProfile = () => {
        router.push(`/profile/${person.id}`);
    };

    return (
        <div
            className="group relative overflow-hidden rounded-2xl shadow-xl transition-all duration-700 transform hover:-translate-y-1 hover:border-[#4a3728] hover:shadow-[0_0_15px_rgba(74,55,40,0.3)]"
            style={{ backgroundColor: '#f6ede8' }}
        >
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-[#4a3728] to-[#7a5c3e] rounded-bl-3xl"></div>
            </div>

            <div className="relative p-5 flex flex-col h-full">
                <div className="flex flex-col items-center text-center">
                    <div
                        className="relative mb-4 cursor-pointer"
                        onClick={goToProfile}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse"></div>
                        <div className="relative">
                            <img
                                src={person.image}
                                alt={person.name}
                                className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-xl relative z-10"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64';
                                }}
                            />
                        </div>
                    </div>

                    <h3
                        onClick={goToProfile}
                        className="cursor-pointer font-bold text-base mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-pink-600 transition-all duration-500"
                        style={{ color: '#4a3728' }}
                    >
                        {person.name}
                    </h3>

                    <p className="text-xs opacity-75 mb-2 font-medium leading-tight line-clamp-2" style={{ color: '#4a3728' }}>
                        {person.title}
                    </p>

                    <div className="flex items-center gap-1 mb-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] rounded-full"></div>
                        <span className="text-xs opacity-60 font-medium" style={{ color: '#4a3728' }}>
                            {person.location}
                        </span>
                    </div>

                    {person.mutuals && (
                        <div className="flex items-center gap-1 mb-4">
                            <div className="flex -space-x-1">
                                <div className="w-4 h-4 bg-[#f6ede8] rounded-full border border-white"></div>
                                <div className="w-4 h-4 bg-[#e0d8cf] rounded-full border border-white"></div>
                                <div className="w-4 h-4 bg-[#f6ede8] rounded-full border border-white"></div>
                            </div>
                            <span className="text-xs opacity-50 font-medium ml-1 line-clamp-1" style={{ color: '#4a3728' }}>
                                {person.mutuals}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={() => onConnect(person.id)}
                        disabled={isConnected || isLoading}
                        className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold shadow-lg transform transition-all duration-300 ${isConnected
                            ? 'bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] text-white cursor-default'
                            : 'text-[#4a3728] hover:bg-[#f6ede8] hover:border hover:border-[#4a3728] hover:shadow-md hover:opacity-90 active:scale-95'
                            }`}
                        style={{
                            background: isConnected
                                ? 'linear-gradient(135deg, #4a3728, #7a5c3e)'
                                : '#e0d8cf'
                        }}
                    >
                        <span className="flex items-center justify-center gap-2">
                            {isConnected ? (
                                <>
                                    <span className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <span className="text-[#7a5c3e] text-xs">✓</span>
                                    </span>
                                    Pending...
                                </>
                            ) : (
                                <>
                                    <span className="animate-pulse">✨</span>
                                    Connect
                                </>
                            )}
                        </span>
                    </button>
                </div>
            </div>

            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-4 left-4 w-1 h-3 bg-[#f6ede8] rounded-full animate-pulse"></div>
                <div className="absolute top-8 right-6 w-1 h-3 bg-[#e0d8cf] rounded-full animate-pulse"></div>
                <div className="absolute bottom-6 left-6 w-1 h-3 bg-[#f6ede8] rounded-full animate-pulse"></div>
            </div>
        </div>
    );
};