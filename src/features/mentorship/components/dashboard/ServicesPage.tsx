"use client";

import React, { useState, useEffect } from 'react';
import {
  Briefcase, Users, Clock, Star, Plus, Video, MessageSquare,
  Package, FileText, RefreshCw, ClipboardList, CheckCircle2,
  MoreVertical, Pencil, Trash2, X, ArrowUpDown,
} from 'lucide-react';
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

// NOTE: `emoji` kept only because ServiceModal still expects it as a prop.
// It is no longer rendered anywhere in this file — `icon` (lucide component) is used instead.
const serviceTypes = [
  { name: 'quick_call', label: 'Quick Call', icon: Video, description: 'Quick 30-minute call', emoji: '⚡', accent: '#2563eb' },
  { name: 'deep_dive', label: 'Deep Dive', icon: Video, description: 'In-depth 60-minute session', emoji: '🎯', accent: '#7c3aed' },
  { name: 'resume_review', label: 'Resume Review', icon: FileText, description: 'Professional resume review', emoji: '📄', accent: '#d97706' },
  { name: 'mock_interview', label: 'Mock Interview', icon: MessageSquare, description: 'Practice interview', emoji: '🎤', accent: '#0d9488' },
  { name: 'career_planning', label: 'Career Planning', icon: Briefcase, description: 'Career roadmap planning', emoji: '🗺️', accent: '#4338ca' },
  { name: 'portfolio_review', label: 'Portfolio Review', icon: Package, description: 'Portfolio review', emoji: '💼', accent: '#db2777' },
  { name: 'ask_query', label: 'Ask a Query', icon: MessageSquare, description: 'Text-based async query', emoji: '❓', accent: '#b45309' },
  { name: 'group_session', label: 'Group Session', icon: Users, description: 'Group learning sessions', emoji: '👥', accent: '#15803d' },
];

// Fallback icon for unknown/legacy service types
const FallbackIcon = ClipboardList;
const FALLBACK_ACCENT = '#7a5c3e';

const getServiceIcon = (typeName: string) =>
  serviceTypes.find(t => t.name === typeName)?.icon || FallbackIcon;

const getServiceAccent = (typeName: string) =>
  serviceTypes.find(t => t.name === typeName)?.accent || FALLBACK_ACCENT;

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

// ── Price unit helper ───────────────────────────────────
// group_session is priced per-person, everything else is per-hour.
// Free (0) always just shows "Free" regardless of type.
const getPriceLabel = (price: number, type: string) => {
  if (!price || price === 0) return 'Free';
  if (type === 'group_session') return `₹${price}/person`;
  return `₹${price}/hr`;
};

type SortOption = 'recent' | 'price_high' | 'price_low' | 'name';

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Most recent',
  price_high: 'Price: High to Low',
  price_low: 'Price: Low to High',
  name: 'Name (A-Z)',
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // ── Edit Session Modal state ───────────────────────────
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  // ── Sort state (client-side only, no backend impact) ───
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

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
        await SessionService.confirmSession(sessionId, bookingId);
      }
      await fetchAllSessions();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update session status');
    }
  };

    // ── Edit service: prefill formData & open modal ────────
    const handleEditService = (service: any) => {
      const raw = apiSessions.find((s: any) => s.sessionId === service.sessionId);
      if (!raw) return;
  
      const type = serviceTypes.find(t => t.name === raw.sessionType) || null;
      setSelectedServiceType(type);
      setFormData({
        ...formData,
        serviceType: raw.sessionType,
        serviceName: raw.title,
        description: raw.description || '',
        topic: raw.topic || '',
        price: raw.pricing?.basePrice ?? raw.pricePerPerson ?? '',
        scheduledAt: raw.scheduledAt ? new Date(raw.scheduledAt).toISOString().slice(0, 16) : '',
        duration: raw.duration ?? '',
        followUpPeriod: String(raw.followUp?.periodDays ?? '24'),
        // 🔧 FIX: both branches used to return '1' regardless of the actual
        // stored value, so edit mode always showed "follow-up allowed" as
        // true even when it was false in the DB. Now it reflects raw data.
        followUpAllowed: raw.followUp?.allowed ? '1' : '0',
        bufferTime: String(raw.bufferTimeMinutes ?? '5'),
        minParticipants: raw.minParticipants ?? '',
        maxParticipants: raw.maxParticipants ?? '',
        portfolioUrl: raw.portfolioUrl || '',
        thumbnailImage: raw.thumbnailImage || raw.image || raw.thumbnailUrl || '',
      });


      setEditingSession(raw);
      setIsEditMode(true);
      setSaveError(null);
      setFieldErrors({});
      setShowServiceForm(true);
      setOpenMenuId(null);
    };
  
         // ── Delete service: validate, then open the styled confirm modal ──
  const handleDeleteService = (service: any) => {
    setOpenMenuId(null);
    if (!service.sessionId) return;

    if (service.type === 'group_session') {
      const participantCount = (service as any).currentParticipants ?? 0;
      if (participantCount > 0) {
        alert('This group session has registered participants. Cancel it first before deleting.');
        return;
      }
      setDeleteTarget(service);
      return;
    }

    const bookings = (service as any).bookings ?? [];
    const hasActiveBooking = bookings.some((b: any) => b.status !== 'cancelled');
    if (hasActiveBooking) {
      alert('This service has active bookings. Please cancel the booking(s) first from Mentee Status before deleting.');
      return;
    }

    setDeleteTarget(service);
  };

  // ── Actually perform the delete after modal confirmation ──
  const confirmDeleteService = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'group_session') {
        await MentorService.deleteGroupSession(deleteTarget.sessionId);
      } else {
        await SessionService.deleteSession(deleteTarget.sessionId);
      }
      await fetchAllSessions();
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete service.');
    } finally {
      setIsDeleting(false);
    }
  };


    // ── Create/Update session via API ──────────────────────
    const handleCreateServiceWithApi = async () => {
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

      if (isEditMode && editingSession) {
        if (formData.serviceType === "group_session") {
          // updateGroupSessionValidator sirf ye fields accept karta hai
          const groupUpdatePayload: Record<string, any> = {
            title: formData.serviceName,
            description: formData.description || "",
          };
          await MentorService.updateGroupSession(editingSession.sessionId, groupUpdatePayload);
        } else {
          // ⚠️ Backend service layer (mentorshipSessionService.updateSession)
          // only allows: title, description, notes, thumbnailImage.
          // Price/schedule/duration edits aren't supported by the backend yet.
          const updatePayload: Record<string, any> = {
            title: formData.serviceName,
            description: formData.description || "",
          };
          if (formData.thumbnailImage && typeof formData.thumbnailImage !== 'string') {
            updatePayload.thumbnailImage = formData.thumbnailImage;
          }
          await SessionService.updateSession(editingSession.sessionId, updatePayload);
        }
        setIsEditMode(false);
        setEditingSession(null);
        handleCreateService();
        await fetchAllSessions();
        setShowServiceForm(false);
        setSaveError(null);
        setFieldErrors({});
        return;
      }

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
          paymentMethod: "stripe",
          bufferTimeMinutes: Number(formData.bufferTime) || 0,
          followUp: {
            allowed: formData.followUpAllowed !== undefined && Number(formData.followUpAllowed) > 0,
            // ✅ FIX: convert hours-based dropdown value to days (backend caps at 30 days)
            periodDays: Math.max(0, Math.round((Number(formData.followUpPeriod) || 0) / 24)),
          },
          thumbnailImage: formData.thumbnailImage,
        };
        await MentorService.createGroupSession(groupSessionInput);
      } else {
        const isFree = false;
        const sessionInput: CreateSessionInput = {
          sessionType: formData.serviceType,
          scheduledAt: scheduledAtISO,
          timezone: "Asia/Kolkata",
          title: formData.serviceName,
          description: formData.description || "",
          paymentMethod: "stripe",
          ...(formData.serviceType === "mock_interview" ? { interviewType: "technical" } : {}),
          ...(formData.serviceType === "career_planning" ? { targetCompany: "General", targetRole: "General" } : {}),
          duration: Number(formData.duration) || 60,
          followUp: {
            // ✅ FIX: dropdown values are in HOURS (24/48/72/96/120), but the
            // backend's `periodDays` field expects DAYS with a max of 30.
            // Sending raw hours (e.g. 96 for "4 Days") blew past that limit
            // and caused "Validation failed" for every option except 24 Hours.
            allowed: formData.followUpAllowed !== undefined && Number(formData.followUpAllowed) > 0,
            periodDays: Math.max(0, Math.round((Number(formData.followUpPeriod) || 0) / 24)),
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
    ...apiSessions.map((s: any) => {
      const bookings = s.bookings ?? [];
      // 🔧 FIX: this used to be hardcoded to 0 for every card, so the
      // "X sessions completed" line never reflected reality even though the
      // badges above it (pending/confirmed/done) computed it correctly.
      const completedSessions = bookings.filter((b: any) => b.status === 'completed').length;
      return {
        name: s.title,
        price: s.pricing?.basePrice ?? s.pricePerPerson ?? 0,
        sessions: completedSessions,
        type: s.sessionType,
        description: s.description || "",
        sessionId: s.sessionId,
        status: s.status,
        bookings,
        // 🔧 FIX: this was never being read from the API response, so the
        // card always fell back to the icon placeholder even when a
        // thumbnail had actually been uploaded and saved.
        thumbnailImage: s.thumbnailImage || s.image || s.thumbnailUrl || null,
        isApi: true,
      };
    }),
    ...completedServices
      .filter(cs => !apiSessionTitles.has(cs.serviceName))
      .map(s => ({
        name: s.serviceName,
        price: s.price,
        sessions: 0,
        type: s.serviceType,
        description: s.description || "",
        sessionId: null,
        status: "local",
        bookings: [],
        thumbnailImage: s.thumbnailImage || s.image || null,
        isApi: false,
      })),
  ];

  // ── Apply client-side sort (display only — never mutates source data) ──
  const sortedServices = [...displayServices].sort((a, b) => {
    switch (sortBy) {
      case 'price_high':
        return (b.price || 0) - (a.price || 0);
      case 'price_low':
        return (a.price || 0) - (b.price || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'recent':
      default:
        return 0;
    }
  });

  // ── Render ─────────────────────────────────────────────
  return (
    <>
      <div className="space-y-8 animate-fadeIn">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#4a3728' }}>
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#4a3728' }}>My Services</h2>
              <p style={{ color: '#8a7a6a' }} className="text-sm">Manage your offerings</p>
            </div>
          </div>

          <button
            onClick={fetchAllSessions}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f3ece4]"
            style={{ color: '#7a5c3e', border: '1.5px solid #e0d8cf', backgroundColor: '#fff' }}
          >
            <RefreshCw className={`w-4 h-4 ${sessionsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats — real data from API, now as standalone cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'Total Sessions', value: sessionsLoading ? '—' : String(totalSessions), accent: '#2563eb' },
            { icon: Clock, label: 'Completed', value: sessionsLoading ? '—' : String(completedCount), accent: '#15803d' },
            { icon: Star, label: 'Avg Rating', value: avgRating, accent: '#d97706' },
          ].map(({ icon: Icon, label, value, accent }) => (
            <div
              key={label}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border"
              style={{ borderColor: '#e0d8cf' }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${accent}1A` }}
              >
                <Icon className="w-5 h-5" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#8a7a6a' }}>{label}</p>
                <p className="text-xl font-bold leading-none" style={{ color: '#4a3728' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Service Type Selector + Preview */}
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-3">
            <nav className="space-y-1.5">
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
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{
                      backgroundColor: isActive ? '#4a3728' : 'transparent',
                      color: isActive ? '#fff' : '#5c4a3a',
                    }}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : `${type.accent}1A` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: isActive ? '#fff' : type.accent }} />
                    </span>
                    <span className="flex-1 text-left">{type.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="col-span-12 lg:col-span-9">
            <div
              className="rounded-2xl border flex flex-col items-center justify-center text-center px-8"
              style={{ borderColor: '#e0d8cf', minHeight: '360px', backgroundColor: '#fbf7f3' }}
            >
              {selectedServiceType ? (
                <>
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${selectedServiceType.accent}1A` }}
                  >
                    <selectedServiceType.icon className="w-9 h-9" style={{ color: selectedServiceType.accent }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#4a3728' }}>
                    Create {selectedServiceType.label}
                  </h3>
                  <p className="text-base max-w-sm mb-8" style={{ color: '#8a7a6a' }}>
                    {selectedServiceType.description}
                  </p>
                  <button
                    onClick={() => { setSaveError(null); setShowServiceForm(true); }}
                    className="text-white px-7 py-3.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 font-semibold"
                    style={{ backgroundColor: '#4a3728' }}
                  >
                    <Plus className="w-5 h-5" />
                    Add {selectedServiceType.label}
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: '#f3ece4' }}
                  >
                    <ClipboardList className="w-9 h-9" style={{ color: '#8a7a6a' }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#4a3728' }}>Select a service type</h3>
                  <p className="text-sm max-w-xs mb-6" style={{ color: '#8a7a6a' }}>
                    Choose one from the list on the left to get started.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {serviceTypes.slice(0, 4).map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.name}
                          onClick={() => {
                            setSelectedServiceType(type);
                            setFormData({ ...formData, serviceType: type.name });
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-colors hover:bg-[#f3ece4]"
                          style={{ borderColor: '#e0d8cf', color: '#5c4a3a', backgroundColor: '#fff' }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: type.accent }} />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Current Services — real API data */}
        <div>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h3 className="text-lg font-bold" style={{ color: '#4a3728' }}>Current Services</h3>

            <div className="flex items-center gap-3">
              {sessionsLoading && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: '#f3ece4', color: '#7a5c3e' }}>
                  Loading…
                </span>
              )}

              {sortedServices.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setSortMenuOpen((v) => !v)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors hover:bg-[#f3ece4]"
                    style={{ borderColor: '#e0d8cf', color: '#5c4a3a', backgroundColor: '#fff' }}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {SORT_LABELS[sortBy]}
                  </button>
                  {sortMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setSortMenuOpen(false)} />
                      <div
                        className="absolute right-0 top-10 z-20 w-44 rounded-xl shadow-lg overflow-hidden"
                        style={{ border: '1px solid #e0d8cf', backgroundColor: '#fff' }}
                      >
                        {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => { setSortBy(opt); setSortMenuOpen(false); }}
                            className="w-full text-left px-3.5 py-2.5 text-xs font-medium hover:bg-[#f3ece4] transition-colors"
                            style={{ color: sortBy === opt ? '#4a3728' : '#5c4a3a', fontWeight: sortBy === opt ? 700 : 500 }}
                          >
                            {SORT_LABELS[opt]}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {!sessionsLoading && sortedServices.length === 0 ? (
            <div className="text-center py-14 rounded-2xl border" style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3' }}>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#f3ece4' }}
              >
                <ClipboardList className="w-6 h-6" style={{ color: '#8a7a6a' }} />
              </div>
              <p className="text-base font-bold" style={{ color: '#4a3728' }}>No services yet</p>
              <p className="text-sm mt-1" style={{ color: '#8a7a6a' }}>
                Select a service type above and create your first offering.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedServices.map((service, idx) => {
                const Icon = getServiceIcon(service.type);
                const accent = getServiceAccent(service.type);
                return (
                  <div
                    key={service.sessionId || idx}
                    className="bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    style={{ borderColor: '#e0d8cf' }}
                  >
                    {/* Thumbnail — real service image if one was uploaded,
                        otherwise a quiet brand-toned panel (no per-type
                        rainbow accent) so the grid reads as one collection */}
                    <div
                      className="w-full h-32 flex items-center justify-center relative"
                      style={{ backgroundColor: '#f3ece4' }}
                    >
                      {(service as any).thumbnailImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(service as any).thumbnailImage}
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className="w-8 h-8" style={{ color: '#8a7a6a' }} />
                      )}
                      <span
                        className="absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: '#fff' }}
                      >
                        <Icon className="w-4 h-4" style={{ color: accent }} />
                      </span>
                    </div>

                    <div className="p-5">
                    {/* status counts + menu */}
                    <div className="flex items-start justify-end mb-4">
                      {(() => {
                        const bookings = (service as any).bookings ?? [];
                        const pending = bookings.filter((b: any) => b.status === 'pending').length;
                        const confirmed = bookings.filter((b: any) => b.status === 'confirmed').length;
                        const completed = bookings.filter((b: any) => b.status === 'completed').length;
                        const menuKey = service.sessionId || String(idx);

                        return (
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {pending > 0 && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                                {pending} pending
                              </span>
                            )}
                            {confirmed > 0 && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                                {confirmed} confirmed
                              </span>
                            )}
                            {completed > 0 && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                                {completed} done
                              </span>
                            )}

                            {service.isApi && (
                              <div className="relative">
                                <button
                                  onClick={() => setOpenMenuId(openMenuId === menuKey ? null : menuKey)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#f3ece4] transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4" style={{ color: '#8a7a6a' }} />
                                </button>
                                {openMenuId === menuKey && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                    <div
                                      className="absolute right-0 top-8 z-20 w-32 rounded-lg shadow-lg overflow-hidden"
                                      style={{ border: '1px solid #e0d8cf', backgroundColor: '#fff' }}
                                    >
                                      <button
                                        onClick={() => handleEditService(service)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#f3ece4] transition-colors"
                                        style={{ color: '#4a3728' }}
                                      >
                                        <Pencil className="w-3 h-3" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteService(service)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#fee2e2] transition-colors"
                                        style={{ color: '#dc2626' }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <h3 className="text-base font-bold mb-1.5" style={{ color: '#4a3728' }}>{service.name}</h3>

                    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold mb-3"
                      style={{ backgroundColor: `${accent}1A`, color: accent }}>
                      {serviceTypes.find(t => t.name === service.type)?.label || service.type}
                    </span>

                    <p className="mb-4 text-sm line-clamp-2" style={{ color: '#8a7a6a' }}>
                      {service.description || `Professional ${service.name.toLowerCase()} session`}
                    </p>

                    <div className="flex items-center gap-1.5 mb-4">
                      <Users className="w-3.5 h-3.5" style={{ color: '#8a7a6a' }} />
                      <span className="text-xs" style={{ color: '#8a7a6a' }}>
                        {service.sessions} sessions completed
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-3 pt-4" style={{ borderTop: '1px solid #f0ebe4' }}>
                      <span className="text-lg font-bold whitespace-nowrap" style={{ color: '#7a5c3e' }}>
                        {getPriceLabel(service.price, service.type)}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedSession(service);
                          setIsEditModalOpen(true);
                        }}
                        className="editCurrentSessions px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors hover:opacity-90 whitespace-nowrap"
                        style={{ backgroundColor: '#4a3728' }}
                      >
                        Mentee Status
                      </button>
                    </div>
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
            name: isEditMode ? (editingSession?.title || 'Edit Service') : 'New Service',
            description: isEditMode ? 'Update your service offering' : 'Create a new service offering',
            emoji: selectedServiceType?.emoji || '📋',
          }}

          onClose={() => {
            setShowServiceForm(false);
            setSaveError(null);
            setIsEditMode(false);
            setEditingSession(null);
          }}
          formData={formData}
          setFormData={setFormData}
          handleCreateService={handleCreateServiceWithApi}
          isSaving={isSavingSession}
          saveError={saveError}
          fieldErrors={fieldErrors}
          isEditMode={isEditMode}
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            style={{ border: '1px solid #e0d8cf' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#fee2e2' }}>
                  <Trash2 className="w-5 h-5" style={{ color: '#dc2626' }} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: '#4a3728' }}>
                  Delete service?
                </h3>
              </div>
              <button
                onClick={() => !isDeleting && setDeleteTarget(null)}
                disabled={isDeleting}
                className="p-1 hover:bg-[#f3ece4] rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" style={{ color: '#8a7a6a' }} />
              </button>
            </div>

            <p className="text-sm mb-6" style={{ color: '#8a7a6a' }}>
              Are you sure you want to delete <span className="font-semibold" style={{ color: '#4a3728' }}>"{deleteTarget.name}"</span> permanently? This cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid #f0ebe4' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border transition-colors disabled:opacity-50 hover:bg-[#f3ece4]"
                style={{ borderColor: '#e0d8cf', color: '#4a3728', backgroundColor: '#fbf7f3' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteService}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-60 hover:opacity-90"
                style={{ backgroundColor: '#dc2626' }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}