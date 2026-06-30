/**
 * Mapping de tickers de Yahoo Finance por país.
 * Tile "local" cambia según país. Tile "global" es fijo (S&P500 + Brent + BTC).
 *
 * Los display names son cortos (max 12 chars) porque la card es pequeña.
 */

export type CountryCode = 'CL' | 'PE' | 'AR'

export interface TickerDef {
  symbol: string
  display: string
  /** Si true, formatea como moneda (decimales). Si false, formatea como número entero (índices, BTC). */
  isCurrency?: boolean
}

interface MarketBlock {
  label: string
  tickers: TickerDef[]
}

interface CountryMarket {
  flag: string
  local: MarketBlock
}

const GLOBAL_BLOCK: MarketBlock = {
  label: 'Mercado global',
  tickers: [
    { symbol: '^GSPC', display: 'S&P 500' },
    { symbol: 'BZ=F', display: 'Brent', isCurrency: true },
    { symbol: 'BTC-USD', display: 'Bitcoin', isCurrency: true },
  ],
}

/* ──────────────────────────────────────────────────────────────────────
 * INSURANCE MARKETS — los dos tiles del modo Insurance.
 * Tile 1: peers de la industria (ETF + reaseguradora + carrier US).
 * Tile 2: tasas + commodity refugio (drivers del balance sheet asegurador).
 * Estos NO dependen del país seleccionado — la industria de seguros se piensa
 * globalmente (reaseguro internacional + tasas de referencia US).
 * ──────────────────────────────────────────────────────────────────── */

export const INSURANCE_INDUSTRY_BLOCK: MarketBlock = {
  label: 'Industria seguros',
  tickers: [
    { symbol: 'KIE', display: 'S&P Insurance', isCurrency: true },
    { symbol: 'BRK-B', display: 'Berkshire', isCurrency: true },
    { symbol: 'AIG', display: 'AIG', isCurrency: true },
  ],
}

export const INSURANCE_RATES_BLOCK: MarketBlock = {
  label: 'Tasas de referencia',
  tickers: [
    { symbol: '^TNX', display: '10Y Treasury', isCurrency: true },
    { symbol: '^TYX', display: '30Y Treasury', isCurrency: true },
    { symbol: 'GC=F', display: 'Oro', isCurrency: true },
  ],
}

export const COUNTRY_MARKETS: Record<CountryCode, CountryMarket> = {
  CL: {
    flag: '🇨🇱',
    local: {
      label: 'Mercado Chile',
      tickers: [
        { symbol: '^IPSA', display: 'IPSA' },
        { symbol: 'CLP=X', display: 'USD/CLP', isCurrency: true },
        { symbol: 'COPEC.SN', display: 'COPEC', isCurrency: true },
      ],
    },
  },
  PE: {
    flag: '🇵🇪',
    local: {
      label: 'Mercado Perú',
      tickers: [
        { symbol: '^SPBLPGPT', display: 'S&P Lima' },
        { symbol: 'PEN=X', display: 'USD/PEN', isCurrency: true },
        { symbol: 'HG=F', display: 'Cobre', isCurrency: true },
      ],
    },
  },
  AR: {
    flag: '🇦🇷',
    local: {
      label: 'Mercado Argentina',
      tickers: [
        { symbol: '^MERV', display: 'MERVAL' },
        { symbol: 'ARS=X', display: 'USD/ARS', isCurrency: true },
        { symbol: 'YPF', display: 'YPF', isCurrency: true },
      ],
    },
  },
}

export const GLOBAL_MARKET = GLOBAL_BLOCK
