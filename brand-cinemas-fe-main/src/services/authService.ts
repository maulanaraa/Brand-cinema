import type { AuthUser } from '@/types';
import type {
  AuthResponseData,
  ForgotPasswordRequest,
  GoogleAuthRequest,
  LoginRequest,
  MeResponseData,
  RegisterRequest,
  ResetPasswordRequest,
  User,
  UserProfile,
} from '@/types/auth';
import { ApiError, apiRequest } from './apiClient';

function toAuthUser(apiUser: User | UserProfile): AuthUser {
  return {
    id: apiUser.id,
    _id: apiUser.id,
    email: apiUser.email,
    fullName: apiUser.name,
    role: apiUser.role === 'ADMIN' ? 'admin' : 'user',
  };
}

export const authService = {
  async login(email: string, password: string) {
    const res = await apiRequest<AuthResponseData>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password } satisfies LoginRequest),
    });
    return toAuthUser(res.data.user);
  },

  async adminLogin(email: string, password: string) {
    const user = await this.login(email, password);
    if (user.role !== 'admin') {
      await this.logout();
      throw new ApiError(401, 'Invalid email or password');
    }
    return user;
  },

  async register(email: string, password: string, fullName: string) {
    const res = await apiRequest<AuthResponseData>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: fullName, email, password } satisfies RegisterRequest),
    });
    return toAuthUser(res.data.user);
  },

  async logout() {
    await apiRequest<null>('/api/auth/logout', { method: 'POST' });
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const res = await apiRequest<MeResponseData>('/api/auth/me');
      return toAuthUser(res.data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }
      throw error;
    }
  },

  async forgotPassword(email: string) {
    return apiRequest<null>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email } satisfies ForgotPasswordRequest),
    });
  },

  async resetPassword(token: string, password: string) {
    return apiRequest<null>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password } satisfies ResetPasswordRequest),
    });
  },

  async googleLogin(credential: string) {
    const res = await apiRequest<AuthResponseData>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential } satisfies GoogleAuthRequest),
    });
    return toAuthUser(res.data.user);
  },
};
