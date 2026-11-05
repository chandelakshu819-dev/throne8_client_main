'use client';

import { deleteSessionThunk, getAllSessionsThunk } from "@/hooks/studyGroup/features/timer/timer.thunks";
import { selectTodayTotalMinutes, selectTodaySessions, selectAllTimerSessions, selectAllSessionsLoading } from "@/hooks/studyGroup/features/timer/timerSlice";
import { useAppSelector } from "@/store/hooks";
import { useAppDispatch } from "@/store/hooks";
import { TimerSessionResponse } from "@/lib/api/studyGroup.service";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
    if (seconds == null) return '0 min';
    const mins = Math.round(seconds / 60);
    return `${mins} min`;
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
    <div className="w-full lg:w-97">
      <div className="bg-[#f6ede8]/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl border border-[#e0d8cf]/50 lg:sticky lg:top-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-black text-[#4a3728]">Today&apos;s Progress</h2>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4a3728]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
        </div>

        {/* Total Study Time Today */}
        <div className="bg-gradient-to-r from-[#e0d8cf]/40 to-[#e0d8cf]/20 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-[#e0d8cf]/50">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-black text-[#4a3728] mb-1">
              {totalStudyTime} min
            </div>
            <div className="text-xs font-bold text-[#4a3728]/60 uppercase tracking-wider">
              Total Study Time
            </div>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          <h3 className="text-xs sm:text-sm font-bold text-[#4a3728] uppercase tracking-wider mb-2 sm:mb-3">
            Subject Breakdown
          </h3>
          {studySessions.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-[#4a3728]/40 text-xs sm:text-sm font-semibold">
              No study sessions yet. Start a timer!
            </div>
          ) : (
            studySessions.map((session, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-[#e0d8cf]/40 to-[#e0d8cf]/20 rounded-lg p-2.5 sm:p-3 border border-[#e0d8cf]/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#4a3728] to-[#6b4e3d] rounded-lg flex items-center justify-center text-[#f6ede8] font-black text-[10px] sm:text-xs">
                    {session.subject.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#4a3728]">
                      {session.subject}
                    </div>
                    <div className="text-[10px] sm:text-xs text-[#4a3728]/60 font-semibold">
                      {session.time} minutes
                    </div>
                  </div>
                </div>
                <div className="text-base sm:text-lg font-black text-[#4a3728]">
                  {session.time}m
                </div>
              </div>
            ))
          )}
        </div>


        {/* Recent Sessions */}
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#4a3728] uppercase tracking-wider mb-2 sm:mb-3">
            Recent Sessions
          </h3>
          {allSessionsLoading ? (
            <div className="text-center py-6 sm:py-8 text-[#4a3728]/40 text-xs sm:text-sm font-semibold">
              Loading...
            </div>
          ) : allSessions.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-[#4a3728]/40 text-xs sm:text-sm font-semibold">
              No sessions found.
            </div>
          ) : (
            <div
              className="recentsession space-y-2 sm:space-y-3">
              {allSessions.map((session) => (
                <div
                  key={session.sessionId}
                  onClick={() => setActiveSession(session)}
                  className="bg-gradient-to-r from-[#e0d8cf]/40 to-[#e0d8cf]/20 rounded-lg p-2.5 sm:p-3 border border-[#e0d8cf]/50 flex items-center justify-between cursor-pointer hover:shadow-sm transition-shadow"
                >
                  {/* ADD: hover cross button — top right corner */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // card click se modal na khule
                      handleDelete(session.sessionId);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#4a3728] text-[#f6ede8] items-center justify-center hidden group-hover:flex transition-all z-10 hover:bg-red-600"
                    title="Delete session"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {/* Left: Icon box + name + duration */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#4a3728] to-[#6b4e3d] rounded-lg flex items-center justify-center text-[#f6ede8] font-black text-[10px] sm:text-xs shrink-0">
                      {(session.subject || 'NA').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-[#4a3728] truncate">
                        {session.subject || 'No subject'}
                      </div>
                      <div className="text-[10px] sm:text-xs text-[#4a3728]/60 font-semibold">
                        {formatMinutes(session.duration)} · {formatTime(session.startTime)} 
                        {/* — {formatTime(session.endTime)} */}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${session.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : session.status === 'active'
                        ? 'bg-blue-100 text-blue-700'
                        : session.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-[#e0d8cf]/60 text-[#4a3728]/60'
                      }`}>
                      {session.status}
                    </span>
                  </div>

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