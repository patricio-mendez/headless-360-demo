import { UserRound, X } from 'lucide-react'

/**
 * Chip que indica que una list page cross-cliente está acotada a un cliente
 * (vía ?account=<id>). Click en la ✕ limpia el filtro y expande a todo el libro.
 */
export function AccountFilterChip({
  name,
  onClear,
}: {
  name: string | null
  onClear: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      title="Quitar filtro de cliente · ver todo el libro"
      className="inline-flex items-center gap-1.5 rounded-full border border-chart-blue/40 bg-chart-blue/15 px-3 py-1.5 text-xs font-medium text-chart-blue transition-colors hover:bg-chart-blue/25"
    >
      <UserRound className="h-3 w-3" />
      Cliente: {name ?? 'este cliente'}
      <X className="h-3.5 w-3.5 opacity-70" />
    </button>
  )
}
