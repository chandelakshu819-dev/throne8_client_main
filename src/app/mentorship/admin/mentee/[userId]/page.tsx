"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldAlert,
  Briefcase,
  MapPin,
  Loader2,
  ExternalLink,
  Globe,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import AuthService from "@/lib/api/auth.service";
import ProfileService from "@/lib/api/profile.service";
import MentorService from "@/lib/api/mentorship.service";

interface MenteeUserData {
  userId?: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  profilePhotoId?: string;
  coverPhotoId?: string;
  headlineId?: string;
  aboutId?: string;
  preferences?: {
    language?: string;
    timezone?: string;
    websiteUrl?: string;
    website?: string;
  };
  metadata?: {
    lastActiveAt?: string;
  };
}

interface PreviousRole {
  title?: string;
  position?: string;
  company?: string;
  duration?: string;
  location?: string;
  description?: string;
}

interface MenteeApplicationData {
  mentorId?: string;
  userId?: string;
  status?: string;
  title?: string;
  bio?: string;
  domains?: string[];
  skills?: string[];
  languages?: string[];
  profilePic?: string;
  experience?: {
    total?: number;
    level?: string;
    currentRole?: string;
    previousRoles?: PreviousRole[];
  };
  socialProof?: {
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    twitterUrl?: string;
    websiteUrl?: string;
  };
  availability?: {
    timezone?: string;
  };
}

function AdminAccessRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#faf6f1]">
      <div className="max-w-md w-full p-6 rounded-2xl bg-white border border-[#ece4db] text-center space-y-3 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#4a3728]">Admin Access Required</h2>
        <p className="text-xs text-[#8a7a6a]">
          You do not have permission to view this moderation page.
        </p>
        <div className="pt-2">
          <Link
            href="/mentorship/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-[#4a3728] text-white hover:bg-[#38291e] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

interface MenteeProfileCardProps {
  user: MenteeUserData;
  application: MenteeApplicationData | null;
  photoUrl: string | null;
  bannerUrl: string | null;
}

function MenteeProfileCard({ user, application, photoUrl, bannerUrl }: MenteeProfileCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [aboutClamped, setAboutClamped] = useState(false);
  const aboutRef = useRef<HTMLParagraphElement>(null);

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "Mentee Applicant";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "M";

  const headline = application?.title || application?.experience?.currentRole || "";
  const location = user.location;
  const experienceYears = application?.experience?.total;

  const bio = application?.bio || "";
  const skills = application?.skills || [];
  const domains = application?.domains || [];
  const languages = application?.languages || (user.preferences?.language ? [user.preferences.language] : []);
  const timezone = application?.availability?.timezone || user.preferences?.timezone || "";

  const linkedinUrl = application?.socialProof?.linkedinUrl;
  const githubUrl = application?.socialProof?.githubUrl;
  const portfolioUrl = application?.socialProof?.portfolioUrl || application?.socialProof?.websiteUrl;
  const twitterUrl = application?.socialProof?.twitterUrl;

  const previousRoles = application?.experience?.previousRoles || [];

  // Check if about text clamps
  useEffect(() => {
    const el = aboutRef.current;
    if (el) {
      setAboutClamped(el.scrollHeight > el.clientHeight + 1);
    }
  }, [bio, aboutExpanded]);

  const fallbackBanner = "linear-gradient(135deg, #7a5c3e 0%, #4a3728 100%)";

  return (
    <div className="w-full relative rounded-3xl overflow-hidden bg-[#fbf7f3] border border-[#e0d8cf] shadow-[0_20px_60px_rgba(74,55,40,0.12)]">
      {/* Cover Banner */}
      <div
        className="relative h-[120px] transition-colors"
        style={{
          background: bannerUrl ? `url(${bannerUrl}) center/cover` : fallbackBanner,
        }}
      >
        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="absolute top-4 left-4 z-10 inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-lg bg-white/90 hover:bg-white border border-white/60 shadow-sm text-[#4a3728] text-sm font-semibold cursor-pointer backdrop-blur-sm transition-all duration-200 active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Round Avatar Circle */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="relative">
            {photoUrl && !imgError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={photoUrl}
                alt={fullName}
                onError={() => setImgError(true)}
                className="w-24 h-24 rounded-full border-4 border-[#fbf7f3] object-cover bg-white shrink-0"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full border-4 border-[#fbf7f3] flex items-center justify-center text-white font-bold text-2xl shrink-0"
                style={{ background: fallbackBanner }}
              >
                {initials}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details Body */}
      <div className="pt-16 pb-7 px-6 text-center">
        {/* Full Name */}
        <h1 className="text-xl font-bold text-[#4a3728] tracking-tight">{fullName}</h1>

        {/* Headline / Role */}
        {headline && (
          <p className="text-[13px] text-[#7a5c3e] font-medium mt-1 line-clamp-2">{headline}</p>
        )}

        {/* Mentor Application Status Badge */}
        <div className="mt-2.5 mb-2">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#fbf1dc] text-[#b8860b] border border-[#f5dfb8]">
            Mentor Application: Pending Approval
          </span>
        </div>

        {/* Info Pills (Experience & Location) */}
        {(experienceYears != null || location) && (
          <div className="flex flex-wrap items-center justify-center gap-2 my-3">
            {experienceYears != null && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3ece4] border border-[#e0d8cf] text-[12px] font-medium text-[#4a3728]">
                <Briefcase className="w-3.5 h-3.5 text-[#7a5c3e]" />
                <span>
                  {experienceYears} Year{experienceYears === 1 ? "" : "s"} of Experience
                </span>
              </div>
            )}
            {location && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3ece4] border border-[#e0d8cf] text-[12px] font-medium text-[#4a3728]">
                <MapPin className="w-3.5 h-3.5 text-[#7a5c3e]" />
                <span>{location}</span>
              </div>
            )}
          </div>
        )}

        {/* Social / External Links */}
        {(linkedinUrl || githubUrl || portfolioUrl || twitterUrl) && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 mb-5">
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f3ece4] hover:bg-[#eae0d5] border border-[#e0d8cf] text-[#4a3728] text-xs font-semibold transition-colors"
              >
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3 text-[#7a5c3e]" />
              </a>
            )}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f3ece4] hover:bg-[#eae0d5] border border-[#e0d8cf] text-[#4a3728] text-xs font-semibold transition-colors"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 text-[#7a5c3e]" />
              </a>
            )}
            {portfolioUrl && (
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f3ece4] hover:bg-[#eae0d5] border border-[#e0d8cf] text-[#4a3728] text-xs font-semibold transition-colors"
              >
                <Globe className="w-3 h-3 text-[#7a5c3e]" />
                <span>Portfolio</span>
                <ExternalLink className="w-3 h-3 text-[#7a5c3e]" />
              </a>
            )}
            {twitterUrl && (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f3ece4] hover:bg-[#eae0d5] border border-[#e0d8cf] text-[#4a3728] text-xs font-semibold transition-colors"
              >
                <span>Twitter / X</span>
                <ExternalLink className="w-3 h-3 text-[#7a5c3e]" />
              </a>
            )}
          </div>
        )}

        {/* Languages and Timezone */}
        {(languages.length > 0 || timezone) && (
          <div className="flex gap-2.5 mb-5 text-left">
            {languages.length > 0 && (
              <div className="flex-1 rounded-xl p-2.5 bg-[#f3ece4] border border-[#e0d8cf]">
                <div className="text-[10px] text-[#7a5c3e] uppercase font-bold tracking-wider mb-1">
                  Languages
                </div>
                <div className="text-xs text-[#4a3728] font-semibold">
                  {languages.join(", ")}
                </div>
              </div>
            )}
            {timezone && (
              <div className="flex-1 rounded-xl p-2.5 bg-[#f3ece4] border border-[#e0d8cf]">
                <div className="text-[10px] text-[#7a5c3e] uppercase font-bold tracking-wider mb-1">
                  Timezone
                </div>
                <div className="text-xs text-[#4a3728] font-semibold">{timezone}</div>
              </div>
            )}
          </div>
        )}

        {/* Target Domains */}
        {domains.length > 0 && (
          <div className="text-left mb-5">
            <h3 className="font-bold text-[#4a3728] text-xs uppercase tracking-wider mb-2">
              Target Domains
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {domains.map((dom) => (
                <span
                  key={dom}
                  className="px-2.5 py-1 rounded-full bg-[#f3ece4] border border-[#e0d8cf] text-[11px] font-medium text-[#4a3728]"
                >
                  {dom.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skills Tags */}
        {skills.length > 0 && (
          <div className="text-left mb-5">
            <h3 className="font-bold text-[#4a3728] text-xs uppercase tracking-wider mb-2">
              Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-full bg-[#f3ece4] border border-[#e0d8cf] text-[11px] font-medium text-[#4a3728]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Biography / About */}
        {bio && (
          <div className="text-left mb-5">
            <h3 className="font-bold text-[#4a3728] text-xs uppercase tracking-wider mb-2">
              About
            </h3>
            <p
              ref={aboutRef}
              className={`text-[13px] text-[#7a5c3e] leading-relaxed whitespace-pre-line ${
                aboutExpanded ? "" : "line-clamp-4"
              }`}
            >
              {bio}
            </p>
            {aboutClamped && (
              <button
                type="button"
                onClick={() => setAboutExpanded((v) => !v)}
                className="mt-1 text-xs font-bold text-[#4a3728] hover:underline cursor-pointer"
              >
                {aboutExpanded ? "See less" : "See more"}
              </button>
            )}
          </div>
        )}

        {/* Experience Roles */}
        {previousRoles.length > 0 && (
          <div className="text-left">
            <h3 className="font-bold text-[#4a3728] text-xs uppercase tracking-wider mb-2.5">
              Experience History
            </h3>
            <div className="space-y-2">
              {previousRoles.map((role, idx) => (
                <div
                  key={idx}
                  className="rounded-xl p-3 bg-[#f3ece4] border border-[#e0d8cf] text-xs"
                >
                  <div className="font-bold text-[#4a3728]">
                    {role.title || role.position || "Role"}
                  </div>
                  {role.company && (
                    <div className="text-[#7a5c3e] font-medium text-[11px] mt-0.5">
                      {role.company}
                    </div>
                  )}
                  {role.duration && (
                    <div className="text-[#8a7a6a] text-[10px] mt-0.5">{role.duration}</div>
                  )}
                  {role.description && (
                    <div className="text-[#5c4a3a] text-[11px] mt-1 leading-normal">
                      {role.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MenteeAdminProfilePage() {
  const { user: authUser, isLoading: isAuthLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = typeof params?.userId === "string" ? params.userId : "";

  const [menteeUser, setMenteeUser] = useState<MenteeUserData | null>(null);
  const [menteeApp, setMenteeApp] = useState<MenteeApplicationData | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  const [dataLoading, setDataLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const isMountedRef = useRef(true);

  const loadMenteeProfile = useCallback(async () => {
    if (!userId) {
      setErrorMessage("No user ID provided.");
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setErrorMessage(null);
    setNotFound(false);

    try {
      // 1. Fetch user profile data via AuthService (same as /profile/[userId])
      const userRes = await AuthService.getUserProfileById(userId);
      const userData: MenteeUserData = userRes?.data?.user || userRes?.data || userRes?.user || userRes;

      if (!userData || !userData.userId) {
        if (isMountedRef.current) setNotFound(true);
        return;
      }

      if (isMountedRef.current) {
        setMenteeUser(userData);
      }

      // 2. Fetch pending mentor application data via MentorService
      let appData: MenteeApplicationData | null = null;
      try {
        const mentorRes = await MentorService.getMentorByUserId(userId);
        appData = mentorRes?.data ?? mentorRes ?? null;
        if (isMountedRef.current && appData) {
          setMenteeApp(appData);
        }
      } catch {
        // Application may not exist or error, continue with user profile
      }

      // 3. Resolve profile photo URL
      const photoId = userData?.profilePhotoId;
      if (photoId) {
        try {
          const photoRes = await ProfileService.getMultipleProfilePhotosByIds([photoId]);
          const foundPhoto = photoRes?.data?.photos?.[0]?.cloudinarySecureUrl;
          if (isMountedRef.current && foundPhoto) {
            setPhotoUrl(foundPhoto);
          } else if (isMountedRef.current && appData?.profilePic) {
            setPhotoUrl(appData.profilePic);
          }
        } catch {
          if (isMountedRef.current && appData?.profilePic) {
            setPhotoUrl(appData.profilePic);
          }
        }
      } else if (appData?.profilePic && isMountedRef.current) {
        setPhotoUrl(appData.profilePic);
      }

      // 4. Resolve cover photo URL
      const coverId = userData?.coverPhotoId;
      if (coverId) {
        try {
          const coverRes = await ProfileService.getCoverPhotoById(coverId);
          const foundCover = coverRes?.data?.cover?.cloudinarySecureUrl;
          if (isMountedRef.current && foundCover) {
            setBannerUrl(foundCover);
          }
        } catch {
          // Banner fallback gradient will be used
        }
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        const msg = err instanceof Error ? err.message : "Failed to load user profile.";
        if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
          setNotFound(true);
        } else {
          setErrorMessage(msg);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setDataLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    isMountedRef.current = true;
    // Only fetch user profile when auth check passes and user is admin
    if (!isAuthLoading && authUser && authUser.role === "admin") {
      loadMenteeProfile();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [isAuthLoading, authUser, loadMenteeProfile]);

  // Auth Guard: Loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6f1]">
        <div className="text-sm font-semibold text-[#7a5c3e] flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#7a5c3e]" />
          <span>Checking authorization...</span>
        </div>
      </div>
    );
  }

  // Auth Guard: Non-admin access rejected
  if (!authUser || authUser.role !== "admin") {
    return <AdminAccessRequired />;
  }

  return (
    <div className="min-h-screen bg-[#faf6f1]">
      <div className="max-w-[1400px] mx-auto px-4 pt-24 md:pt-28 pb-16">
        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#7a5c3e] mb-3" />
            <span className="text-sm font-semibold text-[#7a5c3e]">
              Loading mentee profile...
            </span>
          </div>
        ) : notFound ? (
          <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white border border-[#ece4db] text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#f3ece4] text-[#7a5c3e] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#4a3728]">Mentee Profile Not Found</h2>
            <p className="text-xs text-[#8a7a6a]">
              No user record was found for ID <code className="text-[#4a3728]">{userId}</code>.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-[#4a3728] text-white hover:bg-[#38291e] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white border border-red-200 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#4a3728]">Unable to Load Profile</h2>
            <p className="text-xs text-red-700">{errorMessage}</p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-[#e0d8cf] text-[#4a3728] hover:bg-[#faf6f1] transition-colors"
              >
                <span>Go Back</span>
              </button>
              <button
                type="button"
                onClick={loadMenteeProfile}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-[#4a3728] text-white hover:bg-[#38291e] transition-colors"
              >
                <span>Try Again</span>
              </button>
            </div>
          </div>
        ) : menteeUser ? (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
            {/* Left Column: Mentee Profile Card */}
            <div className="w-full">
              <MenteeProfileCard
                user={menteeUser}
                application={menteeApp}
                photoUrl={photoUrl}
                bannerUrl={bannerUrl}
              />
            </div>

            {/* Right Column: Blank Panel (matches "Available Services" card style, hidden on mobile) */}
            <div
              className="hidden lg:block bg-white rounded-3xl border border-[#e0d8cf] min-h-[640px] shadow-[0_20px_60px_rgba(74,55,40,0.06)]"
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
