export interface PartnerCompany {
    id: string;
    name: string;        // full naam (companies page ke liye)
    shortName: string;   // chhota naam (mentorship circle card ke liye)
    domain: string;      // website domain, isse logo aata hai
    color: string;
    letters: string;     // logo fail ho to ye letters dikhenge
    industry: string;
    employees: string;
    location: string;
}

export const logoUrl = (domain: string) =>
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const PARTNER_COMPANIES: PartnerCompany[] = [
    { id: 'netlink', name: 'Netlink Software', shortName: 'Netlink', domain: 'netlink.com', color: '#1E88E5', letters: 'NS', industry: 'Software Development', employees: '', location: 'India' },
    { id: 'wewin', name: 'We Win Limited', shortName: 'We Win', domain: 'wewinlimited.com', color: '#D32F2F', letters: 'WW', industry: 'Software Development', employees: '', location: 'India' },
    { id: 'techstalwarts', name: 'TechStalwarts Software Development LLP', shortName: 'TechStalwarts', domain: 'techstalwarts.com', color: '#00796B', letters: 'TS', industry: 'Software Development', employees: '', location: 'India' },
    { id: 'wipro', name: 'Wipro', shortName: 'Wipro', domain: 'wipro.com', color: '#5B2D90', letters: 'W', industry: 'IT Services & Consulting', employees: '10,001+ employees', location: 'Bengaluru' },
    { id: 'tcs', name: 'Tata Consultancy Services (TCS)', shortName: 'TCS', domain: 'tcs.com', color: '#0F4C81', letters: 'TCS', industry: 'IT Services & Consulting', employees: '10,001+ employees', location: 'Mumbai' },
    { id: 'techm', name: 'Tech Mahindra', shortName: 'Tech Mahindra', domain: 'techmahindra.com', color: '#E31837', letters: 'TM', industry: 'IT Services & Consulting', employees: '10,001+ employees', location: 'Pune' },
    { id: 'yash', name: 'Yash Technologies', shortName: 'Yash', domain: 'yash.com', color: '#1B3A6B', letters: 'YT', industry: 'IT Services & Consulting', employees: '10,001+ employees', location: 'Indore' },
    { id: 'impetus', name: 'Impetus Technologies', shortName: 'Impetus', domain: 'impetus.com', color: '#F58220', letters: 'IM', industry: 'Software Development', employees: '', location: 'India' },
    { id: 'persistent', name: 'Persistent Systems', shortName: 'Persistent', domain: 'persistent.com', color: '#F37021', letters: 'PS', industry: 'Software Development', employees: '10,001+ employees', location: 'Pune' },
    { id: 'capgemini', name: 'Capgemini', shortName: 'Capgemini', domain: 'capgemini.com', color: '#0070AD', letters: 'CG', industry: 'IT Services & Consulting', employees: '10,001+ employees', location: 'Mumbai' },
    { id: 'hcltech', name: 'HCLTech', shortName: 'HCLTech', domain: 'hcltech.com', color: '#0F5FDC', letters: 'HCL', industry: 'IT Services & Consulting', employees: '10,001+ employees', location: 'Noida' },
    { id: 'infosys', name: 'Infosys', shortName: 'Infosys', domain: 'infosys.com', color: '#007CC3', letters: 'IN', industry: 'IT Services & Consulting', employees: '10,001+ employees', location: 'Bengaluru' },
    { id: 'codiant', name: 'Codiant', shortName: 'Codiant', domain: 'codiant.com', color: '#3F51B5', letters: 'CD', industry: 'Software Development', employees: '', location: 'India' },
    { id: 'systango', name: 'Systango', shortName: 'Systango', domain: 'systango.com', color: '#FF5722', letters: 'SY', industry: 'Software Development', employees: '', location: 'India' },
    { id: 'walkover', name: 'Walkover Web Solutions', shortName: 'Walkover', domain: 'walkover.in', color: '#00A651', letters: 'WS', industry: 'Software Development', employees: '', location: 'India' },
];