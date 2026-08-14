import { MetricCard, Post, AudienceItem, StoryData, TimelineItem, Testimonial, ProductData, CultureData, AboutSection,  } from "../types";
import type { ActivityItemData } from '../components/activity/ActivityItem';
import { ChatMessage, Contact } from "../interface";


export const INITIAL_ACTIVITIES: ActivityItemData[] = [
  { id: '1', type: 'review', user: 'Anonymous Employee', avatar: '👤', color: 'bg-yellow-500', action: 'left a 5★ review on your company', time: '30m ago', read: false, review: { rating: 5, title: 'Amazing culture, incredible team!', content: 'Throne8 is one of the best places I have worked. Leadership is transparent, work is meaningful.', isAnonymous: true, isVerified: true, sentiment: 'positive' } },
  { id: '2', type: 'follow',  user: 'Anushree Jain',    avatar: 'AJ', color: 'bg-purple-500', action: 'followed your company',                      time: '1h ago',  read: false },
  { id: '3', type: 'like',    user: 'Ayush Wadhwa',     avatar: 'AW', color: 'bg-blue-500',   action: 'liked your post "Throne8 launches AI..."',   time: '2h ago',  read: false },
  { id: '4', type: 'apply',   user: 'Harshit Kushwah',  avatar: 'HK', color: 'bg-green-500',  action: 'applied to "Senior React Developer"',         time: '3h ago',  read: false },
  { id: '5', type: 'review',  user: 'Rohan G.',         avatar: 'RG', color: 'bg-yellow-500', action: 'left a 4★ review on your company',           time: '1d ago',  read: true,  review: { rating: 4, title: 'Great startup experience', content: 'Learning a lot here. The product is innovative and the founder is very involved day-to-day.', isAnonymous: false, isVerified: true, sentiment: 'positive', existingResponse: 'Thank you Rohan! We are working on improving compensation this year.' } },
  { id: '6', type: 'comment', user: 'Chhavi Arora',     avatar: 'CA', color: 'bg-orange-500', action: 'commented: "This is incredible work!"',       time: '1d ago',  read: true  },
  { id: '7', type: 'event',   user: 'Pooja Mehta',      avatar: 'PM', color: 'bg-indigo-500', action: 'registered for "AI Summit 2026"',             time: '2d ago',  read: true  },
  { id: '8', type: 'share',   user: 'Manan Telrandhe',  avatar: 'MT', color: 'bg-pink-500',   action: 'shared your post',                            time: '2d ago',  read: true  },
];

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

// ─── about/data/about.data.ts ─────────────────────────────────────────────────

export const STORY_DATA: StoryData = {
    title: 'Our Story',
    mission:
        'To democratize professional growth by making AI-powered career tools accessible to every professional in India — not just those at elite institutions.',
    vision:
        'A world where your skills and potential define your career trajectory, not your network or pedigree.',
    promise:
        'We promise to always put users first, keep your data private, and build tools that genuinely work — no dark patterns, no pay-to-win.',
    impact: {
        users: '18,000+',
        hires: '3,200+',
        companies: '450+',
        cities: '38',
    },
};

export const TIMELINE_DATA: TimelineItem[] = [
    {
        year: 2021, month: 6, title: 'Idea Born', icon: '💡', type: 'Founding',
        description: "Honey Sharma, frustrated with LinkedIn's noise, starts prototyping an AI-first professional network in a Bhopal apartment.",
        isPublished: true,
    },
    {
        year: 2022, month: 1, title: 'Seed Funding', icon: '💰', type: 'Funding',
        description: '₹1.2 Cr raised from angel investors including ex-Flipkart and Ola executives. Team grows to 6.',
        isPublished: true,
    },
    {
        year: 2022, month: 9, title: 'Beta Launch', icon: '🎯', type: 'Product Launch',
        description: 'Throne8 beta launched with 500 invite-only users. First AI-powered job matching went live.',
        isPublished: true,
    },
    {
        year: 2023, month: 3, title: '10,000 Users', icon: '🚀', type: 'Milestone',
        description: 'Crossed 10,000 active professionals on the platform. NPS score: 72. Average time-to-hire dropped 40%.',
        isPublished: true,
    },
    {
        year: 2023, month: 11, title: 'Series A', icon: '📈', type: 'Funding',
        description: '₹8.5 Cr Series A led by Nexus Venture Partners. Expanded engineering team to 24 members.',
        isPublished: true,
    },
    {
        year: 2024, month: 7, title: 'Enterprise Launch', icon: '🏢', type: 'Product Launch',
        description: 'Throne8 Enterprise launched. 150 companies signed up in the first 60 days.',
        isPublished: true,
    },
];

export const TESTIMONIALS_DATA: Testimonial[] = [
    {
        authorName: 'Rahul Verma', authorTitle: 'Senior Software Engineer', authorCompany: 'Infosys',
        authorAvatar: null,
        message: 'Throne8 helped me land my dream job at a Series B startup in just 3 weeks. The AI matching is incredibly accurate — every suggestion was relevant to my actual skills and experience.',
        rating: 5, source: 'User', isPublished: true, isFeatured: true,
    },
    {
        authorName: 'Priya Sharma', authorTitle: 'HR Manager', authorCompany: 'TechCorp India',
        authorAvatar: null,
        message: 'We hired 12 engineers through Throne8 in 2 months. The quality of candidates is unmatched. No more sifting through irrelevant profiles.',
        rating: 5, source: 'Client', isPublished: true, isFeatured: false,
    },
    {
        authorName: 'Aditya Nair', authorTitle: 'Product Manager', authorCompany: 'Razorpay',
        authorAvatar: null,
        message: "The career analytics dashboard alone is worth it. I can see exactly what's working on my profile and where I need to improve.",
        rating: 5, source: 'User', isPublished: true, isFeatured: false,
    },
];

export const PRODUCT_DATA: ProductData = {
    name: 'Throne8 Platform',
    tagline: 'AI-powered professional networking, reimagined from the ground up.',
    description:
        'Throne8 is a next-generation professional networking platform that uses artificial intelligence to create meaningful connections, intelligent job matching, and real career growth — all in one place.',
    demoLink: 'https://demo.throne8.com',
    screenshots: [],
    isPublished: true,
    features: [
        { title: 'AI Job Matching', description: 'Proprietary AI analyzes your skills, experience, and preferences to surface the most relevant opportunities.', icon: '🤖', category: 'core' },
        { title: 'Smart Network Builder', description: 'Graph-based recommendation engine suggests connections based on career trajectory.', icon: '🔗', category: 'core' },
        { title: 'End-to-End Encryption', description: 'All messages and profile data are encrypted end-to-end. We never sell your data.', icon: '🔐', category: 'key' },
        { title: 'Clean, Distraction-Free UI', description: 'No unnecessary feeds, no algorithmic noise — just meaningful professional interactions.', icon: '✨', category: 'design' },
        { title: 'Career Analytics Dashboard', description: 'Track your profile visibility, connection growth, and application metrics with real-time analytics.', icon: '📊', category: 'analytics' },
        { title: 'Recruiter Intelligence', description: 'AI-ranked candidate lists, automated screening, and team collaboration tools for hiring managers.', icon: '🎯', category: 'key' },
    ],
};

export const CULTURE_DATA: CultureData   = {
    values: [
        { title: 'People First', description: 'Every decision starts with one question: how does this help our users, team, or community? Business metrics come second.', icon: '❤️' },
        { title: 'Build in the Open', description: 'We share our roadmap, post-mortems, and even our failures publicly. Transparency is a feature, not a PR tactic.', icon: '🌐' },
        { title: 'Speed with Intention', description: 'We move fast, but never recklessly. Every sprint starts with "why" before "what".', icon: '⚡' },
        { title: 'Security is Non-Negotiable', description: 'User data is sacred. We treat every line of code that touches user data as if our own privacy depends on it.', icon: '🛡️' },
    ],
    perks: [
        { title: 'Remote-First Forever', description: 'Work from anywhere in India. Optional office access in Bhopal for those who prefer it.', icon: '🏠', category: 'Work Style' },
        { title: 'Health Insurance — Full Family', description: '₹5 lakh health coverage for you + parents + spouse. Zero co-pay.', icon: '🏥', category: 'Health' },
        { title: 'Learning Budget', description: '₹30,000/year for courses, books, conferences — no approval needed. Just learn and grow.', icon: '📚', category: 'Growth' },
        { title: 'ESOP for All', description: 'Every full-time employee gets equity. You build it, you own a piece of it.', icon: '📈', category: 'Financial' },
        { title: 'Unlimited Paid Leave', description: 'We trust you to manage your time. No fixed leave quota — just get the work done.', icon: '🌴', category: 'Work Style' },
    ],
    teamMembers: [
        { name: 'Honey Sharma', designation: 'Founder & CEO', bio: 'Previously at Flipkart and Juspay. 10 years in building scalable distributed systems. Obsessed with user privacy and AI.', avatar: null, linkedinUrl: '#', order: 1 },
        { name: 'Arjun Mehta', designation: 'CTO', bio: "Ex-Google Brain. PhD in ML from IIT Bombay. Leading Throne8's AI and infrastructure teams.", avatar: null, linkedinUrl: '#', order: 2 },
        { name: 'Sneha Patel', designation: 'Head of Design', bio: '10 years designing at Zomato and Swiggy. Believes great UX is invisible.', avatar: null, linkedinUrl: '#', order: 3 },
    ],
    gallery: [
        { url: null, caption: 'Our Bhopal office — where it all started', type: 'Office', order: 1 },
        { url: null, caption: 'Team offsite in Manali — Q3 2024', type: 'Team', order: 2 },
        { url: null, caption: 'Demo Day at IIM Indore — 300 founders attended', type: 'Event', order: 3 },
    ],
};

export const MESSAGES: Contact[] = [
  { id: '1', from: 'Chhavi Arora',    avatar: 'CA', color: 'bg-purple-500', preview: 'Hey! Would love to connect and discuss potential collaboration opportunities...', time: '10m ago', read: false },
  { id: '2', from: 'Manan Telrandhe', avatar: 'MT', color: 'bg-blue-500',   preview: 'Great post on AI networking! Wanted to share some thoughts on this...',          time: '1h ago',  read: false },
  { id: '3', from: 'Ankit Shinde',    avatar: 'AS', color: 'bg-green-500',  preview: 'Are you open for a freelance project? We need a React developer for...',          time: '2h ago',  read: false },
  { id: '4', from: 'Pooja Mehta',     avatar: 'PM', color: 'bg-orange-500', preview: 'Registered for your AI Summit event! Looking forward to it.',                      time: '5h ago',  read: true  },
  { id: '5', from: 'Ravi Sharma',     avatar: 'RS', color: 'bg-pink-500',   preview: 'Thank you for sharing the job posting. I have applied for the role.',              time: '1d ago',  read: true  },
  { id: '6', from: 'Anjali Gupta',    avatar: 'AG', color: 'bg-teal-500',   preview: 'Your recent post about professional networking resonated with me a lot...',        time: '2d ago',  read: true  },
  { id: '7', from: 'Vikram Das',      avatar: 'VD', color: 'bg-indigo-500', preview: 'Hi Honey, I wanted to follow up on our last conversation about...',                time: '3d ago',  read: true  },
];

// ── Nav config ────────────────────────────────────────────────────────────────
export const NAV_SECTIONS: { id: AboutSection; label: string; icon: string }[] = [
  { id: 'story', label: 'Story & Mission', icon: '📖' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'testimonials', label: 'Testimonials', icon: '💬' },
  { id: 'product', label: 'Product', icon: '🚀' },
  { id: 'culture', label: 'Company Life', icon: '🏡' },
];

export const RICH_ACTIVITIES: ActivityItemData[] = [
  { id: '1', type: 'review', user: 'Anonymous Employee', avatar: '👤', color: 'bg-yellow-500', action: 'left a 5★ review on your company', time: '30m ago', read: false, review: { rating: 5, title: 'Amazing culture, incredible team!', content: 'Throne8 is one of the best places I have worked. Leadership is transparent, work is meaningful.', isAnonymous: true, isVerified: true, sentiment: 'positive' } },
  { id: '2', type: 'follow', user: 'Anushree Jain', avatar: 'AJ', color: 'bg-purple-500', action: 'followed your company', time: '1h ago', read: false },
  { id: '3', type: 'like', user: 'Ayush Wadhwa', avatar: 'AW', color: 'bg-blue-500', action: 'liked your post "Throne8 launches AI..."', time: '2h ago', read: false },
  { id: '4', type: 'apply', user: 'Harshit Kushwah', avatar: 'HK', color: 'bg-green-500', action: 'applied to "Senior React Developer"', time: '3h ago', read: false },
  { id: '5', type: 'review', user: 'Rohan G.', avatar: 'RG', color: 'bg-yellow-500', action: 'left a 4★ review on your company', time: '1d ago', read: true, review: { rating: 4, title: 'Great startup experience', content: 'Learning a lot here. The product is innovative and the founder is very involved day-to-day.', isAnonymous: false, isVerified: true, sentiment: 'positive', existingResponse: 'Thank you Rohan! We are working on improving compensation this year.' } },
  { id: '6', type: 'comment', user: 'Chhavi Arora', avatar: 'CA', color: 'bg-orange-500', action: 'commented: "This is incredible work!"', time: '1d ago', read: true },
  { id: '7', type: 'event', user: 'Pooja Mehta', avatar: 'PM', color: 'bg-indigo-500', action: 'registered for "AI Summit 2026"', time: '2d ago', read: true },
  { id: '8', type: 'share', user: 'Manan Telrandhe', avatar: 'MT', color: 'bg-pink-500', action: 'shared your post', time: '2d ago', read: true },
];






export const AVATAR_COLORS: Record<string, string> = {
  CA: 'bg-purple-500', MT: 'bg-blue-500', AS: 'bg-green-500',
  PM: 'bg-orange-500', RS: 'bg-pink-500', AG: 'bg-teal-500',
  VD: 'bg-indigo-500',
};

export const FULL_CONTACTS: Contact[] = [
  { id: '1', from: 'Chhavi Arora', avatar: 'CA', color: 'bg-purple-500', preview: 'Hey! Would love to connect...', time: '10m', read: false, online: true },
  { id: '2', from: 'Manan Telrandhe', avatar: 'MT', color: 'bg-blue-500', preview: 'Great post on AI networking!', time: '1h', read: false, online: true },
  { id: '3', from: 'Ankit Shinde', avatar: 'AS', color: 'bg-green-500', preview: 'Are you open for a project?', time: '2h', read: false, online: false, lastSeen: '2h ago' },
  { id: '4', from: 'Pooja Mehta', avatar: 'PM', color: 'bg-orange-500', preview: 'Registered for AI Summit!', time: '5h', read: true, online: false, lastSeen: '5h ago' },
  { id: '5', from: 'Ravi Sharma', avatar: 'RS', color: 'bg-pink-500', preview: 'Applied for the React role.', time: '1d', read: true, online: false, lastSeen: '1d ago' },
  { id: '6', from: 'Anjali Gupta', avatar: 'AG', color: 'bg-teal-500', preview: 'Your post resonated with me.', time: '2d', read: true, online: false, lastSeen: '2d ago' },
  { id: '7', from: 'Vikram Das', avatar: 'VD', color: 'bg-indigo-500', preview: 'Following up on partnership.', time: '3d', read: true, online: false, lastSeen: '3d ago' },
];

export const SEED: Record<string, ChatMessage[]> = {
  '1': [
    { id: 's1', from: 'them', type: 'text', text: 'Hey! Would love to connect and discuss potential collaboration opportunities for our upcoming project.', time: '10:42 AM' },
    { id: 's2', from: 'them', type: 'text', text: 'We are building something in the HR tech space and think Throne8 could be a great fit.', time: '10:43 AM' },
  ],
  '2': [{ id: 's1', from: 'them', type: 'text', text: 'Great post on AI networking! I think the future is hybrid AI+human workflows.', time: '9:15 AM' }],
  '3': [{ id: 's1', from: 'them', type: 'text', text: 'Are you open for a freelance project? We need a React developer for a 2-month contract. Budget is flexible.', time: '8:30 AM' }],
  '4': [{ id: 's1', from: 'them', type: 'text', text: 'Registered for your AI Summit event! Will there be networking sessions?', time: 'Yesterday' }],
  '5': [{ id: 's1', from: 'them', type: 'text', text: 'Applied for the Senior React Developer role. Fingers crossed!', time: 'Mon' }],
  '6': [{ id: 's1', from: 'them', type: 'text', text: 'Your recent post resonated with me a lot. I have been thinking about the same things.', time: 'Sun' }],
  '7': [{ id: 's1', from: 'them', type: 'text', text: 'Wanted to follow up on our last conversation about the partnership opportunity. Still interested?', time: 'Sat' }],
};

export const AUTO_REPLIES = [
  'Thanks! Will get back to you soon 🙏',
  'That sounds great! Let me check my schedule.',
  'Absolutely, lets connect this week.',
  'Noted! I will review and respond shortly.',
  '👍 Got it!',
  'Interesting! Tell me more.',
  'Perfect, looking forward to it!',
];



export type EventStatusFilter = 'all' | 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
export const TABS: EventStatusFilter[] = ['all', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

