'use client';

// src/features/mentorship/components/call/MentorSessionPanels.tsx
// Side-panel content for the live call page: Upcoming / Queries / History.
// (Moved out of app/mentorship/mentor-session/page.tsx so the call page stays clean.)

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import SessionService from '@/lib/api/session.service';
import QueryService, { QueryItem } from '@/lib/api/query.service';

type PanelTab = 'upcoming' | 'queries' | 'history';

interface SessionListItem {
  _id?: string;
  sessionId?: string;
  title?: string;
  scheduledAt?: string;
  duration?: number;
}

const P = {
  text: '#f3ece4',
  muted: 'rgba(243,236,228,0.62)',
  card: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.09)',
  accent: '#c9a87c',
  danger: '#f0a08c',
} as const;

function PanelState({
  loading,
  error,
  empty,
  emptyText,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyText: string;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm" style={{ color: P.muted }}>
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-8 text-sm" style={{ color: P.danger }}>
        <p>{error}</p>
        <button onClick={onRetry} className="mt-3 inline-flex items-center gap-1.5 underline">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }
  if (empty) {
    return (
      <p className="py-8 text-sm" style={{ color: P.muted }}>
        {emptyText}
      </p>
    );
  }
  return null;
}

function SessionList({ role, past }: { role: 'mentor' | 'mentee'; past: boolean }) {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = past
        ? await SessionService.getPastSessions({ role })
        : await SessionService.getUpcomingSessions({ role });
      setSessions(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  }, [past, role]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PanelState
        loading={loading}
        error={error}
        empty={!loading && !error && sessions.length === 0}
        emptyText={past ? 'No completed sessions yet.' : 'No upcoming sessions.'}
        onRetry={() => void load()}
      />
      {!loading && !error && sessions.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {sessions.map((s, i) => (
            <article
              key={s._id || s.sessionId || `${s.scheduledAt || 'session'}-${i}`}
              className="rounded-xl p-3.5"
              style={{ background: P.card, border: `1px solid ${P.border}` }}
            >
              {s.title && (
                <div className="text-sm font-semibold" style={{ color: P.text }}>
                  {s.title}
                </div>
              )}
              {s.scheduledAt && (
                <time className="mt-1 block text-xs" style={{ color: P.muted }} dateTime={s.scheduledAt}>
                  {new Date(s.scheduledAt).toLocaleString()}
                </time>
              )}
              {typeof s.duration === 'number' && (
                <div className="mt-0.5 text-xs" style={{ color: P.muted }}>
                  {s.duration} min
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function QueryList() {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await QueryService.getPendingQueries();
      setQueries(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load queries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PanelState
        loading={loading}
        error={error}
        empty={!loading && !error && queries.length === 0}
        emptyText="No pending queries."
        onRetry={() => void load()}
      />
      {!loading && !error && queries.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {queries.map((q) => (
            <article
              key={q.queryId}
              className="rounded-xl p-3.5"
              style={{ background: P.card, border: `1px solid ${P.border}` }}
            >
              {q.category && (
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: P.accent }}>
                  {q.category}
                </div>
              )}
              <p className="text-sm leading-relaxed" style={{ color: P.text }}>
                {q.question}
              </p>
              {q.createdAt && (
                <time className="mt-2 block text-xs" style={{ color: P.muted }} dateTime={q.createdAt}>
                  {new Date(q.createdAt).toLocaleString()}
                </time>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MentorSessionPanels({ role }: { role: 'mentor' | 'mentee' }) {
  const [tab, setTab] = useState<PanelTab>('upcoming');
  const tabs: { id: PanelTab; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'queries', label: 'Queries' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 rounded-xl p-1" style={{ background: P.card }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              background: tab === t.id ? P.accent : 'transparent',
              color: tab === t.id ? '#241c15' : P.muted,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {tab === 'upcoming' && <SessionList role={role} past={false} />}
        {tab === 'queries' && <QueryList />}
        {tab === 'history' && <SessionList role={role} past />}
      </div>
    </div>
  );
}