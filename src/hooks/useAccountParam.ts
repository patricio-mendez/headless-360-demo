import { useSearchParams } from 'react-router-dom'

/**
 * Lee/limpia el query param `?account=<accountId>` que usan las list pages
 * cross-cliente cuando se navega desde un "Ver todos" de la vista 360 de un cliente.
 * Cuando está presente, la página filtra sus registros por ese cliente y muestra un
 * chip clearable; al limpiar, vuelve a mostrar todo el libro.
 */
export function useAccountParam() {
  const [searchParams, setSearchParams] = useSearchParams()
  const accountId = searchParams.get('account')

  const clear = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('account')
        return next
      },
      { replace: true },
    )
  }

  return { accountId, clear }
}
