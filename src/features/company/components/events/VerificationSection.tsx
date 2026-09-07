'use client';

import React from 'react';
import { VerificationStatus } from '../../types';

interface Props {
  status: VerificationStatus;
  isVerifying?: boolean;
  onVerify?: () => void;
}

const CONFIG: Record<VerificationStatus, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  verified: {
    label: 'Verified Organization',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: (
      <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  pending: {
    label: 'Verification Pending',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: (
      <svg className="w-3 h-3 text-amber-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  unverified: {
    label: 'Not Verified',
    badgeClass: 'bg-[#f0e8e0] text-[#4a3728]/70 border-[#e0d8cf]',
    icon: (
      <svg className="w-3 h-3 text-[#4a3728]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
};

export function VerificationSection({ status, isVerifying = false, onVerify }: Props) {
  const current = CONFIG[status] || CONFIG.unverified;

  return (
    <section id="verification" className="bg-white border border-[#e8dfd5] rounded-xl p-4 sm:p-5 shadow-sm scroll-mt-24 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[#d97706]">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            <h2 className="text-sm sm:text-base font-bold text-[#3d2b1f]">Verification</h2>
          </div>
          <p className="text-[11px] sm:text-xs text-[#4a3728]/60">
            Build credibility and trust with an official verification badge
          </p>
        </div>

        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex-shrink-0 ${current.badgeClass}`}>
          {current.icon}
          <span>{current.label}</span>
        </span>
      </div>

      <div className="bg-[#fcf9f6] border border-[#e8dfd5]/80 rounded-xl p-3.5 text-xs text-[#4a3728]/80 leading-relaxed">
        {status === 'verified' ? (
          <p>
            Your organization is officially verified on Throne8. This badge appears next to your company name across searches, job listings, and public pages.
          </p>
        ) : status === 'pending' ? (
          <p>
            Your verification request is currently under review. You will receive a notification once verification is completed.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="max-w-md text-xs text-[#4a3728]/75">
              Verified companies get higher visibility in talent searches and enhanced employer trust.
            </p>
            {onVerify && (
              <button
                type="button"
                onClick={onVerify}
                disabled={isVerifying}
                className="inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-lg text-xs font-semibold bg-[#3d2b1f] text-[#f6ede8] hover:bg-[#2b1e15] transition-colors shadow-xs disabled:opacity-50 whitespace-nowrap self-start sm:self-auto flex-shrink-0"
              >
                {isVerifying ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 text-[#d97706]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Request Verification
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}