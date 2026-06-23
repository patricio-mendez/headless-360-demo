import { useMemo, useState } from 'react'
import { CreditCard, ArrowDownRight, ArrowUpRight, Wifi, WifiOff, Database } from 'lucide-react'
import { useCardOperations, useCardSummaries, type CardOperation } from '@/hooks/useCardOperations'
import { PanelEmpty, PanelError, PanelLoading } from './PanelStates'
import { DataTooltip } from './Tooltip'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

/**
 * Panel de Operaciones de Tarjetas — consume el MCP proxy → Data Cloud.
 *
 * Se renderiza embebido dentro de FinancialAccountsPanel como sección
 * expandible. NO tiene su propio card wrapper.
 *
 * Diferenciador clave de la demo:
 *  - El resto de los paneles consumen directo Salesforce REST/SOQL desde el browser.
 *  - Este pasa por un Worker que habla con Data Cloud (data outside the org).
 *  - Storytelling: Headless 360 + Data 360 + MCP proxy.
 */

const ESTADO_COLORS: Record<string, string> = {
  TR: 'bg-chart-mint/15 text-chart-mint',
  XR: 'bg-chart-coral/15 text-chart-coral',
  PE: 'bg-chart-orange/15 text-chart-orange',
}

const ESTADO_LABELS: Record<string, string> = {
  TR: 'Aprobado',
  XR: 'Reversa',
  PE: 'Pendiente',
}

export function CreditCardOperationsPanel() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  const summaries = useCardSummaries()
  const operations = useCardOperations({ numeroTarjeta: selectedCard, limit: 500 })

  const cards = summaries.data?.cards ?? []
  const ops = operations.data?.operations ?? []

  // Últimos 6 meses (mes actual + 5 anteriores), apilados por TARJETA individual.
  const monthlyStacks = useMemo(() => {
    const months: string[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    // Map<month, Map<numeroTarjeta, monto>>
    const grouped = new Map<string, Map<string, number>>()
    months.forEach((m) => grouped.set(m, new Map()))

    // Metadata por tarjeta (toma el primer tipo que aparece).
    const cardMeta = new Map<string, { tipo: string | null }>()

    ops.forEach((op) => {
      if (!op.fechaTransaccion || op.monto == null || !op.numeroTarjeta) return
      const m = op.fechaTransaccion.slice(0, 7)
      if (!grouped.has(m)) return
      const num = op.numeroTarjeta
      if (!cardMeta.has(num)) cardMeta.set(num, { tipo: op.tipoTarjeta })
      const inner = grouped.get(m)!
      inner.set(num, (inner.get(num) ?? 0) + op.monto)
    })

    const cardList = Array.from(cardMeta.entries())
      .map(([numero, meta]) => ({ numero, tipo: meta.tipo }))
      .sort((a, b) => a.numero.localeCompare(b.numero))

    return {
      months,
      cards: cardList,
      data: months.map((m) => ({ month: m, byCard: grouped.get(m)! })),
    }
  }, [ops])

  const hasError = summaries.isError || operations.isError
  const isLoading = summaries.isLoading || operations.isLoading
  const errorMessage =
    (summaries.error as Error)?.message ?? (operations.error as Error)?.message ?? 'Error desconocido'

  if (hasError) {
    return (
      <div className="space-y-3 border-t border-border p-5">
        <div className="flex items-center gap-2 text-xs">
          <WifiOff className="h-3.5 w-3.5 text-chart-coral" />
          <span className="font-medium text-chart-coral">BFF Worker desconectado</span>
        </div>
        <PanelError
          message={errorMessage}
          onRetry={() => {
            summaries.refetch()
            operations.refetch()
          }}
        />
        <div className="rounded-xl border border-chart-orange/20 bg-chart-orange/5 p-3 text-xs text-chart-orange">
          <p className="font-semibold">El BFF Worker no está corriendo.</p>
          <p className="mt-1 leading-relaxed">
            Levantalo con: <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono">cd mcp-proxy && npx wrangler dev</code>
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <PanelLoading rows={4} />
  }

  if (cards.length === 0) {
    return <PanelEmpty message="Sin operaciones registradas en Data Cloud." icon={CreditCard} />
  }

  return (
    <div className="border-t border-border">
      {/* Source attribution */}
      <div className="flex items-center justify-between gap-2 border-b border-border surface-1 px-5 py-2.5">
        <DataTooltip
          title="Powered by Data Cloud + BFF"
          description="A diferencia de los otros paneles (que consumen Salesforce directo), este consume Data Cloud vía un BFF (Backend-for-Frontend) — un Worker que se autentica con Client Credentials, hace token exchange a Data Cloud, y ejecuta SQL contra los DLOs Transacciones_Bancarias / Tarjetas_Bancarias."
          source="Cloudflare Worker → Data Cloud Query API v2"
          side="bottom"
        >
          <span className="inline-flex cursor-help items-center gap-1.5 rounded-md bg-chart-orange/15 px-2 py-0.5 text-[10px] font-semibold text-chart-orange ring-1 ring-chart-orange/30">
            <Database className="h-3 w-3" />
            <Wifi className="h-3 w-3" /> BFF · Data Cloud
          </span>
        </DataTooltip>
        <span className="text-[10px] text-muted-foreground">
          RUT 123456778-7 · {ops.length} operaciones {selectedCard ? `de ****${selectedCard}` : ''}
        </span>
      </div>

      {/* Card selector */}
      <div className="flex flex-wrap gap-2 border-b border-border p-4">
        <CardChip
          active={selectedCard === null}
          onClick={() => setSelectedCard(null)}
          label="Todas"
          count={cards.reduce((s, c) => s + c.totalTransacciones, 0)}
          total={cards.reduce((s, c) => s + c.montoTotal, 0)}
        />
        {cards.map((c) => (
          <CardChip
            key={c.numeroTarjeta}
            active={selectedCard === c.numeroTarjeta}
            onClick={() => setSelectedCard(c.numeroTarjeta)}
            label={`${inferBrand(c.numeroTarjeta)} ****${c.numeroTarjeta}`}
            sub={c.tipoTarjeta ?? undefined}
            count={c.totalTransacciones}
            total={c.montoTotal}
          />
        ))}
      </div>

      {/* Monthly stacked bars — últimos 6 meses, una serie por tarjeta */}
      <div className="border-b border-border p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Gasto últimos 6 meses · por tarjeta
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {monthlyStacks.cards.map((c, i) => (
              <span key={c.numero} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: colorByIndex(i) }}
                />
                {cardLabel(c)}
              </span>
            ))}
          </div>
        </div>
        <MonthlyStackedBars stacks={monthlyStacks} />
      </div>

      {/* Operations list */}
      {ops.length === 0 ? (
        <PanelEmpty message="Sin operaciones para esta tarjeta." icon={CreditCard} />
      ) : (
        <div className="max-h-[420px] divide-y divide-border overflow-y-auto scrollbar-thin">
          {ops.map((op) => (
            <OperationRow key={op.idTransaccion ?? `${op.fechaTransaccion}-${op.comercio}`} op={op} />
          ))}
        </div>
      )}
    </div>
  )
}

function CardChip({
  active,
  onClick,
  label,
  sub,
  count,
  total,
}: {
  active: boolean
  onClick: () => void
  label: string
  sub?: string
  count: number
  total: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-all',
        active
          ? 'border-chart-cyan/50 bg-chart-cyan/10 text-chart-cyan shadow-sm shadow-chart-cyan/20'
          : 'border-border surface-2 text-foreground hover:border-border/80',
      )}
    >
      <span className="flex items-center gap-1.5 text-xs font-semibold">
        <CreditCard className="h-3 w-3" /> {label}
        {sub && <span className="text-[10px] font-normal opacity-70">· {sub}</span>}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {count} ops · {formatCurrency(total)}
      </span>
    </button>
  )
}

function OperationRow({ op }: { op: CardOperation }) {
  const isReversal = op.estadoTransaccion === 'XR'
  const Icon = isReversal ? ArrowUpRight : ArrowDownRight
  const estadoClass = ESTADO_COLORS[op.estadoTransaccion ?? ''] ?? 'bg-secondary text-muted-foreground'
  const estadoLabel = ESTADO_LABELS[op.estadoTransaccion ?? ''] ?? op.estadoTransaccion

  return (
    <div className="flex items-center gap-3 p-4 transition-colors hover:bg-secondary/40">
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          isReversal ? 'bg-chart-mint/15 text-chart-mint' : 'bg-chart-blue/15 text-chart-blue',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium leading-tight">{op.comercio ?? 'Sin comercio'}</span>
          {op.estadoTransaccion && (
            <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-medium', estadoClass)}>
              {estadoLabel}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span>{formatDate(op.fechaTransaccion)}</span>
          {op.numeroTarjeta && (
            <>
              <span>·</span>
              <span className="font-mono">****{op.numeroTarjeta}</span>
            </>
          )}
          {op.tipoTarjeta && (
            <>
              <span>·</span>
              <span>{op.tipoTarjeta}</span>
            </>
          )}
          {op.facturado && op.facturado !== 'NA' && (
            <>
              <span>·</span>
              <span>{op.facturado === 'SI' ? 'Facturado' : 'No facturado'}</span>
            </>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={cn('text-sm font-semibold', isReversal ? 'text-chart-mint' : '')}>
          {isReversal ? '+' : ''}
          {formatCurrency(op.monto)}
        </div>
        {op.codigoAutorizacion && (
          <div className="font-mono text-[10px] text-muted-foreground/70">{op.codigoAutorizacion}</div>
        )}
      </div>
    </div>
  )
}

// Mapping de marca por últimos 4 dígitos para las tarjetas demo de Cumulus Bank.
// Solo los últimos 4 están visibles en los datos (no el BIN real), así que la
// heurística por primer dígito no funciona bien — preferimos un map explícito.
const CARD_BRAND_BY_LAST4: Record<string, string> = {
  '7842': 'MC',
  '3691': 'Visa',
  '5028': 'MC',
}

function inferBrand(numero: string): string {
  const last4 = numero.trim().slice(-4)
  if (last4 in CARD_BRAND_BY_LAST4) return CARD_BRAND_BY_LAST4[last4]
  // Fallback heurístico por primer dígito (BIN clásico)
  const first = numero.trim().charAt(0)
  if (first === '4') return 'Visa'
  if (first === '5' || first === '2') return 'MC'
  return 'Tarjeta'
}

function cardLabel(c: { numero: string; tipo: string | null }): string {
  const brand = inferBrand(c.numero)
  const tipo = c.tipo ? formatTipo(c.tipo) : null
  return tipo ? `${brand} ${tipo}` : `${brand} ****${c.numero}`
}

// Normaliza "CRÉDITO" / "DÉBITO" → "Credito" / "Debito" (Title Case sin tildes).
function formatTipo(s: string): string {
  const stripped = s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  return stripped
    .toLowerCase()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

// Paleta por tarjeta — colores distintos asignados por orden estable.
const CARD_PALETTE = [
  'hsl(var(--chart-blue))',
  'hsl(var(--chart-orange))',
  'hsl(var(--chart-violet))',
  'hsl(var(--chart-cyan))',
  'hsl(var(--chart-mint))',
  'hsl(var(--chart-coral))',
]

function colorByIndex(idx: number): string {
  return CARD_PALETTE[idx % CARD_PALETTE.length]
}

interface MonthlyStacks {
  months: string[]
  cards: { numero: string; tipo: string | null }[]
  data: { month: string; byCard: Map<string, number> }[]
}

function MonthlyStackedBars({ stacks }: { stacks: MonthlyStacks }) {
  const monthTotals = stacks.data.map((d) =>
    Array.from(d.byCard.values()).reduce((s, v) => s + v, 0),
  )
  const max = Math.max(...monthTotals, 1)
  const monthLabels = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const monthLong = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]

  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  return (
    <div className="relative flex h-32 items-end gap-2">
      {stacks.data.map((d, idx) => {
        const total = monthTotals[idx]
        const heightPct = (total / max) * 100
        const [year, m] = d.month.split('-')
        const label = monthLabels[Number(m) - 1]
        const longLabel = `${monthLong[Number(m) - 1]} ${year}`
        const isHovered = hoverIdx === idx

        return (
          <div
            key={d.month}
            className="relative flex flex-1 flex-col items-center gap-1.5"
            onMouseEnter={() => setHoverIdx(idx)}
            onMouseLeave={() => setHoverIdx((cur) => (cur === idx ? null : cur))}
          >
            <div
              className={cn(
                'relative flex h-24 w-full items-end rounded-md transition-all',
                isHovered && 'ring-2 ring-chart-orange/40 ring-offset-1 ring-offset-background',
              )}
            >
              {total === 0 ? (
                <div className="w-full rounded-md border border-dashed border-border/60" style={{ height: '100%' }} />
              ) : (
                <div
                  className="flex w-full flex-col-reverse overflow-hidden rounded-md"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                >
                  {stacks.cards.map((c, i) => {
                    const v = d.byCard.get(c.numero) ?? 0
                    if (v === 0) return null
                    const segPct = (v / total) * 100
                    return (
                      <div
                        key={c.numero}
                        style={{ height: `${segPct}%`, background: colorByIndex(i) }}
                        className="w-full"
                      />
                    )
                  })}
                </div>
              )}
            </div>
            <div
              className={cn(
                'text-[10px] transition-colors',
                isHovered ? 'font-semibold text-chart-orange' : 'text-muted-foreground',
              )}
            >
              {label}
            </div>

            {isHovered && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-xl border border-border bg-popover/95 p-3 text-xs shadow-2xl backdrop-blur-sm">
                <div className="mb-2 flex items-center justify-between border-b border-border pb-1.5">
                  <span className="font-semibold">{longLabel}</span>
                  <span className="font-mono text-muted-foreground">{formatCurrency(total)}</span>
                </div>
                {total === 0 ? (
                  <div className="text-muted-foreground">Sin movimientos</div>
                ) : (
                  <ul className="space-y-1">
                    {stacks.cards.map((c, i) => {
                      const v = d.byCard.get(c.numero) ?? 0
                      const pct = total > 0 ? Math.round((v / total) * 100) : 0
                      return (
                        <li key={c.numero} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 truncate">
                            <span
                              className="inline-block h-2 w-2 shrink-0 rounded-sm"
                              style={{ background: colorByIndex(i) }}
                            />
                            <span className="truncate text-foreground">{cardLabel(c)}</span>
                          </span>
                          <span className="shrink-0 font-mono text-muted-foreground">
                            {formatCurrency(v)}
                            {v > 0 && (
                              <span className="ml-1 text-[10px] text-muted-foreground/70">{pct}%</span>
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
