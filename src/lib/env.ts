const isDev = import.meta.env.DEV

/**
 * BFF Worker — bridge entre la app y todos los backends Salesforce.
 *  - En dev: localhost:8787 (wrangler dev)
 *  - En prod: la URL del Worker deployado en Cloudflare (env var)
 */
const bffBase = (import.meta.env.VITE_MCP_PROXY_BASE as string) ?? 'http://localhost:8787'

export const env = {
  sfInstanceUrl: import.meta.env.VITE_SF_INSTANCE_URL as string,
  sfLoginUrl: import.meta.env.VITE_SF_LOGIN_URL as string,
  sfClientId: import.meta.env.VITE_SF_CLIENT_ID as string,
  sfApiVersion: (import.meta.env.VITE_SF_API_VERSION as string) ?? 'v62.0',
  demoAccountId: import.meta.env.VITE_DEMO_ACCOUNT_ID as string,
  agentforceAgentId: import.meta.env.VITE_AGENTFORCE_AGENT_ID as string,
  agentforceAgentName: (import.meta.env.VITE_AGENTFORCE_AGENT_NAME as string) ?? 'Agentforce',
  redirectUri: `${window.location.origin}${import.meta.env.BASE_URL}oauth/callback`.replace(/\/+oauth/, '/oauth'),
  /**
   * Base URL para llamadas REST (SOQL, ui-api, sobjects).
   *  - dev: /sf-api → Vite proxy → Salesforce (evita CORS)
   *  - prod: BFF Worker → bypass CORS server-side
   *
   * Los callers concatenan paths tipo `/services/data/v62.0/query` después de esto.
   * En prod el Worker reescribe /services/data/ → /api/sf/rest/ transparentemente
   * usando el path matcher startsWith('/api/sf/rest/').
   * El Authorization Bearer header del banker viaja transparente al org.
   */
  apiBase: isDev ? '/sf-api' : `${bffBase}/api/sf/rest`,
  /**
   * Base URL para OAuth (/services/oauth2/token, /services/oauth2/revoke).
   *  - dev: /sf-api → Vite proxy
   *  - prod: BFF Worker → bypass CORS (Salesforce NO respeta CORS en /oauth2/*)
   */
  oauthBase: isDev ? '/sf-api/services/oauth2' : `${bffBase}/api/sf/oauth`,
  /**
   * Worker BFF — para Agent Runtime + Data Cloud + (en prod) OAuth + REST.
   * En dev levantarlo con: cd mcp-proxy && npx wrangler dev (puerto 8787).
   */
  mcpProxyBase: bffBase,
}
