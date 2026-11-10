import { useFavorites } from '@/features/favorites/hooks/useFavorites'
import type { BurgerPlace } from '@/types/place.types'
import { useDiscoverySession, type SwipeHistoryEntry } from './useDiscoverySession'

/**
 * Regras do baralho de Descobrir.
 *
 * O baralho não guarda um "índice": os cards restantes são os locais próximos
 * menos os que já foram decididos. Como a lista vem ordenada por distância,
 * ampliar o raio só acrescenta locais novos ao final, e desfazer devolve o
 * último card ao topo.
 */
export function useDiscoveryDeck(places: readonly BurgerPlace[]) {
  const { history, setHistory } = useDiscoverySession()
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()

  const decidedIds = new Set(history.map((entry) => entry.placeId))
  const remaining = places.filter((place) => !decidedIds.has(place.placeId))
  const current = remaining[0]
  const lastEntry = history.at(-1)

  function decide(decision: SwipeHistoryEntry['decision']) {
    if (!current) return

    const addedFavorite = decision === 'like' && !isFavorite(current.placeId)
    if (addedFavorite) {
      addFavorite(current.placeId) // RN05
    }
    setHistory((entries) => [...entries, { placeId: current.placeId, decision, addedFavorite }])
  }

  /** RN07: reverte a última decisão, inclusive o favorito que ela criou. */
  function undo() {
    if (!lastEntry) return

    if (lastEntry.addedFavorite) {
      removeFavorite(lastEntry.placeId)
    }
    setHistory((entries) => entries.slice(0, -1))
  }

  return {
    current,
    remaining,
    lastEntry,
    canUndo: lastEntry !== undefined,
    like: () => decide('like'),
    skip: () => decide('skip'), // RN06
    undo,
    /** Volta a mostrar todos os cards da sessão. Os favoritos continuam salvos. */
    restart: () => setHistory([]),
  }
}
