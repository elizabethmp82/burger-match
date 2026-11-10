/**
 * Converte um Place da Places API (New) no nosso modelo BurgerPlace.
 * É o ÚNICO lugar do app que conhece o formato do Google.
 */
import type { Coordinates } from '@/types/location.types'
import type { BurgerPlace, PlacePhoto, PriceLevel } from '@/types/place.types'
import { distanceInMeters } from '@/utils/distance'
import type { OpeningSchedule } from '@/utils/openingHours'

/**
 * Campos pedidos ao Google. CUIDADO: o preço de cada chamada depende do campo
 * "mais caro" da lista (rating, horários, telefone e site são do nível mais alto).
 * Pedimos tudo de uma vez na busca para não precisar de uma segunda chamada
 * ao abrir os Detalhes. https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
 */
export const PLACE_FIELDS = [
  'id',
  'displayName',
  'location',
  'shortFormattedAddress',
  'formattedAddress',
  'businessStatus',
  'rating',
  'userRatingCount',
  'priceLevel',
  'regularOpeningHours',
  'utcOffsetMinutes',
  'photos',
  'nationalPhoneNumber',
  'websiteURI',
  'googleMapsURI',
]

/** Fotos por local: cada foto EXIBIDA é cobrada à parte, então limitamos. */
const MAX_PHOTOS = 10
/** Largura pedida: suficiente para o card e a foto grande, sem desperdiçar dados. */
const PHOTO_MAX_WIDTH = 800

const PRICE_LEVELS: Partial<Record<string, PriceLevel>> = {
  INEXPENSIVE: 1,
  MODERATE: 2,
  EXPENSIVE: 3,
  VERY_EXPENSIVE: 4,
}

function toPhotos(place: google.maps.places.Place): PlacePhoto[] {
  return (place.photos ?? []).slice(0, MAX_PHOTOS).map((photo, index) => {
    const author = photo.authorAttributions[0]
    return {
      id: `${place.id}-foto-${index}`,
      url: photo.getURI({ maxWidth: PHOTO_MAX_WIDTH }),
      authorName: author?.displayName ?? 'Autor no Google Maps',
      ...(author?.uri && { authorUrl: author.uri }),
    }
  })
}

function toSchedule(place: google.maps.places.Place): OpeningSchedule | undefined {
  const hours = place.regularOpeningHours
  const offset = place.utcOffsetMinutes
  if (!hours || offset === null || offset === undefined) return undefined
  return {
    utcOffsetMinutes: offset,
    periods: hours.periods.map(({ open, close }) => ({
      open: { day: open.day, hour: open.hour, minute: open.minute },
      close: close ? { day: close.day, hour: close.hour, minute: close.minute } : null,
    })),
  }
}

/**
 * `undefined` para lugares sem nome/localização ou fechados definitivamente.
 * Os `...(x && {...})` só incluem o campo quando ele existe (exactOptionalPropertyTypes).
 */
export function toBurgerPlace(
  place: google.maps.places.Place,
  origin: Coordinates,
): BurgerPlace | undefined {
  const latLng = place.location
  if (!latLng || !place.displayName || place.businessStatus === 'CLOSED_PERMANENTLY') {
    return undefined
  }

  const location = { latitude: latLng.lat(), longitude: latLng.lng() }
  const schedule = toSchedule(place)
  const priceLevel = place.priceLevel ? PRICE_LEVELS[place.priceLevel] : undefined
  const weekdays = place.regularOpeningHours?.weekdayDescriptions

  return {
    placeId: place.id,
    name: place.displayName,
    address: place.shortFormattedAddress ?? place.formattedAddress ?? '',
    location,
    distanceMeters: distanceInMeters(origin, location),
    photos: toPhotos(place),
    ...(typeof place.rating === 'number' && { rating: place.rating }),
    ...(typeof place.userRatingCount === 'number' && { reviewCount: place.userRatingCount }),
    ...(priceLevel && { priceLevel }),
    ...(schedule && { openingSchedule: schedule }),
    ...(weekdays?.length && { openingHours: weekdays }),
    ...(place.nationalPhoneNumber && { phoneNumber: place.nationalPhoneNumber }),
    ...(place.websiteURI && { websiteUrl: place.websiteURI }),
    ...(place.googleMapsURI && { googleMapsUrl: place.googleMapsURI }),
  }
}
