import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Search, MapPin, Mail, Phone } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { PanelLoading, PanelError } from '@/components/PanelStates'
import { useBankerCustomers, useCustomersEnrichment } from '@/hooks/useBookOfBusiness'
import { initials, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PINNED_NAMES = ['Patricio Mendez', 'Ana Silva', 'Juan Perez', 'Pedro Munoz', 'Maria Gonzalez']

function pinnedRank(name: string): number {
  const idx = PINNED_NAMES.findIndex((p) => name?.toLowerCase().startsWith(p.toLowerCase()))
  return idx === -1 ? 999 : idx
}

export function CustomersListPage() {
  const { data: customers = [], isLoading, isError, error, refetch } = useBankerCustomers()
  const { data: enrichments } = useCustomersEnrichment(customers.map((c) => c.Id))
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? customers.filter(
          (c) =>
            c.Name.toLowerCase().includes(q) ||
            (c.PersonEmail ?? '').toLowerCase().includes(q) ||
            (c.BillingCity ?? '').toLowerCase().includes(q),
        )
      : customers
    return [...list].sort((a, b) => {
      const ra = pinnedRank(a.Name)
      const rb = pinnedRank(b.Name)
      if (ra !== rb) return ra - rb
      return a.Name.localeCompare(b.Name)
    })
  }, [customers, search])

  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <Users className="h-3 w-3" />
              Mi cartera
            </div>
            <h1 className="font-display text-3xl font-bold">Clientes</h1>
            <p className="text-sm text-muted-foreground">
              {customers.length} clientes en tu libro · ordenados por relevancia
            </p>
          </div>
          <div className="relative w-80 max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email, ciudad…"
              className="h-10 w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-chart-blue/50 focus:outline-none focus:ring-2 focus:ring-chart-blue/20"
            />
          </div>
        </header>

        {isLoading ? (
          <PanelLoading rows={6} />
        ) : isError ? (
          <PanelError
            message={(error as Error)?.message ?? 'Error al cargar clientes'}
            onRetry={() => refetch()}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Contacto</th>
                  <th className="px-5 py-3">Ubicación</th>
                  <th className="px-5 py-3 text-right">Pipeline</th>
                  <th className="px-5 py-3 text-right">Casos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => {
                  const enr = enrichments?.get(c.Id)
                  const isPinned = pinnedRank(c.Name) < PINNED_NAMES.length
                  return (
                    <tr key={c.Id} className="transition-colors hover:bg-secondary/40">
                      <td className="px-5 py-3">
                        <Link to={`/customer/${c.Id}`} className="flex items-center gap-3">
                          <div
                            className={cn(
                              'relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg text-xs font-bold text-white',
                              isPinned
                                ? 'bg-gradient-to-br from-chart-blue to-chart-violet'
                                : 'bg-gradient-to-br from-chart-cyan to-chart-blue',
                            )}
                          >
                            {c.Cust360_Contact_Picture_URL__pc ? (
                              <img
                                src={c.Cust360_Contact_Picture_URL__pc}
                                alt={c.Name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget
                                  target.style.display = 'none'
                                }}
                              />
                            ) : (
                              initials(c.Name)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate font-medium">{c.Name}</span>
                              {isPinned && (
                                <span className="rounded-full bg-chart-orange/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-chart-orange">
                                  Pinned
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Cliente desde {new Date(c.CreatedDate).getFullYear()}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-0.5 text-[11px] text-muted-foreground">
                          {c.PersonEmail && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{c.PersonEmail}</span>
                            </div>
                          )}
                          {c.PersonMobilePhone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              <span>{c.PersonMobilePhone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[11px] text-muted-foreground">
                        {(c.BillingCity || c.BillingCountry) && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" />
                            <span>{[c.BillingCity, c.BillingCountry].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs">
                        {enr?.pipelineAmount ? (
                          <span className="text-chart-mint">{formatCurrency(enr.pipelineAmount)}</span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                        {enr?.activeOppCount ? (
                          <div className="text-[10px] text-muted-foreground">
                            {enr.activeOppCount} oport.
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-right text-xs">
                        {enr?.openCaseCount ? (
                          <span
                            className={cn(
                              'rounded-md px-2 py-0.5 font-semibold',
                              enr.hasHighPriorityCase
                                ? 'bg-chart-coral/15 text-chart-coral'
                                : 'bg-chart-orange/15 text-chart-orange',
                            )}
                          >
                            {enr.openCaseCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">0</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Sin resultados para "{search}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
