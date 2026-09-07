'use client';

import React from 'react';
import { CompanyFormValues } from '../../types';

const SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+'];

const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Construction',
  'Transportation',
  'Media',
  'Government',
  'Non-Profit',
  'Real Estate',
  'Energy',
  'Agriculture',
  'Hospitality',
  'Consulting',
  'Legal',
  'Marketing',
  'Telecommunications',
  'Biotechnology',
  'E-commerce',
  'Gaming',
  'Cybersecurity',
  'Other',
];

interface Props {
  form: CompanyFormValues;
  errors: Partial<Record<keyof CompanyFormValues, string>>;
  setField: <K extends keyof CompanyFormValues>(key: K, value: CompanyFormValues[K]) => void;
}

const inputClass =
  'w-full h-[40px] bg-[#fcf9f6] border border-[#e0d8cf] rounded-xl px-3 text-xs sm:text-sm text-[#3d2b1f] placeholder-[#4a3728]/35 focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/15 focus:border-[#3d2b1f] transition-all';

export function BasicInfoSection({ form, errors, setField }: Props) {
  return (
    <section id="basic-info" className="bg-white border border-[#e8dfd5] rounded-xl p-4 sm:p-5 shadow-sm scroll-mt-24 space-y-4">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[#d97706]">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          <h2 className="text-sm sm:text-base font-bold text-[#3d2b1f]">Basic Information</h2>
        </div>
        <p className="text-[11px] sm:text-xs text-[#4a3728]/60">
          Key details about your organization
        </p>
      </div>

      {/* Grid for 2-column fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Company Name */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#3d2b1f] mb-1">
            <svg className="w-3.5 h-3.5 text-[#8c7361]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            placeholder="e.g. Throne8"
            className={`${inputClass} ${errors.name ? 'border-red-500 focus:ring-red-200' : ''}`}
          />
          {errors.name && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.name}</p>}
        </div>

        {/* Throne8 URL Slug */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#3d2b1f] mb-1">
            <svg className="w-3.5 h-3.5 text-[#8c7361]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Throne8 URL <span className="text-red-500">*</span>
          </label>
          <div className="flex h-[40px] rounded-xl overflow-hidden shadow-none">
            <span className="inline-flex items-center px-3 bg-[#f0e8e0] border border-r-0 border-[#e0d8cf] text-xs font-medium text-[#4a3728]/70 select-none">
              throne8.com/
            </span>
            <input
              type="text"
              value={form.slug}
              onChange={e => setField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="throne8"
              className={`flex-1 h-full bg-[#fcf9f6] border border-[#e0d8cf] rounded-r-xl px-3 text-xs sm:text-sm text-[#3d2b1f] placeholder-[#4a3728]/35 focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/15 focus:border-[#3d2b1f] ${
                errors.slug ? 'border-red-500 focus:ring-red-200' : ''
              }`}
            />
          </div>
          {errors.slug && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.slug}</p>}
        </div>

        {/* Industry */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#3d2b1f] mb-1">
            <svg className="w-3.5 h-3.5 text-[#8c7361]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Industry <span className="text-red-500">*</span>
          </label>
          <select
            value={form.industry}
            onChange={e => setField('industry', e.target.value)}
            className={`${inputClass} appearance-none cursor-pointer ${
              errors.industry ? 'border-red-500 focus:ring-red-200' : ''
            }`}
          >
            <option value="">Select industry</option>
            {INDUSTRY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.industry && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.industry}</p>}
        </div>

        {/* Headquarters Location */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#3d2b1f] mb-1">
            <svg className="w-3.5 h-3.5 text-[#8c7361]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Headquarters Location
          </label>
          <input
            type="text"
            value={form.location}
            onChange={e => setField('location', e.target.value)}
            placeholder="e.g. Bhopal, Madhya Pradesh, India"
            className={inputClass}
          />
        </div>

        {/* Founded Year */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#3d2b1f] mb-1">
            <svg className="w-3.5 h-3.5 text-[#8c7361]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Founded Year
          </label>
          <input
            type="text"
            maxLength={4}
            value={form.founded}
            onChange={e => setField('founded', e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 2022"
            className={`${inputClass} ${errors.founded ? 'border-red-500 focus:ring-red-200' : ''}`}
          />
          {errors.founded && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.founded}</p>}
        </div>

        {/* Official Website */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#3d2b1f] mb-1">
            <svg className="w-3.5 h-3.5 text-[#8c7361]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Official Website
          </label>
          <input
            type="url"
            value={form.website}
            onChange={e => setField('website', e.target.value)}
            placeholder="https://throne8.com"
            className={`${inputClass} ${errors.website ? 'border-red-500 focus:ring-red-200' : ''}`}
          />
          {errors.website && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.website}</p>}
        </div>
      </div>

      {/* Company Size - Pill Selection */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#3d2b1f] mb-1.5">
          <svg className="w-3.5 h-3.5 text-[#8c7361]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Company Size
        </label>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {SIZE_OPTIONS.map(opt => {
            const isSelected = form.size === opt || form.size === `${opt} employees`;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setField('size', opt)}
                className={`h-[34px] px-3 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#3d2b1f] text-[#f6ede8] shadow-xs'
                    : 'bg-[#fcf9f6] border border-[#e0d8cf] text-[#3d2b1f]/80 hover:bg-[#f3ede8] hover:text-[#3d2b1f]'
                }`}
              >
                {opt} employees
              </button>
            );
          })}
        </div>
      </div>

      {/* Tagline */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#3d2b1f]">
            <svg className="w-3.5 h-3.5 text-[#8c7361]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tagline
          </label>
          <span className="text-[10px] text-[#4a3728]/45">
            {form.tagline?.length ?? 0}/150
          </span>
        </div>
        <input
          type="text"
          maxLength={150}
          value={form.tagline}
          onChange={e => setField('tagline', e.target.value)}
          placeholder="Empowering Professional Networking for Millions with AI, Security, and Scalable Innovation"
          className={`${inputClass} ${errors.tagline ? 'border-red-500 focus:ring-red-200' : ''}`}
        />
        {errors.tagline && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.tagline}</p>}
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#3d2b1f]">
            <svg className="w-3.5 h-3.5 text-[#8c7361]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Description
          </label>
          <span className="text-[10px] text-[#4a3728]/45">
            {form.description?.length ?? 0}/1000
          </span>
        </div>
        <textarea
          rows={3}
          maxLength={1000}
          value={form.description}
          onChange={e => setField('description', e.target.value)}
          placeholder="Thronet Technology Private Limited is a technology company focused on building AI-driven professional networking platforms..."
          className="w-full bg-[#fcf9f6] border border-[#e0d8cf] rounded-xl p-3 text-xs sm:text-sm text-[#3d2b1f] placeholder-[#4a3728]/35 focus:outline-none focus:ring-2 focus:ring-[#3d2b1f]/15 focus:border-[#3d2b1f] transition-all resize-none leading-relaxed"
        />
        {errors.description && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.description}</p>}
      </div>
    </section>
  );
}