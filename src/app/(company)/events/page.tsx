'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import EventCard from '../../../features/company/components/events/EventCard';
import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import { addEvent, deleteEvent, setEvents, setLoading, setError } from '@/features/company/store/slices/eventSlice';
import { Event } from '@/features/company/store/slices/eventSlice';
import CompanyService from '@/lib/api/company.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { EventStatusFilter, TABS } from '@/features/company/constants/data';

const CreateEventModal = dynamic(() => import('../../../features/company/modal/CreateEventModal'), {
  loading: () => null,
});

const DeleteEventModal = dynamic(() => import('@/features/company/modal/DeleteEventModal'), {
  loading: () => null,
});

export type { Event };

// ✅ Backend response ko Event shape mein convert karo
function mapBackendEvent(e: any): Event {
  const primaryBanner = e.media?.find((m: any) => m.isPrimary)?.url || e.media?.[0]?.url || (typeof e.banner === 'string' ? e.banner : undefined);

  return {
    id: e._id || e.id || e.eventId,
    eventId: e.eventId || e._id,
    _id: e._id,
    title: e.title || 'Untitled Event',
    type: e.type || 'Event',
    mode: e.mode || 'Offline',
    status: e.status || 'Upcoming',
    startDate: e.startDate,
    date: e.startDate
      ? new Date(e.startDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'TBD',
    endDate: e.endDate,
    location: typeof e.location === 'object' && e.location !== null
      ? e.location
      : { venue: typeof e.location === 'string' ? e.location : 'TBD' },
    capacity: Number(e.capacity) || 0,
    registered: Number(e.registeredCount ?? e.registered ?? 0),
    registeredCount: Number(e.registeredCount ?? e.registered ?? 0),
    waitlist: Number(e.waitlist ?? 0),
    banner: primaryBanner,
    description: e.description,
    visibility: e.visibility || 'Public',
    startTimeOfDay: e.startTimeOfDay,
    agenda: e.agenda,
    speakers: e.speakers,
  };
}

export default function EventsPage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { userProfileData, loadProfile } = useProfile();
  const events = useAppSelector((s) => s.events?.items ?? []);
  const loading = useAppSelector((s) => s.events?.loading ?? false);

  const [tab, setTab] = useState<EventStatusFilter>('all');
  const [showCreate, setShowCreate] = useState(false);

  // Delete modal & in-flight deletion state
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [resolvedCompanyId, setResolvedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  useEffect(() => {
    if (userProfileData?.companyId) {
      setResolvedCompanyId(userProfileData.companyId);
      return;
    }
    const resolveCompany = async () => {
      try {
        const compRes = await CompanyService.getAllCompanies({ page: 1, pageSize: 1 });
        const compList = compRes?.data?.companies || compRes?.data?.items || compRes?.data || [];
        if (compList.length > 0) {
          const firstId = compList[0].companyId || compList[0]._id || compList[0].id;
          if (firstId) setResolvedCompanyId(firstId);
        }
      } catch (err) {
        console.warn('⚠️ Could not resolve companyId fallback:', err);
      }
    };
    resolveCompany();
  }, [userProfileData?.companyId]);

  const activeCompanyId = resolvedCompanyId || userProfileData?.companyId || '';

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // ✅ Events fetch from backend database
  const fetchEvents = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const res = await CompanyService.getAllEvents(1, 100);
      const raw = res?.data?.events || res?.data?.items || res?.data || [];
      const mapped = Array.isArray(raw) ? raw.map(mapBackendEvent) : [];
      dispatch(setEvents(mapped));
    } catch (err: any) {
      console.error('❌ [FETCH_EVENTS] Error:', err);
      dispatch(setError(err.message || 'Failed to load events'));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filtered = useMemo(
    () => (tab === 'all' ? events : events.filter((e) => e.status?.toLowerCase() === tab.toLowerCase())),
    [tab, events]
  );

  const stats = useMemo(
    () => ({
      upcoming: events.filter((e) => e.status === 'Upcoming').length,
      ongoing: events.filter((e) => e.status === 'Ongoing').length,
      totalReg: events.reduce((a, e) => a + (e.registered || 0), 0),
      waitlist: events.reduce((a, e) => a + (e.waitlist || 0), 0),
    }),
    [events]
  );

  const openCreate = useCallback(() => setShowCreate(true), []);
  const closeCreate = useCallback(() => setShowCreate(false), []);

  // ✅ Event add hone par Redux update
  const handleAdd = useCallback(
    (e: Event) => {
      dispatch(addEvent(e));
      setToast({ message: `Event "${e.title}" created successfully!`, type: 'success' });
    },
    [dispatch]
  );

  // ✅ 1. Click Delete -> Open Confirmation Modal (DO NOT delete yet)
  const handleDeleteClick = useCallback((event: Event) => {
    setEventToDelete(event);
  }, []);

  const handleCancelDelete = useCallback(() => {
    if (isDeleting) return;
    setEventToDelete(null);
  }, [isDeleting]);

  // ✅ 2. Confirm Delete -> Call Backend DELETE API -> On success, remove from UI & refetch
  const handleConfirmDelete = useCallback(async () => {
    if (!eventToDelete) return;
    const targetId = eventToDelete.eventId || eventToDelete.id || eventToDelete._id;
    if (!targetId) {
      setToast({ message: 'Event ID could not be resolved.', type: 'error' });
      return;
    }

    setIsDeleting(true);
    try {
      console.log('🗑️ Permanently deleting event from backend database:', targetId, eventToDelete.title);

      // Call backend DELETE endpoint
      await CompanyService.deleteEvent(targetId);

      // Only AFTER API succeeds:
      // Remove from Redux state
      dispatch(deleteEvent(eventToDelete.id));

      // Close modal
      setEventToDelete(null);

      // Show success toast
      setToast({ message: 'Event deleted successfully', type: 'success' });

      // Invalidate and refetch events from backend to guarantee sync
      await fetchEvents();
    } catch (err: any) {
      console.error('❌ Failed to delete event:', err);
      // Keep event visible in UI
      setToast({
        message: err.message || 'Failed to delete event. Please try again.',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [eventToDelete, dispatch, fetchEvents]);

  const STAT_ITEMS = [
    { label: 'Upcoming', value: stats.upcoming, color: 'text-blue-600' },
    { label: 'Ongoing', value: stats.ongoing, color: 'text-green-600' },
    { label: 'Total Registered', value: stats.totalReg, color: 'text-[#4a3728]' },
    { label: 'On Waitlist', value: stats.waitlist, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-[#4a3728] text-[#f6ede8] border-[#6b4e3d]'
              : 'bg-red-600 text-white border-red-700'
          }`}
        >
          <span className="text-base">{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#4a3728]">Events</h1>
          <p className="text-sm text-[#4a3728]/60 mt-0.5">Manage conferences, webinars & meetups</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#4a3728] text-[#f6ede8] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#6b4e3d] transition-colors shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_ITEMS.map((s) => (
          <div key={s.label} className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{(s.value ?? 0).toLocaleString()}</p>
            <p className="text-xs text-[#4a3728]/60">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#e0d8cf]/50 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200
              ${tab === t ? 'bg-[#4a3728] text-[#f6ede8]' : 'text-[#4a3728]/60 hover:text-[#4a3728]'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && events.length === 0 && (
        <div className="text-center py-10 text-[#4a3728]/50 text-sm">Loading events...</div>
      )}

      {/* Events Grid */}
      {(!loading || events.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-2 text-center py-10 text-[#4a3728]/40 text-sm">
              No events found
            </div>
          ) : (
            filtered.map((event) => (
              <EventCard key={event.id || event.eventId} event={event} onDelete={handleDeleteClick} />
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateEventModal
          onClose={closeCreate}
          onAdd={handleAdd}
          companyId={activeCompanyId}
        />
      )}

      {/* Confirmation Delete Modal */}
      {eventToDelete && (
        <DeleteEventModal
          isOpen={Boolean(eventToDelete)}
          eventTitle={eventToDelete.title}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          loading={isDeleting}
        />
      )}
    </div>
  );
}