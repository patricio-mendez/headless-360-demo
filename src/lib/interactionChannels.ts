import { Megaphone, Mail, Globe, MessageCircle, type LucideIcon } from 'lucide-react'
import type { InteractionChannel } from '@/hooks/useMarketingInteractions'

export type ChannelTone = 'violet' | 'cyan' | 'mint'

interface ChannelPresentation {
  icon: LucideIcon
  tone: ChannelTone
  label: string
}

/**
 * Presentación por canal para el timeline y el drawer de interacciones.
 * Tono alineado a la paleta chart-* del proyecto:
 *   Campaign/Email → violet · Web → cyan · WhatsApp/SMS → mint
 */
export const channelPresentation: Record<InteractionChannel, ChannelPresentation> = {
  Campaign: { icon: Megaphone, tone: 'violet', label: 'Campaña' },
  Email: { icon: Mail, tone: 'violet', label: 'Email' },
  Web: { icon: Globe, tone: 'cyan', label: 'Web' },
  WhatsApp: { icon: MessageCircle, tone: 'mint', label: 'WhatsApp' },
  SMS: { icon: MessageCircle, tone: 'mint', label: 'SMS' },
}

export const channelToneClasses: Record<
  ChannelTone,
  { dot: string; ring: string; text: string; bg: string; stroke: string }
> = {
  violet: {
    dot: 'bg-chart-violet',
    ring: 'ring-chart-violet/30',
    text: 'text-chart-violet',
    bg: 'bg-chart-violet/15',
    stroke: 'stroke-chart-violet',
  },
  cyan: {
    dot: 'bg-chart-cyan',
    ring: 'ring-chart-cyan/30',
    text: 'text-chart-cyan',
    bg: 'bg-chart-cyan/15',
    stroke: 'stroke-chart-cyan',
  },
  mint: {
    dot: 'bg-chart-mint',
    ring: 'ring-chart-mint/30',
    text: 'text-chart-mint',
    bg: 'bg-chart-mint/15',
    stroke: 'stroke-chart-mint',
  },
}
