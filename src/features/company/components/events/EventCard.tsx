'use client';

import { memo, useCallback, useState, useRef, useEffect } from 'react';
import type { Event } from '@/features/company/store/slices/eventSlice';
import UpdateEventModal from '../../modal/UpdateEventModal';

const STATUS_COLORS: Record<string, string> = {
  Upcoming: 'bg-blue-100 text-blue-700',
  Ongoing: 'bg-green-100 text-green-700',
  Completed: 'bg-gray-100 text-gray-500',
  Cancelled: 'bg-red-100 text-red-500',
  Scheduled: 'bg-yellow-100 text-yellow-700',
};

const MODE_ICONS: Record<string, string> = {
  Online: '🌐',
  Offline: '📍',
  Hybrid: '🔀',
};

interface Props {
  event: Event;
  onDelete: (id: string) => void;
}

// ── Info Popup ──────────────────────────────────────
function InfoPopup({ event, onClose }: { event: Event; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  // Click outside se close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const rows: Array<{ label: string; value: string | number | undefined }> = [
    // { label: 'Event ID', value: event.eventId },
    { label: 'Type', value: event.type },
    { label: 'Mode', value: event.mode },
    { label: 'Status', value: event.status },
    { label: 'Visibility', value: event.visibility },
    { label: 'Start Date', value: event.date },
    {
      label: 'End Date', value: event.endDate
        ? new Date(event.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—'
    },
    { label: 'Time of Day', value: event.startTimeOfDay || '—' },
    {
      label: 'Location', value: event.location
        ? [event.location.venue, event.location.city, event.location.state]
            .filter(Boolean)
            .join(', ') || '—'
        : '—'
    },
    { label: 'Capacity', value: event.capacity },
    { label: 'Registered', value: event.registered },
    { label: 'Description', value: event.description || '—' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div ref={ref}
        className="bg-[#f6ede8] border border-[#e0d8cf] rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0d8cf] flex-shrink-0">
          <h4 className="text-sm font-bold text-[#4a3728]">Event Details</h4>
          <button onClick={onClose}
            className="p-1 hover:bg-[#e0d8cf] rounded-lg transition-colors text-[#4a3728]/60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <div className="px-4 py-3 border-b border-[#e0d8cf] flex-shrink-0">
          <p className="text-sm font-bold text-[#4a3728]">{event.title}</p>
        </div>

        {/* Info rows */}
        <div className="overflow-y-auto flex-1 px-4 py-2">
          {rows.map(r => (
            <div key={r.label} className="flex items-start gap-2 py-2 border-b border-[#e0d8cf]/50 last:border-0">
              <span className="text-xs text-[#4a3728]/50 w-24 flex-shrink-0">{r.label}</span>
              <span className="text-xs text-[#4a3728] font-medium flex-1 break-all">{r.value}</span>
            </div>
          ))}

          {/* Speakers */}
          {event.speakers && event.speakers.length > 0 && (
            <div className="py-2 border-b border-[#e0d8cf]/50">
              <p className="text-xs text-[#4a3728]/50 mb-1">Speakers</p>
              {event.speakers.map((s, i) => (
                <p key={i} className="text-xs text-[#4a3728] font-medium">
                  {s.name}{s.designation ? ` · ${s.designation}` : ''}
                </p>
              ))}
            </div>
          )}

          {/* Agenda */}
          {event.agenda && event.agenda.length > 0 && (
            <div className="py-2">
              <p className="text-xs text-[#4a3728]/50 mb-1">Agenda</p>
              {event.agenda.map((a, i) => (
                <div key={i} className="flex items-start gap-2 mb-1">
                  <span className="text-xs text-[#4a3728]/40 w-16 flex-shrink-0">{a.time || '—'}</span>
                  <span className="text-xs text-[#4a3728] font-medium">
                    {a.title}{a.duration ? ` (${a.duration}min)` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── EventCard ───────────────────────────────────────
const EventCard = memo(function EventCard({ event, onDelete }: Props) {
  const [showInfo, setShowInfo] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = useCallback(() => onDelete(event.id), [event.id, onDelete]);

  const handleUpdateSubmit = useCallback(
    async (id: string, title: string, description: string) => {
      try {
        setIsUpdating(true);
        // TODO: API call here
        console.log('Updating event:', { id, title, description });
        setShowUpdate(false);
      } catch (error) {
        console.error('Error updating event:', error);
      } finally {
        setIsUpdating(false);
      }
    }, []
  );

  return (
    <>
      <div className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-2xl p-5 shadow-sm
                      hover:shadow-md transition-all duration-200 group relative">

        {/* Info Icon — top right */}
        <button
          onClick={() => setShowInfo(true)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-[#e0d8cf]/60 hover:bg-[#e0d8cf] transition-colors text-[#4a3728]/50 hover:text-[#4a3728] z-10"
          title="View details">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Banner */}
        {event.banner && (
          <img src={event.banner} alt={event.title}
            className="w-full h-32 object-cover rounded-xl mb-4 border border-[#e0d8cf]" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3 pr-8">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#4a3728] truncate">{event.title}</h3>
            <p className="text-xs text-[#4a3728]/50 mt-0.5">{event.type}</p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize flex-shrink-0
            ${STATUS_COLORS[event.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {event.status}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-[#4a3728]/60 mb-3 line-clamp-2">{event.description}</p>
        )}

        {/* Details */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-[#4a3728]/70">
            <span>📅</span>
            <span>{event.date}</span>
            {event.startTimeOfDay && (
              <span className="text-[#4a3728]/40">· {event.startTimeOfDay}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#4a3728]/70">
            <span>{MODE_ICONS[event.mode] ?? '📍'}</span>
            <span>{[event.location?.venue, event.location?.city, event.location?.state].filter(Boolean).join(', ') || '—'} · {event.mode}</span>
          </div>
          {event.visibility && (
            <div className="flex items-center gap-2 text-xs text-[#4a3728]/70">
              <span>{event.visibility === 'Public' ? '🌍' : '🔒'}</span>
              <span>{event.visibility}</span>
            </div>
          )}
        </div>

        {/* Registration Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[#4a3728]/60 mb-1">
            <span>{event.registered} registered</span>
            <span>{event.capacity} capacity</span>
          </div>
          <div className="w-full bg-[#e0d8cf] rounded-full h-1.5">
            <div className="bg-[#4a3728] h-1.5 rounded-full transition-all"
              style={{
                width: event.capacity > 0
                  ? `${Math.min((event.registered / event.capacity) * 100, 100)}%`
                  : '0%'
              }} />
          </div>
          {event.waitlist > 0 && (
            <p className="text-xs text-orange-500 mt-1">{event.waitlist} on waitlist</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowUpdate(true)}
            className="flex-1 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200
               rounded-lg hover:bg-blue-50 transition-colors">
            Update
          </button>
          <button onClick={handleDelete}
            className="flex-1 py-1.5 text-xs font-semibold text-red-500 border border-red-200
               rounded-lg hover:bg-red-50 transition-colors">
            Delete
          </button>
        </div>
      </div>

      {/* Info Popup */}
      {showInfo && (
        <InfoPopup event={event} onClose={() => setShowInfo(false)} />
      )}

      <UpdateEventModal
        isOpen={showUpdate}
        event={event}
        onClose={() => setShowUpdate(false)}
        onSubmit={handleUpdateSubmit}
        isLoading={isUpdating}
      />
    </>
  );
});

export default EventCard;