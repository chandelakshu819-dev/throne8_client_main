'use client';

import { Loader2, X, Briefcase, Calendar, Image as ImageIcon, Award } from 'lucide-react';
import React, { useEffect } from 'react';

interface ExperienceModalProps {
    isOpen: boolean;
    isEditing: boolean;
    error: string;
    company: string;
    position: string;
    description: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    logoUrl: string;
    isSaving?: boolean;
    achievementInput: string;
    achievementsList: string[];
    onClose: () => void;
    onSave: () => void;
    onCompanyChange: (value: string) => void;
    onPositionChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
    onIsCurrentChange: (value: boolean) => void;
    onLogoUrlChange: (value: string) => void;
    onAchievementInputChange: (value: string) => void;
    onAddAchievement: () => void;
    onRemoveAchievement: (index: number) => void;
    onAchievementKeyPress: (e: React.KeyboardEvent) => void;
}

const ExperienceModal: React.FC<ExperienceModalProps> = ({
    isOpen,
    isEditing,
    error,
    company,
    position,
    description,
    startDate,
    endDate,
    isCurrent,
    logoUrl,
    isSaving,
    achievementInput,
    achievementsList,
    onClose,
    onSave,
    onCompanyChange,
    onPositionChange,
    onDescriptionChange,
    onStartDateChange,
    onEndDateChange,
    onIsCurrentChange,
    onLogoUrlChange,
    onAchievementInputChange,
    onAddAchievement,
    onRemoveAchievement,
    onAchievementKeyPress,
}) => {
    // Lock background scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#f6ede8] to-[#f0e6d8] rounded-2xl shadow-2xl border border-[#e0d8cf] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[#f6ede8] border-b border-[#e0d8cf] px-6 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold text-[#4a3728]">
                            {isEditing ? '✏️ Edit Experience' : '➕ Add New Experience'}
                        </h3>
                        <p className="text-xs text-[#8b6f47] mt-1">Share your professional journey</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-[#e0d8cf] rounded-lg transition-colors"
                        title="Close modal"
                    >
                        <X className="w-5 h-5 text-[#4a3728]" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-start gap-2">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Section 1: Basic Info */}
                    <div>
                        <label className="block text-sm font-bold text-[#4a3728] mb-2 uppercase flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4 text-[#8b6f47]" /> Basic Information
                        </label>
                        <div className="space-y-3 bg-white/50 p-4 rounded-lg border border-[#d4c4b5]">
                            <input
                                type="text"
                                placeholder="Company Name *"
                                value={company}
                                onChange={(e) => onCompanyChange(e.target.value)}
                                className="w-full bg-white rounded-lg p-3 border border-[#d4c4b5] shadow-sm focus:outline-none focus:border-[#4a3728] focus:ring-1 focus:ring-[#4a3728]/20 text-sm text-[#4a3728]"
                            />

                            <input
                                type="text"
                                placeholder="Job Position *"
                                value={position}
                                onChange={(e) => onPositionChange(e.target.value)}
                                className="w-full bg-white rounded-lg p-3 border border-[#d4c4b5] shadow-sm focus:outline-none focus:border-[#4a3728] focus:ring-1 focus:ring-[#4a3728]/20 text-sm text-[#4a3728]"
                            />

                            <textarea
                                placeholder="Job Description (Describe your role and responsibilities)"
                                value={description}
                                onChange={(e) => onDescriptionChange(e.target.value)}
                                className="w-full bg-white rounded-lg p-3 border border-[#d4c4b5] shadow-sm focus:outline-none focus:border-[#4a3728] focus:ring-1 focus:ring-[#4a3728]/20 text-sm text-[#4a3728] h-24 resize-none"
                            />
                        </div>
                    </div>

                    {/* Section 2: Duration */}
                    <div>
                        <label className="block text-sm font-bold text-[#4a3728] mb-2 uppercase flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-[#8b6f47]" /> Employment Duration
                        </label>
                        <div className="bg-white/50 p-4 rounded-lg border border-[#d4c4b5] space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-[#6b5038] font-semibold block mb-1">Start Date *</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => onStartDateChange(e.target.value)}
                                        className="w-full bg-white text-[#4a3728] rounded-lg p-3 border border-[#d4c4b5] shadow-sm focus:outline-none focus:border-[#4a3728] focus:ring-1 focus:ring-[#4a3728]/20 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-[#6b5038] font-semibold block mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => onEndDateChange(e.target.value)}
                                        disabled={isCurrent}
                                        className={`w-full bg-white text-[#4a3728] rounded-lg p-3 border border-[#d4c4b5] shadow-sm text-sm ${
                                            isCurrent 
                                                ? 'opacity-50 cursor-not-allowed bg-[#e0d8cf]/30' 
                                                : 'focus:outline-none focus:border-[#4a3728] focus:ring-1 focus:ring-[#4a3728]/20'
                                        }`}
                                    />
                                </div>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-[#d4c4b5]">
                                <input
                                    type="checkbox"
                                    checked={isCurrent}
                                    onChange={(e) => onIsCurrentChange(e.target.checked)}
                                    className="w-5 h-5 accent-[#4a3728] cursor-pointer"
                                />
                                <span className="text-[#4a3728] font-medium text-sm">I currently work here</span>
                            </label>
                        </div>
                    </div>

                    {/* Section 3: Company Logo */}
                    <div>
                        <label className="block text-sm font-bold text-[#4a3728] mb-2 uppercase flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-[#8b6f47]" /> Company Logo
                        </label>
                        <input
                            type="url"
                            placeholder="https://example.com/logo.png (optional)"
                            value={logoUrl}
                            onChange={(e) => onLogoUrlChange(e.target.value)}
                            className="w-full bg-white rounded-lg p-3 border border-[#d4c4b5] shadow-sm focus:outline-none focus:border-[#4a3728] focus:ring-1 focus:ring-[#4a3728]/20 text-sm text-[#4a3728]"
                        />
                        {logoUrl && (
                            <div className="mt-2 p-2 bg-white rounded-lg border border-[#d4c4b5] flex items-center gap-2">
                                <img src={logoUrl} alt="Logo preview" className="w-8 h-8 object-contain" />
                                <span className="text-xs text-[#6b5038]">Logo preview loaded</span>
                            </div>
                        )}
                    </div>

                    {/* Section 4: Achievements */}
                    <div>
                        <label className="block text-sm font-bold text-[#4a3728] mb-2 uppercase flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-[#8b6f47]" /> Key Achievements ({achievementsList.length}/10)
                        </label>
                        <div className="bg-white/50 p-4 rounded-lg border border-[#d4c4b5] space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="e.g., Led a team of 5 developers..."
                                    value={achievementInput}
                                    onChange={(e) => onAchievementInputChange(e.target.value)}
                                    onKeyPress={onAchievementKeyPress}
                                    className="flex-1 bg-white rounded-lg p-3 border border-[#d4c4b5] shadow-sm focus:outline-none focus:border-[#4a3728] focus:ring-1 focus:ring-[#4a3728]/20 text-sm text-[#4a3728]"
                                />
                                <button
                                    onClick={onAddAchievement}
                                    className="px-4 py-3 bg-[#4a3728] text-[#f6ede8] rounded-lg hover:bg-[#6b5038] transition-colors font-bold text-sm"
                                    disabled={achievementsList.length >= 10}
                                >
                                    +
                                </button>
                            </div>

                            {/* Achievements List */}
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {achievementsList.length === 0 && (
                                    <p className="text-xs text-[#8b6f47] italic py-2">No achievements added yet. Add your key accomplishments above.</p>
                                )}
                                {achievementsList.map((achievement, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-start gap-2 bg-white rounded-lg p-3 border border-[#d4c4b5] group"
                                    >
                                        <div className="flex items-start gap-2 flex-1">
                                            <span className="text-[#4a3728] font-bold text-sm mt-1">{index + 1}.</span>
                                            <span className="text-sm text-[#4a3728]">{achievement}</span>
                                        </div>
                                        <button
                                            onClick={() => onRemoveAchievement(index)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors flex-shrink-0"
                                            title="Remove achievement"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-[#8b6f47]/60">💡 <span className="font-semibold">Tip:</span> Add 3-5 key achievements to highlight your impact.</p>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="sticky bottom-0 bg-[#f6ede8] border-t border-[#e0d8cf] px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2 bg-[#e0d8cf] text-[#4a3728] rounded-lg hover:bg-[#d4c4b5] transition-colors font-semibold text-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className={`px-8 py-2 bg-[#4a3728] text-[#f6ede8] rounded-lg hover:bg-[#6b5038] transition-all duration-300 shadow-lg font-semibold text-sm flex items-center gap-2 ${
                            isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl'
                        }`}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {isEditing ? 'Saving...' : 'Adding...'}
                            </>
                        ) : (
                            <>
                                {isEditing ? '✓ Save Changes' : '✓ Add Experience'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExperienceModal;
