/**
 * Fonte de hamburguerias SIMULADAS (modo demonstração: VITE_PLACES_PROVIDER=mock).
 * Não acessa a rede. Útil para desenvolver sem depender de serviços externos.
 */
import { MOCK_PLACE_SEEDS, type MockPlaceSeed } from '@/mocks/places.mock'
import type { Coordinates } from '@/types/location.types'
import type { BurgerPlace } from '@/types/place.types'
import { distanceInMeters, offsetCoordinates } from '@/utils/distance'
import type { PlacesProvider } from '../PlacesProvider'

/** Os locais simulados são posicionados em volta deste ponto ao buscar por ID. */
const MOCK_ANCHOR: Coordinates = { latitude: -23.5667, longitude: -46.6929 }

/** Posiciona o local simulado em volta do centro. */
function placeAround({ offset, ...seed }: MockPlaceSeed, center: Coordinates): BurgerPlace {
  return { ...seed, location: offsetCoordinates(center, offset.km, offset.bearing) }
}

/** Simula a espera da rede, para os estados de carregamento aparecerem no modo demo. */
const NETWORK_DELAY_MS = 350
const delay = () => new Promise((resolve) => setTimeout(resolve, NETWORK_DELAY_MS))

/**
 * Lembra o último centro buscado: assim um local aberto pelo Descobrir fica no mesmo
 * lugar nos Detalhes e nos Favoritos (no modo demo, os locais "seguem" a região).
 */
let lastCenter: Coordinates = MOCK_ANCHOR

export const mockPlacesProvider: PlacesProvider = {
  async searchNearby({ latitude, longitude, radiusMeters, scope, offset }) {
    // Os dados simulados cabem numa página só.
    if (scope !== 'burger' || offset > 0) return { places: [] }
    await delay()
    const center = { latitude, longitude }
    lastCenter = center

    const places = MOCK_PLACE_SEEDS.map((seed) => {
      const place = placeAround(seed, center)
      return { ...place, distanceMeters: distanceInMeters(center, place.location) }
    })
      .filter((place) => place.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
    return { places }
  },

  async getByIds(placeIds) {
    await delay()
    const wanted = new Set(placeIds)
    return MOCK_PLACE_SEEDS.filter((seed) => wanted.has(seed.placeId)).map((seed) =>
      placeAround(seed, lastCenter),
    )
  },
}
