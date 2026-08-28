export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserProfile extends User {
  createdAt: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: string[];
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface GoogleAuthRequest {
  credential?: string;
  idToken?: string;
}

export interface AuthResponseData {
  user: User;
}

export type MeResponseData = UserProfile;
