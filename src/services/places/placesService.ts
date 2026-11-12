/**
 * Serviço de hamburguerias — o único que os hooks conhecem.
 *
 * Escolhe a fonte pela configuração (Geoapify, Overpass ou simulada) e expõe funções
 * no vocabulário do app (SearchArea, páginas, IDs). Os componentes React não sabem
 * nada de HTTP, Geoapify ou cache.
 */
import { geoapifyConfig, overpassConfig, placesProviderName } from '@/config/env'
import type { SearchArea } from '@/types/location.types'
import type { BurgerPlace } from '@/types/place.types'
import { getOpenStatus } from '@/utils/openingHours'
import { createGeoapifyPlacesProvider } from './geoapify/GeoapifyPlacesProvider'
import { mockPlacesProvider } from './mock/MockPlacesProvider'
import { createOverpassPlacesProvider } from './overpass/OverpassPlacesProvider'
import type { NearbyPage, PageCursor, PlacesProvider } from './PlacesProvider'
import { withSessionCache } from './withSessionCache'

/** Mesmo tempo do cache em memória (lib/queryClient.ts). */
export const PLACES_CACHE_TTL_MS = 30 * 60_000

function createProvider(): PlacesProvider {
  if (placesProviderName === 'mock') return mockPlacesProvider
  const source =
    placesProviderName === 'overpass'
      ? createOverpassPlacesProvider(overpassConfig)
      : createGeoapifyPlacesProvider(geoapifyConfig)
  return withSessionCache(source, { ttlMs: PLACES_CACHE_TTL_MS })
}

const provider = createProvider()

/** Uma página de hamburguerias na região. A posição só sai do aparelho aqui. */
export function getNearbyPage(
  area: SearchArea,
  cursor: PageCursor,
  signal?: AbortSignal,
): Promise<NearbyPage> {
  const { latitude, longitude } = area.center
  return provider.searchNearby(
    { latitude, longitude, radiusMeters: area.radiusKm * 1000, ...cursor },
    signal,
  )
}

export function getPlacesByIds(
  placeIds: readonly string[],
  signal?: AbortSignal,
): Promise<BurgerPlace[]> {
  return provider.getByIds(placeIds, signal)
}

/**
 * Recalcula "aberto agora" para o instante atual (RN11).
 * Os dados ficam em cache por um tempo; o horário, não — por isso é calculado ao exibir.
 * Locais sem grade de horários (ex.: dados simulados) ficam como estão.
 */
export function withCurrentOpenStatus(place: BurgerPlace, now = new Date()): BurgerPlace {
  if (!place.openingSchedule) return place
  const status = getOpenStatus(place.openingSchedule, now)
  // Copia sem o status anterior e aplica o atual (ou nenhum, se não houver horários).
  const updated: BurgerPlace = { ...place }
  delete updated.openNow
  delete updated.nextStatusChange
  if (!status) return updated
  updated.openNow = status.openNow
  if (status.nextStatusChange) updated.nextStatusChange = status.nextStatusChange
  return updated
}
