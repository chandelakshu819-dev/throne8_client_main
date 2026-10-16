// lib/api/verification.service.ts

import config from "@/config/env.config";
import api from "./api.intance";
import AuthService from "./auth.service";

// ==================== TYPES ====================

interface VerificationResponse {
    status: string;
    statusCode: number;
    message: string;
    data: any;
    timestamp: string;
}

// ==================== VERIFICATION SERVICE ====================

class VerificationService {

    // ============================================================
    // 📧 PRE-REGISTRATION EMAIL OTP VERIFICATION
    // ============================================================

    /**
     * 📧 Send Pre-registration Email OTP
     * POST /api/v1/auth/register/send-otp
     */
    static async sendRegistrationOtp(email: string, firstName?: string): Promise<any> {
        return AuthService.sendRegistrationOtp({ email, firstName });
    }

    /**
     * 🔄 Resend Pre-registration Email OTP
     * POST /api/v1/auth/register/resend-otp
     */
    static async resendRegistrationOtp(email: string, firstName?: string): Promise<any> {
        return AuthService.resendRegistrationOtp({ email, firstName });
    }

    /**
     * ✅ Verify Pre-registration Email OTP
     * POST /api/v1/auth/register/verify-otp
     */
    static async verifyRegistrationOtp(email: string, otp: string): Promise<any> {
        return AuthService.verifyRegistrationOtp({ email, otp });
    }

    // ============================================================
    // 📧 POST-REGISTRATION EMAIL VERIFICATION
    // ============================================================

    /**
     * 📧 Send Email OTP
         * Body: { email: string }
     */
    private static sendEmailOtpInFlight = new Map<string, Promise<VerificationResponse>>();
    private static resendEmailOtpInFlight = new Map<string, Promise<VerificationResponse>>();
    private static lastOtpSentAt = new Map<string, number>();

    static async sendEmailOtp(email: string): Promise<VerificationResponse> {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Check if an identical send-otp request is currently in-flight
        const existingPromise = this.sendEmailOtpInFlight.get(normalizedEmail);
        if (existingPromise) {
            console.log('⏳ [SEND_EMAIL_OTP] Reusing in-flight OTP request for:', normalizedEmail);
            return existingPromise;
        }

        // 2. Debounce guard: Prevent rapid spam clicks within 3 seconds
        const lastSent = this.lastOtpSentAt.get(normalizedEmail);
        if (lastSent && Date.now() - lastSent < 3000) {
            console.warn('⚠️ [SEND_EMAIL_OTP] Request throttled (sent < 3s ago):', normalizedEmail);
            return {
                status: 'success',
                statusCode: 200,
                message: 'OTP already sent. Please check your email.',
                data: { success: true },
                timestamp: new Date().toISOString(),
            };
        }

        const promise = (async () => {
            try {
                console.log('📧 [SEND_EMAIL_OTP] Sending OTP to email...', { email: normalizedEmail });

                const endpoint =
                    config.NEXT_PUBLIC_VERIFY_EMAIL_SEND_OTP_ENDPOINT ||
                    process.env.NEXT_PUBLIC_VERIFY_EMAIL_SEND_OTP_ENDPOINT ||
                    '/verify/email/send-otp';

                const { data } = await api.post<VerificationResponse>(endpoint, { email: normalizedEmail });

                this.lastOtpSentAt.set(normalizedEmail, Date.now());

                console.log('✅ [SEND_EMAIL_OTP] OTP sent successfully', {
                    message: data.message,
                    status: data.status,
                });

                return data;
            } catch (error: any) {
                console.error('❌ [SEND_EMAIL_OTP] Failed to send email OTP', {
                    error: error?.response?.data || error?.message,
                    status: error?.response?.status,
                    email: normalizedEmail,
                });

                if (error?.response?.data?.message) {
                    throw new Error(error.response.data.message);
                }
                if (error?.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }
                if (error?.response?.status === 429) {
                    throw new Error('Too many OTP requests. Please wait before trying again.');
                }
                if (error?.response?.status === 400) {
                    throw new Error('Invalid email address. Please check and try again.');
                }

                throw new Error('Failed to send OTP. Please try again.');
            } finally {
                this.sendEmailOtpInFlight.delete(normalizedEmail);
            }
        })();

        this.sendEmailOtpInFlight.set(normalizedEmail, promise);
        return promise;
    }

    /**
     * ✅ Verify Email OTP
         * Body: { email: string, otp: string }
     */
    static async verifyEmailOtp(email: string, otp: string): Promise<VerificationResponse> {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedOtp = otp.trim();

        try {
            console.log('✅ [VERIFY_EMAIL_OTP] Verifying email OTP...', {
                email: normalizedEmail,
                otpLength: normalizedOtp.length,
            });

            const endpoint =
                config.NEXT_PUBLIC_VERIFY_EMAIL_VERIFY_OTP_ENDPOINT ||
                process.env.NEXT_PUBLIC_VERIFY_EMAIL_VERIFY_OTP_ENDPOINT ||
                '/verify/email/otp/verify';

            const { data } = await api.post<VerificationResponse>(endpoint, {
                email: normalizedEmail,
                otp: normalizedOtp,
            });

            console.log('✅ [VERIFY_EMAIL_OTP] Email OTP verified successfully', {
                message: data.message,
                status: data.status,
                data: data.data,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [VERIFY_EMAIL_OTP] Email OTP verification failed', {
                error: error?.response?.data || error?.message,
                status: error?.response?.status,
                email: normalizedEmail,
            });

            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            if (error?.response?.status === 400) {
                throw new Error('Invalid or expired OTP. Please try again.');
            }
            if (error?.response?.status === 404) {
                throw new Error('OTP not found. Please request a new OTP.');
            }
            if (error?.code === 'ERR_NETWORK') {
                throw new Error('Unable to connect to server. Please check your internet connection.');
            }

            throw new Error('OTP verification failed. Please try again.');
        }
    }

    /**
     * 🔄 Resend Email OTP
         * Body: { email: string }
     */
    static async resendEmailOtp(email: string): Promise<VerificationResponse> {
        const normalizedEmail = email.trim().toLowerCase();

        const existingPromise = this.resendEmailOtpInFlight.get(normalizedEmail);
        if (existingPromise) {
            console.log('⏳ [RESEND_EMAIL_OTP] Reusing in-flight resend request for:', normalizedEmail);
            return existingPromise;
        }

        const promise = (async () => {
            try {
                console.log('🔄 [RESEND_EMAIL_OTP] Resending OTP to email...', { email: normalizedEmail });

                const endpoint =
                    config.NEXT_PUBLIC_VERIFY_EMAIL_RESEND_OTP_ENDPOINT ||
                    process.env.NEXT_PUBLIC_VERIFY_EMAIL_RESEND_OTP_ENDPOINT ||
                    '/verify/email/otp/resend-otp';

                const { data } = await api.post<VerificationResponse>(endpoint, { email: normalizedEmail });

                this.lastOtpSentAt.set(normalizedEmail, Date.now());

                console.log('✅ [RESEND_EMAIL_OTP] OTP resent successfully', {
                    message: data.message,
                    status: data.status,
                });

                return data;
            } catch (error: any) {
                console.error('❌ [RESEND_EMAIL_OTP] Failed to resend email OTP', {
                    error: error?.response?.data || error?.message,
                    status: error?.response?.status,
                    email: normalizedEmail,
                });

                if (error?.response?.data?.message) {
                    throw new Error(error.response.data.message);
                }
                if (error?.response?.status === 429) {
                    throw new Error('Too many OTP requests. Please wait a few minutes before trying again.');
                }
                if (error?.response?.status === 400) {
                    throw new Error('Invalid email address.');
                }
                if (error?.code === 'ERR_NETWORK') {
                    throw new Error('Unable to connect to server. Please check your internet connection.');
                }

                throw new Error('Failed to resend OTP. Please try again.');
            } finally {
                this.resendEmailOtpInFlight.delete(normalizedEmail);
            }
        })();

        this.resendEmailOtpInFlight.set(normalizedEmail, promise);
        return promise;
    }

    /**
     * 📊 Check Email Verification Status
         * No body required (uses Bearer token)
     */
    static async checkEmailVerificationStatus(): Promise<VerificationResponse> {
        try {
            console.log('📊 [EMAIL_STATUS_CHECK] Checking email verification status...');

            const endpoint =
                config.NEXT_PUBLIC_VERIFY_EMAIL_STATUS_CHECK_ENDPOINT ||
                process.env.NEXT_PUBLIC_VERIFY_EMAIL_STATUS_CHECK_ENDPOINT ||
                '/verify/email/status-check';

            const { data } = await api.get<VerificationResponse>(endpoint);

            console.log('✅ [EMAIL_STATUS_CHECK] Status fetched successfully', {
                message: data.message,
                status: data.status,
                data: data.data,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [EMAIL_STATUS_CHECK] Failed to check email status', {
                error: error?.response?.data || error?.message,
                status: error?.response?.status,
            });

            if (error?.response?.status === 401) {
                throw new Error('Authentication required. Please login again.');
            }
            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            if (error?.code === 'ERR_NETWORK') {
                throw new Error('Unable to connect to server.');
            }

            throw new Error('Failed to check email verification status.');
        }
    }

    // ============================================================
    // 📱 PHONE VERIFICATION
    // ============================================================

    /**
     * 📱 Send Phone OTP
         * Body: { phoneNumber: string } — format: "+919131347975"
     */
    static async sendPhoneOtp(phoneNumber: string): Promise<VerificationResponse> {
        try {
            console.log('📱 [SEND_PHONE_OTP] Sending OTP to phone...', { phoneNumber });

            const { data } = await api.post<VerificationResponse>(
                `${config.NEXT_PUBLIC_VERIFY_PHONE_SEND_OTP_ENDPOINT || process.env.NEXT_PUBLIC_VERIFY_PHONE_SEND_OTP_ENDPOINT}`,
                { phoneNumber }
            );

            console.log('✅ [SEND_PHONE_OTP] OTP sent successfully', {
                message: data.message,
                status: data.status,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [SEND_PHONE_OTP] Failed to send phone OTP', {
                error: error?.response?.data || error?.message,
                status: error?.response?.status,
                phoneNumber,
            });

            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            if (error?.response?.status === 429) {
                throw new Error('Too many OTP requests. Please wait before trying again.');
            }
            if (error?.response?.status === 400) {
                throw new Error('Invalid phone number. Please enter a valid Indian mobile number.');
            }
            if (error?.code === 'ERR_NETWORK') {
                throw new Error('Unable to connect to server. Please check your internet connection.');
            }

            throw new Error('Failed to send OTP. Please try again.');
        }
    }

    /**
     * ✅ Verify Phone OTP
         * Body: { phoneNumber: string, otp: string }
     */
    static async verifyPhoneOtp(phoneNumber: string, otp: string): Promise<VerificationResponse> {
        try {
            console.log('✅ [VERIFY_PHONE_OTP] Verifying phone OTP...', { phoneNumber, otpLength: otp.length });

            const { data } = await api.post<VerificationResponse>(
                `${config.NEXT_PUBLIC_VERIFY_PHONE_VERIFY_OTP_ENDPOINT || process.env.NEXT_PUBLIC_VERIFY_PHONE_VERIFY_OTP_ENDPOINT}`,
                { phoneNumber, otp }
            );

            console.log('✅ [VERIFY_PHONE_OTP] Phone OTP verified successfully', {
                message: data.message,
                status: data.status,
                data: data.data,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [VERIFY_PHONE_OTP] Phone OTP verification failed', {
                error: error?.response?.data || error?.message,
                status: error?.response?.status,
                phoneNumber,
            });

            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            if (error?.response?.status === 400) {
                throw new Error('Invalid or expired OTP. Please try again.');
            }
            if (error?.response?.status === 404) {
                throw new Error('OTP not found. Please request a new OTP.');
            }
            if (error?.code === 'ERR_NETWORK') {
                throw new Error('Unable to connect to server. Please check your internet connection.');
            }

            throw new Error('OTP verification failed. Please try again.');
        }
    }

    /**
     * 🔄 Resend Phone OTP
         * Body: { phoneNumber: string }
     */
    static async resendPhoneOtp(phoneNumber: string): Promise<VerificationResponse> {
        try {
            console.log('🔄 [RESEND_PHONE_OTP] Resending OTP to phone...', { phoneNumber });

            const { data } = await api.post<VerificationResponse>(
                `${config.NEXT_PUBLIC_VERIFY_PHONE_RESEND_OTP_ENDPOINT || process.env.NEXT_PUBLIC_VERIFY_PHONE_RESEND_OTP_ENDPOINT}`,
                { phoneNumber }
            );

            console.log('✅ [RESEND_PHONE_OTP] OTP resent successfully', {
                message: data.message,
                status: data.status,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [RESEND_PHONE_OTP] Failed to resend phone OTP', {
                error: error?.response?.data || error?.message,
                status: error?.response?.status,
                phoneNumber,
            });

            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            if (error?.response?.status === 429) {
                throw new Error('Too many OTP requests. Please wait a few minutes before trying again.');
            }
            if (error?.response?.status === 400) {
                throw new Error('Invalid phone number.');
            }
            if (error?.code === 'ERR_NETWORK') {
                throw new Error('Unable to connect to server. Please check your internet connection.');
            }

            throw new Error('Failed to resend OTP. Please try again.');
        }
    }

    /**
     * 📊 Check Phone Verification Status
         * No body required (uses Bearer token)
     */
    static async checkPhoneVerificationStatus(): Promise<VerificationResponse> {
        try {
            console.log('📊 [PHONE_STATUS_CHECK] Checking phone verification status...');

            const { data } = await api.get<VerificationResponse>(
                `${config.NEXT_PUBLIC_VERIFY_PHONE_STATUS_CHECK_ENDPOINT || process.env.NEXT_PUBLIC_VERIFY_PHONE_STATUS_CHECK_ENDPOINT}`
            );

            console.log('✅ [PHONE_STATUS_CHECK] Status fetched successfully', {
                message: data.message,
                status: data.status,
                data: data.data,
            });

            return data;
        } catch (error: any) {
            console.error('❌ [PHONE_STATUS_CHECK] Failed to check phone status', {
                error: error?.response?.data || error?.message,
                status: error?.response?.status,
            });

            if (error?.response?.status === 401) {
                throw new Error('Authentication required. Please login again.');
            }
            if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            if (error?.code === 'ERR_NETWORK') {
                throw new Error('Unable to connect to server.');
            }

            throw new Error('Failed to check phone verification status.');
        }
    }

    // ============================================================
    // 🪪 AADHAAR VERIFICATION
    // ============================================================

    static async sendAadhaarOtp(aadhaarNumber: string): Promise<VerificationResponse> {
        try {
            const { data } = await api.post<VerificationResponse>(
                `${config.NEXT_PUBLIC_VERIFY_IDENTITY_AADHAAR_SEND_OTP_ENDPOINT || process.env.NEXT_PUBLIC_VERIFY_IDENTITY_AADHAAR_SEND_OTP_ENDPOINT}`,
                { aadhaarNumber }
            );
            return data;
        } catch (error: any) {
            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            if (error?.response?.status === 429) throw new Error('Too many requests. Please wait before trying again.');
            throw new Error('Failed to send Aadhaar OTP. Please try again.');
        }
    }

    static async verifyAadhaarOtp(otp: string): Promise<VerificationResponse> {
        try {
            const { data } = await api.post<VerificationResponse>(
                `${config.NEXT_PUBLIC_VERIFY_IDENTITY_AADHAAR_VERIFY_OTP_ENDPOINT || process.env.NEXT_PUBLIC_VERIFY_IDENTITY_AADHAAR_VERIFY_OTP_ENDPOINT}`,
                { otp }
            );
            return data;
        } catch (error: any) {
            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            if (error?.response?.status === 400) throw new Error('Invalid or expired OTP. Please try again.');
            throw new Error('OTP verification failed. Please try again.');
        }
    }

    static async checkAadhaarVerificationStatus(): Promise<VerificationResponse> {
        try {
            const { data } = await api.get<VerificationResponse>(
                `${config.NEXT_PUBLIC_VERIFY_IDENTITY_AADHAAR_STATUS_CHECK_ENDPOINT || process.env.NEXT_PUBLIC_VERIFY_IDENTITY_AADHAAR_STATUS_CHECK_ENDPOINT}`
            );
            return data;
        } catch (error: any) {
            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            throw new Error('Failed to check Aadhaar verification status.');
        }
    }

    // ============================================================
    // 🏢 COMPANY EMAIL VERIFICATION
    // ============================================================

    static async sendCompanyEmailOtp(companyEmail: string): Promise<VerificationResponse> {
        try {
            const { data } = await api.post<VerificationResponse>(
                `${config.NEXT_PUBLIC_VERIFY_EMAIL_COMPANY_EMAIL_SEND_OTP_ENDPOINT || process.env.NEXT_PUBLIC_VERIFY_EMAIL_COMPANY_EMAIL_SEND_OTP_ENDPOINT}`,
                { companyEmail }
            );
            return data;
        } catch (error: any) {
            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            if (error?.response?.status === 429) throw new Error('Too many requests. Please wait before trying again.');
            throw new Error('Failed to send company email OTP. Please try again.');
        }
    }

    static async verifyCompanyEmailOtp(otp: string): Promise<VerificationResponse> {
        try {
            const { data } = await api.post<VerificationResponse>(
                `${config.NEXT_PUBLIC_VERIFY_EMAIL_COMPANY_EMAIL_VERIFY_OTP_ENDPOINT || process.env.NEXT_PUBLIC_VERIFY_EMAIL_COMPANY_EMAIL_VERIFY_OTP_ENDPOINT}`,
                { otp }
            );
            return data;
        } catch (error: any) {
            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            if (error?.response?.status === 400) throw new Error('Invalid or expired OTP. Please try again.');
            throw new Error('OTP verification failed. Please try again.');
        }
    }

    static async checkCompanyEmailVerificationStatus(): Promise<VerificationResponse> {
        try {
            const { data } = await api.get<VerificationResponse>(
                `${config.NEXT_PUBLIC_VERIFY_EMAIL_COMPANY_EMAIL_STATUS_CHECK_ENDPOINT || process.env.NEXT_PUBLIC_VERIFY_EMAIL_COMPANY_EMAIL_STATUS_CHECK_ENDPOINT}`
            );
            return data;
        } catch (error: any) {
            if (error?.response?.data?.message) throw new Error(error.response.data.message);
            throw new Error('Failed to check company email verification status.');
        }
    }
}

export default VerificationService;