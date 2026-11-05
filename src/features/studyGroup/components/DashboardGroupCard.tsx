import React from "react";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";

// Muted tints that sit well with the brown theme; picked per group so cards
// are easy to tell apart without clashing colours.
const TINTS = [
  { bg: "#f5e1d8", fg: "#9a4f2f" }, // terracotta
  { bg: "#e6ece0", fg: "#4f6b3a" }, // sage
  { bg: "#f1e7d0", fg: "#7a5c1e" }, // sand
  { bg: "#eadcd5", fg: "#6b4a3a" }, // clay
  { bg: "#e3e8ec", fg: "#3f5565" }, // slate
];

const ROLE_STYLES: Record<string, string> = {
  leader: "bg-[#4a3728] text-white",
  admin: "bg-[#d4a574]/30 text-[#6b5847]",
  member: "bg-[#f6ede8] text-[#6b5847]",
};

const tintFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
};

export default function DashboardGroupCard({ group }: { group: any }) {
  const tint = tintFor(String(group.groupId));
  const role = (group.memberRole || "member") as string;
  const count = group.currentMemberCount ?? 0;
  const pct = group.capacity
    ? Math.min(100, Math.round((count / group.capacity) * 100))
    : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#e0d8cf] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d4a574] hover:shadow-md">
      <div className="h-1 bg-gradient-to-r from-[#4a3728] via-[#8b6f47] to-[#d4a574]" />

      <div className="flex flex-1 flex-col p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-base font-bold"
            style={{ backgroundColor: tint.bg, color: tint.fg }}
          >
            {(group.title || "G").charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-[#4a3728]">
              {group.title}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="truncate rounded-full bg-[#f6ede8] px-2 py-0.5 text-[11px] font-medium text-[#6b5847]">
                {group.category}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#6b5847]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    group.isActive ? "bg-emerald-500" : "bg-[#c9bfb4]"
                  }`}
                />
                {group.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <span
            className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${
              ROLE_STYLES[role] ?? ROLE_STYLES.member
            }`}
          >
            {role}
          </span>
        </div>

        {/* Description (fixed height keeps cards aligned) */}
        <p className="mt-3 line-clamp-2 min-h-[2rem] text-xs leading-4 text-[#6b5847]">
          {group.description || "No description added yet."}
        </p>

        {/* Members / capacity */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-medium text-[#4a3728]">
              <Users className="h-3.5 w-3.5 text-[#8b6f47]" />
              {count}/{group.capacity} members
            </span>
            <span className="text-[#8b7355]">{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0e9e0]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8b6f47] to-[#4a3728] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Tags */}
        {group.tags && group.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {group.tags.slice(0, 3).map((tag: string, i: number) => (
              <span
                key={i}
                className="rounded-md bg-[#f6ede8] px-1.5 py-0.5 text-[10px] text-[#6b5847]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action pinned to bottom */}
        <div className="mt-auto pt-4">
          <Link
            href={`/study/my-groups/${group.groupId}`}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#4a3728] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#3a2a1e]"
          >
            Open Group
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
