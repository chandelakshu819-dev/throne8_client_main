// src/hooks/auth/thunks/loginThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import AuthService from '@/lib/api/auth.service';
import TokenStorage from '@/lib/store/token.storage';

import { LoginCredentials, LoginResponse, UserData } from '@/features/auth/interface';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
};

/**
 * Login Thunk
 * AuthService.login pehle hi user data save kar deta hai.
 * Agar server body mein tokens bhi bhejta hai to unhe bhi store karte hain.
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

      const user = response.data?.user;
      if (!user) {
        return rejectWithValue('Login failed. Invalid response from server.');
      }

      const tokens = response.data?.tokens;
      if (tokens?.accessToken && tokens?.refreshToken) {
        TokenStorage.setAuthData(
          {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn ?? 900,
          },
          user
        );
      } else {
        TokenStorage.setAuthData(user);
      }

      return response;
    } catch (error: unknown) {
      console.error('[THUNK] Login failed:', error);
      return rejectWithValue(
        getErrorMessage(error, 'Login failed. Please try again.')
      );
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
      // AuthService.logout local data clear karta hai + API call karta hai
      await AuthService.logout();
    } catch (error: unknown) {
      console.error('[THUNK] Logout failed:', error);

      // API fail ho tab bhi local data clear karo (user ne khud logout kiya hai)
      TokenStorage.clearAuthData('user_logout_api_failed');

      return rejectWithValue(getErrorMessage(error, 'Logout failed'));
    }
  }
);

/**
 * Check Auth Status (app load par)
 *
 * Yahan koi network call nahi hoti aur kabhi tokens clear nahi hote.
 */
export const checkAuthStatus = createAsyncThunk<
  UserData | null,
  void,
  { rejectValue: string }
>(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      if (!TokenStorage.isAuthenticated()) {
        return null;
      }

      return TokenStorage.getUserData();
    } catch (error: unknown) {
      console.error('[THUNK] Auth check failed:', error);
      return rejectWithValue(getErrorMessage(error, 'Session validation failed'));
    }
  }
);

/**
 * Fetch Current User's Full Profile (name, photo, stats, etc.)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchCurrentUser = createAsyncThunk<any, void, { rejectValue: string }>(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthService.getUserProfile();
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch profile'));
    }
  }
);