'use client';
import React, { useEffect, useState } from 'react';
import { MoreVertical, Pin, Archive, Trash2, Edit, Loader2, Zap, Plus } from 'lucide-react';
import { useSkillsData } from '@/features/profile/hooks/useSkillsData';
import AuthService from '@/lib/api/auth.service';
import AddSkillModal, { SkillFormData } from '@/features/study-group/modals/AddSkillModal';
import UpdateSkillModal, { UpdateSkillFormData } from '@/features/study-group/modals/UpdateSkillModal';
import ViewAllSkillsModal from '@/features/study-group/modals/ViewAllSkillsModal';
import PinLimitModal from './modals/PinLimitModal';
import DeleteSkillConfirmModal from './modals/DeleteSkillConfirmModal';
import ProfileService from '@/lib/api/profile.service';

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

interface SkillsSectionProps {
    userId?: string;          // target user ka id (public profile ke liye)
    isOwnProfile?: boolean;   // default true - purana behavior nahi tootega
}

// design tokens — matched to the app's actual palette (same cream used by
// Interests / other sections) instead of a flat white that breaks continuity
const TOKENS = {
    sectionBg: '#F6EDE8',   // outer wrapper — same warm cream as rest of the app
    cardBg: '#FBF6F0',      // inner skill card — subtle cream, not stark white
    border: '#E5D9CE',
    borderHover: '#4A3728',
    accent: '#4A3728',
    accentHover: '#3A2A1E',
    chipBg: '#EFE3D8',
    textPrimary: '#4A3728',
    textSecondary: 'rgba(74,55,40,0.6)',
    textOnChip: '#6B5D48',
    danger: '#B4442E',
};

const STRENGTH_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

const SkillsSection: React.FC<SkillsSectionProps> = ({
    userId,
    isOwnProfile = true,
}) => {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
    const [isUpdateSkillModalOpen, setIsUpdateSkillModalOpen] = useState(false);
    const [isViewAllSkillsModalOpen, setIsViewAllSkillsModalOpen] = useState(false);
    const [selectedSkillForUpdate, setSelectedSkillForUpdate] = useState<Skill | undefined>(undefined);
    const [isPinLimitModalOpen, setIsPinLimitModalOpen] = useState(false);
    const [isPinningSkillId, setIsPinningSkillId] = useState<string | null>(null);

    const [isArchivingSkillId, setIsArchivingSkillId] = useState<string | null>(null);
    const [isDeletingSkillId, setIsDeletingSkillId] = useState<string | null>(null);
    const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
    const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);

    const [showAllSkills, setShowAllSkills] = useState(false);

    const {
        skillsList,
        isLoadingSkills,
        fetchSkillsData,
        updateSkillInList,
        getPinnedCount,
        updatePinStatus,
        removeSkillFromList,
    } = useSkillsData(userId, isOwnProfile);

    useEffect(() => {
        fetchSkillsData();
    }, [fetchSkillsData]);

    const handleAddSkill = async (skillData: SkillFormData) => {
        try {
            const response = await ProfileService.createSkill(skillData);

            if (response?.data?.skill) {
                await fetchSkillsData();
            }
        } catch (error: any) {
            console.error('Failed to add skill:', error);
            alert(error.message || 'Failed to add skill');
        }
    };

    const getStrengthLevel = (strength: string) => {
        const index = STRENGTH_LEVELS.indexOf(strength);
        return index === -1 ? 2 : index + 1; // 1-4
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

    const handleMenuToggle = (skillId: string) => {
        setOpenMenuId(openMenuId === skillId ? null : skillId);
    };

    const handleUpdateSkill = (skillId: string) => {
        const skillToUpdate = skillsList.find((s) => s.skillId === skillId);
        if (skillToUpdate) {
            setSelectedSkillForUpdate(skillToUpdate);
            setIsUpdateSkillModalOpen(true);
        }
        setOpenMenuId(null);
    };

    const handleArchiveSkill = async (skillId: string) => {
        try {
            setIsArchivingSkillId(skillId);
            setOpenMenuId(null);
            const response = await ProfileService.archiveSkill(skillId);

            if (response?.data?.skill) {
                removeSkillFromList(skillId);
            }

            setIsArchivingSkillId(null);
        } catch (error: any) {
            console.error('Failed to archive skill:', error);
            alert(error.message || 'Failed to archive skill');
            setIsArchivingSkillId(null);
        }
    };

    const handlePinSkill = async (skillId: string, isPinned: boolean) => {
        try {
            if (!isPinned && getPinnedCount() >= 2) {
                setIsPinLimitModalOpen(true);
                setOpenMenuId(null);
                return;
            }

            setIsPinningSkillId(skillId);
            setOpenMenuId(null);
            if (isPinned) {
                const response = await ProfileService.unpinSkill(skillId);

                if (response?.data?.skill) {
                    updatePinStatus(skillId, false);
                }
            } else {
                const pinnedCount = getPinnedCount();
                const response = await ProfileService.pinSkill(skillId, pinnedCount + 1);

                if (response?.data?.skill) {
                    updatePinStatus(skillId, true);
                }
            }

            setTimeout(async () => {
                await fetchSkillsData();
                setIsPinningSkillId(null);
            }, 300);
        } catch (error: any) {
            console.error('Failed to pin/unpin skill:', error);
            alert(error.message || 'Failed to update pin status');
            setIsPinningSkillId(null);
        }
    };

    const handleDeleteSkill = (skillId: string) => {
        const skill = skillsList.find(s => s.skillId === skillId);
        if (skill) {
            setSkillToDelete(skill);
            setIsDeleteConfirmModalOpen(true);
        }
        setOpenMenuId(null);
    };

    const handleDeleteSkillConfirm = async () => {
        if (!skillToDelete) return;

        try {
            setIsDeletingSkillId(skillToDelete.skillId);

            const response = await ProfileService.deleteSkill(skillToDelete.skillId);

            if (response) {
                removeSkillFromList(skillToDelete.skillId);

                setIsDeleteConfirmModalOpen(false);
                setSkillToDelete(null);
            }

            setIsDeletingSkillId(null);
        } catch (error: any) {
            console.error('Failed to delete skill:', error);
            alert(error.message || 'Failed to delete skill');
            setIsDeletingSkillId(null);
        }
    };

    const handleUpdateSkillConfirm = async (skillId: string, updatedData: UpdateSkillFormData) => {
        try {
            const response = await ProfileService.updateSkill(skillId, updatedData);

            if (response?.data?.skill) {
                updateSkillInList(skillId, updatedData);
                await fetchSkillsData();
            }
        } catch (error: any) {
            console.error('Failed to update skill:', error);
            alert(error.message || 'Failed to update skill');
        }
    };

    // ---- loading state ----
    if (isLoadingSkills) {
        return (
            <div
                className="rounded-3xl p-8 mb-6 shadow-sm"
                style={{ backgroundColor: TOKENS.sectionBg, border: `1px solid ${TOKENS.border}` }}
            >
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: TOKENS.accent }} />
                    <p className="text-sm" style={{ color: TOKENS.textSecondary }}>Loading skills…</p>
                </div>
            </div>
        );
    }

    // Public profile pe agar koi skill nahi, poora section hide
    if (!isOwnProfile && skillsList.length === 0) {
        return null;
    }

    const visibleSkills = showAllSkills ? skillsList : skillsList.slice(0, 2);
    const isEmpty = skillsList.length === 0;

    return (
        <>
            <div
                className="rounded-3xl p-6 mb-6 shadow-sm"
                style={{ backgroundColor: TOKENS.sectionBg, border: `1px solid ${TOKENS.border}` }}
            >
                {/* header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: TOKENS.accent }}
                        >
                            <Zap size={16} style={{ color: TOKENS.chipBg }} />
                        </div>
                        <div>
                            <h3 className="text-[16px] font-semibold leading-tight" style={{ color: TOKENS.textPrimary }}>
                                Skills
                            </h3>
                            <p className="text-[12px]" style={{ color: TOKENS.textSecondary }}>
                                Professional expertise
                            </p>
                        </div>
                    </div>

                    {isOwnProfile && (
                        <button
                            onClick={() => setIsAddSkillModalOpen(true)}
                            className="AddSkillButton flex items-center gap-1.5 text-[13px] font-medium rounded-full px-4 py-1.5 transition-colors"
                            style={{ backgroundColor: TOKENS.accent, color: TOKENS.chipBg }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = TOKENS.accentHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = TOKENS.accent)}
                        >
                            <Plus size={14} />
                            Add skill
                        </button>
                    )}
                </div>

                {/* empty state */}
                {isEmpty && isOwnProfile && (
                    <div
                        className="rounded-xl px-5 py-8 text-center"
                        style={{ border: `1px dashed ${TOKENS.border}` }}
                    >
                        <p className="text-[14px] font-medium mb-1" style={{ color: TOKENS.textPrimary }}>
                            Add your first skill
                        </p>
                        <p className="text-[12px] mb-4" style={{ color: TOKENS.textSecondary }}>
                            Skills help others find you for the right opportunities.
                        </p>
                        <button
                            onClick={() => setIsAddSkillModalOpen(true)}
                            className="text-[13px] font-medium rounded-full px-4 py-1.5"
                            style={{ backgroundColor: TOKENS.accent, color: TOKENS.chipBg }}
                        >
                            Add skill
                        </button>
                    </div>
                )}

                {/* skill cards */}
                {!isEmpty && (
                    <div className="flex flex-col gap-3">
                        {visibleSkills.map((skill) => {
                            const isLoading = isPinningSkillId === skill.skillId ||
                                isArchivingSkillId === skill.skillId ||
                                isDeletingSkillId === skill.skillId;
                            const level = getStrengthLevel(skill.skillStrength);

                            return (
                                <div
                                    key={skill.skillId}
                                    className={`group/skill relative rounded-2xl px-5 py-4 transition-colors ${openMenuId === skill.skillId ? 'z-50' : 'z-0'
                                        } ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
                                    style={{ backgroundColor: TOKENS.cardBg, border: `1px solid ${TOKENS.border}` }}
                                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = TOKENS.borderHover)}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = TOKENS.border)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <div
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                    style={{ backgroundColor: TOKENS.accent }}
                                                >
                                                    {isLoading ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: TOKENS.chipBg }} />
                                                    ) : (
                                                        <Zap size={16} style={{ color: TOKENS.chipBg }} />
                                                    )}
                                                </div>
                                                {skill.isPinned && !isLoading && (
                                                    <div
                                                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                                        style={{ backgroundColor: TOKENS.accentHover }}
                                                    >
                                                        <Pin className="w-2.5 h-2.5 fill-current" style={{ color: TOKENS.chipBg }} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <h4 className="text-[15px] font-semibold capitalize leading-tight truncate" style={{ color: TOKENS.textPrimary }}>
                                                    {skill.skillName}
                                                </h4>
                                                <p className="mt-0.5 text-[13px]" style={{ color: TOKENS.textSecondary }}>
                                                    {skill.category}
                                                </p>
                                            </div>
                                        </div>

                                        {isOwnProfile && (
                                            <div className="relative shrink-0">
                                                <button
                                                    onClick={() => handleMenuToggle(skill.skillId)}
                                                    className="rounded-lg p-1.5 transition-colors"
                                                    style={{ color: TOKENS.textSecondary }}
                                                    aria-label="Skill options"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>

                                                {openMenuId === skill.skillId && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-[9998]"
                                                            onClick={() => setOpenMenuId(null)}
                                                        ></div>

                                                        <div
                                                            className="absolute right-0 top-9 mt-1 w-52 rounded-xl py-1.5 z-[9999]"
                                                            style={{ backgroundColor: TOKENS.cardBg, border: `1px solid ${TOKENS.border}`, boxShadow: '0 8px 24px rgba(74,55,40,0.14)' }}
                                                        >
                                                            <button
                                                                onClick={() => handleUpdateSkill(skill.skillId)}
                                                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-[#F6EDE8] transition-colors"
                                                            >
                                                                <Edit className="w-4 h-4" style={{ color: TOKENS.accent }} />
                                                                <span className="text-[13px] font-medium" style={{ color: TOKENS.textPrimary }}>Update skill</span>
                                                            </button>

                                                            <button
                                                                onClick={() => handlePinSkill(skill.skillId, skill.isPinned)}
                                                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-[#F6EDE8] transition-colors"
                                                            >
                                                                <Pin className="w-4 h-4" style={{ color: TOKENS.accent }} />
                                                                <span className="text-[13px] font-medium" style={{ color: TOKENS.textPrimary }}>
                                                                    {skill.isPinned ? 'Unpin skill' : 'Pin skill'}
                                                                </span>
                                                            </button>

                                                            <button
                                                                onClick={() => handleArchiveSkill(skill.skillId)}
                                                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-[#F6EDE8] transition-colors"
                                                            >
                                                                <Archive className="w-4 h-4" style={{ color: TOKENS.accent }} />
                                                                <span className="text-[13px] font-medium" style={{ color: TOKENS.textPrimary }}>Archive skill</span>
                                                            </button>

                                                            <div className="h-px my-1.5" style={{ backgroundColor: TOKENS.border }}></div>

                                                            <button
                                                                onClick={() => handleDeleteSkill(skill.skillId)}
                                                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-[#FBEAE6] transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" style={{ color: TOKENS.danger }} />
                                                                <span className="text-[13px] font-medium" style={{ color: TOKENS.danger }}>Remove skill</span>
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-3.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-medium" style={{ color: TOKENS.accent }}>
                                                {getStrengthLabel(skill.skillStrength)}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {STRENGTH_LEVELS.map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className="h-1.5 w-5 rounded-full"
                                                        style={{ backgroundColor: i < level ? TOKENS.accent : TOKENS.chipBg }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <span
                                            className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                                            style={{ backgroundColor: TOKENS.chipBg, color: TOKENS.textOnChip }}
                                        >
                                            {skill.yearsOfExperience}+ {skill.yearsOfExperience === 1 ? 'Year' : 'Years'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {skillsList.length > 2 && (
                    <button
                        onClick={() => setShowAllSkills(!showAllSkills)}
                        className="showAllSkills mt-4 w-full rounded-xl py-2.5 text-[13px] font-medium transition-colors"
                        style={{ border: `1px solid ${TOKENS.border}`, color: TOKENS.accent }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = TOKENS.chipBg)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        {showAllSkills ? 'Show less' : 'Show more'}
                    </button>
                )}
            </div>

            {/* Modals sirf apni profile pe render honi chahiye */}
            {isOwnProfile && (
                <>
                    <AddSkillModal
                        isOpen={isAddSkillModalOpen}
                        onClose={() => setIsAddSkillModalOpen(false)}
                        onAddSkill={handleAddSkill}
                    />

                    <UpdateSkillModal
                        isOpen={isUpdateSkillModalOpen}
                        onClose={() => {
                            setIsUpdateSkillModalOpen(false);
                            setSelectedSkillForUpdate(undefined);
                        }}
                        onUpdateSkill={handleUpdateSkillConfirm}
                        skill={selectedSkillForUpdate}
                    />

                    <PinLimitModal
                        isOpen={isPinLimitModalOpen}
                        onClose={() => setIsPinLimitModalOpen(false)}
                    />

                    <DeleteSkillConfirmModal
                        isOpen={isDeleteConfirmModalOpen}
                        onClose={() => {
                            setIsDeleteConfirmModalOpen(false);
                            setSkillToDelete(null);
                        }}
                        onConfirm={handleDeleteSkillConfirm}
                        skillName={skillToDelete?.skillName || ''}
                        isDeleting={isDeletingSkillId === skillToDelete?.skillId}
                    />
                </>
            )}

            {/* View All Skills Modal - read-only, dono profiles pe theek hai */}
            <ViewAllSkillsModal
                isOpen={isViewAllSkillsModalOpen}
                onClose={() => setIsViewAllSkillsModalOpen(false)}
                skills={skillsList} />
        </>
    );
};

export default SkillsSection;