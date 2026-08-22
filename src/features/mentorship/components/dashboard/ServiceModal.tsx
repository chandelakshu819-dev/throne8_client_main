"use client";

import React, { useMemo, useEffect } from 'react';
import {
    X, DollarSign, Image as ImageIcon, Upload, FileText,
    Briefcase, Clock, Users
} from 'lucide-react';
import { Video, MessageSquare, Package } from 'lucide-react';

const serviceTypes = [
    {
        name: 'quick_call', label: 'Quick Call', icon: Video,
        description: 'Quick 30-minute call for specific questions',
        emoji: '⚡', needsDescription: false, needsParticipants: false,
    },
    {
        name: 'deep_dive', label: 'Deep Dive', icon: Video,
        description: 'In-depth 60-minute session for detailed discussion',
        emoji: '🎯', needsDescription: true, needsParticipants: false,
    },
    {
        name: 'resume_review', label: 'Resume Review', icon: FileText,
        description: 'Professional resume review with ATS scoring',
        emoji: '📄', needsDescription: true, needsParticipants: false,
    },
    {
        name: 'mock_interview', label: 'Mock Interview', icon: MessageSquare,
        description: 'Practice interview with real-time feedback',
        emoji: '🎤', needsDescription: true, needsParticipants: false,
    },
    {
        name: 'career_planning', label: 'Career Planning', icon: Briefcase,
        description: 'Comprehensive career planning and roadmap',
        emoji: '🗺️', needsDescription: true, needsParticipants: false,
    },
    {
        name: 'portfolio_review', label: 'Portfolio Review', icon: ImageIcon,
        description: 'Portfolio review for designers and developers',
        emoji: '💼', needsDescription: true, needsParticipants: false,
    },
    {
        name: 'ask_query', label: 'Ask a Query', icon: MessageSquare,
        description: 'Text-based async query (no live call)',
        emoji: '❓', needsDescription: false, needsParticipants: false,
    },
    {
        name: 'group_session', label: 'Group Session', icon: Users,
        description: 'Group session with multiple participants',
        emoji: '👥', needsDescription: true, needsParticipants: true,
    },
];

const followUpPeriodOptions = [
    { value: '24', label: '24 Hours' }, { value: '48', label: '48 Hours' },
    { value: '72', label: '3 Days' }, { value: '96', label: '4 Days' },
    { value: '120', label: '5 Days' },
];

const followUpAllowedOptions = [
    { value: '1', label: '1 Time' }, { value: '2', label: '2 Times' },
    { value: '3', label: '3 Times' }, { value: '4', label: '4 Times' },
    { value: '5', label: '5 Times' }, { value: '6', label: '6 Times' },
    { value: '7', label: '7 Times' },
];

const bufferTimeOptions = [
    { value: '1', label: '1 Min' }, { value: '5', label: '5 Min' },
    { value: '10', label: '10 Min' }, { value: '15', label: '15 Min' },
];

// ── Props ──────────────────────────────────────────────────
interface ServiceModalProps {
    service: { name: string; description: string; emoji: string };
    onClose: () => void;
    formData: any;
    setFormData: (data: any) => void;
    handleCreateService: () => void;
    isSaving?: boolean;       // ← NEW
    saveError?: string | null; // ← NEW
    fieldErrors?: Record<string, string>;
}

export default function ServiceModal({
    service, onClose, formData, setFormData, handleCreateService,
    isSaving = false, saveError = null,
    fieldErrors = {},
}: ServiceModalProps) {

    const currentServiceType = serviceTypes.find(t => t.name === formData?.serviceType);
    const needsDescription = currentServiceType?.needsDescription ?? true;
    const needsParticipants = currentServiceType?.needsParticipants ?? true;

    const thumbnailPreview = useMemo(() => {
        if (!formData?.thumbnailImage) return null;
        if (typeof formData.thumbnailImage === 'string') return formData.thumbnailImage;
        try {
            return URL.createObjectURL(formData.thumbnailImage);
        } catch (e) {
            return null;
        }
    }, [formData?.thumbnailImage]);

    useEffect(() => {
        return () => {
            if (thumbnailPreview && typeof formData?.thumbnailImage !== 'string') {
                URL.revokeObjectURL(thumbnailPreview);
            }
        };
    }, [thumbnailPreview, formData?.thumbnailImage]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div
                className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl transform animate-fadeIn max-h-[90vh] overflow-y-auto"
                style={{ border: '2px solid #e0d8cf' }}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                        <div className="text-6xl">{service.emoji || '📋'}</div>
                        <div>
                            <h3 className="text-4xl font-bold mb-2" style={{ color: '#4a3728' }}>
                                {service.name === 'New Service' ? 'Create New Service' : service.name}
                            </h3>
                            <p className="text-lg" style={{ color: '#8a7a6a' }}>{service.description}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:rotate-90 disabled:opacity-50"
                    >
                        <X className="w-7 h-7" style={{ color: '#4a3728' }} />
                    </button>
                </div>

                <div className="space-y-6">

                    {/* Image Upload */}
                    <div className="p-8 rounded-2xl border-2 border-dashed relative overflow-hidden" style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3' }}>
                        {thumbnailPreview ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 group">
                                <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <input 
                                        type="file" 
                                        accept="image/jpeg,image/png,image/webp" 
                                        className="hidden" 
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setFormData({ ...formData, thumbnailImage: file });
                                        }}
                                        disabled={isSaving}
                                    />
                                    <div className="text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2" style={{ backgroundColor: '#4a3728' }}>
                                        <Upload className="w-5 h-5" />
                                        Change Image
                                    </div>
                                </label>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                                    style={{ border: '2px solid #e0d8cf' }}>
                                    <ImageIcon className="w-12 h-12" style={{ color: '#7a5c3e' }} />
                                </div>
                                <h4 className="text-xl font-bold mb-2" style={{ color: '#4a3728' }}>Upload Service Image</h4>
                                <p className="text-sm mb-4" style={{ color: '#8a7a6a' }}>Add a professional image for your service</p>
                                <label className="cursor-pointer text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto w-fit"
                                    style={{ backgroundColor: '#4a3728' }}>
                                    <input 
                                        type="file" 
                                        accept="image/jpeg,image/png,image/webp" 
                                        className="hidden" 
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setFormData({ ...formData, thumbnailImage: file });
                                        }}
                                        disabled={isSaving}
                                    />
                                    <Upload className="w-5 h-5" />
                                    Choose Image
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Service Type Display */}
                    {currentServiceType && (
                        <div className="p-6 rounded-2xl" style={{ backgroundColor: '#fbf7f3', border: '2px solid #e0d8cf' }}>
                            <label className="block text-lg font-bold mb-4" style={{ color: '#4a3728' }}>
                                <FileText className="w-5 h-5 inline mr-2" />
                                Service Type
                            </label>
                            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: '#fff', border: '2px solid #e0d8cf' }}>
                                <div className="text-5xl">{currentServiceType.emoji}</div>
                                <div className="flex-1">
                                    <h5 className="font-bold text-xl" style={{ color: '#4a3728' }}>{currentServiceType.label}</h5>
                                    <p className="text-sm mt-1" style={{ color: '#8a7a6a' }}>{currentServiceType.description}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Name & Price */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                                <Briefcase className="w-5 h-5 inline mr-2" />
                                Service Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Advanced React Mentoring"
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                                style={{
                                    borderColor: fieldErrors?.serviceName ? '#dc2626' : '#e0d8cf',
                                    backgroundColor: '#fbf7f3',
                                    color: '#4a3728'
                                }}
                                value={formData?.serviceName || ''}
                                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                                disabled={isSaving}
                            />
                            {fieldErrors?.serviceName && (
                                <p className="text-xs mt-1 font-semibold" style={{ color: '#dc2626' }}>
                                    {fieldErrors.serviceName}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                                <DollarSign className="w-5 h-5 inline mr-2" />
                                Price per Hour
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold" style={{ color: '#7a5c3e' }}>₹</span>
                                <input
                                    type="number"
                                    placeholder="500"
                                    className="w-full p-4 pl-10 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                                    style={{
                                        borderColor: fieldErrors?.price ? '#dc2626' : '#e0d8cf',
                                        backgroundColor: '#fbf7f3',
                                        color: '#4a3728'
                                    }}
                                    value={formData?.price || ''}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    disabled={isSaving}
                                />
                            </div>
                            {fieldErrors?.price && (
                                <p className="text-xs mt-1 font-semibold" style={{ color: '#dc2626' }}>
                                    {fieldErrors.price}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Scheduled Date & Time */}
                    <div>
                        <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                            <Clock className="w-5 h-5 inline mr-2" />
                            Schedule Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            min={new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16)}
                            className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                            style={{
                                borderColor: fieldErrors?.scheduledAt ? '#dc2626' : '#e0d8cf',
                                backgroundColor: '#fbf7f3',
                                color: '#4a3728'
                            }}
                            value={formData?.scheduledAt || ''}
                            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                            disabled={isSaving}
                        />
                        {fieldErrors?.scheduledAt && (
                            <p className="text-xs mt-1 font-semibold" style={{ color: '#dc2626' }}>
                                {fieldErrors.scheduledAt}
                            </p>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div>
                            <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                                💳 Payment Method
                            </label>
                            <select
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                                style={{
                                    borderColor: fieldErrors?.paymentMethod ? '#dc2626' : '#e0d8cf',
                                    backgroundColor: '#fbf7f3',
                                    color: '#4a3728'
                                }}
                                value={formData?.paymentMethod || ''}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                disabled={isSaving}
                            >
                                <option value="">Select payment method</option>
                                <option value="free">🆓 Free (No Charge)</option>
                                <option value="razorpay">Razorpay</option>
                                <option value="stripe">Stripe</option>
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                            {fieldErrors?.paymentMethod && (
                                <p className="text-xs mt-1 font-semibold" style={{ color: '#dc2626' }}>
                                    {fieldErrors.paymentMethod}
                                </p>
                            )}
                        </div>

                    {/* Description */}
                    {needsDescription && (
                        <div>
                            <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                                <FileText className="w-5 h-5 inline mr-2" />
                                Description
                            </label>
                            <textarea
                                rows={5}
                                placeholder="Describe your service in detail..."
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg resize-none"
                                style={{
                                    borderColor: fieldErrors?.description ? '#dc2626' : '#e0d8cf',
                                    backgroundColor: '#fbf7f3',
                                    color: '#4a3728'
                                }}
                                value={formData?.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                disabled={isSaving}
                            />
                            {fieldErrors?.description && (
                                <p className="text-xs mt-1 font-semibold" style={{ color: '#dc2626' }}>
                                    {fieldErrors.description}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Topic */}
                    {needsParticipants && (
                        <div>
                            <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                                <FileText className="w-5 h-5 inline mr-2" />
                                Topic
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., React System Design"
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                                style={{
                                    borderColor: fieldErrors?.topic ? '#dc2626' : '#e0d8cf',
                                    backgroundColor: '#fbf7f3',
                                    color: '#4a3728'
                                }}
                                value={formData?.topic || ''}
                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                disabled={isSaving}
                            />
                            {fieldErrors?.topic && (
                                <p className="text-xs mt-1 font-semibold" style={{ color: '#dc2626' }}>
                                    {fieldErrors.topic}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Duration & Participants */}
                    <div className={`grid ${needsParticipants ? 'grid-cols-3' : 'grid-cols-1'} gap-6`}>
                        <div>
                            <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                                <Clock className="w-5 h-5 inline mr-2" />
                                Duration (min)
                            </label>
                            <input
                                type="number"
                                placeholder="60"
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                                style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                                value={formData?.duration || ''}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                disabled={isSaving}
                            />
                        </div>
                        {needsParticipants && (
                            <>
                                <div>
                                    <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                                        <Users className="w-5 h-5 inline mr-2" />
                                        Min Participants
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="1"
                                        className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                                        style={{
                                            borderColor: fieldErrors?.minParticipants ? '#dc2626' : '#e0d8cf',
                                            backgroundColor: '#fbf7f3',
                                            color: '#4a3728'
                                        }}
                                        value={formData?.minParticipants || ''}
                                        onChange={(e) => setFormData({ ...formData, minParticipants: e.target.value })}
                                        disabled={isSaving}
                                    />
                                    {fieldErrors?.minParticipants && (
                                        <p className="text-xs mt-1 font-semibold" style={{ color: '#dc2626' }}>
                                            {fieldErrors.minParticipants}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                                        <Users className="w-5 h-5 inline mr-2" />
                                        Max Participants
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="10"
                                        className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                                        style={{
                                            borderColor: fieldErrors?.maxParticipants ? '#dc2626' : '#e0d8cf',
                                            backgroundColor: '#fbf7f3',
                                            color: '#4a3728'
                                        }}
                                        value={formData?.maxParticipants || ''}
                                        onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                                        disabled={isSaving}
                                    />
                                    {fieldErrors?.maxParticipants && (
                                        <p className="text-xs mt-1 font-semibold" style={{ color: '#dc2626' }}>
                                            {fieldErrors.maxParticipants}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Follow-up Settings */}
                    <div className="p-6 rounded-2xl" style={{ backgroundColor: '#fbf7f3', border: '2px solid #e0d8cf' }}>
                        <h4 className="text-lg font-bold mb-4" style={{ color: '#4a3728' }}>Follow-up Settings</h4>
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold mb-3" style={{ color: '#4a3728' }}>Follow-up Period</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                                    style={{ borderColor: '#e0d8cf', backgroundColor: '#fff', color: '#4a3728' }}
                                    value={formData?.followUpPeriod || '24'}
                                    onChange={(e) => setFormData({ ...formData, followUpPeriod: e.target.value })}
                                    disabled={isSaving}
                                >
                                    {followUpPeriodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-3" style={{ color: '#4a3728' }}>Follow-up Allowed</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                                    style={{ borderColor: '#e0d8cf', backgroundColor: '#fff', color: '#4a3728' }}
                                    value={formData?.followUpAllowed || '1'}
                                    onChange={(e) => setFormData({ ...formData, followUpAllowed: e.target.value })}
                                    disabled={isSaving}
                                >
                                    {followUpAllowedOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-3" style={{ color: '#4a3728' }}>Buffer Time</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                                    style={{ borderColor: '#e0d8cf', backgroundColor: '#fff', color: '#4a3728' }}
                                    value={formData?.bufferTime || '5'}
                                    onChange={(e) => setFormData({ ...formData, bufferTime: e.target.value })}
                                    disabled={isSaving}
                                >
                                    {bufferTimeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Error Message ─────────────────────────────── */}
                    {saveError && (
                        <div
                            className="p-4 rounded-xl text-sm font-semibold"
                            style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                        >
                            ❌ {saveError}
                        </div>
                    )}

                    {/* ── Buttons ───────────────────────────────────── */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="flex-1 py-4 rounded-xl font-bold text-lg border-2 hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ borderColor: '#e0d8cf', color: '#4a3728', backgroundColor: '#fbf7f3' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateService}
                            disabled={isSaving}
                            className="flex-1 py-4 rounded-xl text-white font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                            style={{ backgroundColor: '#4a3728' }}
                        >
                            {isSaving ? "Creating..." : "Create Service"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}