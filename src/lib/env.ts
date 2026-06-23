const isDev = import.meta.env.DEV

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
   * Base URL para llamadas API (token exchange, REST queries, Agent API).
   * En dev: /sf-api → Vite proxy → Salesforce (evita CORS).
   * En prod: la URL del org directo (requiere CORS configurado o backend proxy).
   */
  apiBase: isDev ? '/sf-api' : (import.meta.env.VITE_SF_INSTANCE_URL as string),
  /**
   * Base URL para Agentforce Agent API. Vive en api.salesforce.com (no en la instance URL).
   * En dev: /agent-api → Vite proxy.
   */
  agentApiBase: isDev ? '/agent-api' : 'https://api.salesforce.com',
  /**
   * Worker MCP proxy — bridge entre la app y el Agent Runtime API + Data Cloud.
   * En dev levantarlo con: cd mcp-proxy && npx wrangler dev (puerto 8787).
   */
  mcpProxyBase: (import.meta.env.VITE_MCP_PROXY_BASE as string) ?? 'http://localhost:8787',
}
