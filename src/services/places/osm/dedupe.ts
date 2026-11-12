/**
 * Remove duplicações.
 *
 * No OSM, a mesma hamburgueria às vezes aparece duas vezes: como ponto (node) e
 * como o contorno do prédio (way), ou cadastrada por duas pessoas. Consideramos
 * duplicados os locais com o mesmo nome (sem acento/maiúscula) a menos de 75 m.
 * Fica o registro mais completo. Filiais de uma rede ficam longe entre si: não são afetadas.
 */
import type { BurgerPlace } from '@/types/place.types'
import { distanceInMeters } from '@/utils/distance'
import { normalizeText } from '@/utils/text'

export const DUPLICATE_DISTANCE_METERS = 75

/** Quantas informações úteis o registro tem. */
function completeness(place: BurgerPlace): number {
  return [place.address, place.openingSchedule, place.phoneNumber, place.websiteUrl].filter(
    (value) => value !== undefined,
  ).length
}

/** Mesmo ID, ou mesmo nome (sem acento/maiúscula) a menos de 75 m. */
export function isSamePlace(a: BurgerPlace, b: BurgerPlace): boolean {
  if (a.placeId === b.placeId) return true
  return (
    normalizeText(a.name) === normalizeText(b.name) &&
    distanceInMeters(a.location, b.location) < DUPLICATE_DISTANCE_METERS
  )
}

export function dedupePlaces(places: readonly BurgerPlace[]): BurgerPlace[] {
  const byCompleteness = places.toSorted((a, b) => completeness(b) - completeness(a))
  const kept: BurgerPlace[] = []

  for (const place of byCompleteness) {
    if (!kept.some((other) => isSamePlace(other, place))) kept.push(place)
  }
  return kept
}

/**
 * Junta páginas de resultados NA ORDEM em que chegaram (a 2ª página vem depois da 1ª),
 * ignorando locais que já apareceram numa página anterior. Manter a ordem importa:
 * o baralho de Descobrir não pode "embaralhar" cards que a pessoa já está vendo.
 */
export function appendNewPlaces(pages: ReadonlyArray<readonly BurgerPlace[]>): BurgerPlace[] {
  const merged: BurgerPlace[] = []
  for (const page of pages) {
    for (const place of page) {
      if (!merged.some((other) => isSamePlace(other, place))) merged.push(place)
    }
  }
  return merged
}
