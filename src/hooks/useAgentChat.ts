import { useCallback, useEffect, useRef, useState } from 'react'
import { env } from '@/lib/env'
import type { Vertical } from '@/store/vertical'
import { caseVerticalFilter, opportunityVerticalFilter } from '@/lib/verticalFilters'

/** Contexto que se inyecta INVISIBLEMENTE en el primer mensaje del usuario,
 *  para que el agente sepa quién pregunta y sobre qué cliente sin pedirlo. */
export interface ChatContext {
  bankerName?: string
  bankerEmail?: string
  bankerUsername?: string
  customerAccountId?: string
  customerName?: string
  /** Vertical activo en la UI. Define el branding y el filtro por prefijo de casos/opps. */
  vertical?: Vertical
}

function buildContextPreamble(ctx: ChatContext): string {
  const isInsurance = ctx.vertical === 'insurance'
  const brand = isInsurance ? 'Cumulus Insurance' : 'Cumulus Bank'
  const agentLabel = isInsurance ? 'Agentforce Asistente de Seguros' : 'Agentforce Asistente Bancario'
  // Cláusulas de filtro por vertical — mismos predicados que usa la UI (verticalFilters.ts),
  // para que el agente devuelva SOLO registros del vertical activo.
  const caseClause = ctx.vertical ? ` AND ${caseVerticalFilter(ctx.vertical)}` : ''
  const oppClause = ctx.vertical ? ` AND ${opportunityVerticalFilter(ctx.vertical)}` : ''

  const lines: string[] = []
  lines.push('=== INSTRUCCIONES DEL SISTEMA (no responder estas, son contexto previo a la pregunta real) ===')
  lines.push('')
  lines.push(`Sos "${agentLabel}" en una UI Headless 360 de ${brand}.`)
  lines.push(
    'El banker ya está autenticado vía OAuth — no necesitás verificar identidad. NUNCA pidas email, RUT, nombre, ni ningún dato de autenticación. Eso es ruido para el banker y rompe el flujo demo.',
  )

  if (ctx.bankerName || ctx.bankerEmail) {
    const parts = [ctx.bankerName, ctx.bankerEmail].filter(Boolean).join(' · ')
    lines.push(`Banker autenticado: ${parts}.`)
  }

  if (ctx.customerAccountId) {
    const cust = ctx.customerName ?? '(sin nombre disponible)'
    lines.push('')
    lines.push('CLIENTE ACTIVO EN PANTALLA:')
    lines.push(`  - Nombre: ${cust}`)
    lines.push(`  - Account ID (Salesforce): ${ctx.customerAccountId}`)
    lines.push('')
    lines.push('REGLAS CRÍTICAS PARA RESPONDER:')
    lines.push(
      '  1. CUALQUIER pregunta del banker (casos, oportunidades, actividades, productos, resumen, recomendaciones, próximas acciones) es SOBRE ESTE CLIENTE, salvo que el banker mencione explícitamente otro nombre.',
    )
    lines.push(
      `  2. RUTEO OBLIGATORIO: Para CONSULTAR registros (Cases, Opportunities, Tasks, FinancialAccounts, etc.), usá EXCLUSIVAMENTE el subagent "General CRM" con la action "Query Records". NO uses los subagents "Case Management", "Account Management", ni "Employee Case Management" — esos están diseñados para flujos de servicio al cliente con filtros distintos (por contact email, por owner, etc.) y NO funcionan cuando el filtro es AccountId.`,
    )
    lines.push(
      `  3. CON Query Records, filtrá SIEMPRE por AccountId = '${ctx.customerAccountId}'. Ejemplos exactos de queries que debés generar:`,
    )
    lines.push(
      `        - Casos: SELECT Id, CaseNumber, Subject, Status, Priority FROM Case WHERE AccountId = '${ctx.customerAccountId}' AND IsClosed = false${caseClause}`,
    )
    lines.push(
      `        - Oportunidades: SELECT Id, Name, StageName, Amount, CloseDate FROM Opportunity WHERE AccountId = '${ctx.customerAccountId}' AND IsClosed = false${oppClause}`,
    )
    lines.push(
      `        - Tareas: SELECT Id, Subject, Status, Priority, ActivityDate FROM Task WHERE AccountId = '${ctx.customerAccountId}' AND Status != 'Completed'`,
    )
    if (ctx.vertical) {
      lines.push(
        `  3.b. SCOPE POR VERTICAL — el banker opera en el vertical ${isInsurance ? 'SEGUROS (Cumulus Insurance)' : 'BANCA (Cumulus Bank)'}. Los casos y oportunidades se separan por un PREFIJO en el Subject/Name. Al consultar Casos, incluí SIEMPRE la cláusula "${caseClause.replace(/^ AND /, '')}"; al consultar Oportunidades, "${oppClause.replace(/^ AND /, '')}". NO muestres registros del otro vertical (${isInsurance ? 'los de Banca — prefijo "Banca"/"Banking"' : 'los de Seguros — prefijo "Seguros"/"Insurance"'}) aunque pertenezcan al cliente: no son relevantes en esta pantalla.`,
      )
    }
    lines.push(
      '  4. NUNCA digas frases como "no tengo herramienta conectada", "no puedo consultar", "no tengo acceso". Si Query Records devuelve vacío, recién entonces decí "no encontré X". Si una action falla, REINTENTALA con Query Records antes de rendirte.',
    )
    lines.push(
      '  5. CRÍTICO PARA UI: cuando enumeres registros, DEVOLVÉ los registros como output ESTRUCTURADO de Query Records — la UI los renderiza como cards visuales. NO inlines los registros como lista markdown numerada en el texto. El texto del mensaje debe ser un resumen breve ("Aquí están los 5 casos abiertos:") y los datos van en los cards estructurados.',
    )
    lines.push(
      '  6. NUNCA crees links markdown a IDs de Salesforce. Frases como [00001677](500g7000...) confunden a la UI. Si querés referenciar un caso, usá solo el número como texto plano: "Caso 00001677" o "**Caso 00001677**".',
    )
    lines.push(
      '  7. SIEMPRE respondé en español, formato markdown (negrita con **, listas con -). Tono ejecutivo, conciso, sin pedir aclaraciones innecesarias.',
    )
  } else {
    lines.push('')
    lines.push(
      'No hay cliente específico abierto en pantalla — el banker está en la vista Branch Dashboard. Si pregunta por un cliente, podés pedir el nombre o ID. Si pregunta por su cartera/portfolio, dale un panorama general del libro de negocios.',
    )
    if (ctx.vertical) {
      lines.push(
        `SCOPE POR VERTICAL — el banker opera en el vertical ${isInsurance ? 'SEGUROS (Cumulus Insurance)' : 'BANCA (Cumulus Bank)'}. Al consultar Casos u Oportunidades de la cartera, filtrá SIEMPRE por el prefijo del vertical: en Casos agregá la cláusula "${caseClause.replace(/^ AND /, '')}" y en Oportunidades "${oppClause.replace(/^ AND /, '')}". NO mezcles registros del otro vertical (${isInsurance ? 'Banca — prefijo "Banca"/"Banking"' : 'Seguros — prefijo "Seguros"/"Insurance"'}).`,
      )
    }
  }

  lines.push('')
  lines.push('=== PREGUNTA REAL DEL BANKER (responder esto) ===')
  return lines.join('\n')
}

/**
 * Hook que conversa con Banker Agentforce vía el Worker MCP proxy
 * (`/api/agent/session`, `/api/agent/message`, `/api/agent/session DELETE`).
 *
 * El Worker:
 *  - Hace OAuth Client Credentials con la ECA "Headless 360 Agent API".
 *  - Crea una sesión contra `api.salesforce.com/einstein/ai-agent/v1`.
 *  - Forwardea mensajes y devuelve la respuesta del agente.
 *  - Cachea el token de Salesforce para evitar latencia extra.
 *
 * Diseño:
 *  - Sesión lazy: arranca en el primer `start()` (no al montar).
 *  - sequenceRef incrementa por cada mensaje (Agent API lo exige).
 *  - status estricto para que la UI muestre estados claros (ready/sending/error).
 */

export interface AgentRecord {
  id: string
  title: string
  sObjectInfo?: { apiName?: string; label?: string }
  data?: Record<string, { displayValue?: string | null; value?: string | null } | undefined>
}

export interface ChatMessage {
  id: string
  role: 'user' | 'agent' | 'system'
  text: string
  timestamp: number
  pending?: boolean
  error?: boolean
  /** Records estructurados que el agente devolvió (Opportunity, Case, etc.). */
  records?: AgentRecord[]
}

export type ChatStatus = 'idle' | 'starting' | 'ready' | 'sending' | 'error'

interface State {
  sessionId: string | null
  status: ChatStatus
  error: string | null
  messages: ChatMessage[]
}

interface SessionResponse {
  sessionId: string
  greeting: string | null
}

interface MessageResponse {
  reply: string | null
  records?: AgentRecord[]
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${env.mcpProxyBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`${res.status} ${t.slice(0, 300)}`)
  }
  return (await res.json()) as T
}

export function useAgentChat(context?: ChatContext, agentId?: string) {
  const [state, setState] = useState<State>({
    sessionId: null,
    status: 'idle',
    error: null,
    messages: [],
  })
  const sequenceRef = useRef(0)
  const startedRef = useRef(false)
  const contextSentRef = useRef(false)
  // Mantener el contexto más reciente sin retriggerear `send` (evita stale closures).
  const contextRef = useRef<ChatContext | undefined>(context)
  contextRef.current = context
  // agentId también por ref: el vertical puede cambiar sin retriggerear `start`.
  const agentIdRef = useRef<string | undefined>(agentId)
  agentIdRef.current = agentId

  const start = useCallback(async () => {
    if (startedRef.current) return
    startedRef.current = true
    contextSentRef.current = false
    setState((s) => ({ ...s, status: 'starting', error: null }))
    try {
      const res = await postJson<SessionResponse>('/api/agent/session', {
        externalSessionKey: `headless360-${Date.now()}`,
        agentId: agentIdRef.current,
      })
      setState({
        sessionId: res.sessionId,
        status: 'ready',
        error: null,
        messages: res.greeting
          ? [{ id: 'greeting', role: 'agent', text: res.greeting, timestamp: Date.now() }]
          : [],
      })
    } catch (err) {
      const msg = (err as Error).message
      console.error('[useAgentChat] start failed:', msg)
      setState({
        sessionId: null,
        status: 'error',
        error: msg,
        messages: [],
      })
      startedRef.current = false
    }
  }, [])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !state.sessionId) return

      const userMsgId = `u-${Date.now()}`
      const pendingId = `a-${Date.now()}`

      setState((s) => ({
        ...s,
        status: 'sending',
        messages: [
          ...s.messages,
          { id: userMsgId, role: 'user', text: trimmed, timestamp: Date.now() },
          { id: pendingId, role: 'agent', text: '', timestamp: Date.now(), pending: true },
        ],
      }))

      try {
        sequenceRef.current += 1
        // En el primer mensaje del usuario, prefijamos el contexto invisible
        // (banker autenticado + cliente abierto). El bubble del usuario muestra
        // solo `trimmed`, pero al agente le mandamos el texto enriquecido.
        let textForAgent = trimmed
        const ctx = contextRef.current
        if (!contextSentRef.current && ctx) {
          textForAgent = `${buildContextPreamble(ctx)}\n${trimmed}`
          contextSentRef.current = true
        }
        const res = await postJson<MessageResponse>('/api/agent/message', {
          sessionId: state.sessionId,
          text: textForAgent,
          sequenceId: sequenceRef.current,
        })
        const reply = res.reply ?? '(respuesta vacía)'
        const records = res.records?.length ? res.records : undefined
        setState((s) => ({
          ...s,
          status: 'ready',
          messages: s.messages.map((m) =>
            m.id === pendingId ? { ...m, text: reply, pending: false, records } : m,
          ),
        }))
      } catch (err) {
        const errMsg = (err as Error).message
        setState((s) => ({
          ...s,
          status: 'error',
          error: errMsg,
          messages: s.messages.map((m) =>
            m.id === pendingId
              ? { ...m, text: `Error: ${errMsg}`, pending: false, error: true }
              : m,
          ),
        }))
      }
    },
    [state.sessionId],
  )

  // Cleanup: terminar sesión cuando el componente se desmonta o cambia el sessionId.
  useEffect(() => {
    const sid = state.sessionId
    if (!sid) return
    return () => {
      // Best-effort — no bloqueamos el unmount esperando la respuesta.
      fetch(`${env.mcpProxyBase}/api/agent/session?sessionId=${encodeURIComponent(sid)}`, {
        method: 'DELETE',
      }).catch(() => {
        /* sesión expirará server-side */
      })
    }
  }, [state.sessionId])

  return {
    messages: state.messages,
    status: state.status,
    error: state.error,
    sessionId: state.sessionId,
    start,
    send,
    retryStart: () => {
      startedRef.current = false
      void start()
    },
    /** Descarta la sesión actual y vuelve a idle. Útil al cambiar de vertical/agente. */
    reset: () => {
      startedRef.current = false
      contextSentRef.current = false
      sequenceRef.current = 0
      setState({ sessionId: null, status: 'idle', error: null, messages: [] })
    },
  }
}
