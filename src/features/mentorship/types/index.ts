import { ReactNode } from "react";

export type BookingStep = null | "calendar" | "details" | "payment" | "confirmation";

export interface Mentor {
  id: string | number;
  name: string;
  role?: string;
  company?: string;
  image?: string;
  avatarUrl?: string;
  rating?: number;
  expertise?: string[];
  bio?: string;
  [key: string]: any;
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

// mentorDashboard/types.ts
import type { LucideIcon } from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface ServiceType {
  name: string;
  icon: LucideIcon;
  description: string;
  emoji: string;
}

export interface Service {
  serviceName: string;
  price: string;
  duration: string;
  maxParticipants: string;
  description: string;
  serviceType: string;
  emoji?: string;
}

// ─── Tab Definition ───────────────────────────────────────────────────────────
export type TabId = "one-on-one" | "queries" | "resources" | "history";
