import { useState } from 'react'
import { Headphones, Globe, MessageCircle, Mail, Phone, FileText, ChevronRight } from 'lucide-react'
import { PanelEmpty, PanelError, PanelLoading, InlineSpinner } from './PanelStates'
import { CaseDetailDrawer } from './CaseDetailDrawer'
import { useCases } from '@/hooks/useCustomer'
import { formatDate } from '@/lib/utils'
import type { Case } from '@/types/salesforce'

const statusColor: Record<string, string> = {
  New: 'bg-chart-blue/15 text-chart-blue',
  Working: 'bg-chart-orange/15 text-chart-orange',
  Escalated: 'bg-chart-coral/15 text-chart-coral',
  'Waiting on Customer': 'bg-chart-violet/15 text-chart-violet',
  'Reply Received': 'bg-chart-cyan/15 text-chart-cyan',
  'Research & Investigation': 'bg-chart-violet/15 text-chart-violet',
  'Merchant Alert': 'bg-chart-orange/15 text-chart-orange',
  'Provisional Credit': 'bg-chart-cyan/15 text-chart-cyan',
  Closed: 'bg-chart-mint/15 text-chart-mint',
}

const originIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  Website: Globe,
  WhatsApp: MessageCircle,
  Email: Mail,
  Phone: Phone,
}

export function CasesPanel() {
  const { data, isLoading, isError, error, refetch, isFetching } = useCases()
  const [selected, setSelected] = useState<Case | null>(null)
  const [open, setOpen] = useState(false)
  const cases = data ?? []
  const openCount = cases.filter((c) => c.Status !== 'Closed').length

  function handleSelect(c: Case) {
    setSelected(c)
    setOpen(true)
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card transition-colors hover:border-border/80">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-coral/15 text-chart-coral">
              <Headphones className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold">Casos de Servicio</h3>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                {cases.length} casos · {openCount} abiertos
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
        ) : cases.length === 0 ? (
          <PanelEmpty message="Sin requerimientos abiertos." icon={Headphones} />
        ) : (
          <div className="max-h-[360px] divide-y divide-border overflow-y-auto scrollbar-thin">
            {cases.slice(0, 10).map((c) => {
              const OriginIcon = originIcon[c.Origin] ?? FileText
              return (
                <button
                  key={c.Id}
                  onClick={() => handleSelect(c)}
                  className="group block w-full p-4 text-left transition-colors hover:bg-secondary/40 focus:bg-secondary/50 focus:outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-muted-foreground">
                      <OriginIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">#{c.CaseNumber}</span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${statusColor[c.Status] ?? 'bg-secondary text-muted-foreground'}`}
                        >
                          {c.Status}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-medium group-hover:text-chart-coral">
                        <span className="truncate">{c.Subject ?? `Caso ${c.Origin}`}</span>
                        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-chart-coral" />
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">{formatDate(c.CreatedDate)}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <CaseDetailDrawer caseRecord={selected} open={open} onOpenChange={setOpen} />
    </>
  )
}
