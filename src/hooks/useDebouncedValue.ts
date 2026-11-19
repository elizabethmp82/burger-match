import { useEffect, useState } from 'react'

/**
 * Devolve `value` só depois de `delayMs` sem mudanças.
 * Útil quando cada mudança dispararia um pedido à rede: espera a pessoa parar de digitar.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return delayMs === 0 ? value : debounced
}
