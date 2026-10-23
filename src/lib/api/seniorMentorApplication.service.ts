// lib/api/seniorMentorApplication.service.ts
import api from './api.intance';

// ── Application status enum (mirrors backend ApplicationStatus) ───────────────
export enum ApplicationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export const MIN_HELP_AREAS = 3;
export const MAX_HELP_AREAS = 7;

// ── Shape of the application returned by GET /me ──────────────────────────────
export interface SeniorMentorApplication {
  applicationId: string;
  userId: string;
  mentorRole: 'senior_mentor' | 'alumni';
  fullName: string;
  college: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: number;
  currentRole: string;
  currentCompany: string;
  shortBio: string;
  linkedinUrl: string;
  githubUrl?: string;
  portfolioUrl?: string;
  yearsOfExperience: number;
  experienceLevel: string;
  primaryExpertise: string;
  otherSkills: string[];
  technologies: string[];
  achievements: string[];
  certifications: string[];
  helpAreas: string[];
  motivation: string;
  adviceToJuniorSelf: string;
  profilePhoto?: string;
  resumeUrl?: string;
  proofDocumentUrl?: string;
  verificationStatus: ApplicationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Service ───────────────────────────────────────────────────────────────────
class SeniorMentorApplicationService {
  /**
   * GET /api/v1/mentorship/senior-mentor-applications/me
   * Returns the current user's Senior Mentor application, or null if none.
   */
  static async getMyApplication(): Promise<SeniorMentorApplication | null> {
    try {
      console.log('🎓 [SENIOR_MENTOR_APP] Fetching my application...');
      const { data } = await api.get('/mentorship/senior-mentor-applications/me');
      console.log('✅ [SENIOR_MENTOR_APP] Fetched:', data?.data?.applicationId);
      return data?.data ?? null;
    } catch (error: any) {
      // A 404 means the user simply hasn't applied yet — that is expected.
      if (error?.response?.status === 404) {
        console.log('ℹ️ [SENIOR_MENTOR_APP] No application found for user.');
        return null;
      }
      console.error('❌ [SENIOR_MENTOR_APP] Failed to fetch application:', error?.message);
      throw error;
    }
  }

  /**
   * POST /api/v1/mentorship/senior-mentor-applications/apply
   * Submit a Senior Mentor application via multipart/form-data.
   * Axios automatically sets the Content-Type with boundary for FormData.
   */
    static async apply(formData: FormData): Promise<SeniorMentorApplication> {
    try {
      console.log('🎓 [SENIOR_MENTOR_APP] Submitting application...');
      const { data } = await api.post('/mentorship/senior-mentor-applications/apply', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ [SENIOR_MENTOR_APP] Successfully applied:', data?.data?.applicationId);
      return data?.data;
    } catch (error: any) {
      console.error('❌ [SENIOR_MENTOR_APP] Application failed:', error?.response?.data?.message || error.message);
      throw error;
    }
  }

    /**
   * PUT /api/v1/mentorship/senior-mentor-applications/me/profile-photo
   * Updates ONLY the profile photo of the current user's Senior Mentor application.
   * Returns the updated application, or null if the user has no application (404).
   * NOTE: backend endpoint must exist (see senior profile-photo route).
   */
    static async updateMyProfilePhoto(file: File): Promise<SeniorMentorApplication | null> {
      try {
        const formData = new FormData();
        formData.append('profilePhoto', file);
        const { data } = await api.put('/mentorship/senior-mentor-applications/me/profile-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data?.data ?? null;
      } catch (error: any) {
        // 404 = user ne senior mentor ke liye apply hi nahi kiya -> expected
        if (error?.response?.status === 404) return null;
        console.error('❌ [SENIOR_MENTOR_APP] Failed to update profile photo:', error?.response?.data?.message || error?.message);
        throw error;
      }
    }
  
    /**
     * GET /api/v1/mentorship/senior-mentor-applications/:id/profile
   * Returns a Senior Mentor Application by ID (owner only) to display as Profile.
   */
  static async getApplicationProfileById(userId: string): Promise<SeniorMentorApplication | null> {
    try {
      console.log(`🎓 [SENIOR_MENTOR_APP] Fetching profile by userId: ${userId}`);
      const { data } = await api.get(`/mentorship/senior-mentor-applications/user/${userId}/profile`);
      return data?.data ?? null;
    } catch (error: any) {
      console.error(`❌ [SENIOR_MENTOR_APP] Failed to fetch profile ${userId}:`, error?.message);
      throw error;
    }
  }

  /**
   * PATCH /api/v1/mentorship/senior-mentor-applications/me
   * Update the current user's Senior Mentor profile fields.
   */
  static async updateMyApplication(updates: Partial<SeniorMentorApplication>): Promise<SeniorMentorApplication> {
    try {
      console.log('🎓 [SENIOR_MENTOR_APP] Updating profile...');
      const { data } = await api.patch('/mentorship/senior-mentor-applications/me', updates);
      console.log('✅ [SENIOR_MENTOR_APP] Updated profile successfully');
      return data?.data;
    } catch (error: any) {
      console.error('❌ [SENIOR_MENTOR_APP] Failed to update profile:', error?.response?.data?.message || error?.message);
      throw error;
    }
  }
}

export default SeniorMentorApplicationService;
