import { env } from './env'
import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce'
import type { OAuthTokens } from '@/types/salesforce'

const SCOPES = ['api', 'refresh_token', 'chatbot_api', 'sfap_api']

const STORAGE_VERIFIER = 'sf_pkce_verifier'
const STORAGE_STATE = 'sf_oauth_state'

export async function startLogin() {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateState()

  sessionStorage.setItem(STORAGE_VERIFIER, verifier)
  sessionStorage.setItem(STORAGE_STATE, state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.sfClientId,
    redirect_uri: env.redirectUri,
    scope: SCOPES.join(' '),
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
    prompt: 'login',
  })

  window.location.assign(`${env.sfLoginUrl}/services/oauth2/authorize?${params}`)
}

export async function completeLogin(code: string, state: string): Promise<OAuthTokens> {
  const expectedState = sessionStorage.getItem(STORAGE_STATE)
  const verifier = sessionStorage.getItem(STORAGE_VERIFIER)
  if (!expectedState || expectedState !== state) {
    throw new Error('OAuth state mismatch — posible CSRF. Reintentá el login.')
  }
  if (!verifier) {
    throw new Error('PKCE verifier ausente. Reintentá el login.')
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.redirectUri,
    client_id: env.sfClientId,
    code_verifier: verifier,
  })

  const res = await fetch(`${env.oauthBase}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange falló (${res.status}): ${text}`)
  }

  sessionStorage.removeItem(STORAGE_VERIFIER)
  sessionStorage.removeItem(STORAGE_STATE)

  return (await res.json()) as OAuthTokens
}

export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: env.sfClientId,
  })

  const res = await fetch(`${env.oauthBase}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Refresh token falló (${res.status}): ${text}`)
  }

  return (await res.json()) as OAuthTokens
}

export async function revokeToken(token: string): Promise<void> {
  const body = new URLSearchParams({ token })
  await fetch(`${env.oauthBase}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }).catch(() => {})
}
