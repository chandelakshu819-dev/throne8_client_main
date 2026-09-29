// src/features/mentorship/components/dashboard/MarketingKitPage.tsx
"use client";

import React, { useMemo, useState, useRef } from "react";
import {
  Megaphone,
  Link2,
  QrCode,
  Copy,
  Check,
  Share2,
  Gift,
  Users,
  Download,
  Linkedin,
  Instagram,
  MessageCircle,
  Mail,
  Image as ImageIcon,
  BadgeCheck,
  Sparkles,
  UserPlus,
  Trophy,
} from "lucide-react";
import config from "@/config/env.config";

// ── Design tokens (Throne8 palette) ─────────────────────────────────────
const C = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  wash: "#f6ede8",
  softWash: "#fbf7f3",
  chip: "#f3ece4",
  paper: "#fffdfb",
  gold: "#c9a87c",
  muted: "#8a7a6a",
  faint: "#a08070",
  success: "#15803d",
  white: "#ffffff",
} as const;

interface MarketingKitPageProps {
  mentorData?: any;
}

// ── Reusable section shell ──────────────────────────────────────────────
const SectionCard = ({
  icon: Icon,
  title,
  subtitle,
  children,
  noPadding,
}: {
  icon: React.FC<any>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  noPadding?: boolean;
}) => (
  <div
    className="rounded-2xl overflow-hidden transition-shadow duration-300"
    style={{
      backgroundColor: C.white,
      border: `1px solid ${C.hairline}`,
      boxShadow: "0 1px 3px rgba(74, 55, 40, 0.04), 0 4px 12px rgba(74, 55, 40, 0.03)",
    }}
  >
    {/* Section header with subtle gradient accent bar */}
    <div
      style={{
        borderBottom: `1px solid ${C.hairline}`,
        padding: "20px 24px",
        background: `linear-gradient(135deg, ${C.softWash} 0%, ${C.white} 100%)`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${C.chip} 0%, ${C.wash} 100%)`,
            border: `1px solid ${C.hairline}`,
          }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: C.accent }} />
        </div>
        <div>
          <h3
            className="text-[15px] font-bold leading-snug"
            style={{ color: C.ink, letterSpacing: "-0.01em" }}
          >
            {title}
          </h3>
          {subtitle && (
            <p className="text-[12.5px] mt-0.5 leading-snug" style={{ color: C.muted }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
    {/* Section body */}
    <div style={noPadding ? {} : { padding: "20px 24px" }}>{children}</div>
  </div>
);

// ── Copyable text row ───────────────────────────────────────────────────
const CopyRow = ({ value, label }: { value: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard not available — silently ignore
    }
  };

  return (
    <div>
      {label && (
        <p
          className="text-[11px] font-bold uppercase tracking-wider mb-2"
          style={{ color: C.faint }}
        >
          {label}
        </p>
      )}
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all duration-200 min-w-0"
        style={{
          backgroundColor: C.softWash,
          border: `1px solid ${C.hairline}`,
        }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: C.chip }}
        >
          <Link2 className="w-3.5 h-3.5" style={{ color: C.accent }} />
        </div>
        <p
          className="flex-1 text-[13px] font-medium truncate select-all min-w-0"
          style={{ color: C.ink, fontFamily: "monospace" }}
        >
          {value}
        </p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg text-xs font-semibold text-white shrink-0 transition-all duration-200"
          style={{
            backgroundColor: copied ? C.success : C.ink,
            boxShadow: copied
              ? "0 2px 8px rgba(21, 128, 61, 0.25)"
              : "0 2px 8px rgba(74, 55, 40, 0.15)",
            transform: copied ? "scale(1.02)" : "scale(1)",
          }}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
};

// ── Social template card ────────────────────────────────────────────────
const TemplateCard = ({
  icon: Icon,
  iconColor,
  platform,
  text,
}: {
  icon: React.FC<any>;
  iconColor: string;
  platform: string;
  text: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="group rounded-xl transition-all duration-300 flex flex-col h-full"
      style={{
        border: `1px solid ${C.hairline}`,
        backgroundColor: C.white,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 6px 20px rgba(74, 55, 40, 0.08)";
        e.currentTarget.style.borderColor = iconColor + "60";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = C.hairline;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Platform header strip */}
      <div
        className="flex items-center justify-between px-4 py-3.5 rounded-t-xl"
        style={{ 
          borderBottom: `1px solid ${C.hairline}`, 
          backgroundColor: C.softWash 
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center bg-white shadow-sm"
            style={{
              border: `1px solid ${C.hairline}`,
            }}
          >
            <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} />
          </div>
          <span
            className="text-[13px] font-bold tracking-wide uppercase"
            style={{ color: C.ink }}
          >
            {platform}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all duration-200 relative z-10"
          style={{
            backgroundColor: copied ? C.success : C.ink,
            boxShadow: copied
              ? "0 2px 8px rgba(21, 128, 61, 0.25)"
              : "0 2px 6px rgba(74, 55, 40, 0.15)",
            transform: copied ? "scale(1.03)" : "scale(1)",
            cursor: "pointer",
          }}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "Copied!" : "Copy Text"}
        </button>
      </div>
      {/* Template body */}
      <div className="px-4 py-4 flex-1">
        <p
          className="text-[13px] leading-[1.65] whitespace-pre-line break-words"
          style={{ color: "#5a4a3a" }}
        >
          {text}
        </p>
      </div>
    </div>
  );
};

// ── Downloadable asset card ─────────────────────────────────────────────
const AssetCard = ({
  icon: Icon,
  title,
  description,
  onDownload,
  isLoading,
}: {
  icon: React.FC<any>;
  title: string;
  description: string;
  onDownload: () => void;
  isLoading?: boolean;
}) => (
  <div
    className="group p-4 rounded-xl flex flex-col items-center text-center gap-3 transition-all duration-300"
    style={{
      border: `1px solid ${C.hairline}`,
      backgroundColor: C.white,
      cursor: isLoading ? "wait" : "pointer",
      opacity: isLoading ? 0.7 : 1,
    }}
    onClick={() => !isLoading && onDownload()}
    onMouseEnter={(e) => {
      if (isLoading) return;
      e.currentTarget.style.boxShadow =
        "0 4px 16px rgba(74, 55, 40, 0.08)";
      e.currentTarget.style.borderColor = C.gold + "60";
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      if (isLoading) return;
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = C.hairline;
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300"
      style={{
        background: `linear-gradient(135deg, ${C.chip} 0%, ${C.wash} 100%)`,
        border: `1px solid ${C.hairline}`,
      }}
    >
      <Icon className="w-5 h-5" style={{ color: C.accent }} />
    </div>
    <div className="space-y-0.5">
      <p className="text-[13px] font-bold" style={{ color: C.ink }}>
        {title}
      </p>
      <p className="text-[11px]" style={{ color: C.muted }}>
        {description}
      </p>
    </div>
    <button
      disabled={isLoading}
      className="flex items-center gap-1.5 px-4 py-[7px] rounded-lg text-[11px] font-bold text-white transition-all duration-200 mt-auto"
      style={{
        backgroundColor: C.ink,
        boxShadow: "0 1px 4px rgba(74, 55, 40, 0.12)",
        opacity: isLoading ? 0.7 : 1,
        cursor: isLoading ? "wait" : "pointer",
      }}
      onClick={(e) => { e.stopPropagation(); !isLoading && onDownload(); }}
      onMouseEnter={(e) => {
        if (!isLoading) (e.target as HTMLElement).style.backgroundColor = C.accent;
      }}
      onMouseLeave={(e) => {
        if (!isLoading) (e.target as HTMLElement).style.backgroundColor = C.ink;
      }}
    >
      <Download className="w-3.5 h-3.5" />
      {isLoading ? "Generating..." : "Download"}
    </button>
  </div>
);

// ── Stat card for referral program ──────────────────────────────────────
const StatCard = ({
  icon: Icon,
  value,
  label,
  accentColor,
}: {
  icon: React.FC<any>;
  value: string | number;
  label: string;
  accentColor: string;
}) => (
  <div
    className="relative p-5 rounded-xl overflow-hidden transition-all duration-300"
    style={{
      backgroundColor: C.white,
      border: `1px solid ${C.hairline}`,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow =
        "0 4px 16px rgba(74, 55, 40, 0.07)";
      e.currentTarget.style.transform = "translateY(-1px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    {/* Subtle top accent line */}
    <div
      className="absolute top-0 left-0 right-0 h-[3px]"
      style={{
        background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}40 100%)`,
      }}
    />
    <div className="flex items-start justify-between">
      <div>
        <p
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: C.ink }}
        >
          {value}
        </p>
        <p className="text-[12px] mt-1 font-medium" style={{ color: C.muted }}>
          {label}
        </p>
      </div>
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: accentColor + "14" }}
      >
        <Icon className="w-4 h-4" style={{ color: accentColor }} />
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// ── Main component ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
export default function MarketingKitPage({ mentorData }: MarketingKitPageProps) {
  const mentorId = mentorData?.mentorId ?? mentorData?.user?.id ?? "";
  const mentorName = `${mentorData?.user?.firstName ?? ""} ${mentorData?.user?.lastName ?? ""}`.trim() || "your-profile";

  const [downloadingAsset, setDownloadingAsset] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const profileUrl = useMemo(() => {
    // Uses config APP URL as base for production
    const base = config.NEXT_PUBLIC_APP_URL || "https://throne8.com";
    const slug = mentorName.toLowerCase().replace(/\s+/g, "-");
    return `${base}/mentorship/mentor-card/${slug}/${mentorId}`;
  }, [mentorName, mentorId]);

  const referralUrl = `${profileUrl}?ref=${mentorId || "yourcode"}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=4a3728&bgcolor=fbf7f3&data=${encodeURIComponent(
    profileUrl
  )}`;

  const referralStats = {
    invited: mentorData?.referralStats?.invited ?? 0,
    joined: mentorData?.referralStats?.joined ?? 0,
    earned: mentorData?.referralStats?.earned ?? 0,
  };

  const socialTemplates = [
    {
      platform: "LinkedIn",
      icon: Linkedin,
      iconColor: "#0a66c2",
      text: `🚀 Excited to share that I'm now mentoring on Throne8!\n\nIf you're looking to grow in your career, I'd love to help. Check out my mentor profile and book a session:\n${profileUrl}\n\n#Mentorship #CareerGrowth #Throne8`,
    },
    {
      platform: "Instagram",
      icon: Instagram,
      iconColor: "#e1306c",
      text: `✨ I'm now a mentor on Throne8! Helping folks navigate their careers, one session at a time.\n\nLink in bio 👉 ${profileUrl}`,
    },
    {
      platform: "WhatsApp",
      icon: MessageCircle,
      iconColor: "#25d366",
      text: `Hey! I've started mentoring on Throne8 🎓 If you or anyone you know needs guidance, here's my profile: ${profileUrl}`,
    },
  ];

  const emailTemplate = `Subject: Let's grow together — I'm mentoring on Throne8 🎓

Hi there,

I wanted to share something exciting — I've joined Throne8 as a mentor! If you're looking for guidance on your career, skills, or growth journey, I'd be glad to help.

You can check out my profile and book a session here:
${profileUrl}

Looking forward to connecting!

Best,
${mentorName}`;

  const generateAsset = async (type: string, width: number, height: number, text: string, transparent = false) => {
    if (downloadingAsset) return;
    setDownloadingAsset(type);
    setDownloadError(null);

    try {
      // Small delay to allow UI to update with "Generating..." state
      await new Promise((resolve) => setTimeout(resolve, 50));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas context");

      if (!transparent) {
        // Background
        ctx.fillStyle = C.ink;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      // Add a border if transparent
      if (transparent) {
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, width - 10, height - 10);
      }

      // Text styling
      ctx.fillStyle = transparent ? C.ink : C.white;
      
      // Calculate font sizes relative to height, to ensure they fit
      const mainFontSize = Math.floor(Math.min(width, height) * 0.1);
      const subFontSize = Math.floor(Math.min(width, height) * 0.05);

      ctx.font = `bold ${mainFontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, width / 2, height / 2 - (mainFontSize / 2));

      ctx.font = `${subFontSize}px sans-serif`;
      ctx.fillStyle = transparent ? C.accent : C.gold;
      ctx.fillText(`Throne8 Mentor: ${mentorName}`, width / 2, height / 2 + (mainFontSize / 2));

      const dataUrl = canvas.toDataURL("image/png");
      
      if (dataUrl === "data:,") {
        throw new Error("Canvas generated an empty image.");
      }

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${mentorName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${type}.png`;
      document.body.appendChild(a); // Append to body to ensure click works in all browsers
      a.click();
      document.body.removeChild(a); // Clean up
    } catch (error: any) {
      console.error(`Failed to generate asset ${type}:`, error);
      setDownloadError(`Failed to generate ${type} asset. Please try again.`);
      // Optional: hide error after a few seconds
      setTimeout(() => setDownloadError(null), 5000);
    } finally {
      setDownloadingAsset(null);
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${mentorName.replace(/\s+/g, "_")}_qr.png`;
      a.click();
    } catch (e) {
      console.error("Failed to download QR", e);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn max-w-[960px] relative">
      {/* ── Error Toast ────────────────────────────────────────────────── */}
      {downloadError && (
        <div className="absolute top-0 right-0 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md flex justify-between items-center w-full sm:w-auto">
          <span>{downloadError}</span>
          <button onClick={() => setDownloadError(null)} className="ml-4 font-bold focus:outline-none">&times;</button>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pb-1">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${C.ink} 0%, ${C.accent} 100%)`,
            boxShadow: `0 4px 12px ${C.ink}25`,
          }}
        >
          <Megaphone className="w-5.5 h-5.5 text-white" />
        </div>
        <div>
          <h2
            className="text-xl font-extrabold tracking-tight"
            style={{ color: C.ink, letterSpacing: "-0.02em" }}
          >
            Marketing Kit
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: C.muted }}>
            Promote your mentor profile and grow your bookings
          </p>
        </div>
      </div>

      {/* ── Profile Link + QR ──────────────────────────────────────────── */}
      <SectionCard
        icon={Link2}
        title="Shareable Profile Link"
        subtitle="Share this anywhere to bring people to your mentor profile"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-6">
          {/* Left – Link + tip */}
          <div className="space-y-4 min-w-0">
            <CopyRow value={profileUrl} label="Your Profile Link" />
            <div
              className="flex items-start gap-2.5 text-[12px] leading-snug px-3 py-2.5 rounded-lg"
              style={{
                color: C.muted,
                backgroundColor: C.chip + "80",
              }}
            >
              <Share2
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                style={{ color: C.accent }}
              />
              <span>
                Add this to your LinkedIn bio, email signature, or resume to drive
                more bookings.
              </span>
            </div>
          </div>

          {/* Right – QR Code */}
          <div
            className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl"
            style={{
              backgroundColor: C.softWash,
              border: `1px solid ${C.hairline}`,
            }}
          >
            <img
              src={qrImageUrl}
              alt="Profile QR Code"
              className="w-[120px] h-[120px] rounded-lg object-contain shrink-0 cursor-pointer hover:opacity-90"
              onClick={handleDownloadQR}
              style={{
                border: `1px solid ${C.hairline}`,
                padding: "4px",
                backgroundColor: C.white,
              }}
              title="Click to download QR code"
            />
            <span
              className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer hover:underline"
              style={{ color: C.accent }}
              onClick={handleDownloadQR}
            >
              <QrCode className="w-3.5 h-3.5" />
              Scan or Click to Download
            </span>
          </div>
        </div>
      </SectionCard>

      {/* ── Referral Program ───────────────────────────────────────────── */}
      <SectionCard
        icon={Gift}
        title="Referral Program"
        subtitle="Invite people using your link and track how they engage"
      >
        <div className="space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              icon={UserPlus}
              value={referralStats.invited}
              label="People Invited"
              accentColor="#4a3728"
            />
            <StatCard
              icon={Users}
              value={referralStats.joined}
              label="Joined via You"
              accentColor="#7a5c3e"
            />
            <StatCard
              icon={Trophy}
              value={`₹${referralStats.earned}`}
              label="Rewards Earned"
              accentColor="#c9a87c"
            />
          </div>
          {/* Referral link */}
          <CopyRow value={referralUrl} label="Your Referral Link" />
        </div>
      </SectionCard>

      {/* ── Social Templates ───────────────────────────────────────────── */}
      <SectionCard
        icon={Sparkles}
        title="Social Media Post Templates"
        subtitle="Ready-to-use captions — just copy and post"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {socialTemplates.map((t) => (
            <TemplateCard
              key={t.platform}
              icon={t.icon}
              iconColor={t.iconColor}
              platform={t.platform}
              text={t.text}
            />
          ))}
        </div>
      </SectionCard>

      {/* ── Downloadable Assets ────────────────────────────────────────── */}
      <SectionCard
        icon={ImageIcon}
        title="Downloadable Assets"
        subtitle="Badges and banners to use on your website or socials"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AssetCard
            icon={BadgeCheck}
            title="Verified Mentor Badge"
            description="PNG, transparent"
            onDownload={() => generateAsset("badge", 400, 400, "Verified Mentor", true)}
            isLoading={downloadingAsset === "badge"}
          />
          <AssetCard
            icon={ImageIcon}
            title="Profile Banner"
            description="1200×628 px"
            onDownload={() => generateAsset("banner", 1200, 628, "Book a Session With Me")}
            isLoading={downloadingAsset === "banner"}
          />
          <AssetCard
            icon={Users}
            title="Instagram Story Card"
            description="1080×1920 px"
            onDownload={() => generateAsset("ig_story", 1080, 1920, "Grow Your Career")}
            isLoading={downloadingAsset === "ig_story"}
          />
          <AssetCard
            icon={Megaphone}
            title="LinkedIn Post Graphic"
            description="1200×1200 px"
            onDownload={() => generateAsset("li_post", 1200, 1200, "Level Up Your Skills")}
            isLoading={downloadingAsset === "li_post"}
          />
        </div>
      </SectionCard>

      {/* ── Email Template ─────────────────────────────────────────────── */}
      <SectionCard
        icon={Mail}
        title="Email Invite Template"
        subtitle="Send this to your network to invite them"
      >
        <div className="space-y-4">
          {/* Email preview */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${C.hairline}` }}
          >
            {/* Mock email header */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{
                backgroundColor: C.chip,
                borderBottom: `1px solid ${C.hairline}`,
              }}
            >
              <Mail className="w-3.5 h-3.5" style={{ color: C.accent }} />
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: C.faint }}
              >
                Email Preview
              </span>
            </div>
            <div
              className="px-5 py-4"
              style={{ backgroundColor: C.softWash }}
            >
              <p
                className="text-[13px] leading-[1.7] whitespace-pre-line"
                style={{ color: "#5a4a3a" }}
              >
                {emailTemplate}
              </p>
            </div>
          </div>
          {/* Copy button */}
          <CopyRow value={emailTemplate} />
        </div>
      </SectionCard>
    </div>
  );
}