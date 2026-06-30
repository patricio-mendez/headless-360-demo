import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { soql } from '@/lib/sfClient'
import { env } from '@/lib/env'
import { useVerticalStore } from '@/store/vertical'
import type {
  Case,
  Event,
  FinancialAccount,
  Lead,
  Opportunity,
  PersonAccount,
  Task,
} from '@/types/salesforce'

const INSURANCE_OPP_PREFIX = 'Cotización Seguro'

/** Lookup individual de una Opportunity por Id — usado al clickear cards del agente. */
export function useOpportunityById(id: string | null) {
  return useQuery({
    queryKey: ['opportunity-by-id', id],
    enabled: !!id,
    queryFn: async () => {
      const q = `
        SELECT Id, Name, StageName, Amount, CloseDate, Probability, Type, NextStep,
               Description, LeadSource, ExpectedRevenue, ForecastCategoryName,
               Owner.Name, CreatedDate, LastModifiedDate
        FROM Opportunity WHERE Id = '${id}'
      `
      const r = await soql<Opportunity>(q)
      return r.records[0] ?? null
    },
  })
}

/** Lookup individual de un Case por Id — usado al clickear cards del agente. */
export function useCaseById(id: string | null) {
  return useQuery({
    queryKey: ['case-by-id', id],
    enabled: !!id,
    queryFn: async () => {
      const q = `
        SELECT Id, CaseNumber, Subject, Status, Priority, Type, Reason, Origin,
               Description, ContactId, Contact.Name, Owner.Name, IsEscalated,
               CreatedDate, ClosedDate, LastModifiedDate
        FROM Case WHERE Id = '${id}'
      `
      const r = await soql<Case>(q)
      return r.records[0] ?? null
    },
  })
}

/** Lookup individual de un Event por Id — usado al clickear cards del agente / timeline. */
export function useEventById(id: string | null) {
  return useQuery({
    queryKey: ['event-by-id', id],
    enabled: !!id,
    queryFn: async () => {
      const q = `
        SELECT Id, Subject, StartDateTime, EndDateTime, IsAllDayEvent, Location,
               Description, Type, WhatId, What.Name, WhoId, Who.Name, Owner.Name,
               CreatedDate, LastModifiedDate
        FROM Event WHERE Id = '${id}'
      `
      const r = await soql<Event>(q)
      return r.records[0] ?? null
    },
  })
}

/** Lookup individual de una Task por Id — usado al clickear cards del agente. */
export function useTaskById(id: string | null) {
  return useQuery({
    queryKey: ['task-by-id', id],
    enabled: !!id,
    queryFn: async () => {
      const q = `
        SELECT Id, Subject, Status, Priority, Type, ActivityDate, Description,
               WhatId, What.Name, WhoId, Who.Name, Owner.Name, IsClosed,
               CreatedDate, LastModifiedDate, CompletedDateTime
        FROM Task WHERE Id = '${id}'
      `
      const r = await soql<Task>(q)
      return r.records[0] ?? null
    },
  })
}

/**
 * Resuelve el AccountId del cliente que el usuario está viendo.
 * - Si la ruta es /customer/:accountId → usa el de la URL
 * - Si no → fallback al demo (Patricio Mendez)
 */
export function useCurrentAccountId(): string {
  const params = useParams<{ accountId?: string }>()
  return params.accountId ?? env.demoAccountId
}

export function useAccount() {
  const accountId = useCurrentAccountId()
  return useQuery({
    queryKey: ['account', accountId],
    queryFn: async () => {
      const q = `
        SELECT Id, Name, FirstName, LastName, IsPersonAccount, PersonEmail, PersonMobilePhone,
               PersonBirthdate, PersonContactId, BillingCity, BillingCountry, Owner.Name, CreatedDate,
               Cust360_Contact_Picture_URL__pc
        FROM Account WHERE Id = '${accountId}'
      `
      const r = await soql<PersonAccount>(q)
      return r.records[0] ?? null
    },
  })
}

export function useOpportunities() {
  const accountId = useCurrentAccountId()
  const vertical = useVerticalStore((s) => s.vertical)
  return useQuery({
    queryKey: ['opportunities', accountId, vertical],
    queryFn: async () => {
      const filter =
        vertical === 'insurance'
          ? `Name LIKE '${INSURANCE_OPP_PREFIX}%'`
          : `(NOT Name LIKE '${INSURANCE_OPP_PREFIX}%')`
      const q = `
        SELECT Id, Name, StageName, Amount, CloseDate, Probability, Type,
               NextStep, Description, LeadSource, Owner.Name,
               ExpectedRevenue, ForecastCategoryName, CreatedDate, LastModifiedDate
        FROM Opportunity WHERE AccountId = '${accountId}' AND ${filter}
        ORDER BY CloseDate DESC LIMIT 50
      `
      const r = await soql<Opportunity>(q)
      return r.records
    },
  })
}

export function useFinancialAccounts() {
  const accountId = useCurrentAccountId()
  return useQuery({
    queryKey: ['financial-accounts', accountId],
    queryFn: async () => {
      const q = `
        SELECT Id, Name, FinServ__FinancialAccountType__c, FinServ__Status__c,
               FinServ__Balance__c, FinServ__OpenDate__c
        FROM FinServ__FinancialAccount__c
        WHERE FinServ__PrimaryOwner__c = '${accountId}'
        ORDER BY FinServ__OpenDate__c DESC
      `
      const r = await soql<FinancialAccount>(q)
      return r.records
    },
  })
}

export function useCases() {
  const accountId = useCurrentAccountId()
  return useQuery({
    queryKey: ['cases', accountId],
    queryFn: async () => {
      const q = `
        SELECT Id, CaseNumber, Subject, Status, Priority, Type, Reason, Origin,
               Description, ContactId, Contact.Name, Owner.Name, IsEscalated,
               CreatedDate, ClosedDate, LastModifiedDate
        FROM Case WHERE AccountId = '${accountId}'
        ORDER BY CreatedDate DESC LIMIT 30
      `
      const r = await soql<Case>(q)
      return r.records
    },
  })
}

export function useTasks() {
  const accountId = useCurrentAccountId()
  return useQuery({
    queryKey: ['tasks', accountId],
    queryFn: async () => {
      const q = `
        SELECT Id, Subject, ActivityDate, Status, Priority, WhoId, WhatId
        FROM Task WHERE WhatId = '${accountId}' OR AccountId = '${accountId}'
        ORDER BY ActivityDate DESC LIMIT 20
      `
      const r = await soql<Task>(q)
      return r.records
    },
  })
}

export function useLeads() {
  const accountId = useCurrentAccountId()
  return useQuery({
    queryKey: ['leads', accountId],
    queryFn: async () => {
      const account = await soql<{ PersonEmail: string }>(`SELECT PersonEmail FROM Account WHERE Id = '${accountId}'`)
      const email = account.records[0]?.PersonEmail
      if (!email) return [] as Lead[]
      const q = `
        SELECT Id, FirstName, LastName, Company, Status, LeadSource
        FROM Lead WHERE Email = '${email}' OR ConvertedAccountId = '${accountId}'
        LIMIT 20
      `
      const r = await soql<Lead>(q)
      return r.records
    },
  })
}
