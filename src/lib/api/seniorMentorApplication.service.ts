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

// ── "My application" cache + in-flight dedupe ─────────────────────────────────
// Many components (navbar, dropdown, dashboards) call getMyApplication() at the
// same time. They now share ONE network request, and the result is reused for
// a short time. Any write (apply / update / photo) clears it.
const MY_APP_TTL_MS = 30_000;

let _myAppCache: { value: SeniorMentorApplication | null; at: number } | null = null;
let _myAppInflight: Promise<SeniorMentorApplication | null> | null = null;

function clearMyAppCache(): void {
  _myAppCache = null;
  _myAppInflight = null;
}

// ── Service ───────────────────────────────────────────────────────────────────
class SeniorMentorApplicationService {
  /**
   * GET /api/v1/mentorship/senior-mentor-applications/me
   * Returns the current user's Senior Mentor application, or null if none.
   * Cached for 30s and de-duplicated across concurrent callers.
   */
  static getMyApplication(
    forceFresh: boolean = false
  ): Promise<SeniorMentorApplication | null> {
    if (forceFresh) clearMyAppCache();

    if (_myAppCache && Date.now() - _myAppCache.at < MY_APP_TTL_MS) {
      return Promise.resolve(_myAppCache.value);
    }
    if (_myAppInflight) return _myAppInflight;

    _myAppInflight = (async (): Promise<SeniorMentorApplication | null> => {
      try {
        const { data } = await api.get('/mentorship/senior-mentor-applications/me');
        const value: SeniorMentorApplication | null = data?.data ?? null;
        _myAppCache = { value, at: Date.now() };
        return value;
      } catch (error: any) {
        // A 404 means the user simply hasn't applied yet — that is expected.
        if (error?.response?.status === 404) {
          _myAppCache = { value: null, at: Date.now() };
          return null;
        }
        throw error;
      }
    })().finally(() => {
      _myAppInflight = null;
    });

    return _myAppInflight;
  }

  /** Manually clear the cached "my application". */
  static invalidateMyApplicationCache(): void {
    clearMyAppCache();
  }

  /**
   * POST /api/v1/mentorship/senior-mentor-applications/apply
   * Submit a Senior Mentor application via multipart/form-data.
   * Axios automatically sets the Content-Type with boundary for FormData.
   */
  static async apply(formData: FormData): Promise<SeniorMentorApplication> {
    const { data } = await api.post('/mentorship/senior-mentor-applications/apply', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    clearMyAppCache();
    return data?.data;
  }

  /**
   * PUT /api/v1/mentorship/senior-mentor-applications/me/profile-photo
   * Updates ONLY the profile photo of the current user's Senior Mentor application.
   * Returns the updated application, or null if the user has no application (404).
   */
  static async updateMyProfilePhoto(file: File): Promise<SeniorMentorApplication | null> {
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);
      const { data } = await api.put('/mentorship/senior-mentor-applications/me/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearMyAppCache();
      return data?.data ?? null;
    } catch (error: any) {
      // 404 = user has not applied for senior mentor -> expected
      if (error?.response?.status === 404) return null;
      throw error;
    }
  }

  /**
   * GET /api/v1/mentorship/senior-mentor-applications/user/:userId/profile
   * Returns a Senior Mentor Application by userId to display as Profile.
   */
  static async getApplicationProfileById(userId: string): Promise<SeniorMentorApplication | null> {
    const { data } = await api.get(`/mentorship/senior-mentor-applications/user/${userId}/profile`);
    return data?.data ?? null;
  }

  /**
   * PATCH /api/v1/mentorship/senior-mentor-applications/me
   * Update the current user's Senior Mentor profile fields.
   */
  static async updateMyApplication(updates: Partial<SeniorMentorApplication>): Promise<SeniorMentorApplication> {
    const { data } = await api.patch('/mentorship/senior-mentor-applications/me', updates);
    clearMyAppCache();
    return data?.data;
  }
}

export default SeniorMentorApplicationService;