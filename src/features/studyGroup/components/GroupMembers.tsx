"use client";
/**
 * GroupMembers.tsx
 * ---------------------------------------------------------------------------
 * - MemberAvatar : real profile photo, falls back to initials
 * - AvatarStack  : overlapped avatars + "+N"
 * - MembersButton: avatars + "N members" -> opens a responsive members popup
 *                  (bottom sheet on phones, centered dialog on sm+)
 *
 * Speed:
 *  - popup opens instantly with the avatars already known
 *  - list + profiles are prefetched on hover / focus / touch
 *  - rows appear as soon as the members request returns; names and photos
 *    fill in one by one
 *  - list cached 60s per group (cacheKey)
 * ---------------------------------------------------------------------------
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

/* --------------------------------- types ---------------------------------- */

export type MemberPreview = {
  userId?: string;
  initials?: string;
  name?: string;
  avatar?: string | null;
};

export type NormalizedMember = {
  id?: string;
  name: string;
  initials: string;
  photo: string;
  subtitle: string;
  isAdmin: boolean;
  /** name still being looked up */
  pending?: boolean;
};

export type ProfileLite = { name?: string; avatar?: string | null };

/* ------------------------------- constants -------------------------------- */

const AVATAR_COLORS = ["#c9a27a", "#a9795a", "#6b4a36", "#8a6244", "#b58863"];
const LIST_TTL = 60_000;
const listCache = new Map<string, { t: number; data: any[] }>();

/* ------------------------------- normalizers ------------------------------ */

const pick = (obj: Record<string, any>, keys: string[]): any => {
  for (const k of keys) if (obj?.[k]) return obj[k];
  return "";
};

const asText = (v: any): string =>
  v && typeof v === "object" ? v.name || v.title || "" : v || "";

export const getInitials = (name = ""): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "?";

const colorFor = (seed = ""): string => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

/** Accepts memberPreview items AND full member objects from getGroupMembers. */
export function normalizeMember(raw: any): NormalizedMember {
  const nested = raw && typeof raw.user === "object" ? raw.user : null;
  const u: Record<string, any> = { ...(nested || {}), ...(raw || {}) };

  let photo = pick(u, [
    "avatar",
    "profilePicture",
    "profilePic",
    "profileImage",
    "photo",
    "photoURL",
    "image",
    "imageUrl",
    "picture",
  ]);
  if (photo && typeof photo === "object") photo = photo.url || photo.secure_url || "";

  const name: string =
    pick(u, ["name", "fullName", "displayName", "userName", "username"]) ||
    [u.firstName, u.lastName].filter(Boolean).join(" ");

  const role = String(u.role || u.memberRole || "");
  const isAdmin =
    Boolean(u.isAdmin || u.isOwner || u.isCreator) ||
    /admin|owner|creator|leader/i.test(role);

  return {
    id: u.userId || u._id || u.id || (typeof raw?.user === "string" ? raw.user : undefined),
    name: name || "Member",
    initials: u.initials || (name ? getInitials(name) : "?"),
    photo: typeof photo === "string" ? photo : "",
    subtitle: asText(pick(u, ["college", "university", "course", "headline", "branch"])),
    isAdmin,
  };
}

const extractList = (res: any): any[] => {
  const d = res?.data ?? res;
  if (Array.isArray(d)) return d;
  return d?.members || d?.data?.members || d?.data || d?.results || [];
};

/* --------------------------------- Avatar --------------------------------- */

export function MemberAvatar({
  member,
  size = 36,
  ring = false,
  fallbackBg,
}: {
  member: any;
  size?: number;
  ring?: boolean;
  fallbackBg?: string;
}) {
  const m: NormalizedMember = useMemo(() => normalizeMember(member), [member]);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [m.photo]);

  const dim = {
    width: size,
    height: size,
    fontSize: Math.max(10, Math.round(size * 0.32)),
  };
  const ringCls = ring ? "ring-2 ring-white" : "";

  if (m.photo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={m.photo}
        alt={m.name}
        title={m.name}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        style={dim}
        className={`shrink-0 rounded-full bg-[#eadfd3] object-cover ${ringCls}`}
      />
    );
  }

  return (
    <span
      title={m.name}
      aria-label={m.name}
      style={{ ...dim, backgroundColor: fallbackBg || colorFor(m.id || m.name) }}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold text-white ${ringCls}`}
    >
      {m.initials}
    </span>
  );
}

export function AvatarStack({
  members = [],
  total,
  max = 3,
  size = 36,
}: {
  members?: any[];
  total?: number;
  max?: number;
  size?: number;
}) {
  const shown = members.slice(0, max);
  const extra = Math.max((total ?? members.length) - shown.length, 0);

  return (
    <span className="flex items-center">
      {shown.map((m, i) => (
        <span
          key={m?.userId || m?._id || i}
          className={i === 0 ? "" : "-ml-2"}
          style={{ zIndex: max - i }}
        >
          <MemberAvatar
            member={m}
            size={size}
            ring
            fallbackBg={AVATAR_COLORS[i % 3]}
          />
        </span>
      ))}
      {extra > 0 && shown.length > 0 && (
        <span
          style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.32)) }}
          className="-ml-2 inline-flex items-center justify-center rounded-full bg-[#f3e6d8] font-bold text-[#4a3426] ring-2 ring-white"
        >
          +{extra > 99 ? "99" : extra}
        </span>
      )}
    </span>
  );
}

/* ------------------------------ Members modal ------------------------------ */

type ModalProps = {
  open: boolean;
  onClose: () => void;
  groupName?: string;
  members?: any[];
  memberCount: number;
  canViewAll: boolean;
  loadList?: () => Promise<any[]>;
  resolveProfile?: (userId: string) => Promise<ProfileLite | null>;
  onViewProfile?: (m: NormalizedMember) => void;
};

function MembersModal({
  open,
  onClose,
  groupName,
  members,
  memberCount,
  canViewAll,
  loadList,
  resolveProfile,
  onViewProfile,
}: ModalProps) {
  const preview = useMemo(() => (members || []).map(normalizeMember), [members]);
  const [list, setList] = useState<NormalizedMember[]>(preview);
  const [loading, setLoading] = useState(false); // skeleton (only if nothing to show)
  const [refreshing, setRefreshing] = useState(false); // small "loading everyone" hint
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const runRef = useRef(0);
  const titleId = useId();

  const load = useCallback(async () => {
    const run = ++runRef.current;
    const alive = () => runRef.current === run;
    setError("");
    setNote("");

    // Non-members (or no loader): preview only, never the full list.
    if (!canViewAll || !loadList) {
      setList(preview);
      setLoading(false);
      setRefreshing(false);
      if (!canViewAll && memberCount > preview.length) {
        setNote("Join this group to see everyone.");
      }
      return;
    }

    // 1) show what we already know straight away
    setList(preview);
    setLoading(preview.length === 0);
    setRefreshing(true);

    try {
      const raw = await loadList();
      if (!alive()) return;

      // 2) show every row as soon as the list arrives
      const known = new Map(preview.map((m) => [m.id, m]));
      const base = raw.map((r) => {
        const m = normalizeMember(r);
        const k = m.id ? known.get(m.id) : undefined;
        const kName = k && k.name !== "Member" ? k.name : undefined;
        const merged: NormalizedMember = {
          ...m,
          name: m.name !== "Member" ? m.name : kName || m.name,
          photo: m.photo || k?.photo || "",
          initials: m.initials !== "?" ? m.initials : k?.initials || "?",
        };
        merged.pending = merged.name === "Member" && Boolean(resolveProfile && merged.id);
        return merged;
      });
      setList(base);
      setLoading(false);
      setRefreshing(false);

      // 3) fill in names / photos one by one (cached ones resolve instantly)
      if (resolveProfile) {
        base.forEach((m) => {
          if (!m.id || (m.photo && m.name !== "Member")) return;
          resolveProfile(m.id).then((p) => {
            if (!alive()) return;
            setList((prev) =>
              prev.map((x) =>
                x.id === m.id
                  ? {
                      ...x,
                      name: p?.name ?? x.name,
                      photo: p?.avatar || x.photo,
                      initials: p?.name ? getInitials(p.name) : x.initials,
                      pending: false,
                    }
                  : x
              )
            );
          });
        });
      }
    } catch {
      if (!alive()) return;
      setLoading(false);
      setRefreshing(false);
      if (preview.length > 0) {
        setList(preview);
        setNote("Couldn't load the full list. Showing a preview.");
      } else {
        setError("Couldn't load members. Please try again.");
      }
    }
  }, [canViewAll, loadList, preview, memberCount, resolveProfile]);

  useEffect(() => {
    if (open) {
      setQuery("");
      load();
    }
    return () => {
      runRef.current++; // cancel in-flight updates when closed / unmounted
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Esc to close, lock page scroll, move + restore focus
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.subtitle.toLowerCase().includes(q)
      )
      .sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin));
  }, [list, query]);

  if (!open || typeof document === "undefined") return null;

  const countLabel = `${memberCount} ${memberCount === 1 ? "member" : "members"}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes t8-fade{from{opacity:0}to{opacity:1}}
        @keyframes t8-sheet{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
        .t8-backdrop{animation:t8-fade .15s ease-out}
        .t8-panel{animation:t8-sheet .2s ease-out}
        @media (prefers-reduced-motion:reduce){.t8-backdrop,.t8-panel{animation:none}}
      `}</style>

      <div
        className="t8-backdrop absolute inset-0 bg-[#2a1d14]/55"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="t8-panel relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[min(80dvh,620px)] sm:max-w-md sm:rounded-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-[#4a3426] to-[#8a6244] px-4 pb-4 pt-4 sm:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-lg font-bold text-white">
              Members
            </h2>
            <p className="truncate text-xs text-[#f3e6d8] sm:text-sm">
              {groupName ? `${groupName} · ` : ""}
              {countLabel}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close members list"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Search (bigger groups only) */}
        {canViewAll && list.length > 8 && (
          <div className="border-b border-[#eadfd3] px-4 py-2 sm:px-5">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members"
              aria-label="Search members"
              className="w-full rounded-lg border border-[#eadfd3] bg-white px-3 py-2 text-sm text-[#3a281c] outline-none placeholder:text-[#b09a88] focus:border-[#4a3426]"
            />
          </div>
        )}

        {/* Body */}
        <div className="min-h-[120px] flex-1 overflow-y-auto overscroll-contain px-2 py-2 sm:px-3">
          {loading && (
            <ul aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex animate-pulse items-center gap-3 px-2 py-2">
                  <span className="h-10 w-10 rounded-full bg-[#eadfd3]" />
                  <span className="flex-1 space-y-2">
                    <span className="block h-3 w-2/5 rounded bg-[#eadfd3]" />
                    <span className="block h-2.5 w-1/4 rounded bg-[#f3e9df]" />
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
              <p className="text-sm text-[#6b5648]">{error}</p>
              <button
                type="button"
                onClick={load}
                className="rounded-xl bg-[#4a3426] px-4 py-2 text-sm font-bold text-white hover:bg-[#3a281c]"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && visible.length === 0 && !refreshing && (
            <p className="px-4 py-8 text-center text-sm text-[#6b5648]">
              {query ? "No members match your search." : "No members to show yet."}
            </p>
          )}

          {!loading && !error && visible.length > 0 && (
            <ul>
              {visible.map((m, i) => {
                const clickable = Boolean(onViewProfile && m.id && canViewAll);
                const content = (
                  <>
                    <MemberAvatar member={m} size={40} />
                    <span className="min-w-0 flex-1">
                      {m.pending ? (
                        <span className="block h-3 w-28 animate-pulse rounded bg-[#eadfd3]" />
                      ) : (
                        <span className="block truncate text-sm font-semibold text-[#3a281c]">
                          {m.name}
                        </span>
                      )}
                      {m.subtitle && (
                        <span className="block truncate text-xs text-[#6b5648]">
                          {m.subtitle}
                        </span>
                      )}
                    </span>
                    {m.isAdmin && (
                      <span className="shrink-0 rounded-full bg-[#4a3426] px-2 py-0.5 text-[11px] font-semibold text-white">
                        Admin
                      </span>
                    )}
                  </>
                );
                const rowCls =
                  "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left sm:px-3";
                return (
                  <li key={m.id || i}>
                    {clickable ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onViewProfile?.(m);
                        }}
                        className={`${rowCls} hover:bg-[#faf5ef] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4a3426]`}
                      >
                        {content}
                      </button>
                    ) : (
                      <div className={rowCls}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && refreshing && list.length > 0 && (
            <p className="animate-pulse px-3 py-3 text-center text-xs text-[#6b5648]">
              Loading everyone…
            </p>
          )}

          {!loading && note && (
            <p className="px-3 pb-2 pt-3 text-center text-xs text-[#6b5648]">{note}</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ------------------------- Drop-in "N members" button ------------------------ */

export type MembersButtonProps = {
  groupName?: string;
  /** memberPreview from the list API (initials / name / avatar) */
  members?: any[];
  memberCount: number;
  /** true for group members (can see full list). Non-members see preview only. */
  canViewAll?: boolean;
  /** returns the raw members request, e.g. () => StudyGroupService.getGroupMembers(id) */
  fetchMembers?: () => Promise<unknown>;
  /** looks up one user's name + avatar, e.g. (id) => resolveProfile(id, getUserInfo) */
  resolveProfile?: (userId: string) => Promise<ProfileLite | null>;
  /** use the groupId so the list is cached for 60s */
  cacheKey?: string;
  onViewProfile?: (m: NormalizedMember) => void;
  avatarSize?: number;
};

export function MembersButton({
  groupName,
  members = [],
  memberCount,
  canViewAll = true,
  fetchMembers,
  resolveProfile,
  cacheKey,
  onViewProfile,
  avatarSize = 36,
}: MembersButtonProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const label = `${memberCount} ${memberCount === 1 ? "member" : "members"}`;

  const fetchRef = useRef(fetchMembers);
  fetchRef.current = fetchMembers;
  const resolveRef = useRef(resolveProfile);
  resolveRef.current = resolveProfile;
  const pending = useRef<Promise<any[]> | null>(null);

  const canLoad = canViewAll && Boolean(fetchMembers);

  /** One shared request: cached for 60s, de-duplicated, also warms profiles. */
  const loadList = useCallback((): Promise<any[]> => {
    const fresh = cacheKey ? listCache.get(cacheKey) : undefined;
    if (fresh && Date.now() - fresh.t < LIST_TTL) {
      fresh.data.forEach((r) => {
        const id = normalizeMember(r).id;
        if (id) resolveRef.current?.(id);
      });
      return Promise.resolve(fresh.data);
    }
    if (!pending.current) {
      const p = Promise.resolve(fetchRef.current!())
        .then(extractList)
        .then((data) => {
          if (cacheKey) listCache.set(cacheKey, { t: Date.now(), data });
          // warm the profile cache so names / photos are ready on click
          data.forEach((r) => {
            const id = normalizeMember(r).id;
            if (id) resolveRef.current?.(id);
          });
          return data;
        });
      pending.current = p;
      p.then(
        () => (pending.current = null),
        () => (pending.current = null)
      );
    }
    return pending.current;
  }, [cacheKey]);

  const prefetch = useCallback(() => {
    if (canLoad) loadList().catch(() => {});
  }, [canLoad, loadList]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // don't trigger any card-level click
          setOpen(true);
        }}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        onTouchStart={prefetch}
        aria-haspopup="dialog"
        aria-label={`View ${label}`}
        className="group -ml-1 flex min-h-[44px] max-w-full items-center rounded-full py-1 pl-1 pr-3 text-left transition hover:bg-[#faf5ef] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4a3426]"
      >
        <AvatarStack members={members} total={memberCount} size={avatarSize} />
        <span className="ml-3 truncate text-sm font-semibold text-[#3a281c] group-hover:underline">
          {label}
        </span>
      </button>

      <MembersModal
        open={open}
        onClose={close}
        groupName={groupName}
        members={members}
        memberCount={memberCount}
        canViewAll={canViewAll}
        loadList={canLoad ? loadList : undefined}
        resolveProfile={resolveProfile}
        onViewProfile={onViewProfile}
      />
    </>
  );
}

export default MembersButton;