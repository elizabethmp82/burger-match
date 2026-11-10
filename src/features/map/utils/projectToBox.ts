import type { Coordinates } from '@/types/location.types'

/** Área útil do mapa, em % do contêiner (deixa espaço para o card inferior). */
export interface BoxInsets {
  top: number
  bottom: number
  left: number
  right: number
}

export interface BoxPosition {
  /** % a partir da esquerda. */
  x: number
  /** % a partir do topo. */
  y: number
}

/**
 * Converte coordenadas em posições percentuais dentro de um retângulo.
 * Projeção linear simples, suficiente para o mapa ilustrativo da Etapa 2.
 * Norte fica em cima: latitudes maiores → y menor.
 */
export function createBoxProjection(points: readonly Coordinates[], box: BoxInsets) {
  const latitudes = points.map((point) => point.latitude)
  const longitudes = points.map((point) => point.longitude)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  const minLng = Math.min(...longitudes)
  const maxLng = Math.max(...longitudes)

  // Evita divisão por zero quando há um ponto só (ou todos alinhados).
  const latSpan = maxLat - minLat || 1
  const lngSpan = maxLng - minLng || 1

  return (point: Coordinates): BoxPosition => ({
    x: box.left + ((point.longitude - minLng) / lngSpan) * (box.right - box.left),
    y: box.top + ((maxLat - point.latitude) / latSpan) * (box.bottom - box.top),
  })
}
