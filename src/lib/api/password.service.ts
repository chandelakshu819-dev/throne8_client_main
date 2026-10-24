import api from "./api.intance";

// ==================== TYPES ====================

interface PasswordResponse {
    status: string;
    statusCode: number;
    message: string;
    data: any;
    timestamp: string;
}

// ==================== PASSWORD SERVICE ====================

class PasswordService {

    // ============================================================
    // 🔑 PASSWORD RESET (PUBLIC — No Auth Required)
    // ============================================================

    /**
     * Step 1: Send reset OTP to email
     * POST /api/v1/password/reset/request
     * Body: { email: string }
     */
    static async requestPasswordReset(email: string): Promise<PasswordResponse> {
        try {
            console.log('🔑 [PASSWORD_RESET_REQUEST] Sending reset OTP...', { email });

            const { data } = await api.post<PasswordResponse>(
                '/verify/password/reset/request',
                { email }
            );

            console.log('✅ [PASSWORD_RESET_REQUEST] OTP sent successfully', {
                message: data.message,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [PASSWORD_RESET_REQUEST] Failed', error, {
                error: error?.response?.data || error?.message,
                status: error?.response?.status,
                email,
            });

            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            if (error?.code === 'ERR_NETWORK') {
                throw new Error('Unable to connect to server. Please check your internet connection.');
            }
            if (error?.response?.status === 429) {
                throw new Error('Too many reset attempts. Please wait before trying again.');
            }
            if (error?.response?.status === 400) {
                throw new Error('Invalid email address. Please check and try again.');
            }

            throw new Error('Failed to send reset code. Please try again.');
        }
    }

    /**
     * Step 2: Verify reset OTP
     * POST /api/v1/verify/password/reset/verify-otp
     * Body: { email: string, otp: string }
     */
    static async verifyPasswordResetOTP(email: string, otp: string): Promise<PasswordResponse> {
        try {
            console.log('🔑 [PASSWORD_RESET_VERIFY_OTP] Verifying OTP...', {
                email,
                otpLength: otp.length,
            });

            const { data } = await api.post<PasswordResponse>(
                '/verify/password/reset/verify-otp',
                { email, otp }
            );

            console.log('✅ [PASSWORD_RESET_VERIFY_OTP] OTP verified successfully', {
                message: data.message,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [PASSWORD_RESET_VERIFY_OTP] Failed', error, {
                error: error?.response?.data || error?.message,
                status: error?.response?.status,
                email,
            });

            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            if (error?.code === 'ERR_NETWORK') {
                throw new Error('Unable to connect to server. Please check your internet connection.');
            }
            if (error?.response?.status === 400) {
                throw new Error('Invalid or expired OTP. Please request a new code.');
            }
            if (error?.response?.status === 401) {
                throw new Error('Invalid OTP. Please enter the correct code sent to your email.');
            }
            if (error?.response?.status === 429) {
                throw new Error('Too many attempts. Please request a new reset code.');
            }

            throw new Error('Failed to verify OTP. Please try again.');
        }
    }

    /**
     * Step 3: Verify reset authorization (resetToken or resetCode) + Set new password
     * POST /api/v1/verify/password/reset/verify
     * Body: { email?: string, resetToken?: string, resetCode?: string, newPassword: string }
     */
    static async verifyPasswordReset(
        email: string,
        resetCodeOrToken: string,
        newPassword: string
    ): Promise<PasswordResponse> {
        try {
            const isToken = resetCodeOrToken.length >= 32;
            console.log('🔑 [PASSWORD_RESET_VERIFY] Verifying reset authorization...', {
                email,
                isToken,
            });

            const payload = isToken
                ? { resetToken: resetCodeOrToken, newPassword }
                : { email, resetCode: resetCodeOrToken, newPassword };

            const { data } = await api.post<PasswordResponse>(
                '/verify/password/reset/verify',
                payload
            );

            console.log('✅ [PASSWORD_RESET_VERIFY] Password reset successful', {
                message: data.message,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [PASSWORD_RESET_VERIFY] Failed', error, {
                error: error?.response?.data || error?.message,
                status: error?.response?.status,
                email,
            });

            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            if (error?.code === 'ERR_NETWORK') {
                throw new Error('Unable to connect to server. Please check your internet connection.');
            }
            if (error?.response?.status === 400) {
                throw new Error('Invalid or expired reset code. Please request a new one.');
            }
            if (error?.response?.status === 401) {
                throw new Error('Reset code is incorrect. Please check and try again.');
            }
            if (error?.response?.status === 422) {
                throw new Error('Password does not meet requirements. Please choose a stronger password.');
            }
            if (error?.response?.status === 429) {
                throw new Error('Too many attempts. Please request a new reset code.');
            }

            throw new Error('Failed to reset password. Please try again.');
        }
    }

    // ============================================================
    // 🔒 PASSWORD CHANGE (PRIVATE — Auth Required)
    // ============================================================

    /**
     * Step 1: Verify current password + Send OTP
     * POST /api/v1/password/change/send-otp
     * Body: { currentPassword: string }
     * Headers: Authorization Bearer token
     */
    static async sendPasswordChangeOtp(currentPassword: string): Promise<PasswordResponse> {
        try {
            console.log('🔒 [PASSWORD_CHANGE_OTP] Sending change OTP...');

            const { data } = await api.post<PasswordResponse>(
                '/verify/password/change/send-otp',
                { currentPassword }
            );

            console.log('✅ [PASSWORD_CHANGE_OTP] OTP sent successfully', {
                message: data.message,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [PASSWORD_CHANGE_OTP] Failed', error, {
                error: error?.response?.data || error?.message,
                status: error?.response?.status,
            });

            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            if (error?.code === 'ERR_NETWORK') {
                throw new Error('Unable to connect to server. Please check your internet connection.');
            }
            if (error?.response?.status === 401) {
                throw new Error('Current password is incorrect. Please try again.');
            }
            if (error?.response?.status === 429) {
                throw new Error('Too many attempts. Please wait before trying again.');
            }
            if (error?.response?.status === 403) {
                throw new Error('Session expired. Please login again.');
            }

            throw new Error('Failed to send verification code. Please try again.');
        }
    }   

    /**
     * Step 2: Verify OTP + Set new password
     * POST /api/v1/password/change/verify
     * Body: { otp: string, newPassword: string }
     * Headers: Authorization Bearer token
     */
    static async verifyPasswordChange(
        otp: string,
        newPassword: string
    ): Promise<PasswordResponse> {
        try {
            console.log('🔒 [PASSWORD_CHANGE_VERIFY] Verifying OTP and changing password...');

            const { data } = await api.post<PasswordResponse>(
                '/verify/password/change/verify',
                { otp, newPassword }
            );

            console.log('✅ [PASSWORD_CHANGE_VERIFY] Password changed successfully', {
                message: data.message,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [PASSWORD_CHANGE_VERIFY] Failed', error, {
                error: error?.response?.data || error?.message,
                status: error?.response?.status,
            });

            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            if (error?.code === 'ERR_NETWORK') {
                throw new Error('Unable to connect to server. Please check your internet connection.');
            }
            if (error?.response?.status === 400) {
                throw new Error('Invalid or expired OTP. Please request a new code.');
            }
            if (error?.response?.status === 401) {
                throw new Error('Verification failed. Please login again.');
            }
            if (error?.response?.status === 422) {
                throw new Error('New password does not meet requirements. Please choose a stronger password.');
            }
            if (error?.response?.status === 429) {
                throw new Error('Too many attempts. Please request a new verification code.');
            }
            if (error?.response?.status === 409) {
                throw new Error('Cannot reuse a recent password. Please choose a different password.');
            }

            throw new Error('Failed to change password. Please try again.');
        }
    }
}

export default PasswordService;