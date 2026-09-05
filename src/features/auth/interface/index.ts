export interface RegistrationData {
  // Step 1
  email: string;
  password: string;
  confirmPassword: string;

  // Step 2
  firstName: string;
  lastName: string;
  phoneNumber: string; // ⚠️ Server expects "phoneNumber"
  location: string;

  // Step 3
  status?: string;
  userType: string;

  // Step 4 (Working)
  jobTitle?: string;
  companyName?: string;
  startDate?: string;
  endDate?: string;

  // Step 4 (Student)
  collegeName?: string;
  degree?: string;
  fieldOfStudy?: string;
  graduationYear?: string;

  // Step 4 (Fresher)
  highestEducation?: string;
  preferredRole?: string;
  cgpa?: string;

  // Step 5
  skills?: string[];
}


export interface RegisterState {
    loading: boolean;
    error: string | null;
    currentStep: number;
    formData: Partial<RegistrationData>;
    isComplete: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface UserData {
    userId: string;
    email: string;
    role: string;
}

export interface TokenData {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

export interface LoginResponse {
    status: string;
    statusCode: number;
    message: string;
    data: {
        user: UserData;
        tokens: TokenData;
    };
    timestamp: string;
}

export interface LoginState {
    name?: string;
    loading: boolean;
    error: string | null;
    user: UserData | null;
    profile?: any;
    isAuthenticated: boolean;
    rememberMe: boolean;
}

export interface LoginErrorPayload {
    message: string;
    statusCode?: number;
}
