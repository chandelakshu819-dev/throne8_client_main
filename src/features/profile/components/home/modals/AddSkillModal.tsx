'use client';
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createSkillSchema } from '@/features/profile/validators/skillValidation';
// import { createSkillSchema } from '@/features/profile/schemas/skillValidation';

interface AddSkillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSkill: (skillData: SkillFormData) => void;
}

export interface SkillFormData {
    skillName: string;
    category: string;
    skillStrength: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience: number;
}

const AddSkillModal: React.FC<AddSkillModalProps> = ({
    isOpen,
    onClose,
    onAddSkill
}) => {
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    const [showCustomCategory, setShowCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<SkillFormData>({
        skillName: '',
        category: '',
        skillStrength: 'intermediate',
        yearsOfExperience: 1,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = [
        'Programming',
        'Backend Development',
        'Frontend Development',
        'Full Stack Development',
        'Mobile Development',
        'DevOps',
        'Cloud Computing',
        'Database Management',
        'Data Science',
        'Machine Learning',
        'Design',
        'Project Management',
        'Business Strategy',
        'Other',
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'yearsOfExperience') {
            setFormData((prev) => ({
                ...prev,
                [name]: Math.max(1, Math.min(50, parseInt(value) || 1)),
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;

        if (value === 'Other') {
            setShowCustomCategory(true);
            setFormData(prev => ({ ...prev, category: '' }));
        } else {
            setShowCustomCategory(false);
            setCustomCategory('');
            setFormData(prev => ({ ...prev, category: value }));
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Use custom category if "Other" was selected
        const finalData = {
            ...formData,
            category: showCustomCategory ? customCategory : formData.category
        };

        // Validate with Zod
        const validation = createSkillSchema.safeParse(finalData);

        if (!validation.success) {
            const fieldErrors: Record<string, string> = {};
            validation.error.errors.forEach((err) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0] as string] = err.message;
                }
            });
            setErrors(fieldErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            await onAddSkill(validation.data);

            // Reset form
            setFormData({
                skillName: '',
                category: '',
                skillStrength: 'intermediate',
                yearsOfExperience: 1,
            });
            setShowCustomCategory(false);
            setCustomCategory('');
            setErrors({});
            onClose();
        } catch (error: any) {
            alert(error.message || 'Failed to add skill');
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
                        <h2 className="text-2xl font-bold text-white">Add New Skill</h2>
                        <p className="text-white/70 text-sm mt-1">Fill in your skill details below</p>
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
                    <div className="space-y-6">
                        {/* Skill Information Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#4a3728] flex items-center gap-2">
                                <span className="text-2xl">⚡</span> Skill Information
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Skill Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="skillName"
                                    value={formData.skillName}
                                    onChange={handleInputChange}
                                    placeholder="e.g., React.js, Node.js"
                                    className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                />
                                {errors.skillName && (
                                    <p className="text-red-500 text-xs mt-1">{errors.skillName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleCategoryChange}
                                    className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    <option value="Other">Other (Specify)</option>
                                </select>

                                {/* ✅ Custom category input - conditionally render */}
                                {showCustomCategory && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                            Enter Custom Category <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={customCategory}
                                            onChange={(e) => setCustomCategory(e.target.value)}
                                            placeholder="e.g., Blockchain, Quantum Computing"
                                            className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                        />
                                        {errors.category && (
                                            <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Skill Level Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#4a3728] flex items-center gap-2">
                                <span className="text-2xl">📊</span> Skill Level & Experience
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                        Skill Strength
                                    </label>
                                    <select
                                        name="skillStrength"
                                        value={formData.skillStrength}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#4a3728] mb-2">
                                        Years of Experience
                                    </label>
                                    <input
                                        type="number"
                                        name="yearsOfExperience"
                                        value={formData.yearsOfExperience}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="50"
                                        className="w-full px-4 py-2 rounded-xl border-2 border-[#e0d8cf] bg-white/50 focus:outline-none focus:border-[#4a3728] transition-colors duration-200 text-[#4a3728]"
                                    />
                                    {errors.yearsOfExperience && (
                                        <p className="text-red-500 text-xs mt-1">{errors.yearsOfExperience}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Strength Indicator */}
                        <div className="bg-[#f6ede8]/30 rounded-xl p-4 border-2 border-[#e0d8cf]">
                            <p className="text-sm font-semibold text-[#4a3728] mb-3">Strength Level Preview</p>
                            <div className="flex items-center gap-2">
                                {[...Array(5)].map((_, i) => {
                                    const strengths = { beginner: 2, intermediate: 3, advanced: 4, expert: 5 };
                                    const level = strengths[formData.skillStrength as keyof typeof strengths] || 3;
                                    return (
                                        <div
                                            key={i}
                                            className={`w-3 h-3 rounded-full transition-all duration-200 ${i < level ? 'bg-[#4a3728]' : 'bg-[#e0d8cf]'
                                                }`}
                                        ></div>
                                    );
                                })}
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
                            {isSubmitting ? 'Adding...' : 'Add Skill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSkillModal;
