'use client';

import { memo, useCallback, useState } from 'react';
import { updateEmployee, toggleActive, type Employee } from '@/features/company/store/slices/employeesslice';
import UpdateEmployeeModal from '../../modal/UpdateEmployeeModal';
import DeleteConfirmationModal from '../../modal/DeleteConfirmationModal';
import CompanyService from '@/lib/api/company.service';
import { useAppDispatch } from '@/store/hooks';

interface Props {
  emp: Employee;
  companyId: string;
  advocacyOn: boolean;
  onToggleAdvocacy: (id: string, nextVal: boolean) => Promise<void> | void;
  onToggleActive?: (id: string) => Promise<void> | void;
  onRemove: (id: string) => void;
  onRefresh?: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export function EmployeeRowSkeleton() {
  return (
    <tr className="border-b border-[#e0d8cf]/50 animate-pulse">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e0d8cf] rounded-xl flex-shrink-0" />
          <div className="space-y-1.5 min-w-[140px]">
            <div className="h-3.5 w-28 bg-[#e0d8cf] rounded-full" />
            <div className="h-2.5 w-36 bg-[#e0d8cf]/70 rounded-full" />
            <div className="h-2 w-16 bg-[#e0d8cf]/50 rounded-full" />
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="h-3.5 w-24 bg-[#e0d8cf] rounded-full" />
      </td>
      <td className="px-5 py-4">
        <div className="h-3.5 w-28 bg-[#e0d8cf] rounded-full" />
      </td>
      <td className="px-5 py-4">
        <div className="h-3 w-20 bg-[#e0d8cf] rounded-full" />
      </td>
      <td className="px-5 py-4">
        <div className="h-6 w-20 bg-[#e0d8cf] rounded-full" />
      </td>
      <td className="px-5 py-4">
        <div className="h-6 w-16 bg-[#e0d8cf] rounded-full" />
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="w-8 h-8 bg-[#e0d8cf] rounded-lg" />
          <div className="w-8 h-8 bg-[#e0d8cf] rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

const EmployeeRow = memo(function EmployeeRow({
  emp,
  companyId,
  advocacyOn,
  onToggleAdvocacy,
  onToggleActive,
  onRemove,
  onRefresh,
  onNotify,
}: Props) {
  const dispatch = useAppDispatch();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [advocacyLoading, setAdvocacyLoading] = useState(false);

  // Status toggle handler
  const handleToggleStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      if (onToggleActive) {
        await onToggleActive(emp.id);
      } else {
        await CompanyService.toggleEmployeeStatus(emp.id);
        dispatch(toggleActive(emp.id));
      }
      onNotify?.(`Status updated to ${!emp.active ? 'Active' : 'Inactive'} for ${emp.name}`, 'success');
    } catch (err: any) {
      console.error('❌ Status toggle error:', err);
      onNotify?.(err.message || 'Failed to update employee status', 'error');
    } finally {
      setStatusLoading(false);
    }
  }, [emp.id, emp.name, emp.active, onToggleActive, dispatch, onNotify]);

  // Advocacy toggle handler
  const handleToggleAdvocate = useCallback(async () => {
    if (!emp.active) {
      onNotify?.('Cannot enable advocacy for an inactive employee', 'error');
      return;
    }
    setAdvocacyLoading(true);
    try {
      const nextVal = !advocacyOn;
      await onToggleAdvocacy(emp.id, nextVal);
      onNotify?.(
        `Advocacy ${nextVal ? 'enabled' : 'disabled'} for ${emp.name}`,
        'success'
      );
    } catch (err: any) {
      console.error('❌ Advocacy toggle error:', err);
      onNotify?.(err.message || 'Failed to update advocacy status', 'error');
    } finally {
      setAdvocacyLoading(false);
    }
  }, [emp.id, emp.name, emp.active, advocacyOn, onToggleAdvocacy, onNotify]);

  // Delete handler
  const handleConfirmDelete = useCallback(async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await CompanyService.deleteEmployee(emp.id);
      setShowDeleteConfirm(false);
      onRemove(emp.id);
      onNotify?.(`${emp.name} deleted successfully`, 'success');
      onRefresh?.();
    } catch (err: any) {
      console.error('❌ Delete failed:', err);
      setDeleteError(err.message || 'Failed to delete employee. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  }, [emp.id, emp.name, onRemove, onNotify, onRefresh]);

  // Update success handler
  const handleUpdateSuccess = useCallback((updatedEmployee: any) => {
    dispatch(
      updateEmployee({
        id: updatedEmployee.id || emp.id,
        changes: updatedEmployee,
      })
    );
    setShowUpdateModal(false);
    onNotify?.(`${updatedEmployee.name || emp.name} updated successfully`, 'success');
    onRefresh?.();
  }, [dispatch, emp.id, emp.name, onNotify, onRefresh]);

  // Avatar monogram
  const initials = emp.avatar || (
    emp.name
      ? emp.name
          .split(' ')
          .filter(Boolean)
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : 'EM'
  );

  return (
    <>
      <tr className="border-b border-[#e0d8cf]/50 hover:bg-[#e0d8cf]/20 transition-colors group">
        {/* Employee Info Column */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            {emp.profileImage ? (
              <img
                src={emp.profileImage}
                alt={emp.name}
                className="w-10 h-10 rounded-xl object-cover border border-[#e0d8cf] flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-[#4a3728] text-[#f6ede8] rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#4a3728] truncate">{emp.name}</p>
                {emp.id && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e0d8cf]/60 text-[#4a3728]/70 font-mono" title={`ID: ${emp.id}`}>
                    {emp.id.slice(0, 8)}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#4a3728]/60 truncate">{emp.email || '—'}</p>
            </div>
          </div>
        </td>

        {/* Department Column */}
        <td className="px-5 py-4">
          <span className="text-sm font-medium text-[#4a3728]/80">
            {emp.dept || '—'}
          </span>
        </td>

        {/* Designation / Role Column */}
        <td className="px-5 py-4">
          <span className="text-sm text-[#4a3728]">
            {emp.title || '—'}
          </span>
        </td>

        {/* Joining Date Column */}
        <td className="px-5 py-4 text-xs text-[#4a3728]/60 whitespace-nowrap">
          {emp.joined || '—'}
        </td>

        {/* Advocacy Column */}
        <td className="px-5 py-4">
          <button
            type="button"
            onClick={handleToggleAdvocate}
            disabled={advocacyLoading || !emp.active}
            title={!emp.active ? 'Cannot advocate inactive employee' : 'Click to toggle advocacy'}
            aria-label={`Advocacy for ${emp.name}, currently ${advocacyOn ? 'On' : 'Off'}`}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed ${
              advocacyOn
                ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
                : 'bg-[#e0d8cf]/40 text-[#4a3728]/60 border-transparent hover:bg-[#e0d8cf]'
            }`}
          >
            {advocacyLoading ? (
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping mr-0.5" />
            ) : (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  advocacyOn ? 'bg-purple-600' : 'bg-gray-400'
                }`}
              />
            )}
            <span>{advocacyOn ? 'Advocacy On' : 'Advocacy Off'}</span>
          </button>
        </td>

        {/* Status Column */}
        <td className="px-5 py-4">
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={statusLoading}
            title="Click to toggle active status"
            aria-label={`Status for ${emp.name}, currently ${emp.active ? 'Active' : 'Inactive'}`}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all duration-200 border disabled:opacity-50 ${
              emp.active
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                : 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200'
            }`}
          >
            {statusLoading ? (
              <span className="w-2 h-2 rounded-full bg-current animate-ping mr-0.5" />
            ) : (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  emp.active ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
            )}
            <span>{emp.active ? 'Active' : 'Inactive'}</span>
          </button>
        </td>

        {/* Actions Column */}
        <td className="px-5 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowUpdateModal(true)}
              aria-label={`Edit ${emp.name}`}
              title="Edit employee"
              className="p-1.5 bg-[#e0d8cf]/70 rounded-lg text-[#4a3728] hover:bg-[#4a3728] hover:text-[#f6ede8] transition-colors duration-200 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label={`Delete ${emp.name}`}
              title="Delete employee"
              className="p-1.5 bg-[#e0d8cf]/70 rounded-lg text-[#4a3728] hover:bg-red-600 hover:text-white transition-colors duration-200 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {/* Edit Modal */}
      {showUpdateModal && (
        <UpdateEmployeeModal
          employee={emp}
          companyId={companyId}
          onSuccess={handleUpdateSuccess}
          onClose={() => setShowUpdateModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmationModal
          employeeName={emp.name}
          loading={deleteLoading}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setDeleteError(null);
          }}
        />
      )}
    </>
  );
});

export default EmployeeRow;