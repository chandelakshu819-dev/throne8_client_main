'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { useAppSelector } from '@/core/store/store.hooks';
import EmployeeRow, { EmployeeRowSkeleton } from '@/features/company/components/employees/EmployeeRow';
import {
  addEmployee,
  removeEmployee,
  toggleAdvocacy,
  toggleActive,
  setEmployees,
  type Employee,
} from '@/features/company/store/slices/employeesslice';
import CompanyService from '@/lib/api/company.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/profile/hooks/useProfile';
import AddEmployeeModal from '@/features/company/modal/AddEmployeeModal';

// Convert backend employee object into frontend Employee shape
const mapApiEmployeeToStore = (e: any): Employee => {
  const firstName = e.firstName || '';
  const lastName = e.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || e.fullName || 'Unnamed Employee';
  const employeeId = e.employeeId || e.id || (e._id ? e._id.toString() : '');

  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : fullName
        .split(' ')
        .filter(Boolean)
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'EM';

  return {
    id: employeeId,
    _id: e._id ? e._id.toString() : undefined,
    name: fullName,
    firstName,
    lastName,
    email: e.email || '',
    title: e.designation || '',
    dept: e.department || '',
    role: 'member' as const,
    avatar: initials,
    profileImage: e.profileImage || undefined,
    phone: e.phone || '',
    bio: e.bio || '',
    skills: Array.isArray(e.skills) ? e.skills : [],
    advocacy: e.isAdvocate === true,
    isAdvocate: e.isAdvocate === true,
    advocacyScore: e.advocacyScore || 0,
    active: e.isActive === true,
    joined: e.joinDate
      ? new Date(e.joinDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '',
    joinDateRaw: e.joinDate || undefined,
  };
};

export default function EmployeesPage() {
  const dispatch = useAppDispatch();
  const employees = useAppSelector(s => s.employees?.items ?? []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [advocacyFilter, setAdvocacyFilter] = useState<'all' | 'advocates' | 'non-advocates'>('all');

  // Feedback Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Company ID from profile
  const { user } = useAuth();
  const { userProfileData, loadProfile } = useProfile();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const companyId = userProfileData?.companyId ?? null;

  // Real data fetching function
  const loadEmployees = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    setFetchError(null);
    try {
      const empResult = await CompanyService.getAllEmployees(companyId, { pageSize: 100 });
      const apiEmployees =
        empResult?.data?.result ??
        empResult?.data?.employees ??
        empResult?.data ??
        [];

      const employeesList = Array.isArray(apiEmployees) ? apiEmployees : [];
      const mapped = employeesList.map(mapApiEmployeeToStore);
      dispatch(setEmployees(mapped));
    } catch (err: any) {
      console.error('❌ Failed to fetch employees:', err);
      setFetchError(err.message || 'Failed to load company employees');
    } finally {
      setLoading(false);
    }
  }, [companyId, dispatch]);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    loadEmployees();
  }, [companyId, loadEmployees]);

  // Dynamic Statistics strictly calculated from real database records
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.active).length;
    const advocacyOn = employees.filter(e => e.isAdvocate).length;
    const validDepts = employees
      .map(e => e.dept?.trim())
      .filter((d): d is string => Boolean(d));
    const departments = new Set(validDepts).size;

    return { total, active, advocacyOn, departments };
  }, [employees]);

  // Unique departments for filter dropdown
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => {
      const d = e.dept?.trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Search and filtered employee list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Status filter
      if (statusFilter === 'active' && !emp.active) return false;
      if (statusFilter === 'inactive' && emp.active) return false;

      // Department filter
      if (deptFilter !== 'all' && emp.dept?.trim().toLowerCase() !== deptFilter.toLowerCase()) {
        return false;
      }

      // Advocacy filter
      if (advocacyFilter === 'advocates' && !emp.isAdvocate) return false;
      if (advocacyFilter === 'non-advocates' && emp.isAdvocate) return false;

      // Search query across name, email, department, designation/role, and employee ID
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = emp.name.toLowerCase().includes(query);
        const matchesEmail = emp.email.toLowerCase().includes(query);
        const matchesDept = emp.dept.toLowerCase().includes(query);
        const matchesTitle = emp.title.toLowerCase().includes(query);
        const matchesId = emp.id.toLowerCase().includes(query);

        if (!matchesName && !matchesEmail && !matchesDept && !matchesTitle && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [employees, statusFilter, deptFilter, advocacyFilter, searchTerm]);

  // Add Employee Handler
  const handleEmployeeAdded = useCallback((apiEmployee: any) => {
    const newEmp = mapApiEmployeeToStore(apiEmployee);
    dispatch(addEmployee(newEmp));
    setShowAddModal(false);
    showToast(`${newEmp.name} added to the team successfully!`, 'success');
    loadEmployees();
  }, [dispatch, loadEmployees, showToast]);

  // Toggle advocacy handler
  const handleToggleAdvocacy = useCallback(async (id: string, nextVal: boolean) => {
    if (!companyId) return;
    await CompanyService.toggleEmployeeAdvocacy(companyId, id, nextVal);
    dispatch(toggleAdvocacy(id));
  }, [companyId, dispatch]);

  // Toggle active status handler
  const handleToggleActive = useCallback(async (id: string) => {
    await CompanyService.toggleEmployeeStatus(id);
    dispatch(toggleActive(id));
  }, [dispatch]);

  // Remove employee handler
  const handleRemove = useCallback((id: string) => {
    dispatch(removeEmployee(id));
  }, [dispatch]);

  const STAT_ITEMS = [
    { label: 'Total Employees', value: stats.total },
    { label: 'Active Employees', value: stats.active },
    { label: 'Advocacy On', value: stats.advocacyOn },
    { label: 'Departments', value: stats.departments },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Toast Alert */}
        {toast && (
          <div
            className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between shadow-md transition-all animate-fadeIn ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' ? (
                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-current opacity-60 hover:opacity-100 p-1"
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#4a3728]">Employees</h1>
            <p className="text-sm text-[#4a3728]/60 mt-0.5">
              {loading ? 'Loading team members...' : `${employees.length} team members`}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadEmployees}
              disabled={loading}
              title="Refresh employees list"
              aria-label="Refresh employees list"
              className="p-2.5 text-[#4a3728] bg-[#f6ede8] hover:bg-[#e0d8cf] border border-[#e0d8cf] rounded-xl transition-colors disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#4a3728] text-[#f6ede8] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#6b4e3d] transition-all shadow-md active:scale-95 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STAT_ITEMS.map(s => (
            <div
              key={s.label}
              className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-xl p-4 text-center shadow-sm transition-all"
            >
              <p className="text-2xl font-bold text-[#4a3728]">
                {loading ? '—' : s.value}
              </p>
              <p className="text-xs text-[#4a3728]/60 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-[#f6ede8]/60 border border-[#e0d8cf] rounded-2xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4a3728]/40">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, department, role, or ID..."
                className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-[#e0d8cf] rounded-xl text-[#4a3728] placeholder:text-[#4a3728]/40 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 focus:border-[#4a3728] transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#4a3728]/40 hover:text-[#4a3728]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Segment */}
              <div className="inline-flex rounded-xl border border-[#e0d8cf] bg-white p-0.5">
                {(['all', 'active', 'inactive'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                      statusFilter === st
                        ? 'bg-[#4a3728] text-[#f6ede8] shadow-sm'
                        : 'text-[#4a3728]/70 hover:text-[#4a3728] hover:bg-[#e0d8cf]/30'
                    }`}
                  >
                    {st === 'all' ? 'All' : st}
                  </button>
                ))}
              </div>

              {/* Department Dropdown */}
              {uniqueDepartments.length > 0 && (
                <select
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-[#e0d8cf] text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
                >
                  <option value="all">All Departments</option>
                  {uniqueDepartments.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              {/* Advocacy Segment */}
              <select
                value={advocacyFilter}
                onChange={e => setAdvocacyFilter(e.target.value as any)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-[#e0d8cf] text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
              >
                <option value="all">All Advocacy</option>
                <option value="advocates">Advocates Only</option>
                <option value="non-advocates">Non-Advocates</option>
              </select>

              {/* Reset Filters button if any active */}
              {(searchTerm || statusFilter !== 'all' || deptFilter !== 'all' || advocacyFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDeptFilter('all');
                    setAdvocacyFilter('all');
                  }}
                  className="px-2.5 py-2 text-xs text-[#4a3728]/60 hover:text-red-600 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {fetchError && (
          <div className="bg-red-50/90 border border-red-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-red-900 mb-1">Failed to load employees</h3>
            <p className="text-xs text-red-700/80 max-w-md mb-4">{fetchError}</p>
            <button
              type="button"
              onClick={loadEmployees}
              className="px-4 py-2 bg-[#4a3728] text-[#f6ede8] text-xs font-semibold rounded-xl hover:bg-[#6b4e3d] transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State — strictly when database has 0 employees */}
        {!loading && !fetchError && employees.length === 0 && (
          <div className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#e0d8cf]/50 text-[#4a3728] flex items-center justify-center mb-4 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#4a3728] mb-1">No employees yet</h3>
            <p className="text-sm text-[#4a3728]/60 max-w-sm mb-6">
              Add your first employee to start building your company team.
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#4a3728] text-[#f6ede8] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#6b4e3d] transition-all shadow-md active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Add Employee</span>
            </button>
          </div>
        )}

        {/* Filter Zero Results State (when employees exist, but search filters them out) */}
        {!loading && !fetchError && employees.length > 0 && filteredEmployees.length === 0 && (
          <div className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-2xl p-10 text-center flex flex-col items-center justify-center">
            <p className="text-sm font-semibold text-[#4a3728] mb-1">No employees match your search criteria</p>
            <p className="text-xs text-[#4a3728]/60 mb-4">Try clearing filters or searching with a different term.</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDeptFilter('all');
                setAdvocacyFilter('all');
              }}
              className="px-3.5 py-2 bg-[#4a3728] text-[#f6ede8] text-xs font-semibold rounded-xl hover:bg-[#6b4e3d] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Real Employee Table (Visible when loading or when matching rows exist) */}
        {(loading || filteredEmployees.length > 0) && (
          <div className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#e0d8cf] bg-[#e0d8cf]/30">
                    <th className="text-left text-xs font-bold text-[#4a3728]/70 px-5 py-3.5">Employee</th>
                    <th className="text-left text-xs font-bold text-[#4a3728]/70 px-5 py-3.5">Department</th>
                    <th className="text-left text-xs font-bold text-[#4a3728]/70 px-5 py-3.5">Designation</th>
                    <th className="text-left text-xs font-bold text-[#4a3728]/70 px-5 py-3.5">Joined</th>
                    <th className="text-left text-xs font-bold text-[#4a3728]/70 px-5 py-3.5">Advocacy</th>
                    <th className="text-left text-xs font-bold text-[#4a3728]/70 px-5 py-3.5">Status</th>
                    <th className="text-right text-xs font-bold text-[#4a3728]/70 px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <EmployeeRowSkeleton key={i} />
                      ))
                    : filteredEmployees.map(emp => (
                        <EmployeeRow
                          key={emp.id}
                          emp={emp}
                          companyId={companyId ?? ''}
                          advocacyOn={emp.isAdvocate}
                          onToggleAdvocacy={handleToggleAdvocacy}
                          onToggleActive={handleToggleActive}
                          onRemove={handleRemove}
                          onRefresh={loadEmployees}
                          onNotify={showToast}
                        />
                      ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer with real count */}
            {!loading && (
              <div className="px-5 py-3 border-t border-[#e0d8cf] bg-[#e0d8cf]/20 flex items-center justify-between text-xs text-[#4a3728]/60">
                <span>
                  Showing {filteredEmployees.length} of {employees.length} employees
                </span>
                {searchTerm && (
                  <span className="font-medium">Filtered by: "{searchTerm}"</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal
          companyId={companyId ?? ''}
          onSuccess={handleEmployeeAdded}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}