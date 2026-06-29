import {
  LayoutDashboard,
  Users,
  Briefcase,
  Headphones,
  Calendar,
  LogOut,
} from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { ThemePicker } from './ThemePicker'
import { CountryToggle } from './CountryToggle'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  to?: string
  matchPath?: string
  /** Si true, marca el ítem como "Próximamente" (deshabilitado, badge sutil). */
  comingSoon?: boolean
}

const nav: NavItem[] = [
  { icon: LayoutDashboard, label: 'Overview', to: '/home', matchPath: '/home' },
  { icon: Users, label: 'Clientes', to: '/clientes', matchPath: '/clientes' },
  { icon: Briefcase, label: 'Oportunidades', to: '/oportunidades', matchPath: '/oportunidades' },
  { icon: Headphones, label: 'Casos de Servicio', to: '/casos', matchPath: '/casos' },
  { icon: Calendar, label: 'Actividades', to: '/actividades', matchPath: '/actividades' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  function isActive(item: NavItem) {
    if (!item.matchPath) return false
    return location.pathname.startsWith(item.matchPath)
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <Link to="/home" className="flex h-16 items-center gap-3 px-6 transition-colors hover:bg-secondary/30">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-chart-blue to-chart-orange shadow-lg shadow-chart-blue/30">
          <span className="font-display text-sm font-bold text-white">H</span>
        </div>
        <div className="leading-tight">
          <div className="font-display text-base font-bold tracking-tight">Headless 360</div>
          <div className="text-[11px] text-muted-foreground">Salesforce demo</div>
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
              ? 'bg-chart-blue/15 text-chart-blue'
              : item.comingSoon
                ? 'cursor-not-allowed text-muted-foreground/50'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
          )
          const content = (
            <>
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-chart-blue" />}
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
      </nav>

      <div className="space-y-2 border-t border-border p-3">
        <CountryToggle />
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
