// src/store/features/auth/slices/registerSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RegisterState, RegistrationData } from '@/features/auth/interface';
import { registerUser } from '../index';

const initialState: RegisterState = {
    loading: false,
    error: null,
    currentStep: 1,
    formData: {},
    isComplete: false,
};

const registerSlice = createSlice({
    name: 'register',
    initialState,
    reducers: {
        // Step navigation
        setCurrentStep: (state, action: PayloadAction<number>) => {
            state.currentStep = action.payload;
        },
        nextStep: (state) => {
            state.currentStep += 1;
        },
        previousStep: (state) => {
            if (state.currentStep > 1) {
                state.currentStep -= 1;
            }
        },

        // Form data management
        updateFormData: (state, action: PayloadAction<Partial<RegistrationData>>) => {
            state.formData = { ...state.formData, ...action.payload };
        },
        clearFormData: (state) => {
            state.formData = {};
        },

        // Error handling
        clearError: (state) => {
            state.error = null;
        },

        // Reset entire state
        resetRegisterState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
                state.isComplete = true;
                // console.log('✅ [SLICE] Registration completed');
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                const failure = action.payload as { message?: string } | undefined;
                state.error = failure?.message || 'Registration failed. Please retry.';
            });
    },
});

export const {
    setCurrentStep,
    nextStep,
    previousStep,
    updateFormData,
    clearFormData,
    clearError,
    resetRegisterState,
} = registerSlice.actions;

export default registerSlice.reducer;