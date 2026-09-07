import { ActivityItem } from "../components/company/ActivityFeed";
import { Metric } from "../components/company/EngagementMetrics";
import { QuickAction } from "../components/company/QuickActions";
import { Stat } from "../components/company/StatsGrid";
import { TopPost } from "../components/company/TopPosts";

export type ActivityType = 'follow' | 'like' | 'comment' | 'share' | 'apply' | 'review' | 'event';

export interface ReviewData {
  rating: number;
  title: string;
  content: string;
  isAnonymous: boolean;
  isVerified: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  existingResponse?: string;
}

// ─── about/types/about.types.ts ───────────────────────────────────────────────

export interface StoryData {
    title: string;
    mission: string;
    vision: string;
    promise: string;
    impact: {
        users: string;
        hires: string;
        companies: string;
        cities: string;
    };
}

export interface TimelineItem {
    year: number;
    month: number;
    title: string;
    description: string;
    type: string;
    icon: string;
    isPublished: boolean;
}

export interface Testimonial {
    authorName: string;
    authorTitle: string;
    authorCompany: string;
    authorAvatar: string | null;
    message: string;
    rating: number;
    source: 'User' | 'Client';
    isPublished: boolean;
    isFeatured: boolean;
}

export interface ProductFeature {
    title: string;
    description: string;
    icon: string;
    category: string;
}

export interface ProductData {
    name: string;
    tagline: string;
    description: string;
    demoLink: string;
    features: ProductFeature[];
    screenshots: string[];
    isPublished: boolean;
}

export interface CompanyValue {
    title: string;
    description: string;
    icon: string;
}

export interface CompanyPerk {
    title: string;
    description: string;
    icon: string;
    category: string;
}

export interface TeamMember {
    name: string;
    designation: string;
    bio: string;
    avatar: string | null;
    linkedinUrl: string;
    order: number;
}

export interface GalleryItem {
    url: string | null;
    caption: string;
    type: 'Office' | 'Team' | 'Event';
    order: number;
}

export interface CultureData {
    values: CompanyValue[];
    perks: CompanyPerk[];
    teamMembers: TeamMember[];
    gallery: GalleryItem[];
}

export interface ImpactItem {
    title: string;
    metric: string;
    description: string;
}

export interface AboutIdentityData {
    story: string;
    mission: string;
    vision: string;
    promises: string[];
    impacts: ImpactItem[];
}

export type TestimonialFilter = 'All' | 'User' | 'Client';
export type CultureTab = 'values' | 'perks' | 'team' | 'gallery';
export type AboutSection = 'story' | 'timeline' | 'testimonials' | 'product' | 'culture';

export const METRICS: MetricCard[] = [
  { label: 'Profile Views', value: 4281, growth: 12 },
  { label: 'Post Impressions', value: 28400, growth: 24 },
  { label: 'Follower Growth', value: 393, growth: 8 },
  { label: 'Engagement Rate', value: 4.8, growth: 0.3 },
  { label: 'Click-Through Rate', value: 2.3, growth: -0.1 },
  { label: 'Conversion Rate', value: 1.1, growth: 0.2 },
];

export const CHART_DATA = [
  { label: 'Week 1', views: 820, impressions: 4200, followers: 78 },
  { label: 'Week 2', views: 940, impressions: 800, followers: 95 },
  { label: 'Week 3', views: 760, impressions: 5100, followers: 62 },
  { label: 'Week 4', views: 1120, impressions: 8900, followers: 128 },
  { label: 'Week 5', views: 980, impressions: 100, followers: 102 },
  { label: 'Week 6', views: 1350, impressions: 10200, followers: 150 },
  { label: 'Week 7', views: 1180, impressions: 9100, followers: 132 },
  { label: 'Week 8', views: 1490, impressions: 11500, followers: 168 },
  { label: 'Week 9', views: 1210, impressions: 1559, followers: 141 },
  { label: 'Week 10', views: 1580, impressions: 12300, followers: 182 },
  { label: 'Week 11', views: 1420, impressions: 10900, followers: 164 },
  { label: 'Week 12', views: 1710, impressions: 13600, followers: 205 },
];

export const TOP_POSTS: Post[] = [
  {
    id: 'post-1',
    title: 'How to build production-ready UI',
    views: 12450,
    engagementRate: 12,
  },
  {
    id: 'post-2',
    title: 'React performance secrets',
    views: 9850,
    engagementRate: 9,
  },
];

export const AUDIENCE_LOCATION: AudienceItem[] = [
  { label: 'Bhopal, MP', pct: 34 },
  { label: 'Mumbai', pct: 22 },
  { label: 'Bangalore', pct: 18 },
  { label: 'Delhi', pct: 14 },
  { label: 'Others', pct: 12 },
];

export const AUDIENCE_INDUSTRY: AudienceItem[] = [
  { label: 'Technology', pct: 42 },
  { label: 'Finance', pct: 18 },
  { label: 'Education', pct: 15 },
  { label: 'Healthcare', pct: 12 },
  { label: 'Others', pct: 13 },
];

export type ChartMetric = 'views' | 'impressions' | 'followers';

export type MetricCard = {
  label: string;
  value: number;
  growth: number;
};

export type ChartItem = {
  label: string;
  views: number;
  impressions: number;
  followers: number;
};

export type Post = {
  id: string;
  title: string;
  views: number;
  engagementRate: number;
};

export type AudienceItem = {
  label: string;
  pct: number;
};

export type TimeRange = '7d' | '30d' | '90d';

export interface SocialLinks {
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
  youtube: string;
  github: string;
}

export interface CompanyFormValues {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  industry: string;
  size: string;
  location: string;
  founded: string;
  website: string;
  social: SocialLinks;
  logoUrl?: string | null;
  bannerUrl?: string | null;
}

export type VerificationStatus = 'pending' | 'verified' | 'unverified';


// ── Static data — move to lib/mock/dashboard.ts when backend is ready ──

export const STATS: Stat[] = [
  { id: 'views', label: 'Profile Views', value: '4,281', change: '+12%', up: true, icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  { id: 'impressions', label: 'Post Impressions', value: '28.4K', change: '+24%', up: true, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { id: 'followers', label: 'Followers', value: '3,282', change: '+8%', up: true, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'search', label: 'Search Appearances', value: '982', change: '-3%', up: false, icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
];

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'qa-1', label: 'Create Post', href: '/posts', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
  { id: 'qa-2', label: 'Post a Job', href: '/jobs', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'qa-3', label: 'Create Event', href: '/events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'qa-4', label: 'Add Employee', href: '/employees', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
];


export const ACTIVITY: ActivityItem[] = [
  { id: 'act-1', user: 'Anushree Jain', action: 'followed your company', time: '10m ago', avatar: 'AJ', color: 'bg-purple-500' },
  { id: 'act-2', user: 'Ayush Wadhwa', action: 'liked your post', time: '25m ago', avatar: 'AW', color: 'bg-blue-500' },
  { id: 'act-3', user: 'Harshit Kushwah', action: 'commented on your post', time: '1h ago', avatar: 'HK', color: 'bg-green-500' },
  { id: 'act-4', user: 'Chhavi Arora', action: 'followed your company', time: '2h ago', avatar: 'CA', color: 'bg-orange-500' },
  { id: 'act-5', user: 'Manan Telrandhe', action: 'shared your post', time: '3h ago', avatar: 'MT', color: 'bg-pink-500' },
];

export const ENGAGEMENT_METRICS: Metric[] = [
  { id: 'eng', label: 'Engagement Rate', value: '4.8%', desc: 'Avg interactions per impression', icon: '❤️' },
  { id: 'ctr', label: 'Click-Through Rate', value: '2.3%', desc: 'Clicks on your posts & links', icon: '🖱️' },
  { id: 'cvr', label: 'Conversion Rate', value: '1.1%', desc: 'Profile visits → follows', icon: '📈' },
];

export const WEEKLY_DATA = [
  { day: 'Mon', followers: 45 },
  { day: 'Tue', followers: 72 },
  { day: 'Wed', followers: 38 },
  { day: 'Thu', followers: 91 },
  { day: 'Fri', followers: 65 },
  { day: 'Sat', followers: 28 },
  { day: 'Sun', followers: 54 },
];

export const MONTHLY_DATA = [
  { day: 'W1', followers: 210 },
  { day: 'W2', followers: 340 },
  { day: 'W3', followers: 280 },
  { day: 'W4', followers: 393 },
];