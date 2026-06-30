import { TrendingUp, TrendingDown, Minus, Globe, Shield, Percent, Loader2 } from 'lucide-react'
import { useCountryStore } from '@/store/country'
import { useVerticalStore } from '@/store/vertical'
import { useMarketData, getBlocksFor, type MarketQuote } from '@/hooks/useMarketData'
import { COUNTRY_MARKETS } from '@/lib/marketTickers'
import { cn } from '@/lib/utils'

/**
 * Strip de 2 tiles del mismo tamaño que el "Closed Won YTD".
 * Contenido depende del vertical:
 *  - Banking: Mercado local (por país) + Mercado global (S&P/Brent/BTC).
 *  - Insurance: Industria seguros (KIE/BRK-B/AIG) + Tasas (10Y/30Y/Oro).
 * Datos vía Yahoo Finance proxy en el Worker BFF. Cache 5 min.
 */
export function MarketStrip() {
  const vertical = useVerticalStore((s) => s.vertical)
  const country = useCountryStore((s) => s.country)
  const { data, isLoading, isError } = useMarketData(vertical, country)
  const blocks = getBlocksFor(vertical, country)
  const isInsurance = vertical === 'insurance'

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
      <MarketTile
        label={blocks.tile1.label}
        flag={isInsurance ? undefined : COUNTRY_MARKETS[country].flag}
        icon={isInsurance ? Shield : undefined}
        tickers={blocks.tile1.tickers}
        quotes={data?.tile1}
        isLoading={isLoading}
        isError={isError}
      />
      <MarketTile
        label={blocks.tile2.label}
        icon={isInsurance ? Percent : Globe}
        tickers={blocks.tile2.tickers}
        quotes={data?.tile2}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

interface MarketTileProps {
  label: string
  flag?: string
  icon?: React.ComponentType<{ className?: string }>
  tickers: { symbol: string; display: string; isCurrency?: boolean }[]
  quotes?: MarketQuote[]
  isLoading: boolean
  isError: boolean
}

function MarketTile({ label, flag, icon: Icon, tickers, quotes, isLoading, isError }: MarketTileProps) {
  const bySymbol = new Map((quotes ?? []).map((q) => [q.symbol, q]))

  return (
    <div className="flex min-w-[200px] flex-1 flex-col gap-1.5 rounded-xl border border-border bg-card/70 px-3.5 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {flag ? (
          <span className="text-sm leading-none">{flag}</span>
        ) : Icon ? (
          <Icon className="h-3 w-3" />
        ) : null}
        <span className="truncate">{label}</span>
        {isLoading && <Loader2 className="ml-auto h-3 w-3 animate-spin opacity-50" />}
      </div>

      {isError ? (
        <div className="text-[11px] text-muted-foreground/70">Sin datos</div>
      ) : (
        <div className="grid gap-y-0.5">
          {tickers.map((t) => {
            const q = bySymbol.get(t.symbol)
            return (
              <MarketRow
                key={t.symbol}
                display={t.display}
                isCurrency={t.isCurrency}
                quote={q}
                loading={isLoading && !q}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function MarketRow({
  display,
  isCurrency,
  quote,
  loading,
}: {
  display: string
  isCurrency?: boolean
  quote?: MarketQuote
  loading: boolean
}) {
  const change = quote?.changePercent ?? null
  const up = change != null && change > 0
  const down = change != null && change < 0
  const TrendIcon = up ? TrendingUp : down ? TrendingDown : Minus
  const trendColor = up
    ? 'text-chart-mint'
    : down
      ? 'text-chart-coral'
      : 'text-muted-foreground'

  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="truncate font-medium text-foreground/90">{display}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-semibold tabular-nums">
          {loading ? (
            <span className="inline-block h-3 w-10 animate-pulse rounded bg-secondary/60" />
          ) : quote?.price != null ? (
            formatPrice(quote.price, isCurrency)
          ) : (
            '—'
          )}
        </span>
        {change != null && (
          <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-medium', trendColor)}>
            <TrendIcon className="h-2.5 w-2.5" />
            {Math.abs(change).toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Format heurístico:
 *  - Si es currency → 2 decimales con separador de miles.
 *  - Si es índice o valor grande → entero con separador de miles.
 *  - Si es valor chico (< 1000) → 2 decimales.
 */
function formatPrice(value: number, isCurrency?: boolean): string {
  const formatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: isCurrency || value < 1000 ? 2 : 0,
    maximumFractionDigits: isCurrency || value < 1000 ? 2 : 0,
  })
  return formatter.format(value)
}
