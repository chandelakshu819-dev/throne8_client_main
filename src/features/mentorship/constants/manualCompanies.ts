// src/features/mentorship/constants/manualCompanies.ts
//
// Manually add ki gayi companies (real mentors ki companies ke baad dikhengi).
// logoUrl optional hai: image ko /public/logos/ mein rakho aur "/logos/naam.png" likho.
// Logo na do to naam ka pehla akshar circle mein dikhega.

export interface ManualCompany {
    name: string;
    logoUrl?: string;
  }
  
  export const MANUAL_COMPANIES: ManualCompany[] = [
    // { name: "Infosys" },
    // { name: "Razorpay", logoUrl: "/logos/razorpay.png" },
  ];