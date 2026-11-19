import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { isDemoMode } from '@/config/env'
import { MOCK_INITIAL_FAVORITE_IDS } from '@/mocks/places.mock'
import {
  DEMO_FAVORITES_KEY,
  FAVORITES_KEY,
  loadFavoriteIds,
  parseStoredFavorites,
  saveFavoriteIds,
} from '@/services/storage/favoritesStorage'
import { FavoritesContext, type FavoritesContextValue } from '../hooks/useFavorites'

const storageKey = isDemoMode ? DEMO_FAVORITES_KEY : FAVORITES_KEY

/**
 * Lista inicial: o que está salvo no aparelho. Nada salvo ainda → no modo
 * demonstração, alguns favoritos de exemplo (IDs "mock-…", que não existem no OSM).
 */
function initialFavorites(): readonly string[] {
  return loadFavoriteIds(storageKey) ?? (isDemoMode ? MOCK_INITIAL_FAVORITE_IDS : [])
}

/**
 * Favoritos salvos no aparelho (RN09) — só os IDs, como recomenda docs/scope.md §7.
 * Sobrevivem a recarregar a página e a fechar o navegador; somem se a pessoa
 * limpar os dados do site.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<readonly string[]>(initialFavorites)

  // Salva a cada mudança. Se o armazenamento estiver indisponível, segue só na memória.
  useEffect(() => {
    saveFavoriteIds(storageKey, favoriteIds)
  }, [favoriteIds])

  // Outra aba mudou os favoritos: atualiza esta também (o evento só chega às OUTRAS abas).
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== storageKey) return
      setFavoriteIds(parseStoredFavorites(event.newValue) ?? [])
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

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
