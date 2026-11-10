/**
 * Chamadas à Places API (New) pela biblioteca oficial do navegador.
 * Não use direto nos componentes: passe por services/places e services/location.
 */
import type { Coordinates, SearchArea } from '@/types/location.types'
import type { BurgerPlace } from '@/types/place.types'
import { loadPlacesLibrary } from './googleMapsLoader'
import { PLACE_FIELDS, toBurgerPlace } from './placeMapper'

/** Limite da própria API para a busca por proximidade. */
const MAX_RESULTS = 20

const toLatLng = ({ latitude, longitude }: Coordinates) => ({ lat: latitude, lng: longitude })

/** Hamburguerias dentro do círculo, das mais próximas para as mais distantes. */
export async function searchNearbyBurgers(area: SearchArea): Promise<BurgerPlace[]> {
  const { Place } = await loadPlacesLibrary()
  const radiusMeters = area.radiusKm * 1000

  const { places } = await Place.searchNearby({
    fields: PLACE_FIELDS,
    // includedTypes (e não includedPrimaryTypes): inclui restaurantes que TAMBÉM
    // são hamburgueria, não só os que têm isso como tipo principal.
    includedTypes: ['hamburger_restaurant'],
    locationRestriction: { center: toLatLng(area.center), radius: radiusMeters },
    maxResultCount: MAX_RESULTS,
    rankPreference: 'DISTANCE',
    language: 'pt-BR',
    region: 'br',
  })

  return places
    .map((place) => toBurgerPlace(place, area.center))
    .filter((place): place is BurgerPlace => place !== undefined)
    .filter((place) => (place.distanceMeters ?? 0) <= radiusMeters)
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
}

/** Um local pelo ID (Detalhes aberto por link, favoritos de outra região). */
export async function fetchBurgerPlace(
  placeId: string,
  origin: Coordinates,
): Promise<BurgerPlace | undefined> {
  const { Place } = await loadPlacesLibrary()
  const place = new Place({ id: placeId, requestedLanguage: 'pt-BR' })
  await place.fetchFields({ fields: PLACE_FIELDS })
  return toBurgerPlace(place, origin)
}

// --- Busca de regiões (Autocomplete) ---

/**
 * Token de sessão: agrupa as digitações + a escolha final numa "sessão" de
 * cobrança. Reiniciado depois de cada escolha.
 * https://developers.google.com/maps/documentation/places/web-service/place-session-tokens
 */
let sessionToken: google.maps.places.AutocompleteSessionToken | undefined
/** Previsões recentes, para resolver a escolhida dentro da mesma sessão. */
const recentPredictions = new Map<string, google.maps.places.PlacePrediction>()

export interface GoogleRegionSuggestion {
  id: string
  name: string
  context: string
}

export async function autocompleteRegions(input: string): Promise<GoogleRegionSuggestion[]> {
  const { AutocompleteSuggestion, AutocompleteSessionToken } = await loadPlacesLibrary()
  sessionToken ??= new AutocompleteSessionToken()

  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input,
    sessionToken,
    // "(regions)": bairros, cidades, estados — não endereços nem estabelecimentos.
    includedPrimaryTypes: ['(regions)'],
    includedRegionCodes: ['br'],
    language: 'pt-BR',
  })

  return suggestions.flatMap(({ placePrediction: prediction }) => {
    if (!prediction) return []
    recentPredictions.set(prediction.placeId, prediction)
    return [
      {
        id: prediction.placeId,
        name: prediction.mainText?.text ?? prediction.text.text,
        context: prediction.secondaryText?.text ?? '',
      },
    ]
  })
}

/** Coordenadas da região escolhida. Encerra a sessão de Autocomplete. */
export async function resolveRegionCenter(regionId: string): Promise<Coordinates> {
  const { Place } = await loadPlacesLibrary()
  const place = recentPredictions.get(regionId)?.toPlace() ?? new Place({ id: regionId })
  await place.fetchFields({ fields: ['location'] })
  sessionToken = undefined
  recentPredictions.clear()

  const latLng = place.location
  if (!latLng) throw new Error('Região sem localização')
  return { latitude: latLng.lat(), longitude: latLng.lng() }
}
