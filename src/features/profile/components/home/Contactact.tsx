'use client';

import React, { useState } from 'react';
import ContactModal from './ContactModal';

interface ContactactProps {
  onSaved?: () => void;
}

const Contactact: React.FC<ContactactProps> = ({ onSaved }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="text-black font-bold underline cursor-pointer hover:text-[#4a3728] transition-colors duration-200"
      >
        Contact Information
      </div>
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={onSaved}
      />
    </>
  );
};

export default Contactact;