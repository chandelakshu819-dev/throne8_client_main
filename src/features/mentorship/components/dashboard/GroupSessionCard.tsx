// src/features/mentorship/components/dashboard/GroupSessionCard.tsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, MoreVertical, Pencil, Trash2, Users } from 'lucide-react';
import { getPriceLabel, getServiceIcon, getServiceAccent } from './ServicesPage';
import ServiceThumbnail, { getServiceImage } from '@/features/mentorship/components/shared/ServiceThumbnail';

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

  const Icon = getServiceIcon('group_session');
  const accent = getServiceAccent('group_session');

  const bookings = group.bookings ?? [];
  const pending = bookings.filter((b: any) => b.status === 'pending').length;
  const confirmed = bookings.filter((b: any) => b.status === 'confirmed').length;
  const completed = bookings.filter((b: any) => b.status === 'completed').length;

  const statusChips = [
    { count: pending, label: 'pending', bg: '#fef3c7', color: '#b45309' },
    { count: confirmed, label: 'confirmed', bg: '#dcfce7', color: '#15803d' },
    { count: completed, label: 'done', bg: '#dbeafe', color: '#1d4ed8' },
  ].filter(c => c.count > 0);

  const enrolled = group.currentParticipants ?? 0;
  const capacity = group.maxParticipants ?? 0;
  const fillPercent = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;

  return (
    <div
      className="group bg-white rounded-[20px] border flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl motion-safe:hover:-translate-y-1"
      style={{ borderColor: '#e0d8cf', boxShadow: '0 4px 20px -4px rgba(74, 55, 40, 0.08)' }}
    >
      {/* Thumbnail with overlays: type pill (left), menu (right), status chips (bottom) */}
      <div className="w-full aspect-video relative overflow-hidden" style={{ backgroundColor: '#f3ece4' }}>
        <ServiceThumbnail
          src={getServiceImage({ ...group, name: group.title })}
          alt={group.title || 'Group Session'}
          label="Group Session"
          type="group_session"
        />

        {/* Soft gradient so overlays stay readable on any image */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/25 via-transparent to-black/35" />

        <span
          className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm bg-white/95 backdrop-blur"
          style={{ color: accent }}
        >
          <Icon className="w-3.5 h-3.5" />
          Group Session
        </span>

        {onEdit && onDelete && (
          <div className="absolute top-3 right-3 z-10">
            <button
              aria-label="Group session options"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setMenuAnchorRect({ top: rect.bottom + 6, left: rect.right - 128 });
                setIsMenuOpen(!isMenuOpen);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/95 backdrop-blur shadow-sm hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/60"
            >
              <MoreVertical className="w-4 h-4" style={{ color: '#4a3728' }} />
            </button>
            {isMenuOpen && typeof document !== "undefined" && createPortal(
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setIsMenuOpen(false)} />
                <div
                  role="menu"
                  className="fixed z-[101] w-32 rounded-xl shadow-lg overflow-hidden"
                  style={{
                    top: menuAnchorRect?.top ?? 0,
                    left: menuAnchorRect?.left ?? 0,
                    border: '1px solid #e0d8cf',
                    backgroundColor: '#fff',
                  }}
                >
                  <button
                    role="menuitem"
                    onClick={() => { setIsMenuOpen(false); onEdit(group); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium hover:bg-[#f3ece4] transition-colors"
                    style={{ color: '#4a3728' }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setIsMenuOpen(false); onDelete(group); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium hover:bg-[#fee2e2] transition-colors"
                    style={{ color: '#dc2626' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </>,
              document.body
            )}
          </div>
        )}

        {statusChips.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-1.5 flex-wrap">
            {statusChips.map(c => (
              <span
                key={c.label}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm"
                style={{ backgroundColor: c.bg, color: c.color }}
              >
                {c.count} {c.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-bold leading-snug line-clamp-1" style={{ color: '#4a3728' }} title={group.title}>
          {group.title || "Group Session"}
        </h3>

        <p
          className="mt-1.5 text-sm leading-relaxed line-clamp-2"
          style={{ color: '#8a7a6a', overflowWrap: 'break-word', wordBreak: 'break-word', minHeight: '2.75rem' }}
        >
          {group.description || "Interactive group session led by an expert mentor."}
        </p>

        {/* Duration chip + enrollment progress */}
        <div className="mt-4 space-y-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{ backgroundColor: '#f3ece4', color: '#5c4a3a' }}
          >
            <Clock className="w-3.5 h-3.5" style={{ color: '#8a7a6a' }} />
            {group.duration || 0} min
          </span>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: '#8a7a6a' }}>
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Enrolled
              </span>
              <span className="font-semibold" style={{ color: '#4a3728' }}>
                {enrolled} / {capacity}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: '#f3ece4' }}
              role="progressbar"
              aria-valuenow={enrolled}
              aria-valuemin={0}
              aria-valuemax={capacity}
              aria-label="Enrolled participants"
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${fillPercent}%`, backgroundColor: accent }}
              />
            </div>
          </div>
        </div>

        {/* Footer: price + action */}
        <div className="flex justify-between items-center gap-3 pt-4 mt-5" style={{ borderTop: '1px solid #f0ebe4' }}>
          <span className="text-xl font-extrabold whitespace-nowrap" style={{ color: '#4a3728' }}>
            {getPriceLabel(group.pricing?.pricePerPerson || group.pricePerPerson, 'group_session')}
          </span>
          {onMenteeStatus && (
            <button
              onClick={() => onMenteeStatus(group)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e]/60 focus-visible:ring-offset-2"
              style={{ backgroundColor: '#4a3728' }}
            >
              <Users className="w-4 h-4" />
              Mentee Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
}