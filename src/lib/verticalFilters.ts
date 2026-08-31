import type { Vertical } from '@/store/vertical'

/**
 * Filtros SOQL centralizados para separar los datos de banking de los de insurance
 * dentro del mismo org. Un solo lugar de verdad para que la lista, los contadores
 * y las alertas siempre concuerden entre vistas.
 */

/** Opps de insurance: Name LIKE 'Cotización Seguro%'. Banking = todo lo demás. */
const INSURANCE_OPP_PREFIX = 'Cotización Seguro'
export function opportunityVerticalFilter(vertical: Vertical): string {
  if (vertical === 'insurance') return `Name LIKE '${INSURANCE_OPP_PREFIX}%'`
  return `(NOT Name LIKE '${INSURANCE_OPP_PREFIX}%')`
}

/**
 * Casos por vertical: convención de PREFIJO en el Subject, simétrica entre ambos verticales.
 * Al crear casos nuevos con el prefijo correspondiente, pueblan solos la vista del vertical.
 *   - Seguros: "Seguros - ..." o "Insurance - ..."
 *   - Banca:   "Banca - ..."   o "Banking - ..."
 * Todo lo que NO arranca con un prefijo (shells de chat/messaging, junk del SDO base, casos
 * sin subject, etc) queda oculto de AMBOS verticales — son ruido de baja señal.
 */
const INSURANCE_CASE_PREDICATE =
  "(Subject LIKE 'Insurance%' OR Subject LIKE 'Seguros%')"
const BANKING_CASE_PREDICATE =
  "(Subject LIKE 'Banca%' OR Subject LIKE 'Banking%')"

export function caseVerticalFilter(vertical: Vertical): string {
  return vertical === 'insurance' ? INSURANCE_CASE_PREDICATE : BANKING_CASE_PREDICATE
}
