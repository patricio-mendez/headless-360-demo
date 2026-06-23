import { env } from './env'
import { forceRefresh, useAuthStore } from '@/store/auth'

export class SalesforceError extends Error {
  status: number
  body: string
  url: string
  constructor(status: number, body: string, url: string) {
    super(`Salesforce ${status}: ${body.slice(0, 200)}`)
    this.status = status
    this.body = body
    this.url = url
  }
}

async function authedFetch(path: string, init: RequestInit = {}, retried = false): Promise<Response> {
  const tokens = useAuthStore.getState().tokens
  if (!tokens) throw new Error('No hay sesión activa')

  const url = `${env.apiBase}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: 'application/json',
    },
  })

  if (res.status === 401 && !retried && tokens.refresh_token) {
    const fresh = await forceRefresh()
    if (fresh) return authedFetch(path, init, true)
  }

  if (!res.ok) {
    const body = await res.text()
    throw new SalesforceError(res.status, body, url)
  }

  return res
}

export async function soql<T = unknown>(query: string): Promise<{ records: T[]; totalSize: number; done: boolean }> {
  const path = `/services/data/${env.sfApiVersion}/query?q=${encodeURIComponent(query)}`
  const res = await authedFetch(path)
  return res.json()
}

export async function recordUi<T = unknown>(recordIds: string | string[], opts: { layoutTypes?: string[]; modes?: string[] } = {}): Promise<T> {
  const ids = Array.isArray(recordIds) ? recordIds.join(',') : recordIds
  const params = new URLSearchParams({ recordIds: ids })
  if (opts.layoutTypes) params.set('layoutTypes', opts.layoutTypes.join(','))
  if (opts.modes) params.set('modes', opts.modes.join(','))
  const path = `/services/data/${env.sfApiVersion}/ui-api/record-ui?${params}`
  const res = await authedFetch(path)
  return res.json()
}

export async function sfPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await authedFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function sfPatch(path: string, body: unknown): Promise<void> {
  // Salesforce PATCH /services/data/vXX/sobjects/{Object}/{Id} retorna 204 No Content
  await authedFetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function updateRecord<T extends Record<string, unknown>>(
  sobject: string,
  id: string,
  fields: T,
): Promise<void> {
  const path = `/services/data/${env.sfApiVersion}/sobjects/${sobject}/${id}`
  await sfPatch(path, fields)
}
