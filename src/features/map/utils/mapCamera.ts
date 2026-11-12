/**
 * Cálculos de enquadramento do mapa, sem depender do MapLibre (testáveis no Vitest).
 * Atenção à ordem: o MapLibre usa [longitude, latitude] — o contrário do que falamos.
 */
import type { Coordinates } from '@/types/location.types'

/** [[oeste, sul], [leste, norte]], no formato que o MapLibre entende. */
export type LngLatBounds = [[number, number], [number, number]]

/**
 * Folga mínima em graus (~300 m) quando há um ponto só, ou pontos muito juntos:
 * sem ela, o mapa daria zoom máximo num único marcador.
 */
const MIN_SPAN_DEGREES = 0.003

/** Menor retângulo que contém todos os pontos. `undefined` se a lista estiver vazia. */
export function boundsOf(points: readonly Coordinates[]): LngLatBounds | undefined {
  const valid = points.filter(
    ({ latitude, longitude }) => Number.isFinite(latitude) && Number.isFinite(longitude),
  )
  if (valid.length === 0) return undefined

  const lats = valid.map((point) => point.latitude)
  const lngs = valid.map((point) => point.longitude)
  let [south, north] = [Math.min(...lats), Math.max(...lats)]
  let [west, east] = [Math.min(...lngs), Math.max(...lngs)]

  if (north - south < MIN_SPAN_DEGREES) {
    const middle = (north + south) / 2
    south = middle - MIN_SPAN_DEGREES / 2
    north = middle + MIN_SPAN_DEGREES / 2
  }
  if (east - west < MIN_SPAN_DEGREES) {
    const middle = (east + west) / 2
    west = middle - MIN_SPAN_DEGREES / 2
    east = middle + MIN_SPAN_DEGREES / 2
  }
  return [
    [west, south],
    [east, north],
  ]
}

/**
 * Identifica a região (centro + raio). O mapa só se reenquadra sozinho quando ela
 * muda — carregar mais lugares ou filtrar não faz a câmera "pular".
 */
export function areaKey(center: Coordinates, radiusKm: number): string {
  return `${center.latitude.toFixed(5)},${center.longitude.toFixed(5)},${radiusKm}`
}

/** Pessoas sensíveis a movimento (configuração do sistema): câmera sem animação. */
export function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}
