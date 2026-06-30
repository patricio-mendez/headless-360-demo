import { useQuery } from '@tanstack/react-query'
import { env } from '@/lib/env'
import { useCurrentAccountId } from './useCustomer'

export type PolicyOperationType =
  | 'Premium Payment'
  | 'Claim Settlement'
  | 'Endorsement'
  | 'Renewal'

export type PolicyOperationStatus = 'Processed' | 'Pending' | 'Failed'

export interface PolicyOperation {
  id: string
  operationDate: string
  operationType: PolicyOperationType
  policyNumber: string
  assetName: string
  policyType: 'Auto' | 'Home' | 'Health & Dental' | 'Life'
  amount: number
  currency: string
  status: PolicyOperationStatus
  description: string
  sourceSystem: string
}

interface PolicyOperationsResponse {
  accountId: string
  count: number
  operations: PolicyOperation[]
  source: string
}

/**
 * Operaciones de pólizas del cliente actual, traídas vía Worker BFF
 * (fase 1: mock determinístico — fase 2: Data Cloud real).
 * Equivalente a useCardOperations en el modo banking.
 */
export function useInsuranceOperations(limit = 200) {
  const accountId = useCurrentAccountId()
  return useQuery({
    queryKey: ['insurance-operations', accountId, limit],
    enabled: !!accountId,
    queryFn: async (): Promise<PolicyOperationsResponse> => {
      const url = `${env.mcpProxyBase}/api/policy/operations?accountId=${encodeURIComponent(accountId)}&limit=${limit}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Policy operations ${res.status}`)
      return (await res.json()) as PolicyOperationsResponse
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
