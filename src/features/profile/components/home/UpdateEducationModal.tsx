'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import z from 'zod';
import CollegeAutocomplete from '@/features/auth/components/CollegeAutocomplete';
import AuthService from '@/lib/api/auth.service';
import { useEducation } from '@/features/profile/hooks/useEducation';
import { packFutureDate } from '@/shared/utils/educationDateHelper';

interface UpdateEducationModalProps {
    isOpen: boolean;
    onClose: () => void;
    educationData?: EducationData | null;
    onSubmit?: (data: EducationData) => void;
}

export interface EducationData {
    educationId?: string;
    schoolCollegeName: string;
    degree: string;
    degreeType: 'High School' | 'Diploma' | "Bachelor's" | "Master's" | 'Doctorate' | 'Certificate' | 'Other';
    specialization?: string;
    startDate: string;
    endDate?: string | null;
    description?: string;
    educationType?: 'full-time' | 'part-time' | 'distance' | 'online';
    gradeType?: 'percentage' | 'cgpa' | 'gpa' | 'grade';
    gradeValue?: string;
    location?: string;
    isOngoing?: boolean;
    duration?: string;
}

// Zod validation schema for education
const educationSchema = z.object({
    schoolCollegeName: z.string()
        .min(2, 'School/College name must be at least 2 characters')
        .max(200, 'School/College name cannot exceed 200 characters')
        .regex(/^[A-Z0-9][a-zA-Z0-9\s\-'.&(),]+$/, 'School/College name must start with a capital letter or number'),

    degree: z.string()
        .min(2, 'Degree must be at least 2 characters')
        .max(100, 'Degree cannot exceed 100 characters')
        .regex(/^[A-Z0-9][a-zA-Z0-9\s\-.()]+$/, 'Degree must start with a capital letter or number'),

    degreeType: z.enum(
        ['High School', 'Diploma', "Bachelor's", "Master's", 'Doctorate', 'Certificate', 'Other'],
        { errorMap: () => ({ message: 'Please select a valid degree type' }) }
    ),

    specialization: z.string()
        .min(2, 'Specialization must be at least 2 characters')
        .max(150, 'Specialization cannot exceed 150 characters')
        .regex(/^[A-Z][a-zA-Z\s\-&(),]+$/, 'Specialization must start with a capital letter')
        .optional()
        .or(z.literal('')),

    startDate: z.string()
        .min(1, 'Start date is required')
        .refine((date) => {
            const year = new Date(date).getFullYear();
            return year >= 1970 && year <= new Date().getFullYear() + 5;
        }, 'Start date must be between 1970 and current year + 5'),

    endDate: z.string()
        .optional()
        .refine((date) => {
            if (!date) return true;
            const year = new Date(date).getFullYear();
            return year >= 1970 && year <= new Date().getFullYear() + 5;
        }, 'End date must be between 1970 and current year + 5')
        .or(z.literal('')),

    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(5000, 'Description cannot exceed 5000 characters')
        .optional()
        .or(z.literal('')),

    educationType: z.enum(['full-time', 'part-time', 'distance', 'online'])
        .optional(),

    gradeType: z.enum(['percentage', 'cgpa', 'gpa', 'grade'])
        .optional(),

    gradeValue: z.string()
        .max(20, 'Grade value cannot exceed 20 characters')
        .optional()
        .or(z.literal('')),

    location: z.string()
        .max(100, 'Location cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),
}).refine((data) => {
    if (data.endDate && data.startDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
}, {
    message: 'End date must be after start date',
    path: ['endDate'],
}).refine((data) => {
    if (data.gradeValue && !data.gradeType) {
        return false;
    }
    return true;
}, {
    message: 'Grade type is required when grade value is provided',
    path: ['gradeType'],
}).refine((data) => {
    if (data.gradeType && data.gradeValue) {
        const num = parseFloat(data.gradeValue);

        if (data.gradeType === 'percentage') {
            return !isNaN(num) && num >= 0 && num <= 100;
        } else if (data.gradeType === 'cgpa') {
            return !isNaN(num) && num >= 0 && num <= 10;
        } else if (data.gradeType === 'gpa') {
            return !isNaN(num) && num >= 0 && num <= 4;
        }
    }
    return true;
}, {
    message: 'Invalid grade value for selected grade type',
    path: ['gradeValue'],
});


const UpdateEducationModal: React.FC<UpdateEducationModalProps> = ({
    isOpen,
    onClose,
    educationData,
    onSubmit,
}) => {
    const [formData, setFormData] = useState<EducationData>({
        schoolCollegeName: '',
        degree: '',
        degreeType: 'Bachelor\'s',
        specialization: '',
        startDate: '',
        endDate: '',
        description: '',
        educationType: 'full-time',
        gradeType: undefined,
        gradeValue: '',
        location: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { editEducation } = useEducation();

    useEffect(() => {
        if (isOpen && educationData) {
            setFormData({
                educationId: educationData.educationId,
                schoolCollegeName: (educationData.schoolCollegeName || '').trim(),
                degree: (educationData.degree || '').trim(),
                degreeType: educationData.degreeType || "Bachelor's",
                specialization: (educationData.specialization || '').trim(),
                startDate: educationData.startDate || '',
                endDate: educationData.endDate || '',
                description: educationData.description || '',
                educationType: educationData.educationType || 'full-time',
                gradeType: educationData.gradeType,
                gradeValue: (educationData.gradeValue || '').trim(),
                location: (educationData.location || '').trim(),
            });
            setErrors({});
        }
    }, [isOpen, educationData]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validateForm = () => {
        try {
            const trimmedData = {
                ...formData,
                schoolCollegeName: formData.schoolCollegeName.trim(),
                degree: formData.degree.trim(),
                specialization: formData.specialization ? formData.specialization.trim() : '',
                description: formData.description ? formData.description.trim() : '',
                gradeValue: formData.gradeValue ? formData.gradeValue.trim() : '',
                location: formData.location ? formData.location.trim() : '',
            };
            educationSchema.parse(trimmedData);
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as string] = err.message;
                    }
                });
                setErrors(newErrors);
            }
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();


        if (!validateForm()) {
            return;
        }

        if (!formData.educationId) {
            console.error('❌ [DEBUG] No education ID found!');
            setErrors({ submit: 'Education ID is missing. Please close and reopen the modal.' });
            return;
        }

        setIsSubmitting(true);

        try {

            const trimmedData = {
                ...formData,
                schoolCollegeName: formData.schoolCollegeName.trim(),
                degree: formData.degree.trim(),
                specialization: formData.specialization ? formData.specialization.trim() : undefined,
                description: formData.description ? formData.description.trim() : undefined,
                gradeValue: formData.gradeValue ? formData.gradeValue.trim() : undefined,
                location: formData.location ? formData.location.trim() : undefined,
            };

            const apiData = {
                ...trimmedData,
                endDate: trimmedData.endDate || null,
            };


            const result = await editEducation(formData.educationId, apiData).unwrap();


            if (onSubmit) {
                onSubmit(formData);
            }

            onClose();
        } catch (error: any) {
            console.error('❌ [DEBUG] Full Error:', error);
            setErrors({
                submit: error.message || error || 'Failed to update education. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
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
            <div className="relative z-10 w-full max-w-2xl mx-auto max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 bg-gradient-to-r from-[#4a3728] to-[#6a5748] px-6 py-5 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Update Education</h2>
                        <p className="text-white/70 text-sm mt-1">Update your educational background</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200 disabled:opacity-50"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
                    <div className="space-y-6 pb-24">
                        {/* Error Message */}
                        {errors.submit && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {errors.submit}
                            </div>
                        )}

                        {/* Education Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#4a3728] flex items-center gap-2">
                                <span className="text-2xl">🎓</span> Education Details
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    College / University <span className="text-red-500">*</span>
                                </label>
                                <CollegeAutocomplete
                                    id="schoolCollegeName"
                                    name="schoolCollegeName"
                                    value={formData.schoolCollegeName}
                                    onChange={(v) =>
                                        handleChange({ target: { name: 'schoolCollegeName', value: v } } as React.ChangeEvent<HTMLInputElement>)
                                    }
                                    ariaInvalid={!!errors.schoolCollegeName}
                                    placeholder="e.g., IIT Bombay, LNCT Bhopal, MANIT"
                                    className={`w-full px-4 py-2 rounded-xl border-2 focus:outline-none transition-colors duration-200 text-[#4a3728] ${errors.schoolCollegeName
                                        ? 'border-red-500 bg-red-50 focus:border-red-600'
                                        : 'border-[#e0d8cf] bg-white/50 focus:border-[#4a3728]'
                                        }`}
                                />
                                {errors.schoolCollegeName && (
                                    <p className="text-red-500 text-xs mt-1">{errors.schoolCollegeName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Degree <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="degree"
                                    value={formData.degree}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 rounded-xl border-2 focus:outline-none transition-colors duration-200 text-[#4a3728] ${errors.degree
                                        ? 'border-red-500 bg-red-50 focus:border-red-600'
                                        : 'border-[#e0d8cf] bg-white/50 focus:border-[#4a3728]'
                                        }`}
                                >
                                </input>
                                {errors.degree && (
                                    <p className="text-red-500 text-xs mt-1">{errors.degree}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Degree Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="degreeType"
                                    value={formData.degreeType}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 rounded-xl border-2 focus:outline-none transition-colors duration-200 text-[#4a3728] ${errors.degreeType
                                        ? 'border-red-500 bg-red-50 focus:border-red-600'
                                        : 'border-[#e0d8cf] bg-white/50 focus:border-[#4a3728]'
                                        }`}
                                >
                                    <option value="">Select degree type</option>
                                    <option value="High School">High School</option>
                                    <option value="Diploma">Diploma</option>
                                    <option value="Bachelor's">Bachelor's</option>
                                    <option value="Master's">Master's</option>
                                    <option value="Doctorate">Doctorate (PhD)</option>
                                    <option value="Certificate">Certificate</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.degreeType && (
                                    <p className="text-red-500 text-xs mt-1">{errors.degreeType}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Field of Study <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="specialization"
                                    value={formData.specialization}
                                    onChange={handleChange}
                                    placeholder="e.g., Computer Science, Software Engineering"
                                    className={`w-full px-4 py-2 rounded-xl border-2 focus:outline-none transition-colors duration-200 text-[#4a3728] ${errors.specialization
                                        ? 'border-red-500 bg-red-50 focus:border-red-600'
                                        : 'border-[#e0d8cf] bg-white/50 focus:border-[#4a3728]'
                                        }`}
                                />
                                {errors.specialization && (
                                    <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>
                                )}
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Start Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 rounded-xl border-2 focus:outline-none transition-colors duration-200 text-[#4a3728] ${errors.startDate
                                        ? 'border-red-500 bg-red-50 focus:border-red-600'
                                        : 'border-[#e0d8cf] bg-white/50 focus:border-[#4a3728]'
                                        }`}
                                />
                                {errors.startDate && (
                                    <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
                                )}
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    End Date <span className="text-xs text-[#4a3728]/60">(Leave empty if ongoing)</span>
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                />
                                {errors.endDate && (
                                    <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
                                )}
                            </div>

                            {/* Education Type */}
                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Education Type
                                </label>
                                <select
                                    name="educationType"
                                    value={formData.educationType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                >
                                    <option value="full-time">Full-time</option>
                                    <option value="part-time">Part-time</option>
                                    <option value="distance">Distance</option>
                                    <option value="online">Online</option>
                                </select>
                            </div>

                            {/* Grade Type */}
                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Grade Type
                                </label>
                                <select
                                    name="gradeType"
                                    value={formData.gradeType || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                >
                                    <option value="">Select grade type</option>
                                    <option value="percentage">Percentage</option>
                                    <option value="cgpa">CGPA (0-10)</option>
                                    <option value="gpa">GPA (0-4)</option>
                                    <option value="grade">Grade (A+, First Class, etc.)</option>
                                </select>
                                {errors.gradeType && (
                                    <p className="text-red-500 text-xs mt-1">{errors.gradeType}</p>
                                )}
                            </div>

                            {/* Grade Value */}
                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Grade Value
                                </label>
                                <input
                                    type="text"
                                    name="gradeValue"
                                    value={formData.gradeValue}
                                    onChange={handleChange}
                                    placeholder="e.g., 8.75, 85%, A+"
                                    className={`w-full px-4 py-2 rounded-xl border-2 focus:outline-none transition-colors duration-200 text-[#4a3728] ${errors.gradeValue
                                        ? 'border-red-500 bg-red-50 focus:border-red-600'
                                        : 'border-[#e0d8cf] bg-white/50 focus:border-[#4a3728]'
                                        }`}
                                />
                                {errors.gradeValue && (
                                    <p className="text-red-500 text-xs mt-1">{errors.gradeValue}</p>
                                )}
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g., Mumbai, Maharashtra"
                                    className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Relevant coursework, projects, achievements..."
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 resize-none text-[#4a3728]"
                                />
                                {errors.description && (
                                    <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 flex gap-3 mt-8 pt-6 border-t border-[#e0d8cf] bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 rounded-full border-2 border-[#e0d8cf] text-[#4a3728] font-semibold hover:bg-[#f6ede8]/50 transition-colors duration-200 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-[#4a3728] to-[#6a5748] text-white font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Updating...' : 'Update Education'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateEducationModal;
