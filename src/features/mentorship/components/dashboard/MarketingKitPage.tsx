// src/features/mentorship/components/dashboard/MarketingKitPage.tsx
"use client";

import React, { useMemo, useState } from "react";
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
} from "lucide-react";

interface MarketingKitPageProps {
  mentorData?: any;
}

// ── Reusable section shell (matches ProfilePage card style) ─────────────
const SectionCard = ({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.FC<any>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white p-6 rounded-2xl" style={{ border: "1px solid #e0d8cf" }}>
    <div className="flex items-center gap-3 mb-5">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#f3ece4" }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: "#7a5c3e" }} />
      </div>
      <div>
        <h3 className="text-base font-bold" style={{ color: "#4a3728" }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs" style={{ color: "#8a7a6a" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {children}
  </div>
);

// ── Copyable text row ─────────────────────────────────────────────────
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
        <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#a08070" }}>
          {label}
        </p>
      )}
      <div
        className="flex items-center gap-2 p-3 rounded-xl"
        style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
      >
        <p className="flex-1 text-sm font-medium truncate" style={{ color: "#4a3728" }}>
          {value}
        </p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
          style={{ backgroundColor: copied ? "#15803d" : "#4a3728" }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
};

// ── Social template card ─────────────────────────────────────────────
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
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 rounded-xl" style={{ border: "1px solid #e0d8cf", backgroundColor: "#fbf7f3" }}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center" style={{ border: "1px solid #e0d8cf" }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
          <span className="text-sm font-bold" style={{ color: "#4a3728" }}>
            {platform}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: copied ? "#15803d" : "#4a3728" }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a4535" }}>
        {text}
      </p>
    </div>
  );
};

// ── Downloadable asset card ───────────────────────────────────────────
const AssetCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.FC<any>;
  title: string;
  description: string;
}) => (
  <div
    className="p-4 rounded-xl flex flex-col items-center text-center gap-2.5"
    style={{ border: "1px solid #e0d8cf", backgroundColor: "#fbf7f3" }}
  >
    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#f3ece4" }}>
      <Icon className="w-5 h-5" style={{ color: "#7a5c3e" }} />
    </div>
    <div>
      <p className="text-sm font-bold" style={{ color: "#4a3728" }}>
        {title}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "#8a7a6a" }}>
        {description}
      </p>
    </div>
    <button
      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: "#4a3728" }}
    >
      <Download className="w-3.5 h-3.5" />
      Download
    </button>
  </div>
);

export default function MarketingKitPage({ mentorData }: MarketingKitPageProps) {
  const mentorId = mentorData?.mentorId ?? mentorData?.user?.id ?? "";
  const mentorName = `${mentorData?.user?.firstName ?? ""} ${mentorData?.user?.lastName ?? ""}`.trim() || "your-profile";

  const profileUrl = useMemo(() => {
    const base =
      typeof window !== "undefined" ? window.location.origin : "https://throne8.com";
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#4a3728" }}>
          <Megaphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#4a3728" }}>
            Marketing Kit
          </h2>
          <p className="text-sm" style={{ color: "#8a7a6a" }}>
            Promote your mentor profile and grow your bookings
          </p>
        </div>
      </div>

      {/* Profile Link + QR */}
      <SectionCard icon={Link2} title="Shareable Profile Link" subtitle="Share this anywhere to bring people to your mentor profile">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-4">
            <CopyRow value={profileUrl} label="Your Profile Link" />
            <div className="flex items-center gap-2 text-xs" style={{ color: "#8a7a6a" }}>
              <Share2 className="w-3.5 h-3.5" />
              Add this to your LinkedIn bio, email signature, or resume
            </div>
          </div>
          <div
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl"
            style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
          >
            <img
              src={qrImageUrl}
              alt="Profile QR Code"
              className="w-28 h-28 rounded-lg"
              style={{ border: "1px solid #e0d8cf" }}
            />
            <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#7a5c3e" }}>
              <QrCode className="w-3.5 h-3.5" />
              Scan to visit
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Referral Program */}
      <SectionCard icon={Gift} title="Referral Program" subtitle="Invite people using your link and track how they engage">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
            <p className="text-2xl font-bold" style={{ color: "#4a3728" }}>{referralStats.invited}</p>
            <p className="text-xs mt-1" style={{ color: "#8a7a6a" }}>People Invited</p>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
            <p className="text-2xl font-bold" style={{ color: "#4a3728" }}>{referralStats.joined}</p>
            <p className="text-xs mt-1" style={{ color: "#8a7a6a" }}>Joined via You</p>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
            <p className="text-2xl font-bold" style={{ color: "#4a3728" }}>₹{referralStats.earned}</p>
            <p className="text-xs mt-1" style={{ color: "#8a7a6a" }}>Rewards Earned</p>
          </div>
        </div>
        <CopyRow value={referralUrl} label="Your Referral Link" />
      </SectionCard>

      {/* Social Templates */}
      <SectionCard icon={Sparkles} title="Social Media Post Templates" subtitle="Ready-to-use captions — just copy and post">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {socialTemplates.map((t) => (
            <TemplateCard key={t.platform} icon={t.icon} iconColor={t.iconColor} platform={t.platform} text={t.text} />
          ))}
        </div>
      </SectionCard>

      {/* Downloadable Assets */}
      <SectionCard icon={ImageIcon} title="Downloadable Assets" subtitle="Badges and banners to use on your website or socials">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AssetCard icon={BadgeCheck} title="Verified Mentor Badge" description="PNG, transparent" />
          <AssetCard icon={ImageIcon} title="Profile Banner" description="1200×628 px" />
          <AssetCard icon={Users} title="Instagram Story Card" description="1080×1920 px" />
          <AssetCard icon={Megaphone} title="LinkedIn Post Graphic" description="1200×1200 px" />
        </div>
      </SectionCard>

      {/* Email Template */}
      <SectionCard icon={Mail} title="Email Invite Template" subtitle="Send this to your network to invite them">
        <div className="p-4 rounded-xl mb-3" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5a4535" }}>
            {emailTemplate}
          </p>
        </div>
        <CopyRow value={emailTemplate} />
      </SectionCard>
    </div>
  );
}