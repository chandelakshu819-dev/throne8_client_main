// src/profile/components/EducationSection.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { GraduationCap, Calendar, MapPin, Award, BookOpen, Loader2 } from 'lucide-react';
import AddEducationModal, { EducationData } from './AddEducationModal';
import UpdateEducationModal from './UpdateEducationModal';
import EducationMenuPopup from './EducationMenuPopup';
import SelectEducationModal from './SelectEducationModal';
import ProfileService from '@/lib/api/profile.service';
import { useEducation } from '@/features/profile/hooks/useEducation';
import { unpackFutureDate } from '@/shared/utils/educationDateHelper';

interface EducationSectionProps {
    collegeName?: string;
    degree?: string;
    fieldOfStudy?: string;
    graduationYear?: string;
    userId?: string;          // ✅ NAYA PROP - target user ka id
    isOwnProfile?: boolean;   // ✅ NAYA PROP
}

const EducationSection: React.FC<EducationSectionProps> = ({
    collegeName = '',
    degree = '',
    fieldOfStudy = '',
    graduationYear = '',
    userId,
    isOwnProfile = true, // ✅ default true - purana behavior nahi tootega
}) => {
    const [isAddEducationModalOpen, setIsAddEducationModalOpen] = useState(false);
    const [isUpdateEducationModalOpen, setIsUpdateEducationModalOpen] = useState(false);
    const [isSelectEducationModalOpen, setIsSelectEducationModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [showAllEducation, setShowAllEducation] = useState(false);


    // ✅ Apni profile ke liye redux hook (purana behavior)
    const {
        educationList: ownEducationList,
        isLoadingEducation: isLoadingOwnEducation,
        loadEducation,
        selectEducation,
        selectedEducation,
    } = useEducation();

    // ✅ Dusre user ki profile ke liye local state (public, read-only)
    const [publicEducationList, setPublicEducationList] = useState<any[]>([]);
    const [isLoadingPublicEducation, setIsLoadingPublicEducation] = useState(true);

    // ✅ Jo bhi list actually render honi hai, wo profile type ke hisaab se
    const educationList = isOwnProfile ? ownEducationList : publicEducationList;
    const isLoadingEducation = isOwnProfile ? isLoadingOwnEducation : isLoadingPublicEducation;

    useEffect(() => {
    }, [selectedEducation]);

    useEffect(() => {
        if (isOwnProfile) {
            loadEducation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOwnProfile]);

    const fetchPublicEducation = async () => {
        if (!userId) return;
        try {
            setIsLoadingPublicEducation(true);
            const response = await ProfileService.getAllEducationByUserId(userId, false);
            setPublicEducationList(response?.data?.educationList || response?.data?.education || []);
        } catch (error: any) {
            console.error('❌ Failed to fetch public education:', error);
            setPublicEducationList([]);
        } finally {
            setIsLoadingPublicEducation(false);
        }
    };

    useEffect(() => {
        if (!isOwnProfile && userId) {
            fetchPublicEducation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOwnProfile, userId]);

    const hasOnboardingEducation =
        collegeName || degree || fieldOfStudy || graduationYear;

    const handleAddEducation = async (data: EducationData) => {
        await loadEducation();
    };

    const handleUpdateEducation = (education: any) => {
        selectEducation(education);
        setIsUpdateEducationModalOpen(true);
    };

    const handleOpenSelectEducationModal = () => {
        if (educationList.length === 0) {
            if (hasOnboardingEducation) {
                setIsAddEducationModalOpen(true);
            }
            return;
        } else if (educationList.length === 1) {
            handleUpdateEducation(educationList[0]);
        } else {
            setIsSelectEducationModalOpen(true);
        }
    };

    const handleEducationUpdated = async (data: EducationData) => {
        setIsUpdateEducationModalOpen(false);
    };

    const handleUpdateEducationSubmit = async (data: EducationData) => {
        await loadEducation();
    };

    // ✅ Public profile pe agar koi education nahi, poora section hide
    if (!isOwnProfile && !isLoadingEducation && educationList.length === 0) {
        return null;
    }

    return (
        // ✅ FIX: min-w-0 so this whole section can never force the page
        // wider than the viewport when a long college name / description
        // is present (only affected profiles with long text, like Nisita's).
        <div className="relative min-w-0">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-[#4a3728]/10 to-[#8b7355]/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-to-tr from-[#f6ede8]/60 to-[#e0d8cf]/60 rounded-full blur-lg"></div>
            <div className="relative bg-gradient-to-br via-[#f6ede8]/80 to-[#e0d8cf]/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-[#e0d8cf]/40 mb-8 overflow-hidden min-w-0">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                    <div className="w-full h-full bg-[#284a2d] transform rotate-45 rounded-2xl"></div>
                </div>
                <div className="relative z-10 mb-8 flex justify-between items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-3 mb-3 min-w-0">
                        <div className="p-3 bg-gradient-to-br from-[#4a3728] to-[#8b7355] rounded-xl shadow-lg flex-shrink-0">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#4a3728] tracking-tight">Education</h3>
                    </div>

                    {/* ✅ Action buttons sirf apni profile pe */}
                    {isOwnProfile && (
                        <div className="flex gap-3 items-center flex-wrap">
                            <button
                                onClick={() => setIsAddEducationModalOpen(true)}
                                className="AddEducationButton group px-6 py-3 bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] text-[#f6ede8] rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center gap-3 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#7a5c3e] to-[#4a3728] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <svg className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span className="relative z-10">Add Education</span>
                            </button>
                            <button
                                onClick={handleOpenSelectEducationModal}
                                className="UpdateEducationButton group px-6 py-3 bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] text-[#f6ede8] rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center gap-3 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                                disabled={educationList.length === 0 && !hasOnboardingEducation}
                                title={educationList.length === 0 && !hasOnboardingEducation ? "Add education first to update" : "Update your education"}>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#7a5c3e] to-[#4a3728] opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition-opacity duration-300"></div>
                                <svg className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span className="relative z-10">Update Education</span>
                            </button>
                        </div>
                    )}
                </div>
                <div className="relative group min-w-0">

                    {/* Loading State */}
                    {isLoadingEducation ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a3728]"></div>
                            <p className="mt-2 text-[#4a3728]/60">Loading education...</p>
                        </div>
                    ) : educationList.length === 0 ? (
                        // ✅ Ye branch ab sirf isOwnProfile ke liye chalega
                        // (public profile pe upar hi return null ho chuka hai agar empty hai)
                        hasOnboardingEducation ? (
                            <div className="relative group min-w-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl animate-pulse"></div>
                                <div className="relative bg-gradient-to-br from-white/80 via-blue-50/50 to-purple-50/50 backdrop-blur-sm rounded-2xl p-8 border-2 border-dashed border-[#4a3728]/30 hover:border-[#4a3728]/60 transition-all duration-300 min-w-0">
                                    <div className="text-center space-y-4 min-w-0">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4a3728] to-[#8b7355] rounded-full shadow-lg mb-2">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>

                                        <h4 className="text-2xl font-bold text-[#4a3728]">
                                            Complete Your Education Profile
                                        </h4>

                                        <p className="text-[#4a3728]/70 max-w-md mx-auto leading-relaxed break-words">
                                            We noticed you have education details in your profile.
                                            <span className="font-semibold text-[#8b7355]"> Complete your education journey</span> to unlock opportunities and enhance your professional presence.
                                        </p>

                                        {/* Preview Card */}
                                        <div className="bg-white/60 rounded-xl p-4 border border-[#e0d8cf]/50 max-w-sm mx-auto mt-4 min-w-0">
                                            <div className="text-left space-y-2 min-w-0">
                                                <div className="flex items-start gap-2 text-sm flex-wrap min-w-0">
                                                    <span className="font-semibold text-[#4a3728] flex-shrink-0">🎓 Degree:</span>
                                                    <span className="text-[#4a3728]/80 break-words min-w-0">{degree || 'Not specified'}</span>
                                                </div>
                                                <div className="flex items-start gap-2 text-sm flex-wrap min-w-0">
                                                    <span className="font-semibold text-[#4a3728] flex-shrink-0">🏛️ Institution:</span>
                                                    <span className="text-[#4a3728]/80 break-words min-w-0">{collegeName || 'Not specified'}</span>
                                                </div>
                                                <div className="flex items-start gap-2 text-sm flex-wrap min-w-0">
                                                    <span className="font-semibold text-[#4a3728] flex-shrink-0">📚 Field:</span>
                                                    <span className="text-[#4a3728]/80 break-words min-w-0">{fieldOfStudy || 'Not specified'}</span>
                                                </div>
                                                <div className="flex items-start gap-2 text-sm flex-wrap min-w-0">
                                                    <span className="font-semibold text-[#4a3728] flex-shrink-0">📅 Year:</span>
                                                    <span className="text-[#4a3728]/80 break-words min-w-0">{graduationYear || 'Not specified'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setIsAddEducationModalOpen(true)}
                                            className="CompleteEducationButton group relative mt-6 px-8 py-4 bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-[#8b7355] to-[#4a3728] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <span className="relative z-10 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Complete Education Profile
                                            </span>
                                        </button>

                                        <p className="text-xs text-[#4a3728]/50 mt-3">
                                            ✨ Stand out to recruiters and grow your professional network
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-[#4a3728]/60">No education records found. Click "Add Education" to add one.</p>
                            </div>
                        )
                    ) : (
                        <div className="space-y-4 min-w-0">
                            
                            {(showAllEducation ? educationList : educationList.slice(0, 2)).map((rawEducation: any) => {         
                                const education = unpackFutureDate(rawEducation);
                                return (
                                    <div key={education.educationId} className="relative group min-w-0">

                                    <div
                                        className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-2xl min-w-0"
                                    >
                                        <div className="flex justify-between items-start gap-3 flex-wrap">
                                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#4a3728] to-[#784836] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg mb-4 break-words">
                                                <Award className="w-4 h-4 flex-shrink-0" />
                                                {education.degreeType}
                                            </div>
                                            {/* ✅ 3-dot menu (delete/archive) sirf apni profile pe */}
                                            {isOwnProfile && (
                                                <>
                                                                                                        <button
                                                        onClick={() => setOpenMenuId(openMenuId === education.educationId ? null : education.educationId)}
                                                        className="threeDots inline-flex items-center gap-2 bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] text-white px-3 py-2 rounded-full text-sm font-semibold shadow-lg mb-4 hover:shadow-xl transition-all duration-200 flex-shrink-0">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                                        </svg>
                                                    </button>
                                                    {openMenuId === education.educationId && (
                                                        <EducationMenuPopup
                                                            educationId={education.educationId}
                                                            isOpen={openMenuId === education.educationId}
                                                            onClose={() => setOpenMenuId(null)}
                                                            onEducationDeleted={() => {
                                                                setOpenMenuId(null);
                                                                loadEducation();
                                                            }}
                                                            onEducationArchived={() => {
                                                                setOpenMenuId(null);
                                                                loadEducation();
                                                            }}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <div className="space-y-4 min-w-0">
                                            <div className="min-w-0">
                                                {/* ✅ FIX: break-words — degree + specialization can be a
                                                    long unbroken string on some profiles */}
                                                <h4 className="text-xl font-bold text-[#4a3728] mb-2 group-hover:text-[#8b7355] transition-colors duration-300 break-words">
                                                    {education.degree} {education.specialization && `in ${education.specialization}`}
                                                </h4>
                                                <div className="flex flex-wrap gap-4 text-[#4a3728]/80 mb-3 min-w-0">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <MapPin className="w-4 h-4 text-[#8b7355] flex-shrink-0" />
                                                        {/* ✅ FIX: break-words — a long college/school name
                                                            (this is exactly the field that differs between
                                                            profiles like Nisita's vs Ankit's) was the main
                                                            trigger for the horizontal scrollbar here */}
                                                        <span className="text-sm font-medium break-words min-w-0">{education.schoolCollegeName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Calendar className="w-4 h-4 text-[#8b7355] flex-shrink-0" />
                                                        <span className="text-sm font-medium break-words min-w-0">
                                                            {new Date(education.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                            {' - '}
                                                            {education.isOngoing
                                                                ? 'Present'
                                                                : new Date(education.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                                            }
                                                            {' '}({education.duration})
                                                        </span>
                                                    </div>
                                                    {education.location && (
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <MapPin className="w-4 h-4 text-[#8b7355] flex-shrink-0" />
                                                            <span className="text-sm font-medium break-words min-w-0">{education.location}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {education.description && (
                                                <div className="bg-[#f6ede8]/70 rounded-xl p-4 border border-[#e0d8cf]/50 min-w-0">
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <BookOpen className="w-5 h-5 text-[#8b7355] mt-0.5 flex-shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <h5 className="font-semibold text-[#4a3728] mb-1">Description</h5>
                                                            {/* ✅ FIX: break-words — long, unbroken description
                                                                text was another possible overflow source */}
                                                            <p className="text-sm text-[#4a3728]/80 leading-relaxed break-words">
                                                                {education.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {education.educationType && (
                                                    <span className="px-3 py-1 bg-[#4a3728]/10 text-[#4a3728] text-xs font-medium rounded-full border border-[#4a3728]/20 break-words">
                                                        {education.educationType}
                                                    </span>
                                                )}
                                                {education.gradeType && education.gradeValue && (
                                                    <span className="px-3 py-1 bg-[#8b7355]/10 text-[#8b7355] text-xs font-medium rounded-full border border-[#8b7355]/20 break-words">
                                                        {education.gradeType}: {education.gradeValue}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );

                        })}

                        {educationList.length > 2 && (
                            <div className="flex justify-center pt-2">
                                <button
                                    onClick={() => setShowAllEducation(!showAllEducation)}
                                    className="px-6 py-2.5 bg-white/60 hover:bg-white/90 text-[#4a3728] rounded-full text-sm font-semibold border border-[#e0d8cf]/60 shadow-md hover:shadow-lg transition-all duration-300"
                                >
                                    {showAllEducation ? 'Show Less' : `Show More (${educationList.length - 2} more)`}
                                </button>
                            </div>
                        )}
                        </div>
                    )}
                      


                </div>
            </div>

            {/* ✅ Modals sirf apni profile pe render karo */}
            {isOwnProfile && (
                <>
                    <AddEducationModal
                        isOpen={isAddEducationModalOpen}
                        onClose={() => setIsAddEducationModalOpen(false)}
                        onSubmit={handleAddEducation}
                        prefillData={{
                            collegeName: collegeName,
                            degree: degree,
                            fieldOfStudy: fieldOfStudy,
                            graduationYear: graduationYear
                        }}
                    />

                    <SelectEducationModal
                        isOpen={isSelectEducationModalOpen}
                        onClose={() => setIsSelectEducationModalOpen(false)}
                        educationList={educationList}
                        onSelectEducation={(education) => {
                            handleUpdateEducation(education);
                        }}
                    />

                    <UpdateEducationModal
                        isOpen={isUpdateEducationModalOpen}
                        onClose={() => {
                            setIsUpdateEducationModalOpen(false);
                            selectEducation(null);
                        }}
                        educationData={selectedEducation}
                        onSubmit={handleUpdateEducationSubmit}
                    />
                </>
            )}
        </div>
    );
};

export default EducationSection;