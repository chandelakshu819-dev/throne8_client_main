'use client';

import React, { useEffect } from 'react';
import { Trash2, X } from 'lucide-react';

interface UnfollowConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    targetName: string;
    isUnfollowing?: boolean;
}

const UnfollowConfirmModal: React.FC<UnfollowConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    targetName,
    isUnfollowing = false,
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#e0d8cf] relative text-center"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Trash Icon Badge */}
                <div className="w-14 h-14 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4 mt-2">
                    <Trash2 className="w-7 h-7" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Unfollow {targetName}?
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto mb-6">
                    You will stop seeing their posts in your feed. Your connection will not be affected.
                </p>

                {/* Buttons */}
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={isUnfollowing}
                        className="px-6 py-2.5 rounded-full bg-[#f6ede8] text-[#4a3728] hover:bg-[#e0d8cf] font-semibold text-xs transition-all border border-[#e0d8cf]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isUnfollowing}
                        className="px-6 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
                    >
                        {isUnfollowing ? 'Unfollowing...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnfollowConfirmModal;
