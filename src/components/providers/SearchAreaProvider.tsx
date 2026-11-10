import { useMemo, useState, type ReactNode } from 'react'
import { SearchAreaContext, type SearchAreaContextValue } from '@/hooks/useSearchArea'
import { MOCK_SEARCH_AREA } from '@/mocks/places.mock'
import type { SearchArea } from '@/types/location.types'

/** Etapa 2: começa na região simulada. Na Etapa 3 virá da geolocalização ou da busca manual. */
export function SearchAreaProvider({ children }: { children: ReactNode }) {
  const [area, setArea] = useState<SearchArea>(MOCK_SEARCH_AREA)

  const value = useMemo<SearchAreaContextValue>(
    () => ({
      area,
      setRadius: (radiusKm) => setArea((current) => ({ ...current, radiusKm })),
    }),
    [area],
  )

  return <SearchAreaContext value={value}>{children}</SearchAreaContext>
}
