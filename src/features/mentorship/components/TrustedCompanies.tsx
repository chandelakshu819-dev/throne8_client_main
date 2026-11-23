"use client";

import React from "react";
import CompanyBigCard from "./CompanyBigCard";

interface TrustedCompaniesProps {
  companies?: any[];
}

// ---------- Extra partner companies (logo ke saath) ----------
const logoUrl = (domain: string) =>
  `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=256`;

const PARTNERS: { name: string; domain: string; color: string; letters: string; src?: string }[] = [
  { name: "AKSSAI ProjExel", domain: "akssai.com", color: "#DD4433", letters: "AP", src: "/logos/akssai.png" },
  { name: "Redient Security", domain: "redientsecurity.in", color: "#2563EB", letters: "RS", src: "/logos/redient.png" },
  { name: "Vikaro", domain: "vikaro.in", color: "#4F46E5", letters: "VK", src: "/logos/vikaro.svg" },
  { name: "Netlink Software", domain: "netlink.com", color: "#1E88E5", letters: "NS" },
  { name: "We Win Limited", domain: "wewinlimited.com", color: "#D32F2F", letters: "WW" },
  { name: "TechStalwarts", domain: "techstalwarts.com", color: "#00796B", letters: "TS" },
  { name: "Wipro", domain: "wipro.com", color: "#5B2D90", letters: "W" },
  { name: "TCS", domain: "tcs.com", color: "#0F4C81", letters: "TCS" },
  { name: "Tech Mahindra", domain: "techmahindra.com", color: "#E31837", letters: "TM" },
  { name: "Yash Technologies", domain: "yash.com", color: "#1B3A6B", letters: "YT" },
  { name: "Impetus", domain: "impetus.com", color: "#F58220", letters: "IM" },
  { name: "Persistent Systems", domain: "persistent.com", color: "#F37021", letters: "PS" },
  { name: "Capgemini", domain: "capgemini.com", color: "#0070AD", letters: "CG" },
  { name: "HCLTech", domain: "hcltech.com", color: "#0F5FDC", letters: "HCL" },
  { name: "Infosys", domain: "infosys.com", color: "#007CC3", letters: "IN" },
  { name: "Codiant", domain: "codiant.com", color: "#3F51B5", letters: "CD" },
  { name: "Systango", domain: "systango.com", color: "#FF5722", letters: "SY" },
  { name: "Walkover", domain: "walkover.in", color: "#00A651", letters: "WS" },
];

const EXTRA_COMPANIES = PARTNERS.map((p) => {
  const src = p.src || logoUrl(p.domain);
  return {
    name: p.name,
    color: p.color,
    storedLogoUrl: src,
    logo: src,
    logoUrl: src,
    image: src,
    imageUrl: src,
  };
});

// ---------- Real companies ke asli logo ----------
const brandKey = (s: any) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// key = company naam (small letters, bina space), value = asli logo
const BRAND_LOGOS: Record<string, { label: string; src: string; color?: string }> = {
  google: { label: "Google", src: "https://www.google.com/s2/favicons?domain=google.com&sz=128", color: "#4285F4" },
  meta: { label: "Meta", src: "https://www.google.com/s2/favicons?domain=meta.com&sz=128", color: "#0668E1" },
  throne8: { label: "Throne 8", src: "/throne8logo.png", color: "#D4AF37" },
  wipro: { label: "Wipro", src: "https://www.google.com/s2/favicons?domain=wipro.com&sz=128", color: "#5B2D90" },
  akssai: { label: "AKSSAI ProjExel", src: "/logos/akssai.png", color: "#DD4433" },
  akssaiprojexel: { label: "AKSSAI ProjExel", src: "/logos/akssai.png", color: "#DD4433" },
  projexel: { label: "AKSSAI ProjExel", src: "/logos/akssai.png", color: "#DD4433" },
  redient: { label: "Redient Security", src: "/logos/redient.png", color: "#2563EB" },
  redientsecurity: { label: "Redient Security", src: "/logos/redient.png", color: "#2563EB" },
  vikaro: { label: "Vikaro", src: "/logos/vikaro.svg", color: "#4F46E5" },
};

const withRealLogo = (c: any) => {
  const key = brandKey(c?.name);
  let brand = BRAND_LOGOS[key];
  if (!brand && key) {
    for (const [k, v] of Object.entries(BRAND_LOGOS)) {
      if (key.includes(k) || k.includes(key)) {
        brand = v;
        break;
      }
    }
  }

  const logoSrc = c?.storedLogoUrl || c?.logoUrl || brand?.src;

  return {
    ...c,
    name: brand?.label && brandKey(brand.label) === key ? brand.label : c?.name || brand?.label,
    color: c?.color || brand?.color,
    storedLogoUrl: logoSrc,
    logoUrl: logoSrc,
    logo: logoSrc,
    image: logoSrc,
    imageUrl: logoSrc,
  };
};

export default function TrustedCompanies({ companies: realCompanies = [] }: TrustedCompaniesProps) {
  // Naam ko simple karo (small letters, bina space/symbol) taaki "Wipro Ltd" aur "Wipro" same maane jaye
  const norm = (s: any) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const realNames = realCompanies.map((c: any) => norm(c?.name));

  // Real companies pehle, uske baad extra companies (jo real mein pehle se hain wo skip)
  const companies = [
    ...realCompanies.map(withRealLogo),
    ...EXTRA_COMPANIES.filter((c) => {
      const n = norm(c.name);
      return !realNames.some((r: string) => r && (r === n || r.includes(n) || n.includes(r)));
    }),
  ];

  // Itne items rakho ki ek set poori screen width se lamba ho (smooth loop ke liye)
  let baseList = [...companies];
  while (companies.length > 0 && baseList.length < 8) {
    baseList = [...baseList, ...companies];
  }

  // Speed: number badhao to slow, ghatao to fast (Top Mentors mein 5 hai)
  const duration = baseList.length * 4;

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-[#f7f1e6] overflow-hidden border-y border-[#ece7e2]">
      <style>{`
        @keyframes companiesScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .companies-track {
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          width: max-content;
          will-change: transform;
          animation: companiesScroll ${duration}s linear infinite;
        }
        .companies-container:hover .companies-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .companies-track {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Header matching reference hierarchy */}
      <div className="text-center mb-10 sm:mb-14 px-4">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[4px] sm:tracking-[5px] text-[#8B7355] block mb-2.5">
          TRUSTED PARTNERS
        </span>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#2E2218]">
          World-Class Companies
        </h2>

        <p className="mt-3 text-sm sm:text-base text-[#7D6F63] max-w-xl mx-auto font-medium">
          Our mentors come from the world&apos;s most innovative companies
        </p>
      </div>

      {/* FULL-WIDTH AUTO MARQUEE (no arrows, no dots, no clipped box) */}
      <div className="w-full overflow-hidden companies-container py-6">
        <div className="companies-track">
          {baseList.map((company, index) => (
            <div
              key={`primary-${company.name}-${index}`}
              className="flex-shrink-0"
              style={{ marginRight: "32px" }}
            >
              <CompanyBigCard company={company} />
            </div>
          ))}
          {baseList.map((company, index) => (
            <div
              key={`duplicate-${company.name}-${index}`}
              aria-hidden="true"
              className="flex-shrink-0"
              style={{ marginRight: "32px" }}
            >
              <CompanyBigCard company={company} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
