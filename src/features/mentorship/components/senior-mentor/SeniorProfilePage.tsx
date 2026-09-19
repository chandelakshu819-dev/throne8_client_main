import React from "react";
import { User, ShieldCheck, CheckCircle2, FileText, Linkedin, AlertCircle } from "lucide-react";
import type { SeniorMentorApplication } from "@/lib/api/seniorMentorApplication.service";
import { useAppSelector } from "@/core/store/store.hooks";

interface SeniorProfilePageProps {
  seniorData: SeniorMentorApplication | null;
}

const InfoTile = ({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div
    className={`p-5 rounded-2xl transition-colors duration-200 ${full ? "md:col-span-2" : ""}`}
    style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
  >
    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#a08070" }}>
      {label}
    </p>
    {children}
  </div>
);

const EmptyValue = () => <span className="italic text-sm" style={{ color: "#c0b0a0" }}>Not set</span>;

export default function SeniorProfilePage({ seniorData }: SeniorProfilePageProps) {
  const [imgFallbackLevel, setImgFallbackLevel] = React.useState(0);
  const globalProfile = useAppSelector((state) => state.login.profile);

  if (!seniorData) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-full">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-[#4a3728] mb-2">Error Loading Profile</h2>
        <p className="text-slate-600 font-medium mb-6">Could not retrieve application data.</p>
      </div>
    );
  }

  const {
    fullName,
    profilePhoto,
    college,
    degree,
    fieldOfStudy,
    graduationYear,
    currentRole,
    currentCompany,
    shortBio,
    linkedinUrl,
    portfolioUrl,
    githubUrl,
    yearsOfExperience,
    experienceLevel,
    primaryExpertise,
    otherSkills,
    technologies,
    achievements,
    certifications,
    helpAreas,
    motivation,
    adviceToJuniorSelf,
    resumeUrl,
    proofDocumentUrl,
    verificationStatus,
    isActive,
  } = seniorData;
  
  const getPhotoForLevel = (level: number): string | null => {
    if (level === 0 && profilePhoto) return profilePhoto;
    if (level <= 1 && (globalProfile?.profilePic || globalProfile?.profilePhoto)) return globalProfile?.profilePic || globalProfile?.profilePhoto;
    return null;
  };
  const currentPhoto = getPhotoForLevel(imgFallbackLevel);
  const initials = fullName?.[0] ?? "S";

  // Check if status is fully active/verified
  const isApproved = (verificationStatus === 'verified' || verificationStatus === 'active' as any) && isActive;

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Header Info */}
      <div className="flex items-center justify-between flex-wrap gap-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center" style={{ backgroundColor: "#4a3728" }}>
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: "#4a3728" }}>
              Senior Mentor Application Profile
            </h2>
            <p className="text-sm font-medium mt-0.5" style={{ color: "#8a7a6a" }}>
              Read-only view of your submitted details.
            </p>
          </div>
        </div>
      </div>

      {verificationStatus === 'rejected' && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm font-medium">
              <AlertCircle className="w-5 h-5" />
              <span>This application was marked as <strong>Rejected</strong>. Reason: {(seniorData as any).rejectionReason || "No reason specified."}</span>
          </div>
      )}
      {verificationStatus === 'under_review' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm font-medium">
              <ShieldCheck className="w-5 h-5" />
              <span>Your profile is currently <strong>Under Review</strong> by the platform administrators.</span>
          </div>
      )}
      {verificationStatus === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm font-medium">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>Your profile is currently <strong>Pending</strong>. Our team will review your application shortly.</span>
          </div>
      )}

      {/* Main Container */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm" style={{ border: '1px solid #e0d8cf' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm" style={{ border: '2px solid #e0d8cf' }}>
                {currentPhoto ? (
                  <img src={currentPhoto} alt={fullName} className="w-full h-full object-cover" onError={() => setImgFallbackLevel(prev => prev + 1)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#4a3728' }}>
                    <span className="text-2xl font-bold text-white">{initials}</span>
                  </div>
                )}
              </div>
              {isApproved && (
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#4a3728', border: '2px solid #fff' }}>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <p className="text-xl font-black tracking-tight" style={{ color: "#4a3728" }}>
                {fullName || <EmptyValue />}
              </p>
              <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                   isApproved ? "bg-green-50 text-green-700 border border-green-200" :
                   verificationStatus === 'rejected' ? "bg-red-50 text-red-700 border border-red-200" :
                   verificationStatus === 'under_review' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                   "bg-gray-50 text-gray-700 border border-gray-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${
                    isApproved ? "bg-green-500" :
                    verificationStatus === 'rejected' ? "bg-red-500" :
                    verificationStatus === 'under_review' ? "bg-amber-500" : 
                    "bg-gray-400"
                  }`} />
                  {verificationStatus?.toUpperCase()?.replace("_", " ")}
                </span>
                <span className="text-sm font-semibold" style={{ color: '#7a5c3e' }}>
                    {currentRole} @ {currentCompany}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InfoTile label="Professional Experience">
            <div className="flex flex-col gap-1.5">
                <p className="text-[15px] font-bold" style={{ color: "#5a4535" }}>
                     {currentRole} at {currentCompany}
                </p>
                <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="px-2.5 py-1 bg-[#ece7e2] border border-[#e0d8cf] rounded-md text-[11px] font-black tracking-wide text-[#4a3728] shadow-sm">{experienceLevel?.toUpperCase()} LEVEL</span>
                    <span className="text-sm font-bold text-[#a08070]">{yearsOfExperience} Years Exp.</span>
                </div>
            </div>
          </InfoTile>

          <InfoTile label="Education">
            <p className="text-[15px] font-bold" style={{ color: "#5a4535" }}>
              {degree} in {fieldOfStudy}
            </p>
            <p className="text-sm font-semibold text-[#a08070] mt-1.5">{college} <span className="text-[#c0b0a0]">({graduationYear})</span></p>
          </InfoTile>
          
          <InfoTile label="Primary Expertise">
             {primaryExpertise ? (
                <span className="inline-flex px-3.5 py-1.5 bg-[#4a3728] shadow-sm text-white rounded-full text-xs font-bold uppercase tracking-wide">
                  {primaryExpertise.replace(/_/g, " ")}
                </span>
             ) : <EmptyValue />}
          </InfoTile>
          
          <InfoTile label="Mentorship Help Areas">
            {helpAreas?.length ? (
                <div className="flex flex-wrap gap-2 mt-1">
                    {helpAreas.map((h, i) => (
                        <span key={i} className="px-3 py-1.5 text-xs font-bold border border-[#d0c4b5] rounded-full bg-white shadow-sm" style={{ color: "#5a4535" }}>
                            {h.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                    ))}
                </div>
            ) : <EmptyValue />}
          </InfoTile>

          <InfoTile label="Technologies" full>
            {technologies?.length ? (
                <div className="flex flex-wrap gap-2">
                    {technologies.map((t, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white border border-[#e0d8cf] text-[#4a3728] rounded-full text-xs font-bold shadow-sm">{t}</span>
                    ))}
                </div>
            ) : <EmptyValue />}
          </InfoTile>
          
          <InfoTile label="Other Skills" full>
            {otherSkills?.length ? (
                <div className="flex flex-wrap gap-2">
                    {otherSkills.map((s, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white border border-[#e0d8cf] text-[#4a3728] rounded-full text-xs font-bold shadow-sm">{s}</span>
                    ))}
                </div>
            ) : <EmptyValue />}
          </InfoTile>
          
          <InfoTile label="Short Bio" full>
            <p className="text-sm leading-relaxed font-medium" style={{ color: "#5a4535" }}>
                {shortBio || <EmptyValue />}
            </p>
          </InfoTile>
          
          <InfoTile label="Motivation for Mentoring" full>
            <p className="text-sm leading-relaxed font-medium" style={{ color: "#5a4535" }}>
                {motivation || <EmptyValue />}
            </p>
          </InfoTile>
          
          <InfoTile label="Advice to Junior Self" full>
            <p className="text-sm leading-relaxed font-medium" style={{ color: "#5a4535" }}>
                {adviceToJuniorSelf || <EmptyValue />}
            </p>
          </InfoTile>

          <InfoTile label="Achievements" full>
            {achievements?.length ? (
                <ul className="list-disc pl-5 mt-1 space-y-1.5">
                    {achievements.map((a, i) => (
                        <li key={i} className="text-sm font-medium" style={{ color: "#5a4535" }}>{a}</li>
                    ))}
                </ul>
            ) : <EmptyValue />}
          </InfoTile>
          
          <InfoTile label="Certifications" full>
            {certifications?.length ? (
                <ul className="list-disc pl-5 mt-1 space-y-1.5">
                    {certifications.map((c, i) => (
                        <li key={i} className="text-sm font-medium" style={{ color: "#5a4535" }}>{c}</li>
                    ))}
                </ul>
            ) : <EmptyValue />}
          </InfoTile>
          
          <InfoTile label="Professional Resource Links" full>
            <div className="flex flex-wrap gap-3 mt-1.5">
                {linkedinUrl && (
                    <a href={linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white border border-[#d0c4b5] rounded-lg shadow-sm text-sm font-bold text-[#4a3728] hover:bg-[#f3ece4] transition-colors focus:ring-2 focus:ring-[#4a3728] outline-none">
                        <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                )}
                {githubUrl && (
                    <a href={githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white border border-[#d0c4b5] rounded-lg shadow-sm text-sm font-bold text-[#4a3728] hover:bg-[#f3ece4] transition-colors focus:ring-2 focus:ring-[#4a3728] outline-none">
                        GitHub
                    </a>
                )}
                {portfolioUrl && (
                    <a href={portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white border border-[#d0c4b5] rounded-lg shadow-sm text-sm font-bold text-[#4a3728] hover:bg-[#f3ece4] transition-colors focus:ring-2 focus:ring-[#4a3728] outline-none">
                        Portfolio
                    </a>
                )}
                {resumeUrl && (
                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white border border-[#d0c4b5] rounded-lg shadow-sm text-sm font-bold text-[#4a3728] hover:bg-[#f3ece4] transition-colors focus:ring-2 focus:ring-[#4a3728] outline-none">
                        <FileText className="w-4 h-4" /> Resume PDF
                    </a>
                )}
                {proofDocumentUrl && (
                    <a href={proofDocumentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white border border-[#d0c4b5] rounded-lg shadow-sm text-sm font-bold text-[#4a3728] hover:bg-[#f3ece4] transition-colors focus:ring-2 focus:ring-[#4a3728] outline-none">
                        <FileText className="w-4 h-4" /> Proof Document
                    </a>
                )}
            </div>
          </InfoTile>

        </div>
      </div>
    </div>
  );
}
