# Headless 360 · Cumulus Bank Demo

Demo de **Salesforce Headless 360** mostrando cómo una UI custom externa puede
consumir la lógica, datos y agentes de Salesforce sin sacrificar governance.

🔗 **Demo en vivo**: https://patricio-mendez.github.io/headless-360-demo/

> Para acceder al demo necesitás credenciales del org `sdo-disputes`.

---

## ¿Qué demuestra?

- **UI custom afuera de Salesforce** — React 19 + Vite + Tailwind + shadcn/ui,
  con branding Cumulus Bank (banca retail Premium LATAM).
- **Vista 360 del cliente** consumiendo datos reales:
  - Account + Opportunities + Cases + Activities vía REST.
  - Transacciones de tarjetas vía **Data Cloud Query API**.
- **Agentforce embebido** con chat real:
  - 7 subagents (Account, Case, Opportunity Management, etc).
  - Cards estructuradas clickeables.
  - Acciones de escritura (creación de Opportunities vía Flow invocable).
- **Governance heredada** — OAuth 2.0 Web Server + PKCE, los permisos del banker
  viajan con el token en cada llamada.

## Stack

- **Frontend**: React 19 · TypeScript · Vite · Tailwind v3 · shadcn/ui · TanStack Query · Zustand
- **Backend**: Cloudflare Workers (BFF, ~300 LOC TypeScript) — bridge a Salesforce
- **Salesforce**: Customer 360 · Agentforce · Data 360

## Arquitectura

```
Browser
  ├─► GitHub Pages (HTML/JS estático de Vite build)
  ├─► Salesforce OAuth (login del banker · Web Server + PKCE)
  └─► Cloudflare Workers (BFF)
        ├─► Salesforce REST (Accounts, Opps, Cases — con token del banker)
        ├─► Agent Runtime API (sesión + mensajes — con ECA Client Credentials)
        ├─► Data 360 Query API (transacciones — con ECA Client Credentials)
        └─► OAuth proxy (token exchange + revoke — bypass CORS)
```

## Setup local

### Pre-requisitos

- Node.js 20+
- Cuenta Salesforce con External Client Apps configuradas:
  - 1 ECA para OAuth del banker (Web Server flow)
  - 1 ECA para Data Cloud (Client Credentials, scopes `cdp_query_api`, `cdp_profile_api`)
  - 1 ECA para Agent API (Client Credentials, scopes `chatbot_api`, `sfap_api`)

### Pasos

```bash
# 1. Frontend
cd app
cp .env.example .env  # editar con los valores de tu org
npm install
npm run dev           # → localhost:5173

# 2. Backend (en otra terminal — código no incluido en este repo)
# El Worker BFF tiene secrets sensibles (client_secret de las ECAs);
# se mantiene en repo privado o local.
```

## Deploy

Push a `main` dispara GitHub Actions que buildea y publica a `gh-pages`.

Los valores de `VITE_*` se inyectan vía GitHub Secrets en el build.

## Notas técnicas

- **Worker BFF como pattern obligatorio**: el endpoint `/services/oauth2/token`
  de Salesforce no respeta CORS Allowlist; un proxy server-side es necesario.
- **MCP vs BFF**: hoy esta demo usa BFF (REST). El protocolo MCP existe en
  Salesforce (Data 360 MCP en Developer Preview, Tableau/Slack MCP en GA) pero
  está pensado para que LLMs externos consuman, no UIs.

## Licencia

Demo interno de Salesforce. Código fuente abierto con fines educativos.
