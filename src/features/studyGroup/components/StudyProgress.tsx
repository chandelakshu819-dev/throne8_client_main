'use client';

import { deleteSessionThunk, getAllSessionsThunk } from "@/hooks/studyGroup/features/timer/timer.thunks";
import { selectTodayTotalMinutes, selectTodaySessions, selectAllTimerSessions, selectAllSessionsLoading } from "@/hooks/studyGroup/features/timer/timerSlice";
import { useAppSelector } from "@/store/hooks";
import { useAppDispatch } from "@/store/hooks";
import { TimerSessionResponse } from "@/lib/api/studyGroup.service";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import TimerStats from "./TimerStats";

interface StudyProgressProps {
  onViewSession?: (sessionId: string) => void;
}

// export default function StudyProgress() {
export default function StudyProgress({ onViewSession }: StudyProgressProps) {
  const [activeSession, setActiveSession] = useState<TimerSessionResponse | null>(null);
  const [modalRoot] = useState(() => {
    if (typeof document === 'undefined') return null;
    const el = document.createElement('div');
    el.setAttribute('id', 'study-progress-modal-root');
    return el;
  });

  const [todayLabel, setTodayLabel] = useState('');
  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
    );
  }, []);

  const dispatch = useAppDispatch();
  const totalStudyTime = useAppSelector(selectTodayTotalMinutes);
  const todaySessions = useAppSelector(selectTodaySessions);
  const allSessions = useAppSelector(selectAllTimerSessions);
  const allSessionsLoading = useAppSelector(selectAllSessionsLoading);
  const studySessions = todaySessions.map(s => ({
    subject: s.subject || 'Other',
    time: Math.round((s.duration ?? 0) / 60), // duration is in seconds
  }));

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Delete this session?')) return;
    await dispatch(deleteSessionThunk(sessionId));
    dispatch(getAllSessionsThunk({ limit: 10 }));
    setActiveSession(null);
  };

  const formatMinutes = (seconds?: number | null) => {
    if (seconds == null || seconds === 0) return '0 min';
    if (seconds < 60) return '< 1 min';
    return `${Math.round(seconds / 60)} min`;
  };

  const formatTime = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    dispatch(getAllSessionsThunk({ limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    if (!modalRoot) return;
    document.body.appendChild(modalRoot);
    return () => {
      document.body.removeChild(modalRoot);
    };
  }, [modalRoot]);



  return (
    <div className="w-full">
      <div className="rounded-2xl border border-[#e0d8cf] bg-white p-5 shadow-sm lg:sticky lg:top-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#4a3728]">Today&apos;s Progress</h2>
          {todayLabel && (
            <span className="rounded-full bg-[#f6ede8] px-2.5 py-1 text-xs font-medium text-[#6b5847]">
              {todayLabel}
            </span>
          )}
        </div>

        <TimerStats />

        {/* Subject Breakdown */}
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-[#4a3728]">Today by subject</h3>
          {studySessions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#d4c4b5] px-4 py-5 text-center text-sm text-[#6b5847]">
              Nothing logged today. Press Start to record your first session.
            </p>
          ) : (
            <div className="space-y-2">
              {studySessions.map((session, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl bg-[#faf6f1] p-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#4a3728] text-xs font-bold text-white">
                      {session.subject.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate text-sm font-semibold text-[#4a3728]">
                      {session.subject}
                    </span>
                  </div>
                  <span className="ml-3 flex-shrink-0 text-sm font-bold tabular-nums text-[#4a3728]">
                    {session.time} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-[#4a3728]">Recent sessions</h3>
            {allSessions.length > 0 && (
              <span className="text-xs text-[#6b5847]">Click one for details</span>
            )}
          </div>
          {allSessionsLoading ? (
            <p className="py-5 text-center text-sm text-[#6b5847]">Loading...</p>
          ) : allSessions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#d4c4b5] px-4 py-5 text-center text-sm text-[#6b5847]">
              No sessions yet.
            </p>
          ) : (
            <div className="recentsession space-y-2">
              {allSessions.map((session) => (
                <div
                  key={session.sessionId}
                  onClick={() => setActiveSession(session)}
                  className="group relative flex cursor-pointer items-center justify-between rounded-xl bg-[#faf6f1] p-2.5 transition-colors hover:bg-[#f3ebe1]"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // do not open the details modal
                      handleDelete(session.sessionId);
                    }}
                    className="absolute -right-1.5 -top-1.5 z-10 hidden h-5 w-5 items-center justify-center rounded-full bg-[#4a3728] text-[#f6ede8] transition-colors hover:bg-red-600 group-hover:flex"
                    title="Delete session"
                    aria-label="Delete session"
                  >
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#4a3728] text-xs font-bold text-white">
                      {(session.subject || 'NA').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#4a3728]">
                        {session.subject || 'Untitled session'}
                      </div>
                      <div className="text-xs text-[#6b5847]">
                        {formatMinutes(session.duration)} · {formatTime(session.startTime)}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`ml-2 flex-shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${
                      session.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : session.status === 'active'
                        ? 'bg-sky-100 text-sky-700'
                        : session.status === 'paused'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-[#e0d8cf]/60 text-[#4a3728]/70'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeSession && modalRoot && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#e0d8cf]/50 p-5">
              <div className="mb-4">
                <h3 className="text-lg sm:text-xl font-black text-[#4a3728]">Recent session</h3>
                <p className="text-xs text-[#4a3728]/60">Session details</p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-[#4a3728]">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold">Subject</span>
                  <span className="text-right">{activeSession.subject || 'No subject'}</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold">Status</span>
                  <span className="text-right uppercase">{activeSession.status}</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold">Start time</span>
                  <span className="text-right">{formatTime(activeSession.startTime)}</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold">End time</span>
                  <span className="text-right">{formatTime(activeSession.endTime)}</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold">Duration</span>
                  <span className="text-right">{formatMinutes(activeSession.duration)}</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold">Paused duration</span>
                  <span className="text-right">{formatMinutes(activeSession.totalPausedDuration)}</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold">Goal</span>
                  <span className="text-right">{activeSession.goal ?? 'No goal linked'}</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold">Notes</span>
                  <span className="text-right break-words w-2/3">{activeSession.notes || '—'}</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold">User</span>
                  <span className="text-right">{(activeSession as any).username ?? 'Unknown'}</span>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => handleDelete(activeSession.sessionId)}
                  className="px-4 py-2 bg-red-100/60 hover:bg-red-200/80 text-red-700 rounded-lg font-bold text-xs transition-all"
                >
                  Delete
                </button>
                <button
                  onClick={() => setActiveSession(null)}
                  className="px-4 py-2 bg-[#e0d8cf]/60 hover:bg-[#e0d8cf]/80 text-[#4a3728] rounded-lg font-bold text-xs transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          modalRoot
        )}

      </div>
    </div>
  );
}
//       </div>
//     </div>
//   );
// }