// src/store/features/auth/thunks/registerThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import AuthService from '@/lib/api/auth.service';
import TokenStorage from '@/lib/store/token.storage';
import { RegistrationData } from '@/features/auth/interface';

/**
 * 📝 Register Thunk
 */
export const registerUser = createAsyncThunk(
    'auth/register',
    async (registrationData: RegistrationData, { rejectWithValue }) => {
        try {
            // console.log('📝 [THUNK] Registration attempt:', registrationData.email);

            // Call AuthService
            const response = await AuthService.register(registrationData);

            // Store tokens (AuthService already does this)
            TokenStorage.setAuthData(
                response.data.tokens,
                response.data.user
            );

            // console.log('✅ [THUNK] Registration successful:', response.data.user.email);

            return response;

        } catch (error: any) {
            console.error('❌ [THUNK] Registration failed:', error);
            return rejectWithValue(error.message || 'Registration failed');
        }
    }
);
