import React, { useEffect, useState } from "react";

interface CompanyBigCardProps {
  company: {
    name: string;
    color: string;
    svg?: string;
    logoUrl?: string;
    /** Logo we store for this company (mentor-company autocomplete). Highest priority. */
    storedLogoUrl?: string;
    logo?: string;
    image?: string;
    imageUrl?: string;
    count?: number;
  };
}

export default function CompanyBigCard({ company }: CompanyBigCardProps) {
  const [imgFailed, setImgFailed] = useState(false);

  // Logo source priority: storedLogoUrl -> logoUrl -> logo -> imageUrl -> image
  const resolvedLogoUrl =
    company.storedLogoUrl ||
    company.logoUrl ||
    (company as any).logo ||
    (company as any).imageUrl ||
    (company as any).image;

  useEffect(() => {
    setImgFailed(false);
  }, [resolvedLogoUrl, company.svg]);

  const isPureSvg = Boolean(company.svg && company.svg.trim().startsWith("<svg"));
  const canShowImg = Boolean(resolvedLogoUrl && !imgFailed);

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

        {/* Company Logo Container (Centered & Scaled) */}
        <div
          className="
            relative
            z-10
            w-20
            h-12
            sm:w-24
            sm:h-14
            mb-1.5
            px-1.5
            flex
            items-center
            justify-center
            transition-transform
            duration-500
            ease-out
            group-hover/card:scale-110
          "
          style={{ color: company.color }}
        >
          {canShowImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedLogoUrl}
              alt={company.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full max-w-full max-h-full object-contain block select-none pointer-events-none"
            />
          ) : isPureSvg ? (
            <div
              className="w-full h-full max-w-full max-h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain [&>svg]:block select-none pointer-events-none"
              dangerouslySetInnerHTML={{ __html: company.svg! }}
            />
          ) : (
            <span
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl font-black text-white select-none shrink-0"
              style={{ backgroundColor: company.color }}
            >
              {company.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

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

        {typeof company.count === "number" && company.count > 0 && (
          <p className="relative z-10 text-[10px] font-semibold text-[#8B7355] mt-0.5">
            {company.count} {company.count === 1 ? "mentor" : "mentors"}
          </p>
        )}

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
