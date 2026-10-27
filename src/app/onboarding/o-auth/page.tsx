'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AuthService from '@/lib/api/auth.service';
import { useAppDispatch } from '@/core/store/store.hooks';
import { checkAuthStatus } from '@/hooks/auth';
import { HOME_PATH } from '@/config/launch';
import CurrentStatus from '@/features/auth/components/CurrentStatus';
import WorkingJobDetails from '@/features/auth/components/WorkingJobDetails';
import StudentEducation from '@/features/auth/components/StudentEducation';
import FresherEducationRole from '@/features/auth/components/FresherEducationRole';

const locationPhoneSchema = z.object({
    location: z
        .string()
        .min(2, { message: 'Location must be at least 2 characters' })
        .max(50)
        .regex(/^[A-Z][a-zA-Z\s\-]+$/, {
            message: 'Location must start with a capital letter',
        }),
    phoneNumber: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, {
            message: 'Invalid phone format (e.g., +919876543210)',
        })
        .optional()
        .or(z.literal('')),
});

type LocationPhoneData = z.infer<typeof locationPhoneSchema>;

function LocationPhoneStep({ onNext }: { onNext: (data: any) => void }) {
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<LocationPhoneData>({
        resolver: zodResolver(locationPhoneSchema),
        mode: 'onChange',
    });

    const onSubmit = (data: LocationPhoneData) => {
        onNext({
            location: data.location,
            phoneNumber: data.phoneNumber || '',
        });
    };

    return (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#4a3728] to-[#8b7355] mb-2">
                Almost there!
            </h2>
            <p className="text-center text-gray-500 mb-8 text-sm">
                Complete your profile to get started
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                    </label>
                    <input
                        {...register('location')}
                        type="text"
                        placeholder="Mumbai"
                        className={`w-full px-5 py-4 rounded-xl border text-black ${
                            errors.location ? 'border-red-500' : 'border-[#4a3728]'
                        } focus:outline-none focus:ring-2 focus:ring-[#4a3728] transition`}
                    />
                    {errors.location && (
                        <p className="text-red-500 text-sm mt-1">• {errors.location.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                        {...register('phoneNumber')}
                        type="tel"
                        placeholder="+919876543210"
                        className={`w-full px-5 py-4 rounded-xl border text-black ${
                            errors.phoneNumber ? 'border-red-500' : 'border-[#4a3728]'
                        } focus:outline-none focus:ring-2 focus:ring-[#4a3728] transition`}
                    />
                    {errors.phoneNumber && (
                        <p className="text-red-500 text-sm mt-1">• {errors.phoneNumber.message}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">Format: +919876543210</p>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={!isValid}
                        className={`px-8 py-4 rounded-xl font-semibold transition shadow-lg ${
                            isValid
                                ? 'bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white hover:opacity-90'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Next
                    </button>
                </div>
            </form>
        </div>
    );
}

/** Promise ko max `ms` tak hi wait karo, uske baad aage badho (reject nahi karta). */
const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T | undefined> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<undefined>((resolve) => {
                timer = setTimeout(() => resolve(undefined), ms);
            }),
        ]);
    } catch {
        return undefined;
    } finally {
        if (timer) clearTimeout(timer);
    }
};

export default function GoogleOnboardingPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const submittingRef = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const idToken = sessionStorage.getItem('google_id_token');
            if (!idToken) {
                setError('Google session not found. Please log in with Google again.');
            }
        }
    }, []);

    const saveAndNext = (stepData: any) => {
        setFormData((prev: any) => ({ ...prev, ...stepData }));
        setCurrentStep((prev) => prev + 1);
    };

    const goBack = () => setCurrentStep((prev) => prev - 1);

    const handleComplete = async (finalStepData: any) => {
        // Double click / double submit guard
        if (submittingRef.current) return;
        submittingRef.current = true;

        const allData = { ...formData, ...finalStepData };
        const userType = allData.userType || allData.status;

        setLoading(true);
        setError(null);

        try {
            const idToken =
                typeof window !== 'undefined' ? sessionStorage.getItem('google_id_token') : null;
            if (!idToken) {
                throw new Error(
                    'Google session expired or missing token. Please sign in with Google again.'
                );
            }

            const cleanData = {
                idToken,
                location: allData.location,
                phoneNumber: allData.phoneNumber || '',
                userType,
                skills: allData.skills || [],

                ...(userType === 'working' && {
                    jobTitle: allData.jobTitle,
                    companyName: allData.companyName,
                    startDate: allData.startDate,
                    endDate: allData.endDate || undefined,
                }),

                ...(userType === 'student' && {
                    collegeName: allData.collegeName,
                    degree: allData.degree,
                    fieldOfStudy: allData.fieldOfStudy,
                    graduationYear: allData.graduationYear,
                }),

                ...(userType === 'fresher' && {
                    highestEducation: allData.highestEducation,
                    preferredRole: allData.preferredRole,
                    cgpa: allData.cgpa || undefined,
                }),
            };

            // NOTE: idToken kabhi console me log mat karo
            await AuthService.googleRegister(cleanData);

            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('google_id_token');
            }

            // checkAuthStatus atke to bhi max 4s baad aage badho
            await withTimeout(Promise.resolve(dispatch(checkAuthStatus())), 4000);

            router.replace(HOME_PATH);

            // Safety net: 6s me page change na ho to hard redirect
            setTimeout(() => {
                if (typeof window !== 'undefined' && window.location.pathname.startsWith('/onboarding')) {
                    window.location.replace(HOME_PATH);
                }
            }, 6000);
        } catch (err: any) {
            console.error('❌ [GOOGLE ONBOARDING] Error:', err?.message || err);
            setError(err?.message || 'Registration failed. Please try again.');
            setLoading(false);
            submittingRef.current = false;
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <LocationPhoneStep onNext={saveAndNext} />;

            case 2:
                return <CurrentStatus onNext={saveAndNext} onBack={goBack} />;

            case 3:
                return (
                    <>
                        {(formData.status === 'working' || formData.userType === 'working') && (
                            <WorkingJobDetails
                                onNext={handleComplete}
                                onBack={goBack}
                                initialData={formData}
                                onDataChange={(data) =>
                                    setFormData((prev: any) => ({ ...prev, ...data }))
                                }
                            />
                        )}
                        {(formData.status === 'student' || formData.userType === 'student') && (
                            <StudentEducation
                                onNext={handleComplete}
                                onBack={goBack}
                                initialData={formData}
                                onDataChange={(data) =>
                                    setFormData((prev: any) => ({ ...prev, ...data }))
                                }
                            />
                        )}
                        {(formData.status === 'fresher' || formData.userType === 'fresher') && (
                            <FresherEducationRole
                                onNext={handleComplete}
                                onBack={goBack}
                                initialData={formData}
                                onDataChange={(data) =>
                                    setFormData((prev: any) => ({ ...prev, ...data }))
                                }
                            />
                        )}
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md">
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map((step) => (
                        <div
                            key={step}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                                step <= currentStep ? 'bg-[#4a3728]' : 'bg-gray-200'
                            }`}
                        />
                    ))}
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {renderStep()}

                {loading && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-2xl flex items-center gap-4">
                            <div className="w-8 h-8 border-4 border-[#4a3728] border-t-transparent rounded-full animate-spin" />
                            <p className="font-semibold text-gray-900">Setting up your profile...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}