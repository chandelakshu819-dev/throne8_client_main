"use client";

import React from "react";
import CompanyBigCard from "./CompanyBigCard";

interface TrustedCompaniesProps {
  companiesRow1: any[];
  companiesRow2: any[];
}

export default function TrustedCompanies({
  companiesRow1,
  companiesRow2,
}: TrustedCompaniesProps) {
  // Use companies from BOTH rows
  const companies = [...companiesRow1, ...companiesRow2];

  return (
    <section className="py-20 sm:py-24 bg-[#FAF9F6] overflow-hidden border-y border-[#ece7e2]">

      {/* Header */}
      <div className="text-center mb-14 px-6">
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[5px] text-[#8b7355] block mb-4">
          Trusted Partners
        </span>

        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#4a3728]">
          World-Class Companies
        </h2>

        <p className="mt-4 text-sm md:text-base text-[#75685d]">
          Our mentors come from the worlds most innovative companies
        </p>
      </div>

      {/* COMPANY LOGOS */}
      <div className="relative w-full">

        {/* Left Arrow */}
        <button
          type="button"
          className="
            absolute
            left-4
            sm:left-8
            top-1/2
            -translate-y-1/2
            z-20
            w-11
            h-11
            rounded-full
            bg-[#f1e7dc]
            border
            border-[#e3d3c2]
            text-[#4a3728]
            flex
            items-center
            justify-center
            shadow-md
            hover:scale-105
            transition-all
          "
        >
          <span className="text-2xl">‹</span>
        </button>

        {/* Logo Row */}
        <div className="overflow-hidden px-20 sm:px-24 pt-10 pb-14">

          <div
            className="
              flex
              items-center
              justify-center
              gap-8
              sm:gap-10
              lg:gap-12
            "
          >
           {companies.map((company, index) => (
  <CompanyBigCard
    key={`${company?.name || "company"}-${index}`}
    company={company}
  />
))}
          </div>

        </div>

        {/* Right Arrow */}
        <button
          type="button"
          className="
            absolute
            right-4
            sm:right-8
            top-1/2
            -translate-y-1/2
            z-20
            w-11
            h-11
            rounded-full
            bg-[#f1e7dc]
            border
            border-[#e3d3c2]
            text-[#4a3728]
            flex
            items-center
            justify-center
            shadow-md
            hover:scale-105
            transition-all
          "
        >
          <span className="text-2xl">›</span>
        </button>

      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-10">
        <span className="w-7 h-2.5 rounded-full bg-[#4a3728]" />

        <span className="w-2.5 h-2.5 rounded-full bg-[#d8c2a9]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#d8c2a9]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#d8c2a9]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#d8c2a9]" />
      </div>

    </section>
  );
}