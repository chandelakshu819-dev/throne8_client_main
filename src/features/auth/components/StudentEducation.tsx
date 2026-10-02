'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentEducationSchema, StudentEducationFormData } from '../schema';
import PickerModal from './PickerModal';

const VALID_DEGREES = [
  'B.Tech', 'B.E', 'B.Sc', 'BCA', 'B.Com', 'B.A', 'M.Tech', 'M.E', 'M.Sc', 'MCA', 'M.Com', 'M.A', 'MBA', 'PhD', 'Diploma', 'Other'
];

const VALID_FIELDS = [
  'Computer Science', 'Information Technology', 'Electronics', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Aerospace', 'Automobile', 'Data Science', 'Artificial Intelligence', 'Machine Learning', 'Cyber Security', 'Business Administration', 'Finance', 'Marketing', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Other'
];

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function StudentEducation({ onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<StudentEducationFormData>({
    resolver: zodResolver(studentEducationSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const degreeValue = watch('degree') || '';
  const fieldOfStudyValue = watch('fieldOfStudy') || '';

  const onSubmit = async (data: StudentEducationFormData) => {
    try {
      await onNext({
        collegeName: data.collegeName,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        graduationYear: data.graduationYear,
      });
    } catch (err) {
      console.error('Error submitting student education:', err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div>
        <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#4a3728] to-[#8b7355] mb-6">
          Education
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">College/School Name</label>
            <input
              {...register('collegeName')}
              type="text"
              placeholder="e.g. IIT Bombay, Delhi University"
              className={`w-full text-black px-5 py-4 rounded-xl border ${errors.collegeName ? 'border-red-500' : 'border-[#4a3728]'
                } focus:outline-none focus:ring-2 ${errors.collegeName ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                } transition`}
            />
            {errors.collegeName && (
              <p className="text-red-500 text-sm mt-2">• {errors.collegeName.message}</p>
            )}
          </div>

          <PickerModal
            label="Degree"
            placeholder="Select Degree (e.g. B.Tech, MCA)"
            options={VALID_DEGREES}
            value={degreeValue}
            onChange={(val) => setValue('degree', val, { shouldValidate: true })}
            error={errors.degree?.message}
          />

          <PickerModal
            label="Field of Study"
            placeholder="Select Field of Study (e.g. Computer Science)"
            options={VALID_FIELDS}
            value={fieldOfStudyValue}
            onChange={(val) => setValue('fieldOfStudy', val, { shouldValidate: true })}
            error={errors.fieldOfStudy?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
            <input
              {...register('graduationYear')}
              type="text"
              placeholder="e.g. 2025"
              maxLength={4}
              className={`w-full text-black px-5 py-4 rounded-xl border ${errors.graduationYear ? 'border-red-500' : 'border-[#4a3728]'
                } focus:outline-none focus:ring-2 ${errors.graduationYear ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                } transition`}
            />
            {errors.graduationYear && (
              <p className="text-red-500 text-sm mt-2">• {errors.graduationYear.message}</p>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-8 py-4 border border-gray-300 bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white rounded-xl font-semibold hover:bg-gray-50 transition"
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