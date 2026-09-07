'use client';

import React from 'react';
import { CompanyFormValues } from '../../types';

interface LivePreviewCardProps {
  form: CompanyFormValues;
  logoUrl?: string | null;
  bannerUrl?: string | null;
}

export function LivePreviewCard({ form, logoUrl, bannerUrl }: LivePreviewCardProps) {
  const initials = (form.name?.trim() || 'T8')
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const websiteHref = form.website
    ? form.website.startsWith('http')
      ? form.website
      : `https://${form.website}`
    : null;

  return (
    <div className="bg-white border border-[#e8dfd5] rounded-xl shadow-sm overflow-hidden sticky top-24">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#f0e8e0] bg-[#faf6f2]/70">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="text-xs font-bold text-[#4a3728] tracking-wide">Live Preview</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-[#f3ede8] text-[#4a3728]/70 border border-[#e0d8cf]">
          Public Card
        </span>
      </div>

      <div className="p-3.5">
        {/* Visual Card Container */}
        <div className="rounded-lg border border-[#ebe2d8] overflow-hidden bg-white shadow-[0_2px_6px_rgba(74,55,40,0.03)]">
          {/* Cover Banner - compact height around 85-95px */}
          <div className="relative h-20 sm:h-22 w-full overflow-hidden bg-[#e8dfd5]">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="Cover Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#d9cfc5] via-[#e5dcd3] to-[#cfc4b9] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#4a3728]/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-3.5 pt-0 relative">
            {/* Logo - overlapping cover */}
            <div className="-mt-6 mb-2 flex items-end justify-between">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-[#3d2b1f] flex items-center justify-center flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#f6ede8] text-base font-bold tracking-wider">{initials}</span>
                )}
              </div>
            </div>

            {/* Name & Tagline */}
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#3d2b1f] leading-snug">
                {form.name || <span className="text-[#4a3728]/40 italic">Company Name</span>}
              </h4>
              <p className="text-[11px] text-[#4a3728]/70 mt-0.5 leading-relaxed line-clamp-2">
                {form.tagline || (
                  <span className="text-[#4a3728]/40 italic">Add a compelling company tagline...</span>
                )}
              </p>
            </div>

            {/* Meta info chips */}
            <div className="mt-2.5 pt-2.5 border-t border-[#f2eae1] flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#4a3728]/75">
              {/* Industry */}
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3 text-[#8c7361]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>{form.industry || 'Industry'}</span>
              </span>

              {/* Location */}
              {form.location && (
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3 h-3 text-[#8c7361]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate max-w-[120px]">{form.location}</span>
                </span>
              )}

              {/* Size */}
              {form.size && (
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3 h-3 text-[#8c7361]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{form.size.includes('employees') ? form.size : `${form.size} employees`}</span>
                </span>
              )}

              {/* Website link */}
              {websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[#b45309] font-medium hover:underline hover:text-[#92400e]"
                >
                  <svg className="w-3 h-3 text-[#d97706]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span>Website ↗</span>
                </a>
              )}
            </div>

            {/* Description */}
            {form.description && (
              <div className="mt-2.5 pt-2.5 border-t border-[#f2eae1]">
                <p className="text-[11px] text-[#4a3728]/80 leading-relaxed line-clamp-3">
                  {form.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
