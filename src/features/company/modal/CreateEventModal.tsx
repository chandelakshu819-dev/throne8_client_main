'use client';

import { memo, useState, useCallback, useRef } from 'react';
import type { Event } from '@/features/company/store/slices/eventSlice';
import CompanyService from '@/lib/api/company.service';
// import { useAppSelector } from '@/features/company/hooks/useAppSelector';

interface Props {
  onClose: () => void;
  onAdd: (event: Event) => void;
  companyId: string;
}

// ✅ Backend response → Event shape
function mapToEvent(backendData: any): Event {
  const e = backendData?.data || backendData;
  return {
    id: e._id,
    eventId: e.eventId,
    title: e.title,
    type: e.type || 'Conference',
    mode: e.mode || 'Offline',
    status: e.status || 'Upcoming',
    date: e.startDate
      ? new Date(e.startDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
      : 'TBD',
    startDate: e.startDate || '',
    endDate: e.endDate,
    location: e.location || {},
    capacity: e.capacity || 0,
    registered: e.registeredCount || 0,
    waitlist: 0,
    banner: e.media?.find((m: any) => m.isPrimary)?.url,
    description: e.description,
    visibility: e.visibility,
  };
}

const EVENT_TYPES = ['Conference', 'Webinar', 'Workshop', 'Meetup', 'Networking', 'Other'] as const;
const EVENT_MODES = ['Online', 'Offline', 'Hybrid'] as const;
const TIME_OF_DAY = ['Morning', 'Afternoon', 'Evening', 'Night'] as const;
const VISIBILITY = ['Public', 'Private'] as const;

const CreateEventModal = memo(function CreateEventModal({ onClose, onAdd, companyId }: Props) {
  // Required fields
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');

  // Optional fields
  const [description, setDescription] = useState('');
  const [type, setType] = useState<typeof EVENT_TYPES[number]>('Conference');
  const [mode, setMode] = useState<typeof EVENT_MODES[number]>('Offline');
  const [startTimeOfDay, setStartTimeOfDay] = useState<typeof TIME_OF_DAY[number]>('Morning');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Public');
  const [capacity, setCapacity] = useState('100');
  const [eventLink, setEventLink] = useState('');

  // Location fields
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!startDate) { setError('Start date is required'); return; }
    if (!companyId) { setError('Company not found. Please refresh.'); return; }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();

      // Required
      formData.append('title', title.trim());
      formData.append('companyId', companyId);

      // startDate + time combine
      const startDateFull = startTime
        ? `${startDate}T${startTime}:00.000Z`
        : `${startDate}T00:00:00.000Z`;
      formData.append('startDate', startDateFull);

      // Optional text fields
      if (description.trim()) formData.append('description', description.trim());
      formData.append('type', type);
      formData.append('mode', mode);
      formData.append('startTimeOfDay', startTimeOfDay);
      formData.append('visibility', visibility);
      if (capacity) formData.append('capacity', capacity);
      if (eventLink.trim()) formData.append('eventLink', eventLink.trim());

      // endDate
      if (endDate) {
        const endDateFull = endTime
          ? `${endDate}T${endTime}:00.000Z`
          : `${endDate}T23:59:00.000Z`;
        formData.append('endDate', endDateFull);
      }

      // Location as JSON string
      if (venue || city) {
        const locationObj = {
          venue: venue.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
        };
        formData.append('location', JSON.stringify(locationObj));
      }

      // Image file
      if (imageFile) {
        formData.append('images', imageFile);
      }

      const res = await CompanyService.createEvent(formData);
      const newEvent = mapToEvent(res);
      onAdd(newEvent);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  }, [
    title, startDate, startTime, description, type, mode,
    startTimeOfDay, endDate, endTime, visibility, capacity,
    eventLink, venue, address, city, state, country,
    imageFile, companyId, onAdd, onClose,
  ]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#f6ede8] rounded-2xl shadow-2xl w-full max-w-2xl border border-[#e0d8cf] max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e0d8cf] flex-shrink-0">
          <h3 className="text-lg font-bold text-[#4a3728]">Create Event</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[#e0d8cf] rounded-lg transition-colors text-[#4a3728]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {/* Banner Image */}
          <div>
            <label className="text-xs font-semibold text-[#4a3728]/70 mb-1 block">
              Banner Image <span className="text-[#4a3728]/40">(optional)</span>
            </label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} className="w-full h-32 object-cover rounded-xl border border-[#e0d8cf]" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 bg-white/80 rounded-full p-1 text-red-500 text-xs">✕</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-[#e0d8cf] rounded-xl text-[#4a3728]/40 text-xs hover:border-[#4a3728]/40 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Banner
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-[#4a3728]/70 mb-1 block">
              Event Title <span className="text-red-400">*</span>
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. AI Summit 2026"
              className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20" />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#4a3728]/70 mb-1 block">
              Description <span className="text-[#4a3728]/40">(optional)</span>
            </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} placeholder="Describe your event..."
              className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 resize-none" />
          </div>

          {/* Type + Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4a3728]/70 mb-1 block">Event Type</label>
              <select value={type} onChange={e => setType(e.target.value as any)}
                className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20">
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3728]/70 mb-1 block">Mode</label>
              <select value={mode} onChange={e => setMode(e.target.value as any)}
                className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20">
                {EVENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Start Date + Time */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-[#4a3728]/70 mb-1 block">
                Start Date <span className="text-red-400">*</span>
              </label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3728]/70 mb-1 block">Time of Day</label>
              <select value={startTimeOfDay} onChange={e => setStartTimeOfDay(e.target.value as any)}
                className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20">
                {TIME_OF_DAY.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="text-xs font-semibold text-[#4a3728]/70 mb-1 block">
              End Date <span className="text-[#4a3728]/40">(optional)</span>
            </label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split('T')[0]}
              className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20" />
          </div>

          {/* Visibility + Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4a3728]/70 mb-1 block">Visibility</label>
              <select value={visibility} onChange={e => setVisibility(e.target.value as any)}
                className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20">
                {VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3728]/70 mb-1 block">Capacity</label>
              <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)}
                min="1" placeholder="100"
                className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20" />
            </div>
          </div>

          {/* Event Link (for Online/Hybrid) */}
          {(mode === 'Online' || mode === 'Hybrid') && (
            <div>
              <label className="text-xs font-semibold text-[#4a3728]/70 mb-1 block">
                Event Link <span className="text-[#4a3728]/40">(Zoom / Meet URL)</span>
              </label>
              <input value={eventLink} onChange={e => setEventLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20" />
            </div>
          )}

          {/* Location (for Offline/Hybrid) */}
          {(mode === 'Offline' || mode === 'Hybrid') && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#4a3728]/70">Location</p>
              <input value={venue} onChange={e => setVenue(e.target.value)}
                placeholder="Venue name (e.g. Hotel Grand)"
                className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20" />
              <input value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Address"
                className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20" />
              <div className="grid grid-cols-2 gap-3">
                <input value={city} onChange={e => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20" />
                <input value={state} onChange={e => setState(e.target.value)}
                  placeholder="State"
                  className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20" />
              </div>
              <input value={country} onChange={e => setCountry(e.target.value)}
                placeholder="Country"
                className="w-full bg-white/60 border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-sm text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0 flex-shrink-0 border-t border-[#e0d8cf] mt-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-[#e0d8cf] rounded-xl text-sm font-semibold text-[#4a3728] hover:bg-[#e0d8cf] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!title.trim() || !startDate || loading}
            className="flex-1 py-2.5 bg-[#4a3728] text-[#f6ede8] rounded-xl text-sm font-semibold hover:bg-[#6b4e3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Creating...
              </>
            ) : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default CreateEventModal;