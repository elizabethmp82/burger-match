/**
 * Hamburguerias SIMULADAS (modo demonstração, sem chave do Google).
 * Mesma "forma" do serviço do Google: placesService escolhe um dos dois.
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

/** Simula a espera da rede, para os estados de carregamento aparecerem no modo demo. */
const NETWORK_DELAY_MS = 350
const delay = () => new Promise((resolve) => setTimeout(resolve, NETWORK_DELAY_MS))

/** Hamburguerias dentro do raio da região, da mais próxima para a mais distante. */
export async function searchNearbyMockPlaces(area: SearchArea): Promise<BurgerPlace[]> {
  await delay()
  const radiusMeters = area.radiusKm * 1000

  return MOCK_PLACE_SEEDS.map((seed) => placeAround(seed, area.center))
    .filter((place) => (place.distanceMeters ?? Infinity) <= radiusMeters)
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
}

/** Um local pelo ID, independentemente do raio (Favoritos e Detalhes). */
export async function fetchMockPlace(
  placeId: string,
  origin: Coordinates,
): Promise<BurgerPlace | undefined> {
  await delay()
  const seed = MOCK_PLACE_SEEDS.find((candidate) => candidate.placeId === placeId)
  return seed && placeAround(seed, origin)
}
