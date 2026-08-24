// mentorDashboard/components/BookingsPage.tsx
import React, { useEffect, useState } from "react"
import {
  Calendar,
  Clock,
  CheckCircle,
  Filter,
  Search,
  Eye,
  Download,
  Star,
  Play,
  RotateCw,
  XCircle,
  Check
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

export default function BookingsPage({ mentorData }: BookingProps) {
  const [bookingTab, setBookingTab] = useState<BookingTab>('all');
  const [allBookings, setAllBookings] = useState<MentorBookingRow[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
        // Only get sessions for this mentor that contain bookings
        const filtered = _all.filter(
          (s) => (s.bookings?.length ?? 0) > 0
        );
        
        // Normalize: Flatten distinct bookings so each row corresponds to ONE mentee transaction.
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

  // Fetch photos for unique menteeIds in the background
  useEffect(() => {
    const mappings = allBookings
      .filter(b => b.menteeId && b.menteeProfilePhoto && !photoUrls[b.menteeId])
      .map(b => ({ menteeId: b.menteeId as string, photoId: b.menteeProfilePhoto as string }));

    const uniqueMappings = Array.from(new Map(mappings.map(m => [m.menteeId, m])).values());

    if(uniqueMappings.length > 0) {
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

  // Filters based on strict normalized booking status
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

  const currentBookings = getCurrentBookings();

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });

  const formatTime = (booking: MentorBookingRow) =>
    booking.slotTime ??
    new Date(booking.scheduledAt).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit"
    });

  // Action mutations (refreshing after success to ensure backend defines state)
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
      // Status filtering stays booking-level; tab won't explicitly switch here, though could optionally route to past/cancelled if such tab existed.
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
    <div className="space-y-8 animate-fadeIn">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#4a3728' }}>
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold" style={{ color: '#4a3728' }}>Bookings</h2>
            <p style={{ color: '#8a7a6a' }} className="text-sm">Manage your sessions</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all" style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '2px solid #e0d8cf' }}>
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all" style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '2px solid #e0d8cf' }}>
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Pending', value: pendingBookings.length.toString(), icon: Clock, color: '#f59e0b' },
          { label: 'Upcoming', value: upcomingBookings.length.toString(), icon: Calendar, color: '#10b981' },
          { label: 'In Progress', value: inProgressBookings.length.toString(), icon: Play, color: '#3b82f6' },
          { label: 'Completed', value: completedBookings.length.toString(), icon: CheckCircle, color: '#8b5cf6' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300" style={{ border: '2px solid #e0d8cf' }}>
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-8 h-8" style={{ color: stat.color }} />
              <span className="text-3xl font-bold" style={{ color: '#4a3728' }}>{stat.value}</span>
            </div>
            <p className="font-semibold" style={{ color: '#8a7a6a' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white p-2 rounded-2xl shadow-xl overflow-x-auto" style={{ border: '2px solid #e0d8cf' }}>
        <div className="flex gap-2 min-w-max">
          {(['all', 'pending', 'upcoming', 'in_progress', 'completed'] as const).map((tab) => {
            const count = tab === 'all' ? allBookings.filter(b => b.status !== 'completed').length :
                          tab === 'pending' ? pendingBookings.length : 
                          tab === 'upcoming' ? upcomingBookings.length : 
                          tab === 'in_progress' ? inProgressBookings.length : completedBookings.length;
            
            const titles = {
              'all': 'All Active',
              'pending': 'Pending',
              'upcoming': 'Upcoming',
              'in_progress': 'In Progress',
              'completed': 'Completed'
            };

            const icons = {
              'all': <Clock className="w-5 h-5 flex-shrink-0" />,
              'pending': <Clock className="w-5 h-5 flex-shrink-0" />,
              'upcoming': <Calendar className="w-5 h-5 flex-shrink-0" />,
              'in_progress': <Play className="w-5 h-5 flex-shrink-0" />,
              'completed': <CheckCircle className="w-5 h-5 flex-shrink-0" />
            };

            return (
              <button
                key={tab}
                onClick={() => setBookingTab(tab)}
                className={`flex-1 px-4 py-3 sm:px-6 sm:py-4 rounded-xl font-bold text-sm sm:text-lg transition-all duration-300 transform ${bookingTab === tab ? 'shadow-lg scale-105' : 'hover:shadow-md'}`}
                style={{
                  backgroundColor: bookingTab === tab ? '#4a3728' : '#fbf7f3',
                  color: bookingTab === tab ? '#fff' : '#7a5c3e'
                }}
              >
                <div className="flex items-center justify-center gap-2 sm:gap-3 whitespace-nowrap">
                  {icons[tab]}
                  <span>{titles[tab]}</span>
                  <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-bold ${bookingTab === tab ? 'bg-white' : 'bg-gray-200'}`}
                    style={{ color: bookingTab === tab ? '#4a3728' : '#7a5c3e' }}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ border: '2px solid #e0d8cf' }}>
        <div className="overflow-x-auto">
          {loadingData ? (
            <div className="flex items-center justify-center py-16" style={{ color: '#8a7a6a' }}>
              <Clock className="w-6 h-6 animate-spin mr-3" />
              <span className="text-lg font-semibold">Loading bookings...</span>
            </div>
          ) : currentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: '#8a7a6a' }}>
              <Calendar className="w-12 h-12 mb-4" style={{ color: '#d8cec4' }} />
              <p className="text-lg font-semibold">No {bookingTab.replace('_', ' ')} bookings found</p>
              <p className="text-sm mt-1">Bookings will appear here when available</p>
            </div>
          ) : (
            <table className="w-full">
              <thead style={{ backgroundColor: '#fbf7f3' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#4a3728' }}>Student</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#4a3728' }}>Service</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#4a3728' }}>Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#4a3728' }}>Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#4a3728' }}>Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#4a3728' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#e0d8cf' }}>
                {currentBookings.map((booking, idx) => {
                  const resolvedPhoto = booking.menteeId ? photoUrls[booking.menteeId] : null;
                  return (
                    <tr key={`${booking.sessionId}-${booking.bookingId}-${idx}`} className="transition-colors duration-200 hover:bg-opacity-50"
                      style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fbf7f3' }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {resolvedPhoto ? (
                             <img src={resolvedPhoto} alt={booking.menteeName} className="w-10 h-10 rounded-full object-cover shadow-md" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                          ) : null}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md ${resolvedPhoto ? 'hidden' : ''}`}
                            style={{ backgroundColor: '#4a3728' }}>
                            {booking.menteeName?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <span className="font-semibold" style={{ color: '#4a3728' }}>
                            {booking.menteeName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4" style={{ color: '#8a7a6a' }}>
                        {booking.serviceName}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#8a7a6a' }}>{formatDate(booking.scheduledAt)}</td>
                      <td className="px-6 py-4" style={{ color: '#8a7a6a' }}>{formatTime(booking)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 flex items-center justify-center text-center py-1 rounded-full text-xs font-bold w-28 ${
                          booking.status === 'rescheduled' ? 'bg-orange-100 text-orange-600' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                          booking.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {booking.status === 'rescheduled' ? 'Rescheduled' :
                           booking.status === 'pending' ? 'Pending' :
                           booking.status === 'confirmed' ? 'Upcoming' :
                           booking.status === 'in_progress' ? 'In Progress' :
                           'Completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {bookingTab === 'pending' && (
                            <>
                              <button
                                onClick={() => handleConfirm(booking.sessionId, booking.bookingId)}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg hover:shadow-md transition-all text-sm font-semibold flex items-center gap-1"
                                style={{ backgroundColor: '#10b981', color: '#fff' }}
                              >
                                <Check className="w-4 h-4" /> {actionLoading === booking.sessionId ? '...' : 'Accept'}
                              </button>
                              <button
                                onClick={() => { setCancelSessionId(booking.sessionId); setCancelBookingId(booking.bookingId); setShowCancelModal(true); }}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg hover:shadow-md transition-all text-sm font-semibold flex items-center gap-1"
                                style={{ backgroundColor: '#ef4444', color: '#fff' }}
                              >
                                <XCircle className="w-4 h-4" /> Reject
                              </button>
                            </>
                          )}
                          {bookingTab === 'upcoming' && (
                            <>
                              <button
                                onClick={() => handleStart(booking.sessionId)}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg hover:shadow-md transition-all text-sm font-semibold flex items-center gap-1"
                                style={{ backgroundColor: '#3b82f6', color: '#fff' }}
                              >
                                <Play className="w-4 h-4" /> {actionLoading === booking.sessionId ? '...' : 'Start'}
                              </button>
                              <button
                                onClick={() => { setRescheduleSessionId(booking.sessionId); setRescheduleBookingId(booking.bookingId); setShowRescheduleModal(true); }}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg hover:shadow-md transition-all text-sm font-semibold flex items-center gap-1"
                                style={{ backgroundColor: '#f59e0b', color: '#fff' }}
                              >
                                <RotateCw className="w-4 h-4" /> Reschedule
                              </button>
                              <button
                                onClick={() => { setCancelSessionId(booking.sessionId); setCancelBookingId(booking.bookingId); setShowCancelModal(true); }}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg hover:shadow-md transition-all text-sm font-semibold flex items-center gap-1"
                                style={{ backgroundColor: '#ef4444', color: '#fff' }}
                              >
                                <XCircle className="w-4 h-4" /> Cancel
                              </button>
                            </>
                          )}
                          {bookingTab === 'in_progress' && (
                            <>
                              <button
                                onClick={() => handleEnd(booking.sessionId)}
                                disabled={actionLoading === booking.sessionId}
                                className="px-3 py-1.5 rounded-lg hover:shadow-md transition-all text-sm font-semibold flex items-center gap-1"
                                style={{ backgroundColor: '#8b5cf6', color: '#fff' }}
                              >
                                <CheckCircle className="w-4 h-4" /> {actionLoading === booking.sessionId ? '...' : 'End Session'}
                              </button>
                            </>
                          )}
                          {bookingTab === 'completed' && (
                            <>
                              <button className="p-2 justify-center flex rounded-lg hover:shadow-md transition-all"
                                style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e' }}
                                title="View Details">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 justify-center flex rounded-lg hover:shadow-md transition-all"
                                style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e' }}
                                title="Download">
                                <Download className="w-4 h-4" />
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

      {/* ── Modals ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl m-4">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#4a3728' }}>Confirm Cancellation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#8a7a6a' }}>Reason for cancellation</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#7a5c3e]"
                  style={{ borderColor: '#e0d8cf' }}
                  placeholder="e.g. Scheduling conflict, emergency, etc."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                className="px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '1px solid #e0d8cf' }}
                onClick={() => { setShowCancelModal(false); setCancelSessionId(null); setCancelBookingId(null); setCancelReason(""); }}
              >
                Go Back
              </button>
              <button 
                className="px-4 py-2 rounded-lg font-semibold text-white flex items-center gap-2"
                style={{ backgroundColor: '#ef4444' }}
                onClick={handleCancelSubmit}
              >
                {actionLoading === cancelSessionId ? 'Processing...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl m-4">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#4a3728' }}>Reschedule Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#8a7a6a' }}>New Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#7a5c3e]"
                  style={{ borderColor: '#e0d8cf', color: '#4a3728' }}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#8a7a6a' }}>Reason</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#7a5c3e]"
                  style={{ borderColor: '#e0d8cf' }}
                  placeholder="Reason for rescheduling"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                className="px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '1px solid #e0d8cf' }}
                onClick={() => { setShowRescheduleModal(false); setRescheduleSessionId(null); setRescheduleBookingId(null); setRescheduleDate(""); setRescheduleReason(""); }}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 rounded-lg font-semibold text-white flex items-center gap-2"
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