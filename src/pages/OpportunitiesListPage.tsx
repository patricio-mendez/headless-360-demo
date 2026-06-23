import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Search, TrendingUp, Calendar, ArrowRight } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { PanelLoading, PanelError } from '@/components/PanelStates'
import { OpportunityDetailDrawer } from '@/components/OpportunityDetailDrawer'
import { useBookOpportunities } from '@/hooks/useBookOfBusiness'
import { useOpportunityById } from '@/hooks/useCustomer'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STAGE_FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'open', label: 'Abiertas' },
  { key: 'closed_won', label: 'Cerradas ganadas' },
  { key: 'closed_lost', label: 'Cerradas perdidas' },
] as const

type StageFilter = (typeof STAGE_FILTERS)[number]['key']

export function OpportunitiesListPage() {
  const { data: opps = [], isLoading, isError, error, refetch } = useBookOpportunities()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StageFilter>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: selectedOpp } = useOpportunityById(selectedId)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return opps.filter((o) => {
      if (filter === 'open' && o.StageName.startsWith('Closed')) return false
      if (filter === 'closed_won' && o.StageName !== 'Closed Won') return false
      if (filter === 'closed_lost' && o.StageName !== 'Closed Lost') return false
      if (q) {
        return (
          o.Name.toLowerCase().includes(q) ||
          (o.Account?.Name ?? '').toLowerCase().includes(q) ||
          o.StageName.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [opps, search, filter])

  const totals = useMemo(() => {
    const totalAmount = filtered.reduce((s, o) => s + (o.Amount ?? 0), 0)
    const expected = filtered.reduce((s, o) => s + (o.ExpectedRevenue ?? 0), 0)
    return { totalAmount, expected }
  }, [filtered])

  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <Briefcase className="h-3 w-3" />
              Pipeline cross-cliente
            </div>
            <h1 className="font-display text-3xl font-bold">Oportunidades</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} de {opps.length} · {formatCurrency(totals.totalAmount)} en pipeline ·{' '}
              {formatCurrency(totals.expected)} expected
            </p>
          </div>
          <div className="relative w-80 max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por oportunidad, cliente, etapa…"
              className="h-10 w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-chart-blue/50 focus:outline-none focus:ring-2 focus:ring-chart-blue/20"
            />
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {STAGE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                filter === f.key
                  ? 'border-chart-blue/40 bg-chart-blue/15 text-chart-blue'
                  : 'border-border bg-card/40 text-muted-foreground hover:border-border/80 hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <PanelLoading rows={6} />
        ) : isError ? (
          <PanelError
            message={(error as Error)?.message ?? 'Error al cargar oportunidades'}
            onRetry={() => refetch()}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Oportunidad</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Etapa</th>
                  <th className="px-5 py-3 text-right">Monto</th>
                  <th className="px-5 py-3 text-right">Cierre</th>
                  <th className="px-5 py-3 text-right">Prob.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => {
                  const isClosedWon = o.StageName === 'Closed Won'
                  const isClosedLost = o.StageName === 'Closed Lost'
                  return (
                    <tr
                      key={o.Id}
                      onClick={() => setSelectedId(o.Id)}
                      className="cursor-pointer transition-colors hover:bg-secondary/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-blue/15 text-chart-blue">
                            <Briefcase className="h-3.5 w-3.5" />
                          </div>
                          <span className="truncate font-medium">{o.Name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {o.Account?.Name ? (
                          <Link
                            to={`/customer/${o.AccountId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-chart-blue hover:underline"
                          >
                            {o.Account.Name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                            isClosedWon && 'bg-chart-mint/15 text-chart-mint',
                            isClosedLost && 'bg-chart-coral/15 text-chart-coral',
                            !isClosedWon && !isClosedLost && 'bg-chart-blue/15 text-chart-blue',
                          )}
                        >
                          {o.StageName}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs">
                        {o.Amount ? formatCurrency(o.Amount) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-[11px] text-muted-foreground">
                        {o.CloseDate ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(o.CloseDate)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-xs">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="h-3 w-3 text-chart-mint" />
                          {o.Probability ?? 0}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Sin oportunidades en este filtro.
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

      <OpportunityDetailDrawer
        opportunity={selectedOpp ?? null}
        open={!!selectedId}
        onOpenChange={(v) => !v && setSelectedId(null)}
      />
    </AppShell>
  )
}
