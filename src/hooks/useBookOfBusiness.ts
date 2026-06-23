import { useQuery } from '@tanstack/react-query'
import { soql } from '@/lib/sfClient'
import type { Opportunity } from '@/types/salesforce'

export interface CustomerListItem {
  Id: string
  Name: string
  PersonEmail: string | null
  PersonMobilePhone: string | null
  BillingCity: string | null
  BillingCountry: string | null
  CreatedDate: string
  Cust360_Contact_Picture_URL__pc: string | null
}

export interface BookStats {
  totalCustomers: number
  totalPipelineAmount: number
  activeOpportunityCount: number
  totalCases: number
  openCases: number
  highPriorityCases: number
  closedWonAmount: number
  closedWonCount: number
  totalTasks: number
  pendingTasks: number
}

/**
 * Lista de clientes del banker logueado.
 * Por simplicidad usamos el OwnerId conocido del demo (Patricio Mendez user).
 */
const BANKER_USER_ID = '005g7000003dGpZAAU'

export interface AlertItem {
  id: string
  type: 'case_high' | 'task_overdue' | 'task_due_today'
  title: string
  subtitle: string
  accountId: string
  accountName: string
  recordId: string
  recordType: 'Case' | 'Task'
  date?: string
}

/**
 * Alertas accionables para el TopBar.
 *  - Casos abiertos High priority del book.
 *  - Tasks vencidas (ActivityDate < hoy, Status != Completed).
 *  - Tasks que vencen hoy.
 *
 * Limita a top N por tipo para evitar listas explosivas.
 */
export function useBookAlerts(limit = 8) {
  return useQuery({
    queryKey: ['banker-alerts', BANKER_USER_ID, limit],
    staleTime: 60_000,
    queryFn: async (): Promise<AlertItem[]> => {
      const todayIso = new Date().toISOString().slice(0, 10)
      const [casesRes, tasksRes] = await Promise.all([
        soql<{
          Id: string
          CaseNumber: string
          Subject: string | null
          Priority: string
          CreatedDate: string
          AccountId: string
          Account?: { Name: string } | null
        }>(
          `SELECT Id, CaseNumber, Subject, Priority, CreatedDate, AccountId, Account.Name
           FROM Case
           WHERE Account.OwnerId = '${BANKER_USER_ID}' AND IsClosed = false AND Priority = 'High'
           ORDER BY CreatedDate DESC LIMIT ${limit}`,
        ),
        soql<{
          Id: string
          Subject: string
          ActivityDate: string | null
          Priority: string
          AccountId: string | null
          Account?: { Name: string } | null
        }>(
          `SELECT Id, Subject, ActivityDate, Priority, AccountId, Account.Name
           FROM Task
           WHERE Owner.Id = '${BANKER_USER_ID}' AND Status != 'Completed'
             AND ActivityDate != null AND ActivityDate <= ${todayIso}
           ORDER BY ActivityDate ASC LIMIT ${limit}`,
        ),
      ])

      const alerts: AlertItem[] = []

      casesRes.records.forEach((c) => {
        alerts.push({
          id: `case-${c.Id}`,
          type: 'case_high',
          title: `Caso ${c.CaseNumber}: ${c.Subject ?? 'Sin asunto'}`,
          subtitle: c.Account?.Name ?? '',
          accountId: c.AccountId,
          accountName: c.Account?.Name ?? '',
          recordId: c.Id,
          recordType: 'Case',
          date: c.CreatedDate,
        })
      })

      tasksRes.records.forEach((t) => {
        const isOverdue = t.ActivityDate ? t.ActivityDate < todayIso : false
        alerts.push({
          id: `task-${t.Id}`,
          type: isOverdue ? 'task_overdue' : 'task_due_today',
          title: t.Subject,
          subtitle: t.Account?.Name ?? '',
          accountId: t.AccountId ?? '',
          accountName: t.Account?.Name ?? '',
          recordId: t.Id,
          recordType: 'Task',
          date: t.ActivityDate ?? undefined,
        })
      })

      return alerts
    },
  })
}

export function useBankerCustomers(limit = 200) {
  return useQuery({
    queryKey: ['banker-customers', BANKER_USER_ID, limit],
    queryFn: async () => {
      const q = `
        SELECT Id, Name, PersonEmail, PersonMobilePhone, BillingCity, BillingCountry, CreatedDate,
               Cust360_Contact_Picture_URL__pc
        FROM Account
        WHERE IsPersonAccount = true AND OwnerId = '${BANKER_USER_ID}'
        ORDER BY CreatedDate DESC
        LIMIT ${limit}
      `
      const r = await soql<CustomerListItem>(q)
      return r.records
    },
  })
}

export function useBookStats() {
  return useQuery({
    queryKey: ['banker-stats', BANKER_USER_ID],
    queryFn: async (): Promise<BookStats> => {
      // Salesforce no soporta múltiples COUNT/SUM en un solo query con WHERE
      // usando aggregates por SObject distinto. Hacemos 4 queries en paralelo.
      const [accountsRes, oppsRes, casesRes, tasksRes] = await Promise.all([
        soql<{ total: number }>(
          `SELECT COUNT(Id) total FROM Account WHERE IsPersonAccount = true AND OwnerId = '${BANKER_USER_ID}'`,
        ),
        soql<{ Id: string; Amount: number | null; StageName: string }>(
          `SELECT Id, Amount, StageName FROM Opportunity WHERE OwnerId = '${BANKER_USER_ID}' LIMIT 500`,
        ),
        soql<{ Id: string; Status: string; Priority: string }>(
          `SELECT Id, Status, Priority FROM Case WHERE OwnerId = '${BANKER_USER_ID}' LIMIT 500`,
        ),
        soql<{ Id: string; Status: string }>(
          `SELECT Id, Status FROM Task WHERE OwnerId = '${BANKER_USER_ID}' LIMIT 500`,
        ),
      ])

      const opps = oppsRes.records
      const activeOpps = opps.filter((o) => !o.StageName.startsWith('Closed'))
      const closedWon = opps.filter((o) => o.StageName === 'Closed Won')

      const cases = casesRes.records
      const openCases = cases.filter((c) => c.Status !== 'Closed')
      const highPrio = openCases.filter((c) => c.Priority === 'High')

      const tasks = tasksRes.records
      const pending = tasks.filter((t) => t.Status !== 'Completed')

      return {
        totalCustomers: accountsRes.records[0]?.total ?? 0,
        totalPipelineAmount: activeOpps.reduce((sum, o) => sum + (o.Amount ?? 0), 0),
        activeOpportunityCount: activeOpps.length,
        totalCases: cases.length,
        openCases: openCases.length,
        highPriorityCases: highPrio.length,
        closedWonAmount: closedWon.reduce((sum, o) => sum + (o.Amount ?? 0), 0),
        closedWonCount: closedWon.length,
        totalTasks: tasks.length,
        pendingTasks: pending.length,
      }
    },
  })
}

export interface CustomerEnrichment {
  accountId: string
  pipelineAmount: number
  activeOppCount: number
  openCaseCount: number
  hasHighPriorityCase: boolean
}

/**
 * Para los top N clientes, traer cuántas opps activas y casos abiertos tienen.
 * Hacemos 2 queries grandes y agrupamos por AccountId.
 */
export function useCustomersEnrichment(accountIds: string[]) {
  return useQuery({
    queryKey: ['banker-customers-enrich', accountIds.join(',')],
    enabled: accountIds.length > 0,
    queryFn: async () => {
      if (accountIds.length === 0) return new Map<string, CustomerEnrichment>()
      const ids = accountIds.map((id) => `'${id}'`).join(',')
      const [oppsRes, casesRes] = await Promise.all([
        soql<{ AccountId: string; Amount: number | null; StageName: string }>(
          `SELECT AccountId, Amount, StageName FROM Opportunity WHERE AccountId IN (${ids}) LIMIT 1000`,
        ),
        soql<{ AccountId: string; Status: string; Priority: string }>(
          `SELECT AccountId, Status, Priority FROM Case WHERE AccountId IN (${ids}) LIMIT 1000`,
        ),
      ])

      const map = new Map<string, CustomerEnrichment>()
      for (const id of accountIds) {
        map.set(id, {
          accountId: id,
          pipelineAmount: 0,
          activeOppCount: 0,
          openCaseCount: 0,
          hasHighPriorityCase: false,
        })
      }
      for (const o of oppsRes.records) {
        if (o.StageName.startsWith('Closed')) continue
        const e = map.get(o.AccountId)
        if (!e) continue
        e.pipelineAmount += o.Amount ?? 0
        e.activeOppCount += 1
      }
      for (const c of casesRes.records) {
        if (c.Status === 'Closed') continue
        const e = map.get(c.AccountId)
        if (!e) continue
        e.openCaseCount += 1
        if (c.Priority === 'High') e.hasHighPriorityCase = true
      }
      return map
    },
  })
}

/**
 * Todas las oportunidades del banker. Lo usamos para los charts del Sales Cockpit.
 */
export function useBookOpportunities() {
  return useQuery({
    queryKey: ['banker-opportunities', BANKER_USER_ID],
    queryFn: async () => {
      const q = `
        SELECT Id, Name, StageName, Amount, CloseDate, Probability, ForecastCategoryName,
               ExpectedRevenue, AccountId, Account.Name
        FROM Opportunity WHERE OwnerId = '${BANKER_USER_ID}'
        ORDER BY CloseDate ASC LIMIT 500
      `
      const r = await soql<Opportunity & { AccountId: string; Account?: { Name: string } }>(q)
      return r.records
    },
  })
}

/** Tareas + Eventos cross-cliente del banker, para la página /actividades. */
export interface BookTask {
  Id: string
  Subject: string
  ActivityDate: string | null
  Status: string
  Priority: string
  AccountId: string | null
  Account?: { Name: string } | null
  Description?: string | null
  CreatedDate: string
}

export interface BookEvent {
  Id: string
  Subject: string
  StartDateTime: string
  EndDateTime: string
  IsAllDayEvent: boolean
  Location?: string | null
  AccountId: string | null
  Account?: { Name: string } | null
  Description?: string | null
}

export function useBookActivities() {
  return useQuery({
    queryKey: ['banker-activities', BANKER_USER_ID],
    queryFn: async () => {
      const [tasksRes, eventsRes] = await Promise.all([
        soql<BookTask>(
          `SELECT Id, Subject, ActivityDate, Status, Priority, AccountId, Account.Name,
                  Description, CreatedDate
           FROM Task
           WHERE OwnerId = '${BANKER_USER_ID}'
           ORDER BY ActivityDate DESC NULLS LAST LIMIT 500`,
        ),
        soql<BookEvent>(
          `SELECT Id, Subject, StartDateTime, EndDateTime, IsAllDayEvent, Location,
                  AccountId, Account.Name, Description
           FROM Event
           WHERE OwnerId = '${BANKER_USER_ID}'
           ORDER BY StartDateTime DESC LIMIT 500`,
        ),
      ])
      return { tasks: tasksRes.records, events: eventsRes.records }
    },
  })
}

/** Casos abiertos cross-cliente del libro del banker. */
export interface BookCase {
  Id: string
  CaseNumber: string
  Subject: string | null
  Status: string
  Priority: string
  IsClosed: boolean
  CreatedDate: string
  AccountId: string
  Account?: { Name: string } | null
}

export function useBookCases() {
  return useQuery({
    queryKey: ['banker-cases', BANKER_USER_ID],
    queryFn: async () => {
      const q = `
        SELECT Id, CaseNumber, Subject, Status, Priority, IsClosed, CreatedDate,
               AccountId, Account.Name
        FROM Case
        WHERE Account.OwnerId = '${BANKER_USER_ID}'
        ORDER BY CreatedDate DESC LIMIT 500
      `
      const r = await soql<BookCase>(q)
      return r.records
    },
  })
}
