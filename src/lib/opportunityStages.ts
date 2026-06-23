/**
 * Define paths predefinidos para visualizar el flujo de una opportunity.
 * El SDO tiene 94 stages activos — mostrar todos sería ruidoso.
 * Acá derivamos el path lógico según el stage actual.
 */

export interface StageStep {
  label: string
  apiName: string
}

const MORTGAGE_PATH: StageStep[] = [
  { label: 'Pre-Approval', apiName: 'Pre-Approval' },
  { label: 'Preparation', apiName: 'Preparation' },
  { label: 'Underwriting Review', apiName: 'Underwriting Review' },
  { label: 'Underwriting', apiName: 'Underwriting' },
  { label: 'Rate Negotiation', apiName: 'Rate Negotiation' },
  { label: 'Approval', apiName: 'Approval' },
  { label: 'Closed Won', apiName: 'Closed Won' },
]

const SALES_PATH: StageStep[] = [
  { label: 'Qualification', apiName: 'Qualification' },
  { label: 'Needs Analysis', apiName: 'Needs Analysis' },
  { label: 'Proposal/Quote', apiName: 'Proposal/Quote' },
  { label: 'Negotiation', apiName: 'Negotiation' },
  { label: 'Closed Won', apiName: 'Closed Won' },
]

const INVESTMENT_PATH: StageStep[] = [
  { label: 'Discovery', apiName: 'Discovery' },
  { label: 'Needs Analysis', apiName: 'Needs Analysis' },
  { label: 'Proposal/Quote', apiName: 'Proposal/Quote' },
  { label: 'Documentation', apiName: 'Documentation' },
  { label: 'Closed Won', apiName: 'Closed Won' },
]

const GENERIC_PATH: StageStep[] = [
  { label: 'Prospecting', apiName: 'Prospecting' },
  { label: 'Qualification', apiName: 'Qualification' },
  { label: 'Proposal/Quote', apiName: 'Proposal/Quote' },
  { label: 'Negotiation', apiName: 'Negotiation' },
  { label: 'Closed Won', apiName: 'Closed Won' },
]

/**
 * Elige el path apropiado según el nombre de la oportunidad y el stage actual.
 */
export function getStagePathFor(opportunityName: string, currentStage: string): StageStep[] {
  const name = opportunityName.toLowerCase()
  const stage = currentStage.toLowerCase()

  if (
    name.includes('hipotec') ||
    name.includes('crédito') ||
    name.includes('credito') ||
    stage.includes('underwrit') ||
    stage.includes('pre-approval') ||
    stage.includes('rate negot')
  ) {
    return MORTGAGE_PATH
  }

  if (name.includes('inversión') || name.includes('inversion') || name.includes('portafolio')) {
    return INVESTMENT_PATH
  }

  if (name.includes('tarjeta') || stage === 'proposal/quote' || stage === 'qualification' || stage === 'needs analysis') {
    return SALES_PATH
  }

  return GENERIC_PATH
}

export type StageStatus = 'completed' | 'current' | 'pending' | 'lost'

export function getStepStatus(
  step: StageStep,
  currentStage: string,
  path: StageStep[],
): StageStatus {
  const currentLower = currentStage.toLowerCase()
  if (currentLower === 'closed lost') return step.apiName === 'Closed Won' ? 'lost' : 'completed'

  const currentIndex = path.findIndex((s) => s.apiName.toLowerCase() === currentLower)
  const stepIndex = path.findIndex((s) => s.apiName === step.apiName)

  if (currentIndex === -1) {
    // Stage actual no está en el path — caer al match aproximado
    const stageContains = path.findIndex((s) => currentLower.includes(s.apiName.toLowerCase()) || s.apiName.toLowerCase().includes(currentLower))
    if (stageContains !== -1) {
      if (stepIndex < stageContains) return 'completed'
      if (stepIndex === stageContains) return 'current'
      return 'pending'
    }
    return 'pending'
  }

  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  return 'pending'
}
