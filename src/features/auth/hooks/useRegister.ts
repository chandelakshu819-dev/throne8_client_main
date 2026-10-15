// src/store/hooks/useRegister.ts

import { useCallback } from 'react';
import { clearFormData, clearRegisterError, nextStep, previousStep, registerUser, resetRegisterState, setCurrentStep, updateFormData } from '@/hooks/auth';
import { useAppDispatch,useAppSelector } from '@/store/hooks';
import { RegistrationData } from '../interface';

export const useRegister = () => {
    const dispatch = useAppDispatch();

    const { loading, error, currentStep, formData, isComplete } = useAppSelector(
        (state) => state.register
    );

    // Actions
    const register = useCallback(async (data: RegistrationData) => {
        return dispatch(registerUser(data)).unwrap();
    }, [dispatch]);

    const goToStep = useCallback((step: number) => {
        dispatch(setCurrentStep(step));
    }, [dispatch]);

    const goNext = useCallback(() => {
        dispatch(nextStep());
    }, [dispatch]);

    const goBack = useCallback(() => {
        dispatch(previousStep());
    }, [dispatch]);

    const saveFormData = useCallback((data: Partial<RegistrationData>) => {
        dispatch(updateFormData(data));
    }, [dispatch]);

    const clearForm = () => {
        dispatch(clearFormData());
    };

    const clearErrors = useCallback(() => {
        dispatch(clearRegisterError());
    }, [dispatch]);

    const resetState = () => {
        dispatch(resetRegisterState());
    };

    return {
        // State
        loading,
        error,
        currentStep,
        formData,
        isComplete,

        // Actions
        register,
        goToStep,
        goNext,
        goBack,
        saveFormData,
        clearForm,
        clearErrors,
        resetState,
    };
};