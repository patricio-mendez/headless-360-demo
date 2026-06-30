import * as Dialog from '@radix-ui/react-dialog'
import {
  X,
  Calendar,
  DollarSign,
  Shield,
  Sparkles,
  User as UserIcon,
  Hash,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { InsurancePolicy } from '@/types/insurance'

interface PolicyDetailDrawerProps {
  policy: InsurancePolicy | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_TONES: Record<string, string> = {
  'In Force': 'bg-chart-mint/15 text-chart-mint',
  Lapsed: 'bg-chart-coral/15 text-chart-coral',
  Cancelled: 'bg-chart-coral/15 text-chart-coral',
  Pending: 'bg-chart-orange/15 text-chart-orange',
}

const POLICY_TYPE_ICONS: Record<string, string> = {
  Auto: '🚗',
  Home: '🏠',
  Life: '❤️',
  'Health & Dental': '🩺',
  Health: '🩺',
}

export function PolicyDetailDrawer({ policy, open, onOpenChange }: PolicyDetailDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col overflow-hidden border-l border-border bg-background shadow-2xl data-[state=open]:animate-slide-up focus:outline-none">
          {policy && <DrawerBody policy={policy} onClose={() => onOpenChange(false)} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DrawerBody({ policy, onClose }: { policy: InsurancePolicy; onClose: () => void }) {
  const isInForce = policy.Status === 'In Force'
  const typeIcon = (policy.PolicyType && POLICY_TYPE_ICONS[policy.PolicyType]) || '📄'

  // Días hasta expiración
  const daysToExpire = policy.ExpirationDate
    ? Math.round((new Date(policy.ExpirationDate).getTime() - Date.now()) / 86400000)
    : null
  const isExpiringSoon = daysToExpire != null && daysToExpire >= 0 && daysToExpire <= 30

  return (
    <>
      <div className="relative shrink-0 overflow-hidden border-b border-border">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-chart-coral/30 via-chart-orange/20 to-chart-blue/30" />
        <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-chart-coral/20 blur-3xl" />
        <div className="relative flex items-start justify-between p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-chart-coral to-chart-orange text-2xl shadow-xl">
              {typeIcon}
            </div>
            <div className="space-y-1.5 pt-1">
              <Dialog.Title asChild>
                <h2 className="font-display text-2xl font-bold leading-tight">{policy.Name}</h2>
              </Dialog.Title>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-chart-coral/15 px-2 py-0.5 font-medium text-chart-coral">
                  <Sparkles className="h-3 w-3" /> Póliza
                </span>
                {policy.PolicyType && (
                  <span className="rounded-md bg-secondary/60 px-2 py-0.5 font-medium text-muted-foreground">
                    {policy.PolicyType}
                  </span>
                )}
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5 font-medium',
                    STATUS_TONES[policy.Status] ?? 'bg-secondary text-muted-foreground',
                  )}
                >
                  {policy.Status}
                </span>
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
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCell
              icon={DollarSign}
              label="Premium anual"
              value={policy.PremiumAmount != null ? formatCurrency(policy.PremiumAmount) : '—'}
              tone="orange"
            />
            <KpiCell
              icon={Calendar}
              label="Effective"
              value={policy.EffectiveDate ? formatDate(policy.EffectiveDate) : '—'}
              tone="blue"
            />
            <KpiCell
              icon={Calendar}
              label="Expiration"
              value={policy.ExpirationDate ? formatDate(policy.ExpirationDate) : '—'}
              tone={isExpiringSoon ? 'coral' : 'violet'}
            />
            <KpiCell
              icon={Shield}
              label="Status"
              value={policy.Status}
              tone={isInForce ? 'mint' : 'coral'}
            />
          </div>

          {isExpiringSoon && (
            <div className="rounded-2xl border border-chart-coral/40 bg-chart-coral/10 p-4 text-sm">
              <strong className="text-chart-coral">Renovación próxima:</strong>{' '}
              esta póliza vence en {daysToExpire} días. Buen momento para contactar al asegurado.
            </div>
          )}

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DetailCard title="Detalles de la póliza">
              <DetailRow label="Número de póliza" value={policy.Name} icon={Hash} />
              <DetailRow label="Tipo" value={policy.PolicyType ?? '—'} />
              <DetailRow label="Status" value={policy.Status} />
              <DetailRow
                label="Premium anual"
                value={policy.PremiumAmount != null ? formatCurrency(policy.PremiumAmount) : '—'}
              />
              <DetailRow
                label="Vigente desde"
                value={policy.EffectiveDate ? formatDate(policy.EffectiveDate) : '—'}
              />
              <DetailRow
                label="Vence"
                value={policy.ExpirationDate ? formatDate(policy.ExpirationDate) : '—'}
              />
            </DetailCard>

            <DetailCard title="Trazabilidad">
              <DetailRow
                label="Asegurado"
                value={policy.NameInsured?.Name ?? '—'}
                icon={UserIcon}
                href={policy.NameInsuredId ? `/customer/${policy.NameInsuredId}` : undefined}
              />
              <DetailRow label="Owner" value={policy.Owner?.Name ?? '—'} />
              <DetailRow
                label="Created"
                value={policy.CreatedDate ? formatDateTime(policy.CreatedDate) : '—'}
              />
              <DetailRow
                label="Last Modified"
                value={policy.LastModifiedDate ? formatDateTime(policy.LastModifiedDate) : '—'}
              />
            </DetailCard>
          </section>
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

