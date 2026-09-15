"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  X, DollarSign, FileText, Briefcase, Clock, Video,
  MessageSquare, Image as ImageIcon, Upload
} from 'lucide-react';
import SessionService from '@/lib/api/session.service';

const serviceTypes = [
  { name: 'quick_call', label: 'Quick Call', icon: Video, description: 'Quick 30-minute call for specific questions', emoji: '⚡', needsDescription: false },
  { name: 'deep_dive', label: 'Deep Dive', icon: Video, description: 'In-depth 60-minute session for detailed discussion', emoji: '🎯', needsDescription: true },
  { name: 'resume_review', label: 'Resume Review', icon: FileText, description: 'Professional resume review with ATS scoring', emoji: '📄', needsDescription: true },
  { name: 'mock_interview', label: 'Mock Interview', icon: MessageSquare, description: 'Practice interview with real-time feedback', emoji: '🎤', needsDescription: true },
  { name: 'career_planning', label: 'Career Planning', icon: Briefcase, description: 'Comprehensive career planning and roadmap', emoji: '🗺️', needsDescription: true },
  { name: 'portfolio_review', label: 'Portfolio Review', icon: FileText, description: 'Portfolio review for designers and developers', emoji: '💼', needsDescription: true },
  { name: 'ask_query', label: 'Ask a Query', icon: MessageSquare, description: 'Text-based async query (no live call)', emoji: '❓', needsDescription: false },
];

const followUpAllowedOptions = [
    { value: '0', label: 'None' },
    { value: '1', label: '1 Time' }, { value: '2', label: '2 Times' },
    { value: '3', label: '3 Times' }, { value: '4', label: '4 Times' },
    { value: '5', label: '5 Times' }, { value: '6', label: '6 Times' },
    { value: '7', label: '7 Times' },
];

const followUpPeriodOptions = [
    { value: '1', label: '24 Hours' }, { value: '2', label: '48 Hours' },
    { value: '3', label: '72 Hours' }, { value: '4', label: '96 Hours' },
    { value: '5', label: '120 Hours' },
];

const bufferTimeOptions = [
    { value: '1', label: '1 Min' }, { value: '5', label: '5 Min' },
    { value: '10', label: '10 Min' }, { value: '15', label: '15 Min' },
];

const formatLocalDatetimeForInput = (isoString?: string | Date | null) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onRefresh: () => void;
}

export default function OneToOneEditSessionModal({ isOpen, onClose, session: initialPropSession, onRefresh }: EditSessionModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [canonicalSession, setCanonicalSession] = useState<any>(null);
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalTime, setOriginalTime] = useState<string>('');
  
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

  useEffect(() => {
    if (!isOpen || !initialPropSession) return;
    
    let isMounted = true;
    const fetchCanonicalData = async () => {
      try {
        setIsLoading(true);
        const targetSessionId = initialPropSession.sessionId || initialPropSession.id || initialPropSession._id;
        if (!targetSessionId) throw new Error("No valid Session ID found.");
        
        const response = await SessionService.getSessionById(targetSessionId);
        const dbSession = response.data;
        
        if (!isMounted) return;

        setCanonicalSession(dbSession);
        
        const isBooked = !!initialPropSession.bookingId;
        const targetBooking = isBooked ? dbSession.bookings?.find((b: any) => b._id === initialPropSession.bookingId) : null;
        const scheduledTime = targetBooking?.scheduledAt || dbSession.scheduledAt;
        const formattedTime = formatLocalDatetimeForInput(scheduledTime);
        setOriginalTime(formattedTime);

        const activeStatus = targetBooking ? targetBooking.status : dbSession.status;

        setFormData({
            title: dbSession.title || '',
            description: dbSession.description || '',
            duration: dbSession.duration || '',
            scheduledAt: formattedTime,
            status: ['available', 'rescheduled'].includes(activeStatus) ? activeStatus : 'available',
            sessionType: dbSession.sessionType || 'quick_call',
            price: dbSession.pricing?.basePrice ?? 0,
            paymentMethod: dbSession.payment?.method || dbSession.paymentMethod || 'razorpay',
            followUpAllowed: (dbSession.settings?.followUp?.allowed === true) ? '1' :
                             (dbSession.settings?.followUp?.allowed === false) ? '0' :
                             (Number(dbSession.settings?.followUp?.allowed) > 0 ? String(dbSession.settings.followUp.allowed) : '0'),
            followUpPeriod: (Number(dbSession.settings?.followUp?.periodDays) > 0) ? String(dbSession.settings.followUp.periodDays) : '0',
            bufferTime: String(dbSession.settings?.bufferTimeMinutes ?? 0),
            thumbnailImage: dbSession.thumbnailImage || null,
            rescheduleReason: '',
        });

      } catch (err: any) {
        if (isMounted) setSaveError("Error loading existing session data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCanonicalData();
    return () => { isMounted = false; setFormData({}); setCanonicalSession(null); setSaveError(null); };
  }, [isOpen, initialPropSession]);

  const handleUpdate = async () => {
    if (!canonicalSession) return;
    const targetSessionId = canonicalSession.sessionId || canonicalSession.id || canonicalSession._id;
    
    try {
      setIsSaving(true);
      setSaveError(null);
      
      const isBooked = !!initialPropSession.bookingId;
      const isRescheduling = isBooked && formData.scheduledAt !== originalTime;

      if (isRescheduling && !formData.rescheduleReason?.trim()) {
          setSaveError("Please provide a Reschedule Reason.");
          setIsSaving(false);
          return;
      }

      if (isRescheduling) {
          const selectedTime = new Date(formData.scheduledAt).getTime();
          const minTime = Date.now() + 24 * 60 * 60 * 1000;
          if (selectedTime < minTime) {
              setSaveError("Cannot reschedule less than 24 hours before start time.");
              setIsSaving(false);
              return;
          }
      }

      const changes: any = {
        title: formData.title,
        description: formData.description,
        duration: Number(formData.duration),
      };

      if (!isRescheduling) {
        if (formData.scheduledAt) {
          changes.scheduledAt = new Date(formData.scheduledAt).toISOString();
        }
        if (formData.status) {
          changes.status = formData.status;
        }
      }

      const isFree = formData.paymentMethod === "free";
      changes.pricing = isFree ? { basePrice: 0, platformFee: 0, totalAmount: 0, currency: "INR" } : {
          basePrice: Number(formData.price),
          platformFee: Math.round(Number(formData.price) * 0.15),
          totalAmount: Number(formData.price) + Math.round(Number(formData.price) * 0.15),
          currency: "INR",
      };
      
      changes.settings = {
          followUp: {
              allowed: Number(formData.followUpAllowed) || 0,
              periodDays: Number(formData.followUpPeriod) || 0,
          },
          bufferTimeMinutes: Number(formData.bufferTime) || 0,
      };
      
      const fd = new FormData();
      Object.entries(changes).forEach(([key, val]) => {
          if (key === 'pricing' || key === 'settings') {
              fd.append(key, JSON.stringify(val));
          } else {
              fd.append(key, String(val));
          }
      });
      if (formData.thumbnailImage instanceof File) {
           fd.append('thumbnailImage', formData.thumbnailImage);
      }

      await SessionService.updateSession(targetSessionId, fd);
      
      if (isRescheduling) {
          await SessionService.rescheduleSession(
              targetSessionId,
              new Date(formData.scheduledAt).toISOString(),
              formData.rescheduleReason,
              initialPropSession.bookingId
          );
      }
      
      onRefresh();
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update service details.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentServiceType = serviceTypes.find(t => t.name === formData.sessionType) || serviceTypes[0];
  const requiresDescription = currentServiceType?.needsDescription ?? true;

  const currentStatus = canonicalSession?.status || 'available';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl transform animate-fadeIn max-h-[90vh] overflow-y-auto"
        style={{ border: '2px solid #e0d8cf' }}
      >
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="text-6xl">{currentServiceType.emoji}</div>
            <div>
              <h3 className="text-4xl font-bold mb-2" style={{ color: '#4a3728' }}>
                Edit Service
              </h3>
              <p className="text-lg" style={{ color: '#8a7a6a' }}>
                Update the service details below
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={isLoading || isSaving} className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:rotate-90 disabled:opacity-50">
            <X className="w-7 h-7" style={{ color: '#4a3728' }} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: '#4a3728' }}></div>
            <span className="mt-4 font-bold text-lg" style={{ color: '#4a3728' }}>Loading Service Details...</span>
          </div>
        ) : (
          <div className="space-y-6">

            <div className="p-8 rounded-2xl border-2 border-dashed relative overflow-hidden flex items-center justify-center" style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3', minHeight: '240px' }}>
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
                            <div className="text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2" style={{ backgroundColor: '#4a3728' }}>
                                <Upload className="w-5 h-5" />
                                Change Image
                            </div>
                        </label>
                    </div>
                ) : (
                    <div className="text-center w-full">
                        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ border: '2px solid #e0d8cf' }}>
                            <ImageIcon className="w-12 h-12" style={{ color: '#7a5c3e' }} />
                        </div>
                        <h4 className="text-xl font-bold mb-2" style={{ color: '#4a3728' }}>Update Service Image</h4>
                        <p className="text-sm mb-4" style={{ color: '#8a7a6a' }}>Add a professional image for your service</p>
                        <label className="cursor-pointer text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto w-fit" style={{ backgroundColor: '#4a3728' }}>
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
            
            <div className="p-6 rounded-2xl" style={{ backgroundColor: '#fbf7f3', border: '2px solid #e0d8cf' }}>
              <label className="block text-lg font-bold mb-4" style={{ color: '#4a3728' }}>
                <FileText className="w-5 h-5 inline mr-2" />
                Service Type
              </label>
              <div className="flex items-center gap-4 p-4 rounded-xl opacity-80" style={{ backgroundColor: '#fff', border: '2px solid #e0d8cf' }}>
                <div className="text-5xl">{currentServiceType.emoji}</div>
                <div className="flex-1">
                  <h5 className="font-bold text-xl" style={{ color: '#4a3728' }}>{currentServiceType.label}</h5>
                  <p className="text-sm mt-1" style={{ color: '#8a7a6a' }}>{currentServiceType.description}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                  <Briefcase className="w-5 h-5 inline mr-2" />
                  Service Name
                </label>
                <input
                  type="text"
                  className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                  style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isSaving}
                />
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
                    className="w-full p-4 pl-10 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                    style={{ borderColor: '#e0d8cf', backgroundColor: formData.paymentMethod === 'free' ? '#e5e7eb' : '#fbf7f3', color: formData.paymentMethod === 'free' ? '#6b7280' : '#4a3728' }}
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    disabled={isSaving || formData.paymentMethod === 'free'}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                        <Clock className="w-5 h-5 inline mr-2" />
                        Schedule Date & Time
                    </label>
                    <input
                        type="datetime-local"
                        className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                        style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                        value={formData.scheduledAt || ''}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        disabled={isSaving}
                    />
                </div>
                <div className="opacity-70 cursor-not-allowed">
                    <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                        💳 Payment Method
                    </label>
                    <select
                        className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                        style={{ borderColor: '#e0d8cf', backgroundColor: '#e5e7eb', color: '#6b7280' }}
                        value={formData.paymentMethod || 'razorpay'}
                        disabled
                    >
                        <option value="free">🆓 Free (No Charge)</option>
                        <option value="razorpay">Razorpay</option>
                        <option value="stripe">Stripe</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                    </select>
                </div>
                {!!initialPropSession?.bookingId && formData.scheduledAt !== originalTime && (
                    <div className="col-span-2">
                        <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                            Reschedule Reason
                        </label>
                        <input
                            type="text"
                            className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                            style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                            value={formData.rescheduleReason || ''}
                            onChange={(e) => setFormData({ ...formData, rescheduleReason: e.target.value })}
                            placeholder="Why are you rescheduling? (Required)"
                            disabled={isSaving}
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                        <Clock className="w-5 h-5 inline mr-2" />
                        Duration (min)
                    </label>
                    <input
                        type="number"
                        className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                        style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                        value={formData.duration || ''}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        disabled={isSaving}
                    />
                </div>
                <div>
                    <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                        📊 Status
                    </label>
                    <select
                        className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                        style={{
                            borderColor: '#e0d8cf',
                            backgroundColor: '#fbf7f3',
                            color: '#4a3728',
                        }}
                        value={formData.status || 'available'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        disabled={isSaving}
                    >
                        <option value="available">Available</option>
                        <option value="rescheduled">Rescheduled</option>
                        {!!initialPropSession?.bookingId && (
                            <>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </>
                        )}
                    </select>
                </div>
            </div>

            {requiresDescription && (
              <div>
                <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                  <FileText className="w-5 h-5 inline mr-2" />
                  Description
                </label>
                <textarea
                  rows={5}
                  className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg resize-none"
                  style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            )}

            <div className="p-6 rounded-2xl" style={{ backgroundColor: '#fbf7f3', border: '2px solid #e0d8cf' }}>
                <h4 className="text-lg font-bold mb-4" style={{ color: '#4a3728' }}>Follow-up Settings</h4>
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold mb-3" style={{ color: '#4a3728' }}>Follow-up Allowed</label>
                        <select
                            className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all"
                            style={{ borderColor: '#e0d8cf', backgroundColor: '#fff', color: '#4a3728' }}
                            value={formData.followUpAllowed || '0'}
                            onChange={(e) => setFormData({ ...formData, followUpAllowed: e.target.value })}
                            disabled={isSaving}
                        >
                            {followUpAllowedOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-3" style={{ color: '#4a3728' }}>Follow-up Period</label>
                        <select
                            className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all"
                            style={{ borderColor: '#e0d8cf', backgroundColor: formData.followUpAllowed === '0' ? '#e5e7eb' : '#fff', color: formData.followUpAllowed === '0' ? '#9ca3af' : '#4a3728' }}
                            value={formData.followUpPeriod || '0'}
                            onChange={(e) => setFormData({ ...formData, followUpPeriod: e.target.value })}
                            disabled={isSaving || formData.followUpAllowed === '0'}
                        >
                            <option value="0">N/A</option>
                            {followUpPeriodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-3" style={{ color: '#4a3728' }}>Buffer Time</label>
                        <select
                            className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all"
                            style={{ borderColor: '#e0d8cf', backgroundColor: '#fff', color: '#4a3728' }}
                            value={formData.bufferTime || '0'}
                            onChange={(e) => setFormData({ ...formData, bufferTime: e.target.value })}
                            disabled={isSaving}
                        >
                            <option value="0">None</option>
                            {bufferTimeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {saveError && (
              <div className="p-4 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                  ❌ {saveError}
              </div>
            )}

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
                onClick={handleUpdate}
                disabled={isSaving}
                className="flex-1 py-4 rounded-xl text-white font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                style={{ backgroundColor: '#4a3728' }}
              >
                {isSaving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}