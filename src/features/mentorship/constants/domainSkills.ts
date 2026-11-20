// Domain-wise skill suggestions for the mentor "Skills" field.
// Keys match the domain values used in DOMAINS_OPTIONS and the backend
// `Domain` enum (server/.../shared/constants/domains.ts → DOMAIN_SKILLS).
export const DOMAIN_SKILLS: Record<string, string[]> = {
    web_development: [
        "HTML", "CSS", "JavaScript", "React", "Angular", "Vue.js", "Node.js", "Express",
        "MongoDB", "PostgreSQL", "REST API", "GraphQL", "TypeScript", "Next.js", "Tailwind CSS",
    ],
    mobile_development: [
        "React Native", "Flutter", "iOS", "Android", "Swift", "Kotlin", "Java", "Dart",
        "Firebase", "Mobile UI/UX",
    ],
    data_science: [
        "Python", "R", "SQL", "Pandas", "NumPy", "Matplotlib", "Statistics", "Data Visualization",
        "Excel", "Tableau", "TensorFlow", "PyTorch", "Scikit-learn", "Deep Learning", "NLP",
        "Computer Vision", "MLOps",
    ],
    machine_learning: [
        "Python", "TensorFlow", "PyTorch", "Scikit-learn", "Keras", "Deep Learning", "NLP",
        "Computer Vision", "MLOps",
    ],
    devops: [
        "Docker", "Kubernetes", "Jenkins", "CI/CD", "Git", "Linux", "Bash", "Terraform",
        "Ansible", "Monitoring", "AWS", "Azure", "GCP",
    ],
    cloud_computing: [
        "AWS", "Azure", "GCP", "Serverless", "Lambda", "S3", "EC2", "CloudFormation",
        "Infrastructure as Code",
    ],
    cybersecurity: [
        "Network Security", "Penetration Testing", "Ethical Hacking", "Security Audits",
        "SIEM", "Firewall", "Encryption",
    ],
    blockchain: [
        "Solidity", "Ethereum", "Smart Contracts", "Web3", "Cryptocurrency", "DeFi", "NFT",
        "Blockchain Architecture",
    ],
    ui_ux_design: [
        "Figma", "Adobe XD", "Sketch", "User Research", "Wireframing", "Prototyping",
        "Design Systems", "Usability Testing",
    ],
    product_management: [
        "Product Strategy", "Roadmapping", "User Stories", "Agile", "Scrum", "Analytics",
        "A/B Testing", "Market Research",
    ],
    digital_marketing: [
        "SEO", "SEM", "Google Analytics", "Social Media Marketing", "Content Marketing",
        "Email Marketing", "PPC", "Marketing Automation",
    ],
    business_analytics: [
        "SQL", "Excel", "Power BI", "Tableau", "Data Analysis", "Business Intelligence",
        "KPIs", "Reporting",
    ],
    career_guidance: [
        "Career Planning", "Resume Building", "Job Search Strategy", "Networking",
        "Personal Branding", "Career Transition",
    ],
    interview_prep: [
        "Technical Interviews", "Behavioral Interviews", "Coding Challenges", "System Design",
        "Communication Skills", "Mock Interviews", "Data Structures", "Algorithms",
    ],
    leadership: [
        "Team Management", "Conflict Resolution", "Communication", "Decision Making",
        "Strategic Thinking", "Mentoring",
    ],
};

// Shown when no domain is selected yet.
export const POPULAR_SKILLS: string[] = [
    "JavaScript", "Python", "Java", "React", "Node.js", "SQL", "System Design",
    "Communication", "Data Structures", "Git",
];

export const getSuggestedSkills = (domains: string[]): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const d of domains) {
        for (const s of DOMAIN_SKILLS[d] ?? []) {
            const k = s.toLowerCase();
            if (!seen.has(k)) { seen.add(k); out.push(s); }
        }
    }
    return out;
};
