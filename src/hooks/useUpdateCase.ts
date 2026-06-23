import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateRecord } from '@/lib/sfClient'
import { useCurrentAccountId } from './useCustomer'
import type { Case } from '@/types/salesforce'

interface UpdateCaseStatusInput {
  caseId: string
  status: string
}

export function useUpdateCaseStatus() {
  const queryClient = useQueryClient()
  const accountId = useCurrentAccountId()

  return useMutation({
    mutationFn: async ({ caseId, status }: UpdateCaseStatusInput) => {
      await updateRecord('Case', caseId, { Status: status })
      return { caseId, status }
    },

    onMutate: async ({ caseId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['cases', accountId] })

      const previous = queryClient.getQueryData<Case[]>(['cases', accountId])

      queryClient.setQueryData<Case[]>(['cases', accountId], (old) =>
        (old ?? []).map((c) =>
          c.Id === caseId
            ? {
                ...c,
                Status: status,
                ClosedDate: status === 'Closed' ? new Date().toISOString() : c.ClosedDate,
              }
            : c,
        ),
      )

      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['cases', accountId], context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cases', accountId] })
    },
  })
}
