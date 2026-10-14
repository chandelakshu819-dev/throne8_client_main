'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { currentJobSchema, CurrentJobFormData } from '../schema';
import SearchableCombobox from './SearchableCombobox';
import CompanyLogo from './CompanyLogo';
import { COMPANIES, JOB_TITLES } from '../data/jobData';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function CurrentJob({ onNext, onBack }: Props) {
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<CurrentJobFormData>({
    resolver: zodResolver(currentJobSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const isFormValid = isValid && (isCurrentlyWorking || endDate);

  const handleStatusChange = (working: boolean) => {
    setIsCurrentlyWorking(working);
    if (working) {
      setValue('endDate', '', { shouldValidate: true });
    }
  };

  const onSubmit = (data: CurrentJobFormData) => {
    if (!isCurrentlyWorking && !data.endDate) {
      return;
    }

    onNext({
      jobTitle: data.jobTitle,
      companyName: data.companyName,
      startDate: data.startDate,
      endDate: isCurrentlyWorking ? null : data.endDate,
      isCurrentlyWorking: isCurrentlyWorking
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
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={JOB_TITLES}
                  placeholder="e.g. Software Engineer"
                  className={`w-full px-5 py-4 rounded-xl border ${errors.jobTitle ? 'border-red-500' : 'border-[#4a3728]'
                    } bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.jobTitle ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                    } transition`}
                />
              )}
            />
            {errors.jobTitle && (
              <p className="text-red-500 text-sm mt-2">• {errors.jobTitle.message}</p>
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
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={COMPANIES}
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
                    } ${errors.companyName ? 'border-red-500' : 'border-[#4a3728]'
                    } bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.companyName ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                    } transition`}
                />
              )}
            />
            {errors.companyName && (
              <p className="text-red-500 text-sm mt-2">• {errors.companyName.message}</p>
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
                {...register('startDate')}
                type="date"
                className={`w-full px-5 py-4 rounded-xl border ${errors.startDate ? 'border-red-500' : 'border-[#4a3728]'
                  } bg-white text-black focus:outline-none focus:ring-2 ${errors.startDate ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                  } transition`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-2">• {errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date {!isCurrentlyWorking && '*'}
              </label>
              <input
                {...register('endDate')}
                type="date"
                min={startDate}
                disabled={isCurrentlyWorking}
                className={`w-full px-5 py-4 rounded-xl border ${errors.endDate ? 'border-red-500' : 'border-[#4a3728]'
                  } bg-white text-black focus:outline-none focus:ring-2 ${errors.endDate ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                  } transition ${isCurrentlyWorking ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                  }`}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-2">• {errors.endDate.message}</p>
              )}
              {!errors.endDate && isCurrentlyWorking && (
                <p className="text-gray-500 text-xs mt-2">Disabled for currently working</p>
              )}
              {!errors.endDate && !isCurrentlyWorking && (
                <p className="text-gray-500 text-xs mt-2">End date is required for completed jobs</p>
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
              onClick={handleSubmit(onSubmit)}
              disabled={!isFormValid}
              className={`
                px-8 py-4 rounded-xl font-semibold transition shadow-lg
                ${isFormValid
                  ? 'bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white hover:opacity-90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
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