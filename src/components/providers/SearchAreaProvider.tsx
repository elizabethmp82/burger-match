import { useMemo, useState, type ReactNode } from 'react'
import { SearchAreaContext, type SearchAreaContextValue } from '@/hooks/useSearchArea'
import { MOCK_SEARCH_AREA } from '@/mocks/places.mock'
import type { SearchArea } from '@/types/location.types'

/**
 * Região de busca em memória. Começa com um exemplo (source: 'default') até o
 * usuário escolher a dele na tela "Onde você está?".
 *
 * Privacidade: a localização NÃO é salva (some ao recarregar a página), como
 * prometido na própria tela de permissão.
 */
export function SearchAreaProvider({ children }: { children: ReactNode }) {
  const [area, setArea] = useState<SearchArea>(MOCK_SEARCH_AREA)

  const value = useMemo<SearchAreaContextValue>(
    () => ({
      area,
      hasChosenLocation: area.source !== 'default',
      setLocation: (label, center, source) =>
        setArea((current) => ({ ...current, label, center, source })),
      setRadius: (radiusKm) => setArea((current) => ({ ...current, radiusKm })),
    }),
    [area],
  )

  return <SearchAreaContext value={value}>{children}</SearchAreaContext>
}
