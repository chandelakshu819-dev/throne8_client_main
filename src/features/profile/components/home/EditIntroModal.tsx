'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, GraduationCap, MapPin } from 'lucide-react';
import z from 'zod';
import AuthService from '@/lib/api/auth.service';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { updateProfileSchema } from '../../validators/profile.validation';

const HEADLINE_VALIDATION = {
    minLength: 10,
    maxLength: 120,
};

interface EditIntroModalProps {
    isOpen: boolean;
    onClose: () => void;
    onHeadlineCreated?: () => void;
    initialData?: {
        firstName?: string;
        lastName?: string;
        pronouns?: string;
        headline?: string;
        company?: string;
        location?: string;
        currentPosition?: string;
        education?: string;
        contactInfo?: string;
        headlineId?: string;
    };
    onSubmit?: (data?: any) => void;
}

const EditIntroModal: React.FC<EditIntroModalProps> = ({
    isOpen,
    onClose,
    initialData = {},
    onSubmit,
    onHeadlineCreated,
}) => {
    const [formData, setFormData] = useState({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        pronouns: initialData.pronouns || 'He/Him',
        headline: initialData.headline || '',
        company: initialData.company || '',
        location: initialData.location || '',
        currentPosition: initialData.currentPosition || '',
        education: initialData.education || '',
        contactInfo: initialData.contactInfo || '',
    });

    // Update form when initialData changes
    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                firstName: initialData.firstName || '',
                lastName: initialData.lastName || '',
                pronouns: initialData.pronouns || 'He/Him',
                headline: initialData.headline || '',
                company: initialData.company || '',
                location: initialData.location || '',
                currentPosition: initialData.currentPosition || '',
                education: initialData.education || '',
                contactInfo: initialData.contactInfo || '',
            });
            setErrors({});
        }
    }, [isOpen, initialData]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { updateProfile, createUserHeadline, loadProfile } = useProfile();

    // ✅ FIX: modal khula ho tab background page scroll na ho
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };
    const validateForm = () => {
        try {
            updateProfileSchema.parse(formData);
            const newErrors: Record<string, string> = {};
            if (formData.headline) {
                if (formData.headline.length < HEADLINE_VALIDATION.minLength) {
                    newErrors.headline = `Headline must be at least ${HEADLINE_VALIDATION.minLength} characters`;
                } else if (formData.headline.length > HEADLINE_VALIDATION.maxLength) {
                    newErrors.headline = `Headline cannot exceed ${HEADLINE_VALIDATION.maxLength} characters`;
                }
            }
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return false;
            }
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) newErrors[err.path[0] as string] = err.message;
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

        setIsSubmitting(true);

        try {
        

            // ✅ FIX: pehle sirf firstName/lastName/location track ho rahe the —
            // currentPosition, company, education, pronouns change karne par
            // wo silently drop ho jaate the aur backend ko kabhi bhejte hi nahi the
            const updates: any = {};
            if (formData.firstName !== initialData.firstName) updates.firstName = formData.firstName;
            if (formData.lastName !== initialData.lastName) updates.lastName = formData.lastName;
            if (formData.location !== initialData.location) updates.location = formData.location;
            if (formData.currentPosition !== initialData.currentPosition) updates.currentPosition = formData.currentPosition;
            if (formData.company !== initialData.company) updates.company = formData.company;
            if (formData.education !== initialData.education) updates.education = formData.education;
            if (formData.pronouns !== initialData.pronouns) updates.pronouns = formData.pronouns;
            // ✅ Redux: Update profile
            if (Object.keys(updates).length > 0) {
                await updateProfile(updates).unwrap();
            
            }

            // ✅ Redux: Create headline (sirf tab jab headline change hui ho ya nayi ho)
            if (formData.headline && (formData.headline !== initialData.headline || !initialData.headlineId)) {
                await createUserHeadline(formData.headline).unwrap();
            }

            // ✅ Reload profile data
            await loadProfile();

            // Call parent callback
            if (onSubmit) {
                await onSubmit(formData);
            }

            // Then fetch headline data
            if (onHeadlineCreated) {
                await onHeadlineCreated();
            }

            onClose();
        } catch (error: any) {
            console.error('❌ Error updating profile:', error);
            setErrors({ submit: error.message || 'Failed to save changes. Please try again.' });
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
            <div className="relative z-10 w-full max-w-2xl mx-auto max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-[#4a3728] to-[#6a5748] px-6 py-5 flex-shrink-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Edit Intro Section</h2>
                        <p className="text-white/70 text-sm mt-1">Update your professional information</p>
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
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
                    <div className="overflow-y-auto p-6 space-y-6 flex-1">
                        {/* Error Message */}
                        {errors.submit && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {errors.submit}
                            </div>
                        )}

                        {/* Name Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#4a3728] flex items-center gap-2">
                                <User className="w-5 h-5 text-[#4a3728]" /> Name Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="Enter first name"
                                        className={`w-full px-4 py-2 rounded-xl border-2 focus:outline-none transition-colors duration-200 text-[#4a3728] ${errors.firstName
                                            ? 'border-red-500 bg-red-50 focus:border-red-600'
                                            : 'border-[#e0d8cf] bg-white/50 focus:border-[#4a3728]'
                                            }`}
                                    />
                                    {errors.firstName && (
                                        <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Enter last name"
                                        className={`w-full px-4 py-2 rounded-xl border-2 focus:outline-none transition-colors duration-200 text-[#4a3728] ${errors.lastName
                                            ? 'border-red-500 bg-red-50 focus:border-red-600'
                                            : 'border-[#e0d8cf] bg-white/50 focus:border-[#4a3728]'
                                            }`}
                                    />
                                    {errors.lastName && (
                                        <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                        Pronouns
                                    </label>
                                    <select
                                        name="pronouns"
                                        value={formData.pronouns}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                    >
                                        <option value="He/Him">He/Him</option>
                                        <option value="She/Her">She/Her</option>
                                        <option value="They/Them">They/Them</option>
                                        <option value="Other">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Professional Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#4a3728] flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-[#4a3728]" /> Professional Information
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Headline <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="headline"
                                    value={formData.headline}
                                    onChange={handleChange}
                                    placeholder="e.g., Senior Software Engineer at Tech Company"
                                    className={`w-full px-4 py-2 rounded-xl border-2 focus:outline-none transition-colors duration-200 text-[#4a3728] ${errors.headline
                                        ? 'border-red-500 bg-red-50 focus:border-red-600'
                                        : 'border-[#e0d8cf] bg-white/50 focus:border-[#4a3728]'
                                        }`}
                                />
                                {errors.headline && (
                                    <p className="text-red-500 text-xs mt-1">{errors.headline}</p>
                                )}
                                <p className="text-xs text-[#4a3728]/60 mt-1">
                                    This appears at the top of your profile
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                        Current Position
                                    </label>
                                    <input
                                        type="text"
                                        name="currentPosition"
                                        value={formData.currentPosition}
                                        onChange={handleChange}
                                        placeholder="e.g., Software Engineer"
                                        className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                        Company
                                    </label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        placeholder="e.g., Tech Company"
                                        className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Education Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#4a3728] flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-[#4a3728]" /> Education
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Education
                                </label>
                                <input
                                    name="education"
                                    value={formData.education}
                                    onChange={handleChange}
                                    placeholder="e.g., Bachelor's in Computer Science from MIT"
                                    className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                />
                            </div>
                        </div>

                        {/* Location & Contact Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#4a3728] flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-[#4a3728]" /> Location & Contact
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g., San Francisco, USA"
                                    className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fixed Solid Footer */}
                    <div className="flex gap-3 px-6 py-4 border-t border-[#e0d8cf] bg-white flex-shrink-0 z-10 shadow-lg">
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
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditIntroModal;

