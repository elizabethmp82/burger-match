import { createContext, useContext } from 'react'

export interface FavoritesContextValue {
  /** IDs dos locais favoritados, do mais recente para o mais antigo. */
  favoriteIds: readonly string[]
  isFavorite: (placeId: string) => boolean
  addFavorite: (placeId: string) => void
  removeFavorite: (placeId: string) => void
  toggleFavorite: (placeId: string) => void
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites precisa estar dentro de <FavoritesProvider>')
  }
  return context
}
