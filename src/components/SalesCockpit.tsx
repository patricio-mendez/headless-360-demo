import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Target, BarChart3, Activity } from 'lucide-react'
import { useBookOpportunities } from '@/hooks/useBookOfBusiness'
import { PanelLoading } from './PanelStates'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Opportunity } from '@/types/salesforce'

const FORECAST_CATEGORIES = [
  { key: 'Pipeline', label: '1 · Pipeline', color: 'hsl(213 95% 60%)' },
  { key: 'Best Case', label: '2 · Best Case', color: 'hsl(186 80% 58%)' },
  { key: 'Commit', label: '3 · Commit', color: 'hsl(158 70% 55%)' },
  { key: 'Closed', label: '4 · Closed', color: 'hsl(20 96% 62%)' },
]

const QUOTA = 1_000_000_000 // 1B CLP — quota anual del banker (mock)

export function SalesCockpit() {
  const { data, isLoading } = useBookOpportunities()
  const opps = data ?? []

  const byCategory = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>()
    FORECAST_CATEGORIES.forEach((c) => map.set(c.key, { total: 0, count: 0 }))
    opps.forEach((o) => {
      const cat = o.ForecastCategoryName ?? 'Pipeline'
      const entry = map.get(cat) ?? map.get('Pipeline')!
      entry.total += o.Amount ?? 0
      entry.count += 1
    })
    return map
  }, [opps])

  const closedAmount = byCategory.get('Closed')?.total ?? 0
  const commitAmount = byCategory.get('Commit')?.total ?? 0
  const quotaAttainment = QUOTA > 0 ? ((closedAmount + commitAmount) / QUOTA) * 100 : 0

  const summaryStats = useMemo(() => {
    const closed = opps.filter((o) => o.StageName === 'Closed Won')
    const closedSum = closed.reduce((s, o) => s + (o.Amount ?? 0), 0)
    const committed = opps.filter((o) => o.ForecastCategoryName === 'Commit' || o.ForecastCategoryName === 'Closed')
    const committedSum = committed.reduce((s, o) => s + (o.Amount ?? 0), 0)
    return {
      closed: closedSum,
      committed: committedSum,
      attainment: quotaAttainment,
      avgCycle: 52,
      avgNps: 61.6,
    }
  }, [opps, quotaAttainment])

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card">
        <PanelLoading rows={6} />
      </section>
    )
  }

  return (
    <section className="space-y-6">
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

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <SummaryCell label="Closed" value={formatCurrency(summaryStats.closed)} />
        <SummaryCell label="Committed" value={formatCurrency(summaryStats.committed)} />
        <SummaryCell label="Quota Attainment" value={`${summaryStats.attainment.toFixed(2)}%`} />
        <SummaryCell label="Avg Sales Cycle" value={`${summaryStats.avgCycle} days`} />
        <SummaryCell label="Avg NPS" value={summaryStats.avgNps.toFixed(1)} />
      </div>

      {/* Top row: Forecast Funnel + Pipeline Over Time */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ForecastFunnelCard byCategory={byCategory} />
        <PipelineOverTimeCard opps={opps} />
      </div>

      {/* Bottom row: Top Opps + Stage breakdown */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TopOpenOpportunitiesCard opps={opps} />
        <PipelineByStageCard opps={opps} />
      </div>
    </section>
  )
}

/* ───────────────────────── Bloques exportables individuales ───────────────────────── */

export function CockpitSummaryStrip() {
  const { data, isLoading } = useBookOpportunities()
  const opps = data ?? []

  const stats = useMemo(() => {
    const closed = opps.filter((o) => o.StageName === 'Closed Won').reduce((s, o) => s + (o.Amount ?? 0), 0)
    const committed = opps
      .filter((o) => o.ForecastCategoryName === 'Commit' || o.ForecastCategoryName === 'Closed')
      .reduce((s, o) => s + (o.Amount ?? 0), 0)
    return {
      closed,
      committed,
      attainment: QUOTA > 0 ? ((closed + committed) / QUOTA) * 100 : 0,
      avgCycle: 52,
      avgNps: 61.6,
    }
  }, [opps])

  if (isLoading) return null

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <SummaryCell label="Closed" value={formatCurrency(stats.closed)} />
      <SummaryCell label="Committed" value={formatCurrency(stats.committed)} />
      <SummaryCell label="Quota Attainment" value={`${stats.attainment.toFixed(2)}%`} />
      <SummaryCell label="Avg Sales Cycle" value={`${stats.avgCycle} days`} />
      <SummaryCell label="Avg NPS" value={stats.avgNps.toFixed(1)} />
    </div>
  )
}

export function CockpitTopOpps() {
  const { data, isLoading } = useBookOpportunities()
  if (isLoading)
    return (
      <div className="rounded-2xl border border-border bg-card">
        <PanelLoading rows={5} />
      </div>
    )
  return <TopOpenOpportunitiesCard opps={data ?? []} />
}

export function CockpitPipelineByStage() {
  const { data, isLoading } = useBookOpportunities()
  if (isLoading)
    return (
      <div className="rounded-2xl border border-border bg-card">
        <PanelLoading rows={5} />
      </div>
    )
  return <PipelineByStageCard opps={data ?? []} />
}

export function CockpitForecastFunnel() {
  const { data, isLoading } = useBookOpportunities()
  const byCategory = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>()
    FORECAST_CATEGORIES.forEach((c) => map.set(c.key, { total: 0, count: 0 }))
    ;(data ?? []).forEach((o) => {
      const cat = o.ForecastCategoryName ?? 'Pipeline'
      const entry = map.get(cat) ?? map.get('Pipeline')!
      entry.total += o.Amount ?? 0
      entry.count += 1
    })
    return map
  }, [data])
  if (isLoading)
    return (
      <div className="rounded-2xl border border-border bg-card">
        <PanelLoading rows={4} />
      </div>
    )
  return <ForecastFunnelCard byCategory={byCategory} />
}

export function CockpitPipelineOverTime() {
  const { data, isLoading } = useBookOpportunities()
  if (isLoading)
    return (
      <div className="rounded-2xl border border-border bg-card">
        <PanelLoading rows={5} />
      </div>
    )
  return <PipelineOverTimeCard opps={data ?? []} />
}

function SummaryCell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  )
}

/* ───────────────────────── Forecast Funnel ───────────────────────── */

function ForecastFunnelCard({ byCategory }: { byCategory: Map<string, { total: number; count: number }> }) {
  const entries = FORECAST_CATEGORIES.map((cat) => ({
    cat,
    ...(byCategory.get(cat.key) ?? { total: 0, count: 0 }),
  }))
  const rawMax = Math.max(...entries.map((e) => e.total), 1)
  const maxValue = niceMax(rawMax)

  // SVG layout — bar chart vertical
  const W = 600
  const H = 280
  const PAD = { top: 28, right: 16, bottom: 56, left: 64 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const slotW = innerW / entries.length
  const barW = Math.min(slotW * 0.55, 80)

  const yScale = (v: number) => PAD.top + innerH - (v / maxValue) * innerH
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    v: maxValue * p,
    y: yScale(maxValue * p),
    label: shortNumber(maxValue * p),
  }))

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-4 w-4 text-chart-blue" />
        <h3 className="font-display text-base font-semibold">Opportunities by Forecast Category</h3>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Opportunities by forecast category">
        <defs>
          {entries.map((e, i) => (
            <linearGradient key={i} id={`forecast-bar-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={e.cat.color} stopOpacity="1" />
              <stop offset="100%" stopColor={e.cat.color} stopOpacity="0.65" />
            </linearGradient>
          ))}
        </defs>

        {/* Y grid + labels */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
              stroke="hsl(var(--border))"
              strokeDasharray="2 4"
              opacity="0.6"
            />
            <text
              x={PAD.left - 8}
              y={t.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="hsl(var(--muted-foreground))"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* Bars */}
        {entries.map((e, i) => {
          const slotCenter = PAD.left + slotW * i + slotW / 2
          const barX = slotCenter - barW / 2
          const barY = yScale(e.total)
          const barH = PAD.top + innerH - barY
          const labelY = barY - 8
          return (
            <g key={e.cat.key}>
              <rect
                x={barX}
                y={barY}
                width={barW}
                height={Math.max(barH, e.total > 0 ? 2 : 0)}
                rx="6"
                fill={`url(#forecast-bar-${i})`}
              >
                <title>
                  {e.cat.label}: {formatCurrency(e.total)} · {e.count} opps
                </title>
              </rect>
              {/* Value label sobre la barra */}
              {e.total > 0 && (
                <text
                  x={slotCenter}
                  y={labelY}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="hsl(var(--foreground))"
                >
                  {shortCurrency(e.total)}
                </text>
              )}
              {/* X axis label (categoría) */}
              <text
                x={slotCenter}
                y={H - PAD.bottom + 18}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="hsl(var(--muted-foreground))"
              >
                {e.cat.label}
              </text>
              {/* Cantidad de opps debajo */}
              <text
                x={slotCenter}
                y={H - PAD.bottom + 34}
                textAnchor="middle"
                fontSize="10"
                fill="hsl(var(--muted-foreground))"
                opacity="0.7"
              >
                {e.count} {e.count === 1 ? 'opp' : 'opps'}
              </text>
            </g>
          )
        })}

        {/* X axis baseline */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + innerH}
          y2={PAD.top + innerH}
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

/** Redondea hacia arriba a un valor "lindo" (1, 2, 5 × 10^n). */
function niceMax(value: number): number {
  if (value <= 0) return 1
  const exponent = Math.floor(Math.log10(value))
  const fraction = value / Math.pow(10, exponent)
  let niceFraction
  if (fraction <= 1) niceFraction = 1
  else if (fraction <= 2) niceFraction = 2
  else if (fraction <= 5) niceFraction = 5
  else niceFraction = 10
  return niceFraction * Math.pow(10, exponent)
}

/* ───────────────────────── Pipeline Over Time ───────────────────────── */

function PipelineOverTimeCard({ opps }: { opps: Opportunity[] }) {
  const dataPoints = useMemo(() => {
    const sorted = [...opps]
      .filter((o) => o.CloseDate && (o.Amount ?? 0) > 0)
      .sort((a, b) => new Date(a.CloseDate).getTime() - new Date(b.CloseDate).getTime())

    let cumul = 0
    return sorted.map((o) => {
      cumul += o.Amount ?? 0
      return { date: o.CloseDate, cumulative: cumul, opp: o }
    })
  }, [opps])

  if (dataPoints.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-chart-blue" />
          <h3 className="font-display text-base font-semibold">Pipeline Over Time</h3>
        </div>
        <div className="grid h-48 place-items-center text-sm text-muted-foreground">
          Sin datos suficientes
        </div>
      </div>
    )
  }

  const W = 600
  const H = 220
  const PAD = { top: 24, right: 24, bottom: 32, left: 56 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const startMs = new Date(dataPoints[0].date).getTime()
  const endMs = new Date(dataPoints[dataPoints.length - 1].date).getTime()
  const rangeMs = Math.max(endMs - startMs, 1)
  const maxValue = Math.max(...dataPoints.map((d) => d.cumulative), QUOTA) * 1.1

  const xScale = (ms: number) => PAD.left + ((ms - startMs) / rangeMs) * innerW
  const yScale = (v: number) => PAD.top + innerH - (v / maxValue) * innerH

  const linePath = dataPoints
    .map((d, i) => {
      const x = xScale(new Date(d.date).getTime())
      const y = yScale(d.cumulative)
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`
    })
    .join(' ')

  const areaPath = `${linePath} L ${xScale(endMs)},${PAD.top + innerH} L ${PAD.left},${PAD.top + innerH} Z`

  const quotaY = yScale(QUOTA)

  // Y axis ticks
  const yTicks = [0, maxValue / 4, maxValue / 2, (maxValue * 3) / 4, maxValue].map((v) => ({
    v,
    y: yScale(v),
    label: shortNumber(v),
  }))

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-chart-blue" />
        <h3 className="font-display text-base font-semibold">Pipeline Over Time</h3>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Pipeline over time">
        <defs>
          <linearGradient id="pipeline-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(213 95% 60%)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(213 95% 60%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Y grid */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
              stroke="hsl(var(--border))"
              strokeDasharray="2 4"
              opacity="0.6"
            />
            <text
              x={PAD.left - 8}
              y={t.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="hsl(var(--muted-foreground))"
            >
              {t.label}
            </text>
          </g>
        ))}
        {/* Quota line */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={quotaY}
          y2={quotaY}
          stroke="hsl(268 80% 70%)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <rect x={PAD.left + 8} y={quotaY - 18} width="125" height="16" rx="8" fill="hsl(268 80% 70%)" />
        <text x={PAD.left + 70} y={quotaY - 6} textAnchor="middle" fontSize="10" fill="white" fontWeight="600">
          Quota = {formatCurrency(QUOTA)}
        </text>
        {/* Area + line */}
        <path d={areaPath} fill="url(#pipeline-area)" />
        <path d={linePath} fill="none" stroke="hsl(213 95% 60%)" strokeWidth="2" />
        {/* Dots */}
        {dataPoints.map((d, i) => (
          <circle
            key={i}
            cx={xScale(new Date(d.date).getTime())}
            cy={yScale(d.cumulative)}
            r="3"
            fill="hsl(213 95% 60%)"
            stroke="hsl(var(--card))"
            strokeWidth="1.5"
          >
            <title>
              {d.opp.Name} · {formatDate(d.date)} · {formatCurrency(d.opp.Amount)}
            </title>
          </circle>
        ))}
        {/* X axis labels */}
        <text
          x={PAD.left}
          y={H - 10}
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
        >
          {formatDate(dataPoints[0].date)}
        </text>
        <text
          x={W - PAD.right}
          y={H - 10}
          textAnchor="end"
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
        >
          {formatDate(dataPoints[dataPoints.length - 1].date)}
        </text>
      </svg>
    </div>
  )
}

/* ───────────────────────── Top Open Opportunities ───────────────────────── */

function TopOpenOpportunitiesCard({ opps }: { opps: Opportunity[] }) {
  const navigate = useNavigate()
  const top = useMemo(() => {
    return [...opps]
      .filter((o) => !o.StageName.startsWith('Closed') && (o.Amount ?? 0) > 0)
      .sort((a, b) => (b.Amount ?? 0) - (a.Amount ?? 0))
      .slice(0, 10)
  }, [opps])

  const maxAmount = Math.max(...top.map((o) => o.Amount ?? 0), 1)

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-chart-violet" />
          <h3 className="font-display text-base font-semibold">Top Open Opportunities</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Priorizadas por Amount · click para ver detalle del cliente
        </p>
      </div>
      {top.length === 0 ? (
        <div className="grid h-32 place-items-center text-sm text-muted-foreground">Sin opps abiertas</div>
      ) : (
        <ul className="divide-y divide-border">
          {top.map((o) => {
            const widthPct = ((o.Amount ?? 0) / maxAmount) * 100
            const acct = (o as Opportunity & { AccountId?: string }).AccountId
            return (
              <li key={o.Id}>
                <button
                  onClick={() => acct && navigate(`/customer/${acct}`)}
                  className="grid w-full grid-cols-[100px_1fr_72px] items-center gap-3 p-3 text-left text-xs transition-colors hover:bg-secondary/40 sm:grid-cols-[120px_1fr_80px]"
                >
                  {/* amount bar */}
                  <div className="relative h-6 overflow-hidden rounded-md surface-2">
                    <div
                      className="absolute inset-y-0 left-0 flex items-center px-2 bg-chart-blue text-white"
                      style={{ width: `${Math.max(widthPct, 12)}%` }}
                    >
                      <span className="truncate text-[10px] font-semibold">{shortCurrency(o.Amount ?? 0)}</span>
                    </div>
                  </div>
                  {/* name */}
                  <div className="min-w-0 truncate font-medium text-foreground">{o.Name}</div>
                  {/* probability */}
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="relative h-1.5 w-12 overflow-hidden rounded-full bg-chart-violet/20">
                      <div
                        className="absolute inset-y-0 left-0 bg-chart-violet"
                        style={{ width: `${o.Probability}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[10px] text-chart-violet">{o.Probability}%</span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ───────────────────────── Pipeline by Stage ───────────────────────── */

const STAGE_COLORS = [
  'hsl(213 95% 60%)',
  'hsl(186 80% 58%)',
  'hsl(268 80% 70%)',
  'hsl(20 96% 62%)',
  'hsl(158 70% 55%)',
  'hsl(8 88% 65%)',
]

function PipelineByStageCard({ opps }: { opps: Opportunity[] }) {
  const stages = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>()
    opps.forEach((o) => {
      const cur = map.get(o.StageName) ?? { total: 0, count: 0 }
      cur.total += o.Amount ?? 0
      cur.count += 1
      map.set(o.StageName, cur)
    })
    return [...map.entries()]
      .map(([stage, v]) => ({ stage, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [opps])

  const totalAll = stages.reduce((s, st) => s + st.total, 0)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-chart-cyan" />
        <h3 className="font-display text-base font-semibold">Pipeline by Stage</h3>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">Top 8 stages por monto · pasá el mouse para detalle</p>

      {stages.length === 0 ? (
        <div className="grid h-32 place-items-center text-sm text-muted-foreground">Sin opportunities</div>
      ) : (
        <>
          {/* Stacked bar */}
          <div className="flex h-10 w-full overflow-hidden rounded-xl surface-2">
            {stages.map((st, i) => {
              const widthPct = (st.total / totalAll) * 100
              const isActive = hovered === st.stage
              return (
                <div
                  key={st.stage}
                  onMouseEnter={() => setHovered(st.stage)}
                  onMouseLeave={() => setHovered(null)}
                  className={cn(
                    'relative cursor-pointer transition-all',
                    isActive ? 'brightness-125' : '',
                  )}
                  style={{
                    width: `${widthPct}%`,
                    background: STAGE_COLORS[i % STAGE_COLORS.length],
                  }}
                  title={`${st.stage}: ${formatCurrency(st.total)} · ${st.count} opps`}
                />
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {stages.map((st, i) => {
              const widthPct = (st.total / totalAll) * 100
              const isActive = hovered === st.stage
              return (
                <div
                  key={st.stage}
                  onMouseEnter={() => setHovered(st.stage)}
                  onMouseLeave={() => setHovered(null)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg p-2 text-xs transition-colors',
                    isActive ? 'bg-secondary/60' : '',
                  )}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded"
                    style={{ background: STAGE_COLORS[i % STAGE_COLORS.length] }}
                  />
                  <span className="flex-1 truncate font-medium">{st.stage}</span>
                  <span className="text-muted-foreground">{shortCurrency(st.total)}</span>
                  <span className="w-10 text-right text-muted-foreground/70">{widthPct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/* ───────────────────────── helpers ───────────────────────── */

function shortNumber(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toString()
}

function shortCurrency(n: number): string {
  return `$${shortNumber(n)}`
}
