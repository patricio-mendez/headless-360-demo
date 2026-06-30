import { useQuery } from '@tanstack/react-query'
import { env } from '@/lib/env'
import {
  COUNTRY_MARKETS,
  GLOBAL_MARKET,
  INSURANCE_INDUSTRY_BLOCK,
  INSURANCE_RATES_BLOCK,
  type CountryCode,
} from '@/lib/marketTickers'
import type { Vertical } from '@/store/vertical'

export interface MarketQuote {
  symbol: string
  name: string
  price: number | null
  change: number | null
  changePercent: number | null
  currency: string
}

interface MarketResponse {
  quotes: MarketQuote[]
}

/**
 * Fetchea precios de mercado según vertical.
 *  - Banking: 3 tickers locales (por país) + 3 globales (S&P/Brent/BTC).
 *  - Insurance: 3 industria seguros + 3 tasas de referencia (no dependen de país).
 * Cache 5 min — los mercados intraday no cambian tanto como para refrescar agresivo.
 */
export function useMarketData(vertical: Vertical, country: CountryCode) {
  const blocks = getBlocksFor(vertical, country)
  const allTickers = [
    ...blocks.tile1.tickers.map((t) => t.symbol),
    ...blocks.tile2.tickers.map((t) => t.symbol),
  ]

  return useQuery({
    queryKey: ['market', vertical, vertical === 'banking' ? country : 'global', allTickers.join(',')],
    queryFn: async (): Promise<{ tile1: MarketQuote[]; tile2: MarketQuote[] }> => {
      const url = `${env.mcpProxyBase}/api/market?symbols=${encodeURIComponent(allTickers.join(','))}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Market ${res.status}`)
      const data = (await res.json()) as MarketResponse
      const bySymbol = new Map(data.quotes.map((q) => [q.symbol, q]))
      const tile1 = blocks.tile1.tickers
        .map((t) => bySymbol.get(t.symbol))
        .filter((q): q is MarketQuote => !!q)
      const tile2 = blocks.tile2.tickers
        .map((t) => bySymbol.get(t.symbol))
        .filter((q): q is MarketQuote => !!q)
      return { tile1, tile2 }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

/** Helper público — qué blocks corresponden a qué vertical. Usado por MarketStrip. */
export function getBlocksFor(vertical: Vertical, country: CountryCode) {
  if (vertical === 'insurance') {
    return {
      tile1: INSURANCE_INDUSTRY_BLOCK,
      tile2: INSURANCE_RATES_BLOCK,
    }
  }
  return {
    tile1: COUNTRY_MARKETS[country].local,
    tile2: GLOBAL_MARKET,
  }
}
