import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Sparkles,
  Send,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Loader2,
  AlertCircle,
  Database,
  Briefcase,
  Headphones,
  User,
  CreditCard,
  CheckSquare,
  FileText,
} from 'lucide-react'
import {
  useAgentChat,
  type ChatMessage,
  type ChatContext,
  type AgentRecord,
} from '@/hooks/useAgentChat'
import { useAuthStore } from '@/store/auth'
import {
  useAccount,
  useCurrentAccountId,
  useOpportunityById,
  useCaseById,
} from '@/hooks/useCustomer'
import { env } from '@/lib/env'
import { DataTooltip } from './Tooltip'
import { OpportunityDetailDrawer } from './OpportunityDetailDrawer'
import { CaseDetailDrawer } from './CaseDetailDrawer'
import { cn } from '@/lib/utils'

/**
 * Sanitiza el href que devuelve el agente en links markdown.
 *
 * El agente a veces emite `[00001677](500g700000srQYOAA2)` — pensando que
 * es un link interno a Salesforce. Pero como nuestra app es externa,
 * el href relativo se interpreta contra `window.location.origin` y rompe.
 *
 * Reglas:
 *  - http(s) absoluto → permitir tal cual.
 *  - Salesforce ID (15 ó 18 chars alfanuméricos) → reescribir a la URL Lightning del org.
 *  - Cualquier otra cosa → null (el caller renderiza como texto plano).
 */
function sanitizeAgentLink(href: string): string | null {
  if (!href) return null
  const trimmed = href.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  // Salesforce IDs: 15 (case-sensitive) o 18 (case-insensitive checksum) caracteres alfanuméricos.
  if (/^[a-zA-Z0-9]{15,18}$/.test(trimmed)) {
    return `${env.sfInstanceUrl}/lightning/r/${trimmed}/view`
  }
  return null
}

/**
 * Astro Agentforce — imagen oficial servida desde public/.
 * Si la imagen falla, cae a Sparkles como red de seguridad.
 */
function AstroIcon({ className }: { className?: string }) {
  const [errored, setErrored] = useState(false)
  if (errored) return <Sparkles className={className} />
  return (
    <img
      src={`${import.meta.env.BASE_URL}astro-agentforce.png`}
      alt="Agentforce"
      onError={() => setErrored(true)}
      className={cn('object-contain', className)}
      draggable={false}
    />
  )
}

/**
 * Chat custom 100% nuestro contra Banker Agentforce vía el Worker MCP.
 *
 * Diferencias vs el Embedded Service (MIAW) anterior:
 *  - DOM normal (sin Shadow DOM cross-origin → no más bug del FAB nativo).
 *  - Hereda los themes Dark/Light/Ocean automáticamente (CSS vars HSL).
 *  - Acceso al estado de la app: el agente ya sabe contexto del cliente abierto.
 *  - Composición libre: tipos custom de message bubbles, action chips, etc.
 *
 * Layout: FAB en esquina inferior izquierda (sidebar) + drawer flotante en
 * inferior derecha (no fullscreen).
 */

const SUGGESTED_PROMPTS = [
  'Resumen del cliente actual',
  'Casos abiertos de alta prioridad',
  'Próximas acciones recomendadas',
  'Qué oportunidades tenemos en curso',
]

export function AgentforceChatPanel() {
  const [open, setOpen] = useState(false)

  // Drawer del record clickeado en una card del agente.
  const [detailRef, setDetailRef] = useState<{ type: 'opportunity' | 'case'; id: string } | null>(
    null,
  )

  // Contexto inyectado en el primer mensaje al agente:
  //  - Banker: identidad del usuario OAuth-autenticado (siempre).
  //  - Cliente: solo si estamos en /customer/:id — en /home no aplica.
  const identity = useAuthStore((s) => s.identity)
  const location = useLocation()
  const inCustomerView = location.pathname.startsWith('/customer/')
  const accountId = useCurrentAccountId()
  const { data: account } = useAccount()

  const context: ChatContext = {
    bankerName: identity?.displayName,
    bankerEmail: identity?.email,
    bankerUsername: identity?.username,
    customerAccountId: inCustomerView ? accountId : undefined,
    customerName: inCustomerView ? (account?.Name ?? undefined) : undefined,
  }

  const chat = useAgentChat(context)

  // Lazy start: solo cuando el usuario abre el chat por primera vez.
  useEffect(() => {
    if (open && chat.status === 'idle') {
      void chat.start()
    }
  }, [open, chat])

  const handleOpenRecord = (apiName: string, id: string) => {
    if (apiName === 'Opportunity') setDetailRef({ type: 'opportunity', id })
    else if (apiName === 'Case') setDetailRef({ type: 'case', id })
    // Otros sObjects (Account, Task, FinancialAccount) — por ahora no abren drawer.
  }

  return (
    <>
      <Fab open={open} onClick={() => setOpen((v) => !v)} status={chat.status} />
      <ChatDrawer
        open={open}
        onClose={() => setOpen(false)}
        chat={chat}
        onOpenRecord={handleOpenRecord}
      />
      <RecordDetailHost detailRef={detailRef} onClose={() => setDetailRef(null)} />
    </>
  )
}

/** Monta el drawer correcto según el record clickeado. Fetchea por Id. */
function RecordDetailHost({
  detailRef,
  onClose,
}: {
  detailRef: { type: 'opportunity' | 'case'; id: string } | null
  onClose: () => void
}) {
  const oppId = detailRef?.type === 'opportunity' ? detailRef.id : null
  const caseId = detailRef?.type === 'case' ? detailRef.id : null

  const { data: opportunity } = useOpportunityById(oppId)
  const { data: caseRecord } = useCaseById(caseId)

  return (
    <>
      {detailRef?.type === 'opportunity' && (
        <OpportunityDetailDrawer
          opportunity={opportunity ?? null}
          open
          onOpenChange={(v) => !v && onClose()}
        />
      )}
      {detailRef?.type === 'case' && (
        <CaseDetailDrawer
          caseRecord={caseRecord ?? null}
          open
          onOpenChange={(v) => !v && onClose()}
        />
      )}
    </>
  )
}

/* ───────────────────────── FAB ───────────────────────── */

function Fab({
  open,
  onClick,
  status,
}: {
  open: boolean
  onClick: () => void
  status: ReturnType<typeof useAgentChat>['status']
}) {
  // Mientras el chat está abierto, escondemos el FAB para que no se solape con la ventana.
  // El cierre se hace desde el botón de minimizar dentro del header del drawer.
  if (open) return null

  return (
    <div className="fixed left-[128px] bottom-[140px] z-[60] -translate-x-1/2">
      <button
        onClick={onClick}
        aria-label="¿Necesitas ayuda?"
        className="group relative inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-3 text-foreground shadow-2xl shadow-black/40 transition-all duration-200 hover:scale-105 hover:border-chart-blue/40 hover:bg-secondary active:scale-95"
      >
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-inner ring-1 ring-black/5">
          <AstroIcon className="h-full w-full" />
          <StatusDot status={status} />
        </span>
        <span className="whitespace-nowrap pr-1 text-sm font-medium">¿Necesitas ayuda?</span>
      </button>
    </div>
  )
}

function StatusDot({ status }: { status: ReturnType<typeof useAgentChat>['status'] }) {
  const cls = (() => {
    switch (status) {
      case 'ready':
        return 'bg-chart-mint'
      case 'sending':
      case 'starting':
        return 'animate-pulse-soft bg-chart-orange'
      case 'error':
        return 'bg-chart-coral'
      default:
        return 'bg-muted-foreground'
    }
  })()
  return (
    <span
      className={cn(
        'absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card',
        cls,
      )}
    />
  )
}

/* ───────────────────────── Drawer ───────────────────────── */

function ChatDrawer({
  open,
  onClose,
  chat,
  onOpenRecord,
}: {
  open: boolean
  onClose: () => void
  chat: ReturnType<typeof useAgentChat>
  onOpenRecord: (apiName: string, id: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')

  // Auto-scroll al último mensaje.
  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat.messages, open])

  if (!open) return null

  const handleSend = (text: string) => {
    const t = text.trim()
    if (!t || chat.status !== 'ready') return
    setDraft('')
    void chat.send(t)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(draft)
  }

  return (
    <div className="fixed bottom-6 left-6 z-[55] flex h-[640px] max-h-[calc(100vh-3rem)] w-[440px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 data-[state=open]:animate-slide-up">
      <Header status={chat.status} onClose={onClose} onRetry={chat.retryStart} />

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto scrollbar-thin px-4 py-4">
        {chat.status === 'starting' && chat.messages.length === 0 && <ConnectingState />}

        {chat.status === 'error' && chat.messages.length === 0 && (
          <ErrorState message={chat.error ?? 'Error desconocido'} onRetry={chat.retryStart} />
        )}

        {chat.messages.map((m) => (
          <Bubble key={m.id} msg={m} onOpenRecord={onOpenRecord} />
        ))}

        {chat.status === 'ready' && chat.messages.length <= 1 && (
          <SuggestedPrompts onPick={handleSend} />
        )}
      </div>

      <Composer
        value={draft}
        onChange={setDraft}
        onSubmit={handleSubmit}
        disabled={chat.status !== 'ready'}
      />
    </div>
  )
}

/* ───────────────────────── Header ───────────────────────── */

function Header({
  status,
  onClose,
  onRetry,
}: {
  status: ReturnType<typeof useAgentChat>['status']
  onClose: () => void
  onRetry: () => void
}) {
  return (
    <div className="relative shrink-0 overflow-hidden border-b border-border">
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-chart-blue/30 via-chart-violet/20 to-chart-cyan/30" />
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-chart-blue/20 blur-3xl" />

      <div className="relative flex items-center gap-3 p-4">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-lg shadow-chart-blue/30 ring-1 ring-black/5">
          <AstroIcon className="h-full w-full" />
          <StatusDot status={status} />
        </div>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate font-display text-sm font-semibold">Agentforce Asistente Bancario</div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <DataTooltip
              title="Powered by Agentforce Agent API"
              description="La conversación va a través del BFF Worker que se autentica con Client Credentials y habla con api.salesforce.com/einstein/ai-agent/v1. Sesión real, datos reales del org."
              source="Cloudflare Worker → Agent Runtime API"
              side="bottom"
            >
              <span className="inline-flex cursor-help items-center gap-1 rounded-md bg-chart-orange/15 px-1.5 py-0.5 font-semibold text-chart-orange ring-1 ring-chart-orange/30">
                <Database className="h-2.5 w-2.5" /> BFF · Agent API
              </span>
            </DataTooltip>
            <StatusLabel status={status} />
          </div>
        </div>

        {status === 'error' && (
          <button
            onClick={onRetry}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
            aria-label="Reintentar"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
          aria-label="Minimizar"
          title="Minimizar"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function StatusLabel({ status }: { status: ReturnType<typeof useAgentChat>['status'] }) {
  switch (status) {
    case 'starting':
      return <span>Conectando…</span>
    case 'ready':
      return <span>En línea</span>
    case 'sending':
      return <span>Pensando…</span>
    case 'error':
      return <span className="text-chart-coral">Error de conexión</span>
    default:
      return <span>Inactivo</span>
  }
}

/* ───────────────────────── Bubble ───────────────────────── */

function Bubble({
  msg,
  onOpenRecord,
}: {
  msg: ChatMessage
  onOpenRecord?: (apiName: string, id: string) => void
}) {
  const isUser = msg.role === 'user'
  const isPending = msg.pending

  if (isPending) {
    return (
      <div className="flex items-start gap-2">
        <AgentAvatar />
        <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-secondary/40 px-3 py-2.5">
          <Dot delay={0} />
          <Dot delay={0.15} />
          <Dot delay={0.3} />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-start gap-2', isUser && 'flex-row-reverse')}>
      {!isUser && <AgentAvatar />}
      <div
        className={cn(
          'flex max-w-[85%] flex-col gap-2',
          isUser && 'items-end',
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-sm bg-gradient-to-br from-chart-blue to-chart-violet text-white shadow-sm'
              : 'rounded-tl-sm border border-border bg-secondary/40',
            msg.error && 'border-chart-coral/40 bg-chart-coral/10 text-chart-coral',
          )}
        >
          {msg.error && <AlertCircle className="mb-1 inline h-3.5 w-3.5" />}
          {isUser || msg.error ? (
            <div className="whitespace-pre-wrap">{msg.text}</div>
          ) : (
            <AgentMarkdown text={msg.text} />
          )}
        </div>
        {msg.records && msg.records.length > 0 && (
          <RecordCards records={msg.records} onOpenRecord={onOpenRecord} />
        )}
      </div>
    </div>
  )
}

/* ───────────────────────── Record cards ───────────────────────── */

const SOBJECT_THEMES: Record<
  string,
  { icon: typeof Briefcase; tone: string; bg: string; label: string }
> = {
  Opportunity: { icon: Briefcase, tone: 'text-chart-blue', bg: 'bg-chart-blue/10', label: 'Oportunidad' },
  Case: { icon: Headphones, tone: 'text-chart-coral', bg: 'bg-chart-coral/10', label: 'Caso' },
  Account: { icon: User, tone: 'text-chart-violet', bg: 'bg-chart-violet/10', label: 'Cuenta' },
  Contact: { icon: User, tone: 'text-chart-violet', bg: 'bg-chart-violet/10', label: 'Contacto' },
  FinServ__FinancialAccount__c: {
    icon: CreditCard,
    tone: 'text-chart-orange',
    bg: 'bg-chart-orange/10',
    label: 'Producto',
  },
  Task: { icon: CheckSquare, tone: 'text-chart-cyan', bg: 'bg-chart-cyan/10', label: 'Tarea' },
}

function themeFor(apiName: string | undefined) {
  if (!apiName) return { icon: FileText, tone: 'text-muted-foreground', bg: 'bg-secondary/50', label: 'Registro' }
  return (
    SOBJECT_THEMES[apiName] ?? {
      icon: FileText,
      tone: 'text-muted-foreground',
      bg: 'bg-secondary/50',
      label: apiName,
    }
  )
}

function RecordCards({
  records,
  onOpenRecord,
}: {
  records: AgentRecord[]
  onOpenRecord?: (apiName: string, id: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {records.map((r, i) => (
        <RecordCard key={r.id ?? i} record={r} onOpenRecord={onOpenRecord} />
      ))}
    </div>
  )
}

function RecordCard({
  record,
  onOpenRecord,
}: {
  record: AgentRecord
  onOpenRecord?: (apiName: string, id: string) => void
}) {
  const apiName = record.sObjectInfo?.apiName
  const theme = themeFor(apiName)
  const Icon = theme.icon

  // Extraemos hasta 3 campos relevantes del data dict, salteando Id/Name (ya están en el header).
  const data = record.data ?? {}
  const fields = Object.entries(data)
    .filter(([key]) => key !== 'Id' && key !== 'Name')
    .map(([key, val]) => ({
      key,
      display: val?.displayValue ?? val?.value ?? null,
    }))
    .filter((f) => f.display)
    .slice(0, 4)

  // Por ahora abrimos drawer solo para Opportunity y Case (los únicos que tienen drawer custom).
  const isClickable = !!onOpenRecord && (apiName === 'Opportunity' || apiName === 'Case') && !!record.id
  const handleClick = () => {
    if (isClickable && apiName) onOpenRecord!(apiName, record.id)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isClickable}
      className={cn(
        'group flex w-full items-start gap-2.5 rounded-xl border border-border bg-card/80 px-3 py-2.5 text-left transition-all',
        isClickable
          ? 'cursor-pointer hover:border-chart-blue/50 hover:bg-secondary/40 hover:shadow-md focus-visible:border-chart-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-blue/30 active:scale-[0.99]'
          : 'cursor-default',
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          theme.bg,
          theme.tone,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-[10px] font-semibold uppercase tracking-wider', theme.tone)}>
            {theme.label}
          </span>
        </div>
        <div className="truncate text-sm font-semibold leading-tight text-foreground">
          {record.title || '(sin título)'}
        </div>
        {fields.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            {fields.map((f) => (
              <span key={f.key}>
                <span className="text-muted-foreground/70">{prettyFieldName(f.key)}:</span>{' '}
                <span className="text-foreground/90">{f.display}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      {isClickable && (
        <ChevronRight className="mt-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-chart-blue" />
      )}
    </button>
  )
}

function prettyFieldName(key: string): string {
  // StageName → Stage; CloseDate → Cierre; Status → Estado; etc.
  const map: Record<string, string> = {
    StageName: 'Etapa',
    CloseDate: 'Cierre',
    Amount: 'Monto',
    Status: 'Estado',
    Priority: 'Prioridad',
    CaseNumber: 'Caso N°',
    Subject: 'Asunto',
    OwnerId: 'Owner',
    AccountId: 'Cuenta',
    CreatedDate: 'Creado',
    ActivityDate: 'Fecha',
  }
  return map[key] ?? key
}

/**
 * Markdown render para mensajes del agente.
 *
 * Estilos cuidadosamente afinados para que se integren con el bubble:
 *  - **bold** y *italic* visibles
 *  - listas (ul/ol) con indentación moderada y espaciado tight
 *  - code inline con background sutil
 *  - links subrayados en chart-blue
 *  - tablas legibles con borders del theme
 *  - sin headings exagerados (la respuesta vive dentro de un bubble)
 */
function AgentMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-2 break-words [&>:first-child]:mt-0 [&>:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="ml-4 list-disc space-y-0.5 marker:text-muted-foreground/60">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="ml-4 list-decimal space-y-0.5 marker:font-semibold marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => {
            // Sanitizamos el href:
            //  - Si es URL absoluta (http/https) → link normal en nueva pestaña.
            //  - Si parece un Salesforce ID (15/18 chars alfanumérico) → link al org Lightning.
            //  - Cualquier otra cosa (relativos, anchors a IDs, etc.) → render como texto pelado.
            const safe = sanitizeAgentLink(href ?? '')
            if (!safe) return <span className="font-medium text-foreground">{children}</span>
            return (
              <a
                href={safe}
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-chart-blue underline underline-offset-2 hover:text-chart-blue/80"
              >
                {children}
              </a>
            )
          },
          code: ({ children }) => (
            <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-[12px] text-chart-cyan">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-1 overflow-x-auto rounded-lg border border-border bg-black/40 p-2 text-[12px] leading-snug">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-chart-blue/40 pl-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => <div className="text-base font-bold">{children}</div>,
          h2: ({ children }) => <div className="text-sm font-bold">{children}</div>,
          h3: ({ children }) => <div className="text-sm font-semibold">{children}</div>,
          hr: () => <hr className="my-2 border-border" />,
          table: ({ children }) => (
            <div className="my-1 overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-border text-left text-muted-foreground">
              {children}
            </thead>
          ),
          th: ({ children }) => <th className="px-2 py-1 font-semibold">{children}</th>,
          td: ({ children }) => (
            <td className="border-t border-border/40 px-2 py-1">{children}</td>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

function AgentAvatar() {
  return (
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-black/5">
      <AstroIcon className="h-full w-full" />
    </div>
  )
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-muted-foreground"
      style={{ animationDelay: `${delay}s` }}
    />
  )
}

/* ───────────────────────── States ───────────────────────── */

function ConnectingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-chart-blue" />
      <div className="space-y-1">
        <div className="text-sm font-medium">Conectando con Banker Agentforce</div>
        <div className="text-xs text-muted-foreground">BFF Worker → Agent Runtime API</div>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="space-y-3 rounded-xl border border-chart-coral/20 bg-chart-coral/5 p-4 text-xs">
      <div className="flex items-center gap-2 font-medium text-chart-coral">
        <AlertCircle className="h-4 w-4" />
        No se pudo conectar con el agente
      </div>
      <div className="break-words font-mono text-[10px] text-chart-coral/80">{message}</div>
      <div className="rounded-lg border border-chart-orange/20 bg-chart-orange/5 p-2.5 text-chart-orange">
        <div className="font-semibold">¿El Worker está corriendo?</div>
        <div className="mt-1">
          Levantalo con:{' '}
          <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono">
            cd mcp-proxy && npx wrangler dev
          </code>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg bg-chart-blue px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-chart-blue/90"
      >
        <RotateCcw className="h-3 w-3" /> Reintentar
      </button>
    </div>
  )
}

function SuggestedPrompts({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="space-y-2 pt-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
        Sugerencias
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-[11px] font-medium text-foreground/80 transition-all hover:border-chart-blue/40 hover:bg-chart-blue/10 hover:text-chart-blue"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── Composer ───────────────────────── */

function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  disabled: boolean
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="shrink-0 border-t border-border bg-card p-3"
    >
      <div className="flex items-end gap-2 rounded-xl border border-border surface-1 px-3 py-2 transition-colors focus-within:border-chart-blue/40">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSubmit(e as unknown as React.FormEvent)
            }
          }}
          placeholder="Escribí tu pregunta…"
          rows={1}
          className="max-h-32 min-h-[1.5rem] flex-1 resize-none bg-transparent text-sm leading-snug placeholder:text-muted-foreground/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-chart-blue to-chart-violet text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          aria-label="Enviar"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-1.5 px-1 text-[10px] text-muted-foreground/60">
        Enter para enviar · Shift+Enter para nueva línea
      </div>
    </form>
  )
}
