import { useState } from 'react'
import { FileText, ChevronRight, Receipt, Calendar } from 'lucide-react'
import { PanelEmpty, PanelError, PanelLoading, InlineSpinner } from './PanelStates'
import { PolicyOperationsDrawer } from './PolicyOperationsDrawer'
import { PolicyDetailDrawer } from './PolicyDetailDrawer'
import { useCustomerPolicies, usePolicyById } from '@/hooks/usePolicies'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STATUS_TONES: Record<string, string> = {
  'In Force': 'bg-chart-mint',
  Lapsed: 'bg-chart-coral',
  Cancelled: 'bg-chart-coral',
}

const STATUS_TEXT_TONES: Record<string, string> = {
  'In Force': 'text-chart-mint',
  Lapsed: 'text-chart-coral',
  Cancelled: 'text-chart-coral',
}

const POLICY_TYPE_ICONS: Record<string, string> = {
  Auto: '🚗',
  Home: '🏠',
  Life: '❤️',
  'Health & Dental': '🩺',
  Health: '🩺',
}

/**
 * Panel equivalente a FinancialAccountsPanel pero para el vertical Insurance.
 * Muestra las pólizas In Force del cliente + banner para abrir el drawer
 * de operaciones (Powered by Data Cloud — Cumulus Core Seguros).
 */
export function InsurancePoliciesPanel() {
  const { data, isLoading, isError, error, refetch, isFetching } = useCustomerPolicies()
  const policies = data ?? []
  const inForce = policies.filter((p) => p.Status === 'In Force')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: selectedPolicy } = usePolicyById(selectedId)

  return (
    <>
      <div className="rounded-2xl border border-border bg-card transition-colors hover:border-border/80">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-coral/15 text-chart-coral">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold">Pólizas contratadas</h3>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                {inForce.length} vigentes · {policies.length} totales
                {isFetching && !isLoading && <InlineSpinner />}
              </p>
            </div>
          </div>
          <button className="text-xs font-medium text-chart-blue hover:underline">Ver todas →</button>
        </div>

        {isLoading ? (
          <PanelLoading rows={3} />
        ) : isError ? (
          <PanelError message={(error as Error)?.message ?? 'Error desconocido'} onRetry={() => refetch()} />
        ) : inForce.length === 0 ? (
          <PanelEmpty message="Sin pólizas vigentes." icon={FileText} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
              {inForce.map((p) => {
                const icon = (p.PolicyType && POLICY_TYPE_ICONS[p.PolicyType]) || '📄'
                const dotTone = STATUS_TONES[p.Status] ?? 'bg-chart-mint'
                const textTone = STATUS_TEXT_TONES[p.Status] ?? 'text-chart-mint'
                return (
                  <button
                    key={p.Id}
                    onClick={() => setSelectedId(p.Id)}
                    className="group relative overflow-hidden rounded-xl border border-border surface-1 p-4 text-left transition-all hover:border-chart-coral/40 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-base leading-none">{icon}</span>
                      {p.PolicyType ?? '—'}
                    </div>
                    <div className="mt-3 font-mono text-[11px] tracking-wider text-foreground/80">
                      {p.Name}
                    </div>
                    <div className="mt-3 text-lg font-bold text-foreground">
                      {p.PremiumAmount != null ? formatCurrency(p.PremiumAmount) : '—'}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                      <span className={cn('inline-flex items-center gap-1', textTone)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', dotTone)} />
                        {p.Status}
                      </span>
                      {p.ExpirationDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {formatDate(p.ExpirationDate)}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setDrawerOpen(true)}
                className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border surface-1 px-4 py-3 text-sm font-medium transition-all hover:border-chart-cyan/40 hover:bg-chart-cyan/5"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-cyan/15 text-chart-cyan">
                    <Receipt className="h-3.5 w-3.5" />
                  </span>
                  <span>Ver operaciones de pólizas</span>
                  <span className="hidden text-[10px] font-normal text-muted-foreground sm:inline">
                    Powered by Data Cloud · Cumulus Core Seguros
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-chart-cyan" />
              </button>
            </div>
          </>
        )}
      </div>

      <PolicyOperationsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <PolicyDetailDrawer
        policy={selectedPolicy ?? null}
        open={!!selectedId}
        onOpenChange={(v) => !v && setSelectedId(null)}
      />
    </>
  )
}
