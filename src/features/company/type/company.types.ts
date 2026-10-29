// ─────────────────────────────────────────────────────────────────
// THRONE8 — Company Page Types
// All types used across the app. Backend team: swap mock data in
// constants/company.data.ts and match these interfaces on the API.
// ─────────────────────────────────────────────────────────────────

// ── Primitives ────────────────────────────────────────────────────

export type TabId = 'overview' | 'about' | 'posts' | 'events' | 'life' | 'jobs' | 'products';

export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Remote';

export type BadgeVariant = 'Core' | 'Enterprise' | 'New' | 'Beta';

// ── API Response Envelope ─────────────────────────────────────────
// Wrap every API response in this for consistent error handling

export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
    timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
    };
}

// ── Company ───────────────────────────────────────────────────────

export interface CompanyStat {
    id: string;
    label: string;
    value: string;        // raw numeric string e.g. "50"
    suffix: string;        // e.g. "K+", "%", "+"
    description: string;
    iconPath: string;        // SVG path data
}

export interface SocialLinks {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
}

export interface Address {
    city: string;
    state: string;
    country: string;
    full: string;
}

export interface CompanyMeta {
    id: string;
    name: string;
    slug?: string;
    legalName?: string;      
    tagline?: string;        
    description?: string;    
    industry: string;
    subIndustry?: string;    
    founded: string;
    size: string;
    employeeCount: number;
    headquarters: Address;
    website: string;
    socialLinks: SocialLinks;
    logoUrl?: string;
    bannerUrl?: string;
    isHiring?: boolean;      
    isVerified: boolean;
    followers: number;
}

// ── Team ──────────────────────────────────────────────────────────

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    department: string;
    bio: string;
    avatarUrl?: string;
    initials: string;
    socialLinks: SocialLinks;
    isFounder: boolean;
    joinedAt: string;          // ISO date
}

// ── Jobs ──────────────────────────────────────────────────────────

export interface JobPosting {
    id: string;
    title: string;
    slug: string;
    department: string;
    location: string;
    type: JobType;
    experience: string;
    description: string;
    responsibilities: string[];
    requirements: string[];
    tags: string[];
    postedAt: string;         // ISO date
    expiresAt?: string;         // ISO date
    isActive: boolean;
    applyUrl?: string;
    salaryRange?: string;
}

export interface JobFilters {
    department: string;
    location: string;
    type: string;
}

// ── Products ─────────────────────────────────────────────────────

export interface Product {
    id: string;
    name: string;
    slug: string;
    tagline: string;
    description: string;
    iconPath: string;          // SVG path data
    features: string[];
    badge?: BadgeVariant;
    ctaLabel?: string;
    ctaUrl?: string;
    screenshotUrl?: string;
}

// ── Culture ───────────────────────────────────────────────────────

export interface CultureValue {
    id: string;
    iconPath: string;
    title: string;
    description: string;
    color?: string;
}

export interface Perk {
    id: string;
    iconName: string;
    label: string;
    desc: string;
}

// ── Timeline ──────────────────────────────────────────────────────

export interface Milestone {
    id: string;
    year: string;
    quarter?: string;          // e.g. "Q3"
    title: string;
    description: string;
    type: 'funding' | 'product' | 'growth' | 'team' | 'award';
}

// ── Content ──────────────────────────────────────────────────────

export interface NewsPost {
    id: string;
    title: string;
    excerpt: string;
    category: string;
    date: string;            // ISO date
    readTime: string;
    imageUrl: string;
    slug: string;
    externalUrl?: string;
}

export interface Testimonial {
    id: string;
    quote: string;
    author: string;
    role: string;
    company: string;
    initials: string;
    avatarUrl?: string;
    rating: 1 | 2 | 3 | 4 | 5;
}

export interface GalleryPhoto {
    id: string;
    src: string;
    alt: string;
    caption?: string;
}

// ── Sidebar ──────────────────────────────────────────────────────

export interface SuggestedPerson {
    id: string;
    name: string;
    title: string;
    initials: string;
    avatarUrl?: string;
    mutualConnections?: number;
}

export interface ProfileProgressItem {
    id: string;
    label: string;
    pct: number;
    hint: string;
}

// ── Redux State ──────────────────────────────────────────────────

export interface UIState {
    activeTab: TabId;
    followingCompany: boolean;
    notificationsEnabled: boolean;
    jobFilters: JobFilters;
    searchQuery: string;
    expandedJobId: string | null;
    statsAnimated: boolean;
    isHeaderSticky: boolean;
    activePostFilter: PostFilter;
}

export interface CompanyState {
    meta: CompanyMeta;
    stats: CompanyStat[];
    team: TeamMember[];
    jobs: JobPosting[];
    milestones: Milestone[];
    products: Product[];
    cultureValues: CultureValue[];
    perks: Perk[];
    news: NewsPost[];
    testimonials: Testimonial[];
    gallery: GalleryPhoto[];
    posts: Post[];
    // Loading states for future API integration
    isLoading: boolean;
    error: string | null;
    lastFetched: string | null;   // ISO timestamp
}

// ── Component Props Helpers ──────────────────────────────────────

export type WithChildren<T = Record<string, never>> = T & {
    children: React.ReactNode;
};

export type WithClassName<T = Record<string, never>> = T & {
    className?: string;
};

// ── Posts ─────────────────────────────────────────────────────────

export type PostType = 'image' | 'document' | 'article';
export type PostFilter = 'all' | 'image' | 'document' | 'article';

export type DocumentFileType = 'pdf' | 'ppt' | 'doc' | 'xls' | 'csv' | 'zip';

export interface PostAuthor {
    name: string;
    role: string;
    avatarUrl?: string;
    initials: string;
}

export interface BasePost {
    id: string;
    type: PostType;
    author: PostAuthor;
    caption: string;
    publishedAt: string;        // ISO date
    likes: number;
    comments: number;
    shares: number;
    tags: string[];
}

export interface ImagePost extends BasePost {
    type: 'image';
    imageUrl: string;
    aspectRatio?: '1:1' | '4:3' | '16:9';
    altText: string;
}

export interface DocumentPost extends BasePost {
    type: 'document';
    title: string;
    fileType: DocumentFileType;
    fileSize: string;          // e.g. "2.4 MB"
    pageCount?: number;
    downloadUrl: string;
    previewUrl?: string;
}

export interface ArticlePost extends BasePost {
    type: 'article';
    title: string;
    excerpt: string;
    readTime: string;
    coverUrl?: string;
    articleUrl: string;
    category: string;
}

export type Post = ImagePost | DocumentPost | ArticlePost;

