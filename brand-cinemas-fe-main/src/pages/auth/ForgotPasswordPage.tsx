import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Film, ArrowLeft } from 'lucide-react'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/apiClient'
import { useLanguage } from '@/contexts/LanguageContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface ForgotPasswordForm {
  email: string
}

const goldBtn =
  'btn bg-[#D5A527] text-dark-950 shadow-md shadow-[#D5A527]/25 hover:brightness-110 focus:ring-[#D5A527]'
const goldLink = 'font-medium text-[#D5A527] hover:text-[#C49622]'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { t } = useLanguage()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>()

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true)
    try {
      await authService.forgotPassword(data.email)
      setSubmitted(true)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('tryAgainError')
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <Film className="h-12 w-12 text-[#D5A527]" />
          </div>
          <h2 className="text-3xl font-display font-bold">{t('checkYourEmail')}</h2>
          <p className="text-gray-500 dark:text-slate-400">{t('resetEmailSent')}</p>
          <Link to="/login" className={`${goldBtn} inline-flex items-center space-x-2`}>
            <ArrowLeft className="h-4 w-4" />
            <span>{t('backToSignIn')}</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Film className="h-12 w-12 text-[#D5A527]" />
          </div>
          <h2 className="mt-6 text-3xl font-display font-bold">{t('forgotPasswordTitle')}</h2>
          <p className="mt-2 text-gray-500 dark:text-slate-400">{t('forgotPasswordSubtitle')}</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

          <button type="submit" disabled={loading} className={`${goldBtn} w-full text-lg py-3`}>
            {loading ? <LoadingSpinner size="sm" /> : t('sendResetLink')}
          </button>

          <div className="text-center">
            <Link to="/login" className={`${goldLink} inline-flex items-center space-x-1`}>
              <ArrowLeft className="h-4 w-4" />
              <span>{t('backToSignIn')}</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
