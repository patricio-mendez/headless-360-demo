import { useQuery } from '@tanstack/react-query'
import { soql } from '@/lib/sfClient'
import type { InsuranceStats } from '@/types/insurance'

/**
 * Stats globales del broker (cross-cliente) para el header del Insurance Dashboard.
 * 4 KPIs: Asegurados · Pólizas · Claims activos · Renewals próximos 30d.
 *
 * Nota: las queries son cross-org (no filtran por OwnerId) porque el SDO de seguros
 * fue armado en paralelo y no hay un único owner agente. Si después se carga un
 * "broker user", filtrar por OwnerId.
 */
export function useInsuranceStats() {
  return useQuery<InsuranceStats>({
    queryKey: ['insurance-stats'],
    queryFn: async () => {
      const [insureds, inForce, active, highSev, renewals] = await Promise.all([
        soql<{ cnt: number }>(
          `SELECT COUNT(Id) cnt FROM Account WHERE Id IN (SELECT NameInsuredId FROM InsurancePolicy WHERE Status = 'In Force')`,
        ),
        soql<{ Id: string; PremiumAmount: number | null }>(
          `SELECT Id, PremiumAmount FROM InsurancePolicy WHERE Status = 'In Force' LIMIT 1000`,
        ),
        soql<{ cnt: number }>(
          `SELECT COUNT(Id) cnt FROM Claim WHERE IsClosed = false`,
        ),
        soql<{ cnt: number }>(
          `SELECT COUNT(Id) cnt FROM Claim WHERE IsClosed = false AND Severity = 'High'`,
        ),
        soql<{ cnt: number }>(
          `SELECT COUNT(Id) cnt FROM InsurancePolicy WHERE Status = 'In Force' AND ExpirationDate = NEXT_N_DAYS:30`,
        ),
      ])

      // Salesforce aggregate query devuelve cnt (cuando hay alias) o expr0
      // (sin alias). Probamos ambos para robustez.
      const getCount = (records: unknown[]): number => {
        const r = records[0] as { expr0?: number; cnt?: number } | undefined
        return r?.cnt ?? r?.expr0 ?? 0
      }
      const insuredsCount = getCount(insureds.records)
      const policiesInForceCount = inForce.records.length
      const premiumAnnual = inForce.records.reduce(
        (sum, r) => sum + (r.PremiumAmount ?? 0),
        0,
      )
      const activeClaimsCount = getCount(active.records)
      const highSeverityClaimsCount = getCount(highSev.records)
      const renewalsNext30dCount = getCount(renewals.records)

      return {
        insuredsCount,
        policiesInForceCount,
        premiumAnnual,
        activeClaimsCount,
        highSeverityClaimsCount,
        renewalsNext30dCount,
      }
    },
    staleTime: 60 * 1000,
  })
}
