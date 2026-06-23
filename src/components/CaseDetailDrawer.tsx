import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X,
  Headphones,
  Calendar,
  Hash,
  AlertTriangle,
  FileText,
  Sparkles,
  CheckCircle2,
  Circle,
  Loader2,
  Check,
  Globe,
  MessageCircle,
  Mail,
  Phone,
  User as UserIcon,
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { getCasePathFor, getCaseStepStatus, type CaseStep, type CaseStepStatus } from '@/lib/caseStages'
import { useUpdateCaseStatus } from '@/hooks/useUpdateCase'
import { toast } from './Toast'
import type { Case } from '@/types/salesforce'

interface CaseDetailDrawerProps {
  caseRecord: Case | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CaseDetailDrawer({ caseRecord, open, onOpenChange }: CaseDetailDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col overflow-hidden border-l border-border bg-background shadow-2xl data-[state=open]:animate-slide-up focus:outline-none">
          {caseRecord && <DrawerBody caseRecord={caseRecord} onClose={() => onOpenChange(false)} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const originIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Website: Globe,
  WhatsApp: MessageCircle,
  Email: Mail,
  Phone: Phone,
}

const priorityToneClass: Record<string, string> = {
  High: 'bg-chart-coral/15 text-chart-coral',
  Medium: 'bg-chart-orange/15 text-chart-orange',
  Low: 'bg-chart-mint/15 text-chart-mint',
}

function DrawerBody({ caseRecord, onClose }: { caseRecord: Case; onClose: () => void }) {
  const path = getCasePathFor(caseRecord)
  const isClosed = caseRecord.Status === 'Closed'
  const isEscalated = caseRecord.IsEscalated || caseRecord.Status === 'Escalated'
  const [pendingStep, setPendingStep] = useState<CaseStep | null>(null)
  const mutation = useUpdateCaseStatus()
  const OriginIcon = originIcons[caseRecord.Origin] ?? FileText

  function handleStepClick(step: CaseStep) {
    if (step.apiName === caseRecord.Status) return
    setPendingStep(step)
  }

  function confirmChange() {
    if (!pendingStep) return
    const target = pendingStep
    mutation.mutate(
      { caseId: caseRecord.Id, status: target.apiName },
      {
        onSuccess: () => {
          toast({
            variant: 'success',
            title: 'Status actualizado',
            description: `Caso #${caseRecord.CaseNumber} → ${target.label}`,
          })
          setPendingStep(null)
        },
        onError: (err) => {
          toast({
            variant: 'error',
            title: 'No se pudo actualizar',
            description: (err as Error).message.slice(0, 200),
          })
          setPendingStep(null)
        },
      },
    )
  }

  return (
    <>
      <div className="relative shrink-0 overflow-hidden border-b border-border">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-chart-coral/30 via-chart-orange/20 to-chart-blue/30" />
        <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-chart-coral/20 blur-3xl" />
        <div className="relative flex items-start justify-between p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-chart-coral to-chart-orange shadow-xl">
              <Headphones className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1.5 pt-1">
              <Dialog.Title asChild>
                <h2 className="font-display text-2xl font-bold leading-tight">
                  {caseRecord.Subject ?? `Caso ${caseRecord.Origin}`}
                </h2>
              </Dialog.Title>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-chart-coral/15 px-2 py-0.5 font-medium text-chart-coral">
                  <Sparkles className="h-3 w-3" /> Case
                </span>
                <span className="font-mono text-muted-foreground">#{caseRecord.CaseNumber}</span>
                {caseRecord.Owner?.Name && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      Owner: <span className="text-foreground">{caseRecord.Owner.Name}</span>
                    </span>
                  </>
                )}
                {isEscalated && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-chart-coral/15 px-2 py-0.5 font-medium text-chart-coral">
                    <AlertTriangle className="h-3 w-3" /> Escalated
                  </span>
                )}
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
            <KpiCell icon={Hash} label="Case Number" value={`#${caseRecord.CaseNumber}`} tone="blue" />
            <KpiCell icon={OriginIcon} label="Origin" value={caseRecord.Origin} tone="cyan" />
            <KpiCell
              icon={AlertTriangle}
              label="Priority"
              value={caseRecord.Priority}
              tone={caseRecord.Priority === 'High' ? 'coral' : caseRecord.Priority === 'Medium' ? 'orange' : 'mint'}
            />
            <KpiCell
              icon={Calendar}
              label="Created"
              value={formatDate(caseRecord.CreatedDate)}
              tone="violet"
            />
          </div>

          {/* Stage Path */}
          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h3 className="font-display text-base font-semibold">Etapas del caso</h3>
                <p className="text-xs text-muted-foreground">
                  Status actual: <span className="font-medium text-foreground">{caseRecord.Status}</span>
                  <span className="ml-2 text-muted-foreground/70">· Click en otra etapa para avanzar</span>
                </p>
              </div>
              {isClosed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-chart-mint/15 px-3 py-1 text-xs font-medium text-chart-mint">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Closed{' '}
                  {caseRecord.ClosedDate && `· ${formatDate(caseRecord.ClosedDate)}`}
                </span>
              )}
            </div>
            <div className="overflow-x-auto p-5 scrollbar-thin">
              <ol className="flex min-w-max items-stretch">
                {path.map((step, idx) => {
                  const status = getCaseStepStatus(step, caseRecord.Status, path)
                  const isLast = idx === path.length - 1
                  const isPending = mutation.isPending && pendingStep?.apiName === step.apiName
                  return (
                    <li key={step.apiName} className="flex items-stretch">
                      <CaseChevron
                        label={step.label}
                        status={status}
                        isFirst={idx === 0}
                        isLast={isLast}
                        isPending={isPending}
                        clickable={status !== 'current' && !mutation.isPending}
                        onClick={() => handleStepClick(step)}
                      />
                    </li>
                  )
                })}
              </ol>
            </div>

            {pendingStep && (
              <div className="border-t border-border bg-chart-coral/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm">
                    Cambiar status a{' '}
                    <span className="font-semibold text-chart-coral">{pendingStep.label}</span>?{' '}
                    {pendingStep.apiName === 'Closed' && (
                      <span className="text-xs text-chart-mint">(Se setea ClosedDate)</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPendingStep(null)}
                      disabled={mutation.isPending}
                      className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmChange}
                      disabled={mutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-chart-coral px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-chart-coral/30 hover:bg-chart-coral/90 disabled:opacity-50"
                    >
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" /> Actualizando…
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3" /> Confirmar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Details grid */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DetailCard title="Detalles del caso">
              <DetailRow label="Case Number" value={`#${caseRecord.CaseNumber}`} />
              <DetailRow label="Subject" value={caseRecord.Subject ?? '—'} />
              <DetailRow label="Status" value={caseRecord.Status} />
              <DetailRow
                label="Priority"
                value={caseRecord.Priority}
                badge={priorityToneClass[caseRecord.Priority]}
              />
              <DetailRow label="Origin" value={caseRecord.Origin} />
              <DetailRow label="Type" value={caseRecord.Type ?? '—'} />
              <DetailRow label="Reason" value={caseRecord.Reason ?? '—'} />
            </DetailCard>

            <DetailCard title="Trazabilidad">
              <DetailRow
                label="Contact"
                value={caseRecord.Contact?.Name ?? '—'}
                icon={UserIcon}
              />
              <DetailRow label="Owner" value={caseRecord.Owner?.Name ?? '—'} />
              <DetailRow label="Escalated" value={caseRecord.IsEscalated ? 'Sí' : 'No'} />
              <DetailRow label="Created" value={formatDateTime(caseRecord.CreatedDate)} />
              <DetailRow
                label="Last Modified"
                value={caseRecord.LastModifiedDate ? formatDateTime(caseRecord.LastModifiedDate) : '—'}
              />
              <DetailRow
                label="Closed Date"
                value={caseRecord.ClosedDate ? formatDateTime(caseRecord.ClosedDate) : '—'}
              />
            </DetailCard>
          </section>

          {caseRecord.Description && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-chart-coral" />
                <h3 className="font-display text-base font-semibold">Descripción</h3>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {caseRecord.Description}
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

function CaseChevron({
  label,
  status,
  isFirst,
  isLast,
  isPending,
  clickable,
  onClick,
}: {
  label: string
  status: CaseStepStatus
  isFirst: boolean
  isLast: boolean
  isPending: boolean
  clickable: boolean
  onClick: () => void
}) {
  const variants: Record<CaseStepStatus, { bg: string; icon: React.ReactNode }> = {
    completed: {
      bg: 'bg-chart-mint/20 text-chart-mint',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    current: {
      bg: 'bg-chart-coral text-white shadow-lg shadow-chart-coral/40',
      icon: <Sparkles className="h-3.5 w-3.5" />,
    },
    pending: {
      bg: 'bg-secondary/60 text-muted-foreground',
      icon: <Circle className="h-3.5 w-3.5" />,
    },
    closed: {
      bg: 'bg-chart-mint text-white shadow-lg shadow-chart-mint/40',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
  }
  const v = variants[status]

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      className={cn(
        'group relative flex h-12 items-center gap-2 px-5 text-xs font-medium transition-all',
        v.bg,
        !isFirst && 'pl-7',
        !isLast && 'pr-3',
        clickable && 'cursor-pointer hover:brightness-110 hover:ring-2 hover:ring-chart-coral/40 focus:outline-none focus:ring-2 focus:ring-chart-coral/60',
        !clickable && 'cursor-default',
      )}
      style={{
        clipPath: isFirst && isLast
          ? 'none'
          : isLast
            ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
            : isFirst
              ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
              : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)',
      }}
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : v.icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
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
  badge,
  icon: Icon,
}: {
  label: string
  value: string
  badge?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd className="max-w-[60%] truncate text-right" title={value}>
        {badge ? (
          <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', badge)}>{value}</span>
        ) : (
          <span className="font-medium">{value}</span>
        )}
      </dd>
    </div>
  )
}
