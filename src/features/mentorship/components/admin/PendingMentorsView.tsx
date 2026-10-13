// src/features/mentorship/components/admin/PendingMentorsView.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  X,
  Search,
  Briefcase,
  FileText,
  Clock,
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

interface PendingMentorsViewProps {
  onCountChange?: (count: number) => void;
}

export interface PendingMentorItem {
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

export default function PendingMentorsView({ onCountChange }: PendingMentorsViewProps) {
  const [mentors, setMentors] = useState<PendingMentorItem[]>([]);
  const [photosMap, setPhotosMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState<number | null>(null);

  // Selected mentor for details modal
  const [selectedMentor, setSelectedMentor] = useState<PendingMentorItem | null>(null);

  // Approve modal state
  const [approvingMentor, setApprovingMentor] = useState<PendingMentorItem | null>(null);

  // Reject modal state
  const [rejectingMentor, setRejectingMentor] = useState<PendingMentorItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  // In-flight action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchPendingMentors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminService.getPendingMentors({
        page,
        limit: 10,
      });

      const list = res.data || [];
      const totalCount = res.meta?.total ?? res.pagination?.total ?? list.length;
      const totalPages = res.meta?.totalPages ?? res.pagination?.totalPages ?? Math.max(1, Math.ceil(totalCount / 10));

      setMentors(list);
      setTotal(totalCount);
      setPages(totalPages);
      onCountChange?.(totalCount);

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
      setError(err instanceof Error ? err.message : "Failed to load pending mentors.");
    } finally {
      setLoading(false);
    }
  }, [page, onCountChange]);

  useEffect(() => {
    fetchPendingMentors();
  }, [fetchPendingMentors]);

  // Escape key handler (disabled while an API call is running)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !actionLoadingId) {
        if (approvingMentor) setApprovingMentor(null);
        else if (rejectingMentor) setRejectingMentor(null);
        else if (selectedMentor) setSelectedMentor(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionLoadingId, approvingMentor, rejectingMentor, selectedMentor]);

  // Confirm Approve
  const handleConfirmApprove = async () => {
    if (!approvingMentor) return;
    setActionLoadingId(approvingMentor.mentorId);
    setActionSuccess(null);
    setError(null);
    try {
      await AdminService.updateMentorStatus(approvingMentor.mentorId, "active");
      const name = approvingMentor.user?.firstName
        ? `${approvingMentor.user.firstName} ${approvingMentor.user.lastName || ""}`.trim()
        : approvingMentor.title;
      setActionSuccess(`Mentor "${name}" approved successfully.`);

      // Optimistically remove from list
      setMentors((prev) => prev.filter((m) => m.mentorId !== approvingMentor.mentorId));
      const newTotal = Math.max(0, (total ?? 1) - 1);
      setTotal(newTotal);
      onCountChange?.(newTotal);

      // Close modals
      if (selectedMentor?.mentorId === approvingMentor.mentorId) {
        setSelectedMentor(null);
      }
      setApprovingMentor(null);

      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve mentor.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Reject Dialog
  const openRejectDialog = (mentor: PendingMentorItem) => {
    setRejectingMentor(mentor);
    setRejectionReason("");
    setRejectError(null);
  };

  // Confirm Reject
  const handleConfirmReject = async () => {
    if (!rejectingMentor) return;
    const trimmed = rejectionReason.trim();
    if (trimmed.length < 5) {
      setRejectError("Rejection reason must be at least 5 characters.");
      return;
    }

    setActionLoadingId(rejectingMentor.mentorId);
    setActionSuccess(null);
    setRejectError(null);
    try {
      await AdminService.updateMentorStatus(rejectingMentor.mentorId, "inactive", trimmed);
      const name = rejectingMentor.user?.firstName
        ? `${rejectingMentor.user.firstName} ${rejectingMentor.user.lastName || ""}`.trim()
        : rejectingMentor.title;
      setActionSuccess(`Mentor "${name}" rejected.`);

      // Optimistically remove from list
      setMentors((prev) => prev.filter((m) => m.mentorId !== rejectingMentor.mentorId));
      const newTotal = Math.max(0, (total ?? 1) - 1);
      setTotal(newTotal);
      onCountChange?.(newTotal);

      // Close modals
      if (selectedMentor?.mentorId === rejectingMentor.mentorId) {
        setSelectedMentor(null);
      }
      setRejectingMentor(null);
      setRejectionReason("");

      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      setRejectError(err instanceof Error ? err.message : "Failed to reject mentor.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter mentors locally by search query
  const filteredMentors = mentors.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${m.user?.firstName || ""} ${m.user?.lastName || ""}`.toLowerCase();
    const title = (m.title || "").toLowerCase();
    const role = (m.experience?.currentRole || "").toLowerCase();
    const domains = (m.domains || []).join(" ").toLowerCase();
    const skills = (m.skills || []).join(" ").toLowerCase();
    return (
      fullName.includes(q) ||
      title.includes(q) ||
      role.includes(q) ||
      domains.includes(q) ||
      skills.includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#ece4db]">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7a6a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, domain, skills..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-[#8a7a6a]">
            Total:{" "}
            <span className="font-bold text-[#4a3728]">
              {total !== null && !error ? total : "—"}
            </span>{" "}
            pending application{total === 1 && !error ? "" : "s"}
          </div>
          <button
            type="button"
            onClick={() => fetchPendingMentors()}
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
            onClick={() => fetchPendingMentors()}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded-md border border-red-300 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 font-medium transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Applications Table */}
      {loading && mentors.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#ece4db] overflow-hidden">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#7a5c3e]" />
          </div>
        </div>
      ) : error && mentors.length === 0 ? null : (
        <div className="bg-white rounded-xl border border-[#ece4db] overflow-hidden">
          {!error && filteredMentors.length === 0 ? (
            <div className="text-center py-16 text-[#8a7a6a] text-sm">
              {searchQuery ? "No matching pending mentors found." : "No pending mentor applications found."}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#ece4db] bg-[#faf6f1] text-[#7a5c3e]">
                  <th className="py-3 px-4 font-semibold">Mentor</th>
                  <th className="py-3 px-4 font-semibold">Current Role</th>
                  <th className="py-3 px-4 font-semibold">Domains & Skills</th>
                  <th className="py-3 px-4 font-semibold">Experience</th>
                  <th className="py-3 px-4 font-semibold">Applied</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece4db]">
                {filteredMentors.map((mentor) => {
                  const isUpdating = actionLoadingId === mentor.mentorId;
                  const fullName = mentor.user?.firstName
                    ? `${mentor.user.firstName} ${mentor.user.lastName || ""}`.trim()
                    : "New Mentor";
                  const initials = fullName
                    .split(" ")
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  const avatarUrl =
                    (mentor.user?.profilePhotoId ? photosMap[mentor.user.profilePhotoId] : null) ||
                    mentor.profilePic ||
                    null;

                  return (
                    <tr key={mentor.mentorId} className="hover:bg-[#fdfbf9] transition-colors">
                      {/* Mentor Identity */}
                      <td className="py-3.5 px-4 align-top">
                        {mentor.userId ? (
                          <Link
                            href={`/mentorship/admin/mentee/${mentor.userId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-left group cursor-pointer rounded-lg p-0.5 -m-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c3e] focus-visible:ring-offset-1"
                            aria-label={`Open mentee profile of ${fullName}`}
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

                      {/* Current Role */}
                      <td className="py-3.5 px-4 align-top max-w-[180px]">
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

                      {/* Domains & Skills */}
                      <td className="py-3.5 px-4 align-top max-w-[220px]">
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

                      {/* Experience */}
                      <td className="py-3.5 px-4 align-top text-[#5c4a3a] whitespace-nowrap">
                        <div className="font-semibold text-[#4a3728]">
                          {mentor.experience?.total ?? 0} yrs
                        </div>
                        {mentor.experience?.level && (
                          <div className="text-[10px] text-[#8a7a6a] capitalize">
                            {mentor.experience.level}
                          </div>
                        )}
                      </td>

                      {/* Applied Date */}
                      <td className="py-3.5 px-4 align-top text-[#8a7a6a] whitespace-nowrap">
                        {mentor.createdAt ? new Date(mentor.createdAt).toLocaleDateString() : "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span
                          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                          style={{ backgroundColor: "#fbf1dc", color: "#b8860b" }}
                        >
                          Pending
                        </span>
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
                            <button
                              type="button"
                              onClick={() => setApprovingMentor(mentor)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                              title="Approve mentor application"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openRejectDialog(mentor)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                              title="Reject mentor application"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
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
                      : "Mentor Application"
                  }
                  initials={
                    (selectedMentor.user?.firstName
                      ? `${selectedMentor.user.firstName} ${selectedMentor.user.lastName || ""}`.trim()
                      : "Mentor Application")
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
                        : "Mentor Application"}
                    </h3>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                      style={{ backgroundColor: "#fbf1dc", color: "#b8860b" }}
                    >
                      Pending Approval
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
              {/* Current Role & Experience */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-[#ece4db] bg-[#fbf7f3]">
                  <div className="flex items-center gap-1.5 text-[#8a7a6a] mb-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Current Role</span>
                  </div>
                  <div className="font-semibold text-[#4a3728] text-sm">
                    {selectedMentor.experience?.currentRole || "—"}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#ece4db] bg-[#fbf7f3]">
                  <div className="flex items-center gap-1.5 text-[#8a7a6a] mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Experience</span>
                  </div>
                  <div className="font-semibold text-[#4a3728] text-sm">
                    {selectedMentor.experience?.total ?? 0} Years ({selectedMentor.experience?.level || "N/A"})
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#ece4db] bg-[#fbf7f3]">
                  <div className="flex items-center gap-1.5 text-[#8a7a6a] mb-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Languages</span>
                  </div>
                  <div className="font-semibold text-[#4a3728] text-sm">
                    {(selectedMentor.languages || ["English"]).join(", ")}
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
                    Target Domains
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

              {/* Social Proof & External Links */}
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

              {/* Verification Documents */}
              <div>
                <h4 className="font-bold text-[#4a3728] mb-1.5 uppercase text-[11px] tracking-wider">
                  Verification Documents
                </h4>
                {(selectedMentor.verification?.verificationDocuments || []).length > 0 ? (
                  <div className="space-y-1">
                    {selectedMentor.verification?.verificationDocuments?.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#2563eb] hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Document #{idx + 1}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#8a7a6a]">No verification documents attached.</p>
                )}
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
                <button
                  type="button"
                  onClick={() => openRejectDialog(selectedMentor)}
                  disabled={actionLoadingId === selectedMentor.mentorId}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Application</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApprovingMentor(selectedMentor)}
                  disabled={actionLoadingId === selectedMentor.mentorId}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve Application</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      {approvingMentor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#ece4db] shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#4a3728]">
                  Approve Application
                </h3>
                <p className="text-xs text-[#8a7a6a] mt-0.5">
                  Mentor:{" "}
                  <span className="font-semibold text-[#4a3728]">
                    {approvingMentor.user?.firstName
                      ? `${approvingMentor.user.firstName} ${approvingMentor.user.lastName || ""}`.trim()
                      : approvingMentor.title}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApprovingMentor(null)}
                className="p-1 rounded-lg hover:bg-[#f3ece4] text-[#8a7a6a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5c4a3a] leading-relaxed">
              Are you sure you want to approve this mentor application? Their status will be updated to{" "}
              <strong className="text-emerald-700">Active</strong>, and their profile will become visible for mentee bookings.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ece4db]">
              <button
                type="button"
                onClick={() => setApprovingMentor(null)}
                disabled={actionLoadingId === approvingMentor.mentorId}
                className="px-3.5 py-1.5 rounded-lg border border-[#e0d8cf] text-[#5c4a3a] hover:bg-[#fbf7f3] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={actionLoadingId === approvingMentor.mentorId}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {actionLoadingId === approvingMentor.mentorId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span>Confirm Approval</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      {rejectingMentor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#ece4db] shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#4a3728]">
                  Reject Application
                </h3>
                <p className="text-xs text-[#8a7a6a] mt-0.5">
                  Mentor:{" "}
                  <span className="font-semibold text-[#4a3728]">
                    {rejectingMentor.user?.firstName
                      ? `${rejectingMentor.user.firstName} ${rejectingMentor.user.lastName || ""}`.trim()
                      : rejectingMentor.title}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectingMentor(null)}
                className="p-1 rounded-lg hover:bg-[#f3ece4] text-[#8a7a6a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {rejectError && (
              <div className="p-2.5 rounded-lg text-xs bg-red-50 text-red-800 border border-red-200">
                {rejectError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#4a3728] mb-1.5">
                Rejection Reason <span className="text-red-500">*</span> (min 5 characters)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this mentor application was rejected (e.g. Incomplete profile details, insufficient experience)..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-[#e0d8cf] bg-[#fbf7f3] text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
              />
              <p className="text-[10px] text-[#8a7a6a] mt-1">
                {rejectionReason.trim().length}/5 characters minimum
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ece4db]">
              <button
                type="button"
                onClick={() => setRejectingMentor(null)}
                disabled={actionLoadingId === rejectingMentor.mentorId}
                className="px-3.5 py-1.5 rounded-lg border border-[#e0d8cf] text-[#5c4a3a] hover:bg-[#fbf7f3] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={
                  rejectionReason.trim().length < 5 ||
                  actionLoadingId === rejectingMentor.mentorId
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoadingId === rejectingMentor.mentorId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
