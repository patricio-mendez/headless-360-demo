import {
  Building2,
  Shield,
  Users,
  Briefcase,
  Headphones,
  Calendar,
  FileText,
  AlertOctagon,
  type LucideIcon,
} from 'lucide-react'
import type { Vertical } from '@/store/vertical'

export interface SidebarItem {
  icon: LucideIcon
  label: string
  to: string
  matchPath?: string
  comingSoon?: boolean
}

export interface VerticalConfig {
  id: Vertical
  label: string
  brandLabel: string
  description: string
  brandIcon: LucideIcon
  /** Accent CSS hsl color used in welcome banner gradient + headings. */
  accentVar: string
  /** Tagline of TopBar (subtitle). */
  topBarTitle: string
  topBarSubtitle: string
  /** Heading shown above the "Hola, X" welcome. */
  dashboardEyebrow: string
  /** Default landing route after login (currently both go to /home). */
  defaultRoute: string
  /** Sidebar nav items in the order they should appear. */
  sidebarItems: SidebarItem[]
}

export const VERTICAL_CONFIG: Record<Vertical, VerticalConfig> = {
  banking: {
    id: 'banking',
    label: 'Banca',
    brandLabel: 'Cumulus Bank',
    description: 'Clientes, oportunidades, casos y actividades.',
    brandIcon: Building2,
    accentVar: 'chart-blue',
    topBarTitle: 'Cumulus Bank',
    topBarSubtitle: 'Headless 360',
    dashboardEyebrow: 'Branch Dashboard',
    defaultRoute: '/home',
    sidebarItems: [
      { icon: Users, label: 'Clientes', to: '/clientes', matchPath: '/clientes' },
      { icon: Briefcase, label: 'Oportunidades', to: '/oportunidades', matchPath: '/oportunidades' },
      { icon: Headphones, label: 'Casos de Servicio', to: '/casos', matchPath: '/casos' },
      { icon: Calendar, label: 'Actividades', to: '/actividades', matchPath: '/actividades' },
    ],
  },
  insurance: {
    id: 'insurance',
    label: 'Seguros',
    brandLabel: 'Cumulus Insurance',
    description: 'Asegurados, pólizas, claims y renovaciones.',
    brandIcon: Shield,
    accentVar: 'chart-coral',
    topBarTitle: 'Cumulus Insurance',
    topBarSubtitle: 'Headless 360',
    dashboardEyebrow: 'Broker Dashboard',
    defaultRoute: '/home',
    sidebarItems: [
      { icon: Users, label: 'Asegurados', to: '/clientes', matchPath: '/clientes' },
      { icon: FileText, label: 'Pólizas', to: '/polizas', matchPath: '/polizas' },
      { icon: AlertOctagon, label: 'Claims', to: '/claims', matchPath: '/claims' },
      { icon: Calendar, label: 'Actividades', to: '/actividades', matchPath: '/actividades' },
    ],
  },
}

export function getVerticalConfig(v: Vertical): VerticalConfig {
  return VERTICAL_CONFIG[v]
}
