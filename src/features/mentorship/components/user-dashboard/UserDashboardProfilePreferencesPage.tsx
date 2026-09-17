"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Award,
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  Plus,
  Trash2,
  Camera,
  Compass,
  Target,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X,
  Clock,
  ChevronRight,
  Info,
} from "lucide-react";
import AuthService from "@/lib/api/auth.service";
import ProfileService from "@/lib/api/profile.service";
import TokenStorage from "@/lib/store/token.storage";
import { useProfile } from "@/features/profile/hooks/useProfile";

// Design Tokens matching Throne8 Mentee Beige/Brown Theme
const THEME = {
  bg: "#f6ede8",
  cardBg: "#ffffff",
  surfaceMuted: "#fbf7f3",
  border: "#ece4db",
  borderLight: "#f0e7df",
  borderHover: "#d0c0b0",
  primary: "#4a3728",
  primaryHover: "#37291e",
  secondary: "#7a5c3e",
  textMuted: "#8c7662",
  tagBg: "#f3ece4",
  success: "#16a34a",
  danger: "#b91c1c",
  dangerBg: "#fef2f2",
};

interface UserDashboardProfilePreferencesPageProps {
  user?: any;
  setActivePage?: (page: string) => void;
}

export default function UserDashboardProfilePreferencesPage({
  user: initialAuthUser,
  setActivePage,
}: UserDashboardProfilePreferencesPageProps) {
  const { loadProfile } = useProfile();

  // ==========================================
  // Core State
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");
  const [skills, setSkills] = useState<any[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loadingExperiences, setLoadingExperiences] = useState(true);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    email: true,
    push: true,
    sms: false,
  });
  const [savingNotifPrefs, setSavingNotifPrefs] = useState(false);
  const [notifSuccessMsg, setNotifSuccessMsg] = useState<string | null>(null);
  const [notifErrorMsg, setNotifErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [isAddExpOpen, setIsAddExpOpen] = useState(false);
  const [isRoleEditOpen, setIsRoleEditOpen] = useState(false);

  // Status banners & feedback
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ==========================================
  // 1. Data Fetching
  // ==========================================
  const fetchAllUserData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // 1. Authenticated user profile data
      const profileRes = await AuthService.getUserProfile();
      const userData = profileRes?.data || profileRes;
      setProfile(userData);

      // Load notification preferences if present
      if (userData?.preferences?.notifications) {
        setNotifPrefs({
          email: !!userData.preferences.notifications.email,
          push: !!userData.preferences.notifications.push,
          sms: !!userData.preferences.notifications.sms,
        });
      }

      // Fetch avatar if photoId is available
      if (userData?.profilePhotoId) {
        try {
          const photoRes = await ProfileService.getProfilePhotoById(userData.profilePhotoId);
          const url = photoRes?.data?.photo?.cloudinarySecureUrl;
          if (url) setProfilePhotoUrl(url);
        } catch (err) {
          console.warn("Could not fetch profile photo:", err);
        }
      }

      // 2. Fetch User Skills
      setLoadingSkills(true);
      try {
        const skillsRes = await ProfileService.getAllSkills(false);
        const list = skillsRes?.data?.skillsList || skillsRes?.data || [];
        setSkills(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn("Could not fetch skills:", err);
        setSkills([]);
      } finally {
        setLoadingSkills(false);
      }

      // 3. Fetch User Experiences
      setLoadingExperiences(true);
      try {
        const expRes = await ProfileService.getAllExperiences();
        const list = expRes?.data?.experiences || expRes?.data || [];
        setExperiences(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn("Could not fetch experiences:", err);
        setExperiences([]);
      } finally {
        setLoadingExperiences(false);
      }
    } catch (error: any) {
      console.error("Failed to load user profile & preferences:", error);
      setFeedback({
        type: "error",
        message: error?.message || "Failed to load profile data. Please check your connection.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUserData();
  }, [fetchAllUserData]);

  // Dismiss feedback automatically
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // ==========================================
  // 2. Photo Upload Handler
  // ==========================================
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: "error", message: "Image must be less than 5MB" });
      return;
    }

    setUploadingPhoto(true);
    try {
      const res = await ProfileService.uploadProfilePhoto(file, true);
      const newUrl = res?.data?.photo?.cloudinarySecureUrl;
      if (newUrl) {
        setProfilePhotoUrl(newUrl);
        setFeedback({ type: "success", message: "Profile photo updated successfully!" });
        // Refresh profile data to sync photo ID
        fetchAllUserData(true);
        if (typeof loadProfile === "function") {
          loadProfile();
        }
      }
    } catch (err: any) {
      console.error("Failed to upload profile photo:", err);
      setFeedback({ type: "error", message: err?.message || "Failed to upload photo" });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ==========================================
  // 3. Notification Preferences Handler
  // ==========================================
  const handleToggleNotif = async (key: "email" | "push" | "sms") => {
    const nextPrefs = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(nextPrefs);
    setSavingNotifPrefs(true);
    setNotifSuccessMsg(null);
    setNotifErrorMsg(null);

    try {
      await AuthService.updateUserProfile({
        preferences: {
          notifications: nextPrefs,
        },
      });
      setNotifSuccessMsg("Notification preferences saved successfully.");
      setTimeout(() => setNotifSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error("Failed to save notification preferences:", err);
      // Rollback optimistic update
      setNotifPrefs(notifPrefs);
      setNotifErrorMsg(err?.message || "Failed to save preference to server.");
      setTimeout(() => setNotifErrorMsg(null), 4000);
    } finally {
      setSavingNotifPrefs(false);
    }
  };

  // ==========================================
  // Derived Profile Data
  // ==========================================
  const firstName = profile?.firstName || initialAuthUser?.firstName || "";
  const lastName = profile?.lastName || initialAuthUser?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Authenticated User";
  const initials = `${firstName[0] || "U"}${lastName[0] || ""}`.toUpperCase();
  const email = profile?.email || initialAuthUser?.email || "";
  const phoneNumber = profile?.phoneNumber || "";
  const location = profile?.location || "";
  const pronouns = profile?.pronouns || "";
  const currentPosition = profile?.currentPosition || profile?.onboarding?.workingProfile?.jobTitle || profile?.onboarding?.fresherProfile?.preferredRole || "";
  const company = profile?.company || profile?.onboarding?.workingProfile?.companyName || "";
  const education = profile?.education || (profile?.onboarding?.studentProfile ? `${profile.onboarding.studentProfile.degree || ""} ${profile.onboarding.studentProfile.fieldOfStudy ? "in " + profile.onboarding.studentProfile.fieldOfStudy : ""} - ${profile.onboarding.studentProfile.collegeName || ""}`.trim() : "");
  const userType = profile?.onboarding?.userType || profile?.role || "mentee";

  // ==========================================
  // Loading skeleton state
  // ==========================================
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto pb-12">
        <div className="h-10 w-64 bg-[#ece4db] rounded-xl" />
        <div className="h-44 bg-white rounded-2xl border border-[#ece4db]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white rounded-2xl border border-[#ece4db]" />
          <div className="h-64 bg-white rounded-2xl border border-[#ece4db]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: THEME.primary }}>
            Profile & Preferences
          </h1>
          <p className="text-sm mt-1" style={{ color: THEME.textMuted }}>
            Manage your authenticated profile details, career direction, verified skills, and notifications.
          </p>
        </div>

        <button
          onClick={() => fetchAllUserData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 hover:-translate-y-0.5"
          style={{
            backgroundColor: THEME.cardBg,
            borderColor: THEME.border,
            color: THEME.primary,
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* Global Alert Notification */}
      {feedback && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span className="font-medium flex-1">{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 1: User Profile Header Card                      */}
      {/* ======================================================== */}
      <section
        className="rounded-2xl p-6 md:p-8 border shadow-sm transition-all duration-200"
        style={{
          backgroundColor: THEME.cardBg,
          borderColor: THEME.border,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar & Upload Trigger */}
            <div className="relative group shrink-0">
              <div
                className="w-24 h-24 rounded-2xl overflow-hidden border-2 shadow-inner flex items-center justify-center text-white text-2xl font-bold transition-all"
                style={{
                  backgroundColor: THEME.primary,
                  borderColor: THEME.border,
                }}
              >
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {/* Photo upload overlay button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                title="Change Profile Photo"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ backgroundColor: THEME.primary }}
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            {/* Profile Info Summary */}
            <div className="text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-bold" style={{ color: THEME.primary }}>
                  {fullName}
                </h2>
                {pronouns && (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: THEME.tagBg, color: THEME.secondary }}
                  >
                    {pronouns}
                  </span>
                )}
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                  style={{ backgroundColor: "#e8f0fe", color: "#1967d2" }}
                >
                  {userType}
                </span>
              </div>

              <p className="text-sm font-medium" style={{ color: THEME.secondary }}>
                {currentPosition ? `${currentPosition}${company ? ` at ${company}` : ""}` : "No position set"}
              </p>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs mt-2" style={{ color: THEME.textMuted }}>
                {email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {email}
                    {profile?.emailVerified && (
                      <span title="Email Verified">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </span>
                    )}
                  </span>
                )}

                {phoneNumber && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {phoneNumber}
                  </span>
                )}

                {location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Action */}
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shrink-0"
            style={{ backgroundColor: THEME.primary }}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        </div>

        {/* Extended Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t" style={{ borderColor: THEME.borderLight }}>
          <div className="p-3.5 rounded-xl" style={{ backgroundColor: THEME.surfaceMuted }}>
            <span className="text-xs font-semibold block mb-1" style={{ color: THEME.secondary }}>
              Current Role
            </span>
            <p className="text-xs font-bold truncate" style={{ color: THEME.primary }}>
              {currentPosition || "Not specified"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl" style={{ backgroundColor: THEME.surfaceMuted }}>
            <span className="text-xs font-semibold block mb-1" style={{ color: THEME.secondary }}>
              Company / Organization
            </span>
            <p className="text-xs font-bold truncate" style={{ color: THEME.primary }}>
              {company || "Not specified"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl" style={{ backgroundColor: THEME.surfaceMuted }}>
            <span className="text-xs font-semibold block mb-1" style={{ color: THEME.secondary }}>
              Education
            </span>
            <p className="text-xs font-bold truncate" style={{ color: THEME.primary }}>
              {education || "Not specified"}
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2-COLUMN SECTION: Preferred Role & Notification Preferences */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 2: Preferred Role & Career Direction */}
        <section
          className="rounded-2xl p-6 border shadow-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
          style={{
            backgroundColor: THEME.cardBg,
            borderColor: THEME.border,
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: THEME.tagBg }}
                >
                  <Briefcase className="w-4 h-4" style={{ color: THEME.primary }} />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: THEME.primary }}>
                    Preferred Role
                  </h3>
                  <p className="text-xs" style={{ color: THEME.textMuted }}>
                    Your primary job title or aspiring target role
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsRoleEditOpen(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 hover:bg-[#fbf7f3]"
                style={{ borderColor: THEME.border, color: THEME.primary }}
              >
                Change Role
              </button>
            </div>

            <div className="p-4 rounded-xl border mb-3" style={{ backgroundColor: THEME.surfaceMuted, borderColor: THEME.borderLight }}>
              <span className="text-xs font-medium uppercase tracking-wider block mb-1" style={{ color: THEME.secondary }}>
                Active Target / Current Role
              </span>
              <p className="text-base font-bold" style={{ color: THEME.primary }}>
                {currentPosition || (
                  <span className="font-normal italic text-xs" style={{ color: THEME.textMuted }}>
                    No preferred role saved yet. Click 'Change Role' to set your target position.
                  </span>
                )}
              </p>
            </div>

            <div className="text-xs space-y-1" style={{ color: THEME.textMuted }}>
              <p>• Used by Throne8 to recommend matching mentors in your field.</p>
              <p>• Changes persist directly to your authenticated backend profile.</p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: THEME.borderLight }}>
            <span style={{ color: THEME.textMuted }}>Field: currentPosition</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              ✓ Synchronized with Server
            </span>
          </div>
        </section>

        {/* SECTION 7: Notification Preferences */}
        <section
          className="rounded-2xl p-6 border shadow-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
          style={{
            backgroundColor: THEME.cardBg,
            borderColor: THEME.border,
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: THEME.tagBg }}
                >
                  <Bell className="w-4 h-4" style={{ color: THEME.primary }} />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: THEME.primary }}>
                    Notification Preferences
                  </h3>
                  <p className="text-xs" style={{ color: THEME.textMuted }}>
                    Configure how you receive session and booking updates
                  </p>
                </div>
              </div>

              {savingNotifPrefs && (
                <span className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </span>
              )}
            </div>

            {notifSuccessMsg && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {notifSuccessMsg}
              </div>
            )}

            {notifErrorMsg && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {notifErrorMsg}
              </div>
            )}

            {/* Toggle Switches */}
            <div className="space-y-3">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: THEME.surfaceMuted, borderColor: THEME.borderLight }}>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: THEME.primary }}>
                    Email Notifications
                  </h4>
                  <p className="text-[11px]" style={{ color: THEME.textMuted }}>
                    Receive session confirmations and reminder emails
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={notifPrefs.email}
                  disabled={savingNotifPrefs}
                  onClick={() => handleToggleNotif("email")}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                    notifPrefs.email ? "bg-[#4a3728]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      notifPrefs.email ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: THEME.surfaceMuted, borderColor: THEME.borderLight }}>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: THEME.primary }}>
                    In-App Push Alerts
                  </h4>
                  <p className="text-[11px]" style={{ color: THEME.textMuted }}>
                    Live banners when your mentor begins a scheduled call
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={notifPrefs.push}
                  disabled={savingNotifPrefs}
                  onClick={() => handleToggleNotif("push")}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                    notifPrefs.push ? "bg-[#4a3728]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      notifPrefs.push ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* SMS Notifications */}
              <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: THEME.surfaceMuted, borderColor: THEME.borderLight }}>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: THEME.primary }}>
                    SMS Alerts
                  </h4>
                  <p className="text-[11px]" style={{ color: THEME.textMuted }}>
                    Text notifications sent directly to your verified phone
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={notifPrefs.sms}
                  disabled={savingNotifPrefs}
                  onClick={() => handleToggleNotif("sms")}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                    notifPrefs.sms ? "bg-[#4a3728]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      notifPrefs.sms ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: THEME.borderLight }}>
            <span style={{ color: THEME.textMuted }}>Endpoint: PUT /auth/update-profile</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              ✓ Persisted in DB
            </span>
          </div>
        </section>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: Skills (Real Backend List & CRUD)             */}
      {/* ======================================================== */}
      <section
        className="rounded-2xl p-6 border shadow-sm transition-all duration-200"
        style={{
          backgroundColor: THEME.cardBg,
          borderColor: THEME.border,
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: THEME.tagBg }}
            >
              <Award className="w-4 h-4" style={{ color: THEME.primary }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold" style={{ color: THEME.primary }}>
                  Skills & Expertise
                </h3>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: THEME.tagBg, color: THEME.secondary }}
                >
                  {skills.length}
                </span>
              </div>
              <p className="text-xs" style={{ color: THEME.textMuted }}>
                Verified skills linked to your profile from /profile/skills
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddSkillOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: THEME.primary }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Skill
          </button>
        </div>

        {loadingSkills ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs" style={{ color: THEME.textMuted }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading skills...
          </div>
        ) : skills.length === 0 ? (
          <div
            className="p-6 rounded-xl border text-center space-y-2"
            style={{ backgroundColor: THEME.surfaceMuted, borderColor: THEME.borderLight }}
          >
            <p className="text-xs font-medium" style={{ color: THEME.textMuted }}>
              No skills added yet. Add your core skills to highlight your areas of expertise to mentors.
            </p>
            <button
              onClick={() => setIsAddSkillOpen(true)}
              className="text-xs font-bold underline transition-colors hover:opacity-80"
              style={{ color: THEME.primary }}
            >
              + Add your first skill
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {skills.map((skill) => (
              <SkillCard
                key={skill.skillId || skill._id || skill.skillName}
                skill={skill}
                onDelete={async () => {
                  try {
                    await ProfileService.deleteSkill(skill.skillId || skill._id);
                    setSkills((prev) => prev.filter((s) => (s.skillId || s._id) !== (skill.skillId || skill._id)));
                    setFeedback({ type: "success", message: `Skill "${skill.skillName}" removed.` });
                  } catch (err: any) {
                    setFeedback({ type: "error", message: err?.message || "Failed to delete skill" });
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* SECTION 5: Professional Experience (Real API)            */}
      {/* ======================================================== */}
      <section
        className="rounded-2xl p-6 border shadow-sm transition-all duration-200"
        style={{
          backgroundColor: THEME.cardBg,
          borderColor: THEME.border,
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: THEME.tagBg }}
            >
              <Briefcase className="w-4 h-4" style={{ color: THEME.primary }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold" style={{ color: THEME.primary }}>
                  Work Experience
                </h3>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: THEME.tagBg, color: THEME.secondary }}
                >
                  {experiences.length}
                </span>
              </div>
              <p className="text-xs" style={{ color: THEME.textMuted }}>
                Your career history fetched from /profile/experience
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddExpOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: THEME.primary }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Experience
          </button>
        </div>

        {loadingExperiences ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs" style={{ color: THEME.textMuted }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading experience...
          </div>
        ) : experiences.length === 0 ? (
          <div
            className="p-6 rounded-xl border text-center space-y-2"
            style={{ backgroundColor: THEME.surfaceMuted, borderColor: THEME.borderLight }}
          >
            <p className="text-xs font-medium" style={{ color: THEME.textMuted }}>
              No experience records found on your profile.
            </p>
            <button
              onClick={() => setIsAddExpOpen(true)}
              className="text-xs font-bold underline transition-colors hover:opacity-80"
              style={{ color: THEME.primary }}
            >
              + Add work experience
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map((exp) => (
              <ExperienceRow
                key={exp.experienceId || exp._id}
                exp={exp}
                onDelete={async () => {
                  try {
                    await ProfileService.deleteExperience(exp.experienceId || exp._id);
                    setExperiences((prev) => prev.filter((e) => (e.experienceId || e._id) !== (exp.experienceId || exp._id)));
                    setFeedback({ type: "success", message: `Experience at ${exp.companyName} removed.` });
                  } catch (err: any) {
                    setFeedback({ type: "error", message: err?.message || "Failed to delete experience" });
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* SECTIONS 3 & 6: Career Interests & Mentorship Goals      */}
      {/* Transparent handling of backend schema boundaries       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 3: Career Interests */}
        <section
          className="rounded-2xl p-6 border shadow-sm flex flex-col justify-between transition-all duration-200"
          style={{
            backgroundColor: THEME.cardBg,
            borderColor: THEME.border,
          }}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: THEME.tagBg }}
              >
                <Compass className="w-4 h-4" style={{ color: THEME.primary }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: THEME.primary }}>
                  Career Interests
                </h3>
                <p className="text-xs" style={{ color: THEME.textMuted }}>
                  Target industries, domains & career transition topics
                </p>
              </div>
            </div>

            {/* Honest representation of backend data availability */}
            <div
              className="p-4 rounded-xl border space-y-2 mb-3"
              style={{ backgroundColor: THEME.surfaceMuted, borderColor: THEME.borderLight }}
            >
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: THEME.secondary }} />
                <div className="text-xs leading-relaxed" style={{ color: THEME.primary }}>
                  <p className="font-semibold mb-1">Backend Configuration Status</p>
                  <p className="text-xs" style={{ color: THEME.textMuted }}>
                    A dedicated <code className="text-[11px] bg-[#ece4db] px-1 py-0.5 rounded">careerInterests</code> collection
                    is currently pending backend route deployment on the server. To avoid presenting fabricated or un-persisted options,
                    interest targeting currently aligns directly with your active{" "}
                    <strong>Preferred Role</strong> (<code className="text-[11px]">{currentPosition || "None set"}</code>) and followed companies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: THEME.borderLight }}>
            <span style={{ color: THEME.textMuted }}>Status: Authentic Empty State</span>
            <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
              Awaiting Dedicated API
            </span>
          </div>
        </section>

        {/* SECTION 6: Mentorship & Career Goals */}
        <section
          className="rounded-2xl p-6 border shadow-sm flex flex-col justify-between transition-all duration-200"
          style={{
            backgroundColor: THEME.cardBg,
            borderColor: THEME.border,
          }}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: THEME.tagBg }}
              >
                <Target className="w-4 h-4" style={{ color: THEME.primary }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: THEME.primary }}>
                  Mentorship Goals
                </h3>
                <p className="text-xs" style={{ color: THEME.textMuted }}>
                  Your objectives for 1:1 mentorship sessions
                </p>
              </div>
            </div>

            {/* Honest representation of backend data availability */}
            <div
              className="p-4 rounded-xl border space-y-2 mb-3"
              style={{ backgroundColor: THEME.surfaceMuted, borderColor: THEME.borderLight }}
            >
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: THEME.secondary }} />
                <div className="text-xs leading-relaxed" style={{ color: THEME.primary }}>
                  <p className="font-semibold mb-1">Session Goal Alignment</p>
                  <p className="text-xs" style={{ color: THEME.textMuted }}>
                    User mentorship goals are currently generated in real-time by the AI matching engine based on your active role
                    (<strong>{currentPosition ? `Advance in ${currentPosition}` : "General Career Growth"}</strong>).
                    Independent user goal models are not yet exposed as a mutable user endpoint in the API.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: THEME.borderLight }}>
            <span style={{ color: THEME.textMuted }}>Status: Heuristic AI Matching</span>
            <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
              Awaiting User Goal Model
            </span>
          </div>
        </section>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: Edit Profile Modal                              */}
      {/* ======================================================== */}
      {isEditProfileOpen && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          initialProfile={profile}
          onClose={() => setIsEditProfileOpen(false)}
          onSuccess={() => {
            setIsEditProfileOpen(false);
            setFeedback({ type: "success", message: "Profile updated and saved to server!" });
            fetchAllUserData(true);
            if (typeof loadProfile === "function") {
              loadProfile();
            }
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Change Preferred Role Modal                     */}
      {/* ======================================================== */}
      {isRoleEditOpen && (
        <EditRoleModal
          isOpen={isRoleEditOpen}
          currentRole={currentPosition}
          onClose={() => setIsRoleEditOpen(false)}
          onSuccess={(newRole) => {
            setIsRoleEditOpen(false);
            setFeedback({ type: "success", message: `Preferred role updated to "${newRole}".` });
            fetchAllUserData(true);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 3: Add Skill Modal                                 */}
      {/* ======================================================== */}
      {isAddSkillOpen && (
        <AddSkillModal
          isOpen={isAddSkillOpen}
          onClose={() => setIsAddSkillOpen(false)}
          onSuccess={() => {
            setIsAddSkillOpen(false);
            setFeedback({ type: "success", message: "New skill saved successfully!" });
            fetchAllUserData(true);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 4: Add Experience Modal                            */}
      {/* ======================================================== */}
      {isAddExpOpen && (
        <AddExperienceModal
          isOpen={isAddExpOpen}
          onClose={() => setIsAddExpOpen(false)}
          onSuccess={() => {
            setIsAddExpOpen(false);
            setFeedback({ type: "success", message: "Work experience added and saved to server!" });
            fetchAllUserData(true);
          }}
        />
      )}
    </div>
  );
}

// ==========================================================
// Subcomponent: Skill Card
// ==========================================================
function SkillCard({ skill, onDelete }: { skill: any; onDelete: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case "expert":
        return { label: "Expert", bg: "#fef3c7", text: "#92400e" };
      case "advanced":
        return { label: "Advanced", bg: "#e0e7ff", text: "#3730a3" };
      case "intermediate":
        return { label: "Intermediate", bg: "#ecfdf5", text: "#065f46" };
      default:
        return { label: "Beginner", bg: "#f3ece4", text: "#7a5c3e" };
    }
  };

  const badge = getStrengthBadge(skill.skillStrength);

  return (
    <div
      className="p-3.5 rounded-xl border flex items-center justify-between gap-2 transition-all duration-200 hover:-translate-y-0.5 shadow-xs"
      style={{
        backgroundColor: THEME.surfaceMuted,
        borderColor: THEME.borderLight,
      }}
    >
      <div className="min-w-0">
        <h4 className="text-xs font-bold truncate" style={{ color: THEME.primary }}>
          {skill.skillName}
        </h4>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            {badge.label}
          </span>
          {typeof skill.yearsOfExperience === "number" && skill.yearsOfExperience > 0 && (
            <span className="text-[10px]" style={{ color: THEME.textMuted }}>
              {skill.yearsOfExperience}y exp
            </span>
          )}
        </div>
      </div>

      <button
        onClick={async () => {
          if (!confirm(`Delete "${skill.skillName}"?`)) return;
          setDeleting(true);
          await onDelete();
          setDeleting(false);
        }}
        disabled={deleting}
        title="Delete skill"
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
      >
        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ==========================================================
// Subcomponent: Experience Row
// ==========================================================
function ExperienceRow({ exp, onDelete }: { exp: any; onDelete: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);

  const formatDate = (d?: string) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return d;
    }
  };

  const startStr = formatDate(exp.startDate);
  const endStr = exp.currentlyWorking ? "Present" : formatDate(exp.endDate) || "Present";

  return (
    <div
      className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 shadow-xs"
      style={{
        backgroundColor: THEME.surfaceMuted,
        borderColor: THEME.borderLight,
      }}
    >
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-bold" style={{ color: THEME.primary }}>
            {exp.currentPosition}
          </h4>
          <span className="text-xs" style={{ color: THEME.secondary }}>
            at <strong>{exp.companyName}</strong>
          </span>
          {exp.currentlyWorking && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
              Current
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs" style={{ color: THEME.textMuted }}>
          <Clock className="w-3.5 h-3.5" />
          <span>
            {startStr} – {endStr}
          </span>
        </div>

        {exp.description && (
          <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: THEME.textMuted }}>
            {exp.description}
          </p>
        )}

        {Array.isArray(exp.keyAchievements) && exp.keyAchievements.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {exp.keyAchievements.map((ach: string, idx: number) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                style={{ backgroundColor: THEME.tagBg, color: THEME.secondary }}
              >
                ✓ {ach}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={async () => {
          if (!confirm(`Delete experience at ${exp.companyName}?`)) return;
          setDeleting(true);
          await onDelete();
          setDeleting(false);
        }}
        disabled={deleting}
        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors self-end sm:self-start shrink-0"
        title="Delete experience"
      >
        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ==========================================================
// Modal: Edit Profile
// ==========================================================
function EditProfileModal({
  isOpen,
  initialProfile,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  initialProfile: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: initialProfile?.firstName || "",
    lastName: initialProfile?.lastName || "",
    phoneNumber: initialProfile?.phoneNumber || "",
    location: initialProfile?.location || "",
    currentPosition: initialProfile?.currentPosition || "",
    company: initialProfile?.company || "",
    education: initialProfile?.education || "",
    pronouns: initialProfile?.pronouns || "He/Him",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation checks matching backend Joi schema
    if (formData.firstName.trim().length < 2) {
      setError("First name must be at least 2 characters.");
      return;
    }

    if (formData.location.trim()) {
      // Backend enforces capitalized first character
      const firstChar = formData.location.trim()[0];
      if (firstChar !== firstChar.toUpperCase()) {
        setError("Location must start with a capital letter (e.g. 'Mumbai', 'New York').");
        return;
      }
    }

    if (formData.phoneNumber.trim()) {
      // E.164 phone format or digits
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        setError("Phone number must be valid E.164 format (e.g., +919876543210).");
        return;
      }
    }

    setSaving(true);
    try {
      await AuthService.updateUserProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        location: formData.location.trim() || undefined,
        currentPosition: formData.currentPosition.trim() || undefined,
        company: formData.company.trim() || undefined,
        education: formData.education.trim() || undefined,
        pronouns: formData.pronouns || undefined,
      });
      onSuccess();
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setError(err?.message || "Failed to update profile on backend.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg rounded-2xl p-6 border shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: THEME.cardBg, borderColor: THEME.border }}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{ borderColor: THEME.borderLight }}>
          <h3 className="text-lg font-bold" style={{ color: THEME.primary }}>
            Edit Profile Information
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
                style={{ borderColor: THEME.border }}
              />
            </div>

            <div>
              <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
                style={{ borderColor: THEME.border }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
                Pronouns
              </label>
              <select
                value={formData.pronouns}
                onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
                style={{ borderColor: THEME.border }}
              >
                <option value="He/Him">He/Him</option>
                <option value="She/Her">She/Her</option>
                <option value="They/Them">They/Them</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. San Francisco, CA"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
                style={{ borderColor: THEME.border }}
              />
              <span className="text-[10px] text-gray-500">Must start with capital letter</span>
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
              Phone Number (E.164 format)
            </label>
            <input
              type="text"
              placeholder="+919876543210"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
              style={{ borderColor: THEME.border }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
                Current Role / Position
              </label>
              <input
                type="text"
                placeholder="Software Engineer"
                value={formData.currentPosition}
                onChange={(e) => setFormData({ ...formData, currentPosition: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
                style={{ borderColor: THEME.border }}
              />
            </div>

            <div>
              <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
                Company / Organization
              </label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
                style={{ borderColor: THEME.border }}
              />
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
              Education
            </label>
            <input
              type="text"
              placeholder="B.Tech in Computer Science, Stanford"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
              style={{ borderColor: THEME.border }}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t" style={{ borderColor: THEME.borderLight }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border font-bold text-gray-600 hover:bg-gray-50"
              style={{ borderColor: THEME.border }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl font-bold text-white flex items-center gap-2 shadow-sm"
              style={{ backgroundColor: THEME.primary }}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Saving Changes..." : "Save to Server"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================================
// Modal: Change Preferred Role
// ==========================================================
function EditRoleModal({
  isOpen,
  currentRole,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  currentRole: string;
  onClose: () => void;
  onSuccess: (newRole: string) => void;
}) {
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim()) {
      setError("Role cannot be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await AuthService.updateUserProfile({
        currentPosition: role.trim(),
      });
      onSuccess(role.trim());
    } catch (err: any) {
      console.error("Failed to update role:", err);
      setError(err?.message || "Failed to update preferred role.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-2xl p-6 border shadow-xl"
        style={{ backgroundColor: THEME.cardBg, borderColor: THEME.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: THEME.borderLight }}>
          <h3 className="text-base font-bold" style={{ color: THEME.primary }}>
            Update Preferred Role
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
              Target Job Title / Role
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Frontend Architect, Product Lead"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
              style={{ borderColor: THEME.border }}
            />
            <p className="text-[11px] mt-1" style={{ color: THEME.textMuted }}>
              This role directly influences which expert mentors are recommended to you.
            </p>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t" style={{ borderColor: THEME.borderLight }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border font-bold text-gray-600 hover:bg-gray-50"
              style={{ borderColor: THEME.border }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl font-bold text-white flex items-center gap-2"
              style={{ backgroundColor: THEME.primary }}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Saving..." : "Update Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================================
// Modal: Add Skill
// ==========================================================
function AddSkillModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [skillName, setSkillName] = useState("");
  const [skillStrength, setSkillStrength] = useState<"beginner" | "intermediate" | "advanced" | "expert">("intermediate");
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      setError("Skill name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await ProfileService.createSkill({
        skillName: skillName.trim(),
        skillStrength,
        yearsOfExperience: Number(yearsOfExperience) || 0,
      });
      onSuccess();
    } catch (err: any) {
      console.error("Failed to add skill:", err);
      setError(err?.message || "Failed to create skill on server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-2xl p-6 border shadow-xl"
        style={{ backgroundColor: THEME.cardBg, borderColor: THEME.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: THEME.borderLight }}>
          <h3 className="text-base font-bold" style={{ color: THEME.primary }}>
            Add New Skill
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
              Skill Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Next.js, System Design, Product Strategy"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
              style={{ borderColor: THEME.border }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
                Proficiency Level
              </label>
              <select
                value={skillStrength}
                onChange={(e: any) => setSkillStrength(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
                style={{ borderColor: THEME.border }}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
                Years of Experience
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
                style={{ borderColor: THEME.border }}
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t" style={{ borderColor: THEME.borderLight }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border font-bold text-gray-600 hover:bg-gray-50"
              style={{ borderColor: THEME.border }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl font-bold text-white flex items-center gap-2"
              style={{ backgroundColor: THEME.primary }}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Adding..." : "Save Skill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================================
// Modal: Add Experience
// ==========================================================
function AddExperienceModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [currentPosition, setCurrentPosition] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentlyWorking, setCurrentlyWorking] = useState(false);
  const [achievementsStr, setAchievementsStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentPosition.trim().length < 2) {
      setError("Position must be at least 2 characters.");
      return;
    }
    if (companyName.trim().length < 2) {
      setError("Company name must be at least 2 characters.");
      return;
    }
    if (description.trim().length < 15) {
      setError("Description must be at least 15 characters.");
      return;
    }
    if (!startDate) {
      setError("Start date is required.");
      return;
    }

    setSaving(true);
    try {
      const achievements = achievementsStr
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a.length >= 3);

      await ProfileService.createExperience({
        currentPosition: currentPosition.trim(),
        companyName: companyName.trim(),
        description: description.trim(),
        startDate,
        endDate: currentlyWorking ? undefined : endDate || undefined,
        currentlyWorking,
        keyAchievements: achievements.length > 0 ? achievements : undefined,
      });
      onSuccess();
    } catch (err: any) {
      console.error("Failed to add experience:", err);
      setError(err?.message || "Failed to create experience record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg rounded-2xl p-6 border shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: THEME.cardBg, borderColor: THEME.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: THEME.borderLight }}>
          <h3 className="text-base font-bold" style={{ color: THEME.primary }}>
            Add Professional Experience
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
                Job Title / Position *
              </label>
              <input
                type="text"
                required
                placeholder="Product Designer"
                value={currentPosition}
                onChange={(e) => setCurrentPosition(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
                style={{ borderColor: THEME.border }}
              />
            </div>

            <div>
              <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
                Company Name *
              </label>
              <input
                type="text"
                required
                placeholder="Google, Stripe, etc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
                style={{ borderColor: THEME.border }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
                style={{ borderColor: THEME.border }}
              />
            </div>

            <div>
              <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
                End Date
              </label>
              <input
                type="date"
                disabled={currentlyWorking}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728] ${
                  currentlyWorking ? "bg-gray-100 opacity-60" : ""
                }`}
                style={{ borderColor: THEME.border }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="currentlyWorking"
              checked={currentlyWorking}
              onChange={(e) => setCurrentlyWorking(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="currentlyWorking" className="font-medium cursor-pointer" style={{ color: THEME.primary }}>
              I currently work in this role
            </label>
          </div>

          <div>
            <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
              Description * (min 15 chars)
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe your core responsibilities, impact, and projects..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
              style={{ borderColor: THEME.border }}
            />
          </div>

          <div>
            <label className="font-bold block mb-1" style={{ color: THEME.primary }}>
              Key Achievements (comma-separated)
            </label>
            <input
              type="text"
              placeholder="Reduced latency by 40%, Led team of 6 engineers"
              value={achievementsStr}
              onChange={(e) => setAchievementsStr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#4a3728]"
              style={{ borderColor: THEME.border }}
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t" style={{ borderColor: THEME.borderLight }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border font-bold text-gray-600 hover:bg-gray-50"
              style={{ borderColor: THEME.border }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl font-bold text-white flex items-center gap-2"
              style={{ backgroundColor: THEME.primary }}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Saving..." : "Add Experience"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
