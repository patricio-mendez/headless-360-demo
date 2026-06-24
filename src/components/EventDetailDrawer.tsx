import * as Dialog from '@radix-ui/react-dialog'
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  FileText,
  Sparkles,
  User as UserIcon,
  Link as LinkIcon,
  Repeat,
  Hourglass,
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Event } from '@/types/salesforce'

interface EventDetailDrawerProps {
  event: Event | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventDetailDrawer({ event, open, onOpenChange }: EventDetailDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col overflow-hidden border-l border-border bg-background shadow-2xl data-[state=open]:animate-slide-up focus:outline-none">
          {event && <DrawerBody event={event} onClose={() => onOpenChange(false)} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function formatTimeRange(start: Date, end: Date | null, isAllDay: boolean): string {
  if (isAllDay) return 'Todo el día'
  const startTime = start.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  if (!end) return startTime
  const endTime = end.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  return `${startTime} – ${endTime}`
}

function formatDuration(start: Date, end: Date | null, isAllDay: boolean): string {
  if (isAllDay) return 'Todo el día'
  if (!end) return '—'
  const diffMs = end.getTime() - start.getTime()
  if (diffMs <= 0) return '—'
  const totalMin = Math.round(diffMs / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

function DrawerBody({ event, onClose }: { event: Event; onClose: () => void }) {
  const start = new Date(event.StartDateTime)
  const end = event.EndDateTime ? new Date(event.EndDateTime) : null
  const isPast = (end ?? start).getTime() < Date.now()
  const isToday = start.toDateString() === new Date().toDateString()
  const timeRange = formatTimeRange(start, end, event.IsAllDayEvent)
  const duration = formatDuration(start, end, event.IsAllDayEvent)

  return (
    <>
      <div className="relative shrink-0 overflow-hidden border-b border-border">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-chart-orange/30 via-chart-coral/20 to-chart-violet/30" />
        <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-chart-orange/20 blur-3xl" />
        <div className="relative flex items-start justify-between p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-chart-orange to-chart-coral shadow-xl">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1.5 pt-1">
              <Dialog.Title asChild>
                <h2 className="font-display text-2xl font-bold leading-tight">
                  {event.Subject || '(sin asunto)'}
                </h2>
              </Dialog.Title>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-chart-orange/15 px-2 py-0.5 font-medium text-chart-orange">
                  <Sparkles className="h-3 w-3" /> Event
                </span>
                {event.Owner?.Name && (
                  <span className="text-muted-foreground">
                    Owner: <span className="text-foreground">{event.Owner.Name}</span>
                  </span>
                )}
                <span className="text-muted-foreground">·</span>
                <span className="font-mono text-[10px] text-foreground/60">{event.Id}</span>
              </div>
            </div>
          </div>
          <Dialog.Close asChild>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="space-y-6 p-6">
          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCell
              icon={CalendarIcon}
              label="Fecha"
              value={formatDate(event.StartDateTime)}
              tone="orange"
            />
            <KpiCell icon={Clock} label="Horario" value={timeRange} tone="cyan" />
            <KpiCell icon={Hourglass} label="Duración" value={duration} tone="violet" />
            <KpiCell
              icon={Repeat}
              label="Tipo"
              value={event.Type ?? (event.IsAllDayEvent ? 'All-day' : 'Meeting')}
              tone={isPast ? 'mint' : isToday ? 'coral' : 'blue'}
            />
          </div>

          {/* Hero "when/where" section */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-semibold">¿Cuándo?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(event.StartDateTime)}
                  {end && !event.IsAllDayEvent && ` — ${formatDateTime(event.EndDateTime!)}`}
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                  isPast
                    ? 'bg-secondary/60 text-muted-foreground'
                    : isToday
                      ? 'bg-chart-coral/15 text-chart-coral'
                      : 'bg-chart-blue/15 text-chart-blue',
                )}
              >
                <Clock className="h-3 w-3" />
                {isPast ? 'Ya pasó' : isToday ? 'Hoy' : 'Próximo'}
              </span>
            </div>
            {event.Location && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm">
                <MapPin className="h-4 w-4 shrink-0 text-chart-coral" />
                <span className="font-medium">{event.Location}</span>
              </div>
            )}
          </section>

          {/* Details grid */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DetailCard title="Detalles">
              <DetailRow label="Subject" value={event.Subject || '—'} />
              <DetailRow label="Type" value={event.Type ?? '—'} />
              <DetailRow label="Inicio" value={formatDateTime(event.StartDateTime)} />
              <DetailRow
                label="Fin"
                value={event.EndDateTime ? formatDateTime(event.EndDateTime) : '—'}
              />
              <DetailRow label="Duración" value={duration} />
              <DetailRow label="All-day" value={event.IsAllDayEvent ? 'Sí' : 'No'} />
              <DetailRow label="Location" value={event.Location ?? '—'} />
            </DetailCard>

            <DetailCard title="Trazabilidad">
              <DetailRow
                label="Relacionado con"
                value={event.What?.Name ?? '—'}
                icon={LinkIcon}
              />
              <DetailRow
                label="Contacto"
                value={event.Who?.Name ?? '—'}
                icon={UserIcon}
              />
              <DetailRow label="Owner" value={event.Owner?.Name ?? '—'} />
              <DetailRow
                label="Created"
                value={event.CreatedDate ? formatDateTime(event.CreatedDate) : '—'}
              />
              <DetailRow
                label="Last Modified"
                value={event.LastModifiedDate ? formatDateTime(event.LastModifiedDate) : '—'}
              />
            </DetailCard>
          </section>

          {event.Description && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-chart-orange" />
                <h3 className="font-display text-base font-semibold">Descripción</h3>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {event.Description}
              </p>
            </section>
          )}
        </div>
      </div>
    </>
  )
}

function KpiCell({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone: 'blue' | 'orange' | 'mint' | 'cyan' | 'violet' | 'coral'
}) {
  const toneClass = {
    blue: 'bg-chart-blue/15 text-chart-blue',
    orange: 'bg-chart-orange/15 text-chart-orange',
    mint: 'bg-chart-mint/15 text-chart-mint',
    cyan: 'bg-chart-cyan/15 text-chart-cyan',
    violet: 'bg-chart-violet/15 text-chart-violet',
    coral: 'bg-chart-coral/15 text-chart-coral',
  }[tone]
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', toneClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</div>
          <div className="truncate text-sm font-semibold">{value}</div>
        </div>
      </div>
    </div>
  )
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border p-5">
        <h3 className="font-display text-base font-semibold">{title}</h3>
      </div>
      <dl className="divide-y divide-border">{children}</dl>
    </div>
  )
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd className="max-w-[60%] truncate text-right font-medium" title={value}>
        {value}
      </dd>
    </div>
  )
}
