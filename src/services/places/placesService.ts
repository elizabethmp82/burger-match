/**
 * Serviço de hamburguerias — o único que as telas (via hooks) conhecem.
 *
 * Com chave do Google: Places API (New). Sem chave: modo demonstração.
 * Os componentes não sabem de qual fonte os dados vieram.
 */
import { isGoogleMapsEnabled } from '@/config/env'
import { fetchBurgerPlace, searchNearbyBurgers } from '@/services/google/googlePlacesService'
import type { Coordinates, SearchArea } from '@/types/location.types'
import type { BurgerPlace } from '@/types/place.types'
import { getOpenStatus } from '@/utils/openingHours'
import { fetchMockPlace, searchNearbyMockPlaces } from './mockPlacesService'

export function getNearbyPlaces(area: SearchArea): Promise<BurgerPlace[]> {
  return isGoogleMapsEnabled ? searchNearbyBurgers(area) : searchNearbyMockPlaces(area)
}

/** `undefined` quando o local não existe (link antigo ou inválido). */
export function getPlaceById(
  placeId: string,
  origin: Coordinates,
): Promise<BurgerPlace | undefined> {
  return isGoogleMapsEnabled ? fetchBurgerPlace(placeId, origin) : fetchMockPlace(placeId, origin)
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
