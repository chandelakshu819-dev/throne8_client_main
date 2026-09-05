'use client';
import React, { useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

interface DeleteSkillConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    skillName: string;
    isDeleting: boolean;
    error?: string;
}

const DeleteSkillConfirmModal: React.FC<DeleteSkillConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    skillName,
    isDeleting,
    error = ''
}) => {
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={!isDeleting ? onClose : undefined}
            ></div>

            {/* Modal */}
            <div className="relative z-10 w-full max-w-sm mx-4 bg-[#F6EDE8] rounded-2xl shadow-2xl p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#f3d9d3] flex items-center justify-center shrink-0">
                            <Trash2 className="w-4 h-4 text-red-600" />
                        </div>
                        <h3 className="text-base font-bold text-[#4a3728]">Delete skill?</h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="p-1 rounded-full hover:bg-black/5 transition-colors disabled:opacity-50"
                    >
                        <X className="w-4 h-4 text-[#4a3728]/60" />
                    </button>
                </div>

                {/* Content */}
                <p className="text-sm text-[#4a3728]/70 mb-3">
                    Are you sure you want to delete <span className="font-semibold text-[#4a3728]">{skillName}</span> permanently?
                </p>

                {error && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                        {error}
                    </p>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-5 py-2 rounded-lg border border-[#e0d8cf] text-[#4a3728] text-sm font-medium hover:bg-white/50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteSkillConfirmModal;