import * as RT from '@radix-ui/react-tooltip'
import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DataTooltipProps {
  children: ReactNode
  title: string
  description: string
  source?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function DataTooltip({
  children,
  title,
  description,
  source,
  side = 'top',
  className,
}: DataTooltipProps) {
  return (
    <RT.Provider delayDuration={200}>
      <RT.Root>
        <RT.Trigger asChild>
          <div className={cn('cursor-help', className)}>{children}</div>
        </RT.Trigger>
        <RT.Portal>
          <RT.Content
            side={side}
            sideOffset={8}
            className="z-50 max-w-[280px] animate-fade-in rounded-xl border border-border bg-card/95 p-3.5 text-xs leading-relaxed text-foreground shadow-2xl backdrop-blur-xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          >
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-chart-blue" />
              <div className="space-y-1.5">
                <div className="font-display text-[13px] font-semibold leading-tight">{title}</div>
                <div className="text-muted-foreground">{description}</div>
                {source && (
                  <div className="border-t border-border pt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {source}
                  </div>
                )}
              </div>
            </div>
            <RT.Arrow className="fill-card/95" />
          </RT.Content>
        </RT.Portal>
      </RT.Root>
    </RT.Provider>
  )
}
