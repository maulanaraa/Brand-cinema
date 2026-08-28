import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Film, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface RegisterForm {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>()

  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      const { error } = await signUp(data.email, data.password, data.fullName)

      if (error) {
        if (error.status === 409) {
          toast.error(t('emailAlreadyRegistered'))
        } else if (error.errors?.length) {
          toast.error(error.errors.join('. '))
        } else {
          toast.error(error.message || t('registrationFailed'))
        }
      } else {
        toast.success(t('registrationSuccessful'))
        navigate('/')
      }
    } catch {
      toast.error(t('tryAgainError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Film className="h-12 w-12 text-[#D5A527]" />
          </div>
          <h2 className="mt-6 text-3xl font-display font-bold">{t('createAccountTitle')}</h2>
          <p className="mt-2 text-gray-500 dark:text-slate-400">{t('registerSubtitle')}</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                {t('fullName')}
              </label>
              <input
                {...register('fullName', {
                  required: t('fullNameRequired'),
                  maxLength: {
                    value: 100,
                    message: t('nameMaxLength'),
                  },
                })}
                type="text"
                className="input"
                placeholder={t('enterFullName')}
              />
              {errors.fullName && <p className="mt-1 text-sm text-red-400">{errors.fullName.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                {t('emailAddress')}
              </label>
              <input
                {...register('email', {
                  required: t('emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('invalidEmail'),
                  },
                })}
                type="email"
                className="input"
                placeholder={t('enterEmail')}
              />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: t('passwordRequired'),
                    minLength: {
                      value: 8,
                      message: t('passwordMinLength'),
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder={t('enterPassword')}
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
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword', {
                    required: t('confirmPasswordRequired'),
                    validate: (value) => value === password || t('passwordsDoNotMatch'),
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder={t('enterConfirmPassword')}
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

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn w-full py-3 text-lg bg-[#D5A527] text-dark-950 shadow-md shadow-[#D5A527]/25 hover:brightness-110 focus:ring-[#D5A527]"
            >
              {loading ? <LoadingSpinner size="sm" /> : t('createAccount')}
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-500 dark:text-slate-400">
              {t('alreadyHaveAccount')}{' '}
              <Link to="/login" className="font-medium text-[#D5A527] hover:text-[#C49622]">
                {t('signIn')}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
