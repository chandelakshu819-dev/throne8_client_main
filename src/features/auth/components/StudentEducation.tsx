'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentEducationSchema, StudentEducationFormData } from '../schema';
import PickerModal from './PickerModal';
import CollegeAutocomplete from './CollegeAutocomplete';

const VALID_DEGREES = [
  'B.Tech', 'B.E', 'B.Sc', 'BCA', 'B.Com', 'B.A', 'BBA', 'B.Pharm', 'B.Arch', 'LLB', 'MBBS',
  'M.Tech', 'M.E', 'M.Sc', 'MCA', 'M.Com', 'M.A', 'MBA', 'M.Pharm', 'LLM', 'PhD', 'Diploma', 'Other'
];

const VALID_FIELDS = [
  // B.Tech / B.E branches
  'Computer Science and Engineering',
  'Computer Science',
  'Information Technology',
  'Artificial Intelligence and Data Science',
  'Artificial Intelligence and Machine Learning',
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Cyber Security',
  'Internet of Things (IoT)',
  'Cloud Computing',
  'Blockchain Technology',
  'Software Engineering',
  'Computer Engineering',
  'Computer Science and Business Systems',
  'Electronics and Communication Engineering',
  'Electronics and Instrumentation Engineering',
  'Electronics and Telecommunication Engineering',
  'Electronics',
  'Electrical Engineering',
  'Electrical and Electronics Engineering',
  'Instrumentation and Control Engineering',
  'Mechanical Engineering',
  'Mechatronics',
  'Robotics and Automation',
  'Automobile Engineering',
  'Production Engineering',
  'Industrial Engineering',
  'Civil Engineering',
  'Structural Engineering',
  'Construction Technology',
  'Environmental Engineering',
  'Chemical Engineering',
  'Petroleum Engineering',
  'Mining Engineering',
  'Metallurgical Engineering',
  'Aerospace Engineering',
  'Aeronautical Engineering',
  'Biotechnology',
  'Biomedical Engineering',
  'Food Technology',
  'Agricultural Engineering',
  'Textile Engineering',
  'Marine Engineering',
  'Architecture',
  // Others
  'Business Administration',
  'Finance',
  'Marketing',
  'Human Resources',
  'Commerce',
  'Economics',
  'Mathematics',
  'Statistics',
  'Physics',
  'Chemistry',
  'Biology',
  'Pharmacy',
  'Law',
  'Medicine',
  'Other',
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
    control,
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
            <label htmlFor="collegeName" className="block text-sm font-medium text-gray-700 mb-2">
              College/School Name
            </label>
            <Controller
              name="collegeName"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <CollegeAutocomplete
                  id="collegeName"
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="e.g. IIT Bombay, LNCT Bhopal, MANIT"
                  className={`w-full text-black px-5 py-4 rounded-xl border ${errors.collegeName ? 'border-red-500' : 'border-[#4a3728]'
                    } focus:outline-none focus:ring-2 ${errors.collegeName ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                    } transition`}
                />
              )}
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