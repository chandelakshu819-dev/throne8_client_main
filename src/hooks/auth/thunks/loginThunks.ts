// src/store/features/auth/thunks/loginThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import AuthService from '@/lib/api/auth.service';
import TokenStorage from '@/lib/store/token.storage';

import { LoginCredentials, LoginResponse, UserData } from '@/features/auth/interface';

/**
 * 🔐 Login Thunk
 * Handles login API call + token storage
 */
export const loginUser = createAsyncThunk
  <LoginResponse,
    LoginCredentials,
    { rejectValue: string }
  >(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
      try {
        // console.log('🚀 [THUNK] Login attempt:', credentials.email);

        // Call AuthService
        const response = await AuthService.login(credentials);

        // 🍪 Session cookies were set by the backend; remember the user for the UI
        TokenStorage.setAuthData(response.data.user);

        // console.log('✅ [THUNK] Login successful:', response.data.user.email);

        return response;

      } catch (error: any) {
        console.error('❌ [THUNK] Login failed:', error);

        // Extract error message
        const errorMessage = error.message || 'Login failed. Please try again.';

        return rejectWithValue(errorMessage);
      }
    }
  );

/**
 * 🚪 Logout Thunk
 */
export const logoutUser = createAsyncThunk
  <void,
    void,
    { rejectValue: string }
  >(
    'auth/logout',
    async (_, { rejectWithValue }) => {
      try {
        // console.log('🚪 [THUNK] Logout initiated');

        // Call AuthService logout (clears tokens + calls API)
        await AuthService.logout();

        // console.log('✅ [THUNK] Logout successful');

      } catch (error: any) {
        console.error('❌ [THUNK] Logout failed:', error);

        // Still clear local data even if API fails
        TokenStorage.clearAuthData();

        return rejectWithValue(error.message || 'Logout failed');
      }
    }
  );

/**
 * 🔄 Check Auth Status (on app load)
 */
export const checkAuthStatus = createAsyncThunk
  <UserData | null,
    void,
    { rejectValue: string }
  >(
    'auth/checkStatus',
    async (_, { rejectWithValue }) => {
      try {
        // console.log('🔍 [THUNK] Checking auth status...');

        // Does the browser believe it has a session? (flag cookie + stored user)
        const isAuthenticated = TokenStorage.isAuthenticated();

        if (!isAuthenticated) {
          // console.log('ℹ️ [THUNK] No valid session found');
          return null;
        }

        // The access cookie is httpOnly (not readable here). If it has expired, the first
        // API call gets a 401 and the axios interceptor refreshes the session once.
        const userData = TokenStorage.getUserData();

        return userData;

      } catch (error: any) {
        console.error('❌ [THUNK] Auth check failed:', error);
        TokenStorage.clearAuthData();
        return rejectWithValue(error.message || 'Session validation failed');
      }
    }
  );

  /**  /////////////////changed modified
 * 👤 Fetch Current User's Full Profile (name, photo, stats, etc.)
 */
export const fetchCurrentUser = createAsyncThunk<any, void, { rejectValue: string }>(
    'auth/fetchCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await AuthService.getUserProfile();
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch profile');
        }
    }
);
