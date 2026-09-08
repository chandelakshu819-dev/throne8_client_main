'use client';

import { useState } from 'react';
import CompanyService from '@/lib/api/company.service';

interface Props {
  companyId: string;
  onSuccess: (newEmployee: any) => void;
  onClose: () => void;
}

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  designation: '',
  department: '',
  joinDate: new Date().toISOString().split('T')[0],
  skillsInput: '',
  bio: '',
};

export default function AddEmployeeModal({ companyId, onSuccess, onClose }: Props) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyId) {
      setError('Company ID not found. Please refresh and try again.');
      return;
    }

    // Required fields validation
    if (!form.firstName.trim() || form.firstName.trim().length < 2) {
      setError('First name must be at least 2 characters');
      return;
    }
    if (!form.lastName.trim() || form.lastName.trim().length < 2) {
      setError('Last name must be at least 2 characters');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      setError('Please provide a valid email address');
      return;
    }
    if (!form.designation.trim() || form.designation.trim().length < 2) {
      setError('Designation is required (at least 2 characters)');
      return;
    }
    if (!form.joinDate) {
      setError('Join date is required');
      return;
    }

    const selectedDate = new Date(form.joinDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      setError('Join date cannot be in the future');
      return;
    }

    setLoading(true);
    try {
      const skills = form.skillsInput
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

      const payload: any = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        company: companyId,
        designation: form.designation.trim(),
        joinDate: form.joinDate,
      };

      if (form.department.trim()) {
        payload.department = form.department.trim();
      }
      if (form.phone.trim()) {
        payload.phone = form.phone.trim();
      }
      if (form.bio.trim()) {
        payload.bio = form.bio.trim();
      }
      if (skills.length > 0) {
        payload.skills = skills;
      }

      const response = await CompanyService.createEmployee(payload);
      const created = response?.data || response;
      onSuccess(created);
    } catch (err: any) {
      console.error('❌ Failed to add employee:', err);
      setError(err.message || 'Failed to create employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-employee-title"
    >
      <div className="bg-[#f6ede8] border border-[#e0d8cf] rounded-2xl shadow-xl w-full max-w-lg my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0d8cf] bg-[#f6ede8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4a3728] text-[#f6ede8] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 id="add-employee-title" className="text-base font-bold text-[#4a3728]">
                Add New Employee
              </h2>
              <p className="text-xs text-[#4a3728]/60">Fill in the details to add a team member</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="p-1.5 rounded-lg hover:bg-[#e0d8cf] text-[#4a3728] transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="e.g. Rahul"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="e.g. Sharma"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
              />
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="email" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="rahul@company.com"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
              />
            </div>
            <div>
              <label htmlFor="phone" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                disabled={loading}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
              />
            </div>
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="designation" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
                Designation / Role <span className="text-red-500">*</span>
              </label>
              <input
                id="designation"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
              />
            </div>
            <div>
              <label htmlFor="department" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
                Department
              </label>
              <input
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. Engineering, Product, HR"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
              />
            </div>
          </div>

          {/* Join Date */}
          <div>
            <label htmlFor="joinDate" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
              Joining Date <span className="text-red-500">*</span>
            </label>
            <input
              id="joinDate"
              name="joinDate"
              type="date"
              value={form.joinDate}
              onChange={handleChange}
              required
              disabled={loading}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
            />
          </div>

          {/* Skills */}
          <div>
            <label htmlFor="skillsInput" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
              Skills <span className="font-normal text-[#4a3728]/40">(comma-separated)</span>
            </label>
            <input
              id="skillsInput"
              name="skillsInput"
              value={form.skillsInput}
              onChange={handleChange}
              disabled={loading}
              placeholder="e.g. React, Node.js, TypeScript, Cloud"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
              Bio / Summary
            </label>
            <textarea
              id="bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              disabled={loading}
              placeholder="Brief summary of experience, background, or team role..."
              rows={3}
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-3 border-t border-[#e0d8cf]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-[#e0d8cf] text-[#4a3728] hover:bg-[#e0d8cf] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#4a3728] text-[#f6ede8] hover:bg-[#6b4e3d] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Adding Employee...</span>
                </>
              ) : (
                'Add Employee'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}