import * as Popover from '@radix-ui/react-popover'
import { Settings2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVerticalStore, type Vertical } from '@/store/vertical'
import { useCountryStore } from '@/store/country'
import { VERTICAL_CONFIG } from '@/lib/verticalConfig'
import { COUNTRY_MARKETS, type CountryCode } from '@/lib/marketTickers'

/**
 * Menú colapsable de configuración. Un único popover con dos secciones inline:
 *  - Vertical de negocio (2 chips: Banking / Insurance)
 *  - Mercado local (3 chips: CL / PE / AR)
 *
 * Queda abierto al cambiar opciones — el SE puede ajustar las dos en vivo
 * sin reabrir. Se cierra con click afuera.
 */
export function SettingsMenu() {
  const vertical = useVerticalStore((s) => s.vertical)
  const setVertical = useVerticalStore((s) => s.setVertical)
  const country = useCountryStore((s) => s.country)
  const setCountry = useCountryStore((s) => s.setCountry)

  const verticals: Vertical[] = ['banking', 'insurance']
  const countries: CountryCode[] = ['CL', 'PE', 'AR']

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus:bg-secondary/60 focus:text-foreground focus:outline-none">
          <Settings2 className="h-4 w-4" />
          <span>Configuración</span>
          <Settings2 className="ml-auto h-3.5 w-3.5 opacity-60" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="right"
          align="end"
          sideOffset={12}
          className="z-50 w-72 rounded-2xl border border-border bg-card p-4 shadow-2xl backdrop-blur-xl animate-fade-in"
        >
          {/* Vertical */}
          <div className="space-y-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Vertical de negocio
              </div>
              <div className="text-[11px] text-muted-foreground">
                Cambia branding, KPIs y páginas.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {verticals.map((v) => {
                const cfg = VERTICAL_CONFIG[v]
                const Icon = cfg.brandIcon
                const isActive = v === vertical
                return (
                  <button
                    key={v}
                    onClick={() => setVertical(v)}
                    className={cn(
                      'group flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all',
                      isActive
                        ? v === 'insurance'
                          ? 'border-chart-coral/50 bg-chart-coral/10 text-chart-coral'
                          : 'border-chart-blue/50 bg-chart-blue/10 text-chart-blue'
                        : 'border-border bg-secondary/20 text-muted-foreground hover:border-border/80 hover:bg-secondary/40 hover:text-foreground',
                    )}
                  >
                    <div className="relative flex h-8 w-8 items-center justify-center">
                      <Icon className="h-4 w-4" />
                      {isActive && (
                        <Check
                          className={cn(
                            'absolute -right-1 -top-1 h-3 w-3 rounded-full p-0.5 text-white',
                            v === 'insurance' ? 'bg-chart-coral' : 'bg-chart-blue',
                          )}
                        />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold leading-tight">{cfg.brandLabel}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="my-3 h-px bg-border" />

          {/* País / Mercado */}
          <div className="space-y-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Mercado local
              </div>
              <div className="text-[11px] text-muted-foreground">
                Tile local del dashboard.
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {countries.map((c) => {
                const isActive = c === country
                return (
                  <button
                    key={c}
                    onClick={() => setCountry(c)}
                    className={cn(
                      'group inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-all',
                      isActive
                        ? 'border-chart-blue/50 bg-chart-blue/10 text-chart-blue'
                        : 'border-border bg-secondary/20 text-muted-foreground hover:border-border/80 hover:bg-secondary/40 hover:text-foreground',
                    )}
                  >
                    <span className="text-sm leading-none">{COUNTRY_MARKETS[c].flag}</span>
                    {c}
                  </button>
                )
              })}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
