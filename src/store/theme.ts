import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Theme = 'dark' | 'light' | 'ocean' | 'premium'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const THEME_CLASSES: Record<Theme, string> = {
  dark: 'theme-dark',
  light: 'theme-light',
  ocean: 'theme-ocean',
  premium: 'theme-premium',
}

export function applyThemeClass(theme: Theme) {
  const root = document.documentElement
  Object.values(THEME_CLASSES).forEach((cls) => root.classList.remove(cls))
  // Mantenemos `dark` para que tailwind dark: variants sigan respondiendo
  // donde correspondan (sólo el theme light desactiva ese flag)
  if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    root.classList.add('dark')
  }
  root.classList.add(THEME_CLASSES[theme])
  root.style.colorScheme = theme === 'light' ? 'light' : 'dark'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => {
        applyThemeClass(theme)
        set({ theme })
      },
    }),
    {
      name: 'headless360-theme',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyThemeClass(state.theme)
      },
    },
  ),
)
