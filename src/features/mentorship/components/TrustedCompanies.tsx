"use client";

import React from "react";
import CompanyBigCard from "./CompanyBigCard";
import { TOP_COMPANIES, TOP_COMPANIES_ROW2 } from "../constants/mock.data";

interface TrustedCompaniesProps {
  companiesRow1?: any[];
  companiesRow2?: any[];
}

export default function TrustedCompanies({
  companiesRow1 = TOP_COMPANIES,
  companiesRow2 = TOP_COMPANIES_ROW2,
}: TrustedCompaniesProps) {
  // Merge both existing company arrays into ONE single array
  const companies = [
    ...(companiesRow1 && companiesRow1.length > 0 ? companiesRow1 : TOP_COMPANIES),
    ...(companiesRow2 && companiesRow2.length > 0 ? companiesRow2 : TOP_COMPANIES_ROW2),
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