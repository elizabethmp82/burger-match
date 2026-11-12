import type { Coordinates } from '@/types/location.types'

/**
 * Link de rotas do Google Maps — só um LINK, sem API, sem chave e sem custo.
 * Abre o app do Google Maps no celular (se instalado) ou o site no computador.
 * https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */
export function directionsUrl(destination: Coordinates): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination.latitude},${destination.longitude}`,
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
