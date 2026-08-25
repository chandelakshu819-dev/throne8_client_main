'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePostReactors, Reactor } from '@/features/profile/hooks/usePostReactors';

const REACTION_EMOJI: Record<string, string> = {
    like: '👍',
    celebrate: '👏',
    support: '🤝',
    love: '❤️',
    insightful: '💡',
    funny: '😄',
};

interface ReactionsModalProps {
    postId: string;
    isOpen: boolean;
    onClose: () => void;
    isDarkMode?: boolean;
}

const ReactionsModal: React.FC<ReactionsModalProps> = ({ postId, isOpen, onClose, isDarkMode }) => {
    const router = useRouter();
    const { reactors, countsByType, isLoading, fetchReactors } = usePostReactors();
    const [activeTab, setActiveTab] = useState<string>('all');

    useEffect(() => {
        if (isOpen && postId) {
            setActiveTab('all');
            fetchReactors(postId);
        }
    }, [isOpen, postId, fetchReactors]);

    if (!isOpen) return null;

    const total = reactors.length;
    const activeTypes = Object.entries(countsByType).filter(([, c]) => (c as number) > 0);
    const filtered = activeTab === 'all' ? reactors : reactors.filter((r) => r.type === activeTab);

    // ✅ Click on a user → navigate to their profile (jaisa request tha)
    const goToProfile = (userId: string) => {
        onClose();
        router.push(`/profile/${userId}`);
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
                    isDarkMode ? 'bg-slate-800' : 'bg-white'
                }`}
            >
                {/* Header */}
                <div
                    className={`flex items-center justify-between px-5 py-4 border-b ${
                        isDarkMode ? 'border-slate-700' : 'border-[#e0d8cf]'
                    }`}
                >
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                        Reactions
                    </h3>
                    <button
                        onClick={onClose}
                        className={`text-xl leading-none ${
                            isDarkMode ? 'text-slate-400 hover:text-white' : 'text-[#4a3728]/60 hover:text-[#4a3728]'
                        }`}
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs — All + per reaction-type */}
                <div
                    className={`flex items-center gap-4 px-5 py-3 border-b overflow-x-auto ${
                        isDarkMode ? 'border-slate-700' : 'border-[#e0d8cf]'
                    }`}
                >
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`text-sm font-semibold pb-1 whitespace-nowrap border-b-2 transition-colors ${
                            activeTab === 'all'
                                ? 'border-[#4a3728] text-[#4a3728]'
                                : `border-transparent ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'}`
                        }`}
                    >
                        All {total}
                    </button>
                    {activeTypes.map(([type, count]) => (
                        <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={`text-sm font-semibold pb-1 whitespace-nowrap border-b-2 transition-colors flex items-center gap-1 ${
                                activeTab === type
                                    ? 'border-[#4a3728] text-[#4a3728]'
                                    : `border-transparent ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'}`
                            }`}
                        >
                            <span>{REACTION_EMOJI[type]}</span> {count as number}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="max-h-96 overflow-y-auto py-2">
                    {isLoading ? (
                        <div className={`py-10 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'}`}>
                            Loading...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className={`py-10 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/50'}`}>
                            No reactions yet
                        </div>
                    ) : (
                        filtered.map((r: Reactor) => (
                            <button
                                key={r.userId}
                                onClick={() => goToProfile(r.userId)}
                                className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                                    isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-[#f6ede8]'
                                }`}
                            >
                                <div className="relative flex-shrink-0">
                                    {r.avatar ? (
                                        <img
                                            src={r.avatar}
                                            alt={r.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-[#6b5643] text-white flex items-center justify-center text-sm font-bold">
                                            {r.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="absolute -bottom-1 -right-1 text-sm">
                                        {REACTION_EMOJI[r.type] || '👍'}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-[#4a3728]'}`}>
                                        {r.name}
                                    </p>
                                    {r.headline && (
                                        <p className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-[#4a3728]/60'}`}>
                                            {r.headline}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReactionsModal;