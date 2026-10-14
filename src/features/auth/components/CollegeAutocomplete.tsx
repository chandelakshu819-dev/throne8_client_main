'use client';
// src/features/auth/components/CollegeAutocomplete.tsx
import { useEffect, useMemo, useRef, useState } from 'react';

const BHOPAL_INSTITUTIONS: string[] = [
  // Government / National institutes
  'MANIT Bhopal (Maulana Azad National Institute of Technology)',
  'IISER Bhopal',
  'AIIMS Bhopal',
  'IIIT Bhopal',
  'School of Planning and Architecture (SPA) Bhopal',
  'National Law Institute University (NLIU) Bhopal',
  'University Institute of Technology RGPV Bhopal (UIT-RGPV)',
  'Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV) Bhopal',
  'Barkatullah University Bhopal',
  'Barkatullah University Institute of Technology (BUIT) Bhopal',
  'Government Polytechnic Bhopal',
  'Maharana Pratap College of Technology Gwalior',
  'Government Maulana Azad College Bhopal',
  'Government Motilal Vigyan Mahavidyalaya (MVM) Bhopal',
  'Government Hamidia Arts and Commerce College Bhopal',
  'Government Autonomous Girls PG College Bhopal',
  'Gandhi Medical College Bhopal',
  'Government Homoeopathic Medical College Bhopal',
  'Madhya Pradesh Bhoj Open University Bhopal',
  // Private universities
  'VIT Bhopal University',
  'LNCT University Bhopal',
  'Jagran Lakecity University Bhopal',
  'AISECT University Bhopal',
  'SAGE University Bhopal',
  'RKDF University Bhopal',
  'Sarvepalli Radhakrishnan University (SRK) Bhopal',
  'Bhabha University Bhopal',
  'People\'s University Bhopal',
  'Mansarovar Global University Bhopal',
  'Oriental University Bhopal',
  'NRI University Bhopal',
  'Dr. A.P.J. Abdul Kalam University Bhopal',
  'Rabindranath Tagore University (RNTU) Bhopal',
  'Sri Satya Sai University of Technology and Medical Sciences Sehore',
  // Engineering colleges
  'LNCT Bhopal (Lakshmi Narain College of Technology)',
  'LNCT&S Bhopal (Lakshmi Narain College of Technology and Science)',
  'LNCT Excellence Bhopal',
  'Oriental Institute of Science and Technology (OIST) Bhopal',
  'Oriental College of Technology (OCT) Bhopal',
  'Oriental Institute of Technology (OIT) Bhopal',
  'Sagar Institute of Research and Technology (SIRT) Bhopal',
  'Sagar Institute of Science and Technology (SISTec) Bhopal',
  'Sagar Institute of Research Technology and Science (SIRTS) Bhopal',
  'Truba Institute of Engineering and Information Technology Bhopal',
  'Truba College of Science and Technology Bhopal',
  'Truba College of Engineering and Technology Bhopal',
  'Radharaman Institute of Technology and Science (RITS) Bhopal',
  'Radharaman Engineering College Bhopal',
  'Bansal Institute of Science and Technology Bhopal',
  'Bansal College of Engineering Bhopal',
  'Patel College of Science and Technology Bhopal',
  'Patel Institute of Engineering and Science Bhopal',
  'Millennium Institute of Technology Bhopal',
  'Millennium Institute of Technology and Science Bhopal',
  'NRI Institute of Information Science and Technology Bhopal',
  'NRI Institute of Technology and Management Bhopal',
  'NRI Institute of Research and Technology Bhopal',
  'Technocrats Institute of Technology (TIT) Bhopal',
  'Technocrats Institute of Technology and Science (TIT&S) Bhopal',
  'Technocrats Institute of Technology Excellence (TIT-E) Bhopal',
  'Corporate Institute of Science and Technology Bhopal',
  'Bhabha Engineering Research Institute (BERI) Bhopal',
  'Bhabha College of Engineering Bhopal',
  'Scope College of Engineering Bhopal',
  'Trinity Institute of Technology and Research Bhopal',
  'Bhopal Institute of Technology and Science (BITS) Bhopal',
  'Bhopal Institute of Technology and Management Bhopal',
  'Institute of Engineering and Technology (IET) Bhopal',
  'Gyan Ganga College of Technology Bhopal',
  'Mittal Institute of Technology Bhopal',
  'Mittal Institute of Technology and Science Bhopal',
  'People\'s College of Research and Technology (PCRT) Bhopal',
  'People\'s Institute of Technology Bhopal',
  'RKDF Institute of Science and Technology Bhopal',
  'RKDF College of Engineering Bhopal',
  'Vindhya Institute of Technology and Science Bhopal',
  'Sri Sai Institute of Technology and Science Bhopal',
  'Swami Vivekanand College of Engineering Bhopal',
  'Shri Ram Institute of Technology Bhopal',
  'Ruchi Institute of Technology Bhopal',
  'Lakshmi Narain College of Pharmacy Bhopal',
  'Aakash Institute of Technology Bhopal',
  'Adina Institute of Science and Technology Sagar',
  'Alpine Institute of Technology Ujjain',
  'Jawaharlal Institute of Technology Bhopal',
  'Sarvottam Institute of Technology Bhopal',
  'Shri Venkateshwara Institute Bhopal',
  'Ideal Institute of Technology Bhopal',
  // Management / others
  'IIFM Bhopal (Indian Institute of Forest Management)',
  'Bansal Institute of Management Bhopal',
  'Institute of Management Studies Bhopal',
  'Jawaharlal Nehru Cancer Hospital and Research Centre Bhopal',
  'Chirayu Medical College Bhopal',
  'People\'s College of Medical Sciences Bhopal',
  'LN Medical College Bhopal',
  'Bhopal Memorial Hospital and Research Centre',
  'Sarojini Naidu Government Girls PG College Bhopal',
  'St. Joseph\'s Convent School Bhopal',
  'Carmel Convent School Bhopal',
  'Delhi Public School Bhopal',
  'Jawahar Navodaya Vidyalaya Bhopal',
  'Kendriya Vidyalaya Bhopal',
];

const POPULAR_INSTITUTIONS: string[] = [
  'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur', 'IIT Roorkee',
  'IIT Guwahati', 'IIT Hyderabad', 'IIT (BHU) Varanasi', 'IIT Indore', 'IIT Bhubaneswar',
  'NIT Trichy', 'NIT Warangal', 'NIT Surathkal', 'NIT Rourkela', 'NIT Calicut',
  'NIT Allahabad', 'NIT Kurukshetra', 'NIT Jaipur (MNIT)',
  'IIIT Hyderabad', 'IIIT Delhi', 'IIIT Allahabad', 'IIIT Bangalore', 'ABV-IIITM Gwalior',
  'BITS Pilani', 'BITS Goa', 'BITS Hyderabad', 'VIT Vellore', 'SRM Institute of Science and Technology',
  'Manipal Institute of Technology', 'Thapar Institute of Engineering and Technology',
  'Delhi Technological University (DTU)', 'Netaji Subhas University of Technology (NSUT)',
  'Jadavpur University', 'Anna University', 'Birla Institute of Technology, Mesra',
  'Amity University', 'Lovely Professional University', 'Chandigarh University',
  'KIIT University', 'Symbiosis International University', 'Christ University',
  'University of Delhi', 'Jawaharlal Nehru University', 'Banaras Hindu University',
  'Aligarh Muslim University', 'Jamia Millia Islamia', 'University of Mumbai',
  'University of Pune (SPPU)', 'Osmania University', 'University of Calcutta',
  'Devi Ahilya Vishwavidyalaya Indore', 'Shri Govindram Seksaria Institute (SGSITS) Indore',
  'Institute of Engineering and Technology DAVV Indore', 'Medi-Caps University Indore',
  'Acropolis Institute of Technology and Research Indore', 'Madhav Institute of Technology and Science Gwalior',
  'Jabalpur Engineering College', 'Samrat Ashok Technological Institute Vidisha',
  'IIM Ahmedabad', 'IIM Bangalore', 'IIM Calcutta', 'IIM Indore',
  'St. Stephen\'s College', 'Shri Ram College of Commerce (SRCC)', 'Hindu College',
  'Loyola College Chennai', 'Presidency University Kolkata', 'Fergusson College Pune',
  'AIIMS Delhi', 'Maulana Azad Medical College',
];

const ALL_INSTITUTIONS: string[] = [...BHOPAL_INSTITUTIONS, ...POPULAR_INSTITUTIONS];

// Short names jo log type karte hain
const ALIASES: Record<string, string[]> = {
  manit: ['MANIT Bhopal (Maulana Azad National Institute of Technology)'],
  rgpv: ['University Institute of Technology RGPV Bhopal (UIT-RGPV)', 'Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV) Bhopal'],
  uit: ['University Institute of Technology RGPV Bhopal (UIT-RGPV)'],
  oist: ['Oriental Institute of Science and Technology (OIST) Bhopal'],
  sistec: ['Sagar Institute of Science and Technology (SISTec) Bhopal'],
  sirt: ['Sagar Institute of Research and Technology (SIRT) Bhopal'],
  tit: ['Technocrats Institute of Technology (TIT) Bhopal'],
  vit: ['VIT Bhopal University', 'VIT Vellore'],
  rits: ['Radharaman Institute of Technology and Science (RITS) Bhopal'],
  pcrt: ['People\'s College of Research and Technology (PCRT) Bhopal'],
};

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  name?: string;
}

export default function CollegeAutocomplete({
  id = 'college',
  value,
  onChange,
  onBlur,
  placeholder = 'e.g. IIT Bombay, Delhi University',
  className = '',
  name,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [remote, setRemote] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const query = value.trim();

  // Local matches (instant)
  const localMatches = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    const aliasHits = ALIASES[q] ?? [];
    const starts = ALL_INSTITUTIONS.filter((n) => n.toLowerCase().startsWith(q));
    const contains = ALL_INSTITUTIONS.filter(
      (n) => !n.toLowerCase().startsWith(q) && n.toLowerCase().includes(q)
    );
    return [...aliasHits, ...starts, ...contains];
  }, [query]);

  // Remote matches (debounced, free API; fails silently)
  useEffect(() => {
    if (query.length < 3) {
      setRemote([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://universities.hipolabs.com/search?name=${encodeURIComponent(query)}&country=India`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('bad response');
        const data: { name: string }[] = await res.json();
        setRemote(data.map((d) => d.name));
      } catch {
        setRemote([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const n of [...localMatches, ...remote]) {
      const key = n.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(n);
      }
    }
    return out.slice(0, 12);
  }, [localMatches, remote]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (n: string) => {
    onChange(n);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showDropdown = open && query.length >= 2 && (suggestions.length > 0 || loading);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={
          className ||
          'w-full px-5 py-4 rounded-xl border border-[#4a3728] bg-white text-black placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a3728] focus:border-transparent transition'
        }
      />

      {showDropdown && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-50 max-h-64 overflow-y-auto rounded-xl border border-[#e5d9cc] bg-white shadow-xl"
        >
          {suggestions.map((n, i) => (
            <li
              key={n}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault(); // blur se pehle select ho
                select(n);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-4 py-2.5 text-sm text-gray-800 ${
                i === activeIndex ? 'bg-[#f5ede4]' : 'hover:bg-[#f5ede4]'
              }`}
            >
              {n}
            </li>
          ))}
          {loading && suggestions.length === 0 && (
            <li className="px-4 py-2.5 text-sm text-gray-400">Searching...</li>
          )}
        </ul>
      )}
    </div>
  );
}