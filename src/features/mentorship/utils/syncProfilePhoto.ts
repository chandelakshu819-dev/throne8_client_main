// src/features/mentorship/utils/syncProfilePhoto.ts
//
// Ek hi account ke teeno roles (Mentee / Industry Mentor / Senior Mentor) me
// SAME photo dikhe, isliye photo kisi bhi role se upload ho, yeh helper baaki
// jagah bhi push kar deta hai:
//
//   account photo     -> ProfileService.uploadProfilePhoto   (Mentee dashboard + navbar)
//   Mentor.profilePic -> MentorService.updateProfilePhoto    (Industry mentor dashboard)
//   Senior app photo  -> SeniorMentorApplicationService      (Senior mentor dashboard)
//
// Jis role ka record user ke paas nahi hai, wahan 404 aata hai -> chup-chaap skip.

import MentorService from '@/lib/api/mentorship.service';
import ProfileService from '@/lib/api/profile.service';
import SeniorMentorApplicationService from '@/lib/api/seniorMentorApplication.service';

export type PhotoTarget = 'account' | 'mentor' | 'senior';

export interface SyncPhotoResult {
  accountUrl?: string;
  mentorUrl?: string;
  seniorUrl?: string;
}

interface SyncOptions {
  /** Jo target caller ne pehle hi update kar diya hai, usse dobara mat chalao */
  skip?: PhotoTarget[];
}

/**
 * `file` ko user ke saare maujood roles me save karta hai.
 * Kabhi throw nahi karta: ek target fail ho to baaki chalte rehte hain.
 */
export async function syncProfilePhotoToAllRoles(
  file: File,
  userId: string | undefined,
  options: SyncOptions = {}
): Promise<SyncPhotoResult> {
  const skip = new Set<PhotoTarget>(options.skip ?? []);
  const result: SyncPhotoResult = {};

  const jobs: Promise<void>[] = [];

  // 1) Account photo (mentee dashboard + navbar iska use karte hain)
  if (!skip.has('account')) {
    jobs.push(
      ProfileService.uploadProfilePhoto(file, true)
        .then((res: any) => {
          result.accountUrl = res?.data?.photo?.cloudinarySecureUrl;
        })
        .catch((err: any) => console.warn('[PHOTO_SYNC] account photo failed:', err?.message))
    );
  }

  // 2) Industry mentor photo (agar user mentor hai)
  if (!skip.has('mentor') && userId) {
    jobs.push(
      MentorService.getMentorByUserId(userId, true)
        .then((mRes: any) => {
          const mentorId = mRes?.data?.mentorId;
          if (!mentorId) return;
          return MentorService.updateProfilePhoto(mentorId, file).then((res: any) => {
            result.mentorUrl = (res?.data ?? res)?.profilePic;
          });
        })
        .catch(() => { /* user industry mentor nahi hai */ })
    );
  }

  // 3) Senior mentor application photo (agar user ne apply kiya hai)
  if (!skip.has('senior')) {
    jobs.push(
      SeniorMentorApplicationService.updateMyProfilePhoto(file)
        .then((app) => {
          result.seniorUrl = app?.profilePhoto;
        })
        .catch(() => { /* user senior mentor nahi hai */ })
    );
  }

  await Promise.all(jobs);
  return result;
}