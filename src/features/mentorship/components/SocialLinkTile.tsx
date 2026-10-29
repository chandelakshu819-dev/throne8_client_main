"use client";

import React from "react";
import { Linkedin, Github, Globe, Briefcase } from "lucide-react";
import { safeUrl, isDomainAllowed } from "@/shared/utils/mentorFormat";

export type SocialPlatformType =
  | "linkedin"
  | "github"
  | "twitter"
  | "x"
  | "leetcode"
  | "portfolio"
  | "website";

interface SocialLinkTileProps {
  href?: string | null;
  type: SocialPlatformType;
  label?: string;
  className?: string;
  variant?: "badge" | "card" | "iconOnly";
}

const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LeetCodeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.874 5.874 0 0 0 .349 1.017 5.938 5.938 0 0 0 4.818 3.541c.219.01.44.01.658 0a6.05 6.05 0 0 0 2.508-.655l3.864-2.28a1.375 1.375 0 0 0 .49-1.879 1.375 1.375 0 0 0-1.88-.49l-3.863 2.28a3.3 3.3 0 0 1-1.368.358c-.12 0-.24 0-.36-.006a3.2 3.2 0 0 1-2.602-1.916 3.1 3.1 0 0 1-.188-.553 3.03 3.03 0 0 1-.033-1.284 2.87 2.87 0 0 1 .66-1.15l3.854-4.125 4.382-4.694A1.375 1.375 0 0 0 13.483 0zm-2.88 8.42a1.375 1.375 0 0 0-1.375 1.375v4.95a1.375 1.375 0 1 0 2.75 0v-4.95a1.375 1.375 0 0 0-1.375-1.375z" />
  </svg>
);

const PLATFORM_CONFIG: Record<
  SocialPlatformType,
  { defaultLabel: string; icon: React.ReactNode; color: string }
> = {
  linkedin: {
    defaultLabel: "LinkedIn",
    icon: <Linkedin className="w-4 h-4 text-[#0077b5]" />,
    color: "#0077b5",
  },
  github: {
    defaultLabel: "GitHub",
    icon: <Github className="w-4 h-4 text-[#24292e]" />,
    color: "#24292e",
  },
  twitter: {
    defaultLabel: "Twitter / X",
    icon: <XIcon className="w-4 h-4 text-[#0f1419]" />,
    color: "#0f1419",
  },
  x: {
    defaultLabel: "X",
    icon: <XIcon className="w-4 h-4 text-[#0f1419]" />,
    color: "#0f1419",
  },
  leetcode: {
    defaultLabel: "LeetCode",
    icon: <LeetCodeIcon className="w-4 h-4 text-[#ffa116]" />,
    color: "#ffa116",
  },
  portfolio: {
    defaultLabel: "Portfolio",
    icon: <Briefcase className="w-4 h-4 text-[#7a5c3e]" />,
    color: "#7a5c3e",
  },
  website: {
    defaultLabel: "Website",
    icon: <Globe className="w-4 h-4 text-[#4a3728]" />,
    color: "#4a3728",
  },
};

const PLATFORM_DOMAINS: Partial<Record<SocialPlatformType, string[]>> = {
  linkedin: ["linkedin.com"],
  github: ["github.com"],
  twitter: ["x.com", "twitter.com"],
  x: ["x.com", "twitter.com"],
  leetcode: ["leetcode.com"],
};

export default function SocialLinkTile({
  href,
  type,
  label,
  className = "",
  variant = "badge",
}: SocialLinkTileProps) {
  const safe = safeUrl(href);
  if (!safe) return null;

  const allowedDomains = PLATFORM_DOMAINS[type];
  if (allowedDomains && !isDomainAllowed(safe, allowedDomains)) {
    return null;
  }

  const config = PLATFORM_CONFIG[type] || PLATFORM_CONFIG.website;
  const displayLabel = label || config.defaultLabel;

  if (variant === "iconOnly") {
    return (
      <a
        href={safe}
        target="_blank"
        rel="noopener noreferrer"
        title={displayLabel}
        aria-label={displayLabel}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#fbf7f3] border border-[#e0d8cf] text-[#4a3728] hover:border-[#7a5c3e] hover:bg-[#f3ece4] transition-all duration-200 ${className}`}
      >
        {config.icon}
      </a>
    );
  }

  if (variant === "card") {
    return (
      <a
        href={safe}
        target="_blank"
        rel="noopener noreferrer"
        title={displayLabel}
        className={`flex items-center gap-3 p-3 rounded-xl bg-[#fbf7f3] border border-[#e0d8cf] hover:border-[#7a5c3e] hover:bg-[#f3ece4] transition-all group ${className}`}
      >
        <div className="w-8 h-8 rounded-lg bg-white border border-[#e0d8cf] flex items-center justify-center shrink-0">
          {config.icon}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-bold text-[#4a3728] group-hover:text-[#7a5c3e] transition-colors truncate">
            {displayLabel}
          </p>
          <p className="text-[11px] text-[#8a7a6a] truncate">{safe}</p>
        </div>
      </a>
    );
  }

  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      title={displayLabel}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#fbf7f3] border border-[#e0d8cf] text-[#4a3728] hover:border-[#7a5c3e] hover:bg-[#f3ece4] transition-all duration-200 ${className}`}
    >
      {config.icon}
      <span>{displayLabel}</span>
    </a>
  );
}
