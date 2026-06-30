import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Search, Calendar, AlertTriangle, ArrowRight } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { PanelLoading, PanelError } from '@/components/PanelStates'
import { PolicyDetailDrawer } from '@/components/PolicyDetailDrawer'
import { useAllPolicies, usePolicyById } from '@/hooks/usePolicies'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STATUS_FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'in_force', label: 'Vigentes' },
  { key: 'renewals', label: 'Renewals 30d' },
  { key: 'lapsed', label: 'Lapsed' },
] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]['key']

/** Filtros por tipo de ramo. Cada `match` agrupa los PolicyType del org bajo un label. */
const TYPE_FILTERS = [
  { key: 'all', label: 'Todos los ramos', emoji: '', match: null as string[] | null },
  { key: 'auto', label: 'Auto', emoji: '🚗', match: ['Auto'] },
  { key: 'home', label: 'Hogar', emoji: '🏠', match: ['Home'] },
  { key: 'health', label: 'Salud', emoji: '🩺', match: ['Health & Dental', 'Health'] },
  { key: 'life', label: 'Vida', emoji: '❤️', match: ['Life'] },
] as const

type TypeFilter = (typeof TYPE_FILTERS)[number]['key']

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

const RENEWAL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export function PoliciesListPage() {
  const { data: policies = [], isLoading, isError, error, refetch } = useAllPolicies()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('in_force')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: selectedPolicy } = usePolicyById(selectedId)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const now = Date.now()
    const typeMatch = TYPE_FILTERS.find((t) => t.key === typeFilter)?.match ?? null
    return policies.filter((p) => {
      if (filter === 'in_force' && p.Status !== 'In Force') return false
      if (filter === 'lapsed' && p.Status !== 'Lapsed') return false
      if (filter === 'renewals') {
        if (p.Status !== 'In Force' || !p.ExpirationDate) return false
        const diff = new Date(p.ExpirationDate).getTime() - now
        if (diff < 0 || diff > RENEWAL_WINDOW_MS) return false
      }
      if (typeMatch && !typeMatch.includes(p.PolicyType ?? '')) return false
      if (q) {
        return (
          p.Name.toLowerCase().includes(q) ||
          (p.PolicyType ?? '').toLowerCase().includes(q) ||
          (p.NameInsured?.Name ?? '').toLowerCase().includes(q) ||
          p.Status.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [policies, search, filter, typeFilter])

  const stats = useMemo(() => {
    const now = Date.now()
    const inForce = policies.filter((p) => p.Status === 'In Force').length
    const premium = policies
      .filter((p) => p.Status === 'In Force')
      .reduce((sum, p) => sum + (p.PremiumAmount ?? 0), 0)
    const renewals = policies.filter((p) => {
      if (p.Status !== 'In Force' || !p.ExpirationDate) return false
      const diff = new Date(p.ExpirationDate).getTime() - now
      return diff >= 0 && diff <= RENEWAL_WINDOW_MS
    }).length
    return { inForce, premium, renewals }
  }, [policies])

  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <FileText className="h-3 w-3" />
              Cumulus Insurance
            </div>
            <h1 className="font-display text-3xl font-bold">Pólizas</h1>
            <p className="text-sm text-muted-foreground">
              {policies.length} pólizas · {formatCurrency(stats.premium)} premium anual · {stats.renewals} renewals próximos
            </p>
          </div>
          <div className="relative w-80 max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número, tipo, asegurado…"
              className="h-10 w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-chart-coral/50 focus:outline-none focus:ring-2 focus:ring-chart-coral/20"
            />
          </div>
        </header>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                  filter === f.key
                    ? 'border-chart-coral/40 bg-chart-coral/15 text-chart-coral'
                    : 'border-border bg-card/40 text-muted-foreground hover:border-border/80 hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                  typeFilter === t.key
                    ? 'border-chart-blue/40 bg-chart-blue/15 text-chart-blue'
                    : 'border-border bg-card/40 text-muted-foreground hover:border-border/80 hover:text-foreground',
                )}
              >
                {t.emoji && <span className="text-sm leading-none">{t.emoji}</span>}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <PanelLoading rows={6} />
        ) : isError ? (
          <PanelError
            message={(error as Error)?.message ?? 'Error al cargar pólizas'}
            onRetry={() => refetch()}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Póliza</th>
                  <th className="px-5 py-3">Asegurado</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Premium</th>
                  <th className="px-5 py-3 text-right">Vence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const tone = STATUS_TONES[p.Status] ?? 'bg-secondary text-muted-foreground'
                  const icon = (p.PolicyType && POLICY_TYPE_ICONS[p.PolicyType]) || '📄'
                  const expDate = p.ExpirationDate ? new Date(p.ExpirationDate) : null
                  const daysToExpire = expDate
                    ? Math.round((expDate.getTime() - Date.now()) / 86400000)
                    : null
                  const renewingSoon =
                    p.Status === 'In Force' &&
                    daysToExpire != null &&
                    daysToExpire >= 0 &&
                    daysToExpire <= 30
                  return (
                    <tr
                      key={p.Id}
                      onClick={() => setSelectedId(p.Id)}
                      className="cursor-pointer transition-colors hover:bg-secondary/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-coral/15 text-base">
                            {icon}
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono text-[11px] text-muted-foreground">
                              {p.PolicyType ?? '—'}
                            </div>
                            <div className="truncate font-medium">{p.Name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {p.NameInsured?.Name && p.NameInsuredId ? (
                          <Link
                            to={`/customer/${p.NameInsuredId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-chart-blue hover:underline"
                          >
                            {p.NameInsured.Name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold', tone)}>
                          {p.Status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-semibold tabular-nums">
                        {p.PremiumAmount != null ? formatCurrency(p.PremiumAmount) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-[11px]">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1',
                            renewingSoon
                              ? 'font-semibold text-chart-coral'
                              : 'text-muted-foreground',
                          )}
                        >
                          {renewingSoon && <AlertTriangle className="h-3 w-3" />}
                          <Calendar className="h-3 w-3" />
                          {p.ExpirationDate ? formatDate(p.ExpirationDate) : '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Sin pólizas en este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-center text-[11px] text-muted-foreground/60">
          Click en una fila para abrir el detalle <ArrowRight className="inline h-3 w-3" />
        </p>
      </div>

      <PolicyDetailDrawer
        policy={selectedPolicy ?? null}
        open={!!selectedId}
        onOpenChange={(v) => !v && setSelectedId(null)}
      />
    </AppShell>
  )
}
