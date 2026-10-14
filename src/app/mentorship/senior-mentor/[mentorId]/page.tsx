"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, GraduationCap, Landmark } from "lucide-react";
import MentorService, { PublicSeniorMentor } from "@/lib/api/mentorship.service";
import SeniorSessionService, { SeniorDiscoverySession } from "@/lib/api/seniorSession.service";
import SeniorAvailabilityService from "@/lib/api/seniorAvailability.service";
import { GlobalStyles, Navigation } from "@/features/index";
import { useAuth } from "@/features/auth/hooks/useAuth";
import ServiceThumbnail from "@/features/mentorship/components/shared/ServiceThumbnail";

type LoadStatus = "loading" | "success" | "error";

function displayLabel(value: string): string {
    return value
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function localDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
        <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-[#f4ece1] shadow-md">
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
            if (eligibleSessions.length === 0) {
                setSessions([]);
                setSessionsStatus("success");
                return;
            }

            const start = new Date();
            const end = new Date(start);
            end.setDate(end.getDate() + 365);
            const startDate = localDateKey(start);
            const endDate = localDateKey(end);
            const availabilityByDuration = new Map<number, Promise<boolean>>();

            for (const session of eligibleSessions) {
                if (!availabilityByDuration.has(session.duration)) {
                    availabilityByDuration.set(
                        session.duration,
                        SeniorAvailabilityService.getMonthlyAvailability(
                            mentorId,
                            startDate,
                            endDate,
                            session.duration
                        ).then((days) => days.some((day) => day.availableSlots > 0))
                    );
                }
            }

            const availabilityResults = await Promise.all(
                Array.from(availabilityByDuration.entries()).map(async ([duration, available]) => [
                    duration,
                    await available,
                ] as const)
            );
            const availableDurations = new Set(
                availabilityResults.filter(([, available]) => available).map(([duration]) => duration)
            );
            setSessions(eligibleSessions.filter((session) => availableDurations.has(session.duration)));
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
        <div className="min-h-screen bg-[#FAF9F6] pb-16 text-[#4a3728]">
            <GlobalStyles />
            <Navigation currentUserId={user?.userId} activeTimezone="IST (UTC+5:30)" />
            <main className="mx-auto max-w-7xl px-5 pt-24">
                <button
                    type="button"
                    onClick={() => router.push("/mentorship")}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#756657] transition hover:text-[#4a3728]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to mentorship
                </button>

                <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <aside>
                        {profileStatus === "loading" && (
                            <div className="animate-pulse rounded-3xl border border-[#ece7e2] bg-white p-8">
                                <div className="mx-auto h-24 w-24 rounded-full bg-[#eee5dc]" />
                                <div className="mx-auto mt-5 h-5 w-40 rounded bg-[#eee5dc]" />
                            </div>
                        )}
                        {profileStatus === "error" && (
                            <div className="rounded-3xl border border-red-200 bg-white p-6 text-center">
                                <p className="text-sm text-red-700">{profileError}</p>
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
                            <section className="rounded-3xl border border-[#ece7e2] bg-white p-6 shadow-sm">
                                <div className="flex flex-col items-center text-center">
                                    <ProfileAvatar profile={profile} />
                                    <h1 className="mt-4 text-xl font-bold text-[#2d2015]">{profile.displayName}</h1>
                                </div>
                                <div className="mt-6 space-y-4 border-t border-[#eee5dc] pt-5">
                                    {profile.college && (
                                        <div className="flex items-start gap-3">
                                            <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-[#8b7355]" />
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-[#9b8876]">College</p>
                                                <p className="mt-1 text-sm font-medium text-[#4a3728]">{profile.college}</p>
                                            </div>
                                        </div>
                                    )}
                                    {profile.degree && (
                                        <div className="flex items-start gap-3">
                                            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-[#8b7355]" />
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-[#9b8876]">Degree</p>
                                                <p className="mt-1 text-sm font-medium text-[#4a3728]">{profile.degree}</p>
                                            </div>
                                        </div>
                                    )}
                                    {profile.fieldOfStudy && (
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-[#9b8876]">Field of study</p>
                                            <p className="mt-1 text-sm font-medium text-[#4a3728]">{profile.fieldOfStudy}</p>
                                        </div>
                                    )}
                                    {profile.skills.length > 0 && (
                                        <div>
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9b8876]">Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.skills.map((skill) => (
                                                    <span key={skill} className="rounded-full border border-[#ebdcd0] bg-[#f6efe8] px-3 py-1 text-xs font-medium text-[#6b5643]">
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

                    <section>
                        <div className="mb-5">
                            <h2 className="text-2xl font-bold text-[#2d2015]">Available Services</h2>
                            <p className="mt-1 text-sm text-[#8b7355]">Choose a one-to-one session to see available dates and times.</p>
                        </div>

                        {sessionsStatus === "loading" && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {[0, 1].map((item) => (
                                    <div key={item} className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
                                ))}
                            </div>
                        )}
                        {sessionsStatus === "error" && (
                            <div className="rounded-2xl border border-red-200 bg-white p-6 text-center">
                                <p className="text-sm text-red-700">{sessionsError}</p>
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
                                    <div className="mb-5 flex flex-wrap gap-2">
                                        {["All", ...categories].map((category) => (
                                            <button
                                                key={category}
                                                type="button"
                                                onClick={() => setActiveCategory(category)}
                                                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
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
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        {visibleSessions.map((session) => (
                                            <article key={session.sessionId} className="overflow-hidden rounded-2xl border border-[#ece7e2] bg-white shadow-sm">
                                                <div className="group relative h-44 overflow-hidden bg-[#f4ece1]">
                                                    <ServiceThumbnail
                                                        src={session.thumbnailImage}
                                                        alt={session.title}
                                                        label={displayLabel(session.sessionType)}
                                                    />
                                                </div>
                                                <div className="p-5">
                                                    <div className="mb-3 flex items-center justify-between gap-3">
                                                        <span className="rounded-full bg-[#f6efe8] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6b5643]">
                                                            {displayLabel(session.sessionType)}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8b7355]">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {session.duration} min
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-[#2d2015]">{session.title}</h3>
                                                    {session.description && (
                                                        <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-[#756657]">
                                                            {session.description}
                                                        </p>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => router.push(`/mentorship/senior-service/${encodeURIComponent(session.sessionId)}/book`)}
                                                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a3728] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#38291e]"
                                                    >
                                                        <Calendar className="h-4 w-4" />
                                                        Book
                                                    </button>
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
