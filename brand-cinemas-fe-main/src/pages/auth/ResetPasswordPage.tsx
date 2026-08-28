import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Film, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { authService } from '@/services/authService';
import { ApiError } from '@/services/apiClient';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>();

  const password = watch('password');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <Film className="h-12 w-12 text-[#D5A527]" />
          </div>
          <h2 className="text-3xl font-display font-bold">Invalid Reset Link</h2>
          <p className="text-gray-500 dark:text-slate-400" role="alert">
            This password reset link is invalid or missing. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="btn bg-[#D5A527] text-dark-950 shadow-md shadow-[#D5A527]/25 hover:brightness-110 focus:ring-[#D5A527]"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordForm) => {
    setApiError('');
    setLoading(true);
    try {
      await authService.resetPassword(token, data.password);
      navigate('/login?reset=success', { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'An error occurred. Please try again.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Film className="h-12 w-12 text-[#D5A527]" />
          </div>
          <h2 className="mt-6 text-3xl font-display font-bold">Reset Password</h2>
          <p className="mt-2 text-gray-500 dark:text-slate-400">
            Enter your new password below
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {apiError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400" role="alert">
              {apiError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn w-full py-3 text-lg bg-[#D5A527] text-dark-950 shadow-md shadow-[#D5A527]/25 hover:brightness-110 focus:ring-[#D5A527]"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Reset Password'}
          </button>

          <div className="text-center">
            <Link to="/login" className="inline-flex items-center space-x-1 font-medium text-[#D5A527] hover:text-[#C49622]">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
