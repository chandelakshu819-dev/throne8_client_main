// src/shared/utils/profileTransformers.ts
import { UserProfileData, ProfileData } from '../../types/profile.types';

export const transformToProfileData = (
    userProfileData: UserProfileData | null,
    profileImageUrl: string,
    headlineData: any
): ProfileData => {
    const fullName = userProfileData
        ? `${userProfileData.firstName} ${userProfileData.lastName}`.trim()
        : 'Loading...';

    return {
        bannerImage: '', // ✅ hardcoded unsplash URL hataya — pages already alag bannerUrl use kar rahe hain
        profileImage: profileImageUrl,
        pronouns: (userProfileData as any)?.pronouns || '',
        description: (userProfileData as any)?.bio || '',
        followers: 0,
        connections: '',
        userName: userProfileData?.firstName || '',
        email: userProfileData?.email || '',
        name: fullName,
        headline: headlineData || '',
        education: {
            collegeName: userProfileData?.onboarding?.studentProfile?.collegeName || '',
            degree: userProfileData?.onboarding?.studentProfile?.degree || '',
            fieldOfStudy: userProfileData?.onboarding?.studentProfile?.fieldOfStudy || '',
            graduationYear: userProfileData?.onboarding?.studentProfile?.graduationYear || ''
        },
        company: userProfileData?.onboarding?.workingProfile?.companyName || '',
        location: userProfileData?.location || '',
    };
};

// Transform posts data for activity section - extract first image from post's images array and format createdAt to "x minutes/hours/days ago"
export const transformPostsData = (posts: any[]) => {
    return posts.map(post => ({
        ...post,
        image: post.images?.[0]?.cloudinarySecureUrl || '',
        text: post.content || post.text || '',
        likes: post.likesCount || 0,
        comments: post.commentsCount || 0,
        reposts: 0,
        time: formatPostTime(post.createdAt),
        isLiked: post.isLikedByCurrentUser || false,
        // ✅ Sirf tab include karo jab actual data ho
        ...(post.images?.length > 0 && { images: post.images }),
        ...(post.videos?.length > 0 && { videos: post.videos }),
        ...(post.documents?.length > 0 && { documents: post.documents }),
    }));
};

// Helper function to format post time
const formatPostTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

    // For older posts, show date
    return created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const transformToProfessionalJourney = (userProfileData: UserProfileData | null) => {
    if (!userProfileData?.onboarding) return [];

    const items = [];
    const { userType, studentProfile, workingProfile } = userProfileData.onboarding;

    // Working profile add karein
    if (userType === 'working' && workingProfile) {
        items.push({
            title: workingProfile.companyName || '--',
            role: workingProfile.jobTitle || '--',
            company: workingProfile.companyName || '',
            period: workingProfile.startDate
                ? `${new Date(workingProfile.startDate).getFullYear()} – ${workingProfile.endDate ? new Date(workingProfile.endDate).getFullYear() : 'Present'}`
                : 'Present',
            color: "from-[#4a3728] to-[#6b4e3d]",
            type: 'work'
        });
    }

    // Student profile add karein
    if (userType === 'student' && studentProfile) {
        items.push({
            title: studentProfile.collegeName || 'College',
            role: studentProfile.degree || 'Degree',
            company: studentProfile.fieldOfStudy || 'Field of Study',
            period: studentProfile.graduationYear
                ? `${parseInt(studentProfile.graduationYear) - 4} – ${studentProfile.graduationYear}`
                : 'Present',
            color: "from-[#6b4e3d] to-[#8b6f47]",
            type: 'education'
        });
    }

    return items;
};