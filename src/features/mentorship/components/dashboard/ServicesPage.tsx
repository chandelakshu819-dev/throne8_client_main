"use client";

import React, { useState, useEffect } from 'react';
import { Briefcase, Users, Clock, Star, Plus, Video, MessageSquare, Package, FileText, RefreshCw } from 'lucide-react';
import ServiceModal from './ServiceModal';
import EditSessionModal from '@/features/study-group/modals/EditSessionModal';
import MentorService, { CreateGroupSessionInput } from "@/lib/api/mentorship.service";
import SessionService, { CreateSessionInput } from "@/lib/api/session.service";
import { validateSessionForm } from '@/features/profile/validators/session.schema';
interface ServicesPageProps {
  mentorData?: any;
  showServiceForm: boolean;
  setShowServiceForm: (show: boolean) => void;
  selectedServiceType: any | null;
  setSelectedServiceType: (type: any | null) => void;
  completedServices: any[];
  formData: any;
  setFormData: (data: any) => void;
  handleCreateService: () => void;
}

const serviceTypes = [
  { name: 'quick_call', label: 'Quick Call', icon: Video, description: 'Quick 30-minute call', emoji: '⚡' },
  { name: 'deep_dive', label: 'Deep Dive', icon: Video, description: 'In-depth 60-minute session', emoji: '🎯' },
  { name: 'resume_review', label: 'Resume Review', icon: FileText, description: 'Professional resume review', emoji: '📄' },
  { name: 'mock_interview', label: 'Mock Interview', icon: MessageSquare, description: 'Practice interview', emoji: '🎤' },
  { name: 'career_planning', label: 'Career Planning', icon: Briefcase, description: 'Career roadmap planning', emoji: '🗺️' },
  { name: 'portfolio_review', label: 'Portfolio Review', icon: Package, description: 'Portfolio review', emoji: '💼' },
  { name: 'ask_query', label: 'Ask a Query', icon: MessageSquare, description: 'Text-based async query', emoji: '❓' },
  { name: 'group_session', label: 'Group Session', icon: Users, description: 'Group learning sessions', emoji: '👥' },
];

// Status badge color helper
const statusStyle = (status: string) => {
  switch (status) {
    case 'confirmed': return { bg: '#dcfce7', color: '#15803d' };
    case 'pending': return { bg: '#fef3c7', color: '#b45309' };
    case 'completed': return { bg: '#dbeafe', color: '#1d4ed8' };
    case 'cancelled': return { bg: '#fee2e2', color: '#dc2626' };
    case 'in_progress': return { bg: '#f3e8ff', color: '#7c3aed' };
    default: return { bg: '#f3f4f6', color: '#6b7280' };
  }
};

export default function ServicesPage({
  mentorData,
  showServiceForm,
  setShowServiceForm,
  selectedServiceType,
  setSelectedServiceType,
  completedServices,
  formData,
  setFormData,
  handleCreateService,
}: ServicesPageProps) {

  // ── API state ─────────────────────────────────────────
  const [apiSessions, setApiSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Edit Session Modal state ───────────────────────────
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);


  // ── Stats from API ────────────────────────────────────
  const totalSessions = apiSessions.length;
  const completedCount = apiSessions.filter(s => s.status === 'completed').length;
  const avgRating = "—";   // review API se aayega baad me

  useEffect(() => {
    if (mentorData?.mentorId) {
      fetchAllSessions();
    }
  }, [mentorData?.mentorId]);

  // ── Fetch all sessions ────────────────────────────────
  const fetchAllSessions = async () => {
    setSessionsLoading(true);
    try {
      if (!mentorData?.mentorId) return;
      const res = await SessionService.getMentorSessions(mentorData.mentorId);
      const sessions = Array.isArray(res.data) ? res.data : res.data?.sessions ?? [];
      setApiSessions(sessions);
    } catch (err: any) {
      console.error("Sessions fetch failed:", err.message);
    } finally {
      setSessionsLoading(false);
    }
  };
  // ── Update session status ──────────────────────────
  const handleUpdateSessionStatus = async (sessionId: string, newStatus: string, bookingId?: string) => {
    try {
      if (newStatus === 'confirmed') {
        await SessionService.confirmSession(sessionId, bookingId);  // bookingId pass karo
      }
      await fetchAllSessions();  // local state refresh
      // setIsEditModalOpen(false);
      // setSelectedSession(null);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update session status');
    }
  };

  // ── Create session via API ────────────────────────────
  const handleCreateServiceWithApi = async () => {
    // ── Step 1: Frontend validation ──────────────────────
    const errors = validateSessionForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaveError("Please fix the errors below.");
      return;
    }
    setFieldErrors({});

    if (!mentorData?.mentorId) {
      setSaveError("Mentor data not loaded. Please refresh.");
      return;
    }

    setIsSavingSession(true);
    setSaveError(null);

    try {
      const scheduledAtISO = new Date(formData.scheduledAt).toISOString();

      if (formData.serviceType === "group_session") {
        const groupSessionInput: CreateGroupSessionInput = {
          title: formData.serviceName,
          description: formData.description || "",
          topic: formData.topic,
          scheduledAt: scheduledAtISO,
          duration: Number(formData.duration) || 60,
          timezone: "Asia/Kolkata",
          maxParticipants: Number(formData.maxParticipants),
          minParticipants: Number(formData.minParticipants),
          pricePerPerson: Number(formData.price) || 0,
          paymentMethod: formData.paymentMethod,
          bufferTimeMinutes: Number(formData.bufferTime) || 0,
          followUp: {
            allowed: formData.followUpAllowed === '1',
            periodDays: Number(formData.followUpPeriod) || 0,
          },
          thumbnailImage: formData.thumbnailImage,
        };
        await MentorService.createGroupSession(groupSessionInput);
      } else {
        const isFree = formData.paymentMethod === "free";
        const sessionInput: CreateSessionInput = {
          sessionType: formData.serviceType,
          scheduledAt: scheduledAtISO,
          timezone: "Asia/Kolkata",
          title: formData.serviceName,
          description: formData.description || "",
          paymentMethod: formData.paymentMethod,
          duration: Number(formData.duration) || 60,
          followUp: {
            allowed: false,
            periodDays: Number(formData.followUpPeriod) || 0,
          },
          bufferTimeMinutes: Number(formData.bufferTime) || 0,
          ...(isFree ? {
            pricing: { basePrice: 0, platformFee: 0, totalAmount: 0, currency: "INR" }
          } : {
            pricing: {
              basePrice: Number(formData.price),
              platformFee: Math.round(Number(formData.price) * 0.15),
              totalAmount: Number(formData.price) + Math.round(Number(formData.price) * 0.15),
              currency: "INR",
            }
          }),
          thumbnailImage: formData.thumbnailImage,
        };
        await SessionService.createSession(sessionInput);
      }

      handleCreateService();
      await fetchAllSessions();
      setShowServiceForm(false);
      setSaveError(null);
      setFieldErrors({});
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setIsSavingSession(false);
    }
  };

  // ── Merge API + local services for display ─────────────
  const apiSessionTitles = new Set(apiSessions.map((s: any) => s.title));

  const displayServices = [
    // Real API sessions
    ...apiSessions.map((s: any) => ({
      name: s.title,
      price: s.pricing?.basePrice ?? 0,
      sessions: 0,
      type: s.sessionType,
      emoji: serviceTypes.find(t => t.name === s.sessionType)?.emoji || "📋",
      description: s.description || "",
      sessionId: s.sessionId,
      status: s.status,
      bookings: s.bookings ?? [],
      isApi: true,
    })),
    // Locally created (not yet in API — edge case)
    ...completedServices
      .filter(cs => !apiSessionTitles.has(cs.serviceName))
      .map(s => ({
        name: s.serviceName,
        price: s.price,
        sessions: 0,
        type: s.serviceType,
        emoji: s.emoji || "📋",
        description: s.description || "",
        sessionId: null,
        status: "local",
        isApi: false,
      })),
  ];

  // ── Render ─────────────────────────────────────────────
  return (
    <>
      <div className="space-y-8 animate-fadeIn">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#4a3728' }}>
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{ color: '#4a3728' }}>My Services</h2>
              <p style={{ color: '#8a7a6a' }} className="text-sm">Manage your offerings</p>
            </div>
          </div>

          {/* Stats — real data from API */}
          <div className="flex items-center gap-6">
            {[
              { icon: Users, label: 'Total Sessions', value: sessionsLoading ? '—' : String(totalSessions), bg: '#4a3728' },
              { icon: Clock, label: 'Completed', value: sessionsLoading ? '—' : String(completedCount), bg: '#7a5c3e' },
              { icon: Star, label: 'Avg Rating', value: avgRating, bg: '#4a3728' },
            ].map(({ icon: Icon, label, value, bg }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#8a7a6a' }}>{label}</p>
                  <p className="text-xl font-bold" style={{ color: '#4a3728' }}>{value}</p>
                </div>
              </div>
            ))}

            {/* Refresh button */}
            <button
              onClick={fetchAllSessions}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-md transition-all"
              style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '2px solid #e0d8cf' }}
            >
              <RefreshCw className={`w-4 h-4 ${sessionsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Service Type Selector + Preview */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <nav className="space-y-3">
              {serviceTypes.map((type, idx) => {
                const Icon = type.icon;
                const isActive = selectedServiceType?.name === type.name;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedServiceType(type);
                      setFormData({ ...formData, serviceType: type.name });
                    }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 font-semibold ${isActive ? 'shadow-lg transform scale-105' : 'hover:shadow-md'}`}
                    style={{
                      backgroundColor: isActive ? '#4a3728' : '#fbf7f3',
                      color: isActive ? '#fff' : '#7a5c3e',
                      border: isActive ? 'none' : '2px solid #e0d8cf',
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{type.label}</span>
                    {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="col-span-12 lg:col-span-9">
            <div
              className="rounded-3xl p-12 border-2 flex flex-col items-center justify-center space-y-6"
              style={{ borderColor: '#e0d8cf', minHeight: '400px', backgroundColor: '#fbf7f3' }}
            >
              {selectedServiceType ? (
                <>
                  <div className="text-8xl animate-bounce">{selectedServiceType.emoji}</div>
                  <h3 className="text-4xl font-bold text-center" style={{ color: '#4a3728' }}>
                    Create {selectedServiceType.label}
                  </h3>
                  <p className="text-center text-xl max-w-md" style={{ color: '#8a7a6a' }}>
                    {selectedServiceType.description}
                  </p>
                  <button
                    onClick={() => { setSaveError(null); setShowServiceForm(true); }}
                    className="text-white px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 flex items-center gap-3"
                    style={{ backgroundColor: '#4a3728' }}
                  >
                    <Plus className="w-6 h-6" />
                    <span className="font-bold text-xl">Add {selectedServiceType.label}</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="text-8xl">📋</div>
                  <h3 className="text-3xl font-bold text-center" style={{ color: '#4a3728' }}>Select Service Type</h3>
                  <p className="text-center text-lg" style={{ color: '#8a7a6a' }}>
                    Choose a service type from the left to get started
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Current Services — real API data */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold" style={{ color: '#4a3728' }}>Current Services</h3>
            {sessionsLoading && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full animate-pulse"
                style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e' }}>
                Loading...
              </span>
            )}
          </div>

          {!sessionsLoading && displayServices.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border-2" style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3' }}>
              <div className="text-6xl mb-4">📋</div>
              <p className="text-xl font-bold" style={{ color: '#4a3728' }}>No services yet</p>
              <p className="text-sm mt-2" style={{ color: '#8a7a6a' }}>
                Select a service type above and create your first offering.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayServices.map((service, idx) => {
                const ss = statusStyle(service.status);
                return (
                  <div
                    key={service.sessionId || idx}
                    className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border"
                    style={{ borderColor: '#e0d8cf' }}
                  >
                    {/* Emoji + status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: '#fbf7f3', border: '2px solid #e0d8cf' }}>
                        {service.emoji}
                      </div>
                      {/* Counts — status badge ki jagah */}
                      {(() => {
                        const bookings = (service as any).bookings ?? [];
                        const available = service.status === 'available' ? 1 : 0;
                        const pending = bookings.filter((b: any) => b.status === 'pending').length;
                        const confirmed = bookings.filter((b: any) => b.status === 'confirmed').length;
                        const completed = bookings.filter((b: any) => b.status === 'completed').length;

                        return (
                          <div className="flex items-center gap-1 flex-wrap">
                            {available > 0 && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                                {available} open
                              </span>
                            )}
                            {pending > 0 && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                                {pending} pending
                              </span>
                            )}
                            {confirmed > 0 && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                                {confirmed} confirmed
                              </span>
                            )}
                            {completed > 0 && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                                {completed} done
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <h3 className="text-xl font-bold mb-2" style={{ color: '#4a3728' }}>{service.name}</h3>

                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
                      style={{ backgroundColor: '#4a3728', color: '#fff' }}>
                      {serviceTypes.find(t => t.name === service.type)?.label || service.type}
                    </span>

                    <p className="mb-4 text-sm line-clamp-2" style={{ color: '#8a7a6a' }}>
                      {service.description || `Professional ${service.name.toLowerCase()} session`}
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-4 h-4" style={{ color: '#8a7a6a' }} />
                      <span className="text-sm" style={{ color: '#8a7a6a' }}>
                        {service.sessions} sessions completed
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid #e0d8cf' }}>
                      <span className="text-2xl font-bold" style={{ color: '#7a5c3e' }}>
                        {service.price === 0 ? 'Free' : `₹${service.price}/hr`}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedSession(service);
                          setIsEditModalOpen(true);
                        }}
                        className="editCurrentSessions px-5 py-2 rounded-lg text-white font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
                        style={{ backgroundColor: '#4a3728' }}
                      >
                        Mentee Status
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showServiceForm && (
        <ServiceModal
          service={{
            name: 'New Service',
            description: 'Create a new service offering',
            emoji: selectedServiceType?.emoji || '📋',
          }}
          onClose={() => { setShowServiceForm(false); setSaveError(null); }}
          formData={formData}
          setFormData={setFormData}
          handleCreateService={handleCreateServiceWithApi}   // ← API wala handler
          isSaving={isSavingSession}
          saveError={saveError}
          fieldErrors={fieldErrors}
        />
      )}

      {/* Edit Session Modal */}
      <EditSessionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSession(null);
        }}
        session={selectedSession}
        onStatusChange={handleUpdateSessionStatus}
      />
    </>
  );
}