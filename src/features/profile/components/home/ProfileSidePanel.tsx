// src/profile/components/ProfileSidePanel.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface ProfileSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  profileImage: string;
  userName: string;
  currentUserId?: string;
  onOpenLeftPanel?: () => void;
}

const ProfileSidePanel: React.FC<ProfileSidePanelProps> = ({
  isOpen,
  onClose,
  profileImage,
  userName,
  currentUserId,
  onOpenLeftPanel,
}) => {
  const router = useRouter();

  // ✅ FIX: ab empty-string check ke saath — pehle seedha profileImage
  // src mein chala jaata tha, aur ye <img> hamesha DOM mein mounted
  // rehta hai (sirf CSS translate se panel hide hota hai, unmount nahi
  // hota), isliye page load pe hi "empty string passed to src" warning
  // aati thi jab tak profile data load na ho jaaye.
  const hasProfileImage = !!(profileImage && profileImage.trim() !== '');

  const handleViewFullProfile = () => {
    if (onOpenLeftPanel) {
      // On mobile dashboard, open the left sidebar panel
      onOpenLeftPanel();
    } else {
      // On other pages, navigate to profile
      onClose();
      router.push(`/profile`);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide Panel - 85% width on mobile */}
      <div
        className={`fixed top-0 right-0 h-full bg-[#f6ede8] shadow-2xl z-50 transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '85%' }}
      >
        {/* Close Button */}
        <div className="flex justify-between items-center p-4 border-b border-[#e0d8cf]">
          <h2 className="text-lg font-semibold text-[#4a3728]">Profile</h2>
          <button
            onClick={onClose}
            className="text-[#4a3728] hover:bg-[#e0d8cf] rounded-lg p-2 transition-colors duration-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Profile Card Content */}
        <div className="p-6 space-y-6">
          {/* Profile Image and Name */}
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={handleViewFullProfile}
              className="transform transition-transform hover:scale-105"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#4a3728] shadow-lg flex-shrink-0 bg-[#4a3728] flex items-center justify-center">
                {hasProfileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=4a3728&color=fff&size=128`;
                    }}
                  />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=4a3728&color=fff&size=128`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </button>

            <button
              onClick={handleViewFullProfile}
              className="text-center hover:text-[#7a5c3e] transition-colors duration-300"
            >
              <h3 className="text-xl font-bold text-[#4a3728]">{userName}</h3>
              <p className="text-sm text-[#8b6f47] mt-1">View Full Profile →</p>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3 pt-6 border-t border-[#e0d8cf]">
            <button
              onClick={handleViewFullProfile}
              className="w-full px-4 py-3 bg-[#4a3728] text-[#f6ede8] rounded-lg font-medium hover:bg-[#6b5643] transition-colors duration-300"
            >
              View Full Profile
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-3 text-[#4a3728] border-2 border-[#4a3728] rounded-lg font-medium hover:bg-[#e0d8cf] transition-colors duration-300"
            >
              Close
            </button>
          </div>

          {/* Info Section */}
          <div className="pt-6 border-t border-[#e0d8cf] text-center">
            <p className="text-xs text-[#8b6f47]">
              Click on your profile picture or name to view your complete profile information
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSidePanel;