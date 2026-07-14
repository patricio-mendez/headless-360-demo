import {
  engagementBucket,
  BUCKET_LABEL,
  type MarketingInteraction,
  type EngagementBucket,
} from '@/hooks/useMarketingInteractions'
import { channelPresentation, channelToneClasses } from '@/lib/interactionChannels'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

export const bucketBadge: Record<EngagementBucket, { bg: string; text: string; dot: string }> = {
  responded: { bg: 'bg-chart-mint/15', text: 'text-chart-mint', dot: 'bg-chart-mint' },
  sent: { bg: 'bg-secondary/60', text: 'text-muted-foreground', dot: 'bg-muted-foreground/50' },
  abandoned: { bg: 'bg-chart-orange/15', text: 'text-chart-orange', dot: 'bg-chart-orange' },
}

/** Contenido del tooltip de una interacción (usado por timeline y curva). */
export function InteractionTooltipContent({ it }: { it: MarketingInteraction }) {
  const pres = channelPresentation[it.channel]
  const tone = channelToneClasses[pres.tone]
  const Icon = pres.icon
  const bucket = engagementBucket(it.interactionType)
  const badge = bucketBadge[bucket]

  return (
    <div className="flex items-start gap-2.5">
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', tone.bg, tone.text)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="font-display text-[13px] font-semibold leading-tight">{it.subject}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium', tone.bg, tone.text)}>
            {pres.label} · {it.interactionType}
          </span>
          <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium', badge.bg, badge.text)}>
            {BUCKET_LABEL[bucket]}
          </span>
          <span className="rounded-md bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Score {it.engagementScore}
          </span>
        </div>
        {it.previewSnippet && <p className="text-[11px] italic text-muted-foreground">“{it.previewSnippet}”</p>}
        {!it.previewSnippet && it.url && <p className="truncate text-[11px] text-chart-cyan">{it.url}</p>}
        <div className="text-[11px] text-muted-foreground">
          {formatDateTime(it.interactionTs)} · {it.sourceSystem}
        </div>
      </div>
    </div>
  )
}

/** Fila de la lista detallada de una interacción. */
export function InteractionRow({ it, highlighted = false }: { it: MarketingInteraction; highlighted?: boolean }) {
  const pres = channelPresentation[it.channel]
  const tone = channelToneClasses[pres.tone]
  const Icon = pres.icon
  const bucket = engagementBucket(it.interactionType)
  const badge = bucketBadge[bucket]

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border bg-card p-3.5 transition-colors',
        highlighted ? cn('border-transparent ring-2', tone.ring) : 'border-border hover:border-border/60',
      )}
    >
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tone.bg, tone.text)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-display text-sm font-semibold leading-tight">{it.subject}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">{formatDateTime(it.interactionTs)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium', tone.bg, tone.text)}>
            {pres.label} · {it.interactionType}
          </span>
          <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium', badge.bg, badge.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', badge.dot)} />
            {BUCKET_LABEL[bucket]}
          </span>
          <span className="rounded-md bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Score {it.engagementScore}
          </span>
        </div>
        {it.previewSnippet ? (
          <p className="text-[11px] italic text-muted-foreground">“{it.previewSnippet}”</p>
        ) : it.url ? (
          <p className="truncate text-[11px] text-chart-cyan">{it.url}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground">{it.channelDetail}</p>
        )}
        <p className="text-[10px] text-muted-foreground/70">Fuente: {it.sourceSystem}</p>
      </div>
    </div>
  )
}
