// components/mentor-profile/types.ts

import { ReactNode } from "react";
import { TabId } from "@/features/mentorship/types";

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



export interface FormData {
    name: string;
    email: string;
    phone: string;
    referralCode: string;
}


export interface Mentor {
    [x: string]: any;
    id: number;
    name: string;
    role: string;
    company: string;
    rating: number;
    sessions: number;
    price: number;
    match: number;
    image: string;
    tags: string[];
    exp: string;
}

export interface SessionType {
    id: number;
    title: string;
    price: string;
    icon: ReactNode;
    desc: string;
}

export interface Masterclass {
    id: number;
    title: string;
    mentorName: string;
    mentorRole: string;
    mentorImage: string;
    image: string;
    description: string;
    duration: string;
    badge: string;
    enrolled: string;
    rating: string;
    price: string;
}

export interface UpcomingMasterclass {
    id: number;
    title: string;
    mentorName: string;
    mentorRole: string;
    image: string;
    date: string;
    time: string;
}

export interface Company {
    name: string;
    color: string;
    svg: string;
}

export interface FAQ {
    q: string;
    a: string;
}

export interface DaySchedule {
    day: string;
    date: string;
}

export interface GradientColor {
    start: string;
    end: string;
}


// ─── Types ────────────────────────────────────────────────────────────────────
export interface ToastProps {
    msg: string;
    visible: boolean;
}

export interface ReminderModalProps {
    sessionName: string;
    onClose: () => void;
    onSave: (time: string) => void;
}

export interface StatCardProps {
    num: string;
    label: string;
}

export interface ProgressBarProps {
    value: number;
    label: string;
}

export interface OneOnOneTabProps {
    onReminder: (sessionName: string, onSave: () => void) => void;
}

export interface QueriesTabProps {
    toast: (msg: string) => void;
}

export interface ResourcesTabProps {
    toast: (msg: string) => void;
}

export interface ModalState {
    open: boolean;
    session: string;
    onSave: (() => void) | null;
}

// ─── ONE-ON-ONE TAB ───────────────────────────────────────────────────────────
export interface UpcomingSession {
    id: string;
    name: string;
    date: string;
    set: boolean;
}

export interface BookableSession {
    icon: string;
    name: string;
    mentor: string;
    match: number;
}


// ─── QUERIES TAB ──────────────────────────────────────────────────────────────
export interface Query {
    initials: string;
    name: string;
    time: string;
    text: string;
    tags: string[];
    answered: boolean;
}

// ─── RESOURCES TAB ────────────────────────────────────────────────────────────
export interface Resource {
    icon: string;
    type: string;
    name: string;
    meta: string;
    btn: string;
    action: string;
}

export interface SessionHistory {
    name: string;
    date: string;
    stars: number;
}



export interface Tab {
    id: TabId;
    label: string;
}