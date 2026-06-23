import { useMemo } from 'react'
import { CalendarRange, Phone, Mail, Calendar as CalIcon, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import * as RT from '@radix-ui/react-tooltip'
import { useTasks } from '@/hooks/useCustomer'
import { PanelEmpty, PanelError, PanelLoading, InlineSpinner } from './PanelStates'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/salesforce'

type Tone = 'mint' | 'blue' | 'orange' | 'coral' | 'muted'

const statusTone: Record<string, Tone> = {
  Completed: 'mint',
  'In Progress': 'blue',
  Waiting: 'orange',
  Deferred: 'muted',
  'Not Started': 'orange',
}

const toneClasses: Record<Tone, { dot: string; ring: string; text: string; bg: string }> = {
  mint: {
    dot: 'bg-chart-mint',
    ring: 'ring-chart-mint/30',
    text: 'text-chart-mint',
    bg: 'bg-chart-mint/15',
  },
  blue: {
    dot: 'bg-chart-blue',
    ring: 'ring-chart-blue/30',
    text: 'text-chart-blue',
    bg: 'bg-chart-blue/15',
  },
  orange: {
    dot: 'bg-chart-orange',
    ring: 'ring-chart-orange/30',
    text: 'text-chart-orange',
    bg: 'bg-chart-orange/15',
  },
  coral: {
    dot: 'bg-chart-coral',
    ring: 'ring-chart-coral/30',
    text: 'text-chart-coral',
    bg: 'bg-chart-coral/15',
  },
  muted: {
    dot: 'bg-muted-foreground/40',
    ring: 'ring-white/10',
    text: 'text-muted-foreground',
    bg: 'bg-secondary/60',
  },
}

function kindFromSubject(subject: string): React.ComponentType<{ className?: string }> {
  const s = subject.toLowerCase()
  if (s.includes('llamada') || s.includes('call')) return Phone
  if (s.includes('email')) return Mail
  return CalIcon
}

interface PositionedTask {
  task: Task
  position: number
  daysFromToday: number
  tone: Tone
}

const TODAY_LABEL_MS = 86400000

export function ActivitiesTimeline() {
  const { data, isLoading, isError, error, refetch, isFetching } = useTasks()
  const tasks = data ?? []

  const { positioned, minDate, maxDate, todayPosition, monthMarkers } = useMemo(() => {
    const withDates = tasks.filter((t): t is Task & { ActivityDate: string } => Boolean(t.ActivityDate))
    if (withDates.length === 0) {
      return {
        positioned: [] as PositionedTask[],
        minDate: null as Date | null,
        maxDate: null as Date | null,
        todayPosition: null as number | null,
        monthMarkers: [] as { date: Date; position: number; label: string }[],
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dates = withDates.map((t) => new Date(t.ActivityDate).getTime())
    const minMs = Math.min(...dates, today.getTime())
    const maxMs = Math.max(...dates, today.getTime())

    // padding 5% a cada lado
    const padding = Math.max((maxMs - minMs) * 0.05, TODAY_LABEL_MS * 3)
    const startMs = minMs - padding
    const endMs = maxMs + padding
    const range = endMs - startMs

    const positioned: PositionedTask[] = withDates
      .map((task) => {
        const ms = new Date(task.ActivityDate).getTime()
        const position = ((ms - startMs) / range) * 100
        const daysFromToday = Math.round((ms - today.getTime()) / TODAY_LABEL_MS)
        const tone: Tone = statusTone[task.Status] ?? 'muted'
        return { task, position, daysFromToday, tone }
      })
      .sort((a, b) => a.position - b.position)

    const todayPosition = ((today.getTime() - startMs) / range) * 100

    const start = new Date(startMs)
    const end = new Date(endMs)
    const monthMarkers: { date: Date; position: number; label: string }[] = []
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cursor.getTime() <= end.getTime()) {
      const ms = cursor.getTime()
      const position = ((ms - startMs) / range) * 100
      if (position >= 0 && position <= 100) {
        monthMarkers.push({
          date: new Date(cursor),
          position,
          label: cursor.toLocaleString('es-AR', { month: 'short', year: '2-digit' }).replace('.', ''),
        })
      }
      cursor.setMonth(cursor.getMonth() + 1)
    }

    return {
      positioned,
      minDate: new Date(minMs),
      maxDate: new Date(maxMs),
      todayPosition,
      monthMarkers,
    }
  }, [tasks])

  return (
    <div className="rounded-2xl border border-border bg-card transition-colors hover:border-border/80">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-violet/15 text-chart-violet">
            <CalendarRange className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">Línea de tiempo de actividades</h3>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              {positioned.length} actividades con fecha
              {minDate && maxDate && ` · ${formatDate(minDate.toISOString())} → ${formatDate(maxDate.toISOString())}`}
              {isFetching && !isLoading && <InlineSpinner />}
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-3 text-[10px] text-muted-foreground sm:flex">
          <LegendDot tone="mint" label="Completada" />
          <LegendDot tone="blue" label="En curso" />
          <LegendDot tone="orange" label="Pendiente" />
        </div>
      </div>

      {isLoading ? (
        <PanelLoading rows={2} />
      ) : isError ? (
        <PanelError message={(error as Error)?.message ?? 'Error desconocido'} onRetry={() => refetch()} />
      ) : positioned.length === 0 ? (
        <PanelEmpty message="No hay actividades con fecha para graficar." icon={CalendarRange} />
      ) : (
        <RT.Provider delayDuration={150}>
          <div className="px-6 pb-12 pt-14">
            <div className="relative h-1">
              {/* Track — se "dibuja" de izquierda a derecha al cargar */}
              <div className="absolute inset-x-0 top-1/2 h-px origin-left -translate-y-1/2 animate-line-draw-x bg-border" />

              {/* Hoy marker — fade-in cuando la línea ya se dibujó */}
              {todayPosition !== null && todayPosition >= 0 && todayPosition <= 100 && (
                <div
                  className="absolute -top-12 -bottom-12 w-px animate-fade-in bg-gradient-to-b from-transparent via-chart-cyan/40 to-transparent"
                  style={{ left: `${todayPosition}%`, animationDelay: '700ms', animationFillMode: 'both' }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-chart-cyan/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-chart-cyan ring-1 ring-chart-cyan/30">
                    Hoy
                  </div>
                </div>
              )}

              {/* Month markers — fade-in escalonado */}
              {monthMarkers.map((m, i) => (
                <div
                  key={m.date.toISOString()}
                  className="absolute top-3 -translate-x-1/2 animate-fade-in text-[10px] uppercase tracking-wider text-muted-foreground/60"
                  style={{
                    left: `${m.position}%`,
                    animationDelay: `${500 + i * 60}ms`,
                    animationFillMode: 'both',
                  }}
                >
                  <div className="mx-auto mb-1 h-1.5 w-px bg-border" />
                  {m.label}
                </div>
              ))}

              {/* Task dots — pop-in escalonado por orden temporal */}
              {positioned.map(({ task, position, daysFromToday, tone }, i) => {
                const KindIcon = kindFromSubject(task.Subject ?? '')
                const StatusIcon =
                  task.Status === 'Completed'
                    ? CheckCircle2
                    : task.Status === 'In Progress'
                      ? Clock
                      : AlertCircle
                const t = toneClasses[tone]
                // Empieza después de que la línea se dibuje (~700ms) + escalonado por dot.
                const dotDelay = 700 + i * 80
                const isFuture = daysFromToday > 0 && task.Status !== 'Completed'
                return (
                  <RT.Root key={task.Id}>
                    <RT.Trigger asChild>
                      <button
                        className={cn(
                          'group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 animate-marker-pop transition-transform hover:scale-125 focus:outline-none',
                        )}
                        style={{ left: `${position}%`, animationDelay: `${dotDelay}ms` }}
                        aria-label={task.Subject ?? 'Actividad'}
                      >
                        <span
                          className={cn(
                            'relative block h-3 w-3 rounded-full ring-4 ring-offset-0',
                            t.dot,
                            t.ring,
                          )}
                        >
                          {/* Pulso suave para los items futuros pendientes */}
                          {isFuture && (
                            <span
                              aria-hidden
                              className={cn(
                                'absolute inset-0 -z-10 animate-marker-ring rounded-full',
                                t.dot,
                              )}
                              style={{ animationDelay: `${dotDelay + 400}ms` }}
                            />
                          )}
                        </span>
                        {task.Priority === 'High' && task.Status !== 'Completed' && (
                          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse-soft rounded-full bg-chart-coral ring-2 ring-card" />
                        )}
                      </button>
                    </RT.Trigger>
                    <RT.Portal>
                      <RT.Content
                        side="top"
                        sideOffset={12}
                        className="z-50 max-w-[280px] animate-fade-in rounded-xl border border-border bg-card/95 p-3.5 text-xs leading-relaxed text-foreground shadow-2xl backdrop-blur-xl"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', t.bg, t.text)}>
                            <KindIcon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="font-display text-[13px] font-semibold leading-tight">
                              {task.Subject ?? 'Sin asunto'}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium', t.bg, t.text)}>
                                <StatusIcon className="h-3 w-3" />
                                {task.Status}
                              </span>
                              {task.Priority === 'High' && (
                                <span className="rounded-md bg-chart-coral/15 px-1.5 py-0.5 text-[10px] font-medium text-chart-coral">
                                  Alta prioridad
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {formatDate(task.ActivityDate)} ·{' '}
                              {daysFromToday === 0
                                ? 'Hoy'
                                : daysFromToday > 0
                                  ? `En ${daysFromToday} día${daysFromToday === 1 ? '' : 's'}`
                                  : `Hace ${Math.abs(daysFromToday)} día${Math.abs(daysFromToday) === 1 ? '' : 's'}`}
                            </div>
                          </div>
                        </div>
                        <RT.Arrow className="fill-card/95" />
                      </RT.Content>
                    </RT.Portal>
                  </RT.Root>
                )
              })}
            </div>
          </div>
        </RT.Provider>
      )}
    </div>
  )
}

function LegendDot({ tone, label }: { tone: Tone; label: string }) {
  const t = toneClasses[tone]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full ring-2', t.dot, t.ring)} />
      {label}
    </span>
  )
}
