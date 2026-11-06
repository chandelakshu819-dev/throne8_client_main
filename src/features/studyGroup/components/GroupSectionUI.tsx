import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/** One grid for every section on the groups home page. */
export const GROUP_GRID =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6";

/** Primary button used inside every group card. */
export const GROUP_BTN =
  "w-full rounded-lg py-2.5 text-sm font-semibold shadow-sm transition-colors";
export const GROUP_BTN_PRIMARY = `${GROUP_BTN} bg-[#4a3728] text-white hover:bg-[#3a2a1e]`;
export const GROUP_BTN_DISABLED = `${GROUP_BTN} cursor-not-allowed bg-gray-200 text-gray-400`;

/** Same heading block for every section (icon, title, subtitle, accent line). */
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}> = ({ title, subtitle, icon }) => (
  <div className="mb-6 text-center sm:mb-8">
    {icon && (
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#4a3728] text-white shadow-md">
        {icon}
      </div>
    )}
    <h2 className="text-2xl font-bold tracking-tight text-[#4a3728] sm:text-3xl lg:text-4xl">
      {title}
    </h2>
    {subtitle && (
      <p className="mt-2 text-sm text-[#6b5847] sm:text-base">{subtitle}</p>
    )}
    <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-[#4a3728] via-[#8b6f47] to-[#d4a574]" />
  </div>
);

/** Same card frame for every group card. */
export const CardShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#e0d8cf] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d4a574] hover:shadow-md">
    <div className="h-1 bg-gradient-to-r from-[#4a3728] via-[#8b6f47] to-[#d4a574]" />
    <div className="flex flex-1 flex-col p-4">{children}</div>
  </div>
);

/** Same Show More / Show Less button for every section. */
export const ShowMoreButton: React.FC<{
  expanded: boolean;
  onClick: () => void;
}> = ({ expanded, onClick }) => (
  <div className="mt-8 flex justify-center">
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-[#d4c4b5] bg-white/70 px-6 py-2.5 text-sm font-semibold text-[#4a3728] shadow-sm transition-colors hover:bg-white"
    >
      {expanded ? (
        <>
          Show Less <ChevronUp size={18} />
        </>
      ) : (
        <>
          Show More <ChevronDown size={18} />
        </>
      )}
    </button>
  </div>
);
