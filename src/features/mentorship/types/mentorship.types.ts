import { createMentorSchema } from "@/features/mentorship/validators/mentor.validation";
import z from "zod";

// ===== INTERFACES =====
export type CreateMentorFormData = z.infer<typeof createMentorSchema>;

export interface CreateMentorPayload {
  title: string;
  bio: string;
  domains: string[];
  skills: string[];
  experience: string; // JSON string for form-data
  socialProof: string; // JSON string for form-data
  profilePic: File;
}

export interface MentorResponse {
  success: boolean;
  message: string;
  data: {
    mentorId: string;
    userId: string;
    profilePic: string;
    status: string;
    title: string;
    bio: string;
    domains: string[];
    skills: string[];
    languages: string[];
    experience: {
      total: number;
      level: string;
      currentRole: string;
      previousRoles: {
        title: string;
        company: string;
        duration: string;
        _id: string;
      }[];
    };
    pricing: Record<string, number>;
    stats: Record<string, number>;
    availability: {
      timezone: string;
      daysAvailable: string[];
      autoAcceptBookings: boolean;
      maxSessionsPerDay: number;
      bufferBetweenSessions: number;
    };
    socialProof: {
      linkedinUrl?: string;
      githubUrl?: string;
    };
    preferences: {
      acceptGroupSessions: boolean;
      maxGroupSize: number;
      acceptQueries: boolean;
      maxQueriesPerWeek: number;
      notificationPreferences: {
        email: boolean;
        sms: boolean;
        push: boolean;
      };
    };
    verification: { isVerified: boolean };
    featured: { isFeatured: boolean };
    profileCompleteness: number;
    createdAt: string;
    college?: string;
    degree?: string;
    user: {
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}