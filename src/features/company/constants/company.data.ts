
import type {
  CompanyMeta, CompanyStat, TeamMember, JobPosting, Milestone,
  Product, CultureValue, Perk, NewsPost, Testimonial, GalleryPhoto,
  SuggestedPerson, ProfileProgressItem, Post,
} from '@/features/company/type/company.types'

export const MOCK_COMPANY_META: CompanyMeta = {
  id: 'throne8',
  name: 'Throne8 Pvt. Ltd. India',
  legalName: 'Thronet Technology Private Limited',
  tagline: 'Empowering Professional Networking for Millions',
  description: 'AI-powered professional networking built for scale, security, and meaningful connections. Join 50,000+ professionals who network smarter.',
  industry: 'Software / SaaS',
  subIndustry: 'Professional Networking',
  founded: '2022',
  size: '11–50 employees',
  employeeCount: 42,
  headquarters: {
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    country: 'India',
    full: 'Bhopal, Madhya Pradesh, India',
  },
  website: 'https://throne8.com',
  socialLinks: {
    linkedin: 'https://linkedin.com/company/throne8',
    twitter: 'https://twitter.com/throne8hq',
    github: 'https://github.com/throne8',
    instagram: 'https://instagram.com/throne8hq',
  },
  bannerUrl: 'https://images.unsplash.com/photo-1761960084255-7b45bd632251?auto=format&fit=crop&q=80&w=1744',
  isHiring: true,
  isVerified: true,
  followers: 3282,
};

export const MOCK_STATS: CompanyStat[] = [
  { id: 's1', label: 'Active Users', value: '50', suffix: 'K+', description: 'Professionals networking daily', iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 's2', label: 'Companies', value: '1.2', suffix: 'K+', description: 'Enterprise clients worldwide', iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M3 21h2m-2 0h2M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 's3', label: 'Countries', value: '28', suffix: '+', description: 'Global presence', iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064' },
  { id: 's4', label: 'Uptime SLA', value: '99.9', suffix: '%', description: 'Enterprise-grade reliability', iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
];

export const MOCK_TEAM: TeamMember[] = [
  {
    id: 'honey-sharma', name: 'Honey Sharma', role: 'Co-Founder & CEO', department: 'Leadership',
    bio: 'Visionary leader with 8+ years in AI and scalable systems. Driving Throne8 toward empowering millions of professionals globally.',
    avatarUrl: 'https://i.pinimg.com/736x/f6/61/ea/f661ea61616909838a9fbfeda0d2ea14.jpg',
    initials: 'HS', socialLinks: { linkedin: '#', twitter: '#' }, isFounder: true, joinedAt: '2022-01-01',
  },
  {
    id: 'priya-singh', name: 'Priya Singh', role: 'Co-Founder & CTO', department: 'Engineering',
    bio: 'Expert in distributed systems and AI/ML pipelines. Architected the core networking engine powering Throne8.',
    initials: 'PS', socialLinks: { linkedin: '#', github: '#' }, isFounder: true, joinedAt: '2022-01-01',
  },
  {
    id: 'arjun-mehta', name: 'Arjun Mehta', role: 'VP of Product', department: 'Product',
    bio: 'Product strategist focused on user-centric design and growth loops. Former lead at top SaaS companies.',
    initials: 'AM', socialLinks: { linkedin: '#' }, isFounder: false, joinedAt: '2022-06-01',
  },
  {
    id: 'riya-patel', name: 'Riya Patel', role: 'Head of Design', department: 'Design',
    bio: 'Award-winning designer crafting experiences that are beautiful, accessible, and delightful to use.',
    initials: 'RP', socialLinks: { linkedin: '#' }, isFounder: false, joinedAt: '2022-08-01',
  },
  {
    id: 'dev-kumar', name: 'Dev Kumar', role: 'Head of Security', department: 'Infrastructure',
    bio: 'Cybersecurity architect with expertise in zero-trust architecture and SOC 2 compliance frameworks.',
    initials: 'DK', socialLinks: { linkedin: '#' }, isFounder: false, joinedAt: '2023-01-01',
  },
  {
    id: 'sara-thomas', name: 'Sara Thomas', role: 'Head of Growth', department: 'Marketing',
    bio: 'Data-driven growth hacker who scaled user acquisition from 0 to 50K in under 18 months.',
    initials: 'ST', socialLinks: { linkedin: '#', twitter: '#' }, isFounder: false, joinedAt: '2023-03-01',
  },
];

export const MOCK_JOBS: JobPosting[] = [
  {
    id: 'swe-backend-01', title: 'Senior Backend Engineer', slug: 'senior-backend-engineer',
    department: 'Engineering', location: 'Bhopal / Remote', type: 'Full-time',
    experience: '4-7 years', salaryRange: '₹25–45 LPA',
    description: 'Own and scale the core APIs powering 50K+ professionals. You will design, build, and ship high-performance backend systems.',
    responsibilities: ['Design scalable REST/GraphQL APIs', 'Optimize database queries for high-traffic scenarios', 'Lead backend architecture decisions', 'Mentor junior engineers'],
    requirements: ['4+ years Node.js or Go', 'Strong PostgreSQL & Redis', 'Experience with AWS or GCP', 'Passion for clean, tested code'],
    tags: ['Node.js', 'PostgreSQL', 'Redis', 'AWS'], postedAt: '2024-12-11T00:00:00Z', isActive: true,
  },
  {
    id: 'ml-engineer-01', title: 'ML Engineer — Recommendation Systems', slug: 'ml-engineer-recommendations',
    department: 'AI & ML', location: 'Remote', type: 'Full-time',
    experience: '3-6 years', salaryRange: '₹30–50 LPA',
    description: 'Build the AI brain of Throne8. Design recommendation models that intelligently connect millions of professionals.',
    responsibilities: ['Design and train recommendation models', 'Build MLflow pipelines for A/B experimentation', 'Deploy models to production on Kubernetes', 'Collaborate with product to measure impact'],
    requirements: ['3+ years ML in production', 'Strong Python & PyTorch', 'Experience with recommendation systems', 'MLOps mindset'],
    tags: ['Python', 'PyTorch', 'MLflow', 'Kubernetes'], postedAt: '2024-12-08T00:00:00Z', isActive: true,
  },
  {
    id: 'frontend-01', title: 'Senior Frontend Engineer', slug: 'senior-frontend-engineer',
    department: 'Engineering', location: 'Bhopal / Hybrid', type: 'Full-time',
    experience: '3-5 years', salaryRange: '₹20–35 LPA',
    description: 'Shape the UI of a product used by 50K+ professionals. You care deeply about performance, accessibility, and pixel-perfect execution.',
    responsibilities: ['Build React/Next.js components with performance in mind', 'Own the design system', 'Partner closely with designers', 'Write comprehensive tests'],
    requirements: ['3+ years React / Next.js', 'TypeScript expert', 'Tailwind CSS proficiency', 'Accessibility-first mindset'],
    tags: ['React', 'Next.js', 'TypeScript', 'Tailwind'], postedAt: '2024-12-06T00:00:00Z', isActive: true,
  },
  {
    id: 'product-01', title: 'Product Manager — Growth', slug: 'product-manager-growth',
    department: 'Product', location: 'Bhopal', type: 'Full-time',
    experience: '3-5 years', salaryRange: '₹20–32 LPA',
    description: 'Drive acquisition, activation, and retention at Throne8. You live in the data, love experiments, and ship fast.',
    responsibilities: ['Own the growth roadmap', 'Run A/B experiments end-to-end', 'Align engineering, design, and marketing', 'Define north-star metrics'],
    requirements: ['3+ years product management', 'Strong analytical skills', 'Experience with growth frameworks', 'SQL proficiency a plus'],
    tags: ['Analytics', 'A/B Testing', 'Roadmapping', 'SQL'], postedAt: '2024-12-06T00:00:00Z', isActive: true,
  },
  {
    id: 'designer-01', title: 'Senior UX Designer', slug: 'senior-ux-designer',
    department: 'Design', location: 'Remote', type: 'Full-time',
    experience: '4-7 years', salaryRange: '₹18–28 LPA',
    description: 'Design experiences used by tens of thousands daily. You are obsessed with the user and can translate complexity into simplicity.',
    responsibilities: ['Lead end-to-end UX for major features', 'Maintain and evolve the design system', 'Conduct user research and usability tests', 'Collaborate with engineering on implementation'],
    requirements: ['4+ years UX design', 'Figma expert', 'Strong user research skills', 'Portfolio showcasing complex product work'],
    tags: ['Figma', 'Design Systems', 'User Research', 'Prototyping'], postedAt: '2024-11-29T00:00:00Z', isActive: true,
  },
  {
    id: 'devops-01', title: 'DevOps Engineer', slug: 'devops-engineer',
    department: 'Infrastructure', location: 'Remote', type: 'Full-time',
    experience: '2-5 years', salaryRange: '₹18–30 LPA',
    description: 'Own the infrastructure that powers 99.9% uptime for 50K+ professionals. You automate everything.',
    responsibilities: ['Manage AWS infrastructure with Terraform', 'Build and maintain CI/CD pipelines', 'Monitor system health and performance', 'Lead incident response'],
    requirements: ['2+ years DevOps / SRE', 'AWS certified preferred', 'Terraform & Kubernetes', 'Observability tooling (Datadog, Grafana)'],
    tags: ['Terraform', 'AWS', 'Kubernetes', 'GitHub Actions'], postedAt: '2024-11-29T00:00:00Z', isActive: true,
  },
];

export const MOCK_MILESTONES: Milestone[] = [
  { id: 'm1', year: '2022', quarter: 'Q1', title: 'Founded', type: 'team', description: 'Throne8 incorporated. Vision set to redefine professional networking with AI for India and beyond.' },
  { id: 'm2', year: '2022', quarter: 'Q3', title: 'Seed Round', type: 'funding', description: 'Raised ₹2.5 Cr seed funding from angel investors and leading family offices to build the MVP.' },
  { id: 'm3', year: '2023', quarter: 'Q1', title: 'Beta Launch', type: 'product', description: 'Platform launched to 500 carefully selected early adopters. 92% satisfaction on day one.' },
  { id: 'm4', year: '2023', quarter: 'Q3', title: '10K Users', type: 'growth', description: 'Crossed 10,000 active users within 6 months of public launch — entirely organic growth.' },
  { id: 'm5', year: '2024', quarter: 'Q1', title: 'Series A', type: 'funding', description: 'Closed ₹15 Cr Series A led by top institutional investors. Team grew from 8 to 40 members.' },
  { id: 'm6', year: '2024', quarter: 'Q3', title: '50K+ Users', type: 'growth', description: 'Scaling rapidly across India and Southeast Asia with enterprise contracts in 3 countries.' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'ai-networking', name: 'AI Networking Engine', slug: 'ai-networking',
    tagline: 'Connect with purpose.', badge: 'Core',
    description: 'Proprietary AI matches professionals based on goals, skills, and growth trajectory — not just titles or companies.',
    iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
    features: ['Smart Connection Scoring', 'Contextual AI Introductions', 'Mutual Goal Matching', 'Conversation Starters'],
    ctaLabel: 'Explore the engine', ctaUrl: '#',
  },
  {
    id: 'security-suite', name: 'Security Suite', slug: 'security-suite',
    tagline: 'Zero-trust by design.', badge: 'Enterprise',
    description: 'Military-grade encryption, SOC 2 Type II compliant infrastructure, and real-time threat detection — enterprise security as default.',
    iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    features: ['AES-256 Encryption', 'SOC 2 Type II Certified', 'Real-time Threat Detection', 'Compliance Dashboard'],
    ctaLabel: 'Security overview', ctaUrl: '#',
  },
  {
    id: 'analytics', name: 'Profile Analytics', slug: 'profile-analytics',
    tagline: 'Grow with data.',
    description: 'Deep analytics on profile visibility, content performance, and network growth — finally built for professionals who care about impact.',
    iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    features: ['Audience Demographics', 'Content Reach Tracking', 'Network Growth Insights', 'Benchmark Reports'],
    ctaLabel: 'View analytics demo', ctaUrl: '#',
  },
  {
    id: 'enterprise-hub', name: 'Enterprise Hub', slug: 'enterprise-hub',
    tagline: 'Scale your employer brand.', badge: 'New',
    description: 'Dedicated company pages, talent pipeline management, and employer branding tools — built for teams serious about hiring.',
    iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M3 21h2',
    features: ['Branded Company Pages', 'ATS Integration Ready', 'Talent Pipeline Manager', 'Employer Analytics'],
    ctaLabel: 'Get enterprise demo', ctaUrl: '#',
  },
];

export const MOCK_CULTURE_VALUES: CultureValue[] = [
  { id: 'cv1', title: 'Innovation First', description: 'We question every assumption and build from first principles. Good enough is the enemy of great.', iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { id: 'cv2', title: 'Remote-First DNA', description: 'Async by default, documentation-driven, fully distributed. Your timezone is your home turf — we hire for output, not presence.', iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064' },
  { id: 'cv3', title: 'Radical Ownership', description: 'No micromanagement. You own your outcomes from ideation to delivery. Everyone is a decision-maker in their domain.', iconPath: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438' },
  { id: 'cv4', title: 'User Obsession', description: 'Every decision is made through the lens of our users. We read every support ticket, every review, every DM.', iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { id: 'cv5', title: 'Move Fast, Safely', description: 'We ship weekly. Speed and quality are not opposites — they are both disciplines we practice simultaneously.', iconPath: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'cv6', title: 'Equity & Growth', description: 'Every Throne8 employee gets equity from day one. When the company wins, every person on the team wins.', iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export const MOCK_PERKS: Perk[] = [
  { id: 'p1', iconName: 'Monitor', label: 'Remote-friendly', desc: 'Work from anywhere in India' },
  { id: 'p2', iconName: 'Coffee', label: 'Team offsites', desc: 'Quarterly in-person sprints' },
  { id: 'p3', iconName: 'BookOpen', label: 'Learning budget', desc: '₹50K/year for growth' },
  { id: 'p4', iconName: 'Plane', label: 'Flexible PTO', desc: 'Unlimited, trust-based leave' },
  { id: 'p5', iconName: 'Heart', label: 'Health coverage', desc: 'Family medical insurance' },
  { id: 'p6', iconName: 'Award', label: 'Employee equity', desc: 'ESOPs from day one' },
];

export const MOCK_NEWS: NewsPost[] = [
  {
    id: 'series-a', slug: 'throne8-closes-series-a',
    title: 'Throne8 Closes ₹15 Cr Series A to Accelerate AI Networking',
    excerpt: 'The funding will be used to double our engineering team, expand to Southeast Asia, and deepen our AI recommendation engine.',
    category: 'Company News', date: '2024-12-01T00:00:00Z', readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'enterprise-hub', slug: 'introducing-enterprise-hub',
    title: 'Introducing Enterprise Hub: Employer Branding at Scale',
    excerpt: 'Companies like yours deserve more than a static page. Enterprise Hub gives HR teams the tools to attract the best talent.',
    category: 'Product Update', date: '2024-11-01T00:00:00Z', readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'zero-to-50k', slug: 'from-zero-to-50k',
    title: 'From 0 to 50,000: How We Built Throne8 Without Hype',
    excerpt: 'Founder Honey Sharma shares the unfiltered story of building a professional network in India from scratch.',
    category: 'Founders Story', date: '2024-10-01T00:00:00Z', readTime: '6 min read',
    imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80&auto=format&fit=crop',
  },
];

export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: 't1', author: 'Radhika Menon', role: 'VP Engineering', company: 'TechFlow India', initials: 'RM', rating: 5,
    quote: "Throne8's AI matching is unlike anything we've used. We hired 3 senior engineers in 6 weeks that we'd been searching for over a year."
  },
  {
    id: 't2', author: 'Vikram Basu', role: 'CISO', company: 'FinSecure', initials: 'VB', rating: 5,
    quote: 'The security posture of Throne8 was the deciding factor for us. SOC 2 compliance gave our CISO the confidence to approve enterprise rollout.'
  },
  {
    id: 't3', author: 'Ananya Desai', role: 'Independent Consultant', company: 'Self-Employed', initials: 'AD', rating: 5,
    quote: "I've tripled my consulting pipeline in 4 months. The contextual introductions feature alone is worth the subscription."
  },
];

export const MOCK_GALLERY: GalleryPhoto[] = [
  { id: 'g1', src: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80&auto=format&fit=crop', alt: 'Team collaboration session' },
  { id: 'g2', src: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80&auto=format&fit=crop', alt: 'Strategy workshop' },
  { id: 'g3', src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&auto=format&fit=crop', alt: 'Team working together' },
  { id: 'g4', src: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80&auto=format&fit=crop', alt: 'Product team discussion' },
  { id: 'g5', src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80&auto=format&fit=crop', alt: 'Engineering setup' },
  { id: 'g6', src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80&auto=format&fit=crop', alt: 'Team offsite' },
];

export const MOCK_SUGGESTED_PEOPLE: SuggestedPerson[] = [
  { id: 'sp1', name: 'Chhavi Arora', title: 'AWS Cloud & DevOps | Sophomore @ IIIT', initials: 'CA', mutualConnections: 3 },
  { id: 'sp2', name: 'Manan Telrandhe', title: 'Tech-savvy Software Developer', initials: 'MT', mutualConnections: 7 },
  { id: 'sp3', name: 'Ankit Shinde', title: 'Software Engineer @Techvalens | Node.js', initials: 'AS', mutualConnections: 2 },
  { id: 'sp4', name: 'Harshit Kushwah', title: 'Software Engineer @NIMBLEdGE | iOS Dev', initials: 'HK', mutualConnections: 5 },
];

export const MOCK_PROFILE_PROGRESS: ProfileProgressItem[] = [
  { id: 'pp1', label: 'Profile Completion', pct: 85, hint: 'Add more skills to reach 100%' },
  { id: 'pp2', label: 'Network Growth', pct: 60, hint: 'Connect with 20 more professionals' },
  { id: 'pp3', label: 'Content Engagement', pct: 40, hint: 'Share 3 more posts this week' },
];


const THRONE8_AUTHOR = {
  name: 'Throne8', role: 'Official Account', initials: 'T8',
};

export const MOCK_POSTS: Post[] = [
  // ── Images ──────────────────────────────────────────────────────
  {
    id: 'img-01', type: 'image',
    author: THRONE8_AUTHOR,
    imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80&auto=format&fit=crop',
    altText: 'Team collaboration session',
    aspectRatio: '4:3',
    caption: 'Our team during the Q4 product sprint in Bhopal. Amazing energy in the room — big things coming 🚀',
    publishedAt: '2024-12-10T10:00:00Z',
    likes: 312, comments: 28, shares: 14,
    tags: ['TeamLife', 'Throne8', 'BehindTheScenes'],
  },
  {
    id: 'img-02', type: 'image',
    author: THRONE8_AUTHOR,
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80&auto=format&fit=crop',
    altText: 'Team working together',
    aspectRatio: '16:9',
    caption: 'When the whole team comes together, magic happens. Proud of what we\'re building every single day.',
    publishedAt: '2024-12-01T09:00:00Z',
    likes: 421, comments: 35, shares: 22,
    tags: ['Culture', 'Teamwork'],
  },
  {
    id: 'img-03', type: 'image',
    author: { name: 'Honey Sharma', role: 'Co-Founder & CEO', initials: 'HS', avatarUrl: 'https://i.pinimg.com/736x/f6/61/ea/f661ea61616909838a9fbfeda0d2ea14.jpg' },
    imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80&auto=format&fit=crop',
    altText: 'Product team whiteboard session',
    aspectRatio: '4:3',
    caption: 'Mapping out the next chapter of Throne8. The whiteboard sessions are where ideas turn into products.',
    publishedAt: '2024-11-20T11:00:00Z',
    likes: 289, comments: 41, shares: 18,
    tags: ['ProductThinking', 'Founder'],
  },
  {
    id: 'img-04', type: 'image',
    author: THRONE8_AUTHOR,
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80&auto=format&fit=crop',
    altText: 'Engineering team setup',
    aspectRatio: '1:1',
    caption: 'Setup goals. The Throne8 engineering team works async-first — but when we sync, we really sync.',
    publishedAt: '2024-11-10T08:00:00Z',
    likes: 198, comments: 17, shares: 9,
    tags: ['Engineering', 'RemoteWork'],
  },

  // ── Documents ───────────────────────────────────────────────────
  {
    id: 'doc-01', type: 'document',
    author: THRONE8_AUTHOR,
    title: 'Throne8 Platform — Product Deck 2024',
    fileType: 'pdf',
    fileSize: '3.2 MB',
    pageCount: 24,
    downloadUrl: '#',
    previewUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80&auto=format&fit=crop',
    caption: 'Our full platform overview deck covering AI networking, security suite, analytics and enterprise features. Updated Q4 2024.',
    publishedAt: '2024-12-05T09:00:00Z',
    likes: 87, comments: 12, shares: 43,
    tags: ['ProductDeck', 'Throne8Platform'],
  },
  {
    id: 'doc-02', type: 'document',
    author: THRONE8_AUTHOR,
    title: 'AI Networking Engine — Technical Whitepaper',
    fileType: 'pdf',
    fileSize: '1.8 MB',
    pageCount: 16,
    downloadUrl: '#',
    caption: 'Deep dive into how our recommendation engine works — model architecture, training data, and the metrics that matter.',
    publishedAt: '2024-11-15T09:00:00Z',
    likes: 134, comments: 21, shares: 67,
    tags: ['AI', 'Technical', 'ML'],
  },
  {
    id: 'doc-03', type: 'document',
    author: THRONE8_AUTHOR,
    title: 'Throne8 Media Kit 2024',
    fileType: 'zip',
    fileSize: '18.4 MB',
    downloadUrl: '#',
    caption: 'Official logos, brand guidelines, product screenshots and press assets. All in one place for media partners.',
    publishedAt: '2024-10-20T09:00:00Z',
    likes: 56, comments: 8, shares: 31,
    tags: ['BrandKit', 'Press', 'Media'],
  },
  {
    id: 'doc-04', type: 'document',
    author: THRONE8_AUTHOR,
    title: 'SOC 2 Type II Compliance Report Summary',
    fileType: 'pdf',
    fileSize: '0.9 MB',
    pageCount: 8,
    downloadUrl: '#',
    caption: 'Throne8 is SOC 2 Type II certified. Here\'s a summary of our compliance posture for enterprise customers.',
    publishedAt: '2024-10-01T09:00:00Z',
    likes: 72, comments: 6, shares: 29,
    tags: ['Security', 'Enterprise', 'Compliance'],
  },

  // ── Articles ────────────────────────────────────────────────────
  {
    id: 'art-01', type: 'article',
    author: { name: 'Honey Sharma', role: 'Co-Founder & CEO', initials: 'HS', avatarUrl: 'https://i.pinimg.com/736x/f6/61/ea/f661ea61616909838a9fbfeda0d2ea14.jpg' },
    title: 'Why we rebuilt professional networking from scratch',
    excerpt: 'Existing platforms optimise for engagement over outcomes. We built Throne8 to flip that — every feature asks: does this help someone grow their career?',
    readTime: '5 min read',
    coverUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80&auto=format&fit=crop',
    articleUrl: '#',
    category: 'Founders',
    caption: 'My thoughts on why the networking space needed a complete rethink — and what we\'re doing differently.',
    publishedAt: '2024-12-08T09:00:00Z',
    likes: 534, comments: 67, shares: 112,
    tags: ['Founders', 'ProductPhilosophy'],
  },
  {
    id: 'art-02', type: 'article',
    author: { name: 'Priya Singh', role: 'Co-Founder & CTO', initials: 'PS' },
    title: 'Scaling to 50K users: what our infra stack looks like today',
    excerpt: 'We went from a single EC2 to a multi-region, auto-scaling infrastructure in 18 months. Here\'s every decision we made and why.',
    readTime: '8 min read',
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80&auto=format&fit=crop',
    articleUrl: '#',
    category: 'Engineering',
    caption: 'A deep dive into our infrastructure journey — and the mistakes we made along the way.',
    publishedAt: '2024-11-25T09:00:00Z',
    likes: 412, comments: 55, shares: 89,
    tags: ['Engineering', 'Infrastructure', 'ScaleUp'],
  },
  {
    id: 'art-03', type: 'article',
    author: { name: 'Sara Thomas', role: 'Head of Growth', initials: 'ST' },
    title: '0 to 50,000 users with ₹0 in paid ads',
    excerpt: 'We built our entire user base through community, content and word of mouth. Here\'s the exact playbook we used.',
    readTime: '6 min read',
    coverUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&auto=format&fit=crop',
    articleUrl: '#',
    category: 'Growth',
    caption: 'Organic growth is hard but it builds something paid can\'t buy — trust. Here\'s how we did it.',
    publishedAt: '2024-11-01T09:00:00Z',
    likes: 678, comments: 89, shares: 156,
    tags: ['Growth', 'Marketing', 'Organic'],
  },
];
