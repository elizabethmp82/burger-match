/**
 * Serviço de hamburguerias.
 *
 * Na Etapa 2 ele lê os dados simulados de `mocks/`. As telas não sabem disso:
 * elas só conhecem as funções abaixo (através dos hooks). Na Etapa 4,
 * trocamos a implementação pela Places API sem mexer nos componentes.
 */
import { MOCK_PLACES } from '@/mocks/places.mock'
import type { Coordinates, SearchArea } from '@/types/location.types'
import type { BurgerPlace } from '@/types/place.types'
import { distanceInMeters } from '@/utils/distance'

function withDistance(place: BurgerPlace, origin: Coordinates): BurgerPlace {
  return { ...place, distanceMeters: distanceInMeters(origin, place.location) }
}

/** Hamburguerias dentro do raio da região, da mais próxima para a mais distante. */
export function getNearbyPlaces(area: SearchArea): BurgerPlace[] {
  const radiusMeters = area.radiusKm * 1000

  return MOCK_PLACES.map((place) => withDistance(place, area.center))
    .filter((place) => (place.distanceMeters ?? Infinity) <= radiusMeters)
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
}

/** Busca um local pelo ID, independentemente do raio (usado em Favoritos e Detalhes). */
export function getPlaceById(placeId: string, origin: Coordinates): BurgerPlace | undefined {
  const place = MOCK_PLACES.find((candidate) => candidate.placeId === placeId)
  return place && withDistance(place, origin)
}

/** Busca vários locais pelos IDs, mantendo a ordem recebida e ignorando IDs desconhecidos. */
export function getPlacesByIds(placeIds: readonly string[], origin: Coordinates): BurgerPlace[] {
  return placeIds
    .map((placeId) => getPlaceById(placeId, origin))
    .filter((place): place is BurgerPlace => place !== undefined)
}
