"use client";

import React, { useMemo, useEffect } from 'react';
import {
    X, DollarSign, Image as ImageIcon, Upload, FileText,
    Briefcase, Clock, Users, CreditCard, AlertCircle
} from 'lucide-react';
import { Video, MessageSquare, Package } from 'lucide-react';

// NOTE: `emoji` kept only for backward-compat with callers that still pass it in
// via the `service` prop — it is not rendered anywhere in this file anymore.
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
    isSaving?: boolean;
    saveError?: string | null;
    fieldErrors?: Record<string, string>;
}

// Small reusable field label with icon
const FieldLabel = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
    <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#4a3728' }}>
        <Icon className="w-4 h-4" style={{ color: '#7a5c3e' }} />
        {children}
    </label>
);

const inputStyle = (hasError?: string) => ({
    borderColor: hasError ? '#dc2626' : '#e0d8cf',
    backgroundColor: '#fbf7f3',
    color: '#4a3728',
});

export default function ServiceModal({
    service, onClose, formData, setFormData, handleCreateService,
    isSaving = false, saveError = null,
    fieldErrors = {},
}: ServiceModalProps) {

    const currentServiceType = serviceTypes.find(t => t.name === formData?.serviceType);
    const needsDescription = currentServiceType?.needsDescription ?? true;
    const needsParticipants = currentServiceType?.needsParticipants ?? true;
    const ServiceIcon = currentServiceType?.icon || FileText;

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div
                className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto"
                style={{ border: '1px solid #e0d8cf' }}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#f3ece4' }}>
                            <ServiceIcon className="w-5 h-5" style={{ color: '#4a3728' }} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold" style={{ color: '#4a3728' }}>
                                {service.name === 'New Service' ? 'Create New Service' : service.name}
                            </h3>
                            <p className="text-sm" style={{ color: '#8a7a6a' }}>{service.description}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="p-2 hover:bg-[#f3ece4] rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" style={{ color: '#4a3728' }} />
                    </button>
                </div>

                <div className="space-y-5">

                    {/* Image Upload */}
                    <div className="rounded-xl border border-dashed relative overflow-hidden" style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3', minHeight: thumbnailPreview ? '180px' : 'auto' }}>
                        {thumbnailPreview ? (
                            <div className="relative group" style={{ height: '180px' }}>
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
                                    <div className="text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: '#4a3728' }}>
                                        <Upload className="w-4 h-4" />
                                        Change Image
                                    </div>
                                </label>
                            </div>
                        ) : (
                            <div className="text-center py-8 px-6">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#f3ece4' }}>
                                    <ImageIcon className="w-6 h-6" style={{ color: '#7a5c3e' }} />
                                </div>
                                <p className="text-sm font-semibold mb-1" style={{ color: '#4a3728' }}>Upload service image</p>
                                <p className="text-xs mb-4" style={{ color: '#8a7a6a' }}>Optional — helps your service stand out</p>
                                <label className="cursor-pointer text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
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
                                    <Upload className="w-4 h-4" />
                                    Choose Image
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Service Type Display */}
                    {currentServiceType && (
                        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#f3ece4' }}>
                                <currentServiceType.icon className="w-5 h-5" style={{ color: '#4a3728' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-sm" style={{ color: '#4a3728' }}>{currentServiceType.label}</h5>
                                <p className="text-xs mt-0.5" style={{ color: '#8a7a6a' }}>{currentServiceType.description}</p>
                            </div>
                        </div>
                    )}

                    {/* Name & Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FieldLabel icon={Briefcase}>Service Name</FieldLabel>
                            <input
                                type="text"
                                placeholder="e.g., Advanced React Mentoring"
                                className="w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm"
                                style={inputStyle(fieldErrors?.serviceName)}
                                value={formData?.serviceName || ''}
                                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                                disabled={isSaving}
                            />
                            {fieldErrors?.serviceName && (
                                <p className="text-xs mt-1 font-medium" style={{ color: '#dc2626' }}>{fieldErrors.serviceName}</p>
                            )}
                        </div>
                        <div>
                            <FieldLabel icon={DollarSign}>Price per Hour</FieldLabel>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: '#7a5c3e' }}>₹</span>
                                <input
                                    type="number"
                                    placeholder="500"
                                    className="w-full pl-7 pr-3.5 py-2.5 rounded-lg border outline-none text-sm"
                                    style={inputStyle(fieldErrors?.price)}
                                    value={formData?.price || ''}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    disabled={isSaving}
                                />
                            </div>
                            {fieldErrors?.price && (
                                <p className="text-xs mt-1 font-medium" style={{ color: '#dc2626' }}>{fieldErrors.price}</p>
                            )}
                        </div>
                    </div>

                    {/* Scheduled Date & Time */}
                    <div>
                        <FieldLabel icon={Clock}>Schedule Date & Time</FieldLabel>
                        <input
                            type="datetime-local"
                            min={new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16)}
                            className="w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm"
                            style={inputStyle(fieldErrors?.scheduledAt)}
                            value={formData?.scheduledAt || ''}
                            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                            disabled={isSaving}
                        />
                        {fieldErrors?.scheduledAt && (
                            <p className="text-xs mt-1 font-medium" style={{ color: '#dc2626' }}>{fieldErrors.scheduledAt}</p>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div>
                        <FieldLabel icon={CreditCard}>Payment Method</FieldLabel>
                        <select
                            className="w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm"
                            style={inputStyle(fieldErrors?.paymentMethod)}
                            value={formData?.paymentMethod || ''}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            disabled={isSaving}
                        >
                            <option value="">Select payment method</option>
                            <option value="free">Free (No Charge)</option>
                            <option value="razorpay">Razorpay</option>
                            <option value="stripe">Stripe</option>
                            <option value="cash">Cash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                        </select>
                        {fieldErrors?.paymentMethod && (
                            <p className="text-xs mt-1 font-medium" style={{ color: '#dc2626' }}>{fieldErrors.paymentMethod}</p>
                        )}
                    </div>

                    {/* Description */}
                    {needsDescription && (
                        <div>
                            <FieldLabel icon={FileText}>Description</FieldLabel>
                            <textarea
                                rows={4}
                                placeholder="Describe your service in detail..."
                                className="w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm resize-none"
                                style={inputStyle(fieldErrors?.description)}
                                value={formData?.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                disabled={isSaving}
                            />
                            {fieldErrors?.description && (
                                <p className="text-xs mt-1 font-medium" style={{ color: '#dc2626' }}>{fieldErrors.description}</p>
                            )}
                        </div>
                    )}

                    {/* Topic */}
                    {needsParticipants && (
                        <div>
                            <FieldLabel icon={FileText}>Topic</FieldLabel>
                            <input
                                type="text"
                                placeholder="e.g., React System Design"
                                className="w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm"
                                style={inputStyle(fieldErrors?.topic)}
                                value={formData?.topic || ''}
                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                disabled={isSaving}
                            />
                            {fieldErrors?.topic && (
                                <p className="text-xs mt-1 font-medium" style={{ color: '#dc2626' }}>{fieldErrors.topic}</p>
                            )}
                        </div>
                    )}

                    {/* Duration & Participants */}
                    <div className={`grid ${needsParticipants ? 'grid-cols-3' : 'grid-cols-1'} gap-4`}>
                        <div>
                            <FieldLabel icon={Clock}>Duration (min)</FieldLabel>
                            <input
                                type="number"
                                placeholder="60"
                                className="w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm"
                                style={inputStyle()}
                                value={formData?.duration || ''}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                disabled={isSaving}
                            />
                        </div>
                        {needsParticipants && (
                            <>
                                <div>
                                    <FieldLabel icon={Users}>Min Participants</FieldLabel>
                                    <input
                                        type="number"
                                        placeholder="1"
                                        className="w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm"
                                        style={inputStyle(fieldErrors?.minParticipants)}
                                        value={formData?.minParticipants || ''}
                                        onChange={(e) => setFormData({ ...formData, minParticipants: e.target.value })}
                                        disabled={isSaving}
                                    />
                                    {fieldErrors?.minParticipants && (
                                        <p className="text-xs mt-1 font-medium" style={{ color: '#dc2626' }}>{fieldErrors.minParticipants}</p>
                                    )}
                                </div>
                                <div>
                                    <FieldLabel icon={Users}>Max Participants</FieldLabel>
                                    <input
                                        type="number"
                                        placeholder="10"
                                        className="w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm"
                                        style={inputStyle(fieldErrors?.maxParticipants)}
                                        value={formData?.maxParticipants || ''}
                                        onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                                        disabled={isSaving}
                                    />
                                    {fieldErrors?.maxParticipants && (
                                        <p className="text-xs mt-1 font-medium" style={{ color: '#dc2626' }}>{fieldErrors.maxParticipants}</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Follow-up Settings */}
                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}>
                        <h4 className="text-sm font-bold mb-3" style={{ color: '#4a3728' }}>Follow-up Settings</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold mb-2" style={{ color: '#4a3728' }}>Follow-up Period</label>
                                <select
                                    className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
                                    style={{ borderColor: '#e0d8cf', backgroundColor: '#fff', color: '#4a3728' }}
                                    value={formData?.followUpPeriod || '24'}
                                    onChange={(e) => setFormData({ ...formData, followUpPeriod: e.target.value })}
                                    disabled={isSaving}
                                >
                                    {followUpPeriodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-2" style={{ color: '#4a3728' }}>Follow-up Allowed</label>
                                <select
                                    className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
                                    style={{ borderColor: '#e0d8cf', backgroundColor: '#fff', color: '#4a3728' }}
                                    value={formData?.followUpAllowed || '1'}
                                    onChange={(e) => setFormData({ ...formData, followUpAllowed: e.target.value })}
                                    disabled={isSaving}
                                >
                                    {followUpAllowedOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-2" style={{ color: '#4a3728' }}>Buffer Time</label>
                                <select
                                    className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
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

                    {/* Error Message */}
                    {saveError && (
                        <div
                            className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium"
                            style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                        >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {saveError}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm border transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f3ece4]"
                            style={{ borderColor: '#e0d8cf', color: '#4a3728', backgroundColor: '#fbf7f3' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateService}
                            disabled={isSaving}
                            className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
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