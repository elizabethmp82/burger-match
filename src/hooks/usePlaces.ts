import { useMemo } from 'react'
import { getNearbyPlaces, getPlaceById, getPlacesByIds } from '@/services/places/placesService'
import type { BurgerPlace } from '@/types/place.types'
import { useSearchArea } from './useSearchArea'

/*
 * Hooks de leitura de hamburguerias. Na Etapa 2 os dados são síncronos (mock);
 * na Etapa 4 estes hooks passam a expor também carregamento e erro (RN12).
 */

/** Hamburguerias dentro do raio atual, da mais próxima para a mais distante. */
export function useNearbyPlaces(): BurgerPlace[] {
  const { area } = useSearchArea()
  return useMemo(() => getNearbyPlaces(area), [area])
}

/** Um local pelo ID, com a distância até o centro da região atual. */
export function usePlace(placeId: string | undefined): BurgerPlace | undefined {
  const { area } = useSearchArea()
  return useMemo(
    () => (placeId ? getPlaceById(placeId, area.center) : undefined),
    [placeId, area.center],
  )
}

/** Vários locais pelos IDs (ex.: favoritos), na mesma ordem dos IDs. */
export function usePlacesByIds(placeIds: readonly string[]): BurgerPlace[] {
  const { area } = useSearchArea()
  return useMemo(() => getPlacesByIds(placeIds, area.center), [placeIds, area.center])
}
