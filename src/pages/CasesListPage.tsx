import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Headphones, Search, Calendar, AlertTriangle, ArrowRight } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { PanelLoading, PanelError } from '@/components/PanelStates'
import { CaseDetailDrawer } from '@/components/CaseDetailDrawer'
import { useBookCases } from '@/hooks/useBookOfBusiness'
import { useCaseById } from '@/hooks/useCustomer'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STATUS_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'open', label: 'Abiertos' },
  { key: 'high', label: 'Alta prioridad' },
  { key: 'closed', label: 'Cerrados' },
] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]['key']

const PRIORITY_TONES: Record<string, string> = {
  High: 'bg-chart-coral/15 text-chart-coral',
  Medium: 'bg-chart-orange/15 text-chart-orange',
  Low: 'bg-chart-cyan/15 text-chart-cyan',
}

export function CasesListPage() {
  const { data: cases = [], isLoading, isError, error, refetch } = useBookCases()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: selectedCase } = useCaseById(selectedId)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cases.filter((c) => {
      if (filter === 'open' && c.IsClosed) return false
      if (filter === 'closed' && !c.IsClosed) return false
      if (filter === 'high' && c.Priority !== 'High') return false
      if (q) {
        return (
          c.CaseNumber.toLowerCase().includes(q) ||
          (c.Subject ?? '').toLowerCase().includes(q) ||
          (c.Account?.Name ?? '').toLowerCase().includes(q) ||
          c.Status.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [cases, search, filter])

  const stats = useMemo(() => {
    const open = cases.filter((c) => !c.IsClosed).length
    const high = cases.filter((c) => !c.IsClosed && c.Priority === 'High').length
    return { open, high }
  }, [cases])

  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <Headphones className="h-3 w-3" />
              Servicio cross-cliente
            </div>
            <h1 className="font-display text-3xl font-bold">Casos de Servicio</h1>
            <p className="text-sm text-muted-foreground">
              {stats.open} abiertos · {stats.high} en alta prioridad · {cases.length} totales
            </p>
          </div>
          <div className="relative w-80 max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número, asunto, cliente…"
              className="h-10 w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-chart-blue/50 focus:outline-none focus:ring-2 focus:ring-chart-blue/20"
            />
          </div>
        </header>

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

        {isLoading ? (
          <PanelLoading rows={6} />
        ) : isError ? (
          <PanelError
            message={(error as Error)?.message ?? 'Error al cargar casos'}
            onRetry={() => refetch()}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Caso</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Prioridad</th>
                  <th className="px-5 py-3 text-right">Creado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => {
                  const tone = PRIORITY_TONES[c.Priority] ?? 'bg-secondary text-muted-foreground'
                  const isHigh = c.Priority === 'High'
                  return (
                    <tr
                      key={c.Id}
                      onClick={() => setSelectedId(c.Id)}
                      className="cursor-pointer transition-colors hover:bg-secondary/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-coral/15 text-chart-coral">
                            <Headphones className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono text-[11px] text-muted-foreground">
                              {c.CaseNumber}
                            </div>
                            <div className="truncate font-medium">{c.Subject ?? 'Sin asunto'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {c.Account?.Name ? (
                          <Link
                            to={`/customer/${c.AccountId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-chart-blue hover:underline"
                          >
                            {c.Account.Name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                            c.IsClosed
                              ? 'bg-chart-mint/15 text-chart-mint'
                              : 'bg-chart-blue/15 text-chart-blue',
                          )}
                        >
                          {c.Status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold', tone)}>
                          {isHigh && <AlertTriangle className="h-3 w-3" />}
                          {c.Priority}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(c.CreatedDate)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Sin casos en este filtro.
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

      <CaseDetailDrawer
        caseRecord={selectedCase ?? null}
        open={!!selectedId}
        onOpenChange={(v) => !v && setSelectedId(null)}
      />
    </AppShell>
  )
}
