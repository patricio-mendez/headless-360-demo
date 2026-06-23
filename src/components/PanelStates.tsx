import { Loader2, AlertCircle, Inbox } from 'lucide-react'

export function PanelLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 animate-pulse-soft rounded-xl bg-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse-soft rounded bg-secondary" />
            <div className="h-2.5 w-1/2 animate-pulse-soft rounded bg-secondary/60" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PanelError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-chart-coral/15 text-chart-coral">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium">No pudimos cargar los datos</div>
        <div className="max-w-xs text-xs text-muted-foreground">{message}</div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs hover:bg-secondary/80"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

export function PanelEmpty({ message, icon: Icon = Inbox }: { message: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/60 text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm text-muted-foreground">{message}</div>
    </div>
  )
}

export function InlineSpinner() {
  return <Loader2 className="h-3 w-3 animate-spin text-chart-blue" />
}
