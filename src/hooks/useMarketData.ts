import { useQuery } from '@tanstack/react-query'
import { env } from '@/lib/env'
import { COUNTRY_MARKETS, GLOBAL_MARKET, type CountryCode } from '@/lib/marketTickers'

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
 * Fetchea precios de mercado para el país dado.
 * Devuelve los 6 tickers (3 local + 3 global) en un solo round-trip al BFF.
 * Cache 5 min — los mercados intraday no cambian tanto como para refrescar agresivo.
 */
export function useMarketData(country: CountryCode) {
  const localTickers = COUNTRY_MARKETS[country].local.tickers.map((t) => t.symbol)
  const globalTickers = GLOBAL_MARKET.tickers.map((t) => t.symbol)
  const all = [...localTickers, ...globalTickers]

  return useQuery({
    queryKey: ['market', country, all.join(',')],
    queryFn: async (): Promise<{ local: MarketQuote[]; global: MarketQuote[] }> => {
      const url = `${env.mcpProxyBase}/api/market?symbols=${encodeURIComponent(all.join(','))}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Market ${res.status}`)
      const data = (await res.json()) as MarketResponse
      // Re-ordenamos para mantener el orden de tickers definido (Yahoo a veces devuelve desordenado).
      const bySymbol = new Map(data.quotes.map((q) => [q.symbol, q]))
      const local = localTickers
        .map((s) => bySymbol.get(s))
        .filter((q): q is MarketQuote => !!q)
      const global = globalTickers
        .map((s) => bySymbol.get(s))
        .filter((q): q is MarketQuote => !!q)
      return { local, global }
    },
    staleTime: 5 * 60 * 1000, // 5 min
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
