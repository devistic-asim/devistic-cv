import { useEffect, useState } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'

const KEY = 'devistic-theme'

export function readThemeChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    /* private mode */
  }
  return 'system'
}

export function applyTheme(choice: ThemeChoice) {
  const dark = choice === 'dark' || (choice === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const theme = dark ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B1220' : '#F5F9FC')
}

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(() => readThemeChoice())

  useEffect(() => {
    applyTheme(choice)
    try {
      localStorage.setItem(KEY, choice)
    } catch {
      /* ignore */
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(choice)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [choice])

  return [choice, setChoice] as const
}
