import { useState } from 'react'
import { CalendarRange, Maximize2 } from 'lucide-react'
import { useTimelineEvents, EventTimeline, LegendDot, LegendChannelDot } from './EventTimeline'
import { InteractionsDrawer } from './InteractionsDrawer'
import { PanelEmpty, PanelError, PanelLoading, InlineSpinner } from './PanelStates'
import { formatDate } from '@/lib/utils'

/** Timeline de interacciones (colapsado, dashboard). Comparte fuente y render con el drawer. */
export function ActivitiesTimeline() {
  const { events, interactions, isLoading, isError, error, refetch, isFetching } = useTimelineEvents()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const minMs = events.length ? Math.min(...events.map((e) => e.ms)) : null
  const maxMs = events.length ? Math.max(...events.map((e) => e.ms)) : null
  const hasInteractions = interactions.length > 0

  return (
    <div className="rounded-2xl border border-border bg-card transition-colors hover:border-border/80">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-violet/15 text-chart-violet">
            <CalendarRange className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">Timeline de interacciones y actividades</h3>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              {events.length} eventos con fecha
              {minMs && maxMs && ` · ${formatDate(new Date(minMs).toISOString())} → ${formatDate(new Date(maxMs).toISOString())}`}
              {isFetching && !isLoading && <InlineSpinner />}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Referencias — más a la izquierda, separadas del botón por un divisor */}
          <div className="hidden items-center gap-3 text-[10px] text-muted-foreground xl:flex">
            <LegendDot tone="mint" label="Actividad" />
            <LegendChannelDot tone="violet" label="Campaña" />
            <LegendChannelDot tone="cyan" label="Web" />
            <LegendChannelDot tone="mint" label="Mensaje" />
          </div>
          {hasInteractions && (
            <>
              <div className="hidden h-6 w-px bg-border xl:block" />
              <button
                onClick={() => setDrawerOpen(true)}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-chart-violet to-chart-cyan px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-chart-violet/25 ring-1 ring-white/10 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-chart-violet/40 active:scale-95"
              >
                <Maximize2 className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
                Ampliar
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <PanelLoading rows={2} />
      ) : isError ? (
        <PanelError message={error?.message ?? 'Error desconocido'} onRetry={() => refetch()} />
      ) : events.length === 0 ? (
        <PanelEmpty message="No hay actividades con fecha para graficar." icon={CalendarRange} />
      ) : (
        <EventTimeline events={events} />
      )}

      <InteractionsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  )
}
