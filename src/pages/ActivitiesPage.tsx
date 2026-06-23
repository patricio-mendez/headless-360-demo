import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  CheckSquare,
  Users,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Activity,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { PanelLoading, PanelError } from '@/components/PanelStates'
import { useBookActivities } from '@/hooks/useBookOfBusiness'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

type TabKey = 'all' | 'tasks' | 'events'

interface TimelineItem {
  id: string
  type: 'task' | 'event'
  date: Date
  subject: string
  accountId: string | null
  accountName: string | null
  status?: string
  priority?: string
  location?: string | null
  isAllDay?: boolean
  endDate?: Date
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DOW_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function ActivitiesPage() {
  const { data, isLoading, isError, error, refetch } = useBookActivities()
  const tasks = data?.tasks ?? []
  const events = data?.events ?? []
  const [tab, setTab] = useState<TabKey>('all')
  // Cursor del calendario, comienza en mes actual.
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const items = useMemo<TimelineItem[]>(() => {
    const list: TimelineItem[] = []
    if (tab === 'all' || tab === 'tasks') {
      tasks.forEach((t) => {
        if (!t.ActivityDate && !t.CreatedDate) return
        list.push({
          id: t.Id,
          type: 'task',
          date: new Date(t.ActivityDate ?? t.CreatedDate),
          subject: t.Subject,
          accountId: t.AccountId,
          accountName: t.Account?.Name ?? null,
          status: t.Status,
          priority: t.Priority,
        })
      })
    }
    if (tab === 'all' || tab === 'events') {
      events.forEach((e) => {
        list.push({
          id: e.Id,
          type: 'event',
          date: new Date(e.StartDateTime),
          endDate: e.EndDateTime ? new Date(e.EndDateTime) : undefined,
          subject: e.Subject,
          accountId: e.AccountId,
          accountName: e.Account?.Name ?? null,
          location: e.Location,
          isAllDay: e.IsAllDayEvent,
        })
      })
    }
    return list.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [tasks, events, tab])

  const counts = useMemo(
    () => ({
      all: tasks.length + events.length,
      tasks: tasks.length,
      events: events.length,
    }),
    [tasks.length, events.length],
  )

  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <Activity className="h-3 w-3" />
              Engagement con clientes
            </div>
            <h1 className="font-display text-3xl font-bold">Actividades</h1>
            <p className="text-sm text-muted-foreground">
              {counts.all} actividades · {counts.tasks} tareas · {counts.events} eventos
            </p>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          <TabButton active={tab === 'all'} onClick={() => setTab('all')} label="Todas" count={counts.all} />
          <TabButton active={tab === 'tasks'} onClick={() => setTab('tasks')} label="Tareas" count={counts.tasks} icon={CheckSquare} />
          <TabButton active={tab === 'events'} onClick={() => setTab('events')} label="Eventos" count={counts.events} icon={CalendarIcon} />
        </div>

        {isLoading ? (
          <PanelLoading rows={6} />
        ) : isError ? (
          <PanelError
            message={(error as Error)?.message ?? 'Error al cargar actividades'}
            onRetry={() => refetch()}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,1.4fr)]">
            <Timeline items={items} />
            <CalendarView items={items} cursor={cursor} onCursorChange={setCursor} />
          </div>
        )}
      </div>
    </AppShell>
  )
}

/* ───────────────────────── Tabs ───────────────────────── */

function TabButton({
  active,
  onClick,
  label,
  count,
  icon: Icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-chart-blue text-chart-blue'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
          active ? 'bg-chart-blue/15 text-chart-blue' : 'bg-secondary text-muted-foreground/80',
        )}
      >
        {count}
      </span>
    </button>
  )
}

/* ───────────────────────── Timeline ───────────────────────── */

function Timeline({ items }: { items: TimelineItem[] }) {
  // Agrupar por mes (yyyy-mm).
  const grouped = useMemo(() => {
    const map = new Map<string, TimelineItem[]>()
    items.forEach((it) => {
      const key = `${it.date.getFullYear()}-${String(it.date.getMonth() + 1).padStart(2, '0')}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    })
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [items])

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <div className="font-display text-sm font-semibold">Línea de tiempo</div>
        <div className="text-[11px] text-muted-foreground">Pasadas y futuras, ordenadas por fecha</div>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          Sin actividades en este filtro.
        </div>
      ) : (
        <div className="max-h-[720px] overflow-y-auto scrollbar-thin">
          {(() => {
            // Index global incrementado entre meses para encadenar el delay.
            let globalIdx = 0
            return grouped.map(([month, monthItems]) => {
              const [year, m] = month.split('-')
              const label = `${MONTHS_ES[Number(m) - 1]} ${year}`
              return (
                <div key={month}>
                  <div className="animate-fade-in sticky top-0 z-[1] border-b border-t border-border bg-secondary/40 px-5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
                    {label}
                  </div>
                  <ul className="space-y-0">
                    {monthItems.map((it) => {
                      // Capturamos el delay actual y avanzamos. Tope ~36 items animados
                      // (≈1.4s total) — el resto entra sin delay para no esperar eternamente.
                      const delay = Math.min(globalIdx, 36) * 40
                      globalIdx += 1
                      return <TimelineRow key={it.id} item={it} delayMs={delay} />
                    })}
                  </ul>
                </div>
              )
            })
          })()}
        </div>
      )}
    </div>
  )
}

function TimelineRow({ item, delayMs = 0 }: { item: TimelineItem; delayMs?: number }) {
  const isTask = item.type === 'task'
  const isCompleted = item.status === 'Completed'
  const isHighPriority = item.priority === 'High'
  const isPast = item.date.getTime() < Date.now()
  const isFuture = !isPast

  // Tono del marker: Event=naranja, Task completed=mint, Task pendiente=violeta, Task alta priority pendiente=coral
  const tone = isTask
    ? isCompleted
      ? 'bg-chart-mint border-chart-mint/30'
      : isHighPriority
        ? 'bg-chart-coral border-chart-coral/30'
        : 'bg-chart-violet border-chart-violet/30'
    : 'bg-chart-orange border-chart-orange/30'

  // Color para el "ring" pulsante de items futuros — toma el color base del tone.
  const ringTone = isTask
    ? isHighPriority
      ? 'bg-chart-coral'
      : 'bg-chart-violet'
    : 'bg-chart-orange'

  return (
    <li className="relative flex gap-4 px-5 py-3 transition-colors hover:bg-secondary/40">
      {/* Línea vertical conectora — se "dibuja" desde arriba al cargar */}
      <div
        className="absolute bottom-0 left-[33px] top-0 w-px origin-top animate-line-draw bg-border"
        style={{ animationDelay: `${delayMs}ms` }}
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col items-center gap-1 pt-0.5">
        <span
          className={cn(
            'relative flex h-3.5 w-3.5 animate-marker-pop items-center justify-center rounded-full border-2 ring-2 ring-card',
            tone,
          )}
          style={{ animationDelay: `${delayMs + 150}ms` }}
        >
          {/* Ping suave solo para items futuros — efecto "pulso" para llamar la atención */}
          {isFuture && (
            <span
              aria-hidden
              className={cn(
                'absolute inset-0 -z-10 animate-marker-ring rounded-full',
                ringTone,
              )}
              style={{ animationDelay: `${delayMs + 600}ms` }}
            />
          )}
        </span>
      </div>
      <div
        className="min-w-0 flex-1 animate-timeline-in"
        style={{ animationDelay: `${delayMs + 100}ms` }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isTask ? (
              <CheckSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : (
              <CalendarIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
            <span
              className={cn(
                'text-[10px] font-semibold uppercase tracking-wider',
                isTask
                  ? isCompleted
                    ? 'text-chart-mint'
                    : isHighPriority
                      ? 'text-chart-coral'
                      : 'text-chart-violet'
                  : 'text-chart-orange',
              )}
            >
              {isTask ? (isCompleted ? 'Tarea completada' : `Tarea ${item.priority?.toLowerCase() ?? ''}`) : 'Evento'}
            </span>
          </div>
          <span className={cn('text-[11px]', isPast ? 'text-muted-foreground' : 'text-chart-blue')}>
            {formatDate(item.date.toISOString())}
          </span>
        </div>
        <div className="mt-0.5 truncate text-sm font-medium leading-tight">{item.subject}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          {item.accountName && item.accountId && (
            <Link
              to={`/customer/${item.accountId}`}
              className="inline-flex items-center gap-1 hover:text-chart-blue hover:underline"
            >
              <Users className="h-3 w-3" />
              {item.accountName}
            </Link>
          )}
          {item.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {item.location}
            </span>
          )}
          {item.type === 'event' && !item.isAllDay && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {item.date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              {item.endDate &&
                ` – ${item.endDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

/* ───────────────────────── Calendar ───────────────────────── */

function CalendarView({
  items,
  cursor,
  onCursorChange,
}: {
  items: TimelineItem[]
  cursor: Date
  onCursorChange: (d: Date) => void
}) {
  // Construir grilla 7x6 que comienza el domingo previo al primer día del mes.
  const cells = useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const startDay = firstOfMonth.getDay() // 0 = Sunday
    const gridStart = new Date(firstOfMonth)
    gridStart.setDate(firstOfMonth.getDate() - startDay)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      return d
    })
  }, [cursor])

  // Index items by yyyy-mm-dd.
  const byDay = useMemo(() => {
    const map = new Map<string, TimelineItem[]>()
    items.forEach((it) => {
      const key = it.date.toISOString().slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    })
    return map
  }, [items])

  const goPrev = () => onCursorChange(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
  const goNext = () => onCursorChange(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
  const goToday = () => {
    const now = new Date()
    onCursorChange(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  const todayKey = new Date().toISOString().slice(0, 10)
  const inCurrentMonth = (d: Date) => d.getMonth() === cursor.getMonth()

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <div className="font-display text-base font-semibold">
            {MONTHS_ES[cursor.getMonth()]} {cursor.getFullYear()}
          </div>
          <div className="text-[11px] text-muted-foreground">Vista mensual</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToday}
            className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Hoy
          </button>
          <button
            onClick={goPrev}
            aria-label="Mes anterior"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={goNext}
            aria-label="Mes siguiente"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Header de días */}
      <div className="grid grid-cols-7 border-b border-border bg-secondary/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {DOW_ES.map((d) => (
          <div key={d} className="px-2 py-2 text-center">
            {d}
          </div>
        ))}
      </div>

      {/* Grid de celdas */}
      <div className="grid grid-cols-7 grid-rows-6">
        {cells.map((d, i) => {
          const key = d.toISOString().slice(0, 10)
          const dayItems = byDay.get(key) ?? []
          const isCurr = inCurrentMonth(d)
          const isToday = key === todayKey
          const isWeekend = d.getDay() === 0 || d.getDay() === 6
          return (
            <div
              key={i}
              className={cn(
                'min-h-[88px] border-b border-r border-border p-1.5 last:border-r-0',
                !isCurr && 'bg-secondary/20',
                i % 7 === 6 && 'border-r-0',
                i >= 35 && 'border-b-0',
                isToday && 'bg-chart-blue/5',
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                    isToday
                      ? 'bg-chart-blue text-white'
                      : isCurr
                        ? isWeekend
                          ? 'text-chart-coral/70'
                          : 'text-foreground'
                        : 'text-muted-foreground/40',
                  )}
                >
                  {d.getDate()}
                </span>
                {dayItems.length > 3 && (
                  <span className="text-[9px] font-medium text-muted-foreground">
                    +{dayItems.length - 3}
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                {dayItems.slice(0, 3).map((it) => (
                  <CalendarPill key={it.id} item={it} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CalendarPill({ item }: { item: TimelineItem }) {
  const isTask = item.type === 'task'
  const isCompleted = item.status === 'Completed'
  const isHigh = item.priority === 'High'

  const tone = isTask
    ? isCompleted
      ? 'bg-chart-mint/20 text-chart-mint hover:bg-chart-mint/30'
      : isHigh
        ? 'bg-chart-coral/20 text-chart-coral hover:bg-chart-coral/30'
        : 'bg-chart-violet/20 text-chart-violet hover:bg-chart-violet/30'
    : 'bg-chart-orange/20 text-chart-orange hover:bg-chart-orange/30'

  const tooltip = `${item.subject}${item.accountName ? ' · ' + item.accountName : ''}`

  const Body = (
    <span
      title={tooltip}
      className={cn(
        'block truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight transition-colors',
        tone,
      )}
    >
      {item.subject}
    </span>
  )

  if (item.accountId) {
    return (
      <Link to={`/customer/${item.accountId}`} className="block">
        {Body}
      </Link>
    )
  }
  return Body
}

