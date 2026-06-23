import { cn } from '@/lib/utils'

type Tone = 'blue' | 'orange' | 'mint' | 'coral' | 'cyan' | 'violet' | 'auto'

interface ProgressProps {
  value: number
  tone?: Tone
  size?: 'sm' | 'md'
  className?: string
}

const toneClass: Record<Exclude<Tone, 'auto'>, string> = {
  blue: 'bg-chart-blue',
  orange: 'bg-chart-orange',
  mint: 'bg-chart-mint',
  coral: 'bg-chart-coral',
  cyan: 'bg-chart-cyan',
  violet: 'bg-chart-violet',
}

export function autoTone(value: number): 'mint' | 'orange' | 'coral' {
  if (value >= 70) return 'mint'
  if (value >= 40) return 'orange'
  return 'coral'
}

export function Progress({ value, tone = 'blue', size = 'md', className }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value))
  const height = size === 'sm' ? 'h-1.5' : 'h-2'
  const resolvedTone = tone === 'auto' ? autoTone(pct) : tone
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-secondary', height, className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', toneClass[resolvedTone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
