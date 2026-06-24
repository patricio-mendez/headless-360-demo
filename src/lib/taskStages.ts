/**
 * Paths para Task Status — el SDO tiene 4 status reales:
 *  Not Started · In Progress · Waiting on someone else · Completed
 */

export interface TaskStep {
  label: string
  apiName: string
}

export type TaskStepStatus = 'completed' | 'current' | 'pending' | 'closed'

export const TASK_PATH: TaskStep[] = [
  { label: 'Not Started', apiName: 'Not Started' },
  { label: 'In Progress', apiName: 'In Progress' },
  { label: 'Waiting on someone else', apiName: 'Waiting on someone else' },
  { label: 'Completed', apiName: 'Completed' },
]

export function getTaskStepStatus(
  step: TaskStep,
  currentStatus: string,
  path: TaskStep[],
): TaskStepStatus {
  const currentLower = currentStatus.toLowerCase()
  const currentIndex = path.findIndex((s) => s.apiName.toLowerCase() === currentLower)
  const stepIndex = path.findIndex((s) => s.apiName === step.apiName)

  if (currentLower === 'completed') {
    return step.apiName === 'Completed' ? 'closed' : 'completed'
  }

  if (currentIndex === -1) {
    // Status desconocido — asumir Not Started
    const fallbackIndex = path.findIndex((s) => s.apiName === 'Not Started')
    if (stepIndex < fallbackIndex) return 'completed'
    if (stepIndex === fallbackIndex) return 'current'
    return 'pending'
  }

  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  return 'pending'
}
