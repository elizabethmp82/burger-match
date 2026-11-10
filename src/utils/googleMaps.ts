import type { Coordinates } from '@/types/location.types'

/**
 * Link universal de rotas do Google Maps (abre o app no celular, se instalado).
 * https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */
export function directionsUrl(destination: Coordinates, placeId?: string): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination.latitude},${destination.longitude}`,
  })
  if (placeId) {
    params.set('destination_place_id', placeId)
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
