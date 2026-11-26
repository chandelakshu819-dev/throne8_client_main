"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, GraduationCap, Landmark } from "lucide-react";
import MentorService, { PublicSeniorMentor } from "@/lib/api/mentorship.service";
import SeniorSessionService, { SeniorDiscoverySession } from "@/lib/api/seniorSession.service";
import AuthService from "@/lib/api/auth.service";
import { GlobalStyles, Navigation } from "@/features/index";
import { useAuth } from "@/features/auth/hooks/useAuth";
import ServiceThumbnail from "@/features/mentorship/components/shared/ServiceThumbnail";
import { useMyCollegeMentorIds } from "@/features/mentorship/hooks/useMyCollegeMentorIds";
import { buildLoginRedirectUrl } from "@/shared/utils/safeRedirect";

type LoadStatus = "loading" | "success" | "error";

function displayLabel(value: string): string {
    return value
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function ProfileAvatar({ profile }: { profile: PublicSeniorMentor }) {
    const [imageFailed, setImageFailed] = useState(false);
    const initials = profile.displayName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "M";

    return (
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#f4ece1] shadow-md sm:h-24 sm:w-24">
            {profile.profilePic && !imageFailed ? (
                <img
                    src={profile.profilePic}
                    alt={profile.displayName}
                    onError={() => setImageFailed(true)}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#4a3728]">
                    {initials}
                </div>
            )}
        </div>
    );
}

export default function SeniorMentorPublicProfilePage() {
    const params = useParams<{ mentorId: string }>();
    const mentorId = typeof params.mentorId === "string" ? params.mentorId : "";
    const router = useRouter();
    const { user } = useAuth();
    const [profile, setProfile] = useState<PublicSeniorMentor | null>(null);
    const [profileStatus, setProfileStatus] = useState<LoadStatus>("loading");
    const [profileNotFound, setProfileNotFound] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [sessions, setSessions] = useState<SeniorDiscoverySession[]>([]);
    const [sessionsStatus, setSessionsStatus] = useState<LoadStatus>("loading");
    const [sessionsError, setSessionsError] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    // Owner khud ki public page khole to usse apni College Mentor profile par bhejo.
    // URL ka mentorId mere College Mentor ids mein ho, ya profile.userId == meri userId.
    const myCollegeMentorIds = useMyCollegeMentorIds(Boolean(user?.userId));
    useEffect(() => {
        if (!user?.userId || !mentorId) return;
        const isOwnProfile =
            myCollegeMentorIds.has(String(mentorId)) ||
            (!!profile?.userId && String(profile.userId) === String(user.userId));
        if (isOwnProfile) {
            router.replace(`/mentorship/senior-mentor-profile/${user.userId}`);
        }
    }, [myCollegeMentorIds, profile?.userId, user?.userId, mentorId, router]);

    const loadProfile = useCallback(async () => {
        setProfileStatus("loading");
        setProfileError("");
        setProfileNotFound(false);
        try {
            const result = await MentorService.getPublicSeniorMentor(mentorId);
            if (!result) {
                setProfile(null);
                setProfileNotFound(true);
            } else {
                setProfile(result);
            }
            setProfileStatus("success");
        } catch (error) {
            setProfileError(error instanceof Error ? error.message : "Failed to load this mentor profile.");
            setProfileStatus("error");
        }
    }, [mentorId]);

    const loadSessions = useCallback(async () => {
        setSessionsStatus("loading");
        setSessionsError("");
        try {
            const response = await SeniorSessionService.getDiscoverySessionsByMentor(mentorId);
            const eligibleSessions = response.filter(
                (session) =>
                    session.mentorId === mentorId &&
                    session.sessionType === "one_to_one" &&
                    session.status !== "cancelled"
            );
            // NOTE: Services ko mentor ki availability se filter NAHI karte.
            // Mentor ne availability set ki ho ya na ho, uski saari active
            // one-to-one services dikhni chahiye. Slot selection calendar step
            // (/book page) mein hota hai, wahan "no availability" message aata hai.
            setSessions(eligibleSessions);
            setSessionsStatus("success");
        } catch (error) {
            setSessionsError(error instanceof Error ? error.message : "Failed to load available sessions.");
            setSessionsStatus("error");
        }
    }, [mentorId]);

    useEffect(() => {
        if (!mentorId) return;
        void loadProfile();
        void loadSessions();
    }, [mentorId, loadProfile, loadSessions]);

    const categories = useMemo(
        () => Array.from(new Set(sessions.map((session) => session.category?.trim()).filter(
            (category): category is string => Boolean(category)
        ))),
        [sessions]
    );
    const visibleSessions = useMemo(
        () => activeCategory === "All"
            ? sessions
            : sessions.filter((session) => session.category?.trim() === activeCategory),
        [activeCategory, sessions]
    );

    if (profileNotFound) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FAF9F6] px-6 text-center">
                <GlobalStyles />
                <h1 className="text-2xl font-bold text-[#2d2015]">Mentor not found</h1>
                <p className="text-sm text-[#8b7355]">This mentor is unavailable or is no longer approved.</p>
                <button
                    type="button"
                    onClick={() => router.push("/mentorship")}
                    className="rounded-xl bg-[#4a3728] px-5 py-3 text-sm font-bold text-white"
                >
                    Back to mentorship
                </button>
            </main>
        );
    }

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF9F6] pb-24 text-[#4a3728] lg:pb-16">
            <GlobalStyles />
            <Navigation currentUserId={user?.userId} activeTimezone="IST (UTC+5:30)" />
            <main className="mx-auto w-full max-w-7xl px-4 pt-20 sm:px-6 sm:pt-24 lg:px-8">
                <button
                    type="button"
                    onClick={() => router.push("/mentorship")}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#756657] transition hover:text-[#4a3728] sm:mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to mentorship
                </button>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-8">
                    <aside className="min-w-0 lg:sticky lg:top-24">
                        {profileStatus === "loading" && (
                            <div className="animate-pulse rounded-3xl border border-[#ece7e2] bg-white p-6 sm:p-8">
                                <div className="mx-auto h-24 w-24 rounded-full bg-[#eee5dc]" />
                                <div className="mx-auto mt-5 h-5 w-40 rounded bg-[#eee5dc]" />
                            </div>
                        )}
                        {profileStatus === "error" && (
                            <div className="rounded-3xl border border-red-200 bg-white p-6 text-center">
                                <p className="break-words text-sm text-red-700">{profileError}</p>
                                <button
                                    type="button"
                                    onClick={() => void loadProfile()}
                                    className="mt-4 rounded-xl bg-[#4a3728] px-5 py-2 text-sm font-bold text-white"
                                >
                                    Retry profile
                                </button>
                            </div>
                        )}
                        {profileStatus === "success" && profile && (
                            <section className="rounded-3xl border border-[#ece7e2] bg-white p-5 shadow-sm sm:p-6">
                                <div className="flex flex-row items-center gap-4 text-left sm:flex-col sm:text-center">
                                    <ProfileAvatar profile={profile} />
                                    <h1 className="min-w-0 break-words text-lg font-bold text-[#2d2015] sm:mt-4 sm:text-xl">
                                        {profile.displayName}
                                    </h1>
                                </div>
                                <div className="mt-5 space-y-4 border-t border-[#eee5dc] pt-5 sm:mt-6">
                                    {profile.college && (
                                        <div className="flex items-start gap-3">
                                            <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-[#8b7355]" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-[#9b8876]">College</p>
                                                <p className="mt-1 break-words text-sm font-medium text-[#4a3728]">{profile.college}</p>
                                            </div>
                                        </div>
                                    )}
                                    {profile.degree && (
                                        <div className="flex items-start gap-3">
                                            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-[#8b7355]" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-[#9b8876]">Degree</p>
                                                <p className="mt-1 break-words text-sm font-medium text-[#4a3728]">{profile.degree}</p>
                                            </div>
                                        </div>
                                    )}
                                    {profile.fieldOfStudy && (
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-[#9b8876]">Field of study</p>
                                            <p className="mt-1 break-words text-sm font-medium text-[#4a3728]">{profile.fieldOfStudy}</p>
                                        </div>
                                    )}
                                    {profile.skills.length > 0 && (
                                        <div className="min-w-0">
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9b8876]">Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.skills.map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="max-w-full break-words rounded-2xl border border-[#ebdcd0] bg-[#f6efe8] px-3 py-1.5 text-xs font-medium leading-snug text-[#6b5643]"
                                                    >
                                                        {displayLabel(skill)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {profile.sessionsCount > 0 && (
                                        <p className="text-sm font-semibold text-[#6b5643]">
                                            {profile.sessionsCount} completed sessions
                                        </p>
                                    )}
                                </div>
                            </section>
                        )}
                    </aside>

                    <section className="min-w-0">
                        <div className="mb-4 sm:mb-5">
                            <h2 className="text-xl font-bold text-[#2d2015] sm:text-2xl">Available Services</h2>
                            <p className="mt-1 text-sm text-[#8b7355]">Choose a one-to-one session to see available dates and times.</p>
                        </div>

                        {sessionsStatus === "loading" && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {[0, 1].map((item) => (
                                    <div key={item} className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
                                ))}
                            </div>
                        )}
                        {sessionsStatus === "error" && (
                            <div className="rounded-2xl border border-red-200 bg-white p-6 text-center">
                                <p className="break-words text-sm text-red-700">{sessionsError}</p>
                                <button
                                    type="button"
                                    onClick={() => void loadSessions()}
                                    className="mt-4 rounded-xl bg-[#4a3728] px-5 py-2 text-sm font-bold text-white"
                                >
                                    Retry sessions
                                </button>
                            </div>
                        )}
                        {sessionsStatus === "success" && sessions.length === 0 && (
                            <div className="rounded-2xl border border-[#ece7e2] bg-white p-8 text-center">
                                <p className="font-semibold text-[#4a3728]">No sessions available yet</p>
                            </div>
                        )}
                        {sessionsStatus === "success" && sessions.length > 0 && (
                            <>
                                {categories.length > 0 && (
                                    <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mb-5 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                                        {["All", ...categories].map((category) => (
                                            <button
                                                key={category}
                                                type="button"
                                                onClick={() => setActiveCategory(category)}
                                                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
                                                    activeCategory === category
                                                        ? "bg-[#4a3728] text-white"
                                                        : "border border-[#e2d5c8] bg-white text-[#6b5643]"
                                                }`}
                                            >
                                                {category === "All" ? category : displayLabel(category)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {visibleSessions.length === 0 ? (
                                    <div className="rounded-2xl border border-[#ece7e2] bg-white p-8 text-center text-sm text-[#8b7355]">
                                        No sessions in this category.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                                        {visibleSessions.map((session) => (
                                            <article
                                                key={session.sessionId}
                                                className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#ece7e2] bg-white shadow-sm"
                                            >
                                                <div className="group relative aspect-video w-full overflow-hidden bg-[#f4ece1]">
                                                    <ServiceThumbnail
                                                        src={session.thumbnailImage}
                                                        alt={session.title}
                                                        label={displayLabel(session.sessionType)}
                                                    />
                                                </div>
                                                <div className="flex flex-1 flex-col p-4 sm:p-5">
                                                    <div className="mb-3 flex items-center justify-between gap-3">
                                                        <span className="rounded-full bg-[#f6efe8] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6b5643]">
                                                            {displayLabel(session.sessionType)}
                                                        </span>
                                                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#8b7355]">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {session.duration} min
                                                        </span>
                                                    </div>
                                                    <h3 className="break-words text-base font-bold text-[#2d2015] sm:text-lg">
                                                        {session.title}
                                                    </h3>
                                                    {session.description && (
                                                        <p className="mt-2 line-clamp-3 whitespace-pre-line break-words text-sm leading-relaxed text-[#756657]">
                                                            {session.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-auto pt-5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const bookPath = `/mentorship/senior-service/${encodeURIComponent(session.sessionId)}/book`;
                                                                // Services sabko dikhti hain, par booking ke liye login zaroori hai.
                                                                // Logged-out user ko login par bhejo; login ke baad wapas isi service ke book page par aayega.
                                                                // (AuthService se sync check, taaki hook state load hone se pehle bhi sahi chale)
                                                                if (!AuthService.isAuthenticated()) {
                                                                    router.push(buildLoginRedirectUrl(bookPath));
                                                                    return;
                                                                }
                                                                router.push(bookPath);
                                                            }}
                                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a3728] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#38291e]"
                                                        >
                                                            <Calendar className="h-4 w-4" />
                                                            Book
                                                        </button>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}