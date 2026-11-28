"use client";
//src/features/mentorship/components/dashboard/ServicesPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Briefcase, Users, Clock, Star, Plus, Video, MessageSquare,
  Package, FileText, RefreshCw, ClipboardList,
  Trash2, X, ArrowUpDown, AlertCircle, Search, ArrowLeft
} from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ServiceModal from './ServiceModal';
import EditSessionModal from '@/features/mentorship/modals/EditSessionModal';
import MentorService, { CreateGroupSessionInput } from "@/lib/api/mentorship.service";
import SessionService, { CreateSessionInput } from "@/lib/api/session.service";
import { validateSessionForm } from '@/features/profile/validators/session.schema';
import { ServiceCard } from './ServiceCard';
import { GroupSessionCard } from './GroupSessionCard';

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

// Each type uses a lucide icon component; emojis are no longer rendered anywhere.
export const serviceTypes = [
  { name: 'quick_call', label: 'Quick Call', icon: Video, description: 'Quick 30-minute call', accent: '#2563eb' },
  { name: 'deep_dive', label: 'Deep Dive', icon: Video, description: 'In-depth 60-minute session', accent: '#7c3aed' },
  { name: 'resume_review', label: 'Resume Review', icon: FileText, description: 'Professional resume review', accent: '#d97706' },
  { name: 'mock_interview', label: 'Mock Interview', icon: MessageSquare, description: 'Practice interview', accent: '#0d9488' },
  { name: 'career_planning', label: 'Career Planning', icon: Briefcase, description: 'Career roadmap planning', accent: '#4338ca' },
  { name: 'portfolio_review', label: 'Portfolio Review', icon: Package, description: 'Portfolio review', accent: '#db2777' },
  { name: 'ask_query', label: 'Ask a Query', icon: MessageSquare, description: 'Text-based async query', accent: '#b45309' },
  { name: 'group_session', label: 'Group Session', icon: Users, description: 'Group learning sessions', accent: '#15803d' },
];

// Every time a service type is selected we start with a FRESH blank form,
// so old values never carry over between service types.
const getDefaultFormData = (serviceType: string = '') => ({
  serviceType,
  serviceName: '',
  description: '',
  topic: '',
  price: '',
  isFree: false,
  scheduledAt: '',
  duration: '',
  followUpPeriod: '1',
  followUpAllowed: '1',
  bufferTime: '5',
  minParticipants: '',
  maxParticipants: '',
  portfolioUrl: '',
  thumbnailImage: '',
  removeThumbnailImage: false,
  responseTime: '',
  meetingUrl: '',
  // group_session is always availability-based, so isTemplate is always true.
  isTemplate: true,
});

// The browser's actual timezone (instead of a hardcoded Asia/Kolkata)
const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

// Services without a date in the form (Quick Call etc.) get a safe future time.
// 60 min lead so even a small clock skew does not fail. The backend has its own fallback too.
const SCHEDULE_LEAD_MINUTES = 60;
const buildScheduledAtISO = (raw?: string): string => {
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime()) && d.getTime() > Date.now() + 60_000) return d.toISOString();
  }
  return new Date(Date.now() + SCHEDULE_LEAD_MINUTES * 60_000).toISOString();
};

// Builds a datetime-local string in the browser's local timezone.
// Using toISOString() (UTC) shifted the time by 5:30 hours for IST users.
const toLocalDatetimeString = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Fallback icon for unknown/legacy service types
const FallbackIcon = ClipboardList;
const FALLBACK_ACCENT = '#7a5c3e';

export const getServiceIcon = (typeName: string) =>
  serviceTypes.find(t => t.name === typeName)?.icon || FallbackIcon;

export const getServiceAccent = (typeName: string) =>
  serviceTypes.find(t => t.name === typeName)?.accent || FALLBACK_ACCENT;

// Status badge color helper
export const statusStyle = (status: string) => {
  switch (status) {
    case 'confirmed': return { bg: '#dcfce7', color: '#15803d' };
    case 'pending': return { bg: '#fef3c7', color: '#b45309' };
    case 'completed': return { bg: '#dbeafe', color: '#1d4ed8' };
    case 'cancelled': return { bg: '#fee2e2', color: '#dc2626' };
    case 'in_progress': return { bg: '#f3e8ff', color: '#7c3aed' };
    default: return { bg: '#f3f4f6', color: '#6b7280' };
  }
};

// -- Price unit helper --
// group_session is priced per person, everything else is a flat price.
// A price of 0 always shows "Free".
export const getPriceLabel = (price: number, type: string) => {
  if (!price || price === 0) return 'Free';
  if (type === 'group_session') return `₹${price}/person`;
  return `₹${price}`;
};

// How many cards to show at first (the rest open with "Show all")
const INITIAL_VISIBLE_COUNT = 6;

type SortOption = 'recent' | 'price_high' | 'price_low' | 'name';

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Most recent',
  price_high: 'Price: High to Low',
  price_low: 'Price: Low to High',
  name: 'Name (A-Z)',
};

// -- Small shared UI pieces --
const COLORS = {
  ink: '#4a3728',
  muted: '#8a7a6a',
  border: '#e0d8cf',
  soft: '#f3ece4',
  cream: '#fbf7f3',
  brand: '#7a5c3e',
};

const CARD_GRID_STYLE: React.CSSProperties = {
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
};

function SectionHeader({
  title, subtitle, count, right,
}: { title: string; subtitle: string; count?: number; right?: React.ReactNode }) {
  return (
    <div className="flex items-start sm:items-end justify-between flex-col sm:flex-row gap-3 mb-5">
      <div>
        <div className="flex items-center gap-2.5">
          <h3 className="text-xl font-bold tracking-tight" style={{ color: COLORS.ink }}>{title}</h3>
          {typeof count === 'number' && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: COLORS.soft, color: COLORS.brand }}
            >
              {count}
            </span>
          )}
        </div>
        <p className="text-sm mt-0.5" style={{ color: COLORS.muted }}>{subtitle}</p>
      </div>
      {right && <div className="flex items-center gap-3 self-end sm:self-auto">{right}</div>}
    </div>
  );
}

function EmptyState({
  icon: Icon, title, text, action,
}: { icon: React.ElementType; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl border border-dashed"
      style={{ borderColor: COLORS.border, backgroundColor: COLORS.cream }}
    >
      <div className="w-12 h-12 mb-3 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.soft }}>
        <Icon className="w-5 h-5" style={{ color: COLORS.muted }} />
      </div>
      <p className="text-base font-bold" style={{ color: COLORS.ink }}>{title}</p>
      <p className="text-sm mt-1 max-w-sm" style={{ color: COLORS.muted }}>{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[20px] border bg-white overflow-hidden motion-safe:animate-pulse" style={{ borderColor: COLORS.border }}>
      <div className="aspect-video" style={{ backgroundColor: COLORS.soft }} />
      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 rounded" style={{ backgroundColor: COLORS.soft }} />
        <div className="h-3 w-full rounded" style={{ backgroundColor: COLORS.soft }} />
        <div className="h-3 w-2/3 rounded" style={{ backgroundColor: COLORS.soft }} />
        <div className="h-9 w-full rounded-lg mt-4" style={{ backgroundColor: COLORS.soft }} />
      </div>
    </div>
  );
}

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // -- API state --
  const [apiSessions, setApiSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [apiGroupSessions, setApiGroupSessions] = useState<any[]>([]);
  const [groupSessionsLoading, setGroupSessionsLoading] = useState(false);
  const [groupSessionsError, setGroupSessionsError] = useState<string | null>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Styled popup shown when delete is blocked (active bookings/participants)
  const [blockedDeleteMessage, setBlockedDeleteMessage] = useState<string | null>(null);

  // -- Edit Session Modal state --
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('edit');
  // -- Sort state (client-side only, no backend impact) --
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllGroupSessions, setShowAllGroupSessions] = useState(false);

  const isSearchView = searchParams.get('tab') === 'services_search';
  const urlSearchQuery = searchParams.get('q') || '';
  const [resultsSearchQuery, setResultsSearchQuery] = useState(urlSearchQuery);

  useEffect(() => {
    if (isSearchView) {
      setResultsSearchQuery(urlSearchQuery);
    }
  }, [urlSearchQuery, isSearchView]);

  // Debounce search query by 250ms for performance on large lists
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Handle Escape key to clear and close search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (searchQuery || searchOpen)) {
        setSearchQuery('');
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, searchOpen]);

  // -- Stats from API (service offerings, not bookings) --
  const totalServicesOffered = apiSessions.length + apiGroupSessions.length;
  const activeServicesCount =
    apiSessions.filter(s => s.status !== 'cancelled' && s.status !== 'draft').length +
    apiGroupSessions.filter(g => g.status !== 'cancelled' && g.status !== 'draft').length;
  const avgRating = "-";   // will come from the review API later

  useEffect(() => {
    if (mentorData?.mentorId) {
      fetchAllSessions();
      fetchGroupSessions();
    }
  }, [mentorData?.mentorId]);

  // -- Fetch all group sessions --
  const fetchGroupSessions = async () => {
    setGroupSessionsLoading(true);
    setGroupSessionsError(null);
    try {
      if (!mentorData?.mentorId) return;
      const res = await MentorService.getAllGroupSessions({ mentorId: mentorData.mentorId });
      let groups: any[] = [];
      if (Array.isArray(res)) groups = res;
      else if (res && Array.isArray(res.data)) groups = res.data;
      else if (res?.data && Array.isArray(res.data.data)) groups = res.data.data;
      setApiGroupSessions(groups);
    } catch (err: any) {
      console.error("Group Sessions fetch failed:", err.message);
      setGroupSessionsError(err.message || "Failed to load group sessions.");
    } finally {
      setGroupSessionsLoading(false);
    }
  };

  // -- Fetch all sessions --
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

  // -- Update session status --
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

  // -- Open the create form for a chosen service type --
  const handleSelectServiceType = (type: any) => {
    setSelectedServiceType(type);
    setFormData(getDefaultFormData(type.name));
    setIsEditMode(false);
    setEditingSession(null);
    setSaveError(null);
    setFieldErrors({});
    setShowServiceForm(true);
  };

  // -- Edit service: prefill formData & open modal --
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
      scheduledAt: raw.scheduledAt ? toLocalDatetimeString(new Date(raw.scheduledAt)) : '',
      duration: raw.duration ?? '',
      followUpPeriod: String(raw.followUp?.periodDays ?? '24'),
      // Reflects the stored value instead of always being '1'.
      followUpAllowed: raw.followUp?.allowed ? '1' : '0',
      bufferTime: String(raw.bufferTimeMinutes ?? '5'),
      minParticipants: raw.minParticipants ?? '',
      maxParticipants: raw.maxParticipants ?? '',
      portfolioUrl: raw.portfolioUrl || '',
      thumbnailImage: raw.thumbnailImage || raw.image || raw.thumbnailUrl || '',
      removeThumbnailImage: false,
      meetingUrl: raw.meeting?.meetingUrl || raw.meetingUrl || '',
    });

    setEditingSession(raw);
    setIsEditMode(true);
    setSaveError(null);
    setFieldErrors({});
    setShowServiceForm(true);
    setOpenMenuId(null);
  };

  // -- Delete service: validate, then open the styled confirm modal --
  const handleDeleteService = (service: any) => {
    setOpenMenuId(null);
    if (!service.sessionId) return;

    if (service.type === 'group_session') {
      // Backend (group.service.ts -> deleteGroupSession) decides:
      // live/upcoming sessions are blocked, completed/cancelled ones are archived.
      // Its error message is shown via confirmDeleteService's catch.
      setDeleteTarget(service);
      return;
    }

    const bookings = (service as any).bookings ?? [];
    const hasActiveBooking = bookings.some(
      (b: any) => !['cancelled', 'completed', 'missed'].includes(b.status)
    );
    if (hasActiveBooking) {
      setBlockedDeleteMessage('This service has active bookings. Please cancel the booking(s) first from Mentee Status before deleting.');
      return;
    }

    setDeleteTarget(service);
  };

  // -- Actually perform the delete after modal confirmation --
  const confirmDeleteService = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'group_session') {
        await MentorService.deleteGroupSession(deleteTarget.sessionId);
        // Group sessions live in apiGroupSessions (separate from apiSessions),
        // so they need their own refresh.
        await fetchGroupSessions();
      } else {
        await SessionService.deleteSession(deleteTarget.sessionId);
        await fetchAllSessions();
      }
      setDeleteTarget(null);
    } catch (err: any) {
      setBlockedDeleteMessage(err.message || 'Failed to delete service.');
    } finally {
      setIsDeleting(false);
    }
  };

  // -- Create/Update session via API --
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
      // If the form has no date (Quick Call etc.) we build a safe future time.
      // The backend also applies its own server-time fallback.
      const scheduledAtISO = buildScheduledAtISO(formData.scheduledAt);
      // The mentor's real browser timezone (not hardcoded)
      const userTimezone = getUserTimezone();
      const isGroupTemplateMode = formData.serviceType === "group_session" && !!formData.isTemplate;

      if (isEditMode && editingSession) {
        if (formData.serviceType === "group_session") {
          // updateGroupSessionValidator only accepts these fields
          const groupUpdatePayload: Record<string, any> = {
            title: formData.serviceName,
            description: formData.description || "",
            ...(formData.meetingUrl ? { meetingUrl: formData.meetingUrl } : {}),
          };
          await MentorService.updateGroupSession(editingSession.sessionId, groupUpdatePayload);
        } else {
          const editScheduledAt = formData.scheduledAt
            ? new Date(formData.scheduledAt).toISOString()
            : editingSession.scheduledAt
              ? new Date(editingSession.scheduledAt).toISOString()
              : undefined;

          const updatePayload: Record<string, any> = {
            title: formData.serviceName,
            description: formData.description || "",
            ...(editScheduledAt ? { scheduledAt: editScheduledAt } : {}),
            duration: Number(formData.duration) || 60,
            pricing: {
              basePrice: Number(formData.price),
              platformFee: Math.round(Number(formData.price) * 0.15),
              totalAmount: Number(formData.price) + Math.round(Number(formData.price) * 0.15),
              currency: "INR",
            },
          };
          if (formData.thumbnailImage && typeof formData.thumbnailImage !== 'string') {
            updatePayload.thumbnailImage = formData.thumbnailImage;
          } else if (formData.removeThumbnailImage && !formData.thumbnailImage) {
            // The user removed the image, tell the backend to delete the old one
            updatePayload.removeThumbnailImage = true;
          }
          await SessionService.updateSession(editingSession.sessionId, updatePayload);
        }

        // The service Duration syncs to the default slot-duration in Availability.
        // If this fails it must not block saving the service.
        try {
          const newDuration = Number(formData.duration) || 30;
          await MentorService.updateMentorAvailability(mentorData.mentorId, {
            slotDuration: newDuration,
          });
          // The mentorData prop is not refreshed in the parent, so we notify AvailabilityPage
          // through localStorage (for remount) + a custom event (for live update).
          try { localStorage.setItem("mentor_slotDuration", String(newDuration)); } catch {}
          window.dispatchEvent(new CustomEvent("mentorSlotDurationUpdated", { detail: newDuration }));
        } catch (syncErr: any) {
          console.error("Failed to sync slot duration to availability:", syncErr.message);
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
        // In template mode scheduledAt is not sent at all (mentees pick slots from availability).
        const groupSessionInput: CreateGroupSessionInput = {
          title: formData.serviceName,
          description: formData.description || "",
          topic: formData.topic,
          duration: Number(formData.duration) || 60,
          timezone: userTimezone,
          maxParticipants: Number(formData.maxParticipants),
          minParticipants: Number(formData.minParticipants),
          pricePerPerson: Number(formData.price) || 0,
          paymentMethod: "stripe",
          bufferTimeMinutes: Number(formData.bufferTime) || 0,
          followUp: {
            allowed: formData.followUpAllowed !== undefined && Number(formData.followUpAllowed) > 0,
            // The dropdown is in hours, the backend wants days (max 30)
            periodDays: Math.max(0, Math.round((Number(formData.followUpPeriod) || 0) / 24)),
          },
          thumbnailImage: formData.thumbnailImage,
          isTemplate: isGroupTemplateMode,
          meetingUrl: formData.meetingUrl,
          ...(isGroupTemplateMode ? {} : { scheduledAt: scheduledAtISO }),
        };
        await MentorService.createGroupSession(groupSessionInput);

      } else {
        const isFree = !!formData.isFree || Number(formData.price) === 0;
        // For "Ask a Query" the response time is appended to the description,
        // because this type has no description field of its own.
        const responseTimeSuffix = formData.serviceType === 'ask_query' && formData.responseTime
          ? `Response time: ${formData.responseTime} ${Number(formData.responseTime) > 1 ? 'Days' : 'Day'}`
          : "";
        const sessionInput: CreateSessionInput = {
          sessionType: formData.serviceType,
          scheduledAt: scheduledAtISO,
          timezone: userTimezone,
          title: formData.serviceName,
          description: [formData.description, responseTimeSuffix].filter(Boolean).join(" • ") || "",
          paymentMethod: "stripe",
          ...(formData.serviceType === "mock_interview" ? { interviewType: "technical" } : {}),
          ...(formData.serviceType === "career_planning" ? { targetCompany: "General", targetRole: "General" } : {}),
          duration: Number(formData.duration) || 60,
          followUp: {
            // The dropdown is in hours (24/48/72/96/120), the backend wants `periodDays` in days (max 30).
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

      // As soon as a service is created, the default slot-duration in Availability syncs too.
      try {
        const newDuration = Number(formData.duration) || 30;
        await MentorService.updateMentorAvailability(mentorData.mentorId, {
          slotDuration: newDuration,
        });
        try { localStorage.setItem("mentor_slotDuration", String(newDuration)); } catch {}
        window.dispatchEvent(new CustomEvent("mentorSlotDurationUpdated", { detail: newDuration }));
      } catch (syncErr: any) {
        console.error("Failed to sync slot duration to availability:", syncErr.message);
      }

      handleCreateService();
      await Promise.all([fetchAllSessions(), fetchGroupSessions()]);
      setShowServiceForm(false);
      setSaveError(null);
      setFieldErrors({});
      setSelectedServiceType(null);
      setFormData(getDefaultFormData());

      // After creating a service, redirect to the Availability tab
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'availability');
      params.delete('subtab');
      params.delete('q');
      router.push(`${pathname}?${params.toString()}`);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setIsSavingSession(false);
    }
  };

  // -- Merge API + local services for display --
  const apiSessionTitles = new Set(apiSessions.map((s: any) => s.title));

  const displayServices = [
    ...apiSessions.map((s: any) => {
      const bookings = s.bookings ?? [];
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
        duration: s.duration ?? 0,
        thumbnailImage: s.thumbnailImage || s.image || s.thumbnailUrl || null,
        isApi: true,
        // Needed for the "Most recent" sort
        createdAt: s.createdAt || null,
        scheduledAt: s.scheduledAt || null,
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
        thumbnailImage: (s as any).thumbnailImage || (s as any).image || null,
        duration: (s as any).duration ?? 0,
        isApi: false,
      })),
  ];

  // -- Apply client-side sort (display only) --
  const sortedServices = [...displayServices].sort((a, b) => {
    switch (sortBy) {
      case 'price_high':
        return (b.price || 0) - (a.price || 0);
      case 'price_low':
        return (a.price || 0) - (b.price || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'recent':
      default: {
        // Newest first, createdAt falls back to scheduledAt
        const aDate = new Date((a as any).createdAt || (a as any).scheduledAt || 0).getTime();
        const bDate = new Date((b as any).createdAt || (b as any).scheduledAt || 0).getTime();
        return bDate - aDate;
      }
    }
  });

  // -- Search + 6-card limit --
  const normalizedQuery = (isSearchView ? urlSearchQuery : debouncedQuery).trim().toLowerCase();
  const filteredServices = normalizedQuery
    ? sortedServices.filter((s: any) => {
        const typeLabel = serviceTypes.find(t => t.name === s.type)?.label || '';
        return [s.name, s.description, typeLabel]
          .filter(Boolean)
          .some((v: string) => String(v).toLowerCase().includes(normalizedQuery));
      })
    : sortedServices;
  // The same search applies to group sessions (title / description / topic / "group session")
  const filteredGroupSessions = normalizedQuery
    ? apiGroupSessions.filter((g: any) =>
        [g.title, g.description, g.topic, 'group session']
          .filter(Boolean)
          .some((v: string) => String(v).toLowerCase().includes(normalizedQuery))
      )
    : apiGroupSessions;

  const visibleServices = (isSearchView || showAllServices)
    ? filteredServices
    : filteredServices.slice(0, INITIAL_VISIBLE_COUNT);
  const visibleGroupSessions = (isSearchView || showAllGroupSessions)
    ? filteredGroupSessions
    : filteredGroupSessions.slice(0, INITIAL_VISIBLE_COUNT);

  const goBackToServices = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'services');
    params.delete('q');
    router.push(`${pathname}?${params.toString()}`);
  };

  const backButton = (
    <button
      onClick={goBackToServices}
      className="px-5 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-[#f3ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/40"
      style={{ borderColor: COLORS.border, color: COLORS.ink, backgroundColor: '#fff' }}
    >
      Back to Services
    </button>
  );

  // -- Render --
  return (
    <>
      <div className="space-y-10">
        {isSearchView ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
              <button
                onClick={goBackToServices}
                className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-[#f3ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/40"
                style={{ backgroundColor: '#fff', color: COLORS.ink, borderColor: COLORS.border }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Services
              </button>

              <div
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-white w-full sm:w-72 transition-all focus-within:ring-2 focus-within:ring-[#7a5c3e]/20"
                style={{ borderColor: COLORS.border }}
              >
                <Search className="w-4 h-4 shrink-0" style={{ color: COLORS.muted }} />
                <input
                  type="text"
                  value={resultsSearchQuery}
                  onChange={(e) => setResultsSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setResultsSearchQuery(urlSearchQuery);
                      (e.target as HTMLElement).blur();
                    }
                    if (e.key === 'Enter') {
                      const params = new URLSearchParams(searchParams.toString());
                      if (resultsSearchQuery.trim()) {
                        params.set('tab', 'services_search');
                        params.set('q', resultsSearchQuery.trim());
                      } else {
                        params.set('tab', 'services');
                        params.delete('q');
                      }
                      router.push(`${pathname}?${params.toString()}`);
                    }
                  }}
                  placeholder="Search services..."
                  aria-label="Search services"
                  className="w-full text-sm outline-none bg-transparent placeholder-[#8a7a6a]"
                  style={{ color: COLORS.ink }}
                />
                {resultsSearchQuery && (
                  <button
                    onClick={() => setResultsSearchQuery('')}
                    aria-label="Clear search"
                    className="p-0.5 hover:bg-[#f3ece4] rounded-md transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" style={{ color: COLORS.muted }} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: COLORS.ink }}>
                Search results
              </h2>
              <div className="flex items-center gap-3 flex-wrap mt-2">
                <span className="text-sm" style={{ color: COLORS.muted }}>Showing results for</span>
                <span
                  className="px-3 py-1 rounded-full text-[13px] font-bold"
                  style={{ backgroundColor: COLORS.soft, color: COLORS.ink, border: `1px solid ${COLORS.border}` }}
                >
                  {urlSearchQuery}
                </span>
                <span className="text-sm font-semibold" style={{ color: COLORS.brand }}>
                  {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} and {filteredGroupSessions.length} {filteredGroupSessions.length === 1 ? 'group session' : 'group sessions'} found
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: COLORS.ink }}
                  >
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight" style={{ color: COLORS.ink }}>My Services</h2>
                    <p className="text-sm" style={{ color: COLORS.muted }}>Create and manage what mentees can book with you</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Desktop search input */}
                  <div
                    className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-white w-60 md:w-72 transition-all focus-within:ring-2 focus-within:ring-[#7a5c3e]/20"
                    style={{ borderColor: COLORS.border }}
                  >
                    <Search className="w-4 h-4 shrink-0" style={{ color: COLORS.muted }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowAllServices(false);
                        setShowAllGroupSessions(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setSearchQuery('');
                          setSearchOpen(false);
                          (e.target as HTMLElement).blur();
                        }
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          const params = new URLSearchParams(searchParams.toString());
                          params.set('tab', 'services_search');
                          params.set('q', searchQuery.trim());
                          router.push(`${pathname}?${params.toString()}`);
                        }
                      }}
                      placeholder="Search services..."
                      aria-label="Search services"
                      className="w-full text-sm outline-none bg-transparent placeholder-[#8a7a6a]"
                      style={{ color: COLORS.ink }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                        className="p-0.5 hover:bg-[#f3ece4] rounded-md transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" style={{ color: COLORS.muted }} />
                      </button>
                    )}
                  </div>

                  {/* Mobile search icon button */}
                  <button
                    onClick={() => setSearchOpen(!searchOpen)}
                    aria-label="Search services"
                    className="sm:hidden flex items-center justify-center w-10 h-10 rounded-xl transition-colors hover:bg-[#f3ece4]"
                    style={{ color: COLORS.brand, border: `1.5px solid ${COLORS.border}`, backgroundColor: '#fff' }}
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  {/* Refresh button */}
                  <button
                    onClick={() => { fetchAllSessions(); fetchGroupSessions(); }}
                    aria-label="Refresh services"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f3ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/40"
                    style={{ color: COLORS.brand, border: `1.5px solid ${COLORS.border}`, backgroundColor: '#fff' }}
                  >
                    <RefreshCw className={`w-4 h-4 ${sessionsLoading || groupSessionsLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {/* Mobile expanded search bar */}
              {searchOpen && (
                <div
                  className="sm:hidden flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-white w-full"
                  style={{ borderColor: COLORS.border }}
                >
                  <Search className="w-4 h-4 shrink-0" style={{ color: COLORS.muted }} />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowAllServices(false);
                      setShowAllGroupSessions(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchQuery('');
                        setSearchOpen(false);
                      }
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('tab', 'services_search');
                        params.set('q', searchQuery.trim());
                        router.push(`${pathname}?${params.toString()}`);
                      }
                    }}
                    placeholder="Search services..."
                    aria-label="Search services"
                    className="w-full text-sm outline-none bg-transparent placeholder-[#8a7a6a]"
                    style={{ color: COLORS.ink }}
                  />
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchOpen(false);
                    }}
                    aria-label="Close search"
                    className="p-1 hover:bg-[#f3ece4] rounded-md transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" style={{ color: COLORS.muted }} />
                  </button>
                </div>
              )}
            </div>

            {/* Stats - real service offerings from the API */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Briefcase, label: 'Services offered', value: (sessionsLoading || groupSessionsLoading) ? '-' : String(totalServicesOffered), accent: '#2563eb' },
                { icon: Clock, label: 'Active services', value: (sessionsLoading || groupSessionsLoading) ? '-' : String(activeServicesCount), accent: '#15803d' },
                { icon: Star, label: 'Average rating', value: avgRating, accent: '#d97706' },
              ].map(({ icon: Icon, label, value, accent }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-white border"
                  style={{ borderColor: COLORS.border }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${accent}1A` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: accent }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold leading-none" style={{ color: COLORS.ink }}>{value}</p>
                    <p className="text-xs mt-1.5" style={{ color: COLORS.muted }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Create a new service: pick a type and the form opens right away */}
            <section>
              <SectionHeader
                title="Create a new service"
                subtitle="Choose a type to open the form"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {serviceTypes.map((type) => {
                  const Icon = type.icon;
                  const isActive = selectedServiceType?.name === type.name && showServiceForm;
                  return (
                    <button
                      key={type.name}
                      onClick={() => handleSelectServiceType(type)}
                      className="group relative flex flex-col items-start gap-3 p-4 rounded-2xl border bg-white text-left transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md hover:border-[#7a5c3e]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/40"
                      style={{ borderColor: isActive ? COLORS.ink : COLORS.border }}
                    >
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${type.accent}1A` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: type.accent }} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold" style={{ color: COLORS.ink }}>{type.label}</span>
                        <span className="block text-xs mt-0.5 line-clamp-1" style={{ color: COLORS.muted }}>{type.description}</span>
                      </span>
                      <span
                        className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
                        style={{ backgroundColor: COLORS.ink }}
                      >
                        <Plus className="w-3.5 h-3.5 text-white" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Current services - real API data */}
        <section>
          <SectionHeader
            title="Current services"
            subtitle={isSearchView ? "Your matching mentoring services" : "Your individual mentoring services"}
            count={sessionsLoading && sortedServices.length === 0 ? undefined : filteredServices.length}
            right={
              sortedServices.length > 1 ? (
                <div className="relative">
                  <button
                    onClick={() => setSortMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={sortMenuOpen}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors hover:bg-[#f3ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/40"
                    style={{ borderColor: COLORS.border, color: '#5c4a3a', backgroundColor: '#fff' }}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {SORT_LABELS[sortBy]}
                  </button>
                  {sortMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setSortMenuOpen(false)} />
                      <div
                        role="menu"
                        className="absolute right-0 top-10 z-20 w-48 rounded-xl shadow-lg overflow-hidden"
                        style={{ border: `1px solid ${COLORS.border}`, backgroundColor: '#fff' }}
                      >
                        {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                          <button
                            key={opt}
                            role="menuitem"
                            onClick={() => { setSortBy(opt); setSortMenuOpen(false); }}
                            className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#f3ece4] transition-colors"
                            style={{ color: sortBy === opt ? COLORS.ink : '#5c4a3a', fontWeight: sortBy === opt ? 700 : 500 }}
                          >
                            {SORT_LABELS[opt]}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : undefined
            }
          />

          {sessionsLoading && sortedServices.length === 0 ? (
            <div className="grid gap-6" style={CARD_GRID_STYLE}>
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : sortedServices.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No services yet"
              text="Pick a service type above to create your first offering."
            />
          ) : filteredServices.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No services found"
              text={`No services matched your search for "${isSearchView ? urlSearchQuery : searchQuery}".`}
              action={isSearchView ? backButton : undefined}
            />
          ) : (
            <>
              <div className="grid gap-6" style={CARD_GRID_STYLE}>
                {visibleServices.map((service, idx) => (
                  <ServiceCard
                    key={service.sessionId || idx}
                    service={service}
                    onEdit={handleEditService}
                    onDelete={handleDeleteService}
                    onMenteeStatus={(srv) => {
                      setSelectedSession(srv);
                      setModalMode('view');
                      setIsEditModalOpen(true);
                    }}
                  />
                ))}
              </div>
              {filteredServices.length > INITIAL_VISIBLE_COUNT && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowAllServices((v) => !v)}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-[#f3ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/40"
                    style={{ borderColor: COLORS.border, color: COLORS.ink, backgroundColor: '#fff' }}
                  >
                    {showAllServices ? 'Show less' : `Show all services (${filteredServices.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Current group sessions */}
        <section>
          <SectionHeader
            title="Current group sessions"
            subtitle={isSearchView ? "Your matching group sessions" : "Your upcoming group learning sessions"}
            count={groupSessionsLoading || groupSessionsError ? undefined : filteredGroupSessions.length}
          />

          {groupSessionsLoading ? (
            <div className="grid gap-6" style={CARD_GRID_STYLE}>
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : groupSessionsError ? (
            <EmptyState
              icon={AlertCircle}
              title="Could not load group sessions"
              text={groupSessionsError}
              action={
                <button
                  onClick={fetchGroupSessions}
                  className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/40"
                  style={{ backgroundColor: COLORS.ink }}
                >
                  Try again
                </button>
              }
            />
          ) : apiGroupSessions.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No group sessions"
              text="Create your first group session to start teaching multiple mentees."
              action={
                <button
                  onClick={() => handleSelectServiceType(serviceTypes.find(t => t.name === 'group_session'))}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/40"
                  style={{ backgroundColor: COLORS.ink }}
                >
                  <Plus className="w-4 h-4" />
                  Create group session
                </button>
              }
            />
          ) : filteredGroupSessions.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No group sessions found"
              text={`No group sessions matched your search for "${isSearchView ? urlSearchQuery : searchQuery}".`}
              action={isSearchView ? backButton : undefined}
            />
          ) : (
            <>
              <div className="grid gap-6" style={CARD_GRID_STYLE}>
                {visibleGroupSessions.map((group, idx) => (
                  <GroupSessionCard
                    key={group.sessionId || group.id || idx}
                    group={group}
                    onEdit={() => {
                      setSelectedSession({ ...group, isGroupSession: true });
                      setModalMode('edit');
                      setIsEditModalOpen(true);
                    }}
                    onDelete={() => handleDeleteService({ ...group, type: 'group_session' })}
                    onMenteeStatus={(grp) => {
                      setSelectedSession({ ...grp, isGroupSession: true });
                      setModalMode('view');
                      setIsEditModalOpen(true);
                    }}
                  />
                ))}
              </div>
              {filteredGroupSessions.length > INITIAL_VISIBLE_COUNT && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowAllGroupSessions((v) => !v)}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-[#f3ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/40"
                    style={{ borderColor: COLORS.border, color: COLORS.ink, backgroundColor: '#fff' }}
                  >
                    {showAllGroupSessions ? 'Show less' : `Show all group sessions (${filteredGroupSessions.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Create / edit form modal */}
      {showServiceForm && (
        <ServiceModal
          service={{
            name: isEditMode ? (editingSession?.title || 'Edit Service') : 'New Service',
            description: isEditMode ? 'Update your service offering' : 'Create a new service offering',
          }}
          onClose={() => {
            setShowServiceForm(false);
            setSaveError(null);
            setIsEditMode(false);
            setEditingSession(null);
            setSelectedServiceType(null);
            setFormData(getDefaultFormData());
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
        initialMode={modalMode}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSession(null);
        }}
        session={selectedSession}
        onStatusChange={handleUpdateSessionStatus}
        onRefresh={() => {
          fetchAllSessions();
          fetchGroupSessions();
        }}
      />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            style={{ border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#fee2e2' }}>
                  <Trash2 className="w-5 h-5" style={{ color: '#dc2626' }} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>
                  Delete service?
                </h3>
              </div>
              <button
                onClick={() => !isDeleting && setDeleteTarget(null)}
                disabled={isDeleting}
                aria-label="Close"
                className="p-1 hover:bg-[#f3ece4] rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" style={{ color: COLORS.muted }} />
              </button>
            </div>

            <p className="text-sm mb-6" style={{ color: COLORS.muted }}>
              Are you sure you want to delete <span className="font-semibold" style={{ color: COLORS.ink }}>"{deleteTarget.name}"</span> permanently? This cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid #f0ebe4' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border transition-colors disabled:opacity-50 hover:bg-[#f3ece4]"
                style={{ borderColor: COLORS.border, color: COLORS.ink, backgroundColor: COLORS.cream }}
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

      {/* Styled replacement for the browser's native alert() popup */}
      {blockedDeleteMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            style={{ border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#fef3c7' }}>
                  <AlertCircle className="w-5 h-5" style={{ color: '#b45309' }} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>
                  Can't delete this service
                </h3>
              </div>
              <button
                onClick={() => setBlockedDeleteMessage(null)}
                aria-label="Close"
                className="p-1 hover:bg-[#f3ece4] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" style={{ color: COLORS.muted }} />
              </button>
            </div>

            <p className="text-sm mb-6" style={{ color: COLORS.muted }}>
              {blockedDeleteMessage}
            </p>

            <div className="flex justify-end pt-4" style={{ borderTop: '1px solid #f0ebe4' }}>
              <button
                onClick={() => setBlockedDeleteMessage(null)}
                className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: COLORS.ink }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}