import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Users, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { getPriceLabel } from './ServicesPage';

interface GroupSessionCardProps {
  group: any;
  idx?: number;
  onEdit?: (group: any) => void;
  onDelete?: (group: any) => void;
  onMenteeStatus?: (group: any) => void;
}

export function GroupSessionCard({ group, idx = 0, onEdit, onDelete, onMenteeStatus }: GroupSessionCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnchorRect, setMenuAnchorRect] = useState<{ top: number; left: number } | null>(null);

  const bookings = group.bookings ?? [];
  const pending = bookings.filter((b: any) => b.status === 'pending').length;
  const confirmed = bookings.filter((b: any) => b.status === 'confirmed').length;
  const completed = bookings.filter((b: any) => b.status === 'completed').length;

  return (
    <div
      className="bg-white rounded-[20px] border flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={{ borderColor: '#e0d8cf', boxShadow: '0 4px 20px -4px rgba(74, 55, 40, 0.08)' }}
    >
      {/* Thumbnail */}
      <div
        className="w-full h-32 flex items-center justify-center relative"
        style={{ backgroundColor: '#f3ece4' }}
      >
        {group.thumbnailImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.thumbnailImage}
            alt={group.title || "Group Session"}
            className="w-full h-full object-cover"
          />
        ) : (
          <Users className="w-8 h-8" style={{ color: '#8a7a6a' }} />
        )}
        <span
          className="absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
          style={{ backgroundColor: '#fff' }}
        >
          <Users className="w-4 h-4" style={{ color: '#15803d' }} />
        </span>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex-1">
          <div className="flex items-start justify-end mb-4">
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {pending > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                {pending} pending
              </span>
            )}
            {confirmed > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                {confirmed} confirmed
              </span>
            )}
            {completed > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                {completed} done
              </span>
            )}

            {onEdit && onDelete && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setMenuAnchorRect({ top: rect.bottom + 4, left: rect.right - 128 });
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#f3ece4] transition-colors"
                >
                  <MoreVertical className="w-4 h-4" style={{ color: '#8a7a6a' }} />
                </button>
                {isMenuOpen && typeof document !== "undefined" && createPortal(
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsMenuOpen(false)} />
                    <div
                      className="fixed z-[101] w-32 rounded-lg shadow-lg overflow-hidden"
                      style={{
                        top: menuAnchorRect?.top ?? 0,
                        left: menuAnchorRect?.left ?? 0,
                        border: '1px solid #e0d8cf',
                        backgroundColor: '#fff',
                      }}
                    >
                      <button
                        onClick={() => { setIsMenuOpen(false); onEdit(group); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#f3ece4] transition-colors"
                        style={{ color: '#4a3728' }}
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => { setIsMenuOpen(false); onDelete(group); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#fee2e2] transition-colors"
                        style={{ color: '#dc2626' }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </>,
                  document.body
                )}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-base font-bold mb-1.5 line-clamp-1" style={{ color: '#4a3728' }}>
          {group.title || "Group Session"}
        </h3>

        <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold mb-3"
          style={{ backgroundColor: '#15803d1A', color: '#15803d' }}>
          Group Session
        </span>

        <p className="mb-4 text-sm line-clamp-2" style={{ color: '#8a7a6a' }}>
          {group.description || "Interactive group session led by an expert mentor."}
        </p>

        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" style={{ color: '#8a7a6a' }} />
            <span className="text-xs" style={{ color: '#8a7a6a' }}>
              {group.duration || 0} Minutes
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" style={{ color: '#8a7a6a' }} />
            <span className="text-xs" style={{ color: '#8a7a6a' }}>
              {group.currentParticipants ?? 0} / {group.maxParticipants ?? 0} Enrolled
            </span>
          </div>
        </div>
        </div>

        <div className="flex justify-between items-center gap-3 pt-5 mt-auto" style={{ borderTop: '1px solid #f0ebe4' }}>
          <span className="text-lg font-bold whitespace-nowrap" style={{ color: '#7a5c3e' }}>
            {getPriceLabel(group.pricing?.pricePerPerson || group.pricePerPerson, 'group_session')}
          </span>
          {onMenteeStatus && (
            <div className="flex gap-2">
              <button
                onClick={() => onMenteeStatus(group)}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors hover:opacity-90 whitespace-nowrap"
                style={{ backgroundColor: '#4a3728' }}
              >
                Mentee Status
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
