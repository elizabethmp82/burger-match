import { useCallback, useSyncExternalStore } from 'react'

/** Mesmo ponto de corte do `lg:` do Tailwind (64rem = 1024px). */
export const DESKTOP_QUERY = '(min-width: 64rem)'

/**
 * Mesmo ponto de corte do `xl:` do Tailwind (80rem = 1280px).
 * Para layouts lista + detalhe, que precisam de mais largura que o desktop pequeno.
 */
export const WIDE_DESKTOP_QUERY = '(min-width: 80rem)'

/**
 * true enquanto a media query for verdadeira; atualiza ao redimensionar.
 *
 * Use só quando o COMPORTAMENTO muda com a largura (ex.: selecionar em vez de navegar).
 * Para mudanças apenas visuais, prefira as classes do Tailwind (md:, lg:).
 *
 * useSyncExternalStore é a forma recomendada pelo React de ler uma fonte externa
 * (aqui, o navegador) sem estados intermediários inconsistentes.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQuery = window.matchMedia(query)
      mediaQuery.addEventListener('change', onChange)
      return () => mediaQuery.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
