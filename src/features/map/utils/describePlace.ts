import type { BurgerPlace } from '@/types/place.types'
import { formatDistance, formatRating } from '@/utils/formatters'

/** "★ 4,7 · 2,3 km · Aberto" — resumo curto para balões do mapa. */
export function describePlaceShort(place: BurgerPlace): string {
  return [
    place.rating !== undefined && `★ ${formatRating(place.rating)}`,
    place.distanceMeters !== undefined && formatDistance(place.distanceMeters),
    place.openNow !== undefined && (place.openNow ? 'Aberto' : 'Fechado'),
  ]
    .filter(Boolean)
    .join(' · ')
}
