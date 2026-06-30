import * as Dialog from '@radix-ui/react-dialog'
import {
  X,
  AlertOctagon,
  Calendar,
  DollarSign,
  Hash,
  Sparkles,
  User as UserIcon,
  FileText,
  MapPin,
  AlertTriangle,
  Package,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Claim } from '@/types/insurance'

interface ClaimDetailDrawerProps {
  claim: Claim | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_TONES: Record<string, string> = {
  Active: 'bg-chart-blue/15 text-chart-blue',
  Open: 'bg-chart-blue/15 text-chart-blue',
  'Coverage Evaluation': 'bg-chart-orange/15 text-chart-orange',
  'Under Review': 'bg-chart-orange/15 text-chart-orange',
  Closed: 'bg-chart-mint/15 text-chart-mint',
  Settled: 'bg-chart-mint/15 text-chart-mint',
  Denied: 'bg-chart-coral/15 text-chart-coral',
  Rejected: 'bg-chart-coral/15 text-chart-coral',
}

const SEVERITY_TONES: Record<string, string> = {
  High: 'bg-chart-coral/15 text-chart-coral',
  Medium: 'bg-chart-orange/15 text-chart-orange',
  Low: 'bg-chart-mint/15 text-chart-mint',
}

const CLAIM_TYPE_ICONS: Record<string, string> = {
  Auto: '🚗',
  Home: '🏠',
  Life: '❤️',
  Health: '🩺',
}

export function ClaimDetailDrawer({ claim, open, onOpenChange }: ClaimDetailDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col overflow-hidden border-l border-border bg-background shadow-2xl data-[state=open]:animate-slide-up focus:outline-none">
          {claim && <DrawerBody claim={claim} onClose={() => onOpenChange(false)} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DrawerBody({ claim, onClose }: { claim: Claim; onClose: () => void }) {
  const typeIcon = (claim.ClaimType && CLAIM_TYPE_ICONS[claim.ClaimType]) || '📋'
  const statusTone = STATUS_TONES[claim.Status] ?? 'bg-secondary text-muted-foreground'
  const severityTone = claim.Severity
    ? SEVERITY_TONES[claim.Severity] ?? 'bg-secondary text-muted-foreground'
    : null

  return (
    <>
      <div className="relative shrink-0 overflow-hidden border-b border-border">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-chart-coral/30 via-chart-orange/20 to-chart-violet/30" />
        <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-chart-coral/20 blur-3xl" />
        <div className="relative flex items-start justify-between p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-chart-coral to-chart-violet text-2xl shadow-xl">
              {typeIcon}
            </div>
            <div className="space-y-1.5 pt-1">
              <Dialog.Title asChild>
                <h2 className="font-display text-2xl font-bold leading-tight">{claim.Name}</h2>
              </Dialog.Title>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-chart-coral/15 px-2 py-0.5 font-medium text-chart-coral">
                  <Sparkles className="h-3 w-3" /> Claim
                </span>
                {claim.ClaimType && (
                  <span className="rounded-md bg-secondary/60 px-2 py-0.5 font-medium text-muted-foreground">
                    {claim.ClaimType}
                  </span>
                )}
                <span className={cn('rounded-md px-2 py-0.5 font-medium', statusTone)}>
                  {claim.Status}
                </span>
                {claim.Severity && severityTone && (
                  <span
                    className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium', severityTone)}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {claim.Severity}
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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCell
              icon={DollarSign}
              label="Monto reclamado"
              value={
                claim.TotalClaimedAmount && claim.TotalClaimedAmount > 0
                  ? formatCurrency(claim.TotalClaimedAmount)
                  : claim.EstimatedAmount && claim.EstimatedAmount > 0
                    ? formatCurrency(claim.EstimatedAmount)
                    : '—'
              }
              tone="orange"
            />
            <KpiCell
              icon={DollarSign}
              label="Monto aprobado"
              value={claim.ApprovedAmount != null ? formatCurrency(claim.ApprovedAmount) : '—'}
              tone={claim.ApprovedAmount != null ? 'mint' : 'violet'}
            />
            <KpiCell
              icon={Calendar}
              label="Fecha siniestro"
              value={claim.LossDate ? formatDate(claim.LossDate) : '—'}
              tone="coral"
            />
            <KpiCell
              icon={AlertOctagon}
              label="Status"
              value={claim.Status}
              tone={claim.IsClosed ? 'mint' : 'blue'}
            />
          </div>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DetailCard title="Detalles del claim">
              <DetailRow label="Número" value={claim.Name} icon={Hash} />
              <DetailRow label="Tipo" value={claim.ClaimType ?? '—'} />
              <DetailRow label="Status" value={claim.Status} />
              <DetailRow label="Severidad" value={claim.Severity ?? '—'} />
              <DetailRow
                label="Reclamado"
                value={
                  claim.TotalClaimedAmount && claim.TotalClaimedAmount > 0
                    ? formatCurrency(claim.TotalClaimedAmount)
                    : claim.EstimatedAmount && claim.EstimatedAmount > 0
                      ? formatCurrency(claim.EstimatedAmount)
                      : '—'
                }
              />
              <DetailRow
                label="Aprobado"
                value={claim.ApprovedAmount != null ? formatCurrency(claim.ApprovedAmount) : '—'}
              />
              <DetailRow
                label="Lugar"
                value={
                  [claim.IncidentSiteCity, claim.IncidentSiteCountry].filter(Boolean).join(', ') ||
                  '—'
                }
                icon={MapPin}
              />
              <DetailRow label="Motivo" value={claim.ClaimReason ?? '—'} />
            </DetailCard>

            <DetailCard title="Trazabilidad">
              <DetailRow
                label="Asegurado"
                value={claim.Account?.Name ?? '—'}
                icon={UserIcon}
                href={claim.AccountId ? `/customer/${claim.AccountId}` : undefined}
              />
              <DetailRow
                label="Póliza"
                value={claim.PolicyNumber?.Name ?? '—'}
                icon={FileText}
              />
              <DetailRow
                label="Asset asegurado"
                value={claim.InsuredAsset?.AssetName ?? claim.InsuredAsset?.Name ?? '—'}
                icon={Package}
              />
              <DetailRow label="Owner" value={claim.Owner?.Name ?? '—'} />
              <DetailRow
                label="Fecha siniestro"
                value={claim.LossDate ? formatDateTime(claim.LossDate) : '—'}
              />
              <DetailRow
                label="Iniciación"
                value={claim.InitiationDate ? formatDateTime(claim.InitiationDate) : '—'}
              />
              <DetailRow
                label="Cierre"
                value={claim.FinalizedDate ? formatDateTime(claim.FinalizedDate) : '—'}
              />
              <DetailRow
                label="Creado"
                value={claim.CreatedDate ? formatDateTime(claim.CreatedDate) : '—'}
              />
            </DetailCard>
          </section>

          {claim.Summary && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-chart-coral" />
                <h3 className="font-display text-base font-semibold">Resumen</h3>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {claim.Summary}
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
  href,
}: {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
  href?: string
}) {
  const valueEl = href ? (
    <Link to={href} className="hover:text-chart-blue hover:underline">
      {value}
    </Link>
  ) : (
    <span>{value}</span>
  )
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd className="max-w-[60%] truncate text-right font-medium" title={value}>
        {valueEl}
      </dd>
    </div>
  )
}
