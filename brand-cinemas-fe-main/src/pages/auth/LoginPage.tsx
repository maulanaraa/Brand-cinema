import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { Film, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [googleButtonWidth, setGoogleButtonWidth] = useState(0)
  const { signIn, signInWithGoogle } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const from = location.state?.from?.pathname || '/'
  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      toast.success(t('resetPasswordSuccessToast'))
    }
  }, [searchParams, t])

  useEffect(() => {
    const updateWidth = () => {
      if (googleButtonRef.current) {
        setGoogleButtonWidth(googleButtonRef.current.offsetWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const redirectAfterLogin = (role: string) => {
    if (role === 'admin') {
      const adminTarget = from.startsWith('/admin') ? from : '/admin'
      navigate(adminTarget, { replace: true })
      return
    }
    const userTarget = from.startsWith('/admin') ? '/' : from
    navigate(userTarget, { replace: true })
  }

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setGoogleError('')
    try {
      const { error, user } = await signIn(data.email, data.password)

      if (error) {
        toast.error(error.message || t('invalidCredentials'))
      } else {
        toast.success(t('welcomeBackToast'))
        redirectAfterLogin(user?.role ?? 'user')
      }
    } catch {
      toast.error(t('tryAgainError'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setGoogleError(t('googleLoginFailed'))
      return
    }

    setGoogleError('')
    setGoogleLoading(true)
    try {
      const { error, user } = await signInWithGoogle(response.credential)

      if (error) {
        const msg = error.message
        if (msg === 'Invalid Google token') setGoogleError(t('googleSessionExpired'))
        else if (msg === 'Google email is not verified') setGoogleError(t('googleEmailNotVerified'))
        else if (msg === 'Too many login attempts. Please try again later.') setGoogleError(t('googleTooManyAttempts'))
        else setGoogleError(msg)
      } else {
        toast.success(t('welcomeBackToast'))
        redirectAfterLogin(user?.role ?? 'user')
      }
    } catch {
      setGoogleError(t('unableToConnect'))
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleGoogleError = () => {
    setGoogleError(t('googleCancelled'))
  }

  const isDisabled = loading || googleLoading

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Film className="h-12 w-12 text-[#D5A527]" />
          </div>
          <h2 className="mt-6 text-3xl font-display font-bold">{t('welcomeBack')}</h2>
          <p className="mt-2 text-gray-500 dark:text-slate-400">{t('signInSubtitle')}</p>
        </div>

        <div className="mt-8 space-y-6">
          {hasGoogleClientId && (
            <>
              <div ref={googleButtonRef} className="w-full flex justify-center">
                {googleButtonWidth > 0 && (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                    width={googleButtonWidth}
                  />
                )}
              </div>

              {googleLoading && (
                <div className="flex justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              )}

              {googleError && (
                <p className="text-sm text-red-400 text-center" role="alert">
                  {googleError}
                </p>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[var(--surface-page)] dark:bg-dark-950 px-3 text-gray-500 dark:text-slate-400">
                    {t('orContinueWithEmail')}
                  </span>
                </div>
              </div>
            </>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
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
                  disabled={isDisabled}
                />
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                    {t('password')}
                  </label>
                  <Link to="/forgot-password" className="text-sm text-[#D5A527] hover:text-[#C49622]">
                    {t('forgotPasswordLink')}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: t('passwordRequired'),
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder={t('enterPassword')}
                    disabled={isDisabled}
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
            </div>

            <div>
              <button
                type="submit"
                disabled={isDisabled}
                className="btn w-full py-3 text-lg bg-[#D5A527] text-dark-950 shadow-md shadow-[#D5A527]/25 hover:brightness-110 focus:ring-[#D5A527]"
              >
                {loading ? <LoadingSpinner size="sm" /> : t('signIn')}
              </button>
            </div>

            <div className="text-center">
              <p className="text-gray-500 dark:text-slate-400">
                {t('dontHaveAccount')}{' '}
                <Link to="/register" className="font-medium text-[#D5A527] hover:text-[#C49622]">
                  {t('signUp')}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
