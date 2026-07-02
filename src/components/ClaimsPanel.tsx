import { useState } from 'react'
import { AlertOctagon, ChevronRight, AlertTriangle } from 'lucide-react'
import { PanelEmpty, PanelError, PanelLoading, InlineSpinner } from './PanelStates'
import { ClaimDetailDrawer } from './ClaimDetailDrawer'
import { useCustomerClaims } from '@/hooks/useClaims'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Claim } from '@/types/insurance'

const statusColor: Record<string, string> = {
  Active: 'bg-chart-blue/15 text-chart-blue',
  Open: 'bg-chart-blue/15 text-chart-blue',
  'Coverage Evaluation': 'bg-chart-orange/15 text-chart-orange',
  'Under Review': 'bg-chart-orange/15 text-chart-orange',
  Closed: 'bg-chart-mint/15 text-chart-mint',
  Settled: 'bg-chart-mint/15 text-chart-mint',
  Denied: 'bg-chart-coral/15 text-chart-coral',
  Rejected: 'bg-chart-coral/15 text-chart-coral',
}

const severityColor: Record<string, string> = {
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

/**
 * Panel de Claims del cliente actual (vertical Insurance).
 * Réplica del patrón CasesPanel — cada row abre ClaimDetailDrawer al click.
 */
export function ClaimsPanel() {
  const { data, isLoading, isError, error, refetch, isFetching } = useCustomerClaims()
  const [selected, setSelected] = useState<Claim | null>(null)
  const [open, setOpen] = useState(false)
  const claims = data ?? []
  const openCount = claims.filter((c) => !c.IsClosed).length
  const highSev = claims.filter((c) => !c.IsClosed && c.Severity === 'High').length

  function handleSelect(c: Claim) {
    setSelected(c)
    setOpen(true)
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card transition-colors hover:border-border/80">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-coral/15 text-chart-coral">
              <AlertOctagon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold">Claims</h3>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                {claims.length} claims · {openCount} abiertos
                {highSev > 0 && (
                  <span className="inline-flex items-center gap-1 text-chart-coral">
                    · <AlertTriangle className="h-3 w-3" />
                    {highSev} alta severidad
                  </span>
                )}
                {isFetching && !isLoading && <InlineSpinner />}
              </p>
            </div>
          </div>
          <button className="text-xs font-medium text-chart-blue hover:underline">Ver todos →</button>
        </div>
        {isLoading ? (
          <PanelLoading rows={4} />
        ) : isError ? (
          <PanelError message={(error as Error)?.message ?? 'Error desconocido'} onRetry={() => refetch()} />
        ) : claims.length === 0 ? (
          <PanelEmpty message="Sin claims para este asegurado." icon={AlertOctagon} />
        ) : (
          <div className="max-h-[360px] divide-y divide-border overflow-y-auto scrollbar-thin">
            {claims.slice(0, 10).map((c) => {
              const icon = (c.ClaimType && CLAIM_TYPE_ICONS[c.ClaimType]) || '📋'
              const amount =
                c.TotalClaimedAmount && c.TotalClaimedAmount > 0
                  ? c.TotalClaimedAmount
                  : c.EstimatedAmount && c.EstimatedAmount > 0
                    ? c.EstimatedAmount
                    : null
              return (
                <button
                  key={c.Id}
                  onClick={() => handleSelect(c)}
                  className="group block w-full p-4 text-left transition-colors hover:bg-secondary/40 focus:bg-secondary/50 focus:outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-base">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">{c.Name}</span>
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-[10px] font-medium',
                            statusColor[c.Status] ?? 'bg-secondary text-muted-foreground',
                          )}
                        >
                          {c.Status}
                        </span>
                        {c.Severity && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[10px] font-medium',
                              severityColor[c.Severity] ?? 'bg-secondary text-muted-foreground',
                            )}
                          >
                            {c.Severity === 'High' && <AlertTriangle className="h-2.5 w-2.5" />}
                            {c.Severity}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-medium group-hover:text-chart-coral">
                        <span className="truncate">
                          {c.ClaimReason ?? c.InsuredAsset?.AssetName ?? c.ClaimType ?? 'Claim'}
                        </span>
                        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-chart-coral" />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {amount != null && (
                        <div className="text-sm font-semibold tabular-nums text-chart-coral">
                          {formatCurrency(amount)}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {formatDate(c.LossDate ?? c.CreatedDate ?? '')}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <ClaimDetailDrawer claim={selected} open={open} onOpenChange={setOpen} />
    </>
  )
}
