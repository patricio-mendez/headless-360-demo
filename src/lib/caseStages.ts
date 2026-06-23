/**
 * Paths predefinidos para Case Status.
 * El SDO de banking tiene 10 status — combinamos según el tipo de caso para
 * mostrar un path acotado y comprensible.
 */

export interface CaseStep {
  label: string
  apiName: string
}

export type CaseStepStatus = 'completed' | 'current' | 'pending' | 'closed'

const DEFAULT_PATH: CaseStep[] = [
  { label: 'New', apiName: 'New' },
  { label: 'Working', apiName: 'Working' },
  { label: 'Waiting on Customer', apiName: 'Waiting on Customer' },
  { label: 'Research & Investigation', apiName: 'Research & Investigation' },
  { label: 'Closed', apiName: 'Closed' },
]

const DISPUTE_PATH: CaseStep[] = [
  { label: 'New', apiName: 'New' },
  { label: 'Working', apiName: 'Working' },
  { label: 'Research & Investigation', apiName: 'Research & Investigation' },
  { label: 'Merchant Alert', apiName: 'Merchant Alert' },
  { label: 'Provisional Credit', apiName: 'Provisional Credit' },
  { label: 'Closed', apiName: 'Closed' },
]

/**
 * Elige el path apropiado según subject/origin/status del caso.
 */
export function getCasePathFor(c: { Subject?: string | null; Status: string; Origin: string }): CaseStep[] {
  const subject = (c.Subject ?? '').toLowerCase()
  const status = c.Status.toLowerCase()

  if (
    subject.includes('disputa') ||
    subject.includes('dispute') ||
    subject.includes('cargo') ||
    subject.includes('charge') ||
    status === 'merchant alert' ||
    status === 'provisional credit'
  ) {
    return DISPUTE_PATH
  }

  return DEFAULT_PATH
}

export function getCaseStepStatus(
  step: CaseStep,
  currentStatus: string,
  path: CaseStep[],
): CaseStepStatus {
  const currentLower = currentStatus.toLowerCase()
  const currentIndex = path.findIndex((s) => s.apiName.toLowerCase() === currentLower)
  const stepIndex = path.findIndex((s) => s.apiName === step.apiName)

  // Si el caso está cerrado, todos los previos quedan completados
  if (currentLower === 'closed') {
    return step.apiName === 'Closed' ? 'closed' : 'completed'
  }

  if (currentIndex === -1) {
    // Status actual no está en el path (ej. Escalated, Reply Received) — asume Working
    const fallbackIndex = path.findIndex((s) => s.apiName === 'Working')
    if (fallbackIndex !== -1) {
      if (stepIndex < fallbackIndex) return 'completed'
      if (stepIndex === fallbackIndex) return 'current'
      return 'pending'
    }
    return 'pending'
  }

  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  return 'pending'
}
