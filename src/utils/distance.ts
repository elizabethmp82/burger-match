import type { Coordinates } from '@/types/location.types'

const EARTH_RADIUS_METERS = 6_371_000

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Distância em linha reta entre dois pontos (fórmula de Haversine).
 * Considera a curvatura da Terra; o erro é desprezível nas distâncias do app.
 */
export function distanceInMeters(from: Coordinates, to: Coordinates): number {
  const deltaLat = toRadians(to.latitude - from.latitude)
  const deltaLng = toRadians(to.longitude - from.longitude)

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLng / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a))
}

/**
 * Ponto a `distanceKm` de `origin` na direção `bearingDegrees`
 * (0 = norte, 90 = leste). Aproximação plana, adequada para poucos km.
 */
export function offsetCoordinates(
  origin: Coordinates,
  distanceKm: number,
  bearingDegrees: number,
): Coordinates {
  const bearing = toRadians(bearingDegrees)
  const kmPerDegreeLat = (Math.PI * EARTH_RADIUS_METERS) / 180 / 1000
  const kmPerDegreeLng = kmPerDegreeLat * Math.cos(toRadians(origin.latitude))

  return {
    latitude: origin.latitude + (distanceKm * Math.cos(bearing)) / kmPerDegreeLat,
    longitude: origin.longitude + (distanceKm * Math.sin(bearing)) / kmPerDegreeLng,
  }
}

/**
 * Do mais próximo para o mais distante, pela distância já calculada (`distanceMeters`).
 * Devolve uma lista nova (não altera a original). Sem distância vai para o fim.
 * Empates mantêm a ordem original (o sort do JavaScript é estável).
 */
export function sortByDistance<T extends { distanceMeters?: number | undefined }>(
  items: readonly T[],
): T[] {
  return [...items].sort(
    (a, b) =>
      (a.distanceMeters ?? Number.POSITIVE_INFINITY) -
      (b.distanceMeters ?? Number.POSITIVE_INFINITY),
  )
}
