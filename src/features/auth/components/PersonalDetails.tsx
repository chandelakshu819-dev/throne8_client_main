'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalDetailsSchema, PersonalDetailsFormData } from '../schema';
import { normalizePhone, phoneRule } from '../schema/rules';
import { RegistrationData } from '../interface';
import { useRegistrationAvailability } from '../hooks/useRegistrationAvailability';
import { canContinueAfterAvailabilityCheck } from '../hooks/registrationAvailability';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData: Partial<RegistrationData>;
  onDataChange: (data: Partial<RegistrationData>) => void;
  serverErrors: Record<string, string>;
  onClearServerError: (field: string) => void;
}

export default function PersonalDetails({
  onNext, onBack, initialData, onDataChange, serverErrors, onClearServerError,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      firstName: initialData.firstName || '',
      lastName: initialData.lastName || '',
      phone: initialData.phoneNumber || '',
      location: initialData.location || '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const phone = watch('phone');
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const location = watch('location');
  const parsedPhone = phoneRule.safeParse(phone || '');
  const canonicalPhone = parsedPhone.success ? parsedPhone.data : undefined;
  const { status: phoneAvailability, checkNow: checkPhoneNow } =
    useRegistrationAvailability('phone', canonicalPhone);

  useEffect(() => {
    onDataChange({
      firstName: firstName || '',
      lastName: lastName || '',
      phoneNumber: phone || '',
      location: location || '',
    });
  }, [firstName, lastName, phone, location, onDataChange]);

  const onSubmit = async (data: PersonalDetailsFormData) => {
    const normalizedPhone = normalizePhone(data.phone);
    const canContinue = await canContinueAfterAvailabilityCheck(
      () => checkPhoneNow(normalizedPhone)
    );
    if (!canContinue) return;
    onNext({
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: normalizedPhone,
      location: data.location,
    });
  };
  const phoneMessage = errors.phone?.message || serverErrors.phoneNumber;
  const phoneRegistration = register('phone', {
    onChange: () => {
      onClearServerError('phoneNumber');
    },
    onBlur: (event) => {
      const parsed = phoneRule.safeParse(event.currentTarget.value || '');
      if (parsed.success) void checkPhoneNow(parsed.data);
    },
  });
  const handleInvalid = () => {
    window.requestAnimationFrame(() => {
      const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid?.focus();
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-4 sm:space-y-5">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#4a3728] to-[#8b7355] leading-tight">
          Personal Details
        </h2>
        <form onSubmit={handleSubmit(onSubmit, handleInvalid)} className="space-y-5 sm:space-y-6 md:space-y-8" noValidate>
          <div className="grid grid-rows-1 md:grid-rows-2 gap-4 sm:gap-5 md:gap-6">
            <div>
              <label htmlFor="signup-first-name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">First Name</label>
              <input
                {...register('firstName', { onChange: () => onClearServerError('firstName') })}
                id="signup-first-name"
                type="text"
                placeholder="First Name"
                aria-invalid={!!errors.firstName || !!serverErrors.firstName}
                aria-describedby={errors.firstName || serverErrors.firstName ? 'signup-first-name-error' : undefined}
                className={`w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl text-[#4a3728] border text-sm ${errors.firstName ? 'border-red-500' : 'border-[#4a3728]'
                  } focus:outline-none focus:ring-2 ${errors.firstName ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                  } transition`}
              />
              {errors.firstName && (
                <p id="signup-first-name-error" role="alert" className="text-red-500 text-xs sm:text-sm mt-1.5">• {errors.firstName.message}</p>
              )}
              {!errors.firstName && serverErrors.firstName && <p id="signup-first-name-error" role="alert" className="text-red-500 text-xs sm:text-sm mt-1.5">{serverErrors.firstName}</p>}
            </div>

            <div>
              <label htmlFor="signup-last-name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Last Name</label>
              <input
                {...register('lastName', { onChange: () => onClearServerError('lastName') })}
                id="signup-last-name"
                type="text"
                placeholder="Last Name"
                aria-invalid={!!errors.lastName || !!serverErrors.lastName}
                aria-describedby={errors.lastName || serverErrors.lastName ? 'signup-last-name-error' : undefined}
                className={`w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl text-[#4a3728] border text-sm ${errors.lastName ? 'border-red-500' : 'border-[#4a3728]'
                  } focus:outline-none focus:ring-2 ${errors.lastName ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                  } transition`}
              />
              {errors.lastName && (
                <p id="signup-last-name-error" role="alert" className="text-red-500 text-xs sm:text-sm mt-1.5">• {errors.lastName.message}</p>
              )}
              {!errors.lastName && serverErrors.lastName && <p id="signup-last-name-error" role="alert" className="text-red-500 text-xs sm:text-sm mt-1.5">{serverErrors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            <div>
              <label htmlFor="signup-phone" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Phone</label>
              <input
                {...phoneRegistration}
                id="signup-phone"
                type="tel"
                placeholder="+91 98765 43210"
                aria-invalid={!!phoneMessage || phoneAvailability === 'taken'}
                aria-describedby={phoneMessage ? 'signup-phone-error' : phoneAvailability ? 'signup-phone-availability' : undefined}
                aria-required="true"
                className={`w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 text-black rounded-lg sm:rounded-xl border text-sm ${phoneMessage || phoneAvailability === 'taken' ? 'border-red-500' : 'border-[#4a3728]'
                  } focus:outline-none focus:ring-2 ${errors.phone ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                  } transition`}
              />
              {phoneMessage && (
                <p id="signup-phone-error" role="alert" className="text-red-500 text-xs sm:text-sm mt-1.5">• {phoneMessage}</p>
              )}
              {!phoneMessage && phoneAvailability && (
                <p id="signup-phone-availability" aria-live="polite" className={phoneAvailability === 'taken' ? 'text-red-500 text-xs mt-1.5' : 'text-gray-600 text-xs mt-1.5'}>
                  {phoneAvailability === 'checking' && 'Checking...'}
                  {phoneAvailability === 'available' && 'Phone number is available.'}
                  {phoneAvailability === 'taken' && 'This phone number is already registered.'}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="signup-location" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Location</label>
              <input
                {...register('location', { onChange: () => onClearServerError('location') })}
                id="signup-location"
                type="text"
                placeholder="Mumbai"
                aria-invalid={!!errors.location || !!serverErrors.location}
                aria-describedby={errors.location || serverErrors.location ? 'signup-location-error' : undefined}
                className={`w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 text-black rounded-lg sm:rounded-xl border text-sm ${errors.location ? 'border-red-500' : 'border-[#4a3728]'
                  } focus:outline-none focus:ring-2 ${errors.location ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                  } transition`}
              />
              {errors.location && (
                <p id="signup-location-error" role="alert" className="text-red-500 text-xs sm:text-sm mt-1.5">• {errors.location.message}</p>
              )}
              {!errors.location && serverErrors.location && <p id="signup-location-error" role="alert" className="text-red-500 text-xs sm:text-sm mt-1.5">{serverErrors.location}</p>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between pt-2 sm:pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white font-semibold border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 transition text-sm sm:text-base order-2 sm:order-1"
            >
              Back
            </button>
            <button 
              type="submit"
            disabled={phoneAvailability === 'taken' || !!serverErrors.phoneNumber}
              className={`px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-semibold transition shadow-lg text-sm sm:text-base order-1 sm:order-2
                ${phoneAvailability !== 'taken' && !serverErrors.phoneNumber
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