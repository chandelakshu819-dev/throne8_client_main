'use client';

import { useState, useEffect } from 'react';
import { type Employee } from '@/features/company/store/slices/employeesslice';
import CompanyService from '@/lib/api/company.service';

interface Props {
  employee: Employee;
  companyId: string;
  onSuccess: (updatedEmployee: any) => void;
  onClose: () => void;
}

export default function UpdateEmployeeModal({ employee, companyId, onSuccess, onClose }: Props) {
  const [statusLoading, setStatusLoading] = useState(false);
  const [advocacyLoading, setAdvocacyLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    email: employee.email || '',
    phone: employee.phone || '',
    designation: employee.title || '',
    department: employee.dept || '',
    joinDate: employee.joinDateRaw
      ? new Date(employee.joinDateRaw).toISOString().split('T')[0]
      : '',
    skillsInput: Array.isArray(employee.skills) ? employee.skills.join(', ') : '',
    bio: employee.bio || '',
    isActive: employee.active,
    isAdvocate: employee.isAdvocate,
  });

  useEffect(() => {
    // If firstName/lastName weren't split in employee object, derive from name
    let fn = employee.firstName;
    let ln = employee.lastName;
    if (!fn && !ln && employee.name) {
      const parts = employee.name.trim().split(' ');
      fn = parts[0] || '';
      ln = parts.slice(1).join(' ') || '';
    }

    setForm({
      firstName: fn || '',
      lastName: ln || '',
      email: employee.email || '',
      phone: employee.phone || '',
      designation: employee.title || '',
      department: employee.dept || '',
      joinDate: employee.joinDateRaw
        ? new Date(employee.joinDateRaw).toISOString().split('T')[0]
        : '',
      skillsInput: Array.isArray(employee.skills) ? employee.skills.join(', ') : '',
      bio: employee.bio || '',
      isActive: employee.active,
      isAdvocate: employee.isAdvocate,
    });
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleToggleStatus = async () => {
    setStatusLoading(true);
    setError(null);
    try {
      const res = await CompanyService.toggleEmployeeStatus(employee.id);
      const updatedEmp = res?.data || res;
      setForm(prev => ({ ...prev, isActive: updatedEmp?.isActive ?? !prev.isActive }));
      onSuccess({
        ...employee,
        active: updatedEmp?.isActive ?? !employee.active,
      });
    } catch (err: any) {
      console.error('❌ Status toggle failed:', err);
      setError(err.message || 'Failed to update employee status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleToggleAdvocacy = async () => {
    if (!form.isActive) {
      setError('Cannot set advocacy on an inactive employee');
      return;
    }
    setAdvocacyLoading(true);
    setError(null);
    try {
      const nextVal = !form.isAdvocate;
      const res = await CompanyService.toggleEmployeeAdvocacy(companyId, employee.id, nextVal);
      const updatedEmp = res?.data || res;
      setForm(prev => ({ ...prev, isAdvocate: updatedEmp?.isAdvocate ?? nextVal }));
      onSuccess({
        ...employee,
        isAdvocate: updatedEmp?.isAdvocate ?? nextVal,
        advocacy: updatedEmp?.isAdvocate ?? nextVal,
      });
    } catch (err: any) {
      console.error('❌ Advocacy toggle failed:', err);
      setError(err.message || 'Failed to update advocacy status');
    } finally {
      setAdvocacyLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.firstName.trim() || form.firstName.trim().length < 2) {
      setError('First name must be at least 2 characters');
      return;
    }
    if (!form.lastName.trim() || form.lastName.trim().length < 2) {
      setError('Last name must be at least 2 characters');
      return;
    }
    if (!form.designation.trim() || form.designation.trim().length < 2) {
      setError('Designation is required');
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
        designation: form.designation.trim(),
        department: form.department.trim(),
      };

      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.bio.trim()) payload.bio = form.bio.trim();
      if (skills.length > 0) payload.skills = skills;

      const res = await CompanyService.updateEmployee(employee.id, payload);
      const updatedApi = res?.data || res;

      onSuccess({
        ...employee,
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        title: form.designation.trim(),
        dept: form.department.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        skills,
        avatar: `${form.firstName.trim()[0] || ''}${form.lastName.trim()[0] || ''}`.toUpperCase(),
        active: form.isActive,
        isAdvocate: form.isAdvocate,
        ...(updatedApi && typeof updatedApi === 'object' ? updatedApi : {}),
      });
    } catch (err: any) {
      console.error('❌ Update failed:', err);
      setError(err.message || 'Failed to update employee details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-employee-title"
    >
      <div className="bg-[#f6ede8] border border-[#e0d8cf] rounded-2xl shadow-xl w-full max-w-lg my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0d8cf] bg-[#f6ede8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4a3728] text-[#f6ede8] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 id="edit-employee-title" className="text-base font-bold text-[#4a3728]">
                Edit Employee
              </h2>
              <p className="text-xs text-[#4a3728]/60">Update details for {employee.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading || statusLoading || advocacyLoading}
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
              <label htmlFor="edit-firstName" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
              />
            </div>
            <div>
              <label htmlFor="edit-lastName" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-email" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
                Email Address
              </label>
              <input
                id="edit-email"
                name="email"
                type="email"
                value={form.email}
                disabled
                className="w-full px-3.5 py-2.5 text-sm bg-[#e0d8cf]/30 border border-[#e0d8cf] rounded-xl text-[#4a3728]/60 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="edit-phone" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
                Phone Number
              </label>
              <input
                id="edit-phone"
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

          {/* Designation & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-designation" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
                Designation / Role <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-designation"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
              />
            </div>
            <div>
              <label htmlFor="edit-department" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
                Department
              </label>
              <input
                id="edit-department"
                name="department"
                value={form.department}
                onChange={handleChange}
                disabled={loading}
                placeholder="Engineering, Marketing, HR"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label htmlFor="edit-skillsInput" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
              Skills <span className="font-normal text-[#4a3728]/40">(comma-separated)</span>
            </label>
            <input
              id="edit-skillsInput"
              name="skillsInput"
              value={form.skillsInput}
              onChange={handleChange}
              disabled={loading}
              placeholder="e.g. React, Node.js, SQL"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="edit-bio" className="text-xs font-semibold text-[#4a3728]/80 block mb-1">
              Bio / Summary
            </label>
            <textarea
              id="edit-bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              disabled={loading}
              rows={2}
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/30 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all resize-none"
            />
          </div>

          {/* Status & Advocacy Quick Controls */}
          <div className="space-y-3 pt-2">
            {/* Active Status */}
            <div className="flex items-center justify-between p-3.5 bg-white border border-[#e0d8cf] rounded-xl">
              <div>
                <p className="text-xs font-bold text-[#4a3728]">Employment Status</p>
                <p className="text-xs text-[#4a3728]/60 mt-0.5">
                  Currently:{' '}
                  <span className={`font-semibold ${form.isActive ? 'text-green-700' : 'text-red-600'}`}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={statusLoading}
                aria-label={`Toggle status, currently ${form.isActive ? 'Active' : 'Inactive'}`}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/30 disabled:opacity-50 ${
                  form.isActive ? 'bg-[#4a3728]' : 'bg-[#e0d8cf]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${
                    form.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Advocacy Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-white border border-[#e0d8cf] rounded-xl">
              <div>
                <p className="text-xs font-bold text-[#4a3728]">Company Advocate</p>
                <p className="text-xs text-[#4a3728]/60 mt-0.5">
                  Currently:{' '}
                  <span className={`font-semibold ${form.isAdvocate ? 'text-purple-700' : 'text-gray-500'}`}>
                    {form.isAdvocate ? 'Advocate Enabled' : 'Not an Advocate'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleAdvocacy}
                disabled={advocacyLoading || !form.isActive}
                aria-label={`Toggle advocacy, currently ${form.isAdvocate ? 'Advocate' : 'Not Advocate'}`}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:opacity-40 ${
                  form.isAdvocate ? 'bg-purple-700' : 'bg-[#e0d8cf]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${
                    form.isAdvocate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-3 border-t border-[#e0d8cf]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || statusLoading || advocacyLoading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-[#e0d8cf] text-[#4a3728] hover:bg-[#e0d8cf] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || statusLoading || advocacyLoading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#4a3728] text-[#f6ede8] hover:bg-[#6b4e3d] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Updating...</span>
                </>
              ) : (
                'Update Employee'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
