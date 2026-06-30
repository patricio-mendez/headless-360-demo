import { useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X,
  Database,
  Receipt,
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import { DataTooltip } from './Tooltip'
import { useInsuranceOperations, type PolicyOperation, type PolicyOperationType } from '@/hooks/useInsuranceOperations'
import { useAccount } from '@/hooks/useCustomer'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PolicyOperationsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PolicyOperationsDrawer({ open, onOpenChange }: PolicyOperationsDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col overflow-hidden border-l border-border bg-background shadow-2xl data-[state=open]:animate-slide-up focus:outline-none">
          <DrawerBody onClose={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DrawerBody({ onClose }: { onClose: () => void }) {
  const { data: account } = useAccount()
  return (
    <>
      <div className="relative shrink-0 overflow-hidden border-b border-border">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-chart-coral/30 via-chart-orange/20 to-chart-cyan/30" />
        <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-chart-coral/20 blur-3xl" />
        <div className="relative flex items-start justify-between p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-chart-coral to-chart-orange shadow-xl">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1.5 pt-1">
              <Dialog.Title asChild>
                <h2 className="font-display text-2xl font-bold leading-tight">Operaciones de Pólizas</h2>
              </Dialog.Title>
              <Dialog.Description asChild>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <DataTooltip
                    title="Powered by Data Cloud + BFF"
                    description="Movimientos del core legacy de seguros (Cumulus Core Seguros) traídos al CRM vía Data Cloud. Pagos de premium, liquidaciones de claims, endosos y renovaciones — todo en la misma vista 360 del cliente."
                    source="Cloudflare Worker → Data Cloud Query API v2"
                    side="bottom"
                  >
                    <span className="inline-flex cursor-help items-center gap-1 rounded-md bg-chart-orange/15 px-2 py-0.5 font-semibold text-chart-orange ring-1 ring-chart-orange/30">
                      <Database className="h-3 w-3" /> BFF · Data Cloud
                    </span>
                  </DataTooltip>
                  <span className="inline-flex items-center gap-1 rounded-md bg-chart-coral/15 px-2 py-0.5 font-medium text-chart-coral">
                    <Sparkles className="h-3 w-3" /> Cumulus Insurance
                  </span>
                  {account?.Name && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{account.Name}</span>
                    </>
                  )}
                </div>
              </Dialog.Description>
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
        <PolicyOperationsPanel />
      </div>
    </>
  )
}

/* ───────────── Panel inner ───────────── */

const TYPE_FILTERS: { key: PolicyOperationType | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: 'Todas', emoji: '' },
  { key: 'Premium Payment', label: 'Pagos premium', emoji: '💵' },
  { key: 'Claim Settlement', label: 'Liquidaciones', emoji: '💸' },
  { key: 'Endorsement', label: 'Endosos', emoji: '✏️' },
  { key: 'Renewal', label: 'Renovaciones', emoji: '🔄' },
]

function PolicyOperationsPanel() {
  const { data, isLoading, isError } = useInsuranceOperations(200)
  const operations = data?.operations ?? []
  const [typeFilter, setTypeFilter] = useState<PolicyOperationType | 'all'>('all')
  const [policyFilter, setPolicyFilter] = useState<string>('all')

  const policies = useMemo(() => {
    const set = new Set<string>()
    operations.forEach((o) => set.add(o.policyNumber))
    return Array.from(set).sort()
  }, [operations])

  const filtered = useMemo(() => {
    return operations.filter((o) => {
      if (typeFilter !== 'all' && o.operationType !== typeFilter) return false
      if (policyFilter !== 'all' && o.policyNumber !== policyFilter) return false
      return true
    })
  }, [operations, typeFilter, policyFilter])

  // KPIs
  const stats = useMemo(() => {
    const inflow = filtered.filter((o) => o.amount > 0).reduce((s, o) => s + o.amount, 0)
    const outflow = filtered.filter((o) => o.amount < 0).reduce((s, o) => s + o.amount, 0)
    const pending = filtered.filter((o) => o.status === 'Pending').length
    return { inflow, outflow, net: inflow + outflow, pending }
  }, [filtered])

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary/40" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 text-sm text-chart-coral">Error al cargar operaciones.</div>
    )
  }

  return (
    <div className="space-y-5 p-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCell
          icon={TrendingDown}
          label="Salidas (pagos)"
          value={formatCurrency(Math.abs(stats.outflow))}
          tone="coral"
        />
        <KpiCell
          icon={TrendingUp}
          label="Entradas (liquidaciones)"
          value={formatCurrency(stats.inflow)}
          tone="mint"
        />
        <KpiCell
          icon={Receipt}
          label="Neto"
          value={formatCurrency(stats.net)}
          tone={stats.net >= 0 ? 'mint' : 'coral'}
        />
        <KpiCell
          icon={Clock}
          label="Pendientes"
          value={String(stats.pending)}
          tone="orange"
        />
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                typeFilter === f.key
                  ? 'border-chart-coral/40 bg-chart-coral/15 text-chart-coral'
                  : 'border-border bg-card/40 text-muted-foreground hover:border-border/80 hover:text-foreground',
              )}
            >
              {f.emoji && <span>{f.emoji}</span>}
              {f.label}
            </button>
          ))}
        </div>
        {policies.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPolicyFilter('all')}
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                policyFilter === 'all'
                  ? 'border-chart-blue/40 bg-chart-blue/15 text-chart-blue'
                  : 'border-border bg-card/40 text-muted-foreground hover:border-border/80 hover:text-foreground',
              )}
            >
              Todas las pólizas
            </button>
            {policies.map((p) => (
              <button
                key={p}
                onClick={() => setPolicyFilter(p)}
                className={cn(
                  'rounded-full border px-3 py-1 font-mono text-[10px] font-medium transition-colors',
                  policyFilter === p
                    ? 'border-chart-blue/40 bg-chart-blue/15 text-chart-blue'
                    : 'border-border bg-card/40 text-muted-foreground hover:border-border/80 hover:text-foreground',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Sin operaciones en este filtro.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((op) => (
              <OperationRow key={op.id} op={op} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const TYPE_META: Record<
  PolicyOperationType,
  { emoji: string; tone: string; icon: React.ComponentType<{ className?: string }> }
> = {
  'Premium Payment': { emoji: '💵', tone: 'text-chart-coral', icon: TrendingDown },
  'Claim Settlement': { emoji: '💸', tone: 'text-chart-mint', icon: TrendingUp },
  Endorsement: { emoji: '✏️', tone: 'text-chart-violet', icon: FileText },
  Renewal: { emoji: '🔄', tone: 'text-chart-blue', icon: RefreshCcw },
}

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Processed: CheckCircle2,
  Pending: Clock,
  Failed: XCircle,
}

const STATUS_TONES: Record<string, string> = {
  Processed: 'text-chart-mint bg-chart-mint/15',
  Pending: 'text-chart-orange bg-chart-orange/15',
  Failed: 'text-chart-coral bg-chart-coral/15',
}

function OperationRow({ op }: { op: PolicyOperation }) {
  const meta = TYPE_META[op.operationType]
  const StatusIcon = STATUS_ICONS[op.status] ?? Clock
  const isInflow = op.amount > 0
  const isOutflow = op.amount < 0

  return (
    <li className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-secondary/40">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-base">
        {meta.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs">
          <span className={cn('font-semibold uppercase tracking-wider', meta.tone)}>
            {op.operationType}
          </span>
          <span className="text-muted-foreground/60">·</span>
          <span className="font-mono text-[10px] text-muted-foreground">{op.policyNumber}</span>
        </div>
        <div className="mt-0.5 truncate text-sm font-medium leading-tight">{op.description}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{formatDate(op.operationDate)}</span>
          <span>·</span>
          <span className="truncate">{op.assetName}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span
          className={cn(
            'font-bold tabular-nums',
            isInflow ? 'text-chart-mint' : isOutflow ? 'text-chart-coral' : 'text-muted-foreground',
          )}
        >
          {op.amount === 0 ? '—' : formatCurrency(op.amount)}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
            STATUS_TONES[op.status] ?? 'bg-secondary text-muted-foreground',
          )}
        >
          <StatusIcon className="h-2.5 w-2.5" />
          {op.status}
        </span>
      </div>
    </li>
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
  tone: 'mint' | 'coral' | 'orange' | 'blue' | 'cyan' | 'violet'
}) {
  const toneClass = {
    mint: 'bg-chart-mint/15 text-chart-mint',
    coral: 'bg-chart-coral/15 text-chart-coral',
    orange: 'bg-chart-orange/15 text-chart-orange',
    blue: 'bg-chart-blue/15 text-chart-blue',
    cyan: 'bg-chart-cyan/15 text-chart-cyan',
    violet: 'bg-chart-violet/15 text-chart-violet',
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
