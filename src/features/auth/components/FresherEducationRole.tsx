'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { FresherEducationFormData, fresherEducationSchema } from '../schema';
import PickerModal from './PickerModal';
import { RegistrationData } from '../interface';

const VALID_EDUCATION_LEVELS = [
  '10th Pass', '12th Pass', 'Diploma', 'B.Tech', 'B.E', 'B.Sc', 'BCA', 'B.Com', 'B.A', 'M.Tech', 'M.Sc', 'MCA', 'MBA', 'Other'
];

const VALID_JOB_ROLES = [
  'Software Developer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile App Developer', 'Data Analyst', 'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer', 'Quality Assurance Engineer', 'UI/UX Designer', 'Product Manager', 'Business Analyst', 'Digital Marketing', 'Content Writer', 'Sales Executive', 'Customer Support', 'HR Recruiter', 'Other'
];

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: Partial<RegistrationData>;
  onDataChange?: (data: Partial<RegistrationData>) => void;
  serverErrors?: Record<string, string>;
  onClearServerError?: (field: string) => void;
}

export default function FresherEducationRole({
  onNext, onBack, initialData = {}, onDataChange = () => {}, serverErrors = {}, onClearServerError = () => {},
}: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FresherEducationFormData>({
    resolver: zodResolver(fresherEducationSchema),
    defaultValues: {
      highestEducation: initialData.highestEducation || '',
      preferredRole: initialData.preferredRole || '',
      cgpa: initialData.cgpa || '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const educationValue = watch('highestEducation') || '';
  const roleValue = watch('preferredRole') || '';
  const cgpa = watch('cgpa') || '';

  useEffect(() => {
    onDataChange({ highestEducation: educationValue, preferredRole: roleValue, cgpa });
  }, [educationValue, roleValue, cgpa, onDataChange]);

  const handleInvalid = () => {
    window.requestAnimationFrame(() => {
      const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid?.focus();
    });
  };

  const onSubmit = async (data: FresherEducationFormData) => {
    try {
      await onNext({
        highestEducation: data.highestEducation,
        preferredRole: data.preferredRole,
        cgpa: data.cgpa || null,
      });
    } catch (err) {
      console.error('Error submitting fresher education:', err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div>
        <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#4a3728] to-[#8b7355] mb-6">
          Education & Role
        </h2>

        <form onSubmit={handleSubmit(onSubmit, handleInvalid)} className="space-y-4" noValidate>
          <PickerModal
            id="signup-highest-education"
            label="Highest Education"
            placeholder="Select Education Level (e.g. B.Tech)"
            options={VALID_EDUCATION_LEVELS}
            value={educationValue}
            onChange={(val) => {
              setValue('highestEducation', val, { shouldValidate: true, shouldTouch: true });
              onClearServerError('highestEducation');
            }}
            error={errors.highestEducation?.message || serverErrors.highestEducation}
          />

          <PickerModal
            id="signup-preferred-role"
            label="Preferred Job Role"
            placeholder="Select Preferred Role (e.g. Software Developer)"
            options={VALID_JOB_ROLES}
            value={roleValue}
            onChange={(val) => {
              setValue('preferredRole', val, { shouldValidate: true, shouldTouch: true });
              onClearServerError('preferredRole');
            }}
            error={errors.preferredRole?.message || serverErrors.preferredRole}
          />

          <div>
            <label htmlFor="signup-cgpa" className="block text-sm font-medium text-gray-700 mb-2">
              CGPA (optional)
            </label>
            <input
              {...register('cgpa', { onChange: () => onClearServerError('cgpa') })}
              id="signup-cgpa"
              type="text"
              placeholder="e.g. 8.5"
              aria-invalid={!!errors.cgpa || !!serverErrors.cgpa}
              aria-describedby={errors.cgpa || serverErrors.cgpa ? 'signup-cgpa-error' : undefined}
              className={`w-full px-5 py-4 text-black rounded-xl border ${errors.cgpa ? 'border-red-500' : 'border-[#4a3728]'
                } focus:outline-none focus:ring-2 ${errors.cgpa ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                } transition`}
            />
            {errors.cgpa && (
              <p id="signup-cgpa-error" role="alert" className="text-red-500 text-sm mt-2">• {errors.cgpa.message}</p>
            )}
            {!errors.cgpa && serverErrors.cgpa && <p id="signup-cgpa-error" role="alert" className="text-red-500 text-sm mt-2">{serverErrors.cgpa}</p>}
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-8 py-4 bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              type="submit"
              className={`px-8 py-4 rounded-xl font-semibold transition shadow-lg
                bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white hover:opacity-90
              `}
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}