// components/mentor-profile/types.ts

export interface WorkExperience {
    company: string;
    position: string;
    duration: string;
    location: string;
    description: string;
}

export interface MentorData {
    name: string;
    rating: number;
    title: string;
    education: string;
    achievement: string;
    experience: string;
    totalEngagements: number;
    attendance: string;
    responseTime: string;
    successRate: string;
    image: string;
    verified: boolean;
    about: string;
    workExperience: WorkExperience[];
}

export interface Service {
    id: string;
    type: "1:1 Call" | "Resource" | "Query" | string;
    title: string;
    duration: string;
    originalPrice: number | null;
    price: number | "Free";
    popular?: boolean;
}

export interface Review {
    id: number;
    name: string;
    rating: number;
    date: string;
    comment: string;
    service: string;
    verified: boolean;
}

export interface PayMethod {
    id: string;
    icon: string;
    label: string;
    sub: string;
}

export interface CalendarData {
    selectedDate: number;
    selectedTime: string;
    currentMonth: Date;
    availabilityId: string;
    slotTime: string;
}

export type BookingStep = null | "calendar" | "query" | "details" | "payment" | "confirmation";


export interface FormData {
    name: string;
    email: string;
    phone: string;
    referralCode: string;
}