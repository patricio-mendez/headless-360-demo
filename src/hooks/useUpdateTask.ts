import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateRecord } from '@/lib/sfClient'
import { useCurrentAccountId } from './useCustomer'
import type { Task } from '@/types/salesforce'

interface UpdateTaskStatusInput {
  taskId: string
  status: string
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  const accountId = useCurrentAccountId()

  return useMutation({
    mutationFn: async ({ taskId, status }: UpdateTaskStatusInput) => {
      await updateRecord('Task', taskId, { Status: status })
      return { taskId, status }
    },

    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', accountId] })

      const previous = queryClient.getQueryData<Task[]>(['tasks', accountId])

      queryClient.setQueryData<Task[]>(['tasks', accountId], (old) =>
        (old ?? []).map((t) =>
          t.Id === taskId
            ? {
                ...t,
                Status: status,
                IsClosed: status === 'Completed',
                CompletedDateTime:
                  status === 'Completed' ? new Date().toISOString() : t.CompletedDateTime ?? null,
              }
            : t,
        ),
      )

      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tasks', accountId], context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', accountId] })
    },
  })
}
