// src/hooks/auth/thunks/loginThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import AuthService from '@/lib/api/auth.service';
import TokenStorage from '@/lib/store/token.storage';

import { LoginCredentials, LoginResponse, UserData } from '@/features/auth/interface';

/**
 * Login Thunk
 * Login API call + token storage
 */
export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials);

        // ✅ Store tokens in localStorage (AuthService already does this, but double-check)
        TokenStorage.setAuthData(
          response.data.tokens,
          response.data.user
        );

        // console.log('✅ [THUNK] Login successful:', response.data.user.email);

      return response;
    } catch (error: any) {
      console.error('[THUNK] Login failed:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Logout Thunk
 * Ye sirf user ke Sign Out button se call hona chahiye.
 */
export const logoutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // AuthService.logout tokens clear karta hai + API call karta hai
      await AuthService.logout();
    } catch (error: any) {
      console.error('[THUNK] Logout failed:', error);

      // API fail ho tab bhi local data clear karo
      TokenStorage.clearAuthData();

      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

/**
 * Check Auth Status (app load par)
 *
 * Yahan koi network refresh nahi hota aur kabhi tokens clear nahi hote.
 * Access token expire ho to api.intance.ts ka interceptor pehli request
 * se pehle hi shared refresh kar leta hai. Logout sirf tab hota hai jab
 * refresh token sach mein invalid ho (interceptor handle karta hai).
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

        // Check if tokens exist
        const isAuthenticated = TokenStorage.isAuthenticated();

        if (!isAuthenticated) {
          // console.log('ℹ️ [THUNK] No valid session found');
          return null;
        }

        // Get user data from localStorage
        const userData = TokenStorage.getUserData();

        if (TokenStorage.needsTokenRefresh()) {
          const refreshToken = TokenStorage.getRefreshToken();

          try {
            // ✅ AuthService ka method use kar rahe hain
            const response = await fetch(
              `${config?.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL}${config?.NEXT_PUBLIC_REFRESH_TOKEN_ENDPOINT || process.env.NEXT_PUBLIC_REFRESH_TOKEN_ENDPOINT}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
              }
            );

            if (!response.ok) {
              TokenStorage.clearAuthData();
              return null;
            }

            const data = await response.json();
            const {
              accessToken,
              refreshToken: newRefreshToken,
              expiresIn
            } = data.data.tokens;

            TokenStorage.updateAccessToken(accessToken, expiresIn);
            // Refresh token rotation — naya token save karo
            TokenStorage.updateRefreshToken(newRefreshToken);
          } catch {
            // Network error — existing userData return karo
            return userData;
          }
        }

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