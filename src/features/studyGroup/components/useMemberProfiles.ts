/**
 * useMemberProfiles.ts
 * ---------------------------------------------------------------------------
 * Adds name + profile picture to members that only have { userId, initials },
 * using the SAME lookup the Top Ranked section uses for the leader:
 *     const { getUserInfo } = useGroupData();   // -> { name, avatar }
 * Results are cached per userId and duplicate requests are shared.
 * No backend change needed.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from "react";
import type { MemberPreview } from "./GroupMembers";

export type MemberProfile = { name?: string; avatar?: string | null };

/** Same shape as useGroupData().getUserInfo */
export type GetUserInfo = (
  userId: string
) => Promise<{ name?: string; avatar?: string | null } | null | undefined>;

const cache = new Map<string, MemberProfile | null>();
const inflight = new Map<string, Promise<MemberProfile | null>>();

function load(userId: string, getUserInfo: GetUserInfo): Promise<MemberProfile | null> {
  if (cache.has(userId)) return Promise.resolve(cache.get(userId) ?? null);
  const running = inflight.get(userId);
  if (running) return running;

  const p = Promise.resolve(getUserInfo(userId))
    .then((info): MemberProfile | null => {
      if (!info) return null;
      // getUserInfo returns "Unknown User" when the lookup fails
      const name = info.name && info.name !== "Unknown User" ? info.name : undefined;
      return { name, avatar: info.avatar ?? null };
    })
    .catch(() => null)
    .then((profile) => {
      cache.set(userId, profile);
      inflight.delete(userId);
      return profile;
    });
  inflight.set(userId, p);
  return p;
}

const merge = (m: MemberPreview): MemberPreview => {
  const prof = m.userId ? cache.get(m.userId) : null;
  if (!prof) return m;
  return { ...m, name: m.name ?? prof.name, avatar: m.avatar ?? prof.avatar };
};

/** In a card: const members = useMemberProfiles(group.memberPreview, getUserInfo); */
export function useMemberProfiles(
  members: MemberPreview[] = [],
  getUserInfo: GetUserInfo,
  limit = 3
): MemberPreview[] {
  const [, rerender] = useState(0);

  const ids = members
    .slice(0, limit)
    .filter((m) => m.userId && !m.avatar)
    .map((m) => m.userId as string);
  const key = ids.join(",");

  useEffect(() => {
    const missing = ids.filter((id) => !cache.has(id));
    if (missing.length === 0) return;

    let alive = true;
    Promise.all(missing.map((id) => load(id, getUserInfo))).then(() => {
      if (alive) rerender((n) => n + 1);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return members.map(merge);
}

/** For the popup's full list: wrap fetchMembers so every member gets name + avatar. */
export async function enrichMembers<T extends { userId?: string }>(
  list: T[],
  getUserInfo: GetUserInfo
): Promise<(T & MemberProfile)[]> {
  await Promise.all(
    list.filter((m) => m.userId).map((m) => load(m.userId as string, getUserInfo))
  );
  return list.map((m) => {
    const prof = m.userId ? cache.get(m.userId) : null;
    return prof ? { ...m, ...prof } : m;
  });
}

/** Resolve one user's name + avatar (cached, shared in-flight requests). */
export function resolveProfile(
  userId: string,
  getUserInfo: GetUserInfo
): Promise<MemberProfile | null> {
  return load(userId, getUserInfo);
}