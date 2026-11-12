/**
 * Fonte de hamburguerias: OpenStreetMap, consultado pela Overpass API.
 * Junta as peças: consulta (overpassQuery) → HTTP (overpassClient) →
 * normalização (overpassMapper) → duplicações (dedupe) → ordem e limite.
 */
import type { BurgerPlace } from '@/types/place.types'
import type { PlacesProvider } from '../PlacesProvider'
import { dedupePlaces } from '../osm/dedupe'
import { parsePlaceId, type OsmRef } from '../osm/osmId'
import { runOverpassQuery } from './overpassClient'
import { toBurgerPlace } from '../osm/osmPlaceMapper'
import { buildByIdsQuery, buildNearbyQuery } from './overpassQuery'

/** Bairros densos podem ter centenas de resultados; o baralho mostra os mais próximos. */
export const MAX_NEARBY_RESULTS = 60
/** Limite por consulta de IDs (favoritos), para a consulta não ficar enorme. */
export const MAX_IDS_PER_QUERY = 100

export interface OverpassProviderOptions {
  endpoint: string
  /** Para testes. Padrão: fuso do aparelho. */
  getUtcOffsetMinutes?: () => number
}

const deviceUtcOffset = () => -new Date().getTimezoneOffset()

export function createOverpassPlacesProvider({
  endpoint,
  getUtcOffsetMinutes = deviceUtcOffset,
}: OverpassProviderOptions): PlacesProvider {
  return {
    async searchNearby({ latitude, longitude, radiusMeters, scope, offset }, signal) {
      // A consulta do Overpass já traz tudo de uma vez (inclusive a busca pelo nome):
      // não há outras páginas nem busca complementar.
      if (scope !== 'burger' || offset > 0) return { places: [] }

      const query = buildNearbyQuery(latitude, longitude, radiusMeters)
      const elements = await runOverpassQuery(endpoint, query, signal)
      const origin = { latitude, longitude }
      const options = { origin, utcOffsetMinutes: getUtcOffsetMinutes() }

      const places = elements.flatMap((element) => toBurgerPlace(element, options) ?? [])
      return {
        places: dedupePlaces(places)
          .filter((place) => (place.distanceMeters ?? 0) <= radiusMeters)
          .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
          .slice(0, MAX_NEARBY_RESULTS),
      }
    },

    async getByIds(placeIds, signal) {
      // IDs inválidos (digitados na URL, ou do modo demo) nem chegam ao servidor.
      const refs = [...new Set(placeIds)]
        .map(parsePlaceId)
        .filter((ref): ref is OsmRef => ref !== undefined)
        .slice(0, MAX_IDS_PER_QUERY)
      if (refs.length === 0) return []

      const elements = await runOverpassQuery(endpoint, buildByIdsQuery(refs), signal)
      const options = { utcOffsetMinutes: getUtcOffsetMinutes() }
      return elements.flatMap((element): BurgerPlace[] => {
        const place = toBurgerPlace(element, options)
        return place ? [place] : []
      })
    },
  }
}
