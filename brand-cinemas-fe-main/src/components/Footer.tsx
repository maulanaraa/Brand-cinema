import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-[#020201]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-display font-bold text-white">
                Cinema<span className="text-gradient-gold">ID</span>
              </span>
            </div>
            <p className="text-slate-400 mb-6 max-w-md">
              {t('footerTagline')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-primary-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-primary-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-primary-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-primary-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link to="/movies" className="text-slate-400 hover:text-white transition-colors">
                  {t('movies')}
                </Link>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  {t('cinemas')}
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  {t('promotions')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('contactUs')}</h3>
            <div className="space-y-3 text-slate-400">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#D5A527]" /> Grand Indonesia, Jakarta</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#D5A527]" /> +62 21 555 0199</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#D5A527]" /> care@cinemaid.test</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 text-center text-slate-400">
          <p>&copy; {new Date().getFullYear()} CinemaID. {t('footerCopyright')}</p>
        </div>
      </div>
    </footer>
  )
}
