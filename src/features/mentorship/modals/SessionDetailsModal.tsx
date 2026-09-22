'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Check, Copy, MoreVertical, X, Calendar as CalendarIcon, Clock, FileText, Share2, Star, CheckCircle, User } from "lucide-react";
import { formatSlotRange } from "../types/data";
import SessionService from '@/lib/api/session.service';

interface SessionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: any;           // from getMentorSessions (has sessionId, menteeId, status, etc.)
    onStatusChange?: (sessionId: string, newStatus: string, bookingId?: string) => Promise<void>;
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
    isOpen,
    onClose,
    session,
    onStatusChange,
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStatus, setCurrentStatus] = useState(session?.status || 'pending');

    // Extra booking details from getAllSessionsFromDB (has bookedMenteeName, slotTime, bookedAt)
    const [bookingDetail, setBookingDetail] = useState<any>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    // Reset state when session changes
    useEffect(() => {
        setCurrentStatus(session?.status || 'pending');
        setError(null);
        setBookingDetail(null);
    }, [session?.sessionId]);

    // Fetch DB record to get bookedMenteeName, slotTime, bookedAt
    useEffect(() => {
        if (!isOpen || !session?.sessionId) return;

        setLoadingDetail(true);
        SessionService.getAllSessionsFromDB()
            .then((res) => {
                const all = res.data as any[];
                const match = all.find((s) => s.sessionId === session.sessionId);
                if (match) setBookingDetail(match);
            })
            .catch(console.error)
            .finally(() => setLoadingDetail(false));
    }, [isOpen, session?.sessionId]);

    if (!isOpen || !session) return null;

    // Merge: prefer bookingDetail fields if available
    const bookings = bookingDetail?.bookings ?? [];
    const menteeName = bookings[0]?.menteeName ?? null;   // naam nahi hai yahan — neeche fix
    const slotTime = bookings[0]?.slotTime ?? null;
    const bookedAt = bookings[0]?.bookedAt ?? null;

    const scheduledAt = session?.scheduledAt ?? bookingDetail?.scheduledAt;
    const duration = session?.duration ?? bookingDetail?.duration;
    const pricing = session?.pricing ?? bookingDetail?.pricing;
    const sessionType = session?.sessionType ?? bookingDetail?.sessionType;
    const title = session?.title ?? session?.name ?? bookingDetail?.title ?? 'Untitled Session';
    const paymentMethod = bookingDetail?.payment?.method ?? '—';



    const handleConfirmBooking = async (bookedBy: string) => {
        setConfirmingId(bookedBy);
        setError(null);
        try {
            if (onStatusChange) {
                await onStatusChange(session.sessionId, 'confirmed', bookedBy);
            }
            setBookingDetail((prev: any) => ({
                ...prev,
                bookings: prev.bookings.map((b: any) =>
                    b.bookedBy === bookedBy ? { ...b, status: 'confirmed' } : b
                )
            }));
        } catch (err: any) {
            setError(err.message || 'Failed to confirm');
        } finally {
            setConfirmingId(null);
        }
    };

    const statusBadge = {
        pending: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
        confirmed: { bg: '#dcfce7', color: '#15803d', label: 'Confirmed' },
        completed: { bg: '#dbeafe', color: '#1d4ed8', label: 'Completed' },
        cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
    };
    const badge = statusBadge[currentStatus as keyof typeof statusBadge] ?? statusBadge.pending;

    const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const fmtTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn overflow-hidden flex flex-col max-h-[90vh]"
                style={{ border: '2px solid #e0d8cf' }}
            >
                {/* ── Top color bar ── */}
                <div className="flex-shrink-0 h-2 w-full" style={{ backgroundColor: '#4a3728' }} />

                <div className="p-8 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d8cec4 transparent' }}>
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold" style={{ color: '#4a3728' }}>Session Details</h2>
                            <p className="text-sm mt-1" style={{ color: '#8a7a6a' }}>Review and confirm this booking</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                            <X className="w-5 h-5" style={{ color: '#8a7a6a' }} />
                        </button>
                    </div>

                    {/* ── Status badge ── */}
                    <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl w-fit"
                        style={{ backgroundColor: badge.bg }}>
                        {currentStatus === 'pending'
                            ? <Clock className="w-4 h-4" style={{ color: badge.color }} />
                            : <CheckCircle className="w-4 h-4" style={{ color: badge.color }} />}
                        <span className="text-sm font-bold capitalize" style={{ color: badge.color }}>
                            {badge.label}
                        </span>
                    </div>

                    {/* ── Mentee card ── */}
                    {/* ── Bookings list ── */}
                    <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: '#fbf7f3', border: '1.5px solid #e0d8cf' }}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#8a7a6a' }}>
                            Bookings ({bookings.length})
                        </p>

                        {loadingDetail ? (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: '#e0d8cf' }}>
                                    <User className="w-5 h-5" style={{ color: '#8a7a6a' }} />
                                </div>
                                <p className="text-sm font-semibold" style={{ color: '#8a7a6a' }}>No bookings yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {bookings.map((booking: any, idx: number) => {
                                    const bBadge = {
                                        pending: { bg: '#fef3c7', color: '#b45309' },
                                        confirmed: { bg: '#dcfce7', color: '#15803d' },
                                        cancelled: { bg: '#fee2e2', color: '#dc2626' },
                                        completed: { bg: '#dbeafe', color: '#1d4ed8' },
                                    }[booking.status as string] ?? { bg: '#f3f4f6', color: '#6b7280' };

                                    return (
                                        <div key={booking._id || idx}
                                            className="flex items-center justify-between p-3 rounded-xl"
                                            style={{ backgroundColor: '#fff', border: '1px solid #e0d8cf' }}>

                                            {/* Left — mentee info */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                                    style={{ backgroundColor: '#4a3728' }}>
                                                    {String(idx + 1)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold" style={{ color: '#4a3728' }}>
                                                        Mentee {idx + 1}
                                                    </p>
                                                    <p className="text-xs" style={{ color: '#8a7a6a' }}>
                                                        {booking.slotTime ? formatSlotRange(booking.slotTime) : '—'} · {booking.bookedAt ? fmt(booking.bookedAt) : '—'}
                                                    </p>
                                                    <p className="text-xs" style={{ color: '#8a7a6a' }}>
                                                        ₹{booking.pricing?.totalAmount ?? 0} · {booking.payment?.method ?? '—'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right — status + confirm button */}
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                                                    style={{ backgroundColor: bBadge.bg, color: bBadge.color }}>
                                                    {booking.status}
                                                </span>

                                                {booking.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleConfirmBooking(booking.bookedBy)}
                                                        disabled={confirmingId === booking.bookedBy}
                                                        className="text-xs font-bold px-3 py-1 rounded-lg text-white transition-all"
                                                        style={{
                                                            backgroundColor: '#4a3728',
                                                            opacity: confirmingId === booking.bookedBy ? 0.6 : 1,
                                                            cursor: confirmingId === booking.bookedBy ? 'not-allowed' : 'pointer'
                                                        }}>
                                                        {confirmingId === booking.bookedBy ? '...' : 'Confirm'}
                                                    </button>
                                                )}

                                                {booking.status === 'confirmed' && (
                                                    <span className="text-xs font-semibold" style={{ color: '#15803d' }}>✅ Confirmed</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Session info grid ── */}
                    <div className="grid grid-cols-2 gap-4 mb-5">

                        {/* Title */}
                        <div className="col-span-2 rounded-xl p-4" style={{ backgroundColor: '#fbf7f3', border: '1.5px solid #e0d8cf' }}>
                            <div className="flex items-center gap-2 mb-1">
                                <Tag className="w-4 h-4" style={{ color: '#7a5c3e' }} />
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8a7a6a' }}>Session</span>
                            </div>
                            <p className="font-bold text-base" style={{ color: '#4a3728' }}>{title}</p>
                            <p className="text-xs capitalize mt-0.5" style={{ color: '#8a7a6a' }}>
                                {sessionType?.replace(/_/g, ' ')}
                            </p>
                        </div>

                        {/* Date */}
                        <div className="rounded-xl p-4" style={{ backgroundColor: '#fbf7f3', border: '1.5px solid #e0d8cf' }}>
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4" style={{ color: '#7a5c3e' }} />
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8a7a6a' }}>Date</span>
                            </div>
                            <p className="font-bold" style={{ color: '#4a3728' }}>
                                {scheduledAt ? fmt(scheduledAt) : '—'}
                            </p>
                        </div>

                        {/* Slot Time */}
                        <div className="rounded-xl p-4" style={{ backgroundColor: '#fbf7f3', border: '1.5px solid #e0d8cf' }}>
                            <div className="flex items-center gap-2 mb-1">
                                <AlarmClock className="w-4 h-4" style={{ color: '#7a5c3e' }} />
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8a7a6a' }}>Slot Time</span>
                            </div>
                            <p className="font-bold" style={{ color: '#4a3728' }}>
                                {slotTime ? formatSlotRange(slotTime) : (scheduledAt ? fmtTime(scheduledAt) : '—')}
                            </p>
                        </div>

                        {/* Duration */}
                        <div className="rounded-xl p-4" style={{ backgroundColor: '#fbf7f3', border: '1.5px solid #e0d8cf' }}>
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4" style={{ color: '#7a5c3e' }} />
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8a7a6a' }}>Duration</span>
                            </div>
                            <p className="font-bold" style={{ color: '#4a3728' }}>{duration ?? '—'} mins</p>
                        </div>

                        {/* Price */}
                        <div className="rounded-xl p-4" style={{ backgroundColor: '#fbf7f3', border: '1.5px solid #e0d8cf' }}>
                            <div className="flex items-center gap-2 mb-1">
                                <CreditCard className="w-4 h-4" style={{ color: '#7a5c3e' }} />
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8a7a6a' }}>Amount</span>
                            </div>
                            <p className="font-bold" style={{ color: '#4a3728' }}>
                                {pricing?.totalAmount > 0 ? `₹${pricing.totalAmount}` : 'Free'}
                            </p>
                            <p className="text-xs capitalize mt-0.5" style={{ color: '#8a7a6a' }}>{paymentMethod}</p>
                        </div>

                    </div>

                    {/* ── Error ── */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl text-sm font-semibold"
                            style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                            {error}
                        </div>
                    )}

                    {/* ── Action buttons ── */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-semibold transition-all"
                            style={{ backgroundColor: '#fbf7f3', color: '#7a5c3e', border: '2px solid #e0d8cf' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionDetailsModal;