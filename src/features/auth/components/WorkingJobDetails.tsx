'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { currentJobSchema, CurrentJobFormData } from '../schema';
import SearchableCombobox from './SearchableCombobox';
import CompanyLogo from './CompanyLogo';
import { COMPANIES, JOB_TITLES } from '../data/jobData';
import { RegistrationData } from '../interface';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: Partial<RegistrationData>;
  onDataChange?: (data: Partial<RegistrationData>) => void;
  serverErrors?: Record<string, string>;
  onClearServerError?: (field: string) => void;
}

export default function CurrentJob({
  onNext, onBack, initialData = {}, onDataChange = () => {}, serverErrors = {}, onClearServerError = () => {},
}: Props) {
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(initialData.isCurrentlyWorking ?? !initialData.endDate);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CurrentJobFormData>({
    resolver: zodResolver(currentJobSchema),
    defaultValues: {
      jobTitle: initialData.jobTitle || '',
      companyName: initialData.companyName || '',
      startDate: initialData.startDate || '',
      endDate: initialData.endDate || '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const startDate = watch('startDate');
  const jobTitle = watch('jobTitle');
  const companyName = watch('companyName');
  const endDate = watch('endDate');

  useEffect(() => {
    onDataChange({ jobTitle, companyName, startDate, endDate: endDate || '', isCurrentlyWorking });
  }, [jobTitle, companyName, startDate, endDate, isCurrentlyWorking, onDataChange]);

  const handleStatusChange = (working: boolean) => {
    setIsCurrentlyWorking(working);
    if (working) {
      setValue('endDate', '', { shouldValidate: true });
    }
    onDataChange({ isCurrentlyWorking: working, ...(working ? { endDate: '' } : {}) });
  };

  const onSubmit = (data: CurrentJobFormData) => {
    onNext({
      jobTitle: data.jobTitle,
      companyName: data.companyName,
      startDate: data.startDate,
      endDate: isCurrentlyWorking ? '' : data.endDate || '',
      isCurrentlyWorking: isCurrentlyWorking
    });
  };
  const handleInvalid = () => {
    window.requestAnimationFrame(() => {
      const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid?.focus();
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-10">
        <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#4a3728] to-[#8b7355]">
          Current Job
        </h2>

        <div className="space-y-6">
          {/* Job Title (searchable) */}
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
            <Controller
              name="jobTitle"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <SearchableCombobox
                  id="jobTitle"
                  value={field.value ?? ''}
                  onChange={(value) => {
                    field.onChange(value);
                    onClearServerError('jobTitle');
                  }}
                  onBlur={field.onBlur}
                  options={JOB_TITLES}
                  placeholder="e.g. Software Engineer"
                  className={`w-full px-5 py-4 rounded-xl border ${errors.jobTitle || serverErrors.jobTitle ? 'border-red-500' : 'border-[#4a3728]'
                    } bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.jobTitle || serverErrors.jobTitle ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                    } transition`}
                  ariaInvalid={!!errors.jobTitle || !!serverErrors.jobTitle}
                  ariaDescribedBy={errors.jobTitle || serverErrors.jobTitle ? 'signup-job-title-error' : undefined}
                />
              )}
            />
            {(errors.jobTitle?.message || serverErrors.jobTitle) && (
              <p id="signup-job-title-error" role="alert" className="text-red-500 text-sm mt-2">• {errors.jobTitle?.message || serverErrors.jobTitle}</p>
            )}
          </div>

          {/* Company Name (searchable + logo) */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
            <Controller
              name="companyName"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <SearchableCombobox
                  id="companyName"
                  value={field.value ?? ''}
                  onChange={(value) => {
                    field.onChange(value);
                    onClearServerError('companyName');
                  }}
                  onBlur={field.onBlur}
                  options={COMPANIES}
                  allowCustomValue
                  placeholder="e.g. TCS, Infosys, Google"
                  leading={
                    field.value?.trim() ? <CompanyLogo name={field.value} size={26} /> : null
                  }
                  renderOption={(o) => (
                    <>
                      <CompanyLogo name={o} size={24} />
                      <span>{o}</span>
                    </>
                  )}
                  className={`w-full py-4 pr-5 rounded-xl border ${field.value?.trim() ? 'pl-14' : 'pl-5'
                    } ${errors.companyName || serverErrors.companyName ? 'border-red-500' : 'border-[#4a3728]'
                    } bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.companyName || serverErrors.companyName ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                    } transition`}
                  ariaInvalid={!!errors.companyName || !!serverErrors.companyName}
                  ariaDescribedBy={errors.companyName || serverErrors.companyName ? 'signup-company-name-error' : undefined}
                />
              )}
            />
            {(errors.companyName?.message || serverErrors.companyName) && (
              <p id="signup-company-name-error" role="alert" className="text-red-500 text-sm mt-2">• {errors.companyName?.message || serverErrors.companyName}</p>
            )}
          </div>

          {/* Employment Status Radio Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Employment Status *</label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    checked={isCurrentlyWorking}
                    onChange={() => handleStatusChange(true)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${isCurrentlyWorking
                      ? 'border-[#4a3728] bg-[#4a3728]'
                      : 'border-gray-300 bg-white'
                    }`}>
                    {isCurrentlyWorking && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <span className={`ml-3 text-sm font-medium transition ${isCurrentlyWorking ? 'text-[#4a3728]' : 'text-gray-600'
                  }`}>
                  Currently Working (Present)
                </span>
              </label>

              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    checked={!isCurrentlyWorking}
                    onChange={() => handleStatusChange(false)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${!isCurrentlyWorking
                      ? 'border-[#4a3728] bg-[#4a3728]'
                      : 'border-gray-300 bg-white'
                    }`}>
                    {!isCurrentlyWorking && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <span className={`ml-3 text-sm font-medium transition ${!isCurrentlyWorking ? 'text-[#4a3728]' : 'text-gray-600'
                  }`}>
                  Completed
                </span>
              </label>
            </div>
          </div>

          {/* Start & End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                {...register('startDate', { onChange: () => onClearServerError('startDate') })}
                id="signup-start-date"
                type="date"
                aria-invalid={!!errors.startDate || !!serverErrors.startDate}
                aria-describedby={errors.startDate || serverErrors.startDate ? 'signup-start-date-error' : undefined}
                className={`w-full px-5 py-4 rounded-xl border ${errors.startDate || serverErrors.startDate ? 'border-red-500' : 'border-[#4a3728]'
                  } bg-white text-black focus:outline-none focus:ring-2 ${errors.startDate || serverErrors.startDate ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                  } transition`}
              />
              {errors.startDate && (
                <p id="signup-start-date-error" role="alert" className="text-red-500 text-sm mt-2">• {errors.startDate.message}</p>
              )}
              {!errors.startDate && serverErrors.startDate && <p id="signup-start-date-error" role="alert" className="text-red-500 text-sm mt-2">{serverErrors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date {!isCurrentlyWorking && '*'}
              </label>
              <input
                {...register('endDate', { onChange: () => onClearServerError('endDate') })}
                id="signup-end-date"
                type="date"
                min={startDate}
                disabled={isCurrentlyWorking}
                aria-invalid={!!errors.endDate || !!serverErrors.endDate}
                aria-describedby={errors.endDate || serverErrors.endDate ? 'signup-end-date-error' : undefined}
                className={`w-full px-5 py-4 rounded-xl border ${errors.endDate || serverErrors.endDate ? 'border-red-500' : 'border-[#4a3728]'
                  } bg-white text-black focus:outline-none focus:ring-2 ${errors.endDate || serverErrors.endDate ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                  } transition ${isCurrentlyWorking ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                  }`}
              />
              {errors.endDate && (
                <p id="signup-end-date-error" role="alert" className="text-red-500 text-sm mt-2">• {errors.endDate.message}</p>
              )}
              {!errors.endDate && serverErrors.endDate && <p id="signup-end-date-error" role="alert" className="text-red-500 text-sm mt-2">{serverErrors.endDate}</p>}
              {!errors.endDate && isCurrentlyWorking && (
                <p className="text-gray-500 text-xs mt-2">Disabled for currently working</p>
              )}
              {!errors.endDate && !isCurrentlyWorking && (
                <p className="text-gray-500 text-xs mt-2">End date is optional; if entered, it must be at least one month after the start date.</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-8 py-4 bg-white text-[#4a3728] font-semibold border-2 border-[#4a3728] rounded-xl hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit, handleInvalid)}
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
    </div>
  );
}