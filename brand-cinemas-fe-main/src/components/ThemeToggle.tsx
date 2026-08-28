import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { clsx } from 'clsx'

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={clsx(
        'relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-raised)] text-[var(--text-primary)] transition-all hover:bg-[var(--surface-muted)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10',
        className
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun className={clsx('h-4 w-4 transition-all', theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0 absolute')} />
      <Moon className={clsx('h-4 w-4 transition-all', theme === 'light' ? 'rotate-0 scale-100' : '-rotate-90 scale-0 absolute')} />
    </button>
  )
}
