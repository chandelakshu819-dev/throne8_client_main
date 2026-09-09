// mentorDashboard/components/BookingsPage.tsx
import React, { useEffect, useState, useMemo } from "react"
import {
  Calendar,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  Eye,
  Download,
  Play,
  RotateCw,
  XCircle,
  Check,
  X,
} from "lucide-react"
import SessionService from "@/lib/api/session.service";
import ProfileService from "@/lib/api/profile.service";

interface BookingProps {
  mentorData: any;
}

type MentorBookingRow = {
  bookingId: string;
  sessionId: string;
  menteeId: string;
  menteeName: string;
  menteeProfilePhoto: string | null;
  serviceName: string;
  scheduledAt: string;
  slotTime: string;
  status: 'pending' | 'confirmed' | 'rescheduled' | 'in_progress' | 'completed' | 'cancelled';
};

type BookingTab = 'all' | 'pending' | 'upcoming' | 'in_progress' | 'completed';

const tabMeta: Record<BookingTab, { label: string; icon: React.ElementType }> = {
  all: { label: 'All Active', icon: Clock },
  pending: { label: 'Pending', icon: Clock },
  upcoming: { label: 'Upcoming', icon: Calendar },
  in_progress: { label: 'In Progress', icon: Play },
  completed: { label: 'Completed', icon: CheckCircle2 },
};

const statPalette: Record<string, { bg: string; fg: string }> = {
  amber: { bg: '#fef3c7', fg: '#b45309' },
  green: { bg: '#dcfce7', fg: '#15803d' },
  blue: { bg: '#dbeafe', fg: '#1d4ed8' },
  purple: { bg: '#f3e8ff', fg: '#7c3aed' },
};

const statusBadge: Record<string, { bg: string; fg: string; label: string }> = {
  rescheduled: { bg: '#fed7aa', fg: '#c2410c', label: 'Rescheduled' },
  pending: { bg: '#fef3c7', fg: '#b45309', label: 'Pending' },
  confirmed: { bg: '#dcfce7', fg: '#15803d', label: 'Upcoming' },
  in_progress: { bg: '#dbeafe', fg: '#1d4ed8', label: 'In Progress' },
  completed: { bg: '#f3e8ff', fg: '#7c3aed', label: 'Completed' },
};

export default function BookingsPage({ mentorData }: BookingProps) {
  const [bookingTab, setBookingTab] = useState<BookingTab>('all');
  const [allBookings, setAllBookings] = useState<MentorBookingRow[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search — new: live-filters the visible rows by student name
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSessionId, setCancelSessionId] = useState<string | null>(null);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleSessionId, setRescheduleSessionId] = useState<string | null>(null);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  const fetchSessions = async () => {
    if (!mentorData?.mentorId) return;
    setLoadingData(true);
    return SessionService.getMentorSessions(mentorData.mentorId)
      .then((res) => {
        const _all = res.data as any[];
        const filtered = _all.filter(
          (s) => (s.bookings?.length ?? 0) > 0
        );

        const flattened = filtered.flatMap((s: any) => {
          return s.bookings.map((b: any) => ({
            bookingId: b._id,
            sessionId: s.sessionId,
            menteeId: b.menteeId,
            menteeName: b.mentee?.fullName || s.bookedMenteeName || s.menteeName || b.bookedBy || `Student`,
            menteeProfilePhoto: b.mentee?.profilePic || s.menteeProfilePhoto || null,
            serviceName: s.title || s.sessionType || "Session",
            scheduledAt: b.scheduledAt || s.scheduledAt,
            slotTime: b.slotTime || s.slotTime,
            status: b.status,
          }));
        });
        const sorted = flattened.sort((a, b) => {
          const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
          const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
          return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
        });

        setAllBookings(sorted);
      })
      .catch((err) => {
        console.error("Failed to fetch sessions: ", err);
      })
      .finally(() => setLoadingData(false));
  };

  useEffect(() => {
    fetchSessions();
  }, [mentorData?.mentorId]);

  useEffect(() => {
    const mappings = allBookings
      .filter(b => b.menteeId && b.menteeProfilePhoto && !photoUrls[b.menteeId])
      .map(b => ({ menteeId: b.menteeId as string, photoId: b.menteeProfilePhoto as string }));

    const uniqueMappings = Array.from(new Map(mappings.map(m => [m.menteeId, m])).values());

    if (uniqueMappings.length > 0) {
      Promise.all(
        uniqueMappings.map(m =>
          ProfileService.getProfilePhotoById(m.photoId)
            .then((res: any) => ({ id: m.menteeId, url: res?.data?.photo?.cloudinarySecureUrl }))
            .catch(() => ({ id: m.menteeId, url: null }))
        )
      ).then(results => {
        setPhotoUrls(prev => {
          const newMap = { ...prev };
          results.forEach(({ id, url }) => {
            if (url) newMap[id] = url;
          });
          return newMap;
        });
      });
    }
  }, [allBookings]);

  const pendingBookings = allBookings.filter(b => b.status === 'pending');
  const upcomingBookings = allBookings.filter(b => b.status === 'confirmed' || b.status === 'rescheduled');
  const inProgressBookings = allBookings.filter(b => b.status === 'in_progress');
  const completedBookings = allBookings.filter(b => b.status === 'completed');

  const getCurrentBookings = () => {
    switch (bookingTab) {
      case 'all': return allBookings.filter(b => b.status !== 'completed');
      case 'pending': return pendingBookings;
      case 'upcoming': return upcomingBookings;
      case 'in_progress': return inProgressBookings;
      case 'completed': return completedBookings;
      default: return allBookings.filter(b => b.status !== 'completed');
    }
  };

  // Apply the live search on top of the tab filter
  const currentBookings = useMemo(() => {
    const base = getCurrentBookings();
    if (!searchQuery.trim()) return base;
    const q = searchQuery.trim().toLowerCase();
    return base.filter(b =>
      b.menteeName?.toLowerCase().includes(q) ||
      b.serviceName?.toLowerCase().includes(q)
    );
  }, [bookingTab, allBookings, searchQuery]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });

  const formatTime = (booking: MentorBookingRow) =>
    booking.slotTime ??
    new Date(booking.scheduledAt).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit"
    });

  const handleConfirm = async (sessionId: string, bookingId?: string) => {
    setActionLoading(sessionId);
    try {
      await SessionService.confirmSession(sessionId, bookingId);
      alert("Booking confirmed successfully");
      await fetchSessions();
      setBookingTab('upcoming');
    } catch (err: any) {
      alert(err.message || "Failed to confirm booking.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStart = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      await SessionService.startSession(sessionId);
      alert("Session started");
      await fetchSessions();
      setBookingTab('in_progress');
    } catch (err: any) {
      alert(err.message || "Failed to start session.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnd = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      await SessionService.completeSession(sessionId, { wasSuccessful: true });
      alert("Session completed");
      await fetchSessions();
      setBookingTab('completed');
    } catch (err: any) {
      alert(err.message || "Failed to complete session.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelSessionId || !cancelBookingId || !cancelReason) {
      alert("Please provide a reason.");
      return;
    }
    setActionLoading(cancelSessionId);
    try {
      await SessionService.cancelSession(cancelSessionId, cancelReason, cancelBookingId);
      alert("Session cancelled successfully");
      setShowCancelModal(false);
      setCancelReason("");
      setCancelBookingId(null);
      await fetchSessions();
    } catch (err: any) {
      alert(err.message || "Failed to cancel session.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleSessionId || !rescheduleBookingId || !rescheduleDate || !rescheduleReason) {
      alert("Please provide both new date and reason.");
      return;
    }
    setActionLoading(rescheduleSessionId);
    try {
      await SessionService.rescheduleSession(rescheduleSessionId, new Date(rescheduleDate).toISOString(), rescheduleReason, rescheduleBookingId);
      alert("Session rescheduled successfully");
      setShowRescheduleModal(false);
      setRescheduleDate("");
      setRescheduleReason("");
      setRescheduleBookingId(null);
      await fetchSessions();
      setBookingTab('upcoming');
    } catch (err: any) {
      alert(err.message || "Failed to reschedule session.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#4a3728' }}>
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#4a3728' }}>Bookings</h2>
            <p style={{ color: '#8a7a6a' }} className="text-sm">Manage your sessions</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {showSearch && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}>
              <Search className="w-4 h-4" style={{ color: '#8a7a6a' }} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or service..."
                className="bg-transparent outline-none text-sm w-48"
                style={{ color: '#4a3728' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-3.5 h-3.5" style={{ color: '#8a7a6a' }} />
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => { setShowSearch(v => !v); if (showSearch) setSearchQuery(""); }}
            className="px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors hover:bg-[#f3ece4]"
            style={{ backgroundColor: showSearch ? '#f3ece4' : '#fbf7f3', color: '#7a5c3e', border: '1px solid #e0d8cf' }}
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: pendingBookings.length, icon: Clock, palette: 'amber' },
          { label: 'Upcoming', value: upcomingBookings.length, icon: Calendar, palette: 'green' },
          { label: 'In Progress', value: inProgressBookings.length, icon: Play, palette: 'blue' },
          { label: 'Completed', value: completedBookings.length, icon: CheckCircle2, palette: 'purple' },
        ].map((stat, idx) => {
          const c = statPalette[stat.palette];
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: c.bg }}>
                <stat.icon className="w-4.5 h-4.5" style={{ color: c.fg }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: '#4a3728' }}>{stat.value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: '#8a7a6a' }}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white p-1.5 rounded-2xl overflow-x-auto" style={{ border: '1px solid #e0d8cf' }}>
        <div className="flex gap-1.5 min-w-max">
          {(['all', 'pending', 'upcoming', 'in_progress', 'completed'] as const).map((tab) => {
            const count = tab === 'all' ? allBookings.filter(b => b.status !== 'completed').length :
              tab === 'pending' ? pendingBookings.length :
                tab === 'upcoming' ? upcomingBookings.length :
                  tab === 'in_progress' ? inProgressBookings.length : completedBookings.length;
            const { label, icon: Icon } = tabMeta[tab];
            const isActive = bookingTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setBookingTab(tab)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
                style={{ backgroundColor: isActive ? '#4a3728' : 'transparent', color: isActive ? '#fff' : '#7a5c3e' }}
              >
                <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#f3ece4', color: isActive ? '#fff' : '#7a5c3e' }}
                  >
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e0d8cf' }}>
        <div className="overflow-x-auto">
          {loadingData ? (
            <div className="flex items-center justify-center py-16" style={{ color: '#8a7a6a' }}>
              <Clock className="w-5 h-5 animate-spin mr-3" />
              <span className="text-sm font-semibold">Loading bookings...</span>
            </div>
          ) : currentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: '#8a7a6a' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: '#f3ece4' }}>
                <Calendar className="w-6 h-6" style={{ color: '#a08070' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#4a3728' }}>
                {searchQuery ? 'No matching bookings' : `No ${bookingTab.replace('_', ' ')} bookings found`}
              </p>
              <p className="text-xs mt-1">{searchQuery ? 'Try a different search' : 'Bookings will appear here when available'}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead style={{ backgroundColor: '#fbf7f3' }}>
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8a7a6a' }}>Student</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8a7a6a' }}>Service</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8a7a6a' }}>Date</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8a7a6a' }}>Time</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8a7a6a' }}>Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8a7a6a' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#f0ebe4' }}>
                {currentBookings.map((booking, idx) => {
                  const resolvedPhoto = booking.menteeId ? photoUrls[booking.menteeId] : null;
                  const sb = statusBadge[booking.status] ?? statusBadge.pending;
                  return (
                    <tr key={`${booking.sessionId}-${booking.bookingId}-${idx}`} className="transition-colors hover:bg-[#fbf7f3]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {resolvedPhoto ? (
                            <img src={resolvedPhoto} alt={booking.menteeName} className="w-9 h-9 rounded-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                          ) : null}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${resolvedPhoto ? 'hidden' : ''}`}
                            style={{ backgroundColor: '#4a3728' }}>
                            {booking.menteeName?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <span className="text-sm font-semibold" style={{ color: '#4a3728' }}>
                            {booking.menteeName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: '#8a7a6a' }}>{booking.serviceName}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: '#8a7a6a' }}>{formatDate(booking.scheduledAt)}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: '#8a7a6a' }}>{formatTime(booking)}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: sb.bg, color: sb.fg }}>
                          {sb.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5">
                          {bookingTab === 'pending' && (
                            <>
                              <button
                                onClick={() => handleConfirm(booking.sessionId, booking.bookingId)}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 text-white transition-opacity hover:opacity-90"
                                style={{ backgroundColor: '#15803d' }}
                              >
                                <Check className="w-3.5 h-3.5" /> {actionLoading === booking.sessionId ? '...' : 'Accept'}
                              </button>
                              <button
                                onClick={() => { setCancelSessionId(booking.sessionId); setCancelBookingId(booking.bookingId); setShowCancelModal(true); }}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 text-white transition-opacity hover:opacity-90"
                                style={{ backgroundColor: '#dc2626' }}
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          )}
                          {bookingTab === 'upcoming' && (
                            <>
                              <button
                                onClick={() => handleStart(booking.sessionId)}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 text-white transition-opacity hover:opacity-90"
                                style={{ backgroundColor: '#1d4ed8' }}
                              >
                                <Play className="w-3.5 h-3.5" /> {actionLoading === booking.sessionId ? '...' : 'Start'}
                              </button>
                              <button
                                onClick={() => { setRescheduleSessionId(booking.sessionId); setRescheduleBookingId(booking.bookingId); setShowRescheduleModal(true); }}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 text-white transition-opacity hover:opacity-90"
                                style={{ backgroundColor: '#b45309' }}
                              >
                                <RotateCw className="w-3.5 h-3.5" /> Reschedule
                              </button>
                              <button
                                onClick={() => { setCancelSessionId(booking.sessionId); setCancelBookingId(booking.bookingId); setShowCancelModal(true); }}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 text-white transition-opacity hover:opacity-90"
                                style={{ backgroundColor: '#dc2626' }}
                              >
                                <XCircle className="w-3.5 h-3.5" /> Cancel
                              </button>
                            </>
                          )}
                          {bookingTab === 'in_progress' && (
                            <button
                              onClick={() => handleEnd(booking.sessionId)}
                              disabled={actionLoading === booking.sessionId}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 text-white transition-opacity hover:opacity-90"
                              style={{ backgroundColor: '#7c3aed' }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> {actionLoading === booking.sessionId ? '...' : 'End Session'}
                            </button>
                          )}
                          {bookingTab === 'completed' && (
                            <>
                              <button className="p-1.5 rounded-lg transition-colors hover:bg-[#f3ece4]"
                                style={{ border: '1px solid #e0d8cf' }}
                                title="View Details">
                                <Eye className="w-3.5 h-3.5" style={{ color: '#7a5c3e' }} />
                              </button>
                              <button className="p-1.5 rounded-lg transition-colors hover:bg-[#f3ece4]"
                                style={{ border: '1px solid #e0d8cf' }}
                                title="Download">
                                <Download className="w-3.5 h-3.5" style={{ color: '#7a5c3e' }} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4" style={{ border: '1px solid #e0d8cf' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#4a3728' }}>Confirm Cancellation</h3>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8a7a6a' }}>Reason for cancellation</label>
              <input
                type="text"
                className="w-full rounded-lg p-3 outline-none text-sm"
                style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                placeholder="e.g. Scheduling conflict, emergency, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '1px solid #e0d8cf' }}
                onClick={() => { setShowCancelModal(false); setCancelSessionId(null); setCancelBookingId(null); setCancelReason(""); }}
              >
                Go Back
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#dc2626' }}
                onClick={handleCancelSubmit}
              >
                {actionLoading === cancelSessionId ? 'Processing...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4" style={{ border: '1px solid #e0d8cf' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#4a3728' }}>Reschedule Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8a7a6a' }}>New Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg p-3 outline-none text-sm"
                  style={{ border: '1px solid #e0d8cf', color: '#4a3728' }}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8a7a6a' }}>Reason</label>
                <input
                  type="text"
                  className="w-full rounded-lg p-3 outline-none text-sm"
                  style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3', color: '#4a3728' }}
                  placeholder="Reason for rescheduling"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '1px solid #e0d8cf' }}
                onClick={() => { setShowRescheduleModal(false); setRescheduleSessionId(null); setRescheduleBookingId(null); setRescheduleDate(""); setRescheduleReason(""); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#4a3728' }}
                onClick={handleRescheduleSubmit}
              >
                {actionLoading === rescheduleSessionId ? 'Processing...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}