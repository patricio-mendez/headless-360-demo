import * as Popover from '@radix-ui/react-popover'
import { Palette, Moon, Sun, Waves, Sparkles, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore, type Theme } from '@/store/theme'

interface ThemeOption {
  id: Theme
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  preview: string
}

const OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    label: 'Dark',
    description: 'Navy profundo con acentos blue + orange.',
    icon: Moon,
    preview: 'linear-gradient(135deg, hsl(230 25% 11%) 0%, hsl(228 22% 14%) 50%, hsl(213 95% 60%) 100%)',
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Limpio y claro, banca premium.',
    icon: Sun,
    preview: 'linear-gradient(135deg, hsl(220 30% 97%) 0%, hsl(0 0% 100%) 50%, hsl(213 95% 70%) 100%)',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Degradé de azules y cyan.',
    icon: Waves,
    preview: 'linear-gradient(135deg, hsl(210 70% 18%) 0%, hsl(195 95% 50%) 50%, hsl(175 80% 55%) 100%)',
  },
  {
    id: 'premium',
    label: 'Premium',
    description: 'Dark con degradé radial estilo LoginPage.',
    icon: Sparkles,
    preview:
      'radial-gradient(circle at 15% 20%, hsl(213 95% 55% / 0.6), transparent 50%), radial-gradient(circle at 85% 75%, hsl(20 96% 62% / 0.5), transparent 50%), hsl(230 25% 11%)',
  },
]

export function ThemePicker() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const current = OPTIONS.find((o) => o.id === theme) ?? OPTIONS[0]
  const CurrentIcon = current.icon

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus:bg-secondary/60 focus:text-foreground focus:outline-none">
          <CurrentIcon className="h-4 w-4" />
          <span>Tema · {current.label}</span>
          <Palette className="ml-auto h-3.5 w-3.5 opacity-60" />
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
                Apariencia
              </div>
              <div className="text-xs text-muted-foreground">Elegí un estilo para la demo.</div>
            </div>
            {OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isActive = opt.id === theme
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all',
                    isActive
                      ? 'border-chart-blue/50 bg-chart-blue/10'
                      : 'border-transparent hover:border-border hover:bg-secondary/40',
                  )}
                >
                  <div
                    className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10"
                    style={{ background: opt.preview }}
                  >
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <Icon className="h-3.5 w-3.5" />
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
