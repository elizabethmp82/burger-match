/**
 * Carrega a Maps JavaScript API sob demanda (só quando uma tela precisa dela).
 * Biblioteca oficial: https://github.com/googlemaps/js-api-loader
 */
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { googleMapsConfig } from '@/config/env'

let configured = false

function configure() {
  if (configured) return
  setOptions({
    key: googleMapsConfig.apiKey,
    v: 'weekly',
    // Nomes, endereços e horários em português do Brasil.
    language: 'pt-BR',
    region: 'BR',
  })
  configured = true
}

export async function loadPlacesLibrary(): Promise<google.maps.PlacesLibrary> {
  configure()
  return importLibrary('places')
}

export async function loadMapsLibrary(): Promise<google.maps.MapsLibrary> {
  configure()
  return importLibrary('maps')
}

export async function loadMarkerLibrary(): Promise<google.maps.MarkerLibrary> {
  configure()
  return importLibrary('marker')
}
