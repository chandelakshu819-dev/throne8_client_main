'use client';

import React, { useState , useEffect} from 'react';
import { X } from 'lucide-react';

interface Experience {
    experienceId: string;
    company: string;
    position: string;
    period: string;
    current: boolean;
    description: string;
    achievements: string[];
    logo: string;
    startDate: string;
    endDate?: string;
}

interface ShowAllExperiencesModalProps {
    isOpen: boolean;
    experiences: Experience[];
    onClose: () => void;
    onSelectExperience?: (index: number) => void;
}

const ShowAllExperiencesModal: React.FC<ShowAllExperiencesModalProps> = ({
    isOpen,
    experiences,
    onClose,
    onSelectExperience,
}) => {
    const [selectedExp, setSelectedExp] = useState<Experience | null>(
        experiences.length > 0 ? experiences[0] : null
    );

    // Lock background page scroll while modal is open
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#f6ede8] rounded-2xl shadow-2xl border border-[#e0d8cf] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[#f6ede8] border-b border-[#e0d8cf] p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-[#4a3728]">All Experiences</h2>
                        <p className="text-sm text-[#8b6f47] mt-1">Total: {experiences.length} positions</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-[#e0d8cf]/70 hover:bg-[#d4c4b5] transition-all"
                    >
                        <X className="w-5 h-5 text-[#4a3728]" />
                    </button>
                </div>

                {/* Content */}
                <div className="grid grid-cols-2 gap-6 p-6">
                    {/* Left: Timeline List */}
                    <div className="col-span-1 space-y-4">
                        <h3 className="text-lg font-bold text-[#4a3728] mb-4">Timeline</h3>
                        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                            {experiences.map((exp, i) => {
                                const isSelected = selectedExp?.experienceId === exp.experienceId;
                                return (
                                    <div
                                        key={exp.experienceId}
                                        onClick={() => {
                                            setSelectedExp(exp);
                                            onSelectExperience?.(i);
                                        }}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                                            isSelected
                                                ? 'bg-[#4a3728] border-[#6b5038] text-[#f6ede8]'
                                                : 'bg-[#e0d8cf]/50 border-[#d4c4b5] text-[#4a3728] hover:border-[#8b6f47] hover:bg-[#e0d8cf]/70'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <img
                                                src={exp.logo}
                                                alt={exp.company}
                                                className="w-8 h-8 object-contain flex-shrink-0 mt-1"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm leading-tight truncate">
                                                    {exp.company.split(' (')[0]}
                                                </h4>
                                                <p className={`text-xs font-semibold mt-1 ${
                                                    isSelected ? 'text-[#f6ede8]/80' : 'text-[#6b5038]'
                                                }`}>
                                                    {exp.period}
                                                </p>
                                                {exp.current && (
                                                    <div className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                                        isSelected
                                                            ? 'bg-[#f6ede8] text-[#4a3728]'
                                                            : 'bg-[#4a3728] text-[#f6ede8]'
                                                    }`}>
                                                        Current
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="col-span-1">
                        {selectedExp && (
                            <div className="space-y-4">
                                <div className="bg-[#e0d8cf]/70 rounded-lg p-4 border border-[#d4c4b5] shadow-md">
                                    <div className="flex items-center gap-3 mb-2">
                                        <img
                                            src={selectedExp.logo}
                                            alt={selectedExp.company}
                                            className="w-10 h-10 object-contain"
                                        />
                                        <div>
                                            <h5 className="text-xs font-bold text-[#4a3728] uppercase">Company</h5>
                                            <p className="text-sm font-bold text-[#6b5038]">{selectedExp.company}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#d4c4b5]">
                                        <svg className="w-4 h-4 text-[#8b6f47]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-xs text-[#8b6f47] font-semibold">{selectedExp.period}</span>
                                        {selectedExp.current && (
                                            <span className="ml-auto px-2 py-0.5 bg-[#4a3728] text-[#f6ede8] text-xs font-bold rounded-full">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-[#e0d8cf]/70 rounded-lg p-4 border border-[#d4c4b5] shadow-md">
                                    <h5 className="text-xs font-bold text-[#4a3728] uppercase mb-2">Position</h5>
                                    <p className="text-lg font-black text-[#4a3728]">{selectedExp.position}</p>
                                </div>

                                <div className="bg-[#e0d8cf]/70 rounded-lg p-4 border border-[#d4c4b5] shadow-md">
                                    <h5 className="text-xs font-bold text-[#4a3728] uppercase mb-2">Role Overview</h5>
                                    <p className="text-[#4a3728]/70 text-xs leading-relaxed">{selectedExp.description}</p>
                                </div>

                                <div className="bg-[#e0d8cf]/70 rounded-lg p-4 border border-[#d4c4b5] shadow-md">
                                    <h5 className="text-xs font-bold text-[#4a3728] uppercase mb-3">Key Achievements</h5>
                                    <div className="space-y-2">
                                        {selectedExp.achievements.map((achievement, i) => (
                                            <div key={i} className="flex items-start gap-2 group">
                                                <svg
                                                    className="w-4 h-4 text-[#8b6f47] group-hover:translate-x-1 transition-transform flex-shrink-0 mt-0.5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span className="text-xs text-[#4a3728]/70 font-medium">{achievement}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShowAllExperiencesModal;
