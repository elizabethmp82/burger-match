import { createContext, useContext } from 'react'
import type { SearchArea, SearchRadiusKm } from '@/types/location.types'

export interface SearchAreaContextValue {
  area: SearchArea
  setRadius: (radiusKm: SearchRadiusKm) => void
}

export const SearchAreaContext = createContext<SearchAreaContextValue | null>(null)

/** Região de busca atual (centro + raio), compartilhada por Descobrir, Mapa e Detalhes. */
export function useSearchArea(): SearchAreaContextValue {
  const context = useContext(SearchAreaContext)
  if (!context) {
    throw new Error('useSearchArea precisa estar dentro de <SearchAreaProvider>')
  }
  return context
}
