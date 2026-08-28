import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import { ApiError } from '@/services/apiClient';
import type { AuthUser } from '@/types';

interface AuthError {
  message: string;
  errors?: string[];
  status?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; user?: AuthUser }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null; user?: AuthUser }>;
  signOut: () => Promise<void>;
  adminSignIn: (email: string, password: string) => Promise<{ error: AuthError | null; user?: AuthUser }>;
  signInWithGoogle: (credential: string) => Promise<{ error: AuthError | null; user?: AuthUser }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toAuthError(error: unknown): AuthError {
  if (error instanceof ApiError) {
    return { message: error.message, errors: error.errors, status: error.status };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'An unexpected error occurred' };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const loggedInUser = await authService.login(email, password);
      setUser(loggedInUser);
      return { error: null, user: loggedInUser };
    } catch (error) {
      return { error: toAuthError(error) };
    }
  };

  const adminSignIn = async (email: string, password: string) => {
    try {
      const loggedInUser = await authService.adminLogin(email, password);
      setUser(loggedInUser);
      return { error: null, user: loggedInUser };
    } catch (error) {
      return { error: toAuthError(error) };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const registeredUser = await authService.register(email, password, fullName);
      setUser(registeredUser);
      return { error: null, user: registeredUser };
    } catch (error) {
      return { error: toAuthError(error) };
    }
  };

  const signOut = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const signInWithGoogle = async (credential: string) => {
    try {
      const loggedInUser = await authService.googleLogin(credential);
      setUser(loggedInUser);
      return { error: null, user: loggedInUser };
    } catch (error) {
      return { error: toAuthError(error) };
    }
  };

  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    isAdmin,
    loading,
    signIn,
    signUp,
    signOut,
    adminSignIn,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
