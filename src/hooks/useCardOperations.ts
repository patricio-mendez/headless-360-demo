import { useQuery } from '@tanstack/react-query'

/**
 * Hooks para consumir el MCP proxy local (Worker en :8787) que a su vez
 * habla con Data Cloud y devuelve transacciones de tarjetas reales.
 *
 * Apunta al Worker local en dev. Para deploy a producción se podría
 * mover a una env var, pero para la demo lo dejamos hardcoded.
 */

const MCP_PROXY_BASE = 'http://localhost:8787'

// Patricio Mendez en el SDO de banking. RUT registrado en Data Cloud.
export const PATRICIO_RUT = '123456778-7'

export interface CardOperation {
  idTransaccion: string | null
  fechaTransaccion: string | null
  comercio: string | null
  descripcion: string | null
  monto: number | null
  numeroTarjeta: string | null
  tipoTarjeta: string | null
  estadoTransaccion: string | null
  facturado: string | null
  codigoAutorizacion: string | null
}

export interface CardSummary {
  numeroTarjeta: string
  tipoTarjeta: string | null
  totalTransacciones: number
  montoTotal: number
}

interface OperationsResponse {
  rut: string
  count: number
  operations: CardOperation[]
}

interface SummaryResponse {
  rut: string
  cards: CardSummary[]
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`MCP proxy ${res.status}: ${body.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

export function useCardOperations(opts: { rut?: string; numeroTarjeta?: string | null; limit?: number } = {}) {
  const rut = opts.rut ?? PATRICIO_RUT
  const numeroTarjeta = opts.numeroTarjeta ?? null
  const limit = opts.limit ?? 50

  return useQuery({
    queryKey: ['card-operations', rut, numeroTarjeta, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ rut, limit: String(limit) })
      if (numeroTarjeta) params.set('numeroTarjeta', numeroTarjeta)
      return fetchJson<OperationsResponse>(`${MCP_PROXY_BASE}/api/cards/operations?${params}`)
    },
    staleTime: 30_000,
  })
}

export function useCardSummaries(rut: string = PATRICIO_RUT) {
  return useQuery({
    queryKey: ['card-summary', rut],
    queryFn: async () => {
      const params = new URLSearchParams({ rut })
      return fetchJson<SummaryResponse>(`${MCP_PROXY_BASE}/api/cards/summary?${params}`)
    },
    staleTime: 30_000,
  })
}

export function useMcpProxyHealth() {
  return useQuery({
    queryKey: ['mcp-proxy-health'],
    queryFn: async () => {
      return fetchJson<{ status: string; service: string; timestamp: string }>(`${MCP_PROXY_BASE}/health`)
    },
    staleTime: 60_000,
    retry: 1,
  })
}
