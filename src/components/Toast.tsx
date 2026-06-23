import { create } from 'zustand'
import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
}

interface ToastStore {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }],
    })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function toast(toast: Omit<Toast, 'id'>) {
  useToastStore.getState().push(toast)
}

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

function ToastItem({ toast: t }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove)

  useEffect(() => {
    const timeout = setTimeout(() => remove(t.id), 4000)
    return () => clearTimeout(timeout)
  }, [t.id, remove])

  const variantClass = {
    success: 'border-chart-mint/30 bg-chart-mint/10 text-chart-mint',
    error: 'border-chart-coral/30 bg-chart-coral/10 text-chart-coral',
    info: 'border-chart-blue/30 bg-chart-blue/10 text-chart-blue',
  }[t.variant]

  const Icon = t.variant === 'error' ? AlertCircle : CheckCircle2

  return (
    <div
      className={cn(
        'pointer-events-auto flex min-w-[320px] max-w-md items-start gap-3 rounded-xl border bg-card/95 p-4 shadow-2xl backdrop-blur-xl animate-slide-up',
        variantClass,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="text-sm font-semibold text-foreground">{t.title}</div>
        {t.description && <div className="mt-0.5 text-xs text-muted-foreground">{t.description}</div>}
      </div>
      <button
        onClick={() => remove(t.id)}
        className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
