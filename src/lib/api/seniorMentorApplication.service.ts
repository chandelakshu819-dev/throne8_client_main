// lib/api/seniorMentorApplication.service.ts
import api from './api.intance';

// ── Application status enum (mirrors backend ApplicationStatus) ───────────────
export enum ApplicationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

// ── Shape of the application returned by GET /me ──────────────────────────────
export interface SeniorMentorApplication {
  applicationId: string;
  userId: string;
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
}

export default SeniorMentorApplicationService;
