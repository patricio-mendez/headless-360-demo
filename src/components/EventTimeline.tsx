import { useMemo } from 'react'
import { Phone, Mail, Calendar as CalIcon, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import * as RT from '@radix-ui/react-tooltip'
import { useTasks } from '@/hooks/useCustomer'
import { useMarketingInteractions, parseInteractionTs, type MarketingInteraction } from '@/hooks/useMarketingInteractions'
import { channelPresentation, channelToneClasses } from '@/lib/interactionChannels'
import { InteractionTooltipContent } from './interactionShared'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/salesforce'

export type Tone = 'mint' | 'blue' | 'orange' | 'coral' | 'muted'

export const statusTone: Record<string, Tone> = {
  Completed: 'mint',
  'In Progress': 'blue',
  Waiting: 'orange',
  Deferred: 'muted',
  'Not Started': 'orange',
}

export const toneClasses: Record<Tone, { dot: string; ring: string; text: string; bg: string }> = {
  mint: { dot: 'bg-chart-mint', ring: 'ring-chart-mint/30', text: 'text-chart-mint', bg: 'bg-chart-mint/15' },
  blue: { dot: 'bg-chart-blue', ring: 'ring-chart-blue/30', text: 'text-chart-blue', bg: 'bg-chart-blue/15' },
  orange: { dot: 'bg-chart-orange', ring: 'ring-chart-orange/30', text: 'text-chart-orange', bg: 'bg-chart-orange/15' },
  coral: { dot: 'bg-chart-coral', ring: 'ring-chart-coral/30', text: 'text-chart-coral', bg: 'bg-chart-coral/15' },
  muted: { dot: 'bg-muted-foreground/40', ring: 'ring-white/10', text: 'text-muted-foreground', bg: 'bg-secondary/60' },
}

function kindFromSubject(subject: string): React.ComponentType<{ className?: string }> {
  const s = subject.toLowerCase()
  if (s.includes('llamada') || s.includes('call')) return Phone
  if (s.includes('email')) return Mail
  return CalIcon
}

/** Evento unificado del timeline: task de Salesforce o interacción de marketing. */
export type TimelineEvent =
  | { kind: 'task'; id: string; ms: number; task: Task }
  | { kind: 'interaction'; id: string; ms: number; it: MarketingInteraction }

/**
 * Fuente única de eventos del timeline por cliente: mergea Tasks (Salesforce) +
 * interacciones de marketing (Data Cloud). La consumen tanto el timeline colapsado
 * del dashboard como el drawer maximizado → los conteos y puntos SIEMPRE coinciden.
 */
export function useTimelineEvents() {
  const tasksQ = useTasks()
  const interactionsQ = useMarketingInteractions()

  const events = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = []
    ;(tasksQ.data ?? []).forEach((t) => {
      if (!t.ActivityDate) return
      list.push({ kind: 'task', id: t.Id, ms: new Date(t.ActivityDate).getTime(), task: t })
    })
    ;(interactionsQ.data?.interactions ?? []).forEach((it) => {
      list.push({ kind: 'interaction', id: it.id, ms: parseInteractionTs(it.interactionTs).getTime(), it })
    })
    return list.sort((a, b) => b.ms - a.ms)
  }, [tasksQ.data, interactionsQ.data])

  return {
    events,
    interactions: interactionsQ.data?.interactions ?? [],
    isLoading: tasksQ.isLoading || interactionsQ.isLoading,
    isError: tasksQ.isError || interactionsQ.isError,
    error: (tasksQ.error ?? interactionsQ.error) as Error | null,
    isFetching: tasksQ.isFetching || interactionsQ.isFetching,
    refetch: () => {
      tasksQ.refetch()
      interactionsQ.refetch()
    },
  }
}

const TODAY_LABEL_MS = 86400000

interface PositionedDot {
  ev: TimelineEvent
  position: number
  daysFromToday: number
  dateLabel: string | null
}

/**
 * Timeline horizontal reusable. Eje = secuencia cronológica de eventos (equiespaciado,
 * misma estética que la curva del drawer): cada evento ocupa un slot, sin solapamientos.
 * `selectedId`/`onSelect` habilitan la selección (usado en el drawer).
 */
export function EventTimeline({
  events,
  selectedId = null,
  onSelect,
}: {
  events: TimelineEvent[]
  selectedId?: string | null
  onSelect?: (id: string) => void
}) {
  const { dots } = useMemo(() => {
    if (events.length === 0) return { dots: [] as PositionedDot[] }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Orden cronológico ascendente → un slot equiespaciado por evento.
    const sorted = [...events].sort((a, b) => a.ms - b.ms)
    const n = sorted.length
    // Margen a los lados para que el primer/último dot no toquen el borde.
    const L = 3
    const R = 97
    const fmt = (ms: number) => new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(new Date(ms)).replace('.', '')
    // Mostrar labels salteados si hay muchos, para no saturar.
    const labelStep = n <= 12 ? 1 : Math.ceil(n / 10)

    const dots: PositionedDot[] = sorted.map((ev, i) => ({
      ev,
      position: n <= 1 ? 50 : L + (i / (n - 1)) * (R - L),
      daysFromToday: Math.round((ev.ms - today.getTime()) / TODAY_LABEL_MS),
      dateLabel: i % labelStep === 0 || i === n - 1 ? fmt(ev.ms) : null,
    }))

    return { dots }
  }, [events])

  return (
    <RT.Provider delayDuration={150}>
      <div className="px-6 pb-12 pt-14">
        <div className="relative h-1">
          <div className="absolute inset-x-0 top-1/2 h-px origin-left -translate-y-1/2 animate-line-draw-x bg-border" />

          {/* Marcador "Hoy" al borde derecho (los eventos van hasta hoy o antes). */}
          <div
            className="absolute -top-12 -bottom-12 right-0 w-px animate-fade-in bg-gradient-to-b from-transparent via-chart-cyan/40 to-transparent"
            style={{ animationDelay: '700ms', animationFillMode: 'both' }}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-chart-cyan/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-chart-cyan ring-1 ring-chart-cyan/30">
              Hoy
            </div>
          </div>

          {/* Labels de fecha por slot (debajo de la línea) */}
          {dots.map((dot, i) =>
            dot.dateLabel ? (
              <div
                key={`lbl-${dot.ev.id}`}
                className="absolute top-3 -translate-x-1/2 animate-fade-in text-[10px] uppercase tracking-wider text-muted-foreground/60"
                style={{ left: `${dot.position}%`, animationDelay: `${500 + i * 30}ms`, animationFillMode: 'both' }}
              >
                <div className="mx-auto mb-1 h-1.5 w-px bg-border" />
                {dot.dateLabel}
              </div>
            ) : null,
          )}

          {dots.map((dot, i) => {
            const dotDelay = 700 + i * 60
            const dimmed = selectedId != null && dot.ev.id !== selectedId
            const isSelected = selectedId != null && dot.ev.id === selectedId
            return dot.ev.kind === 'task' ? (
              <TaskDot key={`t-${dot.ev.id}`} dot={dot} delay={dotDelay} dimmed={dimmed} isSelected={isSelected} onSelect={onSelect} />
            ) : (
              <InteractionDot key={`i-${dot.ev.id}`} dot={dot} delay={dotDelay} dimmed={dimmed} isSelected={isSelected} onSelect={onSelect} />
            )
          })}
        </div>
      </div>
    </RT.Provider>
  )
}

function TaskDot({
  dot,
  delay,
  dimmed,
  isSelected,
  onSelect,
}: {
  dot: PositionedDot
  delay: number
  dimmed: boolean
  isSelected: boolean
  onSelect?: (id: string) => void
}) {
  if (dot.ev.kind !== 'task') return null
  const { task } = dot.ev
  const { position, daysFromToday } = dot
  const tone: Tone = statusTone[task.Status] ?? 'muted'
  const KindIcon = kindFromSubject(task.Subject ?? '')
  const StatusIcon = task.Status === 'Completed' ? CheckCircle2 : task.Status === 'In Progress' ? Clock : AlertCircle
  const t = toneClasses[tone]
  const isFuture = daysFromToday > 0 && task.Status !== 'Completed'
  return (
    <RT.Root>
      <RT.Trigger asChild>
        <button
          className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 animate-marker-pop transition-all hover:scale-125 focus:outline-none"
          style={{ left: `${position}%`, animationDelay: `${delay}ms`, opacity: dimmed ? 0.3 : 1 }}
          onClick={() => onSelect?.(task.Id)}
          aria-label={task.Subject ?? 'Actividad'}
        >
          <span
            className={cn(
              'relative block h-3 w-3 rounded-full ring-4 ring-offset-0',
              t.dot,
              isSelected ? 'ring-foreground/40 scale-125' : t.ring,
            )}
          >
            {isFuture && (
              <span
                aria-hidden
                className={cn('absolute inset-0 -z-10 animate-marker-ring rounded-full', t.dot)}
                style={{ animationDelay: `${delay + 400}ms` }}
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
          className="z-[80] max-w-[280px] animate-fade-in rounded-xl border border-border bg-card/95 p-3.5 text-xs leading-relaxed text-foreground shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-start gap-2.5">
            <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', t.bg, t.text)}>
              <KindIcon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="font-display text-[13px] font-semibold leading-tight">{task.Subject ?? 'Sin asunto'}</div>
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
}

function InteractionDot({
  dot,
  delay,
  dimmed,
  isSelected,
  onSelect,
}: {
  dot: PositionedDot
  delay: number
  dimmed: boolean
  isSelected: boolean
  onSelect?: (id: string) => void
}) {
  if (dot.ev.kind !== 'interaction') return null
  const { it } = dot.ev
  const { position } = dot
  const pres = channelPresentation[it.channel]
  const tone = channelToneClasses[pres.tone]
  return (
    <RT.Root>
      <RT.Trigger asChild>
        <button
          className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 animate-marker-pop transition-all hover:scale-125 focus:outline-none"
          style={{ left: `${position}%`, animationDelay: `${delay}ms`, opacity: dimmed ? 0.3 : 1 }}
          onClick={() => onSelect?.(it.id)}
          aria-label={it.subject}
        >
          {/* Interacciones: rombo (cuadrado rotado) para diferenciarlas de las tasks (redondas) */}
          <span
            className={cn(
              'relative block h-2.5 w-2.5 rotate-45 rounded-[3px] ring-4 ring-offset-0',
              tone.dot,
              isSelected ? 'ring-foreground/40 scale-125' : tone.ring,
            )}
          />
        </button>
      </RT.Trigger>
      <RT.Portal>
        <RT.Content
          side="top"
          sideOffset={12}
          className="z-[80] max-w-[280px] animate-fade-in rounded-xl border border-border bg-card/95 p-3.5 text-xs leading-relaxed text-foreground shadow-2xl backdrop-blur-xl"
        >
          <InteractionTooltipContent it={it} />
          <RT.Arrow className="fill-card/95" />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  )
}

export function LegendDot({ tone, label }: { tone: Tone; label: string }) {
  const t = toneClasses[tone]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full ring-2', t.dot, t.ring)} />
      {label}
    </span>
  )
}

export function LegendChannelDot({ tone, label }: { tone: 'violet' | 'cyan' | 'mint'; label: string }) {
  const t = channelToneClasses[tone]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rotate-45 rounded-[2px] ring-2', t.dot, t.ring)} />
      {label}
    </span>
  )
}
