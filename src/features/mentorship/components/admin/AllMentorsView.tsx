// src/features/mentorship/components/admin/AllMentorsView.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  X,
  Search,
  Briefcase,
  Clock,
  Star,
  CalendarCheck,
  Ban,
  ShieldCheck,
} from "lucide-react";
import AdminService from "@/lib/api/admin.service";
import ProfileService from "@/lib/api/profile.service";

interface MentorAvatarProps {
  photoUrl?: string | null;
  name: string;
  initials: string;
  className?: string;
}

function MentorAvatar({ photoUrl, name, initials, className = "w-9 h-9" }: MentorAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  if (photoUrl && !imgError) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={photoUrl}
        alt={name}
        loading="lazy"
        onError={() => setImgError(true)}
        className={`${className} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors group-hover:bg-[#eae0d5]`}
      style={{ backgroundColor: "#f3ece4", color: "#4a3728" }}
    >
      {initials || "M"}
    </div>
  );
}

export interface MentorListItem {
  _id: string;
  mentorId: string;
  userId: string;
  status: string;
  title: string;
  bio: string;
  domains: string[];
  skills: string[];
  languages?: string[];
  profilePic?: string;
  experience?: {
    total: number;
    level?: string;
    currentRole?: string;
    previousRoles?: Array<{ title: string; company: string; duration: string }>;
  };
  pricing?: Record<string, number>;
  stats?: {
    totalSessions?: number;
    completedSessions?: number;
    cancelledSessions?: number;
    totalEarnings?: number;
    averageRating?: number;
    totalReviews?: number;
    responseTime?: number;
    completionRate?: number;
  };
  socialProof?: {
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    twitterUrl?: string;
    websiteUrl?: string;
    certifications?: string[];
    achievements?: string[];
  };
  verification?: {
    isVerified?: boolean;
    verificationDocuments?: string[];
  };
  user?: {
    firstName?: string;
    lastName?: string;
    profilePhotoId?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function AllMentorsView() {
  const [mentors, setMentors] = useState<MentorListItem[]>([]);
  const [photosMap, setPhotosMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState<number | null>(null);

  // Modals state
  const [selectedMentor, setSelectedMentor] = useState<MentorListItem | null>(null);
  const [suspendingMentor, setSuspendingMentor] = useState<MentorListItem | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [activatingMentor, setActivatingMentor] = useState<MentorListItem | null>(null);

  // In-flight action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Debounce search query for backend query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminService.getAllMentors({
        page,
        limit: 10,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      });

      const list = res.data || [];
      const totalCount = res.meta?.total ?? res.pagination?.total ?? list.length;
      const totalPages = res.meta?.totalPages ?? res.pagination?.totalPages ?? Math.max(1, Math.ceil(totalCount / 10));

      setMentors(list);
      setTotal(totalCount);
      setPages(totalPages);

      const photoIds = list
        .map((m) => m.user?.profilePhotoId)
        .filter((id): id is string => Boolean(id));

      if (photoIds.length > 0) {
        try {
          const photoRes = await ProfileService.getMultipleProfilePhotosByIds(photoIds);
          const map: Record<string, string> = {};
          (photoRes?.data?.photos || []).forEach(
            (p: { photoId?: string; cloudinarySecureUrl?: string }) => {
              if (p?.photoId && p?.cloudinarySecureUrl) {
                map[p.photoId] = p.cloudinarySecureUrl;
              }
            }
          );
          if (Object.keys(map).length > 0) {
            setPhotosMap((prev) => ({ ...prev, ...map }));
          }
        } catch {
          // Keep mentor.profilePic as fallback
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load mentors.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  // Escape key handler across all modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !actionLoadingId) {
        if (suspendingMentor) {
          setSuspendingMentor(null);
          setSuspensionReason("");
        } else if (activatingMentor) {
          setActivatingMentor(null);
        } else if (selectedMentor) {
          setSelectedMentor(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionLoadingId, suspendingMentor, activatingMentor, selectedMentor]);

  // Handle Suspend (active -> suspended)
  const handleConfirmSuspend = async () => {
    if (!suspendingMentor) return;
    const trimmed = suspensionReason.trim();
    if (trimmed.length < 5) {
      setError("Suspension reason must be at least 5 characters.");
      return;
    }
    setActionLoadingId(suspendingMentor.mentorId);
    setActionSuccess(null);
    setError(null);
    try {
      await AdminService.updateMentorStatus(
        suspendingMentor.mentorId,
        "suspended",
        trimmed
      );

      const name = suspendingMentor.user?.firstName
        ? `${suspendingMentor.user.firstName} ${suspendingMentor.user.lastName || ""}`.trim()
        : suspendingMentor.title;
      setActionSuccess(`Mentor "${name}" suspended.`);

      // Update local state
      setMentors((prev) =>
        prev.map((m) =>
          m.mentorId === suspendingMentor.mentorId ? { ...m, status: "suspended" } : m
        )
      );

      if (selectedMentor?.mentorId === suspendingMentor.mentorId) {
        setSelectedMentor((prev) => (prev ? { ...prev, status: "suspended" } : null));
      }

      setSuspendingMentor(null);
      setSuspensionReason("");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to suspend mentor.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Activate (suspended -> active)
  const handleConfirmActivate = async () => {
    if (!activatingMentor) return;
    setActionLoadingId(activatingMentor.mentorId);
    setActionSuccess(null);
    setError(null);
    try {
      await AdminService.updateMentorStatus(activatingMentor.mentorId, "active");

      const name = activatingMentor.user?.firstName
        ? `${activatingMentor.user.firstName} ${activatingMentor.user.lastName || ""}`.trim()
        : activatingMentor.title;
      setActionSuccess(`Mentor "${name}" activated successfully.`);

      // Update local state
      setMentors((prev) =>
        prev.map((m) =>
          m.mentorId === activatingMentor.mentorId ? { ...m, status: "active" } : m
        )
      );

      if (selectedMentor?.mentorId === activatingMentor.mentorId) {
        setSelectedMentor((prev) => (prev ? { ...prev, status: "active" } : null));
      }

      setActivatingMentor(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to activate mentor.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { label: "Active", bg: "#d1fae5", text: "#065f46" };
      case "pending_approval":
        return { label: "Pending", bg: "#fbf1dc", text: "#b8860b" };
      case "suspended":
        return { label: "Suspended", bg: "#fee2e2", text: "#991b1b" };
      case "inactive":
        return { label: "Inactive", bg: "#f3ece4", text: "#8a7a6a" };
      case "on_break":
        return { label: "On Break", bg: "#e0e7ff", text: "#3730a3" };
      default:
        return { label: status, bg: "#f3ece4", text: "#4a3728" };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#ece4db]">
        <div className="flex flex-col gap-1 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a6a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mentors by title, skills, domain..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
            />
          </div>
          <span className="text-[10px] text-[#8a7a6a] pl-1">
            Searches title and skills
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-[#4a3728]">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
              <option value="on_break">On Break</option>
            </select>
          </div>

          <div className="text-xs font-medium text-[#8a7a6a]">
            Total:{" "}
            <span className="font-bold text-[#4a3728]">
              {total !== null && !error ? total : "—"}
            </span>{" "}
            mentor{total === 1 && !error ? "" : "s"}
          </div>

          <button
            type="button"
            onClick={() => fetchMentors()}
            disabled={loading}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] hover:bg-[#f3ece4] disabled:opacity-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-lg text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg text-xs bg-red-50 text-red-800 border border-red-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchMentors()}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded-md border border-red-300 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 font-medium transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Mentors Table */}
      {loading && mentors.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#ece4db] overflow-hidden">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#7a5c3e]" />
          </div>
        </div>
      ) : error && mentors.length === 0 ? null : (
        <div className="bg-white rounded-xl border border-[#ece4db] overflow-hidden">
          {!error && mentors.length === 0 ? (
            <div className="text-center py-16 text-[#8a7a6a] text-sm space-y-2">
              <div>
                {searchQuery || statusFilter
                  ? "No mentors found matching your filters."
                  : "No mentors found."}
              </div>
              {(searchQuery || statusFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("");
                    setPage(1);
                  }}
                  className="text-xs text-[#7a5c3e] hover:underline font-semibold"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#ece4db] bg-[#faf6f1] text-[#7a5c3e]">
                  <th className="py-3 px-4 font-semibold">Mentor</th>
                  <th className="py-3 px-4 font-semibold">Current Role</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Experience</th>
                  <th className="py-3 px-4 font-semibold">Rating</th>
                  <th className="py-3 px-4 font-semibold">Sessions</th>
                  <th className="py-3 px-4 font-semibold">Domains & Skills</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece4db]">
                {mentors.map((mentor) => {
                  const isUpdating = actionLoadingId === mentor.mentorId;
                  const fullName = mentor.user?.firstName
                    ? `${mentor.user.firstName} ${mentor.user.lastName || ""}`.trim()
                    : "Mentor";
                  const initials = fullName
                    .split(" ")
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  const statusBadge = getStatusBadge(mentor.status);

                  const ratingDisplay =
                    mentor.stats?.averageRating != null && mentor.stats.averageRating > 0
                      ? `${mentor.stats.averageRating.toFixed(1)} ★`
                      : "—";

                  const sessionsDisplay =
                    mentor.stats?.totalSessions != null ? mentor.stats.totalSessions : "—";

                  const slug = (fullName || "mentor").toLowerCase().trim().replace(/\s+/g, "-");
                  const avatarUrl =
                    (mentor.user?.profilePhotoId ? photosMap[mentor.user.profilePhotoId] : null) ||
                    mentor.profilePic ||
                    null;

                  const isPending = mentor.status === "pending_approval";
                  const canLinkToMentee = isPending && Boolean(mentor.userId);
                  const canLinkToMentor = !isPending && Boolean(mentor.mentorId);

                  const profileHref = canLinkToMentee
                    ? `/mentorship/admin/mentee/${mentor.userId}`
                    : canLinkToMentor
                    ? `/mentorship/mentor-card/${slug}/${mentor.mentorId}`
                    : null;

                  const linkAriaLabel = canLinkToMentee
                    ? `Open mentee profile of ${fullName}`
                    : `Open mentor profile of ${fullName}`;

                  return (
                    <tr key={mentor.mentorId} className="hover:bg-[#fdfbf9] transition-colors">
                      {/* Identity */}
                      <td className="py-3.5 px-4 align-top">
                        {profileHref ? (
                          <Link
                            href={profileHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-left group cursor-pointer rounded-lg p-0.5 -m-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e] focus-visible:ring-offset-1"
                            aria-label={linkAriaLabel}
                          >
                            <MentorAvatar photoUrl={avatarUrl} name={fullName} initials={initials} />
                            <div>
                              <div className="font-semibold text-[#4a3728] group-hover:text-[#2d1f14] group-hover:underline">
                                {fullName}
                              </div>
                              <div className="text-[11px] text-[#8a7a6a] line-clamp-1">{mentor.title}</div>
                            </div>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedMentor(mentor)}
                            className="flex items-center gap-3 text-left group cursor-pointer rounded-lg p-0.5 -m-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e] focus-visible:ring-offset-1"
                            aria-label={`View details for ${fullName}`}
                          >
                            <MentorAvatar photoUrl={avatarUrl} name={fullName} initials={initials} />
                            <div>
                              <div className="font-semibold text-[#4a3728] group-hover:text-[#2d1f14] group-hover:underline">
                                {fullName}
                              </div>
                              <div className="text-[11px] text-[#8a7a6a] line-clamp-1">{mentor.title}</div>
                            </div>
                          </button>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 align-top max-w-[170px]">
                        <div className="text-[#4a3728] font-medium">
                          {mentor.experience?.currentRole || "Not specified"}
                        </div>
                        {mentor.socialProof?.linkedinUrl && (
                          <a
                            href={mentor.socialProof.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-[#2563eb] hover:underline mt-0.5"
                          >
                            <span>LinkedIn</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span
                          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                          style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}
                        >
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Experience */}
                      <td className="py-3.5 px-4 align-top text-[#5c4a3a] whitespace-nowrap">
                        <div className="font-semibold text-[#4a3728]">
                          {mentor.experience?.total != null ? `${mentor.experience.total} yrs` : "—"}
                        </div>
                        {mentor.experience?.level && (
                          <div className="text-[10px] text-[#8a7a6a] capitalize">
                            {mentor.experience.level}
                          </div>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[#4a3728] font-semibold">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{ratingDisplay}</span>
                        </div>
                        {mentor.stats?.totalReviews != null && mentor.stats.totalReviews > 0 && (
                          <div className="text-[10px] text-[#8a7a6a]">
                            {mentor.stats.totalReviews} review{mentor.stats.totalReviews === 1 ? "" : "s"}
                          </div>
                        )}
                      </td>

                      {/* Total Sessions */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[#4a3728] font-semibold">
                          <CalendarCheck className="w-3.5 h-3.5 text-[#2563eb]" />
                          <span>{sessionsDisplay}</span>
                        </div>
                      </td>

                      {/* Domains & Skills */}
                      <td className="py-3.5 px-4 align-top max-w-[200px]">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {(mentor.domains || []).slice(0, 2).map((domain) => (
                            <span
                              key={domain}
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#f3ece4] text-[#4a3728]"
                            >
                              {domain.replace(/_/g, " ")}
                            </span>
                          ))}
                          {(mentor.domains || []).length > 2 && (
                            <span className="text-[10px] text-[#8a7a6a]">
                              +{mentor.domains.length - 2} more
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8a7a6a] line-clamp-1">
                          {(mentor.skills || []).join(", ")}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin inline-block text-[#7a5c3e]" />
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedMentor(mentor)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#e0d8cf] text-[#4a3728] hover:bg-[#fbf7f3] transition-colors cursor-pointer"
                              title="View full profile details"
                            >
                              <Eye className="w-3 h-3 text-[#7a5c3e]" />
                              <span>View</span>
                            </button>

                            {mentor.status === "active" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSuspendingMentor(mentor);
                                  setSuspensionReason("");
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                                title="Suspend active mentor"
                              >
                                <Ban className="w-3 h-3 text-amber-700" />
                                <span>Suspend</span>
                              </button>
                            )}

                            {mentor.status === "suspended" && (
                              <button
                                type="button"
                                onClick={() => setActivatingMentor(mentor)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                                title="Activate suspended mentor"
                              >
                                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                <span>Activate</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#ece4db] bg-[#faf6f1]">
            <span className="text-xs text-[#8a7a6a]">
              Page {page} of {pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="p-1 rounded border border-[#e0d8cf] disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#4a3728]" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages || loading}
                className="p-1 rounded border border-[#e0d8cf] disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[#4a3728]" />
              </button>
            </div>
          </div>
        )}
      </div>
    )}

      {/* Details Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#ece4db] shadow-2xl flex flex-col"
            style={{ backgroundColor: "#fff" }}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#ece4db] flex items-start justify-between bg-[#faf6f1] sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <MentorAvatar
                  photoUrl={
                    (selectedMentor.user?.profilePhotoId
                      ? photosMap[selectedMentor.user.profilePhotoId]
                      : null) ||
                    selectedMentor.profilePic ||
                    null
                  }
                  name={
                    selectedMentor.user?.firstName
                      ? `${selectedMentor.user.firstName} ${selectedMentor.user.lastName || ""}`.trim()
                      : "Mentor Profile"
                  }
                  initials={
                    (selectedMentor.user?.firstName
                      ? `${selectedMentor.user.firstName} ${selectedMentor.user.lastName || ""}`.trim()
                      : "Mentor Profile")
                      .split(" ")
                      .map((n) => n[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "M"
                  }
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#4a3728]">
                      {selectedMentor.user?.firstName
                        ? `${selectedMentor.user.firstName} ${selectedMentor.user.lastName || ""}`.trim()
                        : "Mentor Profile"}
                    </h3>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                      style={{
                        backgroundColor: getStatusBadge(selectedMentor.status).bg,
                        color: getStatusBadge(selectedMentor.status).text,
                      }}
                    >
                      {getStatusBadge(selectedMentor.status).label}
                    </span>
                  </div>
                  <p className="text-xs text-[#8a7a6a] mt-0.5">{selectedMentor.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMentor(null)}
                className="p-1.5 rounded-lg hover:bg-[#f3ece4] text-[#8a7a6a] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-[#ece4db] bg-[#fbf7f3]">
                  <div className="flex items-center gap-1.5 text-[#8a7a6a] mb-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Current Role</span>
                  </div>
                  <div className="font-semibold text-[#4a3728]">
                    {selectedMentor.experience?.currentRole || "—"}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#ece4db] bg-[#fbf7f3]">
                  <div className="flex items-center gap-1.5 text-[#8a7a6a] mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Experience</span>
                  </div>
                  <div className="font-semibold text-[#4a3728]">
                    {selectedMentor.experience?.total ?? 0} Yrs ({selectedMentor.experience?.level || "N/A"})
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#ece4db] bg-[#fbf7f3]">
                  <div className="flex items-center gap-1.5 text-[#8a7a6a] mb-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Average Rating</span>
                  </div>
                  <div className="font-semibold text-[#4a3728]">
                    {selectedMentor.stats?.averageRating != null && selectedMentor.stats.averageRating > 0
                      ? `${selectedMentor.stats.averageRating.toFixed(1)} ★ (${selectedMentor.stats.totalReviews ?? 0})`
                      : "—"}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#ece4db] bg-[#fbf7f3]">
                  <div className="flex items-center gap-1.5 text-[#8a7a6a] mb-1">
                    <CalendarCheck className="w-3.5 h-3.5 text-[#2563eb]" />
                    <span>Total Sessions</span>
                  </div>
                  <div className="font-semibold text-[#4a3728]">
                    {selectedMentor.stats?.totalSessions ?? 0}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="font-bold text-[#4a3728] mb-1.5 uppercase text-[11px] tracking-wider">
                  Biography
                </h4>
                <div className="p-4 rounded-xl border border-[#ece4db] bg-[#faf6f1] text-[#5c4a3a] leading-relaxed whitespace-pre-wrap">
                  {selectedMentor.bio || "No biography provided."}
                </div>
              </div>

              {/* Domains & Skills */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-[#4a3728] mb-1.5 uppercase text-[11px] tracking-wider">
                    Domains
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedMentor.domains || []).map((domain) => (
                      <span
                        key={domain}
                        className="px-2.5 py-1 rounded-lg font-medium bg-[#f3ece4] text-[#4a3728]"
                      >
                        {domain.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#4a3728] mb-1.5 uppercase text-[11px] tracking-wider">
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedMentor.skills || []).map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-lg font-medium border border-[#e0d8cf] bg-white text-[#5c4a3a]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* External Profiles */}
              <div>
                <h4 className="font-bold text-[#4a3728] mb-1.5 uppercase text-[11px] tracking-wider">
                  External Profiles & Links
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMentor.socialProof?.linkedinUrl && (
                    <a
                      href={selectedMentor.socialProof.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e0d8cf] text-[#2563eb] hover:bg-[#fbf7f3]"
                    >
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedMentor.socialProof?.githubUrl && (
                    <a
                      href={selectedMentor.socialProof.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e0d8cf] text-[#4a3728] hover:bg-[#fbf7f3]"
                    >
                      <span>GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedMentor.socialProof?.portfolioUrl && (
                    <a
                      href={selectedMentor.socialProof.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e0d8cf] text-[#0f766e] hover:bg-[#fbf7f3]"
                    >
                      <span>Portfolio</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {!selectedMentor.socialProof?.linkedinUrl &&
                    !selectedMentor.socialProof?.githubUrl &&
                    !selectedMentor.socialProof?.portfolioUrl && (
                      <span className="text-[#8a7a6a]">No external links provided.</span>
                    )}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-[#ece4db] bg-[#faf6f1] flex items-center justify-between sticky bottom-0">
              <button
                type="button"
                onClick={() => setSelectedMentor(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#e0d8cf] text-[#5c4a3a] hover:bg-white text-xs font-medium"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedMentor.status === "active" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSuspendingMentor(selectedMentor);
                      setSuspensionReason("");
                    }}
                    disabled={actionLoadingId === selectedMentor.mentorId}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5 text-amber-700" />
                    <span>Suspend Mentor</span>
                  </button>
                )}

                {selectedMentor.status === "suspended" && (
                  <button
                    type="button"
                    onClick={() => setActivatingMentor(selectedMentor)}
                    disabled={actionLoadingId === selectedMentor.mentorId}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Activate Mentor</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Dialog */}
      {suspendingMentor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#ece4db] shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#4a3728]">
                  Suspend Mentor
                </h3>
                <p className="text-xs text-[#8a7a6a] mt-0.5">
                  Mentor:{" "}
                  <span className="font-semibold text-[#4a3728]">
                    {suspendingMentor.user?.firstName
                      ? `${suspendingMentor.user.firstName} ${suspendingMentor.user.lastName || ""}`.trim()
                      : suspendingMentor.title}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSuspendingMentor(null);
                  setSuspensionReason("");
                }}
                className="p-1 rounded-lg hover:bg-[#f3ece4] text-[#8a7a6a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5c4a3a] leading-relaxed">
              Are you sure you want to suspend this mentor? Their status will be updated to{" "}
              <strong className="text-red-700">Suspended</strong> and their public bookings will be disabled.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#4a3728] mb-1.5">
                Reason (required) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Reason for suspension (e.g. Terms violation, mentee complaints, inappropriate behavior)..."
                rows={3}
                maxLength={500}
                className="w-full text-xs p-3 rounded-xl border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
              />
              <div className="flex items-center justify-between text-[10px] text-[#8a7a6a] mt-1">
                <span>Minimum 5 characters</span>
                <span>{suspensionReason.trim().length}/500</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ece4db]">
              <button
                type="button"
                onClick={() => {
                  setSuspendingMentor(null);
                  setSuspensionReason("");
                }}
                disabled={actionLoadingId === suspendingMentor.mentorId}
                className="px-3.5 py-1.5 rounded-lg border border-[#e0d8cf] text-[#5c4a3a] hover:bg-[#fbf7f3] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspend}
                disabled={
                  suspensionReason.trim().length < 5 ||
                  actionLoadingId === suspendingMentor.mentorId
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoadingId === suspendingMentor.mentorId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Ban className="w-3.5 h-3.5" />
                )}
                <span>Confirm Suspension</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Confirmation Dialog */}
      {activatingMentor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#ece4db] shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#4a3728]">
                  Activate Mentor
                </h3>
                <p className="text-xs text-[#8a7a6a] mt-0.5">
                  Mentor:{" "}
                  <span className="font-semibold text-[#4a3728]">
                    {activatingMentor.user?.firstName
                      ? `${activatingMentor.user.firstName} ${activatingMentor.user.lastName || ""}`.trim()
                      : activatingMentor.title}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivatingMentor(null)}
                className="p-1 rounded-lg hover:bg-[#f3ece4] text-[#8a7a6a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5c4a3a] leading-relaxed">
              Are you sure you want to reactivate this mentor? Their status will be restored to{" "}
              <strong className="text-emerald-700">Active</strong> and mentees will be able to book sessions again.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ece4db]">
              <button
                type="button"
                onClick={() => setActivatingMentor(null)}
                disabled={actionLoadingId === activatingMentor.mentorId}
                className="px-3.5 py-1.5 rounded-lg border border-[#e0d8cf] text-[#5c4a3a] hover:bg-[#fbf7f3] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmActivate}
                disabled={actionLoadingId === activatingMentor.mentorId}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {actionLoadingId === activatingMentor.mentorId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span>Confirm Activation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
