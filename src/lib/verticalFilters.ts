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
 * Casos de insurance: los que arrancan con "Insurance" o "Seguros". Es una convención de
 * prefijo en el Subject — al crear casos nuevos con ese prefijo, pueblan la vista de Seguros.
 */
const INSURANCE_CASE_PREDICATE =
  "(Subject LIKE 'Insurance%' OR Subject LIKE 'Seguros%')"

/**
 * Casos "shell" auto-generados desde sesiones de chat/messaging ("Consulta de siniestro/póliza…").
 * No aportan detalle (son un log de conversación con menos info que una Messaging Session), así
 * que se ocultan de AMBOS verticales — ni en Seguros ni en Banca tiene sentido mostrarlos.
 */
const CHAT_SHELL_PREDICATE = "(Subject LIKE 'Consulta de siniestro/póliza%')"

export function caseVerticalFilter(vertical: Vertical): string {
  if (vertical === 'insurance') return INSURANCE_CASE_PREDICATE
  // Banking = todo lo que no es insurance-prefixed y no es un chat-shell de siniestro/póliza.
  return `(NOT ${INSURANCE_CASE_PREDICATE} AND NOT ${CHAT_SHELL_PREDICATE})`
}
