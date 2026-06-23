import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X,
  Crown,
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  FileText,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Check,
} from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { getStagePathFor, getStepStatus, type StageStep, type StageStatus } from '@/lib/opportunityStages'
import { useUpdateOpportunityStage } from '@/hooks/useUpdateOpportunity'
import { toast } from './Toast'
import type { Opportunity } from '@/types/salesforce'

interface OpportunityDetailDrawerProps {
  opportunity: Opportunity | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OpportunityDetailDrawer({ opportunity, open, onOpenChange }: OpportunityDetailDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col overflow-hidden border-l border-border bg-background shadow-2xl data-[state=open]:animate-slide-up focus:outline-none">
          {opportunity && <DrawerBody opportunity={opportunity} onClose={() => onOpenChange(false)} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DrawerBody({ opportunity, onClose }: { opportunity: Opportunity; onClose: () => void }) {
  const path = getStagePathFor(opportunity.Name, opportunity.StageName)
  const isClosedWon = opportunity.StageName === 'Closed Won'
  const isClosedLost = opportunity.StageName === 'Closed Lost'
  const [pendingStep, setPendingStep] = useState<StageStep | null>(null)
  const mutation = useUpdateOpportunityStage()

  function handleStageClick(step: StageStep) {
    if (step.apiName === opportunity.StageName) return
    setPendingStep(step)
  }

  function confirmChange() {
    if (!pendingStep) return
    const target = pendingStep
    const probability =
      target.apiName === 'Closed Won'
        ? 100
        : target.apiName === 'Closed Lost'
          ? 0
          : undefined

    mutation.mutate(
      {
        opportunityId: opportunity.Id,
        stageName: target.apiName,
        probability,
      },
      {
        onSuccess: () => {
          toast({
            variant: 'success',
            title: 'Stage actualizado',
            description: `${opportunity.Name} → ${target.label}`,
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

  function cancelChange() {
    setPendingStep(null)
  }

  return (
    <>
      <div className="relative shrink-0 overflow-hidden border-b border-border">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-chart-blue/30 via-chart-violet/20 to-chart-orange/30" />
        <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-chart-blue/20 blur-3xl" />
        <div className="relative flex items-start justify-between p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-chart-blue to-chart-orange shadow-xl">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1.5 pt-1">
              <Dialog.Title asChild>
                <h2 className="font-display text-2xl font-bold leading-tight">{opportunity.Name}</h2>
              </Dialog.Title>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-chart-blue/15 px-2 py-0.5 font-medium text-chart-blue">
                  <Sparkles className="h-3 w-3" /> Opportunity
                </span>
                {opportunity.Owner?.Name && (
                  <span className="text-muted-foreground">
                    Owner: <span className="text-foreground">{opportunity.Owner.Name}</span>
                  </span>
                )}
                <span className="text-muted-foreground">·</span>
                <span className="font-mono text-[10px] text-foreground/60">{opportunity.Id}</span>
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
            <KpiCell icon={DollarSign} label="Amount" value={formatCurrency(opportunity.Amount)} tone="blue" />
            <KpiCell icon={Calendar} label="Close Date" value={formatDate(opportunity.CloseDate)} tone="orange" />
            <KpiCell
              icon={TrendingUp}
              label="Probability"
              value={`${opportunity.Probability}%`}
              tone={isClosedWon ? 'mint' : isClosedLost ? 'coral' : 'cyan'}
            />
            <KpiCell
              icon={Target}
              label="Forecast"
              value={opportunity.ForecastCategoryName ?? '—'}
              tone="violet"
            />
          </div>

          {/* Stage Path */}
          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h3 className="font-display text-base font-semibold">Etapas del proceso</h3>
                <p className="text-xs text-muted-foreground">
                  Stage actual: <span className="font-medium text-foreground">{opportunity.StageName}</span>
                  <span className="ml-2 text-muted-foreground/70">· Click en otra etapa para avanzar</span>
                </p>
              </div>
              {isClosedWon && (
                <span className="inline-flex items-center gap-1 rounded-full bg-chart-mint/15 px-3 py-1 text-xs font-medium text-chart-mint">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Closed Won
                </span>
              )}
              {isClosedLost && (
                <span className="inline-flex items-center gap-1 rounded-full bg-chart-coral/15 px-3 py-1 text-xs font-medium text-chart-coral">
                  <Clock className="h-3.5 w-3.5" /> Closed Lost
                </span>
              )}
            </div>
            <div className="overflow-x-auto p-5 scrollbar-thin">
              <ol className="flex min-w-max items-stretch">
                {path.map((step, idx) => {
                  const status = getStepStatus(step, opportunity.StageName, path)
                  const isLast = idx === path.length - 1
                  const isPending = mutation.isPending && pendingStep?.apiName === step.apiName
                  return (
                    <li key={step.apiName} className="flex items-stretch">
                      <StageChevron
                        label={step.label}
                        status={status}
                        isFirst={idx === 0}
                        isLast={isLast}
                        isPending={isPending}
                        clickable={status !== 'current' && !mutation.isPending}
                        onClick={() => handleStageClick(step)}
                      />
                    </li>
                  )
                })}
              </ol>
            </div>

            {pendingStep && (
              <div className="border-t border-border bg-chart-blue/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm">
                    Cambiar stage a{' '}
                    <span className="font-semibold text-chart-blue">{pendingStep.label}</span>?{' '}
                    {pendingStep.apiName === 'Closed Won' && (
                      <span className="text-xs text-chart-mint">(Probability → 100%)</span>
                    )}
                    {pendingStep.apiName === 'Closed Lost' && (
                      <span className="text-xs text-chart-coral">(Probability → 0%)</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={cancelChange}
                      disabled={mutation.isPending}
                      className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmChange}
                      disabled={mutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-chart-blue px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-chart-blue/30 hover:bg-chart-blue/90 disabled:opacity-50"
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
            <DetailCard title="Detalles">
              <DetailRow label="Opportunity Name" value={opportunity.Name} />
              <DetailRow label="Stage" value={opportunity.StageName} />
              <DetailRow label="Amount" value={formatCurrency(opportunity.Amount)} />
              <DetailRow label="Expected Revenue" value={formatCurrency(opportunity.ExpectedRevenue)} />
              <DetailRow label="Close Date" value={formatDate(opportunity.CloseDate)} />
              <DetailRow label="Probability" value={`${opportunity.Probability}%`} />
              <DetailRow label="Type" value={opportunity.Type ?? '—'} />
              <DetailRow label="Lead Source" value={opportunity.LeadSource ?? '—'} />
            </DetailCard>

            <DetailCard title="Trazabilidad">
              <DetailRow label="Owner" value={opportunity.Owner?.Name ?? '—'} />
              <DetailRow label="Forecast Category" value={opportunity.ForecastCategoryName ?? '—'} />
              <DetailRow label="Created" value={opportunity.CreatedDate ? formatDateTime(opportunity.CreatedDate) : '—'} />
              <DetailRow
                label="Last Modified"
                value={opportunity.LastModifiedDate ? formatDateTime(opportunity.LastModifiedDate) : '—'}
              />
              <DetailRow label="Next Step" value={opportunity.NextStep ?? 'Sin definir'} />
            </DetailCard>
          </section>

          {opportunity.Description && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-chart-blue" />
                <h3 className="font-display text-base font-semibold">Descripción</h3>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {opportunity.Description}
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

function StageChevron({
  label,
  status,
  isFirst,
  isLast,
  isPending,
  clickable,
  onClick,
}: {
  label: string
  status: StageStatus
  isFirst: boolean
  isLast: boolean
  isPending: boolean
  clickable: boolean
  onClick: () => void
}) {
  const variants: Record<StageStatus, { bg: string; icon: React.ReactNode }> = {
    completed: {
      bg: 'bg-chart-mint/20 text-chart-mint',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    current: {
      bg: 'bg-chart-blue text-white shadow-lg shadow-chart-blue/40',
      icon: <Sparkles className="h-3.5 w-3.5" />,
    },
    pending: {
      bg: 'bg-secondary/60 text-muted-foreground',
      icon: <Circle className="h-3.5 w-3.5" />,
    },
    lost: {
      bg: 'bg-chart-coral/20 text-chart-coral',
      icon: <X className="h-3.5 w-3.5" />,
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
        clickable && 'cursor-pointer hover:brightness-110 hover:ring-2 hover:ring-chart-blue/40 focus:outline-none focus:ring-2 focus:ring-chart-blue/60',
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] truncate text-right font-medium" title={value}>
        {value}
      </dd>
    </div>
  )
}
