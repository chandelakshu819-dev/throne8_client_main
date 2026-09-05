'use client';

import { Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import ExperienceModal from './ExperienceModal';
import ShowAllExperiencesModal from './ShowAllExperiencesModal';
import Tooltip from '@/shared/uiComponents/Tooltip';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';

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

interface ExperienceSectionProps {
    experienceIds?: string[];
    userId?: string;
    isOwnProfile?: boolean;
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({
    experienceIds = [],
    userId,
    isOwnProfile = true,
}) => {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isShowAllModalOpen, setIsShowAllModalOpen] = useState<boolean>(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [isArchiving, setIsArchiving] = useState<boolean>(false);

    const [experiences, setExperiences] = useState<Experience[]>([]);

    const [company, setCompany] = useState<string>('');
    const [position, setPosition] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [isCurrent, setIsCurrent] = useState<boolean>(false);
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [achievementInput, setAchievementInput] = useState<string>('');
    const [achievementsList, setAchievementsList] = useState<string[]>([]);

    // ✅ FIX: array reference (experienceIds) pe depend karne ke bajaye
    // uske content (joined string) pe depend karo. Parent se agar
    // har render pe naya [] array aaye bhi to ye effect sirf tab
    // trigger hoga jab actual IDs badlein — infinite loop / 429 rate-limit
    // isi wajah se lag raha tha.
    const experienceIdsKey = (experienceIds || []).join(',');

    useEffect(() => {
        fetchExperiences();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [experienceIdsKey, userId, isOwnProfile]);

    // Lock background scroll while the delete-confirmation dialog is open
    useEffect(() => {
        if (isDeleteConfirmOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isDeleteConfirmOpen]);

    const fetchExperiences = async () => {
        try {
            setIsLoading(true);

            const response = isOwnProfile
                ? await ProfileService.getAllExperiences()
                : await ProfileService.getAllExperiencesByUserId(userId as string);

            const experiencesList = response.data.experiences || [];

            const transformedExperiences: Experience[] = experiencesList.map((exp: any) => {
                return {
                    experienceId: exp.experienceId,
                    company: exp.companyName,
                    position: exp.currentPosition,
                    period: exp.duration || formatPeriod(exp.startDate, exp.endDate),
                    current: exp.currentlyWorking,
                    description: exp.description,
                    achievements: exp.keyAchievements || [],
                    logo: exp.companyLogo || exp.logoUrl || '',
                    startDate: exp.startDate,
                    endDate: exp.endDate
                };
            });

            transformedExperiences.sort((a, b) =>
                (b.startDate || '9999').localeCompare(a.startDate || '9999')
            );

            setExperiences(transformedExperiences);

            if (transformedExperiences.length > 0) {
                setCurrentIndex(0);
            }
        } catch (error: any) {
            console.error('❌ Failed to fetch experiences:', error);
            setError(error.message || 'Failed to load experiences');
        } finally {
            setIsLoading(false);
        }
    };

    const formatPeriod = (start: string, end?: string) => {
        const startYear = new Date(start).getFullYear();
        const endYear = end ? new Date(end).getFullYear() : 'Present';
        return `${startYear} - ${endYear}`;
    };

    const addAchievement = (): void => {
        if (achievementInput.trim()) {
            if (achievementsList.length >= 10) {
                setError('Maximum 10 achievements allowed');
                return;
            }
            setAchievementsList([...achievementsList, achievementInput.trim()]);
            setAchievementInput('');
        }
    };

    const removeAchievement = (i: number): void => {
        setAchievementsList(achievementsList.filter((_, idx) => idx !== i));
    };

    const validateExperience = (): string | null => {
        if (!startDate) return 'Start date is required';
        const start = new Date(startDate);
        if (isNaN(start.getTime())) return 'Invalid start date';
        if (start > new Date()) return 'Start date cannot be in the future';

        if (!isCurrent) {
            if (!endDate) return 'End date is required when not currently working';
            const end = new Date(endDate);
            if (isNaN(end.getTime())) return 'Invalid end date';
            if (end < start) return 'End date must be after start date';
            if (end > new Date()) return 'End date cannot be in the future';
        }

        if (achievementsList.length > 10) return 'Maximum 10 achievements allowed';
        for (const achievement of achievementsList) {
            if (achievement.length < 5) return 'Each achievement must be at least 5 characters';
            if (achievement.length > 200) return 'Each achievement cannot exceed 200 characters';
        }

        return null;
    };

    const handleSaveExperience = async (): Promise<void> => {
        setError('');

        const validationError = validateExperience();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSaving(true);

        try {
            const payload = {
                currentPosition: position.trim(),
                companyName: company.trim(),
                description: description.trim(),
                startDate: startDate,
                endDate: isCurrent ? undefined : endDate,
                currentlyWorking: isCurrent,
                keyAchievements: achievementsList.length > 0 ? achievementsList : undefined,
            };

            let response;

            if (isEditing) {
                const experienceId = experiences[currentIndex].experienceId;
                response = await ProfileService.updateExperience(experienceId, payload);

                const updatedExperience: Experience = {
                    experienceId: response.data.experience.experienceId,
                    company: response.data.experience.companyName,
                    position: response.data.experience.currentPosition,
                    period: response.data.experience.duration || formatPeriod(response.data.experience.startDate, response.data.experience.endDate),
                    current: response.data.experience.currentlyWorking,
                    description: response.data.experience.description,
                    achievements: response.data.experience.keyAchievements || [],
                    logo: logoUrl || experiences[currentIndex].logo,
                    startDate: response.data.experience.startDate,
                    endDate: response.data.experience.endDate
                };

                const updatedExperiences = [...experiences];
                updatedExperiences[currentIndex] = updatedExperience;

                updatedExperiences.sort((a, b) =>
                    (b.startDate || '9999').localeCompare(a.startDate || '9999')
                );

                setExperiences(updatedExperiences);

                const newIndex = updatedExperiences.findIndex(e => e.experienceId === updatedExperience.experienceId);
                setCurrentIndex(newIndex);

            } else {
                response = await ProfileService.createExperience(payload);

                const newExperience: Experience = {
                    experienceId: response.data.experience.experienceId,
                    company: response.data.experience.companyName,
                    position: response.data.experience.currentPosition,
                    period: response.data.experience.duration || formatPeriod(response.data.experience.startDate, response.data.experience.endDate),
                    current: response.data.experience.currentlyWorking,
                    description: response.data.experience.description,
                    achievements: response.data.experience.keyAchievements || [],
                    logo: logoUrl || '',
                    startDate: response.data.experience.startDate,
                    endDate: response.data.experience.endDate
                };

                const updatedExperiences = [...experiences, newExperience].sort((a, b) =>
                    (b.startDate || '9999').localeCompare(a.startDate || '9999')
                );

                setExperiences(updatedExperiences);
                setCurrentIndex(updatedExperiences.findIndex(e => e.experienceId === newExperience.experienceId));
            }

            resetForm();
            setIsModalOpen(false);
            setIsEditing(false);

        } catch (error: any) {
            console.error('❌ Failed to save experience:', error);
            setError(error.message || 'Failed to save experience. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setCompany('');
        setPosition('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setIsCurrent(false);
        setLogoUrl('');
        setAchievementsList([]);
        setAchievementInput('');
        setError('');
        setIsEditing(false);
    };

    const handleDeleteExperience = async (): Promise<void> => {
        if (!currentExp) return;
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteExperience = async (): Promise<void> => {
        if (!currentExp) return;

        setIsDeleting(true);
        setError('');

        try {
            await ProfileService.deleteExperience(currentExp.experienceId);

            const updatedExperiences = experiences.filter(
                (_, idx) => idx !== currentIndex
            );
            setExperiences(updatedExperiences);
            setCurrentIndex(updatedExperiences.length > 0 ? 0 : 0);

            setIsDeleteConfirmOpen(false);
        } catch (error: any) {
            console.error('❌ Delete failed:', error);
            setError(error.message || 'Failed to delete experience');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleArchiveExperience = async (): Promise<void> => {
        if (!currentExp) return;

        setIsArchiving(true);
        setError('');

        try {
            await ProfileService.archiveExperience(currentExp.experienceId);

            const updatedExperiences = experiences.filter(
                (_, idx) => idx !== currentIndex
            );
            setExperiences(updatedExperiences);
            setCurrentIndex(updatedExperiences.length > 0 ? 0 : 0);

        } catch (error: any) {
            console.error('❌ Archive failed:', error);
            setError(error.message || 'Failed to archive experience');
        } finally {
            setIsArchiving(false);
        }
    };

    if (isLoading) {
        return null;
    }

    if (experiences.length === 0) {
        if (!isOwnProfile) {
            return null;
        }

        return (
            <div className='max-w-4/6 ml-5 min-w-0'>
                <div className="bg-gradient-to-br from-[#f6ede8] to-[#f0e6d8] backdrop-blur-md rounded-2xl p-12 shadow-2xl border border-[#e0d8cf]/50 mb-8 min-h-[400px] flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="mb-6 flex justify-center">
                            <div className="p-4 bg-[#4a3728]/10 rounded-full">
                                <svg className="w-16 h-16 text-[#4a3728]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4m0 2a2 2 0 11-4 0m4 0a2 2 0 1 1-4 0m0 0h.01M12 15h.01M4 6V4m0 2a2 2 0 11-4 0m4 0a2 2 0 1 1-4 0m0 0H4" />
                                </svg>
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-[#4a3728] mb-3">No Experience Added Yet</h3>
                        <p className="text-sm text-[#8b6f47] mb-2 leading-relaxed">
                            Start building your professional journey by adding your work experience. Showcase your skills, achievements, and career growth.
                        </p>
                        <p className="text-xs text-[#8b6f47]/60 mb-8">
                            Click below to add your first experience entry
                        </p>

                        <button
                            onClick={() => {
                                resetForm();
                                setIsModalOpen(true);
                            }}
                            className="createExopenCreateModal w-full px-8 py-3 bg-[#4a3728] text-[#f6ede8] rounded-lg hover:bg-[#6b5038] transition-all duration-300 shadow-lg font-semibold text-sm mb-3 flex items-center justify-center gap-2 hover:shadow-xl hover:scale-[1.02]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Your First Experience
                        </button>

                        <div className="mt-6 p-3 bg-[#4a3728]/5 rounded-lg border border-[#8b6f47]/20">
                            <p className="text-xs text-[#6b5038]">
                                💡 <span className="font-semibold">Tip:</span> Include job title, company, dates, and key achievements to stand out.
                            </p>
                        </div>
                    </div>
                </div>

                <ExperienceModal
                    isOpen={isModalOpen}
                    isEditing={isEditing}
                    error={error}
                    company={company}
                    position={position}
                    description={description}
                    startDate={startDate}
                    endDate={endDate}
                    isCurrent={isCurrent}
                    logoUrl={logoUrl}
                    achievementInput={achievementInput}
                    achievementsList={achievementsList}
                    isSaving={isSaving}
                    onClose={() => {
                        setIsModalOpen(false);
                        resetForm();
                    }}
                    onSave={handleSaveExperience}
                    onCompanyChange={setCompany}
                    onPositionChange={setPosition}
                    onDescriptionChange={setDescription}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onIsCurrentChange={setIsCurrent}
                    onLogoUrlChange={setLogoUrl}
                    onAchievementInputChange={setAchievementInput}
                    onAddAchievement={addAchievement}
                    onRemoveAchievement={removeAchievement}
                    onAchievementKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                />
            </div>
        );
    }

    const currentExp = experiences[currentIndex];

    return (
        <div className='max-w-4/6 ml-5 min-w-0'>
            <div className="bg-[#f6ede8]/80 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-[#e0d8cf]/50 mb-8 min-w-0">

                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-[#4a3728] mb-1">Experience</h3>
                        <p className="text-xs text-[#8b6f47]">Professional Journey ({currentIndex + 1}/{experiences.length})</p>
                    </div>
                    {isOwnProfile && (
                        <div className="flex gap-2">
                            <Tooltip text="Add New Experience">
                                <button
                                    onClick={() => {
                                        resetForm();
                                        setIsModalOpen(true);
                                    }}
                                    className={`p-1.5 rounded-lg transition-all duration-300 shadow-lg bg-[#4a3728] text-[#f6ede8] hover:bg-[#6b5038]`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </Tooltip>

                            <Tooltip text="Update Experience">
                                <button
                                    onClick={() => {
                                        setIsEditing(true);
                                        setIsModalOpen(true);
                                        setCompany(currentExp.company);
                                        setPosition(currentExp.position);
                                        setDescription(currentExp.description);
                                        setStartDate(currentExp.startDate.split('T')[0]);
                                        setEndDate(currentExp.current ? '' : (
                                            currentExp.endDate ? currentExp.endDate.split('T')[0] : '')
                                        );
                                        setIsCurrent(currentExp.current);
                                        setLogoUrl(currentExp.logo);
                                        setAchievementsList(currentExp.achievements);
                                    }}
                                    className="updateExperienceBypencile p-1.5 rounded-lg bg-[#4a3728] text-[#f6ede8] hover:bg-[#6b5038] transition-all duration-300 shadow-lg hover:scale-110"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m1 1l6 6-6 6-6-6 6-6z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3l5 5M3 21v-4l12-12 4 4-12 12H3z" />
                                    </svg>
                                </button>
                            </Tooltip>

                            <Tooltip text="Delete Experience">
                                <button
                                    onClick={handleDeleteExperience}
                                    disabled={isDeleting}
                                    className="p-1.5 rounded-lg bg-[#4a3728] text-[#f6ede8] hover:bg-red-700 transition-all duration-300 shadow-lg hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete current experience"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                                        </svg>
                                    )}
                                </button>
                            </Tooltip>

                            <Tooltip text="Archive Experience">
                                <button
                                    onClick={handleArchiveExperience}
                                    disabled={isArchiving}
                                    className="p-1.5 rounded-lg bg-[#4a3728] text-[#f6ede8] hover:bg-[#6b5038] transition-all duration-300 shadow-lg hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Archive current experience"
                                >
                                    {isArchiving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-5-3v2m0 0v2" />
                                        </svg>
                                    )}
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-5 gap-3 min-w-0">
                    <div className="col-span-2 relative min-w-0">
                        <div className="space-y-10 relative">
                            {experiences.slice(0, 3).map((exp, i) => {
                                const active = i === currentIndex;
                                const isLastItem = i === Math.min(experiences.length, 3) - 1;
                                return (
                                    <div
                                        key={exp.experienceId}
                                        className="flex items-center gap-5 group cursor-pointer min-w-0 relative"
                                        onClick={() => setCurrentIndex(i)}
                                    >
                                        {/* ✅ Continuous connecting line to next item center (stops at last item circle) */}
                                        {!isLastItem && (
                                            <div className="absolute left-5 top-5 bottom-0 -mb-10 w-0.5 -translate-x-1/2 bg-gradient-to-b from-[#4a3728] via-[#8b6f47] to-[#d4c4b5] z-0"></div>
                                        )}

                                        <div className="relative z-10 flex-shrink-0">
                                            <div
                                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-md ${
                                                    active
                                                        ? 'bg-gradient-to-br from-[#4a3728] via-[#5c4634] to-[#7a5c3e] border-[#f6ede8] text-[#f6ede8] scale-110 shadow-xl'
                                                        : 'bg-[#f6ede8] border-[#4a3728]/30 text-[#4a3728] hover:border-[#4a3728] group-hover:scale-105'
                                                }`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 21h18M3 7v14M21 7v14M6 21V7a2 2 0 012-2h8a2 2 0 012 2v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
                                                </svg>
                                            </div>
                                        </div>

                                        <div className={`transition-all duration-500 min-w-0 ${active ? 'translate-y-0' : 'translate-y-1'}`}>
                                            <h4
                                                className={`font-bold text-sm leading-tight break-words ${active ? 'text-[#4a3728]' : 'text-[#8b6f47]/80 group-hover:text-[#6b5038]'
                                                    }`}
                                            >
                                                {exp.company.split(' (')[0]}
                                            </h4>
                                            {exp.company.includes('(') && (
                                                <p className="text-xs font-medium text-[#8b6f47]/70 break-words">
                                                    ({exp.company.split(' (')[1].replace(')', '')})
                                                </p>
                                            )}
                                            <p
                                                className={`text-xs font-semibold mt-1 ${active ? 'text-[#6b5038]' : 'text-[#8b6f47]/60'
                                                    }`}
                                            >
                                                {exp.period}
                                            </p>
                                            {exp.current && (
                                                <div className="mt-2 inline-block px-3 py-1 bg-[#4a3728] text-[#f6ede8] text-xs font-bold rounded-full shadow-lg">
                                                    Current
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {experiences.length > 3 && (
                                <button
                                    onClick={() => setIsShowAllModalOpen(true)}
                                    className="w-full mt-6 py-3 px-4 bg-[#4a3728]/10 border-2 border-[#4a3728] text-[#4a3728] rounded-lg font-bold text-sm hover:bg-[#4a3728] hover:text-[#f6ede8] transition-all duration-300 shadow-md"
                                >
                                    Show All ({experiences.length})
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="col-span-3 space-y-3 min-w-0">
                        <div className="bg-[#e0d8cf]/70 rounded-lg p-3 border border-[#d4c4b5] shadow-md">
                            <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-xs font-bold text-[#4a3728] uppercase">Company</h5>
                            </div>
                            <p className="text-sm font-bold text-[#6b5038] break-words">{currentExp.company}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <svg className="w-3 h-3 text-[#8b6f47] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs text-[#8b6f47] font-semibold">{currentExp.period}</span>
                                {currentExp.current && (
                                    <span className="ml-2 px-2 py-0.5 bg-[#4a3728] text-[#f6ede8] text-xs font-bold rounded-full">
                                        Current
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="bg-[#e0d8cf]/70 rounded-lg p-3 border border-[#d4c4b5] shadow-md">
                            <h5 className="text-xs font-bold text-[#4a3728] uppercase mb-2">Position</h5>
                            <p className="text-lg font-black text-[#4a3728] break-words">{currentExp.position}</p>
                        </div>

                        <div className="bg-[#e0d8cf]/70 rounded-lg p-3 border border-[#d4c4b5] shadow-md">
                            <h5 className="text-xs font-bold text-[#4a3728] uppercase mb-2">Role Overview</h5>
                            <p className="text-[#4a3728]/70 text-xs leading-relaxed break-words whitespace-pre-wrap">
                                {currentExp.description}
                            </p>
                        </div>

                        <div className="bg-[#e0d8cf]/70 rounded-lg p-3 border border-[#d4c4b5] shadow-md">
                            <h5 className="text-xs font-bold text-[#4a3728] uppercase mb-2">Key Achievements</h5>
                            <div className="space-y-1.5">
                                {currentExp.achievements.map((a, i) => (
                                    <div key={i} className="flex items-start gap-2 group min-w-0">
                                        <svg
                                            className="w-3 h-3 text-[#8b6f47] group-hover:translate-x-1 transition-transform flex-shrink-0 mt-0.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="text-xs text-[#4a3728]/70 font-medium break-words">{a}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isOwnProfile && (
                <>
                    <ExperienceModal
                        isOpen={isModalOpen}
                        isEditing={isEditing}
                        error={error}
                        company={company}
                        position={position}
                        description={description}
                        startDate={startDate}
                        endDate={endDate}
                        isCurrent={isCurrent}
                        logoUrl={logoUrl}
                        achievementInput={achievementInput}
                        achievementsList={achievementsList}
                        isSaving={isSaving}
                        onClose={() => {
                            setIsModalOpen(false);
                            resetForm();
                        }}
                        onSave={handleSaveExperience}
                        onCompanyChange={setCompany}
                        onPositionChange={setPosition}
                        onDescriptionChange={setDescription}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        onIsCurrentChange={setIsCurrent}
                        onLogoUrlChange={setLogoUrl}
                        onAchievementInputChange={setAchievementInput}
                        onAddAchievement={addAchievement}
                        onRemoveAchievement={removeAchievement}
                        onAchievementKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                    />

                    {isDeleteConfirmOpen && currentExp && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-gradient-to-br from-[#f6ede8] to-[#f0e6d8] rounded-2xl shadow-2xl border border-[#e0d8cf] max-w-md w-full">
                                <div className="bg-[#f6ede8] border-b border-[#e0d8cf] px-6 py-4">
                                    <h3 className="text-xl font-bold text-[#4a3728] flex items-center gap-2">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4H8a2 2 0 01-2-2V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2h-4m-6-4h.01M9 16h.01" />
                                        </svg>
                                        Delete Experience?
                                    </h3>
                                </div>

                                <div className="px-6 py-5">
                                    <p className="text-[#4a3728] text-sm font-medium leading-relaxed mb-4">
                                        Are you sure you want to permanently delete "<span className="font-bold">{currentExp.company}</span>" experience? This action cannot be undone.
                                    </p>
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-xs flex items-start gap-2">
                                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            <span>{error}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-[#f0e6d8] border-t border-[#e0d8cf] px-6 py-4 flex gap-3">
                                    <button
                                        onClick={() => setIsDeleteConfirmOpen(false)}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2.5 bg-[#e0d8cf] text-[#4a3728] rounded-lg font-semibold text-sm hover:bg-[#d4c4b5] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteExperience}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Yes, Delete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <ShowAllExperiencesModal
                isOpen={isShowAllModalOpen}
                experiences={experiences}
                onClose={() => setIsShowAllModalOpen(false)}
                onSelectExperience={(index) => setCurrentIndex(index)}
            />
        </div>
    );
};

export default ExperienceSection;