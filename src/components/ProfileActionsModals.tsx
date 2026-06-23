import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useQueryClient } from '@tanstack/react-query'
import {
  X,
  Mail,
  Send,
  Paperclip,
  Image,
  Sparkles,
  Plus,
  Loader2,
  Briefcase,
  CalendarDays,
  DollarSign,
  Trophy,
} from 'lucide-react'
import { sfPost } from '@/lib/sfClient'
import { env } from '@/lib/env'
import { toast } from './Toast'
import { cn } from '@/lib/utils'

const STAGES = [
  'Prospecting',
  'Qualification',
  'Needs Analysis',
  'Value Proposition',
  'Proposal/Quote',
  'Negotiation/Review',
  'Closed Won',
  'Closed Lost',
]

/* ───────────────────────── Email Composer ───────────────────────── */

interface EmailComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerName: string
  customerEmail: string | null
  bankerName: string
}

export function EmailComposerModal({
  open,
  onOpenChange,
  customerName,
  customerEmail,
  bankerName,
}: EmailComposerProps) {
  const [to, setTo] = useState(customerEmail ?? '')
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState(`Seguimiento — ${customerName}`)
  const [body, setBody] = useState(
    `Hola ${customerName.split(' ')[0]},\n\nEspero que te encuentres muy bien. Te escribo para hacer seguimiento de tu cuenta y comentarte algunos puntos relevantes.\n\nQuedo atento a cualquier consulta.\n\nSaludos,\n${bankerName}\nCumulus Bank`,
  )
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    setSending(true)
    // Simulación de envío — sin backend real.
    await new Promise((r) => setTimeout(r, 1200))
    setSending(false)
    onOpenChange(false)
    toast({
      variant: 'success',
      title: 'Email enviado',
      description: `${subject} → ${to}`,
    })
  }

  // Reset al cerrar
  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setTo(customerEmail ?? '')
      setCc('')
      setSubject(`Seguimiento — ${customerName}`)
    }
    onOpenChange(v)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[640px] max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 data-[state=open]:animate-fade-in">
          <div className="relative shrink-0 overflow-hidden border-b border-border">
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-chart-blue/30 via-chart-cyan/20 to-chart-violet/30" />
            <div className="relative flex items-start justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-chart-blue to-chart-cyan shadow-lg shadow-chart-blue/30">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Dialog.Title asChild>
                    <h2 className="font-display text-lg font-bold leading-tight">
                      Nuevo correo electrónico
                    </h2>
                  </Dialog.Title>
                  <Dialog.Description asChild>
                    <p className="text-[11px] text-muted-foreground">
                      Para {customerName} — desde Cumulus Bank
                    </p>
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
                  aria-label="Cerrar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {/* Headers */}
            <div className="space-y-0 border-b border-border">
              <FieldRow label="Para">
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                  placeholder="cliente@ejemplo.com"
                />
              </FieldRow>
              <FieldRow label="CC">
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                  placeholder="(opcional)"
                />
              </FieldRow>
              <FieldRow label="Asunto">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium focus:outline-none"
                />
              </FieldRow>
            </div>

            {/* Body */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full resize-none border-none bg-transparent p-5 text-sm leading-relaxed focus:outline-none"
              placeholder="Escribe tu mensaje…"
            />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-secondary/30 px-5 py-3">
            <div className="flex items-center gap-1">
              <ToolbarBtn icon={Paperclip} label="Adjuntar" />
              <ToolbarBtn icon={Image} label="Insertar imagen" />
              <ToolbarBtn icon={Sparkles} label="Mejorar con IA" tone="text-chart-violet" />
            </div>
            <div className="flex items-center gap-2">
              <Dialog.Close asChild>
                <button className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                onClick={handleSend}
                disabled={sending || !to.trim() || !subject.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-chart-blue px-4 py-2 text-xs font-semibold text-white shadow-md shadow-chart-blue/30 transition-all hover:bg-chart-blue/90 hover:shadow-lg hover:shadow-chart-blue/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3" /> Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-2.5 last:border-b-0">
      <span className="w-16 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function ToolbarBtn({
  icon: Icon,
  label,
  tone = 'text-muted-foreground',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  tone?: string
}) {
  return (
    <button
      title={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-secondary',
        tone,
        'hover:text-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

/* ───────────────────────── New Opportunity ───────────────────────── */

interface NewOpportunityProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  customerName: string
}

export function NewOpportunityModal({
  open,
  onOpenChange,
  accountId,
  customerName,
}: NewOpportunityProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [closeDate, setCloseDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().slice(0, 10)
  })
  const [stage, setStage] = useState('Prospecting')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setAmount('')
    setError(null)
  }

  const handleClose = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        Name: name.trim(),
        AccountId: accountId,
        StageName: stage,
        CloseDate: closeDate,
      }
      const amt = Number(amount.replace(/[^\d.-]/g, ''))
      if (!isNaN(amt) && amt > 0) body.Amount = amt
      await sfPost(`/services/data/${env.sfApiVersion}/sobjects/Opportunity`, body)
      // Refrescar caches que muestran oportunidades del cliente actual y del book.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['opportunities', accountId] }),
        queryClient.invalidateQueries({ queryKey: ['banker-opportunities'] }),
      ])
      toast({
        variant: 'success',
        title: 'Oportunidad creada',
        description: `${name} para ${customerName}`,
      })
      onOpenChange(false)
      reset()
    } catch (err) {
      setError((err as Error).message ?? 'Error desconocido')
    } finally {
      setSubmitting(false)
    }
  }

  const isClosedWon = stage === 'Closed Won'
  const isClosedLost = stage === 'Closed Lost'

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[560px] max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 data-[state=open]:animate-fade-in">
          <div className="relative shrink-0 overflow-hidden border-b border-border">
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-chart-blue/30 via-chart-violet/20 to-chart-cyan/30" />
            <div className="relative flex items-start justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-chart-blue to-chart-violet shadow-lg shadow-chart-blue/30">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Dialog.Title asChild>
                    <h2 className="font-display text-lg font-bold leading-tight">Nueva oportunidad</h2>
                  </Dialog.Title>
                  <Dialog.Description asChild>
                    <p className="text-[11px] text-muted-foreground">Para {customerName}</p>
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
                  aria-label="Cerrar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin p-5">
              <FormField label="Nombre de la oportunidad" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ej. Crédito Hipotecario - Casa Costanera"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-chart-blue/50 focus:outline-none focus:ring-2 focus:ring-chart-blue/20"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Monto (CLP)" icon={DollarSign}>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="numeric"
                    placeholder="120000000"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-chart-blue/50 focus:outline-none focus:ring-2 focus:ring-chart-blue/20"
                  />
                </FormField>
                <FormField label="Fecha de cierre" required icon={CalendarDays}>
                  <input
                    type="date"
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                    required
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-chart-blue/50 focus:outline-none focus:ring-2 focus:ring-chart-blue/20"
                  />
                </FormField>
              </div>

              <FormField label="Etapa" required icon={Trophy}>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className={cn(
                    'h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-chart-blue/50 focus:outline-none focus:ring-2 focus:ring-chart-blue/20',
                    isClosedWon && 'text-chart-mint',
                    isClosedLost && 'text-chart-coral',
                  )}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </FormField>

              {error && (
                <div className="rounded-xl border border-chart-coral/30 bg-chart-coral/10 p-3 text-xs text-chart-coral">
                  <div className="font-semibold">No se pudo crear la oportunidad</div>
                  <div className="mt-1 break-words font-mono text-[10px] opacity-80">{error}</div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-secondary/30 px-5 py-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-chart-blue px-4 py-2 text-xs font-semibold text-white shadow-md shadow-chart-blue/30 transition-all hover:bg-chart-blue/90 hover:shadow-lg hover:shadow-chart-blue/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Creando…
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" /> Crear oportunidad
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function FormField({
  label,
  required,
  icon: Icon,
  children,
}: {
  label: string
  required?: boolean
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
        {required && <span className="text-chart-coral">*</span>}
      </span>
      {children}
    </label>
  )
}
