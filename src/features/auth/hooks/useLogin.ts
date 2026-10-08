//src/features/auth/hooks/useLogin.ts

// import { useAppDispatch, useAppSelector } from './redux';
// import { clearError, loginUser, logoutUser, setRememberMe } from '@/store/features/auth';
import { clearError, loginUser, logoutUser, setRememberMe  } from '@/hooks/auth';
import { LoginCredentials } from '../interface';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export const useLogin = () => {
    const dispatch = useAppDispatch();

    const { loading, error, user, isAuthenticated, rememberMe } = useAppSelector(
        (state) => state.login
    );

    // Login action
    const login = async (credentials: LoginCredentials) => {
        return dispatch(loginUser(credentials)).unwrap();
    };

    // Logout action
    const logout = async () => {
        return dispatch(logoutUser()).unwrap();
    };

    // Clear error action
    const clearLoginError = () => {
        dispatch(clearError());
    };

    // Update remember me
    const updateRememberMe = (value: boolean) => {
        dispatch(setRememberMe(value));
    };

    return {
        // State
        loading,
        error,
        user,
        isAuthenticated,
        rememberMe,

        // Actions
        login,
        logout,
        clearLoginError,
        updateRememberMe,
    };
};