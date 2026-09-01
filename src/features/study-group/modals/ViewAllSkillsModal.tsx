'use client';
import React, { useEffect } from 'react';
import { X, Pin } from 'lucide-react';

interface Skill {
    skillId: string;
    skillName: string;
    category: string;
    skillStrength: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience: number;
    isPinned: boolean;
    isDeleted: boolean;
    isArchived: boolean;
    createdAt: string;
}

interface ViewAllSkillsModalProps {
    isOpen: boolean;
    onClose: () => void;
    skills: Skill[];
}

const ViewAllSkillsModal: React.FC<ViewAllSkillsModalProps> = ({ isOpen, onClose, skills }) => {
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);
    const getStrengthLevel = (strength: string) => {
        const levels = {
            beginner: 2,
            intermediate: 3,
            advanced: 4,
            expert: 5,
        };
        return levels[strength as keyof typeof levels] || 3;
    };

    const getStrengthLabel = (strength: string) => {
        const labels = {
            beginner: 'Beginner',
            intermediate: 'Intermediate',
            advanced: 'Advanced',
            expert: 'Expert',
        };
        return labels[strength as keyof typeof labels] || 'Intermediate';
    };

    const getStrengthPercentage = (strength: string) => {
        const percentages = {
            beginner: 40,
            intermediate: 60,
            advanced: 80,
            expert: 100,
        };
        return percentages[strength as keyof typeof percentages] || 60;
    };

    const getCategoryIcon = (category: string) => {
        return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Transparent Overlay Background */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-4xl mx-auto max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 bg-gradient-to-r from-[#4a3728] to-[#6a5748] px-6 py-5 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">All Skills</h2>
                        <p className="text-white/70 text-sm mt-1">View and manage all your professional skills</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Skills Container */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
                    {skills.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📭</div>
                            <p className="text-[#4a3728] font-semibold text-lg">No skills yet</p>
                            <p className="text-[#4a3728]/60">Add your first skill to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {skills.map((skill) => (
                                <div
                                    key={skill.skillId}
                                    className="bg-gradient-to-r from-[#e0d8cf]/40 via-[#e0d8cf]/20 to-transparent backdrop-blur-sm rounded-2xl p-5 border border-[#e0d8cf]/40 hover:border-[#4a3728]/30 transition-all duration-300 hover:shadow-lg group/skill"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-gradient-to-br from-[#4a3728] to-[#7a5c3e] rounded-xl flex items-center justify-center text-[#f6ede8] shadow-lg">
                                                {getCategoryIcon(skill.category)}
                                            </div>
                                            {skill.isPinned && (
                                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#7a5c3e] rounded-full flex items-center justify-center shadow-lg">
                                                    <Pin className="w-3 h-3 text-[#f6ede8] fill-current" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base font-bold text-[#4a3728] truncate">
                                                {skill.skillName}
                                            </h4>
                                            <p className="text-xs text-[#4a3728]/60 truncate">{skill.category}</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-2">
                                        <div className="w-full bg-[#e0d8cf]/50 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] rounded-full transition-all duration-500"
                                                style={{ width: `${getStrengthPercentage(skill.skillStrength)}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Strength Info */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-[#4a3728]/60 font-medium">
                                                {getStrengthLabel(skill.skillStrength)}
                                            </span>
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            i < getStrengthLevel(skill.skillStrength)
                                                                ? 'bg-[#4a3728]'
                                                                : 'bg-[#e0d8cf]'
                                                        }`}
                                                    ></div>
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-xs text-[#4a3728]/60 font-medium">
                                            {skill.yearsOfExperience}+ {skill.yearsOfExperience === 1 ? 'Year' : 'Years'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t border-[#e0d8cf] bg-white">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-full border-2 border-[#e0d8cf] text-[#4a3728] font-semibold hover:bg-[#f6ede8]/50 transition-colors duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewAllSkillsModal;
