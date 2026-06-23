import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Popover from '@radix-ui/react-popover'
import {
  Search,
  Bell,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertTriangle,
  Clock,
  CalendarClock,
  Headphones,
  CheckSquare,
  Loader2,
} from 'lucide-react'
import { useQueryClient, useIsFetching } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { useBookAlerts, type AlertItem } from '@/hooks/useBookOfBusiness'
import { initials, formatDate } from '@/lib/utils'

export function TopBar() {
  const identity = useAuthStore((s) => s.identity)
  const displayName = identity?.displayName ?? 'Usuario'
  const role = identity?.username?.split('@')[1] ?? 'Salesforce'
  const photo = identity?.photoUrl
  const queryClient = useQueryClient()
  const fetching = useIsFetching()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar clientes, casos, oportunidades..."
          className="h-10 w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-chart-blue/50 focus:outline-none focus:ring-2 focus:ring-chart-blue/20"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => queryClient.invalidateQueries()}
          disabled={fetching > 0}
          className="group flex h-10 items-center gap-2 rounded-xl border border-border bg-card/40 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground disabled:opacity-60"
          title="Refrescar todos los datos"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${fetching > 0 ? 'animate-spin text-chart-blue' : ''}`} />
          <span className="hidden sm:inline">{fetching > 0 ? 'Sincronizando…' : 'Refrescar'}</span>
        </button>
        <FullscreenToggle />
        <AlertsBell />
        <div className="ml-2 flex items-center gap-3 rounded-xl border border-border bg-card/60 py-1.5 pl-1.5 pr-3">
          {photo ? (
            <img src={photo} alt={displayName} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-chart-blue to-chart-cyan text-xs font-semibold text-white">
              {initials(displayName)}
            </div>
          )}
          <div className="hidden text-left leading-tight sm:block">
            <div className="max-w-[140px] truncate text-xs font-semibold">{displayName}</div>
            <div className="max-w-[140px] truncate text-[11px] text-muted-foreground">{role}</div>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ───────────────────────── Fullscreen ───────────────────────── */

function FullscreenToggle() {
  const [isFs, setIsFs] = useState(() => !!document.fullscreenElement)

  useEffect(() => {
    const handler = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch (err) {
      console.warn('[Fullscreen] no permitido:', (err as Error).message)
    }
  }

  return (
    <button
      onClick={toggle}
      title={isFs ? 'Salir de pantalla completa' : 'Pantalla completa'}
      aria-label={isFs ? 'Salir de pantalla completa' : 'Pantalla completa'}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/40 text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
    >
      {isFs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
    </button>
  )
}

/* ───────────────────────── Alerts (Bell) ───────────────────────── */

function AlertsBell() {
  const { data, isLoading } = useBookAlerts()
  const alerts = data ?? []
  const count = alerts.length
  const navigate = useNavigate()

  const goToRecord = (alert: AlertItem) => {
    if (alert.accountId) navigate(`/customer/${alert.accountId}`)
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          title="Alertas"
          aria-label="Alertas"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/40 text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground data-[state=open]:border-chart-orange/50 data-[state=open]:text-foreground"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-chart-orange px-1 text-[10px] font-semibold text-white">
              {count}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[380px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 data-[state=open]:animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="font-display text-sm font-semibold">Alertas</div>
              <div className="text-[11px] text-muted-foreground">
                {count === 0 ? 'Sin alertas activas' : `${count} accionables del libro`}
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-orange/15 text-chart-orange">
              <Bell className="h-3.5 w-3.5" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cargando alertas…
            </div>
          ) : alerts.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground">
              Todo en orden. No hay casos prioritarios ni tareas vencidas.
            </div>
          ) : (
            <div className="max-h-[420px] divide-y divide-border overflow-y-auto scrollbar-thin">
              {alerts.map((a) => (
                <AlertRow key={a.id} alert={a} onClick={() => goToRecord(a)} />
              ))}
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

const ALERT_META: Record<
  AlertItem['type'],
  { icon: typeof AlertTriangle; tone: string; bg: string; label: string }
> = {
  case_high: { icon: Headphones, tone: 'text-chart-coral', bg: 'bg-chart-coral/15', label: 'Caso alta prioridad' },
  task_overdue: { icon: AlertTriangle, tone: 'text-chart-coral', bg: 'bg-chart-coral/15', label: 'Tarea vencida' },
  task_due_today: { icon: Clock, tone: 'text-chart-orange', bg: 'bg-chart-orange/15', label: 'Vence hoy' },
}

function AlertRow({ alert, onClick }: { alert: AlertItem; onClick: () => void }) {
  const meta = ALERT_META[alert.type]
  const Icon = meta.icon
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/40"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.tone}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${meta.tone}`}>
            {meta.label}
          </span>
          {alert.recordType === 'Task' ? (
            <CheckSquare className="h-3 w-3 text-muted-foreground/60" />
          ) : (
            <Headphones className="h-3 w-3 text-muted-foreground/60" />
          )}
        </div>
        <div className="truncate text-sm font-medium leading-tight text-foreground">{alert.title}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {alert.subtitle && <span className="truncate">{alert.subtitle}</span>}
          {alert.date && (
            <>
              {alert.subtitle && <span>·</span>}
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {formatDate(alert.date)}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  )
}
