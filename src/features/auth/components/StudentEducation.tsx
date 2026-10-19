'use client';

import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentEducationSchema, StudentEducationFormData } from '../schema';
import PickerModal from './PickerModal';
import CollegeAutocomplete from './CollegeAutocomplete';
import { RegistrationData } from '../interface';

const VALID_DEGREES = [
  'B.Tech',
  'B.E',
  'B.Sc',
  'BCA',
  'B.Com',
  'B.A',
  'M.Tech',
  'M.E',
  'M.Sc',
  'MCA',
  'M.Com',
  'M.A',
  'MBA',
  'PhD',
  'Diploma',
  'Other',
];

const VALID_FIELDS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
  'Chemical',
  'Biotechnology',
  'Aerospace',
  'Automobile',
  'Data Science',
  'Artificial Intelligence',
  'Machine Learning',
  'Cyber Security',
  'Business Administration',
  'Finance',
  'Marketing',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Other',
];

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: Partial<RegistrationData>;
  onDataChange?: (data: Partial<RegistrationData>) => void;
  serverErrors?: Record<string, string>;
  onClearServerError?: (field: string) => void;
}

export default function StudentEducation({
  onNext, onBack, initialData = {}, onDataChange = () => {}, serverErrors = {}, onClearServerError = () => {},
}: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<StudentEducationFormData>({
    resolver: zodResolver(studentEducationSchema),
    defaultValues: {
      collegeName: initialData.collegeName || '',
      degree: initialData.degree || '',
      fieldOfStudy: initialData.fieldOfStudy || '',
      graduationYear: initialData.graduationYear || '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const degreeValue = watch('degree') || '';
  const fieldOfStudyValue = watch('fieldOfStudy') || '';
  const collegeName = watch('collegeName') || '';
  const graduationYear = watch('graduationYear') || '';

  useEffect(() => {
    onDataChange({ collegeName, degree: degreeValue, fieldOfStudy: fieldOfStudyValue, graduationYear });
  }, [collegeName, degreeValue, fieldOfStudyValue, graduationYear, onDataChange]);

  const handleInvalid = () => {
    window.requestAnimationFrame(() => {
      const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid?.focus();
    });
  };

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

        <form onSubmit={handleSubmit(onSubmit, handleInvalid)} className="space-y-4" noValidate>
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
                  onChange={(value) => {
                    field.onChange(value);
                    onClearServerError('collegeName');
                  }}
                  onBlur={field.onBlur}
                  ariaInvalid={!!errors.collegeName || !!serverErrors.collegeName}
                  ariaDescribedBy={errors.collegeName || serverErrors.collegeName ? 'signup-college-name-error' : undefined}
                  placeholder="e.g. IIT Bombay, LNCT Bhopal, MANIT"
                  className={`w-full text-black px-5 py-4 rounded-xl border ${errors.collegeName ? 'border-red-500' : 'border-[#4a3728]'
                    } focus:outline-none focus:ring-2 ${errors.collegeName ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                    } transition`}
                />
              )}
            />
            {(errors.collegeName?.message || serverErrors.collegeName) && (
              <p id="signup-college-name-error" role="alert" className="text-red-500 text-sm mt-2">• {errors.collegeName?.message || serverErrors.collegeName}</p>
            )}
          </div>

          <PickerModal
            id="signup-degree"
            label="Degree"
            placeholder="Select Degree (e.g. B.Tech, MCA)"
            options={VALID_DEGREES}
            value={degreeValue}
            onChange={(val) => {
              setValue('degree', val, { shouldValidate: true, shouldTouch: true });
              onClearServerError('degree');
            }}
            error={errors.degree?.message || serverErrors.degree}
          />

          <PickerModal
            id="signup-field-of-study"
            label="Field of Study"
            placeholder="Select Field of Study (e.g. Computer Science)"
            options={VALID_FIELDS}
            value={fieldOfStudyValue}
            onChange={(val) => {
              setValue('fieldOfStudy', val, { shouldValidate: true, shouldTouch: true });
              onClearServerError('fieldOfStudy');
            }}
            error={errors.fieldOfStudy?.message || serverErrors.fieldOfStudy}
          />

          <div>
            <label htmlFor="signup-graduation-year" className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
            <input
              {...register('graduationYear', { onChange: () => onClearServerError('graduationYear') })}
              id="signup-graduation-year"
              type="text"
              placeholder="e.g. 2025"
              maxLength={4}
              aria-invalid={!!errors.graduationYear || !!serverErrors.graduationYear}
              aria-describedby={errors.graduationYear || serverErrors.graduationYear ? 'signup-graduation-year-error' : undefined}
              className={`w-full text-black px-5 py-4 rounded-xl border ${errors.graduationYear ? 'border-red-500' : 'border-[#4a3728]'
                } focus:outline-none focus:ring-2 ${errors.graduationYear ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                } transition`}
            />
            {errors.graduationYear && (
              <p id="signup-graduation-year-error" role="alert" className="text-red-500 text-sm mt-2">• {errors.graduationYear.message}</p>
            )}
            {!errors.graduationYear && serverErrors.graduationYear && <p id="signup-graduation-year-error" role="alert" className="text-red-500 text-sm mt-2">{serverErrors.graduationYear}</p>}
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