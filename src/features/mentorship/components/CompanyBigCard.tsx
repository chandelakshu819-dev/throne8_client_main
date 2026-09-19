import React from "react";

interface CompanyBigCardProps {
  company: {
    name: string;
    color: string;
    svg: string;
  };
}

export default function CompanyBigCard({ company }: CompanyBigCardProps) {
  return (
    <div className="flex-shrink-0 w-[172px] h-[172px] sm:w-[178px] sm:h-[178px] group/card relative select-none">
      {/* Soft Hover Glow */}
      <div
        className="
          absolute
          inset-3
          rounded-full
          blur-lg
          opacity-0
          group-hover/card:opacity-20
          transition-opacity
          duration-500
          pointer-events-none
        "
        style={{ backgroundColor: company.color }}
      />

      {/* Circular Badge Card */}
      <div
        className="
        
          relative
          w-full
          h-full
          rounded-full
          bg-[#FFFDF9]
          border
          border-[#E7DDD0]
          flex
          flex-col
          items-center
          justify-center
          shadow-[0_8px_24px_rgba(74,55,40,0.08)]
          transition-all
          duration-500
          ease-out
          group-hover/card:-translate-y-1
          group-hover/card:border-[#C5A059]
          group-hover/card:shadow-[0_10px_24px_rgba(74,55,40,0.14)]
          overflow-hidden
        "
      >
        {/* Thin Inner Gold Ring */}
        <div
          className="
            absolute
            inset-2.5
            sm:inset-3
            rounded-full
            border
            border-[#D4AF37]/30
            transition-all
            duration-500
            ease-out
            group-hover/card:border-[#D4AF37]/75
            group-hover/card:scale-[0.97]
            pointer-events-none
          "
        />

        {/* Company SVG Logo (Centered & Scaled) */}
        <div
          className="
            relative
            z-10
            w-12
            h-12
            sm:w-14
            sm:h-14
            mb-1.5
            flex
            items-center
            justify-center
            [&>svg]:w-full
            [&>svg]:h-full
            [&>svg]:max-w-full
            [&>svg]:max-h-full
            [&>svg]:block
            transition-transform
            duration-500
            ease-out
            group-hover/card:scale-110
          "
          style={{ color: company.color }}
          dangerouslySetInnerHTML={{
            __html: company.svg,
          }}
        />

        {/* Company Name */}
        <p
          className="
            relative
            z-10
            text-[13px]
            sm:text-[14px]
            font-bold
            text-[#3B2B1F]
            tracking-wide
            text-center
            px-3
            max-w-[130px]
            truncate
            transition-colors
            duration-300
          "
          title={company.name}
        >
          {company.name}
        </p>

        {/* Small Gold Horizontal Underline */}
        <div
          className="
            relative
            z-10
            w-5
            group-hover/card:w-9
            h-[2px]
            mt-1.5
            rounded-full
            bg-[#D4AF37]
            transition-all
            duration-500
            ease-out
          "
        />
      </div>
    </div>
  );
}