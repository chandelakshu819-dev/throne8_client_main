//  src/app/(auth)/_components/CurrentStatus.tsx
'use client';

import { useEffect, useState } from 'react';
import {statuses} from '../data';
import { RegistrationData } from '../interface';
import { currentStatusSchema } from '../schema';



interface Props {
  onNext: (data: {
    status: string;        // ✅ For UI flow tracking
    userType: string;      // ✅ For server (same value)
  }) => void;
  onBack: () => void;
  initialData?: Partial<RegistrationData>;
  onDataChange?: (data: Partial<RegistrationData>) => void;
  serverError?: string;
  onClearServerError?: () => void;
}

export default function CurrentStatus({
  onNext, onBack, initialData = {}, onDataChange = () => {}, serverError, onClearServerError = () => {},
}: Props) {
  const [selected, setSelected] = useState<string | null>(initialData.userType || initialData.status || null);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (selected) onDataChange({ userType: selected, status: selected });
  }, [selected, onDataChange]);

  const handleNext = () => {
    setAttempted(true);
    const result = currentStatusSchema.safeParse({ userType: selected });
    if (!result.success) return;
    const userType = result.data.userType;

    // ✅ Send both fields (status for UI, userType for server)
    onNext({
      status: userType,      // For UI flow control
      userType              // For server validation (same value)
    });
  };

  const showError = (attempted && !selected) || !!serverError;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-3">
        <h2 id="signup-status-heading" className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#4a3728] to-[#8b7355]">
          Your Current Status
        </h2>

        <div
          className="space-y-4"
          role="group"
          aria-labelledby="signup-status-heading"
          aria-describedby={showError ? 'signup-user-type-error' : undefined}
        >
          {statuses.map((status) => (
            <button
              key={status.id}
              type="button"
              aria-pressed={selected === status.id}
              onClick={() => {
                setSelected(status.id);
                setAttempted(false);
                onClearServerError();
              }}
              className={`
                w-full p-6 rounded-2xl border-2 text-left transition-all shadow-sm
                ${selected === status.id
                  ? 'border-[#4a3728] bg-[#4a3728]/5 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{status.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{status.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {showError && (
          <p id="signup-user-type-error" role="alert" className="text-red-500 text-sm" aria-live="polite">
            {serverError || 'Choose your current status to continue.'}
          </p>
        )}

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-4 bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white border font-semibold border-gray-300 rounded-xl hover:bg-gray-50 transition"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className={`
              px-8 py-4 rounded-xl font-semibold transition shadow-lg
              bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white hover:opacity-90
            `}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}