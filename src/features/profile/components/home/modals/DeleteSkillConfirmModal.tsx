'use client';
import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteSkillConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    skillName: string;
    isDeleting: boolean;
}

const DeleteSkillConfirmModal: React.FC<DeleteSkillConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    skillName,
    isDeleting
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
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={!isDeleting ? onClose : undefined}
            ></div>

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-yellow-300" />
                            <h3 className="text-xl font-bold text-white">Delete Skill</h3>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-[#4a3728] text-base leading-relaxed mb-2">
                        Are you sure you want to permanently delete{' '}
                        <span className="font-bold">{skillName}</span>?
                    </p>
                    <p className="text-red-600 text-sm leading-relaxed mb-6">
                        ⚠️ This action cannot be undone!
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 px-6 py-3 rounded-full border-2 border-[#e0d8cf] text-[#4a3728] font-semibold hover:bg-[#f6ede8]/50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Deleting...
                                </>
                            ) : (
                                'Delete Permanently'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteSkillConfirmModal;