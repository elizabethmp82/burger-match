import { useMemo, useState, type ReactNode } from 'react'
import { isDemoMode } from '@/config/env'
import { MOCK_INITIAL_FAVORITE_IDS } from '@/mocks/places.mock'
import { FavoritesContext, type FavoritesContextValue } from '../hooks/useFavorites'

/**
 * Favoritos em memória (Etapa 2): somem ao recarregar a página.
 * Na Etapa 6 passam a ser salvos no localStorage (RN09).
 * Guardamos só os IDs, como recomenda docs/scope.md §7.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  // Os favoritos de exemplo só fazem sentido com os dados simulados:
  // seus IDs ("mock-...") não existem no OpenStreetMap.
  const [favoriteIds, setFavoriteIds] = useState<readonly string[]>(
    isDemoMode ? MOCK_INITIAL_FAVORITE_IDS : [],
  )

  const value = useMemo<FavoritesContextValue>(() => {
    const favoriteSet = new Set(favoriteIds)

    // RN08: adicionar um ID que já existe não cria duplicata.
    const addFavorite = (placeId: string) =>
      setFavoriteIds((ids) => (ids.includes(placeId) ? ids : [placeId, ...ids]))

    const removeFavorite = (placeId: string) =>
      setFavoriteIds((ids) => ids.filter((id) => id !== placeId))

    return {
      favoriteIds,
      isFavorite: (placeId) => favoriteSet.has(placeId),
      addFavorite,
      removeFavorite,
      toggleFavorite: (placeId) =>
        favoriteSet.has(placeId) ? removeFavorite(placeId) : addFavorite(placeId),
    }
  }, [favoriteIds])

  return <FavoritesContext value={value}>{children}</FavoritesContext>
}
