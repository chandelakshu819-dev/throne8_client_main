export interface Person {
    id: string;
    name: string;
    title: string;
    mutuals: string;
    mutualAvatars?: string[]; // top 3 mutual persons ki photo URLs
    image: string;
    location: string;
}

export interface Company {
    id: string;           // companyId
    name: string;         // companyName
    industry: string;
    employees: string;    // companySize
    image: string;        // media.logo.url
    location: string;     // headquarters.city
    description: string;  // descriptions.tagline
    followersCount?: number;
    companySlug?: string;
}

export interface ConnectionRequest {
    id: string;
    name: string;
    title: string;
    mutuals: string;
    image: string;
    location: string;
}

export interface SentRequest {
    id: string;
    name: string;
    title: string;
    image: string;
}

export interface PremiumUser {
    name: string;
    title: string;
    stats: string;
    img: string;
    badge: string;
    achievements: string[];
}

export type TabType = 'grow' | 'catchup';
export type RequestTabType = 'received' | 'sent';