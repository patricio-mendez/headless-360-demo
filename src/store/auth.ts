import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { OAuthTokens } from '@/types/salesforce'
import { refreshAccessToken, revokeToken } from '@/lib/oauth'
import { env } from '@/lib/env'

interface UserIdentity {
  userId: string
  username: string
  displayName: string
  email?: string
  photoUrl?: string
}

interface AuthState {
  tokens: OAuthTokens | null
  identity: UserIdentity | null
  setTokens: (tokens: OAuthTokens) => void
  setIdentity: (identity: UserIdentity) => void
  logout: () => Promise<void>
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,
      identity: null,
      setTokens: (tokens) => set({ tokens }),
      setIdentity: (identity) => set({ identity }),
      logout: async () => {
        const { tokens } = get()
        if (tokens?.access_token) {
          await revokeToken(tokens.access_token)
        }
        set({ tokens: null, identity: null })
      },
      isAuthenticated: () => !!get().tokens?.access_token,
    }),
    {
      name: 'headless360-auth',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)

let refreshPromise: Promise<OAuthTokens> | null = null

export async function getValidToken(): Promise<string | null> {
  const { tokens, setTokens, logout } = useAuthStore.getState()
  if (!tokens) return null

  if (!refreshPromise) {
    return tokens.access_token
  }

  try {
    const fresh = await refreshPromise
    setTokens(fresh)
    return fresh.access_token
  } catch {
    await logout()
    return null
  }
}

export async function forceRefresh(): Promise<string | null> {
  const { tokens, setTokens, logout } = useAuthStore.getState()
  if (!tokens?.refresh_token) return null

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken(tokens.refresh_token)
  }

  try {
    const fresh = await refreshPromise
    setTokens({ ...fresh, refresh_token: fresh.refresh_token ?? tokens.refresh_token })
    return fresh.access_token
  } catch {
    await logout()
    return null
  } finally {
    refreshPromise = null
  }
}

export async function fetchIdentity(tokens: OAuthTokens): Promise<UserIdentity> {
  // El `tokens.id` viene con URL absoluta tipo https://<org>.my.salesforce.com/id/<orgId>/<userId>.
  // - Dev: reemplazamos el origen por /sf-api para que Vite lo proxee
  // - Prod: lo enviamos al Worker /api/sf/userinfo, que lo tuneliza con el Authorization header
  const isDev = import.meta.env.DEV
  let res: Response
  if (isDev) {
    const proxiedId = tokens.id.replace(/^https?:\/\/[^/]+/, env.apiBase)
    res = await fetch(proxiedId, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
  } else {
    const url = `${env.mcpProxyBase}/api/sf/userinfo?url=${encodeURIComponent(tokens.id)}`
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
  }
  if (!res.ok) throw new Error(`Identity endpoint falló: ${res.status}`)
  const data = await res.json()
  return {
    userId: data.user_id,
    username: data.username,
    displayName: data.display_name ?? data.username,
    email: data.email,
    photoUrl: data.photos?.thumbnail,
  }
}
