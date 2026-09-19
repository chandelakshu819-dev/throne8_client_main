import React, { useState } from "react";
import { User, Briefcase } from "lucide-react";
import type { SeniorMentorApplication } from "@/lib/api/seniorMentorApplication.service";
import { useAppSelector } from "@/core/store/store.hooks";
import { useRouter } from "next/navigation";

interface SeniorMentorSidebarProps {
  application: SeniorMentorApplication;
  activeTab?: 'profile' | 'services';
}

export default function SeniorMentorSidebar({ application, activeTab = 'profile' }: SeniorMentorSidebarProps) {
  const router = useRouter();
  const { fullName, profilePhoto, currentRole, primaryExpertise } = application;
  const initials = fullName ? fullName[0] : "S";
  const [imgFallbackLevel, setImgFallbackLevel] = useState(0);
  const globalProfile = useAppSelector((state) => state.login.profile);
  
  const getPhotoForLevel = (level: number): string | null => {
    if (level === 0 && profilePhoto) return profilePhoto;
    if (level <= 1 && (globalProfile?.profilePic || globalProfile?.profilePhoto)) return globalProfile?.profilePic || globalProfile?.profilePhoto;
    return null;
  };
  const currentPhoto = getPhotoForLevel(imgFallbackLevel);

  const domain = (primaryExpertise?.replace(/_/g, " ") ?? "Senior Mentor")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return (
    <aside className="w-80 flex flex-col" style={{ backgroundColor: '#fff', borderRight: '1px solid #ece4db' }}>
      {/* Profile Card */}
      <div className="mx-6 mt-6 mb-3 p-6 rounded-3xl" style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}>
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 shadow-sm" style={{ border: '3px solid #e0d8cf' }}>
            {currentPhoto ? (
              <img src={currentPhoto} alt={fullName} className="w-full h-full object-cover" onError={() => setImgFallbackLevel(prev => prev + 1)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white" style={{ backgroundColor: '#4a3728' }}>
                {initials}
              </div>
            )}
          </div>

          <h2 className="text-xl font-black tracking-tight" style={{ color: '#4a3728' }}>{fullName}</h2>

          <span
            className="mt-2.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#e0d8cf] shadow-sm"
            style={{ backgroundColor: '#fff', color: '#7a5c3e' }}
          >
            {domain}
          </span>
          <span className="text-sm font-semibold mt-1.5" style={{ color: '#8a7a6a' }}>{currentRole}</span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-1">
            <button
            onClick={() => router.push(`/mentorship/senior-mentor-profile/${application.userId}`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-150"
            style={{
                backgroundColor: activeTab === 'profile' ? '#4a3728' : 'transparent',
                color: activeTab === 'profile' ? '#fff' : '#8a7a6a',
            }}
            >
            <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative transition-colors"
                style={{ backgroundColor: activeTab === 'profile' ? 'rgba(255,255,255,0.15)' : 'rgba(138,122,106,0.1)' }}
            >
                <User className="w-4 h-4" style={{ color: activeTab === 'profile' ? '#fff' : '#8a7a6a' }} />
            </span>
            <span className="flex-1 text-left">Profile</span>
            {activeTab === 'profile' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </button>

            <button
            onClick={() => router.push(`/mentorship/senior-mentor-profile/${application.userId}/services`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-150"
            style={{
                backgroundColor: activeTab === 'services' ? '#4a3728' : 'transparent',
                color: activeTab === 'services' ? '#fff' : '#8a7a6a',
            }}
            >
            <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative transition-colors"
                style={{ backgroundColor: activeTab === 'services' ? 'rgba(255,255,255,0.15)' : 'rgba(138,122,106,0.1)' }}
            >
                <Briefcase className="w-4 h-4" style={{ color: activeTab === 'services' ? '#fff' : '#8a7a6a' }} />
            </span>
            <span className="flex-1 text-left">Services</span>
            {activeTab === 'services' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </button>
        </div>
      </nav>
    </aside>
  );
}
