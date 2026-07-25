import React, { useState } from 'react';

const REPORT_REASONS = [
    'Spam or misleading',
    'Harassment or bullying',
    'Hate speech or symbols',
    'Nudity or sexual content',
    'False information',
    'Something else',
];

const ReportPostModal = ({
    postId,
    onClose,
    onSubmit,
    isSubmitting,
}: {
    postId: string;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    isSubmitting: boolean;
}) => {
    const [selectedReason, setSelectedReason] = useState('');

    return (
        <div onClick={onClose} className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#e0d8cf]/50">
                <h2 className="text-lg font-black text-[#4a3728] mb-4">Report this post</h2>
                <div className="space-y-2 mb-6">
                    {REPORT_REASONS.map((reason) => (
                        <label key={reason} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#e0d8cf]/20 cursor-pointer">
                            <input
                                type="radio"
                                name="report-reason"
                                checked={selectedReason === reason}
                                onChange={() => setSelectedReason(reason)}
                                className="accent-[#4a3728]"
                            />
                            <span className="text-sm font-medium text-[#4a3728]">{reason}</span>
                        </label>
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-[#4a3728]/20 text-[#4a3728] font-semibold text-sm">
                        Cancel
                    </button>
                    <button
                        onClick={() => selectedReason && onSubmit(selectedReason)}
                        disabled={!selectedReason || isSubmitting}
                        className="flex-1 py-2.5 rounded-xl bg-[#4a3728] text-white font-semibold text-sm disabled:opacity-50"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportPostModal;