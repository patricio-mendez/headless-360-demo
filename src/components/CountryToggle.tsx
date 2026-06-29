import * as Popover from '@radix-ui/react-popover'
import { Globe2, Flag, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCountryStore } from '@/store/country'
import { COUNTRY_MARKETS, type CountryCode } from '@/lib/marketTickers'

interface CountryOption {
  id: CountryCode
  label: string
  description: string
  flag: string
}

const OPTIONS: CountryOption[] = [
  {
    id: 'CL',
    label: 'Chile',
    description: 'IPSA · USD/CLP · COPEC',
    flag: '🇨🇱',
  },
  {
    id: 'PE',
    label: 'Perú',
    description: 'S&P Lima · USD/PEN · Cobre',
    flag: '🇵🇪',
  },
  {
    id: 'AR',
    label: 'Argentina',
    description: 'MERVAL · USD/ARS · YPF',
    flag: '🇦🇷',
  },
]

/**
 * Selector de país en el sidebar — replica el patrón visual del ThemePicker.
 * Cambia el tile "Mercado local" del Branch Dashboard y persiste en localStorage.
 */
export function CountryToggle() {
  const country = useCountryStore((s) => s.country)
  const setCountry = useCountryStore((s) => s.setCountry)

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus:bg-secondary/60 focus:text-foreground focus:outline-none">
          <Flag className="h-4 w-4" />
          <span>País</span>
          <Globe2 className="ml-auto h-3.5 w-3.5 opacity-60" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="right"
          align="end"
          sideOffset={12}
          className="z-50 w-72 rounded-2xl border border-border bg-card p-3 shadow-2xl backdrop-blur-xl animate-fade-in"
        >
          <div className="space-y-2">
            <div className="px-2 pb-1 pt-0.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Mercado local
              </div>
              <div className="text-xs text-muted-foreground">
                Cambia los indicadores del tile local del dashboard.
              </div>
            </div>
            {OPTIONS.map((opt) => {
              const isActive = opt.id === country
              return (
                <button
                  key={opt.id}
                  onClick={() => setCountry(opt.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all',
                    isActive
                      ? 'border-chart-blue/50 bg-chart-blue/10'
                      : 'border-transparent hover:border-border hover:bg-secondary/40',
                  )}
                >
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary/40 text-2xl ring-1 ring-white/10">
                    <span>{COUNTRY_MARKETS[opt.id].flag}</span>
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <span className="font-mono text-[10px] tracking-wider text-muted-foreground/70">
                        {opt.id}
                      </span>
                      {opt.label}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">{opt.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
