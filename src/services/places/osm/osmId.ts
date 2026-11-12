/**
 * IDs do OpenStreetMap ⇄ IDs do app.
 *
 * No OSM, um local é um ponto (node), um contorno (way, ex.: um prédio) ou uma
 * relação (relation). O ID só é único junto com o tipo: "node/123" ≠ "way/123".
 * No app usamos "node-123", que pode ir na URL (/place/node-123) sem escape.
 *
 * SEGURANÇA: o ID vem da URL — qualquer pessoa pode digitar qualquer coisa.
 * Só aceitamos o formato exato, para que nada além de dígitos chegue à consulta.
 */

export type OsmElementType = 'node' | 'way' | 'relation'

export interface OsmRef {
  type: OsmElementType
  id: number
}

/**
 * Um local do OSM com suas tags, venha de onde vier (Overpass ou Geoapify).
 * Pontos (node) têm lat/lon; contornos e relações podem trazer `center`.
 */
export interface OsmElement extends OsmRef {
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Readonly<Record<string, string>>
}

const PLACE_ID_PATTERN = /^(node|way|relation)-([1-9]\d{0,15})$/

export function toPlaceId({ type, id }: OsmRef): string {
  return `${type}-${id}`
}

/** `undefined` se o texto não for um ID do OSM válido (ex.: "mock-…" ou algo digitado). */
export function parsePlaceId(placeId: string): OsmRef | undefined {
  const match = PLACE_ID_PATTERN.exec(placeId)
  if (!match?.[1] || !match[2]) return undefined
  const id = Number(match[2])
  if (!Number.isSafeInteger(id)) return undefined
  return { type: match[1] as OsmElementType, id }
}

export function osmUrl({ type, id }: OsmRef): string {
  return `https://www.openstreetmap.org/${type}/${id}`
}
