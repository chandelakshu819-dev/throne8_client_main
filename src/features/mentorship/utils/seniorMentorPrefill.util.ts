export interface IEducationItem {
  educationId: string;
  userId: string;
  schoolCollegeName: string;
  degree: string;
  degreeType?: 'High School' | 'Diploma' | "Bachelor's" | "Master's" | 'Doctorate' | 'Certificate' | 'Other';
  specialization?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  isOngoing?: boolean;
}

export interface IExperienceItem {
  experienceId: string;
  companyName: string;
  currentPosition: string;
  currentlyWorking?: boolean;
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface IAboutData {
  aboutId: string;
  userId: string;
  aboutText: string;
  characterCount?: number;
}

export interface IProfilePhotoData {
  photoId: string;
  cloudinarySecureUrl: string;
}

export interface OnboardingStudentProfile {
  collegeName?: string;
  degree?: string;
  fieldOfStudy?: string;
  graduationYear?: string;
}

export interface OnboardingWorkingProfile {
  companyName?: string;
  jobTitle?: string;
  startDate?: string;
  endDate?: string | null;
}

export interface OnboardingFresherProfile {
  highestEducation?: string;
  preferredRole?: string;
  cgpa?: string | null;
}

export const getDegreeRank = (edu: Partial<IEducationItem>): number => {
  const degreeType = edu.degreeType;

  // 1. Primary Signal: degreeType Enum
  if (degreeType === 'Doctorate') return 5;
  if (degreeType === "Master's") return 4;
  if (degreeType === "Bachelor's") return 3;
  if (degreeType === 'Diploma') return 2;
  if (degreeType === 'High School' || degreeType === 'Certificate') return 0;

  // 2. Secondary Signal: String matching when "Other" or undefined
  const text = (edu.degree || '').trim();
  if (!text) return 0;

  // Ignore MS Office / computer applications courses
  if (/\bms\s+office\b/i.test(text)) return 0;

  // A. Check Doctorate (Rank 5)
  if (/\b(ph\.?d|doctorate|doctor of philosophy)\b/i.test(text)) return 5;

  // B. Check Long / Dotted Forms FIRST
  // Master's (Rank 4)
  if (
    /\b(m\.?tech|mba|mca|m\.?sc|master(?:'s)?)\b/i.test(text) ||
    /\bm\.[esa]\.?(?!\w)/i.test(text)
  ) {
    return 4;
  }

  // Bachelor's (Rank 3)
  if (
    /\b(b\.?tech|bca|b\.?sc|b\.?com|bachelor(?:'s)?)\b/i.test(text) ||
    /\bb\.[esa]\.?(?!\w)/i.test(text)
  ) {
    return 3;
  }

  // Diploma (Rank 2)
  if (/\b(diploma|polytechnic)\b/i.test(text)) return 2;

  // C. Short uppercase tokens ONLY at the LEADING position (word boundary)
  // Master's leading: ME, MS, MA
  if (/^(ME|MS|MA)\b/.test(text)) return 4;

  // Bachelor's leading: BE, BS, BA
  if (/^(BE|BS|BA)\b/.test(text)) return 3;

  return 0;
};

export const resolveEducationPrefill = (
  educationList: IEducationItem[],
  sp?: OnboardingStudentProfile,
  fp?: OnboardingFresherProfile
): { college: string; degree: string; fieldOfStudy: string; graduationYear: number | null } => {
  const clean = (v: unknown): string => (typeof v === 'string' && v.trim() !== '' && v.trim() !== 'Other' ? v.trim() : '');

  // Filter for Rank >= 2 (Diploma and above)
  const validEducations = educationList
    .map((e) => ({ ...e, rank: getDegreeRank(e) }))
    .filter((e) => e.rank >= 2);

  let bestEdu: IEducationItem | null = null;
  if (validEducations.length > 0) {
    const maxRank = Math.max(...validEducations.map((e) => e.rank));
    const topRankEducations = validEducations.filter((e) => e.rank === maxRank);
    topRankEducations.sort((a, b) => {
      if (a.isOngoing && !b.isOngoing) return -1;
      if (!a.isOngoing && b.isOngoing) return 1;
      const aTime = a.endDate ? new Date(a.endDate).getTime() : 0;
      const bTime = b.endDate ? new Date(b.endDate).getTime() : 0;
      return bTime - aTime;
    });
    bestEdu = topRankEducations[0];
  }

  // Single-source Rule: 100% Education, or 100% Onboarding
  if (bestEdu) {
    let yr: number | null = null;
    if (bestEdu.endDate) {
      const parsed = new Date(bestEdu.endDate).getFullYear();
      if (!isNaN(parsed) && parsed >= 1980 && parsed <= new Date().getFullYear() + 10) yr = parsed;
    }
    return {
      college: clean(bestEdu.schoolCollegeName),
      degree: clean(bestEdu.degree),
      fieldOfStudy: clean(bestEdu.specialization),
      graduationYear: yr,
    };
  }

  if (sp) {
    let yr: number | null = null;
    if (sp.graduationYear) {
      const parsed = Number(sp.graduationYear);
      if (!isNaN(parsed) && parsed >= 1980 && parsed <= new Date().getFullYear() + 10) yr = parsed;
    }
    return {
      college: clean(sp.collegeName),
      degree: clean(sp.degree),
      fieldOfStudy: clean(sp.fieldOfStudy),
      graduationYear: yr,
    };
  }

  if (fp) {
    return {
      college: '',
      degree: clean(fp.highestEducation),
      fieldOfStudy: '',
      graduationYear: null,
    };
  }

  return { college: '', degree: '', fieldOfStudy: '', graduationYear: null };
};

export const resolveExperiencePrefill = (
  experienceList: IExperienceItem[],
  wp?: OnboardingWorkingProfile
): { role: string; company: string } => {
  const currentExp = experienceList.find((e) => Boolean(e.currentlyWorking));
  if (currentExp && currentExp.currentPosition && currentExp.companyName) {
    return {
      role: currentExp.currentPosition.trim(),
      company: currentExp.companyName.trim(),
    };
  }

  const isWpCurrent = Boolean(wp && wp.companyName && !wp.endDate);
  if (isWpCurrent && wp) {
    return {
      role: (wp.jobTitle || '').trim(),
      company: (wp.companyName || '').trim(),
    };
  }

  return { role: '', company: '' };
};
