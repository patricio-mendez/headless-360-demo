import { useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as RT from '@radix-ui/react-tooltip'
import {
  X,
  Database,
  Sparkles,
  Radar,
  TrendingUp,
  ListRestart,
  CalendarCheck,
  Megaphone,
  Mail,
  MessageCircle,
  MessageSquare,
  Globe,
  type LucideIcon,
} from 'lucide-react'
import {
  engagementBucket,
  parseInteractionTs,
  type MarketingInteraction,
  type EngagementBucket,
  type InteractionChannel,
} from '@/hooks/useMarketingInteractions'
import {
  useTimelineEvents,
  LegendDot,
  LegendChannelDot,
  statusTone,
  toneClasses,
  type TimelineEvent,
} from './EventTimeline'
import { InteractionRow, InteractionTooltipContent } from './interactionShared'
import { channelPresentation, channelToneClasses } from '@/lib/interactionChannels'
import { PanelLoading, PanelError, PanelEmpty } from './PanelStates'
import { DataTooltip } from './Tooltip'
import { cn } from '@/lib/utils'

interface InteractionsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type BucketFilter = 'all' | EngagementBucket
type ChannelFilter = 'all' | InteractionChannel | 'activity'

// Paleta de acento por chip: [activo bg, activo text, ícono/borde inactivo, ring]
type ChipAccent = 'neutral' | 'violet' | 'cyan' | 'mint' | 'orange'

const chipAccent: Record<ChipAccent, { activeBg: string; activeText: string; dot: string; text: string; ring: string }> = {
  neutral: { activeBg: 'bg-foreground', activeText: 'text-background', dot: 'bg-muted-foreground/50', text: 'text-muted-foreground', ring: 'ring-foreground/30' },
  violet: { activeBg: 'bg-chart-violet', activeText: 'text-white', dot: 'bg-chart-violet', text: 'text-chart-violet', ring: 'ring-chart-violet/40' },
  cyan: { activeBg: 'bg-chart-cyan', activeText: 'text-white', dot: 'bg-chart-cyan', text: 'text-chart-cyan', ring: 'ring-chart-cyan/40' },
  mint: { activeBg: 'bg-chart-mint', activeText: 'text-white', dot: 'bg-chart-mint', text: 'text-chart-mint', ring: 'ring-chart-mint/40' },
  orange: { activeBg: 'bg-chart-orange', activeText: 'text-white', dot: 'bg-chart-orange', text: 'text-chart-orange', ring: 'ring-chart-orange/40' },
}

const CHANNEL_FILTERS: { key: ChannelFilter; label: string; accent: ChipAccent; icon?: LucideIcon }[] = [
  { key: 'all', label: 'Todos', accent: 'neutral' },
  { key: 'Campaign', label: 'Campaña', accent: 'violet', icon: Megaphone },
  { key: 'Email', label: 'Email', accent: 'violet', icon: Mail },
  { key: 'WhatsApp', label: 'WhatsApp', accent: 'mint', icon: MessageCircle },
  { key: 'SMS', label: 'SMS', accent: 'mint', icon: MessageSquare },
  { key: 'Web', label: 'Web', accent: 'cyan', icon: Globe },
  { key: 'activity', label: 'Actividad', accent: 'mint', icon: CalendarCheck },
]

const BUCKET_FILTERS: { key: BucketFilter; label: string; accent: ChipAccent }[] = [
  { key: 'all', label: 'Todo', accent: 'neutral' },
  { key: 'responded', label: 'Respondió', accent: 'mint' },
  { key: 'sent', label: 'Solo enviado', accent: 'neutral' },
  { key: 'abandoned', label: 'Abandonó', accent: 'orange' },
]

export function InteractionsDrawer({ open, onOpenChange }: InteractionsDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        {/* Pantalla completa. z-[70] queda por encima del botón flotante del agente (z-[60]). */}
        <Dialog.Content className="fixed inset-0 z-[70] flex w-screen max-w-none flex-col overflow-hidden bg-background shadow-2xl data-[state=open]:animate-slide-up focus:outline-none">
          {open && <DrawerBody />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DrawerBody() {
  const { events, interactions, isLoading, isError, error, refetch } = useTimelineEvents()
  const [bucket, setBucket] = useState<BucketFilter>('all')
  const [channel, setChannel] = useState<ChannelFilter>('all')
  // Evento seleccionado en el timeline → la lista de abajo muestra solo ese.
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ── Filtrado unificado (gráfico + lista usan lo mismo) ──
  // Reglas del filtro de Canal:
  //   'all'       → interacciones (según bucket) + actividades (si bucket='all')
  //   'activity'  → solo actividades (las tasks no tienen bucket → ignora Respuesta)
  //   <un canal>  → solo interacciones de ese canal (según bucket), sin actividades
  const showInteractions = channel !== 'activity'
  const showTasks = channel === 'all' || channel === 'activity'

  const filteredInteractions = useMemo(
    () =>
      !showInteractions
        ? []
        : interactions.filter(
            (it) =>
              (bucket === 'all' || engagementBucket(it.interactionType) === bucket) &&
              (channel === 'all' || it.channel === channel),
          ),
    [interactions, bucket, channel, showInteractions],
  )

  const filteredTasks = useMemo(
    () =>
      showTasks
        ? events.filter((e): e is Extract<TimelineEvent, { kind: 'task' }> => e.kind === 'task')
        : [],
    [events, showTasks],
  )

  const bucketCounts = useMemo(() => {
    const c = { all: interactions.length, responded: 0, sent: 0, abandoned: 0 } as Record<BucketFilter, number>
    interactions.forEach((it) => {
      c[engagementBucket(it.interactionType)]++
    })
    return c
  }, [interactions])

  const taskTotal = useMemo(() => events.filter((e) => e.kind === 'task').length, [events])

  const channelCounts = useMemo(() => {
    const c: Record<string, number> = { all: events.length, activity: taskTotal }
    interactions.forEach((it) => {
      c[it.channel] = (c[it.channel] ?? 0) + 1
    })
    return c
  }, [interactions, events.length, taskTotal])

  // Lista unificada, ordenada por fecha desc (interacciones filtradas + tasks filtradas).
  const filteredEvents = useMemo(() => {
    const intIds = new Set(filteredInteractions.map((it) => it.id))
    const taskIds = new Set(filteredTasks.map((t) => t.id))
    return events.filter((ev) => (ev.kind === 'interaction' ? intIds.has(ev.id) : taskIds.has(ev.task.Id)))
  }, [events, filteredInteractions, filteredTasks])

  // La selección puede ser una interacción o una actividad.
  const selectedVisible = selectedId != null && filteredEvents.some((ev) => ev.id === selectedId)
  const listItems = selectedVisible ? filteredEvents.filter((ev) => ev.id === selectedId) : filteredEvents
  const hasSelection = selectedVisible

  const minMs = events.length ? Math.min(...events.map((e) => e.ms)) : null
  const maxMs = events.length ? Math.max(...events.map((e) => e.ms)) : null

  return (
    <>
      {/* Header */}
      <div className="relative shrink-0 overflow-hidden border-b border-border">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-chart-violet/30 via-chart-cyan/20 to-chart-mint/30" />
        <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-chart-violet/20 blur-3xl" />
        <div className="relative flex items-start justify-between p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-chart-violet to-chart-cyan shadow-xl">
              <Radar className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1.5 pt-1">
              <Dialog.Title asChild>
                <h2 className="font-display text-2xl font-bold leading-tight">Timeline de interacciones y actividades</h2>
              </Dialog.Title>
              <Dialog.Description asChild>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <DataTooltip
                    title="Powered by Data Cloud + BFF"
                    description="Actividades de Salesforce + interacciones multicanal unificadas en Data Cloud. En producción el engagement lo alimentan Marketing Cloud Next (campañas/email), Digital Engagement (WhatsApp/SMS) y el Web SDK (cumulusbank.cl). El Worker BFF ejecuta SQL contra el DMO marketing_interactions__dlm."
                    source="Cloudflare Worker → Data Cloud Query API v2"
                    side="bottom"
                  >
                    <span className="inline-flex cursor-help items-center gap-1 rounded-md bg-chart-orange/15 px-2 py-0.5 font-semibold text-chart-orange ring-1 ring-chart-orange/30">
                      <Database className="h-3 w-3" /> BFF · Data Cloud
                    </span>
                  </DataTooltip>
                  <span className="inline-flex items-center gap-1 rounded-md bg-chart-violet/15 px-2 py-0.5 font-medium text-chart-violet">
                    <Sparkles className="h-3 w-3" /> MC Next · Digital Engagement · Web SDK
                  </span>
                </div>
              </Dialog.Description>
            </div>
          </div>
          <Dialog.Close asChild>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </div>
      </div>

      {/* Body scrollable */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <PanelLoading rows={4} />
        ) : isError ? (
          <PanelError message={error?.message ?? 'Error desconocido'} onRetry={() => refetch()} />
        ) : events.length === 0 ? (
          <PanelEmpty message="No hay eventos para este cliente." icon={Radar} />
        ) : (
          <div className="mx-auto max-w-[1400px] space-y-6 p-6">
            {/* Resumen del rango */}
            <p className="text-xs text-muted-foreground">
              {events.length} eventos con fecha
              {minMs && maxMs && ` · ${fmt(minMs)} → ${fmt(maxMs)}`}
            </p>

            {/* Filtros de engagement (aplican a curva + lista) */}
            <FilterRow label="Canal">
              {CHANNEL_FILTERS.map((f) => (
                <FilterChip
                  key={f.key}
                  active={channel === f.key}
                  count={channelCounts[f.key] ?? 0}
                  accent={f.accent}
                  icon={f.icon}
                  onClick={() => setChannel(f.key)}
                >
                  {f.label}
                </FilterChip>
              ))}
            </FilterRow>
            <FilterRow label="Respuesta">
              {BUCKET_FILTERS.map((f) => (
                <FilterChip
                  key={f.key}
                  active={bucket === f.key}
                  count={bucketCounts[f.key]}
                  accent={f.accent}
                  onClick={() => setBucket(f.key)}
                >
                  {f.label}
                </FilterChip>
              ))}
            </FilterRow>

            {/* Curva de engagement score + banda de actividades al pie.
                Recibe las tasks FILTRADAS → gráfico y lista siempre coinciden. */}
            <EngagementCurve
              interactions={filteredInteractions}
              tasks={filteredTasks}
              selectedId={selectedVisible ? selectedId : null}
              onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
            />

            {/* Lista detallada — interacciones + actividades */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-muted-foreground">
                  {hasSelection ? 'Evento seleccionado' : 'Detalle de eventos'}
                  <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-medium">{listItems.length}</span>
                </h3>
                {hasSelection && (
                  <button
                    onClick={() => setSelectedId(null)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <ListRestart className="h-3.5 w-3.5" /> Ver todos
                  </button>
                )}
              </div>
              {listItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No hay eventos que coincidan con los filtros.
                </p>
              ) : (
                listItems.map((ev) =>
                  ev.kind === 'interaction' ? (
                    <InteractionRow key={ev.id} it={ev.it} highlighted={ev.id === selectedId} />
                  ) : (
                    <TaskRow key={ev.id} task={ev.task} highlighted={ev.id === selectedId} />
                  ),
                )
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function fmt(ms: number): string {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ms))
}

/* ── Fila de una actividad (task) en la lista detallada ── */
function TaskRow({
  task,
  highlighted = false,
}: {
  task: Extract<TimelineEvent, { kind: 'task' }>['task']
  highlighted?: boolean
}) {
  const tone = toneClasses[statusTone[task.Status] ?? 'muted']
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border bg-card p-3.5 transition-colors',
        highlighted ? cn('border-transparent ring-2', tone.ring) : 'border-border hover:border-border/60',
      )}
    >
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tone.bg, tone.text)}>
        <CalendarCheck className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-display text-sm font-semibold leading-tight">{task.Subject ?? 'Actividad'}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {task.ActivityDate
              ? new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(task.ActivityDate))
              : '—'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium', tone.bg, tone.text)}>
            Actividad · {task.Status}
          </span>
          {task.Priority === 'High' && task.Status !== 'Completed' && (
            <span className="rounded-md bg-chart-coral/15 px-1.5 py-0.5 text-[10px] font-medium text-chart-coral">
              Alta prioridad
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground/70">Fuente: Salesforce · Actividad</p>
      </div>
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</span>
      {children}
    </div>
  )
}

function FilterChip({
  active,
  count,
  accent,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean
  count: number
  accent: ChipAccent
  icon?: LucideIcon
  onClick: () => void
  children: React.ReactNode
}) {
  const a = chipAccent[accent]
  return (
    <button
      onClick={onClick}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-all duration-200',
        active
          ? cn(a.activeBg, a.activeText, 'ring-transparent shadow-sm')
          : 'bg-secondary/50 text-muted-foreground ring-border/60 hover:bg-secondary hover:text-foreground hover:ring-border',
      )}
    >
      {/* Ícono del canal, o punto de color para chips sin ícono (buckets / "Todos") */}
      {Icon ? (
        <Icon className={cn('h-3.5 w-3.5', active ? '' : a.text)} />
      ) : (
        <span className={cn('h-2 w-2 rounded-full', active ? 'bg-current opacity-70' : a.dot)} />
      )}
      <span>{children}</span>
      <span
        className={cn(
          'rounded-full px-1.5 text-[10px] font-semibold tabular-nums',
          active ? 'bg-black/15 text-current' : 'bg-background/70 text-muted-foreground',
        )}
      >
        {count}
      </span>
    </button>
  )
}

/* ── Curva de engagement (SVG inline). Eje X = secuencia cronológica de eventos
 *    (equiespaciado, sin huecos de tiempo real). La línea conecta las interacciones
 *    por su score; las actividades (tasks) van como triángulos en la banda al pie,
 *    intercaladas en el mismo orden temporal. ── */
function EngagementCurve({
  interactions,
  tasks,
  selectedId,
  onSelect,
}: {
  interactions: MarketingInteraction[]
  tasks: Extract<TimelineEvent, { kind: 'task' }>[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  // Todos los eventos (interacciones + tasks) ordenados cronológicamente → un slot por evento.
  const slots = useMemo(() => {
    type Slot =
      | { kind: 'interaction'; ms: number; it: MarketingInteraction }
      | { kind: 'task'; ms: number; task: Extract<TimelineEvent, { kind: 'task' }>['task'] }
    const list: Slot[] = [
      ...interactions.map((it) => ({ kind: 'interaction' as const, ms: parseInteractionTs(it.interactionTs).getTime(), it })),
      ...tasks.map((t) => ({ kind: 'task' as const, ms: t.ms, task: t.task })),
    ]
    return list.sort((a, b) => a.ms - b.ms)
  }, [interactions, tasks])

  // Sin ningún evento visible → placeholder.
  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground">No hay eventos que coincidan con los filtros.</p>
      </div>
    )
  }
  // La curva de score requiere ≥2 interacciones; si no, se muestra solo la banda de actividades.
  const hasCurve = interactions.length >= 2

  const W = 1000
  const H = 300
  const PAD = { top: 24, right: 24, bottom: 64, left: 36 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const bandY = PAD.top + innerH + 30

  const n = slots.length
  // Posición X por índice (equiespaciado). Con 1 slot cae al centro.
  const x = (i: number) => (n <= 1 ? PAD.left + innerW / 2 : PAD.left + (i / (n - 1)) * innerW)
  const y = (score: number) => PAD.top + (1 - score / 100) * innerH

  const fmtShort = (ms: number) =>
    new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(new Date(ms)).replace('.', '')

  // Coords de las interacciones (para la línea/área) en el eje de secuencia.
  const intCoords = slots
    .map((s, i) => (s.kind === 'interaction' ? { px: x(i), py: y(s.it.engagementScore), it: s.it } : null))
    .filter((c): c is { px: number; py: number; it: MarketingInteraction } => c != null)

  const linePath = intCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.px.toFixed(1)} ${c.py.toFixed(1)}`).join(' ')
  // Longitud aproximada de la línea (suma de segmentos) para animar el "trazado".
  const lineLen = intCoords.reduce((acc, c, i) => {
    if (i === 0) return 0
    const p = intCoords[i - 1]
    return acc + Math.hypot(c.px - p.px, c.py - p.py)
  }, 0)
  const areaPath =
    intCoords.length >= 2
      ? `${linePath} L ${intCoords[intCoords.length - 1].px.toFixed(1)} ${PAD.top + innerH} L ${intCoords[0].px.toFixed(1)} ${PAD.top + innerH} Z`
      : ''

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-mint/15 text-chart-mint">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold">Evolución del interés</h3>
            <p className="text-[11px] text-muted-foreground">
              Curva = engagement score · <span className="text-muted-foreground/80">● actividades</span> · eje = secuencia de eventos
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-3 text-[10px] text-muted-foreground sm:flex">
          <LegendChannelDot tone="violet" label="Campaña" />
          <LegendChannelDot tone="cyan" label="Web" />
          <LegendChannelDot tone="mint" label="Mensaje" />
          <LegendDot tone="mint" label="Actividad" />
        </div>
      </div>
      <RT.Provider delayDuration={100}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Evolución del engagement por secuencia de eventos">
          {/* Gridlines horizontales 0/50/100 */}
          {[0, 50, 100].map((gl) => (
            <g key={gl}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(gl)} y2={y(gl)} className="stroke-border" strokeDasharray="3 4" strokeWidth={1} />
              <text x={4} y={y(gl) + 3} className="fill-muted-foreground text-[9px]">
                {gl}
              </text>
            </g>
          ))}
          {/* Área + línea de engagement (área sube con fade, línea se traza de izq→der) */}
          {hasCurve && areaPath && <path d={areaPath} className="animate-area-rise fill-chart-mint/10" />}
          {hasCurve && (
            <path
              d={linePath}
              className="animate-draw-path fill-none stroke-chart-mint"
              strokeWidth={2}
              strokeLinejoin="round"
              style={{ ['--path-len' as string]: lineLen, strokeDasharray: lineLen, strokeDashoffset: 0 }}
            />
          )}

          {/* Banda de actividades */}
          <line x1={PAD.left} x2={W - PAD.right} y1={bandY} y2={bandY} className="stroke-border" strokeWidth={1} />
          <text x={4} y={bandY + 3} className="fill-muted-foreground text-[8px] uppercase tracking-wider">
            act
          </text>

          {/* Marcadores por slot (interacción = círculo con score, task = triángulo en banda) + label de fecha */}
          {slots.map((s, i) => {
            const px = x(i)
            const id = s.kind === 'interaction' ? s.it.id : s.task.Id
            const isSelected = selectedId === id
            const dimmed = selectedId != null && !isSelected

            // Label de fecha: mostrar salteado si hay muchos slots para no saturar.
            const showLabel = n <= 14 || i % Math.ceil(n / 12) === 0

            if (s.kind === 'interaction') {
              const pres = channelPresentation[s.it.channel]
              const tone = channelToneClasses[pres.tone]
              const fill = tone.dot.replace('bg-', 'fill-')
              const stroke = tone.dot.replace('bg-', 'stroke-')
              const py = y(s.it.engagementScore)
              return (
                <g key={id}>
                  {/* guía vertical tenue del slot */}
                  <line x1={px} x2={px} y1={py} y2={bandY} className="stroke-border/30" strokeWidth={1} />
                  <RT.Root>
                    <RT.Trigger asChild>
                      <g
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer focus:outline-none"
                        onClick={() => onSelect(s.it.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSelect(s.it.id)
                          }
                        }}
                        style={{ opacity: dimmed ? 0.35 : 1, transition: 'opacity 150ms' }}
                        aria-label={`${s.it.subject} — seleccionar`}
                        aria-pressed={isSelected}
                      >
                        {/* halo de selección: glow que respira */}
                        {isSelected && (
                          <circle cx={px} cy={py} r={13} className={cn('animate-select-pulse', fill)} style={{ transformOrigin: `${px}px ${py}px` }} />
                        )}
                        <circle cx={px} cy={py} r={12} fill="transparent" />
                        {/* dot con pop-in escalonado siguiendo el trazado de la línea */}
                        <g
                          className="animate-marker-pop"
                          style={{ animationDelay: `${300 + i * (900 / Math.max(n - 1, 1))}ms`, transformOrigin: `${px}px ${py}px` }}
                        >
                          <circle
                            cx={px}
                            cy={py}
                            r={isSelected ? 7 : 5}
                            className={cn('stroke-card', fill, isSelected && stroke)}
                            strokeWidth={isSelected ? 3 : 2}
                            style={{ transition: 'r 150ms' }}
                          />
                        </g>
                      </g>
                    </RT.Trigger>
                    <RT.Portal>
                      <RT.Content
                        side="top"
                        sideOffset={8}
                        className="z-[80] max-w-[280px] animate-fade-in rounded-xl border border-border bg-card/95 p-3 text-xs shadow-2xl backdrop-blur-xl"
                      >
                        <InteractionTooltipContent it={s.it} />
                        <RT.Arrow className="fill-card/95" />
                      </RT.Content>
                    </RT.Portal>
                  </RT.Root>
                  {showLabel && (
                    <text x={px} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                      {fmtShort(s.ms)}
                    </text>
                  )}
                </g>
              )
            }

            // Task → círculo con anillo, misma estética que la vista del cliente:
            // anillo degradado (color/30) + core sólido + badge de alta prioridad.
            // El color indica el estado: mint=completada · azul=en curso · naranja=no empezada.
            const tone = toneClasses[statusTone[s.task.Status] ?? 'muted']
            const fill = tone.dot.replace('bg-', 'fill-')
            const coreR = isSelected ? 7 : 6
            const ringR = isSelected ? 12 : 10
            const isHighPriority = s.task.Priority === 'High' && s.task.Status !== 'Completed'
            return (
              <g key={id}>
                <RT.Root>
                  <RT.Trigger asChild>
                    <g
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer focus:outline-none"
                      onClick={() => onSelect(s.task.Id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelect(s.task.Id)
                        }
                      }}
                      style={{ opacity: dimmed ? 0.35 : 1, transition: 'opacity 150ms' }}
                      aria-label={`${s.task.Subject ?? 'Actividad'} — seleccionar`}
                    >
                      {/* área de click ampliada */}
                      <circle cx={px} cy={bandY} r={14} fill="transparent" />
                      {/* halo pulsante al seleccionar */}
                      {isSelected && (
                        <circle cx={px} cy={bandY} r={14} className={cn('animate-select-pulse', fill)} style={{ transformOrigin: `${px}px ${bandY}px` }} />
                      )}
                      {/* pop-in escalonado */}
                      <g
                        className="animate-marker-pop"
                        style={{ animationDelay: `${300 + i * (900 / Math.max(n - 1, 1))}ms`, transformOrigin: `${px}px ${bandY}px` }}
                      >
                        {/* anillo degradado (equivale al ring-4/30 del colapsado) */}
                        <circle cx={px} cy={bandY} r={ringR} className={fill} opacity={isSelected ? 0.4 : 0.28} style={{ transition: 'all 150ms' }} />
                        {/* core sólido */}
                        <circle cx={px} cy={bandY} r={coreR} className={fill} style={{ transition: 'r 150ms' }} />
                        {/* badge de alta prioridad */}
                        {isHighPriority && (
                          <circle cx={px + coreR - 1} cy={bandY - coreR + 1} r={3} className="fill-chart-coral stroke-card" strokeWidth={1.5} />
                        )}
                      </g>
                    </g>
                  </RT.Trigger>
                  <RT.Portal>
                    <RT.Content
                      side="bottom"
                      sideOffset={8}
                      className="z-[80] max-w-[280px] animate-fade-in rounded-xl border border-border bg-card/95 p-3 text-xs shadow-2xl backdrop-blur-xl"
                    >
                      <TaskTooltipContent task={s.task} />
                      <RT.Arrow className="fill-card/95" />
                    </RT.Content>
                  </RT.Portal>
                </RT.Root>
                {showLabel && (
                  <text x={px} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                    {fmtShort(s.ms)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </RT.Provider>
    </div>
  )
}

/* ── Tooltip compacto de una task (usado en la banda de actividades) ── */
function TaskTooltipContent({ task }: { task: Extract<TimelineEvent, { kind: 'task' }>['task'] }) {
  const tone = toneClasses[statusTone[task.Status] ?? 'muted']
  return (
    <div className="space-y-1.5">
      <div className="font-display text-[13px] font-semibold leading-tight">{task.Subject ?? 'Actividad'}</div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium', tone.bg, tone.text)}>
          Actividad · {task.Status}
        </span>
        {task.Priority === 'High' && (
          <span className="rounded-md bg-chart-coral/15 px-1.5 py-0.5 text-[10px] font-medium text-chart-coral">
            Alta prioridad
          </span>
        )}
      </div>
      {task.ActivityDate && (
        <div className="text-[11px] text-muted-foreground">
          {new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(task.ActivityDate))}
        </div>
      )}
    </div>
  )
}
