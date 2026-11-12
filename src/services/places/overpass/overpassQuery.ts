/**
 * Consultas na linguagem Overpass QL.
 * Teste qualquer uma em https://overpass-turbo.eu/ (cole o texto e clique em "Executar").
 *
 * SEGURANÇA: nenhum texto livre entra na consulta — só números validados
 * (coordenadas, raio, IDs). Assim ninguém consegue "injetar" outra consulta.
 */
import type { OsmElementType, OsmRef } from '../osm/osmId'

/** Tempo máximo que o servidor pode gastar (s). O cliente desiste um pouco antes de ele. */
export const SERVER_TIMEOUT_SECONDS = 25
export const MIN_RADIUS_METERS = 100
export const MAX_RADIUS_METERS = 10_000

function assertCoordinate(value: number, limit: number, name: string): void {
  if (!Number.isFinite(value) || Math.abs(value) > limit) {
    throw new RangeError(`${name} inválida: ${value}`)
  }
}

/**
 * Hamburguerias num raio, de duas formas complementares:
 * 1. pela classificação: restaurante/lanchonete com cozinha "burger";
 * 2. pelo nome: no Brasil, muitas hamburguerias estão no OSM sem `cuisine=burger`,
 *    mas têm "burger"/"hamb…" no nome ("Hamburgueria X", "Y Burger").
 * `nwr` = pontos, contornos e relações. `out center` dá um ponto central para contornos.
 */
export function buildNearbyQuery(
  latitude: number,
  longitude: number,
  radiusMeters: number,
): string {
  assertCoordinate(latitude, 90, 'Latitude')
  assertCoordinate(longitude, 180, 'Longitude')
  const radius = Math.round(Math.min(Math.max(radiusMeters, MIN_RADIUS_METERS), MAX_RADIUS_METERS))
  const around = `around:${radius},${latitude.toFixed(5)},${longitude.toFixed(5)}`

  return [
    `[out:json][timeout:${SERVER_TIMEOUT_SECONDS}];`,
    '(',
    `  nwr(${around})["amenity"~"^(fast_food|restaurant)$"]["cuisine"~"burger",i];`,
    `  nwr(${around})["amenity"~"^(fast_food|restaurant|bar|pub)$"]["name"~"burg|hamb",i];`,
    ');',
    'out center tags;',
  ].join('\n')
}

/** Locais pelos IDs, numa única requisição (ex.: todos os favoritos de uma vez). */
export function buildByIdsQuery(refs: readonly OsmRef[]): string {
  const idsByType = new Map<OsmElementType, number[]>()
  for (const { type, id } of refs) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new RangeError(`ID inválido: ${id}`)
    idsByType.set(type, [...(idsByType.get(type) ?? []), id])
  }

  const statements = [...idsByType].map(([type, ids]) => `  ${type}(id:${ids.join(',')});`)
  return [
    `[out:json][timeout:${SERVER_TIMEOUT_SECONDS}];`,
    '(',
    ...statements,
    ');',
    'out center tags;',
  ].join('\n')
}
