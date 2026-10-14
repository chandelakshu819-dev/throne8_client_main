import {
    MessageSquare,
    TrendingUp,
    Award,
    ShieldCheck,
    CalendarRange,
    Layers,
    Clock,
    Users,
} from "lucide-react";
import { Mentor, SessionType, Masterclass, UpcomingMasterclass, Company, FAQ, GradientColor } from "../types";



export const MENTORS: Mentor[] = [
    {
        id: 1,
        name: "Sarah Chen",
        role: "Product Lead",
        company: "Google",
        rating: 4.9,
        sessions: 1240,
        price: 1500,
        match: 98,
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
        tags: ["Strategy", "PM"],
        exp: "8 Yrs",
    },
    {
        id: 2,
        name: "David Miller",
        role: "Staff Engineer",
        company: "Netflix",
        rating: 5.0,
        sessions: 850,
        price: 2500,
        match: 94,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400",
        tags: ["Backend", "Systems"],
        exp: "12 Yrs",
    },
    {
        id: 3,
        name: "Arjun Mehta",
        role: "SDE-3",
        company: "Amazon",
        rating: 4.8,
        sessions: 2100,
        price: 1200,
        match: 89,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400",
        tags: ["DSA", "Java"],
        exp: "5 Yrs",
    },
    {
        id: 4,
        name: "Elena Rodriguez",
        role: "Design Head",
        company: "Airbnb",
        rating: 4.9,
        sessions: 430,
        price: 1800,
        match: 91,
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400",
        tags: ["UI/UX", "Branding"],
        exp: "10 Yrs",
    },
    {
        id: 5,
        name: "Marcus Thorne",
        role: "Growth Lead",
        company: "Meta",
        rating: 4.7,
        sessions: 920,
        price: 2000,
        match: 85,
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400",
        tags: ["Marketing", "Ads"],
        exp: "7 Yrs",
    },
    {
        id: 6,
        name: "Sophia Kim",
        role: "Data Scientist",
        company: "Spotify",
        rating: 5.0,
        sessions: 640,
        price: 2200,
        match: 96,
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400",
        tags: ["AI/ML", "Python"],
        exp: "6 Yrs",
    },
];

export const SESSION_TYPES: SessionType[] = [
    {
        id: 9,
        title: "Quick Call",
        price: "₹299-799",
        icon: <MessageSquare />,
        desc: "30-min rapid query solving",
    },
    {
        id: 10,
        title: "Deep Dive",
        price: "₹999-2499",
        icon: <TrendingUp />,
        desc: "60-min detailed analysis",
    },
    {
        id: 11,
        title: "Resume Review",
        price: "₹599+",
        icon: <Award />,
        desc: "ATS & visual optimization",
    },
    {
        id: 12,
        title: "Mock Interview",
        price: "₹1299+",
        icon: <ShieldCheck />,
        desc: "Real simulation & feedback",
    },
    {
        id: 13,
        title: "Career Planning",
        price: "₹1499+",
        icon: <CalendarRange />,
        desc: "6-month roadmap creation",
    },
    {
        id: 14,
        title: "Portfolio Review",
        price: "₹899+",
        icon: <Layers />,
        desc: "Design & depth check",
    },
    {
        id: 15,
        title: "Ask a Query",
        price: "₹199+",
        icon: <Clock />,
        desc: "Async written response",
    },
    {
        id: 16,
        title: "Group Sessions",
        price: "₹399+",
        icon: <Users />,
        desc: "1 Mentor + 5 Mentees",
    },
];

export const MASTERCLASSES: Masterclass[] = [
    {
        id: 1,
        title: "System Design Mastery for FAANG Interviews",
        mentorName: "David Miller",
        mentorRole: "Staff Engineer @ Netflix",
        mentorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800",
        description: "Master distributed systems, scalability patterns, and architectural decisions that land you offers at top tech companies.",
        duration: "6 Weeks",
        badge: "Advanced",
        enrolled: "2.4K",
        rating: "4.9",
        price: "12,999",
    },
    {
        id: 2,
        title: "Product Management: Zero to PM at Google",
        mentorName: "Sarah Chen",
        mentorRole: "Product Lead @ Google",
        mentorImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800",
        description: "Learn product strategy, roadmapping, stakeholder management, and frameworks used by Google's top PMs.",
        duration: "8 Weeks",
        badge: "Beginner Friendly",
        enrolled: "3.1K",
        rating: "5.0",
        price: "14,999",
    },
    {
        id: 3,
        title: "UI/UX Design Systems & Prototyping",
        mentorName: "Elena Rodriguez",
        mentorRole: "Design Head @ Airbnb",
        mentorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400",
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800",
        description: "Build world-class design systems from scratch. Learn Figma advanced techniques and design thinking used at Airbnb.",
        duration: "5 Weeks",
        badge: "Pro Level",
        enrolled: "1.8K",
        rating: "4.8",
        price: "9,999",
    },
];

export const UPCOMING_MASTERCLASSES: UpcomingMasterclass[] = [
    {
        id: 1,
        title: "Advanced React Patterns & Performance",
        mentorName: "Alex Rivera",
        mentorRole: "Senior Frontend @ Meta",
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800",
        date: "15 Jan",
        time: "6:00 PM IST",
    },
    {
        id: 2,
        title: "Building Scalable APIs with Node.js",
        mentorName: "Priya Sharma",
        mentorRole: "Backend Lead @ Amazon",
        image: "https://images.unsplash.com/photo-1629904853716-f0bc54eea481?q=80&w=800",
        date: "18 Jan",
        time: "7:30 PM IST",
    },
    {
        id: 3,
        title: "Data Analytics for Product Decisions",
        mentorName: "Michael Chen",
        mentorRole: "Data PM @ Google",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800",
        date: "22 Jan",
        time: "5:00 PM IST",
    },
];

export const TOP_COMPANIES: Company[] = [
    {
        name: "Google",
        color: "#4285F4",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,
    },
    {
        name: "Meta",
        color: "#0668E1",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.545 6.558a3.26 3.26 0 00-2.454 1.121 4.513 4.513 0 00-1.091 3.078c0 1.194.341 2.21 1.023 3.048.682.838 1.568 1.257 2.659 1.257 1.114 0 2.011-.43 2.693-1.291.682-.86 1.023-1.895 1.023-3.106 0-1.21-.33-2.235-.989-3.078-.659-.844-1.545-1.266-2.659-1.266h-.205zm-11.512 0A3.26 3.26 0 001.58 7.679a4.513 4.513 0 00-1.091 3.078c0 1.194.341 2.21 1.023 3.048.682.838 1.568 1.257 2.659 1.257 1.114 0 2.011-.43 2.693-1.291.682-.86 1.023-1.895 1.023-3.106 0-1.21-.33-2.235-.989-3.078-.659-.844-1.545-1.266-2.659-1.266h-.205z"/></svg>`,
    },
    {
        name: "Amazon",
        color: "#FF9900",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.93 17.13c-2.68 1.89-6.28 2.36-9.5 2.36-4.14 0-7.82-1.12-10.43-3.41-.22-.19-.05-.51.22-.4 3.73 1.51 8.24 2.15 12.35 1.1.86-.22 1.69-.53 1.69-.53.28-.11.45.16.2.39zM19.34 22c-.52.41-2.48 1.18-5.55 1.18-4.05 0-6.57-1.37-8.52-3.56-.25-.28-.13-.53.16-.36 2.88 1.53 6.43 2.03 9.71 1.12.74-.2 1.31-.48 1.31-.48.25-.13.38.14.16.38l.43.56zM21.17 19.35c-.13.11-.32.08-.41-.05-.09-.13-.06-.32.07-.41.21-.15.42-.3.62-.46.12-.09.28-.07.38.05.09.12.07.28-.05.38-.2.15-.41.32-.61.49z"/></svg>`,
    },
    {
        name: "Netflix",
        color: "#E50914",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.306 0V24c.488 0 .991-.017 1.503-.051V14.537l9.464 9.17c.607-.116 1.232-.26 1.862-.432V0c-.488 0-.991.017-1.503.051V10.15L6.168.432C5.561.26 4.936.116 4.306 0z"/></svg>`,
    },
];

export const TOP_COMPANIES_ROW2: Company[] = [
    {
        name: "Apple",
        color: "#000000",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.96.95-2.06 2.15-3.5 2.15-1.4 0-1.93-.86-3.55-.86-1.6 0-2.2.85-3.53.85-1.38 0-2.54-1.2-3.53-2.15C.96 18.3 0 15.5 0 12.6c0-4.6 3-7.1 5.9-7.1 1.5 0 2.8 1 3.7 1 1 0 2.5-1.1 4.2-1.1 1.8 0 3.2 1 4.1 2.3-3.6 1.5-3 6.3.6 7.8-.8 2-1.9 4-1.45 4.78z"/></svg>`,
    },
    {
        name: "Tesla",
        color: "#E82127",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.186 1l-10.186 10.407-10.186-10.407-.156.402 10.342 13.513 10.342-13.513-.156-.402zm-10.186 16.716l-7.791-10.179 7.791 7.955 7.791-7.955-7.791 10.179z"/></svg>`,
    },
    {
        name: "Microsoft",
        color: "#00A4EF",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 1h10v10h-10V1zm0 12h10v10h-10V13zM.4 1h10v10H.4V1zm0 12h10v10H.4V13z"/></svg>`,
    },
    {
        name: "Adobe",
        color: "#FF0000",
        svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.9 2H22l-8.1 19.3L13.9 2zM10.1 2H2l8.1 19.3L10.1 2zM12 7.3l4.3 10.3h-8.6L12 7.3z"/></svg>`,
    },
];
export const GRADIENT_COLORS: GradientColor[] = [

    { start: "#e8dfd6", end: "#d4c4b5" },
    { start: "#f5e6d8", end: "#e8d4c1" },
    { start: "#e0d5ca", end: "#cbbfb0" },
    { start: "#d9cec1", end: "#c4b5a3" },
    { start: "#f0e7dc", end: "#dccfbe" },
    { start: "#e5d8ca", end: "#d0c0ae" },
];

export const FAQS: FAQ[] = [
    {
        q: "How do I book a session with a mentor?",
        a: "Simply browse mentors, click 'Book', select your preferred time slot, and complete the payment. You'll receive instant confirmation.",
    },
    {
        q: "What if I need to cancel or reschedule?",
        a: "You can cancel or reschedule up to 24 hours before the session for a full refund. Check our cancellation policy for details.",
    },
    {
        q: "Are the mentors verified?",
        a: "Yes! All mentors go through a rigorous verification process including background checks, experience validation, and interview assessments.",
    },
    {
        q: "How do masterclasses work?",
        a: "Masterclasses are structured multi-week courses with live sessions, recorded content, assignments, and direct mentor interaction.",
    },
    {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards, debit cards, UPI, net banking, and digital wallets for your convenience.",
    },
];