import { useQuery } from '@tanstack/react-query'
import { env } from '@/lib/env'
import { useCurrentAccountId } from './useCustomer'
import { useVerticalStore } from '@/store/vertical'

/**
 * Interacciones de engagement multicanal (campañas/email, web, WhatsApp/SMS) del
 * cliente actual, traídas vía Worker BFF que consulta el DMO marketing_interactions__dlm
 * en Data Cloud. Replica la capa que en producción llenarían Marketing Cloud Next +
 * Digital Engagement + Web SDK.
 *
 * El filtro por vertical (lob) se deriva del vertical store: banking → Banking+Cross,
 * insurance → Insurance+Cross.
 */

export type LineOfBusiness = 'Banking' | 'Insurance' | 'Cross'
export type InteractionChannel = 'Campaign' | 'Email' | 'WhatsApp' | 'SMS' | 'Web'
export type InteractionType =
  | 'Sent'
  | 'Open'
  | 'Click'
  | 'Reply'
  | 'PageView'
  | 'FormSubmit'
  | 'Abandon'

export interface MarketingInteraction {
  id: string
  accountId: string
  lineOfBusiness: LineOfBusiness
  channel: InteractionChannel
  interactionType: InteractionType
  subject: string
  channelDetail: string
  url: string | null
  engagementScore: number
  interactionTs: string
  sourceSystem: string
  contentRef: string | null
  previewSnippet: string | null
}

interface InteractionsResponse {
  accountId: string
  lob: 'Banking' | 'Insurance' | null
  count: number
  interactions: MarketingInteraction[]
  source: string
}

/** Bucket de engagement derivado del tipo de interacción (sin data extra). */
export type EngagementBucket = 'responded' | 'sent' | 'abandoned'

export function engagementBucket(type: InteractionType): EngagementBucket {
  if (type === 'Abandon') return 'abandoned'
  if (type === 'Sent') return 'sent'
  // Open, Click, Reply, PageView, FormSubmit → el cliente actuó
  return 'responded'
}

export const BUCKET_LABEL: Record<EngagementBucket, string> = {
  responded: 'Respondió',
  sent: 'Solo enviado',
  abandoned: 'Abandonó',
}

/**
 * Data Cloud devuelve el timestamp como "2026-07-13 08:47:00.000 UTC" (no ISO).
 * Lo normalizamos a Date de forma robusta para todos los browsers.
 */
export function parseInteractionTs(ts: string): Date {
  const iso = ts.replace(' ', 'T').replace(' UTC', 'Z').replace('UTC', 'Z')
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? new Date(ts) : d
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`MCP proxy ${res.status}: ${body.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

export function useMarketingInteractions(limit = 200) {
  const accountId = useCurrentAccountId()
  const vertical = useVerticalStore((s) => s.vertical)
  const lob = vertical === 'insurance' ? 'Insurance' : 'Banking'

  return useQuery({
    queryKey: ['marketing-interactions', accountId, lob, limit],
    enabled: !!accountId,
    queryFn: async (): Promise<InteractionsResponse> => {
      const params = new URLSearchParams({ accountId, lob, limit: String(limit) })
      return fetchJson<InteractionsResponse>(`${env.mcpProxyBase}/api/interactions?${params}`)
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
