import { LayoutDashboard, LogOut } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useVerticalStore } from '@/store/vertical'
import { getVerticalConfig, type SidebarItem } from '@/lib/verticalConfig'
import { ThemePicker } from './ThemePicker'
import { SettingsMenu } from './SettingsMenu'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const vertical = useVerticalStore((s) => s.vertical)
  const cfg = getVerticalConfig(vertical)
  const isInsurance = vertical === 'insurance'

  // Overview siempre primero; el resto viene del config por vertical.
  const nav: SidebarItem[] = [
    { icon: LayoutDashboard, label: 'Overview', to: '/home', matchPath: '/home' },
    ...cfg.sidebarItems,
  ]

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  function isActive(item: SidebarItem) {
    if (!item.matchPath) return false
    return location.pathname.startsWith(item.matchPath)
  }

  const activeAccent = isInsurance ? 'chart-coral' : 'chart-blue'
  const activeBg = isInsurance ? 'bg-chart-coral/15 text-chart-coral' : 'bg-chart-blue/15 text-chart-blue'
  const activeDot = isInsurance ? 'bg-chart-coral' : 'bg-chart-blue'
  const logoGradient = isInsurance
    ? 'bg-gradient-to-br from-chart-coral to-chart-orange shadow-lg shadow-chart-coral/30'
    : 'bg-gradient-to-br from-chart-blue to-chart-orange shadow-lg shadow-chart-blue/30'

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <Link to="/home" className="flex h-16 items-center gap-3 px-6 transition-colors hover:bg-secondary/30">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', logoGradient)}>
          <span className="font-display text-sm font-bold text-white">
            {cfg.topBarTitle.charAt(0)}
          </span>
        </div>
        <div className="leading-tight">
          <div className="font-display text-base font-bold tracking-tight">{cfg.topBarTitle}</div>
          <div className="text-[11px] text-muted-foreground">{cfg.topBarSubtitle}</div>
        </div>
      </Link>

      <div className="px-4 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        Dashboard
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = isActive(item)
          const className = cn(
            'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            active
              ? activeBg
              : item.comingSoon
                ? 'cursor-not-allowed text-muted-foreground/50'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
          )
          const content = (
            <>
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {active && <span className={cn('ml-auto h-1.5 w-1.5 rounded-full', activeDot)} />}
              {item.comingSoon && (
                <span className="ml-auto rounded-md border border-border bg-secondary/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Pronto
                </span>
              )}
            </>
          )
          if (item.to) {
            return (
              <Link key={item.label} to={item.to} className={className}>
                {content}
              </Link>
            )
          }
          return (
            <button
              key={item.label}
              disabled={item.comingSoon}
              title={item.comingSoon ? 'Próximamente' : undefined}
              className={className}
            >
              {content}
            </button>
          )
        })}
        {/* activeAccent is read implicitly via activeBg/activeDot above */}
        <span className="sr-only">{activeAccent}</span>
      </nav>

      <div className="space-y-2 border-t border-border p-3">
        <SettingsMenu />
        <ThemePicker />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
