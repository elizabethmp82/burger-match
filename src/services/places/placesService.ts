/**
 * Serviço de hamburguerias.
 *
 * Até a Etapa 4 ele lê os dados simulados de `mocks/`. As telas não sabem disso:
 * elas só conhecem as funções abaixo (através dos hooks). Na Etapa 4,
 * trocamos a implementação pela Places API sem mexer nos componentes.
 */
import { MOCK_PLACE_SEEDS, type MockPlaceSeed } from '@/mocks/places.mock'
import type { Coordinates, SearchArea } from '@/types/location.types'
import type { BurgerPlace } from '@/types/place.types'
import { distanceInMeters, offsetCoordinates } from '@/utils/distance'

/** Posiciona o local simulado em volta do centro e calcula a distância até ele. */
function placeAround({ offset, ...seed }: MockPlaceSeed, center: Coordinates): BurgerPlace {
  const location = offsetCoordinates(center, offset.km, offset.bearing)
  return { ...seed, location, distanceMeters: distanceInMeters(center, location) }
}

/** Hamburguerias dentro do raio da região, da mais próxima para a mais distante. */
export function getNearbyPlaces(area: SearchArea): BurgerPlace[] {
  const radiusMeters = area.radiusKm * 1000

  return MOCK_PLACE_SEEDS.map((seed) => placeAround(seed, area.center))
    .filter((place) => (place.distanceMeters ?? Infinity) <= radiusMeters)
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
}

/** Busca um local pelo ID, independentemente do raio (usado em Favoritos e Detalhes). */
export function getPlaceById(placeId: string, origin: Coordinates): BurgerPlace | undefined {
  const seed = MOCK_PLACE_SEEDS.find((candidate) => candidate.placeId === placeId)
  return seed && placeAround(seed, origin)
}

/** Busca vários locais pelos IDs, mantendo a ordem recebida e ignorando IDs desconhecidos. */
export function getPlacesByIds(placeIds: readonly string[], origin: Coordinates): BurgerPlace[] {
  return placeIds
    .map((placeId) => getPlaceById(placeId, origin))
    .filter((place): place is BurgerPlace => place !== undefined)
}
