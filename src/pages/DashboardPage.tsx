import { Briefcase, CreditCard, Headphones, Calendar, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { StatTile } from '@/components/StatTile'
import { ProfileHeader } from '@/components/ProfileHeader'
import { OpportunitiesPanel } from '@/components/OpportunitiesPanel'
import { FinancialAccountsPanel } from '@/components/FinancialAccountsPanel'
import { InsurancePoliciesPanel } from '@/components/InsurancePoliciesPanel'
import { useVerticalStore } from '@/store/vertical'
import { CasesPanel } from '@/components/CasesPanel'
import { ActivitiesPanel } from '@/components/ActivitiesPanel'
import { ActivitiesTimeline } from '@/components/ActivitiesTimeline'
import { AgentforceChatPanel } from '@/components/AgentforceChatPanel'
import {
  useCases,
  useFinancialAccounts,
  useOpportunities,
  useTasks,
} from '@/hooks/useCustomer'
import { formatCurrency } from '@/lib/utils'

export function DashboardPage() {
  const vertical = useVerticalStore((s) => s.vertical)
  const isInsurance = vertical === 'insurance'
  const { data: opps = [] } = useOpportunities()
  const { data: fas = [] } = useFinancialAccounts()
  const { data: cases = [] } = useCases()
  const { data: tasks = [] } = useTasks()

  const activePipeline = opps
    .filter((o) => !o.StageName.startsWith('Closed'))
    .reduce((sum, o) => sum + (o.Amount ?? 0), 0)
  const activeOppCount = opps.filter((o) => !o.StageName.startsWith('Closed')).length
  const creditCards = fas.filter((f) => f.FinServ__FinancialAccountType__c === 'Credit Card').length
  const checking = fas.filter((f) => f.FinServ__FinancialAccountType__c === 'Checking').length
  const openCases = cases.filter((c) => c.Status !== 'Closed').length
  const highPriorityCases = cases.filter((c) => c.Priority === 'High' && c.Status !== 'Closed').length
  const pendingTasks = tasks.filter((t) => t.Status !== 'Completed').length
  const dueThisWeek = tasks.filter((t) => {
    if (t.Status === 'Completed' || !t.ActivityDate) return false
    const d = new Date(t.ActivityDate)
    const now = new Date()
    const week = new Date(now.getTime() + 7 * 86400000)
    return d >= now && d <= week
  }).length

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main
          className="flex-1 overflow-y-auto scrollbar-thin bg-background"
          style={{ backgroundImage: 'var(--gradient-app)' }}
        >
          <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
            <Link
              to="/home"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-chart-blue"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Volver a Branch Dashboard
            </Link>

            <ProfileHeader />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile
                index={0}
                label="Pipeline activo"
                value={activePipeline ? formatCurrency(activePipeline) : '—'}
                hint={`${activeOppCount} oportunidades abiertas`}
                icon={Briefcase}
                tone="blue"
              />
              <StatTile
                index={1}
                label="Productos"
                value={String(fas.length)}
                hint={`${creditCards} crédito · ${checking} débito`}
                icon={CreditCard}
                tone="orange"
              />
              <StatTile
                index={2}
                label="Casos abiertos"
                value={String(openCases)}
                hint={`${highPriorityCases} alta prioridad`}
                icon={Headphones}
                tone="coral"
              />
              <StatTile
                index={3}
                label="Tasks pendientes"
                value={String(pendingTasks)}
                hint={`${dueThisWeek} vencen esta semana`}
                icon={Calendar}
                tone="violet"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <OpportunitiesPanel />
              {isInsurance ? <InsurancePoliciesPanel /> : <FinancialAccountsPanel />}
            </div>

            <ActivitiesTimeline />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <CasesPanel />
              <ActivitiesPanel />
            </div>
          </div>
        </main>
      </div>

      {/* Custom Agent API chat: Worker MCP → Banker Agentforce. Sin Shadow DOM. */}
      <AgentforceChatPanel />
    </div>
  )
}
