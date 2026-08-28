import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { LocationProvider } from './contexts/LocationContext'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <LocationProvider>
              <AuthProvider>
                <App />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    className: 'dark:bg-dark-800 dark:text-slate-100 dark:border-dark-600 bg-[var(--surface-card)] text-gray-900 border-[var(--border-soft)]',
                    style: {
                      border: '1px solid',
                    },
                  }}
                />
              </AuthProvider>
            </LocationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
