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

export type Domain = (typeof DOMAINS)[number];

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

// Keywords: user "react", "dsa", "aws" type kare to related domain aa jaye
export const DOMAIN_KEYWORDS: Record<string, string[]> = {
  web_development: ['web', 'react', 'node', 'nodejs', 'javascript', 'js', 'html', 'css', 'frontend', 'backend', 'fullstack', 'full stack', 'next', 'angular', 'vue', 'mern', 'express', 'mongodb', 'website'],
  career_guidance: ['career', 'guidance', 'job', 'resume', 'cv', 'growth', 'switch', 'roadmap', 'counselling', 'planning', 'placement'],
  interview_prep: ['interview', 'prep', 'dsa', 'algorithm', 'data structure', 'leetcode', 'coding round', 'hr', 'mock', 'aptitude', 'system design', 'placement'],
  data_science: ['data', 'science', 'ai', 'ml', 'machine learning', 'python', 'analytics', 'deep learning', 'nlp', 'pandas', 'statistics', 'genai', 'llm'],
  product_management: ['product', 'pm', 'strategy', 'agile', 'scrum', 'manager', 'startup'],
  ui_ux_design: ['design', 'ui', 'ux', 'figma', 'user experience', 'wireframe', 'graphic', 'prototype'],
  mobile_development: ['mobile', 'android', 'ios', 'flutter', 'react native', 'kotlin', 'swift', 'app'],
  devops: ['devops', 'docker', 'kubernetes', 'aws', 'cloud', 'cicd', 'jenkins', 'terraform', 'linux', 'azure', 'deployment', 'sre'],
  blockchain: ['blockchain', 'web3', 'crypto', 'solidity', 'ethereum', 'smart contract', 'nft', 'defi'],
  cybersecurity: ['security', 'cyber', 'hacking', 'pentest', 'ethical hacking', 'infosec', 'network security', 'cryptography'],
};

export const searchDomains = (query: string): Domain[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [...DOMAINS];

  const score = (d: string): number => {
    const label = (DOMAIN_LABELS[d] || d).toLowerCase();
    const labelWords = label.split(/[\s/()-]+/);
    const words = DOMAIN_KEYWORDS[d] || [];
    if (label.startsWith(q)) return 3;
    if (labelWords.some((w) => w.startsWith(q)) || words.some((w) => w.startsWith(q))) return 2;
    if (q.length >= 3 && (label.includes(q) || words.some((w) => w.includes(q)))) return 1;
    return 0;
  };

  return DOMAINS.map((d) => ({ d, s: score(d) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.d);
};

export const EXPERIENCE_OPTIONS = [
  { label: '0-1 Years', value: 1 },
  { label: '1-3 Years', value: 2 },
  { label: '3-5 Years', value: 4 },
  { label: '5-8 Years', value: 6 },
  { label: '8-12 Years', value: 9 },
  { label: '12+ Years', value: 13 },
] as const;