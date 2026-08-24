// ===== CONSTANTS =====
export const DOMAINS = [
  'web_development',
  'career_guidance', 
  'interview_prep',
  'data_science',
  'product_management',
  'ui_ux_design',
  'mobile_development',
  'devops',
  'blockchain',
  'cybersecurity',
] as const;

export const DOMAIN_LABELS: Record<string, string> = {
  web_development: 'Web Development',
  career_guidance: 'Career Guidance',
  interview_prep: 'Interview Prep',
  data_science: 'Data Science/AI',
  product_management: 'Product Management',
  ui_ux_design: 'Design (UI/UX)',
  mobile_development: 'Mobile Development',
  devops: 'DevOps',
  blockchain: 'Blockchain',
  cybersecurity: 'Cybersecurity',
};

export const EXPERIENCE_OPTIONS = [
  { label: '0-1 Years', value: 1 },
  { label: '1-3 Years', value: 2 },
  { label: '3-5 Years', value: 4 },
  { label: '5-8 Years', value: 6 },
  { label: '8-12 Years', value: 9 },
  { label: '12+ Years', value: 13 },
] as const;