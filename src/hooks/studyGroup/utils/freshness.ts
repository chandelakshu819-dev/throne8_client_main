// src/hooks/studyGroup/utils/freshness.ts
//
// Skips a thunk's network request when the same data was fetched successfully
// a moment ago, so switching between study sections does not re-download it.
//
// - Non-forced calls are skipped when a request is already running or the last
//   successful one is younger than `ttlMs`.
// - Pass `{ force: true }` after anything that changes the data (stop timer,
//   check-in, join/leave group) to always refetch.
// - Entries are keyed by the logged-in user, so another account never reuses them.
// - `hasData` makes the guard refetch when the store was cleared (empty data).

export type FreshnessArg = { force?: boolean } | void | undefined;

const DEFAULT_TTL_MS = 45_000;

const lastOk = new Map<string, number>();
const running = new Map<string, number>();

// `login` is the auth slice key in core/store/store.ts
const userIdOf = (state: any): string => {
  const u = state?.login?.user;
  return String(u?.userId ?? u?.id ?? "anon");
};

export function createFreshnessGuard(
  key: string,
  options: { ttlMs?: number; hasData?: (state: any) => boolean } = {}
) {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const slot = (state: any) => `${key}:${userIdOf(state)}`;

  /** Pass as the `condition` option of createAsyncThunk. */
  const condition = (arg: FreshnessArg, { getState }: { getState: () => unknown }) => {
    if (arg && arg.force) return true;
    const state = getState();
    const id = slot(state);
    if ((running.get(id) ?? 0) > 0) return false;
    if (options.hasData && !options.hasData(state)) return true;
    const at = lastOk.get(id);
    return !(at !== undefined && Date.now() - at < ttlMs);
  };

  /** Wrap the request inside the payload creator. */
  const track = async <T>(getState: () => unknown, request: () => Promise<T>): Promise<T> => {
    const id = slot(getState());
    running.set(id, (running.get(id) ?? 0) + 1);
    try {
      const result = await request();
      lastOk.set(id, Date.now());
      return result;
    } finally {
      const left = (running.get(id) ?? 1) - 1;
      if (left <= 0) running.delete(id);
      else running.set(id, left);
    }
  };

  /** Forget the last success so the next normal call refetches (use after mutations). */
  const invalidate = () => {
    for (const id of Array.from(lastOk.keys())) {
      if (id.startsWith(`${key}:`)) lastOk.delete(id);
    }
  };

  return { condition, track, invalidate };
}
