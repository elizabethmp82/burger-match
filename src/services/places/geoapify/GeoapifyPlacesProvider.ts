/**
 * Fonte de hamburguerias: Geoapify Places API (dados do OpenStreetMap).
 * Junta as peças: HTTP (geoapifyClient) → evidência de hambúrguer e normalização
 * (geoapifyMapper) → duplicações (dedupe) → ordem e próxima página.
 *
 * CUSTO (plano gratuito: 3.000 créditos/dia, até 5 requisições/s):
 * - busca: 1 crédito a cada 20 locais devolvidos → página de 40 = até 2 créditos;
 * - Detalhes/Favoritos: 1 crédito por local que ainda não está no cache.
 * Nada é buscado sozinho: a 1ª página vem ao abrir a tela; as seguintes, só com o botão.
 */
import type { BurgerPlace } from '@/types/place.types'
import { distanceInMeters } from '@/utils/distance'
import { dedupePlaces } from '../osm/dedupe'
import { parsePlaceId, toPlaceId, type OsmRef } from '../osm/osmId'
import type {
  NearbyPage,
  NearbyRequest,
  PageCursor,
  PlacesProvider,
  SearchScope,
} from '../PlacesProvider'
import { fetchGeoapify, type GeoapifyProperties } from './geoapifyClient'
import { burgerEvidence, geoapifyToBurgerPlace } from './geoapifyMapper'

/** Locais por página: 40 = até 2 créditos por clique. */
export const PAGE_SIZE = 40
/** A API devolve no máximo 500 locais por busca (offset + limit). */
export const MAX_RESULTS = 500
/** Favoritos/Detalhes buscados por chamada (1 requisição e 1 crédito cada). */
export const MAX_IDS_PER_CALL = 20
export const MIN_RADIUS_METERS = 100
export const MAX_RADIUS_METERS = 20_000

/** Categorias oficiais: https://apidocs.geoapify.com/docs/places/#categories */
export const CATEGORIES: Readonly<Record<SearchScope, string>> = {
  burger: 'catering.fast_food.burger,catering.restaurant.burger',
  extended: 'catering.fast_food,catering.restaurant',
}

export interface GeoapifyProviderOptions {
  apiKey: string
  /** Para testes. Padrão: https://api.geoapify.com */
  baseUrl?: string
  /** Para testes. Padrão: fuso do aparelho. */
  getUtcOffsetMinutes?: () => number
}

const deviceUtcOffset = () => -new Date().getTimezoneOffset()

function assertCoordinate(value: number, limit: number, name: string): void {
  if (!Number.isFinite(value) || Math.abs(value) > limit) {
    throw new RangeError(`${name} inválida: ${value}`)
  }
}

/**
 * Próxima página: mais da mesma busca se esta veio cheia; ao acabar as hamburguerias
 * classificadas, a busca complementar. Ela não roda sozinha — a tela só oferece o botão.
 */
export function nextCursor(
  { scope, offset }: PageCursor,
  receivedCount: number,
): PageCursor | undefined {
  const nextOffset = offset + PAGE_SIZE
  if (receivedCount >= PAGE_SIZE && nextOffset < MAX_RESULTS) return { scope, offset: nextOffset }
  return scope === 'burger' ? { scope: 'extended', offset: 0 } : undefined
}

export function createGeoapifyPlacesProvider({
  apiKey,
  baseUrl,
  getUtcOffsetMinutes = deviceUtcOffset,
}: GeoapifyProviderOptions): PlacesProvider {
  const request = (
    path: '/v2/places' | '/v2/place-details',
    params: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<GeoapifyProperties[]> =>
    fetchGeoapify({ path, params, apiKey, signal, ...(baseUrl && { baseUrl }) })

  return {
    async searchNearby(
      { latitude, longitude, radiusMeters, scope, offset }: NearbyRequest,
      signal?: AbortSignal,
    ): Promise<NearbyPage> {
      assertCoordinate(latitude, 90, 'Latitude')
      assertCoordinate(longitude, 180, 'Longitude')
      if (!Number.isSafeInteger(offset) || offset < 0 || offset >= MAX_RESULTS) {
        throw new RangeError(`offset inválido: ${offset}`)
      }
      const radius = Math.round(
        Math.min(Math.max(radiusMeters, MIN_RADIUS_METERS), MAX_RADIUS_METERS),
      )
      const point = `${longitude.toFixed(5)},${latitude.toFixed(5)}` // a Geoapify usa lon,lat

      const items = await request(
        '/v2/places',
        {
          categories: CATEGORIES[scope],
          filter: `circle:${point},${radius}`,
          bias: `proximity:${point}`, // da mais próxima para a mais distante
          limit: String(PAGE_SIZE),
          offset: String(offset),
          lang: 'pt',
        },
        signal,
      )

      const origin = { latitude, longitude }
      const options = { origin, utcOffsetMinutes: getUtcOffsetMinutes() }
      const places = items.flatMap((item): BurgerPlace[] => {
        // Só entra quem tem evidência de vender hambúrguer (categoria, cozinha ou nome).
        if (burgerEvidence(item).length === 0) return []
        const place = geoapifyToBurgerPlace(item, options)
        return place ? [place] : []
      })

      const next = nextCursor({ scope, offset }, items.length)
      return {
        places: dedupePlaces(places)
          .filter((place) => distanceInMeters(origin, place.location) <= radius)
          .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0)),
        ...(next && { next }),
      }
    },

    async getByIds(placeIds, signal) {
      // IDs inválidos (digitados na URL, ou do modo demo) nem chegam ao servidor.
      const refs = [...new Set(placeIds)]
        .map(parsePlaceId)
        .filter((ref): ref is OsmRef => ref !== undefined)
        .slice(0, MAX_IDS_PER_CALL)

      const options = { utcOffsetMinutes: getUtcOffsetMinutes() }
      const places: BurgerPlace[] = []
      // Um de cada vez: respeita o limite de requisições por segundo do plano gratuito.
      for (const ref of refs) {
        const items = await request(
          '/v2/place-details',
          { osm_id: String(ref.id), osm_type: ref.type.charAt(0), lang: 'pt' },
          signal,
        )
        const details = items.find((item) => item.feature_type === 'details') ?? items[0]
        const place = details && geoapifyToBurgerPlace(details, options, ref)
        // A resposta precisa ser do local pedido (nunca mostrar outro no lugar dele).
        if (place?.placeId === toPlaceId(ref)) places.push(place)
      }
      return places
    },
  }
}
