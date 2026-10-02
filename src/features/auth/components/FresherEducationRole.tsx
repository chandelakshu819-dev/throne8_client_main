'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FresherEducationFormData, fresherEducationSchema } from '../schema';
import PickerModal from './PickerModal';

const VALID_EDUCATION_LEVELS = [
  '10th Pass', '12th Pass', 'Diploma', 'B.Tech', 'B.E', 'B.Sc', 'BCA', 'B.Com', 'B.A', 'M.Tech', 'M.Sc', 'MCA', 'MBA', 'Other'
];

const VALID_JOB_ROLES = [
  'Software Developer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile App Developer', 'Data Analyst', 'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer', 'Quality Assurance Engineer', 'UI/UX Designer', 'Product Manager', 'Business Analyst', 'Digital Marketing', 'Content Writer', 'Sales Executive', 'Customer Support', 'HR Recruiter', 'Other'
];

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function FresherEducationRole({ onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FresherEducationFormData>({
    resolver: zodResolver(fresherEducationSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const educationValue = watch('highestEducation') || '';
  const roleValue = watch('preferredRole') || '';

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PickerModal
            label="Highest Education"
            placeholder="Select Education Level (e.g. B.Tech)"
            options={VALID_EDUCATION_LEVELS}
            value={educationValue}
            onChange={(val) => setValue('highestEducation', val, { shouldValidate: true })}
            error={errors.highestEducation?.message}
          />

          <PickerModal
            label="Preferred Job Role"
            placeholder="Select Preferred Role (e.g. Software Developer)"
            options={VALID_JOB_ROLES}
            value={roleValue}
            onChange={(val) => setValue('preferredRole', val, { shouldValidate: true })}
            error={errors.preferredRole?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CGPA (optional)
            </label>
            <input
              {...register('cgpa')}
              type="text"
              placeholder="e.g. 8.5"
              className={`w-full px-5 py-4 text-black rounded-xl border ${errors.cgpa ? 'border-red-500' : 'border-[#4a3728]'
                } focus:outline-none focus:ring-2 ${errors.cgpa ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                } transition`}
            />
            {errors.cgpa && (
              <p className="text-red-500 text-sm mt-2">• {errors.cgpa.message}</p>
            )}
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
              disabled={!isValid}
              className={`px-8 py-4 rounded-xl font-semibold transition shadow-lg
                ${isValid
                  ? 'bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white hover:opacity-90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
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