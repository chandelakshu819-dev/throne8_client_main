"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Merge both existing company arrays into ONE single array
  const companies = [
    ...(companiesRow1 && companiesRow1.length > 0 ? companiesRow1 : TOP_COMPANIES),
    ...(companiesRow2 && companiesRow2.length > 0 ? companiesRow2 : TOP_COMPANIES_ROW2),
  ];

  // Quadruple the array for completely seamless infinite looping marquee on all screen widths
  const marqueeCompanies = [
    ...companies,
    ...companies,
    ...companies,
    ...companies,
  ];

  const handleScrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -250, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 250, behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-[#FAF9F6] overflow-hidden border-y border-[#ece7e2]">
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

      {/* SINGLE HORIZONTAL CAROUSEL */}
      <div className="relative w-full max-w-[1440px] mx-auto px-3 sm:px-8 md:px-12 group">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handleScrollLeft}
          aria-label="Previous companies"
          className="
            absolute
            left-2
            sm:left-4
            md:left-6
            top-1/2
            -translate-y-1/2
            z-20
            w-9
            h-9
            sm:w-10
            sm:h-10
            rounded-full
            bg-[#FAF7F2]
            border
            border-[#E5DACD]
            text-[#4A3728]
            shadow-sm
            flex
            items-center
            justify-center
            hover:bg-[#F3ECE4]
            hover:scale-105
            active:scale-95
            transition-all
            duration-300
            cursor-pointer
          "
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#4A3728]" />
        </button>

        {/* Marquee Viewport: Exactly ONE horizontal flex track */}
        <div
          ref={containerRef}
          className="overflow-x-clip mx-8 sm:mx-12 md:mx-14 no-scrollbar"
        >
          <div
            className="
              flex
              flex-nowrap
              items-center
              gap-6
              sm:gap-8
              lg:gap-9
              w-max
              min-w-max
              animate-marquee
              group-hover:pause-animation
            "
          >
            {marqueeCompanies.map((company, index) => (
              <div
                key={`${company.name}-${index}`}
                className="flex-shrink-0"
              >
                <CompanyBigCard company={company} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleScrollRight}
          aria-label="Next companies"
          className="
            absolute
            right-2
            sm:right-4
            md:right-6
            top-1/2
            -translate-y-1/2
            z-20
            w-9
            h-9
            sm:w-10
            sm:h-10
            rounded-full
            bg-[#FAF7F2]
            border
            border-[#E5DACD]
            text-[#4A3728]
            shadow-sm
            flex
            items-center
            justify-center
            hover:bg-[#F3ECE4]
            hover:scale-105
            active:scale-95
            transition-all
            duration-300
            cursor-pointer
          "
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#4A3728]" />
        </button>
      </div>

      {/* Pagination Dots matching reference image (● ○ ○ ○ ○) */}
      <div className="flex justify-center items-center gap-2 mt-8 sm:mt-10">
        <span className="w-2.5 h-2.5 rounded-full bg-[#4A3728]" />
        <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-[#BFA892] bg-transparent" />
        <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-[#BFA892] bg-transparent" />
        <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-[#BFA892] bg-transparent" />
        <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-[#BFA892] bg-transparent" />
      </div>
    </section>
  );
}