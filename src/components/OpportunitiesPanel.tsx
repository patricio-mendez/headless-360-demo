import { useState } from 'react'
import { Briefcase, TrendingUp, ChevronRight } from 'lucide-react'
import { Progress } from './Progress'
import { DataTooltip } from './Tooltip'
import { PanelEmpty, PanelError, PanelLoading, InlineSpinner } from './PanelStates'
import { OpportunityDetailDrawer } from './OpportunityDetailDrawer'
import { useOpportunities } from '@/hooks/useCustomer'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Opportunity } from '@/types/salesforce'

const stageColor: Record<string, string> = {
  Underwriting: 'bg-chart-orange/15 text-chart-orange',
  'Proposal/Quote': 'bg-chart-blue/15 text-chart-blue',
  'Closed Won': 'bg-chart-mint/15 text-chart-mint',
  'Closed Lost': 'bg-chart-coral/15 text-chart-coral',
  Prospecting: 'bg-chart-cyan/15 text-chart-cyan',
  Qualification: 'bg-chart-cyan/15 text-chart-cyan',
  'Needs Analysis': 'bg-chart-blue/15 text-chart-blue',
  Negotiation: 'bg-chart-violet/15 text-chart-violet',
}

export function OpportunitiesPanel() {
  const { data, isLoading, isError, error, refetch, isFetching } = useOpportunities()
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [open, setOpen] = useState(false)
  const opps = data ?? []
  const totalPipeline = opps
    .filter((o) => !o.StageName.startsWith('Closed'))
    .reduce((sum, o) => sum + (o.Amount ?? 0), 0)

  function handleSelect(opp: Opportunity) {
    setSelected(opp)
    setOpen(true)
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card transition-colors hover:border-border/80">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-blue/15 text-chart-blue">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold">Oportunidades</h3>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                {opps.length} oportunidades
                {totalPipeline > 0 && <> · {formatCurrency(totalPipeline)} en pipeline</>}
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
        ) : opps.length === 0 ? (
          <PanelEmpty message="Este cliente no tiene oportunidades aún." icon={Briefcase} />
        ) : (
          <div className="divide-y divide-border">
            {opps.map((opp) => (
              <button
                key={opp.Id}
                onClick={() => handleSelect(opp)}
                className="group block w-full space-y-2.5 p-5 text-left transition-colors hover:bg-secondary/40 focus:bg-secondary/50 focus:outline-none"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 font-medium leading-tight">
                      <span className="truncate group-hover:text-chart-blue">{opp.Name}</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-chart-blue" />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`rounded-md px-2 py-0.5 font-medium ${stageColor[opp.StageName] ?? 'bg-secondary text-muted-foreground'}`}
                      >
                        {opp.StageName}
                      </span>
                      <span className="text-muted-foreground">Cierre {formatDate(opp.CloseDate)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-base font-semibold">{formatCurrency(opp.Amount)}</div>
                    <DataTooltip
                      title={`Probabilidad ${opp.Probability}%`}
                      description={`Forecast esperado: ${formatCurrency(((opp.Amount ?? 0) * opp.Probability) / 100)}`}
                      source="Opportunity.Probability"
                      side="left"
                    >
                      <div className="mt-1 inline-flex cursor-help items-center justify-end gap-1 text-xs text-chart-mint">
                        <TrendingUp className="h-3 w-3" /> {opp.Probability}%
                      </div>
                    </DataTooltip>
                  </div>
                </div>
                <Progress value={opp.Probability} tone="auto" size="sm" />
              </button>
            ))}
          </div>
        )}
      </div>

      <OpportunityDetailDrawer opportunity={selected} open={open} onOpenChange={setOpen} />
    </>
  )
}
