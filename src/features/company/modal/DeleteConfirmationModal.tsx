'use client';

interface Props {
  employeeName: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmationModal({
  employeeName,
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-employee-title"
    >
      <div className="bg-[#f6ede8] border border-[#e0d8cf] rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e0d8cf] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 id="delete-employee-title" className="text-lg font-bold text-[#4a3728]">
              Delete Employee?
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-[#4a3728]/50 hover:bg-[#e0d8cf] hover:text-[#4a3728] transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-2">
          <p className="text-sm text-[#4a3728]/80 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-[#4a3728]">{employeeName}</span>?
          </p>
          <p className="text-xs font-medium text-red-600/90">
            This action cannot be undone.
          </p>

          {error && (
            <div className="p-3 mt-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[#e0d8cf] flex gap-3 bg-[#e0d8cf]/10">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-[#e0d8cf] text-[#4a3728] hover:bg-[#e0d8cf] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Deleting...</span>
              </>
            ) : (
              'Delete Employee'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
