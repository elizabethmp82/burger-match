import { createContext, useContext } from 'react'
import type {
  Coordinates,
  LocationSource,
  SearchArea,
  SearchRadiusKm,
} from '@/types/location.types'

export interface SearchAreaContextValue {
  area: SearchArea
  /** true depois que o usuário escolheu uma região (GPS ou busca manual). */
  hasChosenLocation: boolean
  /** Define o centro da busca, mantendo o raio atual. */
  setLocation: (
    label: string,
    center: Coordinates,
    source: Exclude<LocationSource, 'default'>,
  ) => void
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
