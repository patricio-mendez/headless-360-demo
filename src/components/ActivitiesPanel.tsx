import { useState } from 'react'
import { Calendar, CheckCircle2, Phone, Mail, Clock } from 'lucide-react'
import { PanelEmpty, PanelError, PanelLoading, InlineSpinner } from './PanelStates'
import { useTasks, useTaskById } from '@/hooks/useCustomer'
import { TaskDetailDrawer } from './TaskDetailDrawer'
import { formatDate } from '@/lib/utils'

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  Completed: CheckCircle2,
  'In Progress': Clock,
  'Not Started': Clock,
  Deferred: Clock,
  Waiting: Clock,
}
const statusColor: Record<string, string> = {
  Completed: 'text-chart-mint',
  'In Progress': 'text-chart-blue',
  'Not Started': 'text-muted-foreground',
  Deferred: 'text-muted-foreground',
  Waiting: 'text-chart-orange',
}

function kindFromSubject(subject: string): React.ComponentType<{ className?: string }> {
  const s = subject.toLowerCase()
  if (s.includes('llamada') || s.includes('call')) return Phone
  if (s.includes('email')) return Mail
  return Calendar
}

export function ActivitiesPanel() {
  const { data, isLoading, isError, error, refetch, isFetching } = useTasks()
  const tasks = data ?? []
  const pending = tasks.filter((t) => t.Status !== 'Completed').length
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const { data: drawerTask } = useTaskById(drawerId)

  return (
    <div className="rounded-2xl border border-border bg-card transition-colors hover:border-border/80">
      <TaskDetailDrawer
        task={drawerTask ?? null}
        open={!!drawerId}
        onOpenChange={(v) => !v && setDrawerId(null)}
      />
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-violet/15 text-chart-violet">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">Actividades</h3>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              {tasks.length} tasks · {pending} pendientes
              {isFetching && !isLoading && <InlineSpinner />}
            </p>
          </div>
        </div>
        <button className="text-xs font-medium text-chart-blue hover:underline">Ver todas →</button>
      </div>
      {isLoading ? (
        <PanelLoading rows={4} />
      ) : isError ? (
        <PanelError message={(error as Error)?.message ?? 'Error desconocido'} onRetry={() => refetch()} />
      ) : tasks.length === 0 ? (
        <PanelEmpty message="Sin actividades registradas." icon={Calendar} />
      ) : (
        <div className="space-y-1 p-3">
          {tasks.map((t) => {
            const KindIcon = kindFromSubject(t.Subject ?? '')
            const StatusIcon = statusIcon[t.Status] ?? Clock
            return (
              <button
                key={t.Id}
                type="button"
                onClick={() => setDrawerId(t.Id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-chart-blue/40"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground">
                  <KindIcon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{t.Subject ?? 'Sin asunto'}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{formatDate(t.ActivityDate)}</span>
                    {t.Priority === 'High' && (
                      <span className="rounded-md bg-chart-coral/15 px-1.5 py-0.5 text-chart-coral">Alta</span>
                    )}
                  </div>
                </div>
                <StatusIcon className={`h-4 w-4 ${statusColor[t.Status] ?? 'text-muted-foreground'}`} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
