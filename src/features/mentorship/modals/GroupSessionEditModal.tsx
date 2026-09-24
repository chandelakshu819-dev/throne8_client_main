'use client';
// src/features/mentorship/modals/GroupSessionEditModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, Image as ImageIcon, Upload, FileText, Briefcase, Clock, Users } from 'lucide-react';
import MentorService from '@/lib/api/mentorship.service';

const followUpAllowedOptions = [
    { value: '0', label: 'Not Allowed (0)' },
    { value: '1', label: '1 Time' }, { value: '2', label: '2 Times' },
    { value: '3', label: '3 Times' }, { value: '4', label: '4 Times' },
    { value: '5', label: '5 Times' }, { value: '6', label: '6 Times' },
    { value: '7', label: '7 Times' },
];

const followUpPeriodOptions = [
    { value: '1', label: '1 Day (24 Hours)' }, { value: '2', label: '2 Days (48 Hours)' },
    { value: '3', label: '3 Days' }, { value: '4', label: '4 Days' },
    { value: '5', label: '5 Days' },
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
  initialMode?: 'view' | 'edit';
  onClose: () => void;
  session: any;
  onRefresh: () => void;
}

export default function GroupSessionEditModal({ isOpen, onClose, session: initialPropSession, onRefresh }: EditSessionModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [canonicalSession, setCanonicalSession] = useState<any>(null);

  const [formData, setFormData] = useState<Record<string, any>>({});

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

        const response = await MentorService.getGroupSessionById(targetSessionId);
        const dbSession = response.data || response;

        if (!isMounted) return;

        setCanonicalSession(dbSession);

        setFormData({
            title: dbSession.title || '',
            topic: dbSession.topic || '',
            description: dbSession.description || '',
            duration: dbSession.duration || '',
            minParticipants: dbSession.minParticipants || '',
            maxParticipants: dbSession.maxParticipants || '',
            scheduledAt: formatLocalDatetimeForInput(dbSession.scheduledAt),
            status: dbSession.status || 'open',
            pricePerPerson: dbSession.pricing?.pricePerPerson ?? 0,
            paymentMethod: dbSession.payment?.method || dbSession.paymentMethod || 'razorpay',
            followUpAllowed: dbSession.settings?.followUp?.allowed !== undefined ? String(dbSession.settings.followUp.allowed) : '0',
            followUpPeriod: dbSession.settings?.followUp?.periodDays !== undefined ? String(dbSession.settings.followUp.periodDays) : '0',
            bufferTime: String(dbSession.settings?.bufferTimeMinutes ?? 0),
            thumbnailImage: dbSession.thumbnailImage || null,
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

      // Group Session Flat API Map (as parsed in Joi backend validation)
      const changes: any = {
        title: formData.title,
        topic: formData.topic,
        description: formData.description,
        duration: Number(formData.duration),
        minParticipants: Number(formData.minParticipants),
        maxParticipants: Number(formData.maxParticipants),
        pricePerPerson: Number(formData.pricePerPerson) || 0,
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        bufferTimeMinutes: Number(formData.bufferTime) || 0,
      };

      if (formData.scheduledAt) {
        changes.scheduledAt = new Date(formData.scheduledAt).toISOString();
      }

      changes.followUp = {
          allowed: Number(formData.followUpAllowed || 0),
          periodDays: Number(formData.followUpPeriod) || 0,
      };

      const fd = new FormData();
      Object.entries(changes).forEach(([key, val]) => {
          if (key === 'followUp') {
              fd.append(key, JSON.stringify(val));
          } else {
              fd.append(key, String(val));
          }
      });
      if (formData.thumbnailImage instanceof File) {
           fd.append('thumbnailImage', formData.thumbnailImage);
      }

      await MentorService.updateGroupSession(targetSessionId, fd);

      onRefresh();
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update service details.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl transform animate-fadeIn max-h-[90vh] overflow-y-auto"
        style={{ border: '2px solid #e0d8cf' }}
      >
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="text-6xl">👥</div>
            <div>
              <h3 className="text-4xl font-bold mb-2" style={{ color: '#4a3728' }}>
                Edit Group Session
              </h3>
              <p className="text-lg" style={{ color: '#8a7a6a' }}>
                Modify your published group session details
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
                        <p className="text-sm mb-4" style={{ color: '#8a7a6a' }}>Add a professional image for your group session</p>
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

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                  <Briefcase className="w-5 h-5 inline mr-2" />
                  Service Name / Title
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
                  <FileText className="w-5 h-5 inline mr-2" />
                  Topic
                </label>
                <input
                  type="text"
                  className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                  style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                  value={formData.topic || ''}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                  <DollarSign className="w-5 h-5 inline mr-2" />
                  Price per Person
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold" style={{ color: '#7a5c3e' }}>₹</span>
                  <input
                    type="number"
                    className="w-full p-4 pl-10 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                    style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                    value={formData.pricePerPerson || 0}
                    onChange={(e) => setFormData({ ...formData, pricePerPerson: e.target.value })}
                    disabled={isSaving || formData.paymentMethod === 'free'}
                  />
                </div>
              </div>
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
            </div>

            <div className="grid grid-cols-3 gap-6 p-6 rounded-2xl" style={{ backgroundColor: '#fbf7f3', border: '2px solid #e0d8cf' }}>
              <div>
                  <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                      <Clock className="w-5 h-5 inline mr-2" />
                      Duration (min)
                  </label>
                  <input
                      type="number"
                      className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                      style={{ borderColor: '#e0d8cf', backgroundColor: '#fff', color: '#4a3728' }}
                      value={formData.duration || ''}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      disabled={isSaving}
                  />
              </div>
              <div>
                  <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                      <Users className="w-5 h-5 inline mr-2" />
                      Min Participants
                  </label>
                  <input
                      type="number"
                      className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                      style={{ borderColor: '#e0d8cf', backgroundColor: '#fff', color: '#4a3728' }}
                      value={formData.minParticipants || ''}
                      onChange={(e) => setFormData({ ...formData, minParticipants: e.target.value })}
                      disabled={isSaving}
                  />
              </div>
              <div>
                  <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                      <Users className="w-5 h-5 inline mr-2" />
                      Max Participants
                  </label>
                  <input
                      type="number"
                      className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                      style={{ borderColor: '#e0d8cf', backgroundColor: '#fff', color: '#4a3728' }}
                      value={formData.maxParticipants || ''}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      disabled={isSaving}
                  />
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-bold mb-3" style={{ color: '#4a3728' }}>
                    Payment Method
                  </label>
                  <select
                      className="w-full p-4 rounded-xl border-2 outline-none transition-all duration-300 text-lg"
                      style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                      value={formData.paymentMethod || 'razorpay'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      disabled={isSaving}
                  >
                      <option value="free">🆓 Free (No Charge)</option>
                      <option value="razorpay">Razorpay</option>
                      <option value="stripe">Stripe</option>
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                  </select>
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
                      value={formData.status || 'open'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      disabled={isSaving}
                  >
                        <option value="open">Open</option>
                        <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>
            </div>

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
