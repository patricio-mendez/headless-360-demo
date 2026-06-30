import { useQuery } from '@tanstack/react-query'
import { soql } from '@/lib/sfClient'
import { useCurrentAccountId } from './useCustomer'
import type { InsurancePolicy } from '@/types/insurance'

/** Lista global de pólizas (todos los asegurados) — para /polizas. */
export function useAllPolicies() {
  return useQuery<InsurancePolicy[]>({
    queryKey: ['policies', 'all'],
    queryFn: async () => {
      const r = await soql<InsurancePolicy>(
        `SELECT Id, Name, PolicyType, Status, PremiumAmount,
                EffectiveDate, ExpirationDate, NameInsuredId, NameInsured.Name,
                Owner.Name, CreatedDate, LastModifiedDate
         FROM InsurancePolicy
         ORDER BY EffectiveDate DESC NULLS LAST
         LIMIT 500`,
      )
      return r.records
    },
  })
}

/** Pólizas del cliente actual (vista 360 — vertical Insurance). */
export function useCustomerPolicies() {
  const accountId = useCurrentAccountId()
  return useQuery<InsurancePolicy[]>({
    queryKey: ['customer-policies', accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const r = await soql<InsurancePolicy>(
        `SELECT Id, Name, PolicyType, Status, PremiumAmount,
                EffectiveDate, ExpirationDate, NameInsuredId, NameInsured.Name,
                Owner.Name, CreatedDate, LastModifiedDate
         FROM InsurancePolicy
         WHERE NameInsuredId = '${accountId}'
         ORDER BY Status ASC, EffectiveDate DESC NULLS LAST
         LIMIT 50`,
      )
      return r.records
    },
  })
}

/** Una sola póliza por Id — usado por el drawer. */
export function usePolicyById(id: string | null) {
  return useQuery<InsurancePolicy | null>({
    queryKey: ['policy-by-id', id],
    enabled: !!id,
    queryFn: async () => {
      const r = await soql<InsurancePolicy>(
        `SELECT Id, Name, PolicyType, Status, PremiumAmount,
                EffectiveDate, ExpirationDate, NameInsuredId, NameInsured.Name,
                Owner.Name, CreatedDate, LastModifiedDate
         FROM InsurancePolicy WHERE Id = '${id}'`,
      )
      return r.records[0] ?? null
    },
  })
}
