'use client';

import { useState } from 'react';
import {availableSkills} from '../data';


interface Props {
  onNext: (data: { skills: string[] }) => void;
  onBack: () => void;
  initialSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  submitting: boolean;
}

export default function Skills({
  onNext, onBack, initialSkills, onSkillsChange, submitting,
}: Props) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialSkills);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredSkills = availableSkills.filter(skill =>
    skill.toLowerCase().includes(inputValue.toLowerCase()) &&
    !selectedSkills.includes(skill)
  );

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      const nextSkills = [...selectedSkills, skill];
      setSelectedSkills(nextSkills);
      onSkillsChange(nextSkills);
    }
    setInputValue('');
    setIsOpen(false);
  };

  const removeSkill = (skill: string) => {
    const nextSkills = selectedSkills.filter(s => s !== skill);
    setSelectedSkills(nextSkills);
    onSkillsChange(nextSkills);
  };

  const handleContinue = () => {
    onNext({ skills: selectedSkills });
  };

  const handleSkip = () => {
    onSkillsChange([]);
    onNext({ skills: [] });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-10">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#4a3728] to-[#8b7355]">
            Your Skills
          </h2>
          <p className="text-gray-600 mt-4 text-base">
            Add relevant skills to strengthen your profile <span className="text-gray-500">(optional)</span>
          </p>
        </div>

        {/* Searchable Input Field - same tall size */}
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Type to search or add skills..."
            className={`
              w-full px-6 rounded-2xl border-2 transition-all duration-300
              bg-white shadow-md hover:shadow-lg focus:outline-none
              py-7 text-2xl font-medium text-gray-900 placeholder-gray-400
              ${isOpen || inputValue 
                ? 'border-[#4a3728] ring-4 ring-[#4a3728]/10' 
                : 'border-gray-300'
              }
            `}
          />

          {/* Dropdown Suggestions */}
          {isOpen && inputValue && filteredSkills.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white border-2 border-[#4a3728] rounded-2xl shadow-2xl overflow-hidden z-30">
              <div className="max-h-72 overflow-y-auto">
                {filteredSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => addSkill(skill)}
                    className="w-full px-6 py-4 text-left hover:bg-[#4a3728]/5 transition-all text-gray-900 font-medium"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Skills Tags */}
        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {selectedSkills.map((skill) => (
              <span
                key={skill}
                className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white rounded-full font-medium shadow-lg"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition"
                >
                  <span className="text-white text-lg leading-none">×</span>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-8">
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-4 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Back
          </button>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSkip}
              disabled={submitting}
              className="px-7 py-4 rounded-xl font-medium text-[#4a3728] hover:bg-[#4a3728]/5 transition"
            >
              Skip
            </button>

            <button
              type="button"
              onClick={handleContinue}
              disabled={submitting}
              className="px-10 py-4 bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}