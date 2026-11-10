import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'

export type SwipeDecision = 'like' | 'skip'

/** Uma decisão tomada no baralho. Guardamos o suficiente para desfazê-la (RN07). */
export interface SwipeHistoryEntry {
  placeId: string
  decision: SwipeDecision
  /** true se o "curtir" realmente adicionou aos favoritos (o local ainda não era favorito). */
  addedFavorite: boolean
}

export interface DiscoverySessionContextValue {
  history: readonly SwipeHistoryEntry[]
  setHistory: Dispatch<SetStateAction<readonly SwipeHistoryEntry[]>>
}

export const DiscoverySessionContext = createContext<DiscoverySessionContextValue | null>(null)

export function useDiscoverySession(): DiscoverySessionContextValue {
  const context = useContext(DiscoverySessionContext)
  if (!context) {
    throw new Error('useDiscoverySession precisa estar dentro de <DiscoverySessionProvider>')
  }
  return context
}
