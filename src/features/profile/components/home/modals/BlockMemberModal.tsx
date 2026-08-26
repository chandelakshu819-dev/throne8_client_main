'use client';

import React, { useEffect, useState } from 'react';
import { X, Ban, ShieldAlert, CheckCircle2, Loader2, UserX } from 'lucide-react';
import ConnectionService from '@/lib/api/connection.service';

interface BlockMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    name: string;
    userId: string;
    onBlockSuccess?: () => void;
}

const BLOCK_REASONS = [
    { id: 'harassment', label: 'Harassment or inappropriate behavior' },
    { id: 'spam', label: 'Spam or unwanted messages' },
    { id: 'no_see', label: 'I do not want to see their posts' },
    { id: 'other', label: 'Other reason' },
];

const BlockMemberModal: React.FC<BlockMemberModalProps> = ({
    isOpen,
    onClose,
    name,
    userId,
    onBlockSuccess,
}) => {
    const [selectedReason, setSelectedReason] = useState<string>('other');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isBlocked, setIsBlocked] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setSelectedReason('other');
            setIsBlocked(false);
            setErrorMsg(null);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBlock = async () => {
        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            await ConnectionService.blockUser(userId, selectedReason);
            setIsBlocked(true);
            if (onBlockSuccess) {
                onBlockSuccess();
            }
        } catch (err: any) {
            console.error('Failed to block member:', err);
            // If already blocked or success
            if (err.message?.includes('already blocked') || err.message?.includes('success')) {
                setIsBlocked(true);
                if (onBlockSuccess) onBlockSuccess();
            } else {
                setErrorMsg(err.message || 'Failed to block user. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-[#e0d8cf] relative"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-[#f6ede8] text-[#4a3728] hover:bg-[#e0d8cf] transition-all duration-200"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>

                {isBlocked ? (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                            <UserX className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-[#4a3728] mb-2">{name} has been blocked</h3>
                        <p className="text-sm text-[#4a3728]/70 max-w-sm mx-auto mb-6">
                            You will no longer receive notifications, messages, or updates from this member.
                        </p>
                        <button
                            onClick={() => {
                                onClose();
                                window.location.href = '/dashboard';
                            }}
                            className="w-full py-3 rounded-2xl bg-[#4a3728] text-white font-bold text-sm hover:bg-[#6b4e31] transition-all duration-200 shadow-md"
                        >
                            Return to Feed
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                            <Ban className="w-6 h-6 text-red-600" />
                            <h2 className="text-xl font-bold text-[#4a3728]">Block {name}?</h2>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                                {errorMsg}
                            </div>
                        )}

                        {/* Info Warning Card */}
                        <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/80 mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-xs font-bold text-red-900">What happens when you block {name}:</p>
                            </div>
                            <ul className="text-xs text-red-800/90 space-y-1.5 pl-5 list-disc font-medium">
                                <li>They will not be able to view your profile or posts.</li>
                                <li>They will not be able to message or connect with you.</li>
                                <li>We will not notify {name} that you blocked them.</li>
                            </ul>
                        </div>

                        {/* Reason Selection */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-[#4a3728] uppercase tracking-wider mb-2">
                                Reason for blocking (Optional)
                            </label>
                            <select
                                value={selectedReason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                className="w-full bg-[#f6ede8]/50 border border-[#e0d8cf] rounded-2xl p-3 text-xs text-[#4a3728] font-medium outline-none focus:border-[#4a3728] transition-all duration-200"
                            >
                                {BLOCK_REASONS.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="flex-1 py-3 rounded-2xl border-2 border-[#4a3728]/20 text-[#4a3728] font-bold text-sm hover:bg-[#f6ede8] transition-all duration-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBlock}
                                disabled={isSubmitting}
                                className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all duration-200 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Blocking...</span>
                                    </>
                                ) : (
                                    <span>Block Member</span>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BlockMemberModal;
