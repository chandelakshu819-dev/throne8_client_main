// import { MentorData, Service, Review, PayMethod  } from "../interface";
import React from "react";
import { MentorData, Service, Review, PayMethod } from "./types";

// ===== CONSTANTS =====
export const DOMAINS = [
  'web_development',
  'career_guidance', 
  'interview_prep',
  'data_science',
  'product_management',
  'design',
  'mobile_development',
  'devops',
  'blockchain',
  'cybersecurity',
] as const;

export const DOMAIN_LABELS: Record<string, string> = {
  web_development: 'Web Development',
  career_guidance: 'Career Guidance',
  interview_prep: 'Interview Prep',
  data_science: 'Data Science/AI',
  product_management: 'Product Management',
  design: 'Design (UI/UX)',
  mobile_development: 'Mobile Development',
  devops: 'DevOps',
  blockchain: 'Blockchain',
  cybersecurity: 'Cybersecurity',
};

export const EXPERIENCE_OPTIONS = [
  { label: '0-1 Years', value: 1 },
  { label: '1-3 Years', value: 2 },
  { label: '3-5 Years', value: 4 },
  { label: '5-8 Years', value: 6 },
  { label: '8-12 Years', value: 9 },
  { label: '12+ Years', value: 13 },
] as const;


export const MENTOR: MentorData = {
    name: "Dhananjay Sharma",
    rating: 4.9,
    title: "Corporate Finance Manager @ Somany Impresa Group",
    education: "IIM Ranchi MBA'24",
    achievement: "(Director's Merit List) | Ex-J.P. Morgan Chase & Co. Intern",
    experience: "4 years of Experience",
    totalEngagements: 2313,
    attendance: "93%",
    responseTime: "< 2 hours",
    successRate: "97%",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces",
    verified: true,
    about: "Experienced Corporate Finance Manager with expertise in financial planning, analysis, and strategic decision-making. Passionate about mentoring aspiring finance professionals and helping them achieve their career goals.",
    workExperience: [
        { company: "Somany Impresa Group", position: "Corporate Finance Manager", duration: "2022 - Present", location: "Mumbai, India", description: "Leading financial planning and analysis for the organization" },
        { company: "J.P. Morgan Chase & Co.", position: "Finance Intern", duration: "2021 - 2022", location: "Mumbai, India", description: "Worked on financial modeling and investment analysis" },
    ],
};
export const SERVICES: Service[] = [
    { id: "1", type: "Resource", title: "Strong Action Verbs for your Resume/CV", duration: "30 min", originalPrice: 300, price: "Free" },
    { id: "2", type: "1:1 Call", title: "LinkedIn Zero to Hero (Limited Time Offer)", duration: "15 Min", originalPrice: 800, price: 199 },
    { id: "3", type: "1:1 Call", title: "Quick CV/Resume Review", duration: "15 Min", originalPrice: 600, price: 199 },
    { id: "4", type: "1:1 Call", title: "Quick Call (Limited Time Offer)", duration: "15 Min", originalPrice: 600, price: 199 },
    { id: "5", type: "1:1 Call", title: "GD/PI Prep ; Mock Interview", duration: "45 Min", originalPrice: 900, price: 599, popular: true },
    { id: "6", type: "Query", title: "Ask a Query", duration: "3 Days", originalPrice: 20, price: "Free" },
    { id: "7", type: "Resource", title: "ATS Friendly Resume-Template", duration: "30 min", originalPrice: null, price: "Free" },
    { id: "8", type: "Resource", title: "J.P.Morgan Chase & Co. CV/Resume that worked", duration: "30 min", originalPrice: null, price: "Free" },
];

export const REVIEWS: Review[] = [
    { id: 1, name: "Priya Sharma", rating: 5, date: "2 days ago", comment: "Excellent guidance on CV preparation. Dhananjay helped me identify key areas for improvement and his feedback was very actionable. Highly recommend!", service: "Quick CV/Resume Review", verified: true },
    { id: 2, name: "Rahul Kumar", rating: 5, date: "5 days ago", comment: "Amazing mentor! The LinkedIn session was incredibly valuable. Got my profile optimized and started getting recruiter messages within a week.", service: "LinkedIn Zero to Hero", verified: true },
    { id: 3, name: "Ananya Reddy", rating: 4.5, date: "1 week ago", comment: "Very knowledgeable and patient. The mock interview session helped me gain confidence. Would definitely book again for GD/PI preparation.", service: "GD/PI Prep", verified: true },
    { id: 4, name: "Vikram Singh", rating: 5, date: "1 week ago", comment: "Quick and to the point. Got valuable insights in just 15 minutes. Great value for money!", service: "Quick Call", verified: false },
    { id: 5, name: "Sneha Patel", rating: 5, date: "2 weeks ago", comment: "The resume template is fantastic and really ATS-friendly. Made my job applications so much easier!", service: "ATS Friendly Resume-Template", verified: true },
];

export const TIME_SLOTS: string[] = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
    "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
];

export const MONTHS: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const DAYS: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const FILTERS: string[] = ["All", "1:1 Call", "Query", "Resources"];

export const PAY_METHODS: PayMethod[] = [
    { id: "upi", icon: "📱", label: "UPI", sub: "Google Pay, PhonePe, Paytm" },
    { id: "netbanking", icon: "🏦", label: "Net Banking", sub: "All major banks supported" },
    { id: "card", icon: "💳", label: "Credit/Debit Card", sub: "Visa, Mastercard, RuPay" },
    { id: "wallet", icon: "👛", label: "Wallets", sub: "Paytm, Amazon Pay, more" },
];

export const C = {
    bg: "#fbf7f3",
    surface: "#f3ece4",
    border: "#e0d8cf",
    muted: "#d8cec4",
    dark: "#4a3728",
    mid: "#7a5c3e",
    grad: "linear-gradient(135deg, #4a3728 0%, #7a5c3e 100%)",
    white: "#ffffff",
    disabled: "#b5a79a",
    card: "#fbf7f3",
    primary: "#4a3728",
    secondary: "#7a5c3e",
        btn: "#4a3728",
    track: "#d8cec4",
    accent: "#c9a87c",
    success: "#6b8f6e",
    warn: "#c97c4a",
} as const;

export const btnPrimary: React.CSSProperties = {
    background: C.grad,
    color: C.white,
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
};
