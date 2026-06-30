import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  PieChart,
  ShoppingCart,
  Atom,
  Activity,
  Star,
  PhoneCall,
  Plus,
  Loader2,
} from 'lucide-react'
import { useState, type ComponentType, type ReactNode } from 'react'
import { Progress } from './Progress'
import { DataTooltip } from './Tooltip'
import { EmailComposerModal, NewOpportunityModal } from './ProfileActionsModals'
import { useAccount } from '@/hooks/useCustomer'
import { useAuthStore } from '@/store/auth'
import { calculateAge, formatDate, initials, maskedAccountId, cn } from '@/lib/utils'
import type { PersonAccount } from '@/types/salesforce'

export function ProfileHeader() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr]">
      <IdentityCard />
      <InsightsCard />
    </div>
  )
}

function IdentityCard() {
  const { data: account, isLoading, isError } = useAccount()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-border/80">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-chart-blue/40 via-chart-violet/30 to-chart-orange/40" />
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-chart-blue/20 blur-3xl" />

      <div className="relative p-6">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-chart-blue" />
          </div>
        ) : isError || !account ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No se pudo cargar el cliente
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <DataTooltip
                title={`Person Account · ${account.Name}`}
                description={`Cliente individual del segmento Private Banking. Owner asignado: ${account.Owner?.Name ?? 'Sin asignar'}.`}
                source="UI API · /ui-api/record-ui"
              >
                <div className="relative -mt-4 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-gradient-to-br from-chart-blue to-chart-orange shadow-xl transition-transform hover:scale-105">
                  {account.Cust360_Contact_Picture_URL__pc && (
                    <img
                      src={account.Cust360_Contact_Picture_URL__pc}
                      alt={account.Name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // Si la URL del campo está rota/inaccesible, escondemos la <img>
                        // y dejamos visible el placeholder con iniciales.
                        const target = e.currentTarget
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                        target.nextElementSibling?.classList.add('flex')
                      }}
                    />
                  )}
                  <div
                    className={cn(
                      'absolute inset-0 items-center justify-center text-2xl font-bold text-white',
                      account.Cust360_Contact_Picture_URL__pc ? 'hidden' : 'flex',
                    )}
                  >
                    {initials(account.Name)}
                  </div>
                </div>
              </DataTooltip>
              <div className="flex-1 space-y-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold leading-tight">{account.Name}</h1>
                  <DataTooltip
                    title="Cliente Premium"
                    description="Top 5% del banco por relación integral: cartera, productos contratados y antigüedad."
                    source="Customer Tiering · FY27"
                  >
                    <span className="inline-flex items-center gap-1 rounded-full bg-chart-orange/15 px-2.5 py-0.5 text-[11px] font-medium text-chart-orange transition-colors hover:bg-chart-orange/25">
                      <Star className="h-3 w-3 fill-current" /> Premium
                    </span>
                  </DataTooltip>
                </div>
                <div className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                  <span>AccountID:</span>
                  <DataTooltip
                    title="Salesforce Account ID"
                    description="Identificador único del registro en Salesforce. Este Account es de tipo Person Account."
                    source={`Account.Id = ${account.Id}`}
                  >
                    <span className="font-mono text-[10px] text-foreground/60 underline decoration-dotted underline-offset-2">
                      {maskedAccountId(account.Id)}
                    </span>
                  </DataTooltip>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ContactRow
                icon={Mail}
                tone="blue"
                label="Email"
                value={account.PersonEmail ?? '—'}
                tooltip={{
                  title: 'Email principal',
                  description: 'Canal validado para notificaciones transaccionales y campañas de Marketing Cloud.',
                  source: 'Account.PersonEmail',
                }}
              />
              <ContactRow
                icon={Phone}
                tone="mint"
                label="Móvil"
                value={account.PersonMobilePhone ?? '—'}
                tooltip={{
                  title: 'Móvil verificado',
                  description: 'Canal preferido para notificaciones críticas. Habilitado para WhatsApp Business y SMS OTP.',
                  source: 'Account.PersonMobilePhone',
                }}
              />
              <ContactRow
                icon={MapPin}
                tone="coral"
                label="Ubicación"
                value={[account.BillingCity, account.BillingCountry].filter(Boolean).join(', ') || 'Sin registrar'}
                tooltip={{
                  title: 'Locación geográfica',
                  description: 'Sucursal asignada según código postal. Hyperforce region: AWS São Paulo.',
                  source: 'Account.BillingAddress',
                }}
              />
              <ContactRow
                icon={Calendar}
                tone="violet"
                label="Nacimiento"
                value={
                  account.PersonBirthdate
                    ? `${formatDate(account.PersonBirthdate)} · ${calculateAge(account.PersonBirthdate)} años`
                    : '—'
                }
                tooltip={{
                  title: 'Datos demográficos',
                  description: 'Generación X. Segmento etario clave para productos hipotecarios e inversión patrimonial.',
                  source: 'Account.PersonBirthdate',
                }}
              />
            </div>

            <ProfileActions account={account} />
          </>
        )}
      </div>
    </div>
  )
}

function ContactRow({
  icon: Icon,
  tone,
  label,
  value,
  tooltip,
}: {
  icon: ComponentType<{ className?: string }>
  tone: 'blue' | 'mint' | 'coral' | 'violet'
  label: string
  value: string
  tooltip: { title: string; description: string; source?: string }
}) {
  const toneClass = {
    blue: 'bg-chart-blue/15 text-chart-blue',
    mint: 'bg-chart-mint/15 text-chart-mint',
    coral: 'bg-chart-coral/15 text-chart-coral',
    violet: 'bg-chart-violet/15 text-chart-violet',
  }[tone]
  return (
    <DataTooltip {...tooltip}>
      <div className="flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-secondary/50">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</div>
          <div className="truncate text-sm font-medium">{value}</div>
        </div>
      </div>
    </DataTooltip>
  )
}

function InsightsCard() {
  const { data: account } = useAccount()

  // Lee los campos Cust360 del Account. Si no están poblados, fallback a defaults
  // genéricos para que el card no se rompa visualmente.
  const loyaltyTier = account?.Cust360_Metric1__pc ?? '—'
  const segment = account?.Cust360_Metric2__pc ?? '—'
  const ltvRaw = account?.Cust360_Metric3__pc ?? null
  const propensityLabel = account?.Cust360_Metric4__pc ?? '—'
  const purchaseScore = account?.Cust360_Purchase_Score__pc ?? 0
  const engagementScore = account?.Cust360_Engagement_Score__pc ?? 0
  const csat = account?.Cust360_CSAT__pc ?? null
  const churnRisk = account?.Cust360_ChurnRisk__pc ?? null

  // El LTV viene como string formateado ("$ 4.580.000") o vacío.
  // Si tiene el "$" lo usamos tal cual; sino mostramos guion.
  const ltvDisplay = ltvRaw && ltvRaw.trim() !== '' ? ltvRaw : '—'

  // Status badge: si hay CSAT > 0 → Activo. Si churnRisk → en riesgo. Sino genérico.
  const isActive = (csat ?? 0) > 0 && !churnRisk
  const statusLabel = churnRisk ? '● En riesgo' : isActive ? '● Activo' : '● Sin datos'
  const statusClass = churnRisk
    ? 'border-chart-coral/30 bg-chart-coral/10 text-chart-coral'
    : isActive
      ? 'border-chart-mint/30 bg-chart-mint/10 text-chart-mint'
      : 'border-border bg-secondary/30 text-muted-foreground'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-border/80">
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-chart-violet/10 blur-3xl" />

      <div className="relative space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Customer Insights
            </div>
            <h3 className="font-display text-base font-semibold">Perfil estratégico</h3>
          </div>
          <DataTooltip
            title={churnRisk ? 'En riesgo' : 'Cliente activo'}
            description={
              churnRisk
                ? `Risk of Churn: ${churnRisk}. Considerar acciones de retención.`
                : `CSAT ${csat ?? '—'} · Engagement ${engagementScore}%`
            }
            source="Account · Cust360 fields"
          >
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[10px] font-medium',
                statusClass,
              )}
            >
              {statusLabel}
            </span>
          </DataTooltip>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InsightItem
            icon={Heart}
            tone="coral"
            label="Loyalty Tier"
            value={loyaltyTier}
            tooltip={{
              title: `Loyalty Tier · ${loyaltyTier}`,
              description:
                'Tier asignado al cliente según LTV, antigüedad y productos contratados.',
              source: 'Account.Cust360_Metric1__pc',
            }}
          />
          <InsightItem
            icon={PieChart}
            tone="blue"
            label="Segment"
            value={segment}
            tooltip={{
              title: `Segmentación: ${segment}`,
              description: 'Segmento comercial basado en patrimonio gestionado y productos.',
              source: 'Account.Cust360_Metric2__pc',
            }}
          />
        </div>

        <div className="h-px bg-secondary/60" />

        <InsightItem
          icon={ShoppingCart}
          tone="orange"
          label="Lifetime Value"
          value={ltvDisplay}
          accent
          tooltip={{
            title: `Lifetime Value · ${ltvDisplay}`,
            description: 'Valor estimado del cliente para el banco a lo largo de la relación.',
            source: 'Account.Cust360_Metric3__pc',
          }}
        />

        <InsightTooltip
          icon={Atom}
          tone="mint"
          label="Propensity to Purchase"
          valueLabel={propensityLabel}
          progress={purchaseScore}
          tooltip={{
            title: `Propensity to Purchase · ${purchaseScore}%`,
            description: `Probabilidad de aceptar una oferta en próximos 90 días (${propensityLabel}).`,
            source: 'Account.Cust360_Purchase_Score__pc',
          }}
        />

        <InsightTooltip
          icon={Activity}
          tone="cyan"
          label="Engagement Score"
          valueLabel={`${engagementScore}%`}
          progress={engagementScore}
          tooltip={{
            title: `Engagement Score · ${engagementScore}%`,
            description: 'Score compuesto de interacciones cross-canal (web, app, sucursal).',
            source: 'Account.Cust360_Engagement_Score__pc',
          }}
        />
      </div>
    </div>
  )
}

function InsightItem({
  icon: Icon,
  tone,
  label,
  value,
  accent,
  tooltip,
}: {
  icon: ComponentType<{ className?: string }>
  tone: 'blue' | 'orange' | 'coral' | 'mint' | 'cyan' | 'violet'
  label: string
  value: ReactNode
  accent?: boolean
  tooltip: { title: string; description: string; source?: string }
}) {
  const toneClass = {
    blue: 'bg-chart-blue/15 text-chart-blue',
    orange: 'bg-chart-orange/15 text-chart-orange',
    coral: 'bg-chart-coral/15 text-chart-coral',
    mint: 'bg-chart-mint/15 text-chart-mint',
    cyan: 'bg-chart-cyan/15 text-chart-cyan',
    violet: 'bg-chart-violet/15 text-chart-violet',
  }[tone]
  return (
    <DataTooltip {...tooltip}>
      <div className="flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-secondary/50">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</div>
          <div className={`truncate ${accent ? 'text-base font-bold' : 'text-sm font-semibold'}`}>
            {value}
          </div>
        </div>
      </div>
    </DataTooltip>
  )
}

function InsightTooltip({
  icon: Icon,
  tone,
  label,
  valueLabel,
  progress,
  tooltip,
}: {
  icon: ComponentType<{ className?: string }>
  tone: 'mint' | 'cyan'
  label: string
  valueLabel: string
  progress: number
  tooltip: { title: string; description: string; source?: string }
}) {
  const toneClass = {
    mint: 'bg-chart-mint/15 text-chart-mint',
    cyan: 'bg-chart-cyan/15 text-chart-cyan',
  }[tone]
  const valueColor = {
    mint: 'text-chart-mint',
    cyan: 'text-chart-cyan',
  }[tone]
  return (
    <DataTooltip {...tooltip}>
      <div className="space-y-2.5 rounded-xl p-1 transition-colors hover:bg-secondary/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneClass}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <span className={`text-sm font-semibold ${valueColor}`}>{valueLabel}</span>
        </div>
        <Progress value={progress} tone="auto" />
      </div>
    </DataTooltip>
  )
}

/* ───────────────────────── Action buttons ───────────────────────── */

function ProfileActions({ account }: { account: PersonAccount }) {
  const [emailOpen, setEmailOpen] = useState(false)
  const [oppOpen, setOppOpen] = useState(false)
  const bankerName = useAuthStore((s) => s.identity?.displayName) ?? 'Banker'

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
        {account.PersonMobilePhone ? (
          <a
            href={`tel:${account.PersonMobilePhone}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border surface-2 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
          >
            <PhoneCall className="h-3.5 w-3.5" /> Llamar
          </a>
        ) : (
          <button
            disabled
            title="El cliente no tiene teléfono registrado"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border surface-2 px-4 py-2 text-sm font-medium text-muted-foreground/50"
          >
            <PhoneCall className="h-3.5 w-3.5" /> Llamar
          </button>
        )}

        <button
          onClick={() => setEmailOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-border surface-2 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
        >
          <Mail className="h-3.5 w-3.5" /> Enviar email
        </button>

        <button
          onClick={() => setOppOpen(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-chart-blue px-4 py-2 text-sm font-medium text-white shadow-lg shadow-chart-blue/30 transition-all hover:bg-chart-blue/90 hover:shadow-xl hover:shadow-chart-blue/40"
        >
          <Plus className="h-3.5 w-3.5" /> Nueva oportunidad
        </button>
      </div>

      <EmailComposerModal
        open={emailOpen}
        onOpenChange={setEmailOpen}
        customerName={account.Name}
        customerEmail={account.PersonEmail}
        bankerName={bankerName}
      />
      <NewOpportunityModal
        open={oppOpen}
        onOpenChange={setOppOpen}
        accountId={account.Id}
        customerName={account.Name}
      />
    </>
  )
}
