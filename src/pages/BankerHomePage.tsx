import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  TrendingUp,
  Briefcase,
  Headphones,
  Trophy,
  ChevronRight,
  Search,
  Star,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  BarChart3,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { StatTile } from '@/components/StatTile'
import { AgentforceChatPanel } from '@/components/AgentforceChatPanel'
import {
  CockpitSummaryStrip,
  CockpitTopOpps,
  CockpitPipelineByStage,
  CockpitForecastFunnel,
  CockpitPipelineOverTime,
} from '@/components/SalesCockpit'
import { PanelLoading, PanelError, InlineSpinner } from '@/components/PanelStates'
import {
  useBankerCustomers,
  useBookStats,
  useCustomersEnrichment,
} from '@/hooks/useBookOfBusiness'
import { formatCurrency, initials } from '@/lib/utils'
import { env } from '@/lib/env'
import { cn } from '@/lib/utils'

const VISIBLE_CUSTOMER_ROWS = 5
// Approx 60px per row + header + padding → vista de exactamente 5 filas, scroll para el resto
const CUSTOMER_TABLE_MAX_HEIGHT = '380px'

/** Clientes destacados al tope de la lista, en este orden exacto. */
const PINNED_CUSTOMER_NAMES = [
  'Patricio Mendez',
  'Ana Silva',
  'Juan Pérez',
  'Pedro Muñoz',
  'María González',
]

function pinnedRank(name: string): number {
  const idx = PINNED_CUSTOMER_NAMES.indexOf(name)
  return idx === -1 ? Number.POSITIVE_INFINITY : idx
}

export function BankerHomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const stats = useBookStats()
  const customers = useBankerCustomers()
  const customerIds = useMemo(() => (customers.data ?? []).map((c) => c.Id), [customers.data])
  const enrich = useCustomersEnrichment(customerIds)

  const filtered = useMemo(() => {
    const list = [...(customers.data ?? [])].sort((a, b) => {
      const aRank = pinnedRank(a.Name)
      const bRank = pinnedRank(b.Name)
      if (aRank !== bRank) return aRank - bRank
      return a.Name.localeCompare(b.Name, 'es')
    })
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      (c) => c.Name.toLowerCase().includes(q) || c.PersonEmail?.toLowerCase().includes(q),
    )
  }, [customers.data, search])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main
          className="flex-1 overflow-y-auto scrollbar-thin bg-background"
          style={{ backgroundImage: 'var(--gradient-app)' }}
        >
          <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
            {/* 1. Welcome banner */}
            <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-chart-blue/15 via-chart-violet/10 to-chart-orange/15" />
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-chart-blue/20 blur-3xl" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-chart-blue">
                    Branch Dashboard
                  </div>
                  <h1 className="font-display text-3xl font-bold leading-tight">
                    Hola, <span className="gradient-text">Pato</span>
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Acá tenés el panorama de tu cartera. Click en cualquier cliente para abrir su vista 360°.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm">
                  <Trophy className="h-5 w-5 text-chart-orange" />
                  <div className="leading-tight">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Closed Won YTD
                    </div>
                    <div className="font-display text-lg font-bold">
                      {stats.data ? formatCurrency(stats.data.closedWonAmount) : '—'}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {stats.data?.closedWonCount ?? 0} negocios cerrados
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Stats principales del banker */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile
                index={0}
                label="Mis clientes"
                value={stats.data ? String(stats.data.totalCustomers) : '—'}
                hint="Person Accounts asignados"
                icon={Users}
                tone="blue"
              />
              <StatTile
                index={1}
                label="Pipeline activo"
                value={stats.data ? formatCurrency(stats.data.totalPipelineAmount) : '—'}
                hint={`${stats.data?.activeOpportunityCount ?? 0} oportunidades`}
                icon={TrendingUp}
                tone="orange"
              />
              <StatTile
                index={2}
                label="Casos abiertos"
                value={stats.data ? String(stats.data.openCases) : '—'}
                hint={`${stats.data?.highPriorityCases ?? 0} alta prioridad`}
                icon={Headphones}
                tone="coral"
              />
              <StatTile
                index={3}
                label="Tasks pendientes"
                value={stats.data ? String(stats.data.pendingTasks) : '—'}
                hint={`de ${stats.data?.totalTasks ?? 0} totales`}
                icon={Briefcase}
                tone="violet"
              />
            </div>

            {/* 3. Sales Cockpit header + summary strip */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-orange/15 text-chart-orange">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold leading-tight">Sales Cockpit</h2>
                  <p className="text-xs text-muted-foreground">
                    Pipeline, forecast y likelihood en tiempo real desde Salesforce.
                  </p>
                </div>
              </div>
              <CockpitSummaryStrip />
            </section>

            {/* 4. Top Open Opportunities + Pipeline by Stage */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <CockpitTopOpps />
              <CockpitPipelineByStage />
            </div>

            {/* 5. Mis clientes (max 5 visibles, scroll al resto) */}
            <CustomerListSection
              customers={customers.data ?? filtered}
              filtered={filtered}
              isLoading={customers.isLoading}
              isError={customers.isError}
              error={customers.error}
              isFetching={customers.isFetching}
              refetch={customers.refetch}
              enrich={enrich.data}
              search={search}
              setSearch={setSearch}
              onRowClick={(id) => navigate(`/customer/${id}`)}
              visibleRows={VISIBLE_CUSTOMER_ROWS}
              maxHeight={CUSTOMER_TABLE_MAX_HEIGHT}
            />

            {/* 6. Forecast Funnel + Pipeline Over Time */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <CockpitForecastFunnel />
              <CockpitPipelineOverTime />
            </div>
          </div>
        </main>
      </div>

      {/* Custom Agent API chat: Worker MCP → Banker Agentforce. */}
      <AgentforceChatPanel />
    </div>
  )
}

interface CustomerListSectionProps {
  customers: ReturnType<typeof useBankerCustomers>['data']
  filtered: NonNullable<ReturnType<typeof useBankerCustomers>['data']>
  isLoading: boolean
  isError: boolean
  error: unknown
  isFetching: boolean
  refetch: () => void
  enrich: ReturnType<typeof useCustomersEnrichment>['data']
  search: string
  setSearch: (s: string) => void
  onRowClick: (id: string) => void
  visibleRows: number
  maxHeight: string
}

function CustomerListSection({
  customers,
  filtered,
  isLoading,
  isError,
  error,
  isFetching,
  refetch,
  enrich,
  search,
  setSearch,
  onRowClick,
  visibleRows,
  maxHeight,
}: CustomerListSectionProps) {
  const total = customers?.length ?? 0
  const showingScrollHint = filtered.length > visibleRows

  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-blue/15 text-chart-blue">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold">Mis clientes</h2>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              {total} en cartera
              {showingScrollHint && (
                <span className="text-muted-foreground/70">
                  · mostrando {visibleRows}, scrolleá para ver el resto
                </span>
              )}
              {isFetching && !isLoading && <InlineSpinner />}
            </p>
          </div>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente o email..."
            className="h-10 w-full rounded-xl border border-border surface-2 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:border-chart-blue/50 focus:outline-none focus:ring-2 focus:ring-chart-blue/20"
          />
        </div>
      </div>

      {isLoading ? (
        <PanelLoading rows={5} />
      ) : isError ? (
        <PanelError message={(error as Error)?.message ?? 'Error desconocido'} onRetry={refetch} />
      ) : (
        <div className="overflow-auto scrollbar-thin" style={{ maxHeight }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-card/95 text-left text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
              <tr>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Contacto</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Ubicación</th>
                <th className="px-5 py-3 text-right font-semibold">Pipeline</th>
                <th className="hidden px-5 py-3 text-right font-semibold sm:table-cell">Opps</th>
                <th className="hidden px-5 py-3 text-right font-semibold sm:table-cell">Casos</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => {
                const e = enrich?.get(c.Id)
                const isPatricio = c.Id === env.demoAccountId
                return (
                  <tr
                    key={c.Id}
                    onClick={() => onRowClick(c.Id)}
                    className={cn(
                      'group cursor-pointer transition-colors hover:bg-secondary/40',
                      isPatricio && 'bg-chart-blue/5 hover:bg-chart-blue/10',
                    )}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={c.Name}
                          isPatricio={isPatricio}
                          pictureUrl={c.Cust360_Contact_Picture_URL__pc}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate font-medium group-hover:text-chart-blue">
                            {c.Name}
                            {isPatricio && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-chart-orange/15 px-1.5 py-0.5 text-[9px] font-medium text-chart-orange">
                                <Star className="h-2.5 w-2.5 fill-current" /> Premium
                              </span>
                            )}
                            {e?.hasHighPriorityCase && (
                              <span title="Caso de alta prioridad abierto">
                                <AlertCircle className="h-3.5 w-3.5 text-chart-coral" />
                              </span>
                            )}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground md:hidden">
                            {c.PersonEmail ?? c.PersonMobilePhone ?? '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      <div className="space-y-0.5">
                        {c.PersonEmail && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{c.PersonEmail}</span>
                          </div>
                        )}
                        {c.PersonMobilePhone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {c.PersonMobilePhone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 lg:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[c.BillingCity, c.BillingCountry].filter(Boolean).join(', ') || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="text-sm font-semibold">
                        {e ? (
                          e.pipelineAmount > 0 ? (
                            formatCurrency(e.pipelineAmount)
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )
                        ) : (
                          <span className="text-muted-foreground/50">…</span>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 text-right text-sm sm:table-cell">
                      {e?.activeOppCount ?? '—'}
                    </td>
                    <td className="hidden px-5 py-3 text-right text-sm sm:table-cell">
                      {e?.openCaseCount ? (
                        <span className={e.hasHighPriorityCase ? 'font-semibold text-chart-coral' : ''}>
                          {e.openCaseCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-chart-blue" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay clientes que coincidan con "{search}".
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function Avatar({
  name,
  isPatricio,
  pictureUrl,
}: {
  name: string
  isPatricio: boolean
  pictureUrl?: string | null
}) {
  if (pictureUrl) {
    return (
      <div
        className={cn(
          'relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-chart-blue to-chart-orange',
          isPatricio && 'ring-2 ring-chart-blue/30',
        )}
      >
        <img
          src={pictureUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.currentTarget
            target.style.display = 'none'
            target.nextElementSibling?.classList.remove('hidden')
          }}
        />
        <div className="absolute inset-0 hidden items-center justify-center text-xs font-semibold text-white">
          {initials(name)}
        </div>
      </div>
    )
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-chart-blue/40 to-chart-violet/40 text-xs font-semibold text-white">
      {initials(name)}
    </div>
  )
}
