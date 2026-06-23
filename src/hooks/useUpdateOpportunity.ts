import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateRecord } from '@/lib/sfClient'
import { useCurrentAccountId } from './useCustomer'
import type { Opportunity } from '@/types/salesforce'

interface UpdateOpportunityStageInput {
  opportunityId: string
  stageName: string
  /** Probability nueva — opcional, si no se manda Salesforce usa el default del stage */
  probability?: number
}

export function useUpdateOpportunityStage() {
  const queryClient = useQueryClient()
  const accountId = useCurrentAccountId()

  return useMutation({
    mutationFn: async ({ opportunityId, stageName, probability }: UpdateOpportunityStageInput) => {
      const fields: Record<string, unknown> = { StageName: stageName }
      if (probability !== undefined) fields.Probability = probability
      await updateRecord('Opportunity', opportunityId, fields)
      return { opportunityId, stageName, probability }
    },

    // Optimistic update — actualiza la cache inmediatamente
    onMutate: async ({ opportunityId, stageName, probability }) => {
      await queryClient.cancelQueries({ queryKey: ['opportunities', accountId] })

      const previous = queryClient.getQueryData<Opportunity[]>(['opportunities', accountId])

      queryClient.setQueryData<Opportunity[]>(['opportunities', accountId], (old) =>
        (old ?? []).map((opp) =>
          opp.Id === opportunityId
            ? {
                ...opp,
                StageName: stageName,
                ...(probability !== undefined ? { Probability: probability } : {}),
              }
            : opp,
        ),
      )

      return { previous }
    },

    // Si falla, revertir al estado anterior
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['opportunities', accountId], context.previous)
      }
    },

    // Siempre refetch para sincronizar con la verdad del server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities', accountId] })
    },
  })
}
