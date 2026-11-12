/**
 * Normalização: item da Geoapify → BurgerPlace do app.
 *
 * Os dados da Geoapify vêm do OpenStreetMap: cada item traz as tags originais em
 * `datasource.raw` (nome, cozinha, horários, ID do OSM…) e campos já tratados pela
 * Geoapify (endereço, categorias). Convertemos tudo para tags do OSM e reaproveitamos
 * o mesmo mapper do Overpass — uma regra só para nome, endereço, horário e contatos.
 */
import type { BurgerPlace } from '@/types/place.types'
import { normalizeText } from '@/utils/text'
import type { OsmElement, OsmElementType, OsmRef } from '../osm/osmId'
import { toBurgerPlace, type MapperOptions } from '../osm/osmPlaceMapper'
import type { GeoapifyProperties } from './geoapifyClient'

/**
 * Palavras que, no NOME, indicam claramente uma hamburgueria
 * ("Burger", "Burguer", "Hamburgueria", "Hambúrguer"). Comparadas sem acento.
 * "Lanches" fica de fora de propósito: muita lanchonete não vende hambúrguer.
 */
const BURGER_NAME_PATTERN = /burger|burguer|hamburg/

export type BurgerEvidence = 'category' | 'cuisine' | 'name'

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Texto não vazio, sem espaços nas pontas. */
function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function rawTags(properties: GeoapifyProperties): Readonly<Record<string, unknown>> {
  const { datasource } = properties
  return isRecord(datasource) && isRecord(datasource.raw) ? datasource.raw : {}
}

/** Valores da cozinha. O OSM separa vários com ";": "pizza;burger;ice_cream". */
export function cuisinesOf(properties: GeoapifyProperties): Set<string> {
  const { catering } = properties
  const values = [isRecord(catering) ? catering.cuisine : undefined, rawTags(properties).cuisine]
  return new Set(
    values
      .flatMap((value) => (typeof value === 'string' ? value.split(';') : []))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  )
}

/**
 * Por que achamos que o local vende hambúrguer. Lista vazia = nenhuma evidência
 * (o local não aparece). Vender OUTRAS coisas também nunca é motivo de exclusão.
 */
export function burgerEvidence(properties: GeoapifyProperties): BurgerEvidence[] {
  const evidence: BurgerEvidence[] = []
  const { categories } = properties
  if (
    Array.isArray(categories) &&
    categories.some((category) => typeof category === 'string' && category.endsWith('.burger'))
  ) {
    evidence.push('category')
  }
  if (cuisinesOf(properties).has('burger')) evidence.push('cuisine')
  const name = text(properties.name) ?? text(rawTags(properties).name)
  if (name && BURGER_NAME_PATTERN.test(normalizeText(name))) evidence.push('name')
  return evidence
}

const OSM_TYPES: Readonly<Record<string, OsmElementType>> = {
  n: 'node',
  w: 'way',
  r: 'relation',
  node: 'node',
  way: 'way',
  relation: 'relation',
}

/** ID do OSM do item: é ele que vira o `placeId` ("node-123") — estável e seguro na URL. */
export function readOsmRef(properties: GeoapifyProperties): OsmRef | undefined {
  const raw = rawTags(properties)
  const type = typeof raw.osm_type === 'string' ? OSM_TYPES[raw.osm_type] : undefined
  const id = typeof raw.osm_id === 'string' ? Number(raw.osm_id) : raw.osm_id
  if (!type || typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return undefined
  return { type, id }
}

/** Tags do OSM, completadas com o que a Geoapify já trata (endereço, contatos). */
function toTags(properties: GeoapifyProperties): Record<string, string> {
  const tags: Record<string, string> = {}
  for (const [key, value] of Object.entries(rawTags(properties))) {
    if (typeof value === 'string') tags[key] = value
  }
  const { contact } = properties
  const fallbacks: Record<string, string | undefined> = {
    name: text(properties.name),
    'addr:street': text(properties.street),
    'addr:housenumber': text(properties.housenumber),
    'addr:suburb': text(properties.suburb) ?? text(properties.district),
    'addr:city': text(properties.city),
    opening_hours: text(properties.opening_hours),
    phone: isRecord(contact) ? text(contact.phone) : undefined,
    website: text(properties.website),
  }
  for (const [key, value] of Object.entries(fallbacks)) {
    // O dado original do OSM tem prioridade; a Geoapify só preenche o que falta.
    if (value && !text(tags[key])) tags[key] = value
  }
  return tags
}

/**
 * `undefined` quando o item não serve: sem ID do OSM, sem nome válido ou sem coordenadas.
 * `knownRef`: em Detalhes já sabemos o ID pedido — usado se a resposta não o trouxer.
 */
export function geoapifyToBurgerPlace(
  properties: GeoapifyProperties,
  options: MapperOptions,
  knownRef?: OsmRef,
): BurgerPlace | undefined {
  const ref = readOsmRef(properties) ?? knownRef
  const { lat, lon } = properties
  if (!ref || typeof lat !== 'number' || typeof lon !== 'number') return undefined

  const element: OsmElement = { ...ref, lat, lon, tags: toTags(properties) }
  return toBurgerPlace(element, options)
}
