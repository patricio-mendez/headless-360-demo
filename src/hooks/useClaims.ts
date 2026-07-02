import { useQuery } from '@tanstack/react-query'
import { soql } from '@/lib/sfClient'
import { useCurrentAccountId } from './useCustomer'
import type { Claim } from '@/types/insurance'

const CLAIM_FIELDS = `
  Id, Name, Status, ClaimType, Severity,
  EstimatedAmount, TotalClaimedAmount, ApprovedAmount,
  LossDate, InitiationDate, FinalizedDate, IsClosed,
  AccountId, Account.Name,
  PolicyNumberId, PolicyNumber.Name, PolicyNumber.PolicyType,
  InsuredAssetId, InsuredAsset.Name, InsuredAsset.AssetName,
  Summary, ClaimReason, IncidentSiteCity, IncidentSiteCountry,
  Owner.Name, CreatedDate, LastModifiedDate
`

/** Lista global de claims (todos los asegurados) — para /claims. */
export function useAllClaims() {
  return useQuery<Claim[]>({
    queryKey: ['claims', 'all'],
    queryFn: async () => {
      const r = await soql<Claim>(
        `SELECT ${CLAIM_FIELDS}
         FROM Claim
         ORDER BY CreatedDate DESC
         LIMIT 500`,
      )
      return r.records
    },
  })
}

/** Claims del cliente actual (vista 360 — vertical Insurance). */
export function useCustomerClaims() {
  const accountId = useCurrentAccountId()
  return useQuery<Claim[]>({
    queryKey: ['customer-claims', accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const r = await soql<Claim>(
        `SELECT ${CLAIM_FIELDS}
         FROM Claim
         WHERE AccountId = '${accountId}'
         ORDER BY CreatedDate DESC
         LIMIT 50`,
      )
      return r.records
    },
  })
}

/** Un solo claim por Id — usado por el drawer. */
export function useClaimById(id: string | null) {
  return useQuery<Claim | null>({
    queryKey: ['claim-by-id', id],
    enabled: !!id,
    queryFn: async () => {
      const r = await soql<Claim>(
        `SELECT ${CLAIM_FIELDS} FROM Claim WHERE Id = '${id}'`,
      )
      return r.records[0] ?? null
    },
  })
}
