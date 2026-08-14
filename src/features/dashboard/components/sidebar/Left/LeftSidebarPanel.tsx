// src/features/dashboard/components/sidebar/Left/LeftSidebarPanel.tsx
'use client';
import React from 'react';
import { X } from 'lucide-react';
import ProfileCard from './ProfileCard';
import CompanyCard from './CompanyCard';
import MyGroups from './MyGroups';

interface LeftSidebarPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  isDarkMode: boolean;
}

const LeftSidebarPanel: React.FC<LeftSidebarPanelProps> = ({
  isOpen,
  onClose,
  currentUserId,
  isDarkMode,
}) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide Panel - 85% width on mobile, slides from left */}
      <div
        className={`fixed top-0 left-0 h-full bg-[#e0d8cf] shadow-2xl z-50 transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '85%', marginTop: '64px', maxHeight: 'calc(100vh - 64px)' }}
      >
        {/* Close Button */}
        <div className="flex justify-between items-center p-4 border-b border-[#d9d1c8] sticky top-0 bg-[#e0d8cf]">
          <h2 className="text-lg font-semibold text-[#4a3728]">Profile</h2>
          <button
            onClick={onClose}
            className="text-[#4a3728] hover:bg-[#f6ede8] rounded-lg p-2 transition-colors duration-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Sidebar Content */}

        
        <div className="p-4 space-y-6">
          <ProfileCard currentUserId={currentUserId || ''} isDarkMode={isDarkMode} />
          {/* <CompanyCard isDarkMode={isDarkMode} />
          <MyGroups isDarkMode={isDarkMode} /> */}
        </div>
      </div>
    </>
  );
};

export default LeftSidebarPanel;
