// src/features/mentorship/utils/seniorHost.ts

export interface SeniorHost {
    name: string;
    role: string;
    pic: string;
    isOnline: boolean;
    isFallback: boolean;
}

export const SENIOR_HOST_FALLBACK_NAME = "Senior Mentor";
export const SENIOR_HOST_FALLBACK_ROLE = "Senior Professional";

const pick = (...values: any[]): string => {
    for (const v of values) {
        if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
};

const fullName = (u: any): string =>
    u ? [u.firstName, u.lastName].filter(Boolean).join(" ").trim() : "";

/**
 * Host info ka priority order:
 * 1) Backend ne session ke saath jo host/mentor object bheja (sabse reliable)
 * 2) Flat fields (mentorName, mentorPhoto, ...)
 * 3) Mentor list se mila mentor (fallback)
 */
export function resolveSeniorHost(service: any, mentor?: any): SeniorHost {
    const embedded =
        service?.host ||
        service?.mentor ||
        service?.mentorInfo ||
        service?.mentorProfile ||
        service?.user ||
        null;

    const name = pick(
        embedded?.name,
        embedded?.fullName,
        fullName(embedded),
        fullName(embedded?.user),
        service?.mentorName,
        service?.hostName,
        fullName(mentor?.user),
        mentor?.name
    );

    const role = pick(
        embedded?.role,
        embedded?.headline,
        embedded?.currentRole,
        embedded?.title,
        embedded?.experience?.currentRole,
        service?.mentorHeadline,
        service?.hostRole,
        mentor?.experience?.currentRole,
        mentor?.headline,
        mentor?.title
    );

    const pic = pick(
        embedded?.profilePic,
        embedded?.profilePhoto,
        embedded?.photo,
        embedded?.avatar,
        embedded?.user?.profilePic,
        service?.mentorPhoto,
        service?.mentorProfilePic,
        service?.hostPhoto,
        mentor?.profilePic,
        mentor?.user?.profilePic
    );

    return {
        name: name || SENIOR_HOST_FALLBACK_NAME,
        role: role || SENIOR_HOST_FALLBACK_ROLE,
        pic,
        isOnline: Boolean(embedded?.isOnline ?? mentor?.isOnline ?? false),
        isFallback: !name,
    };
}