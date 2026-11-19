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

/** Student Senior Mentors must complete this many free sessions before charging. Keep equal to the backend value. */
export const FREE_SESSIONS_REQUIRED = 50;

// ── Shape of the application returned by GET /me ──────────────────────────────
export interface SeniorMentorApplication {
  /** Backend returns `seniorMentorId` (and `id` as an alias). `applicationId` is kept for older callers. */
  applicationId?: string;
  seniorMentorId?: string;
  id?: string;
  userId: string;
  mentorRole: 'senior_mentor' | 'alumni';
  fullName: string;
  college: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: number;
  currentRole?: string;
  currentCompany?: string;
  shortBio: string;
  linkedinUrl: string;
  githubUrl?: string;
  portfolioUrl?: string;
  yearsOfExperience?: number;
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
  freePolicyAcceptedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Progress towards unlocking paid services (GET /me/free-session-progress). */
export interface FreeSessionProgress {
  appliesToUser: boolean;
  required: number;
  completed: number;
  remaining: number;
  isUnlocked: boolean;
}

// ── Admin (college mentor review) types ───────────────────────────────────────
// The admin list returns raw application documents (seniorMentorId, no `applicationId`).
export interface CollegeMentorApplication extends Omit<SeniorMentorApplication, 'applicationId'> {
  seniorMentorId: string;
  profilePhoto?: string;
  profileCompletion?: number;
}

export interface CollegeMentorStats {
  total: number;
  pending: number;
  under_review: number;
  verified: number;
  rejected: number;
}

export interface CollegeMentorListParams {
  page?: number;
  limit?: number;
  status?: string;
  mentorRole?: string;
  primaryExpertise?: string;
  search?: string;
  /** ISO 8601 — applied on/after */
  from?: string;
  /** ISO 8601 — applied on/before */
  to?: string;
}

export type CollegeMentorDocumentType = 'resume' | 'proof';

export interface CollegeMentorListResponse {
  data: CollegeMentorApplication[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

const ADMIN_BASE = '/mentorship/senior-mentor-applications';

function adminErrorMessage(error: any, fallback: string): Error {
  if (error?.response?.status === 401) return new Error('Session expired. Please log in again.');
  if (error?.response?.status === 403) return new Error('Admin access required.');
  const apiMessage = error?.response?.data?.message;
  if (apiMessage) return new Error(apiMessage);

  // No HTTP response at all => network down, timeout, or CORS block.
  if (!error?.response) {
    const base = error?.config?.baseURL || '(unknown API URL)';
    const reason = error?.code === 'ECONNABORTED' ? 'timed out' : 'could not be reached';
    return new Error(
      `${fallback} Server ${reason} at ${base}. Check the backend is running, ` +
        'NEXT_PUBLIC_API_BASE_URL, and that this origin is allowed by CORS.'
    );
  }
  if (error.response.status === 404) {
    return new Error(`${fallback} Endpoint not found (404) - backend may be running an older build.`);
  }
  return new Error(`${fallback} (HTTP ${error.response.status})`);
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
const safeHost = (u: string): string => {
  try {
    return new URL(u).hostname;
  } catch {
    return '';
  }
};

/** Seed / placeholder storage host (e.g. mock-s3-bucket.s3.amazonaws.com): file was never stored. */
export const isPlaceholderStorageUrl = (raw?: string | null): boolean =>
  !!raw && /^mock[-_.]/i.test(safeHost(raw));

class SeniorMentorApplicationService {
  /** GET /senior-mentor-applications/me/documents/:type - owner: signed URL for own resume / proof. */
  static async getMyDocumentUrl(type: 'resume' | 'proof', fallbackUrl?: string): Promise<string> {
    try {
      const { data } = await api.get(`${ADMIN_BASE}/me/documents/${type}`);
      const url = data?.data?.url;
      if (!url) throw new Error('Document url not available.');
      return url as string;
    } catch (error: any) {
      if (error?.response?.status === 404 && fallbackUrl && !isPlaceholderStorageUrl(fallbackUrl)) {
        return fallbackUrl;
      }
      throw adminErrorMessage(error, 'Could not open document.');
    }
  }

  /** PUT /senior-mentor-applications/me/documents - owner: re-upload resume and/or proof document. */
  static async updateMyDocuments(files: {
    resume?: File;
    proofDocument?: File;
  }): Promise<SeniorMentorApplication | null> {
    try {
      const formData = new FormData();
      if (files.resume) formData.append('resume', files.resume);
      if (files.proofDocument) formData.append('proofDocument', files.proofDocument);
      const { data } = await api.put(`${ADMIN_BASE}/me/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearMyAppCache();
      return data?.data ?? null;
    } catch (error: any) {
      throw adminErrorMessage(error, 'Failed to upload document.');
    }
  }

  /**
   * GET /api/v1/mentorship/senior-mentor-applications/me
   * Returns the current user's Senior Mentor application, or null if none.
   * Cached for 30s and de-duplicated across concurrent callers.
   */
  static getMyApplication(forceFresh: boolean = false): Promise<SeniorMentorApplication | null> {
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
   * GET /api/v1/mentorship/senior-mentor-applications/me/free-session-progress
   * How many free sessions a student Senior Mentor has completed.
   * Returns null when the user has no application.
   */
  static async getFreeSessionProgress(): Promise<FreeSessionProgress | null> {
    try {
      const { data } = await api.get(`${ADMIN_BASE}/me/free-session-progress`);
      return data?.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw error;
    }
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
   * DELETE /api/v1/mentorship/senior-mentor-applications/me/profile-photo
   */
  static async removeMyProfilePhoto(): Promise<SeniorMentorApplication | null> {
    try {
      const { data } = await api.delete('/mentorship/senior-mentor-applications/me/profile-photo');
      clearMyAppCache();
      return data?.data ?? null;
    } catch (error: any) {
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
   * Updating a rejected application sends it back to the review queue (pending).
   */
  static async updateMyApplication(
    updates: Partial<SeniorMentorApplication>
  ): Promise<SeniorMentorApplication> {
    const { data } = await api.patch('/mentorship/senior-mentor-applications/me', updates);
    clearMyAppCache();
    return data?.data;
  }

  // ── Admin: college mentor review ────────────────────────────────────────────

  /** GET /senior-mentor-applications — admin list with filters + pagination. */
  static async adminList(params: CollegeMentorListParams = {}): Promise<CollegeMentorListResponse> {
    try {
      const { data } = await api.get(ADMIN_BASE, { params });
      return data;
    } catch (error: any) {
      throw adminErrorMessage(error, 'Failed to fetch college mentors.');
    }
  }

  /**
   * GET /senior-mentor-applications/stats — counts per verification status.
   * Falls back to counting through the list endpoint (meta.total per status)
   * when the backend build does not have /stats yet.
   */
  static async adminStats(): Promise<CollegeMentorStats> {
    try {
      const { data } = await api.get(`${ADMIN_BASE}/stats`);
      if (data?.data && typeof data.data.total === 'number') {
        return data.data as CollegeMentorStats;
      }
      throw new Error('Unexpected stats response.');
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw adminErrorMessage(error, 'Failed to fetch college mentor stats.');
      }
      try {
        return await SeniorMentorApplicationService.adminStatsFromList();
      } catch {
        throw adminErrorMessage(error, 'Failed to fetch college mentor stats.');
      }
    }
  }

  /** Real counts from the list endpoint: one limit=1 request per status. */
  private static async adminStatsFromList(): Promise<CollegeMentorStats> {
    const statuses = [
      ApplicationStatus.PENDING,
      ApplicationStatus.UNDER_REVIEW,
      ApplicationStatus.VERIFIED,
      ApplicationStatus.REJECTED,
    ] as const;

    const countFor = async (status?: string): Promise<number> => {
      const { data } = await api.get(ADMIN_BASE, { params: { status, page: 1, limit: 1 } });
      return Number(data?.meta?.total ?? data?.pagination?.total ?? data?.data?.length ?? 0);
    };

    // `total` comes from an unfiltered query, NOT the sum of the four statuses:
    // legacy records can carry a non-standard status (e.g. "active") and would
    // otherwise be missed from the total.
    const [total, pending, under_review, verified, rejected] = await Promise.all([
      countFor(),
      ...statuses.map((status) => countFor(status)),
    ]);

    return {
      total,
      pending,
      under_review,
      verified,
      rejected,
    };
  }

  /** POST /senior-mentor-applications/:id/under-review */
  static async adminMarkUnderReview(seniorMentorId: string): Promise<CollegeMentorApplication> {
    try {
      const { data } = await api.post(`${ADMIN_BASE}/${seniorMentorId}/under-review`);
      return data?.data;
    } catch (error: any) {
      throw adminErrorMessage(error, 'Failed to mark application as under review.');
    }
  }

  /** POST /senior-mentor-applications/:id/approve */
  static async adminApprove(seniorMentorId: string): Promise<CollegeMentorApplication> {
    try {
      const { data } = await api.post(`${ADMIN_BASE}/${seniorMentorId}/approve`);
      return data?.data;
    } catch (error: any) {
      throw adminErrorMessage(error, 'Failed to approve application.');
    }
  }

  /** POST /senior-mentor-applications/:id/reject */
  static async adminReject(seniorMentorId: string, reason: string): Promise<CollegeMentorApplication> {
    try {
      const { data } = await api.post(`${ADMIN_BASE}/${seniorMentorId}/reject`, { reason });
      return data?.data;
    } catch (error: any) {
      throw adminErrorMessage(error, 'Failed to reject application.');
    }
  }

  /** GET /senior-mentor-applications/:id/documents/:type — short-lived signed URL for resume / proof. */
  static async adminGetDocumentUrl(
    seniorMentorId: string,
    type: CollegeMentorDocumentType,
    fallbackUrl?: string
  ): Promise<string> {
    try {
      const { data } = await api.get(`${ADMIN_BASE}/${seniorMentorId}/documents/${type}`);
      const url = data?.data?.url;
      if (!url) throw new Error('Document url not available.');
      return url as string;
    } catch (error: any) {
      // Older backend builds have no /documents/:type route (404 "Route ... not found").
      // Open the URL stored on the application instead of showing an error.
      if (error?.response?.status === 404 && fallbackUrl && !isPlaceholderStorageUrl(fallbackUrl)) {
        return fallbackUrl;
      }
      throw adminErrorMessage(error, 'Could not open document.');
    }
  }
}

export default SeniorMentorApplicationService;