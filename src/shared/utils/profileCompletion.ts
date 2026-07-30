// src/shared/utils/profileCompletion.ts

export interface ProfileCompletionInput {
    profileImageUrl?: string | null;
    bannerUrl?: string | null;
    headline?: string | null;
    about?: any;
    educationList?: any[];
    experienceList?: any[];
    skillsCount?: number;
}

const NETWORK_TARGET = 50;
const POSTS_TARGET = 10;
const TOTAL_CHECKS = 7;

/**
 * Profile Completion % — 7 checkpoints:
 * profile photo, banner, headline, about, education, experience, skills(>=3)
 * ✅ SAME formula used everywhere (Network page + Profile page) — koi duplicate logic nahi
 */
export function calculateProfileCompletion({
    profileImageUrl,
    bannerUrl,
    headline,
    about,
    educationList = [],
    experienceList = [],
    skillsCount = 0,
}: ProfileCompletionInput): number {
    const checks = [
        !!profileImageUrl,
        !!bannerUrl,
        !!headline,
        !!about,
        educationList.length > 0,
        experienceList.length > 0,
        skillsCount >= 3,
    ];
    const completedCount = checks.filter(Boolean).length;
    return Math.round((completedCount / TOTAL_CHECKS) * 100);
}

export function getMissingSkillsCount(skillsCount = 0): number {
    return Math.max(0, 3 - skillsCount);
}

/** Network Growth % — target: 50 connections */
export function calculateNetworkGrowth(connectionsCount = 0): number {
    return Math.min(100, Math.round((connectionsCount / NETWORK_TARGET) * 100));
}

export function getRemainingConnections(connectionsCount = 0): number {
    return Math.max(0, NETWORK_TARGET - connectionsCount);
}

/** Content Engagement % — target: 10 posts */
export function calculateContentEngagement(postsCount = 0): number {
    return Math.min(100, Math.round((postsCount / POSTS_TARGET) * 100));
}

export function getRemainingPosts(postsCount = 0): number {
    return Math.max(0, POSTS_TARGET - postsCount);
}