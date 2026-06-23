import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { queryClient } from '@/lib/queryClient'
import { applyThemeClass } from '@/store/theme'
import type { Theme } from '@/store/theme'

// Apply persisted theme before first render to avoid FOUC
try {
  const raw = localStorage.getItem('headless360-theme')
  const parsed = raw ? (JSON.parse(raw) as { state?: { theme?: Theme } }) : null
  applyThemeClass(parsed?.state?.theme ?? 'dark')
} catch {
  applyThemeClass('dark')
}

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </QueryClientProvider>,
)
