/**
 * Converte a resposta do Nominatim (formato jsonv2) em regiões do app.
 * Tudo é validado: itens sem nome ou sem coordenadas válidas são descartados.
 * Documentação: https://nominatim.org/release-docs/latest/api/Search/
 */
import type { Region } from '@/types/location.types'
import { normalizeText } from '@/utils/text'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** O Nominatim manda latitude/longitude como texto ("-23.56"). */
function coordinate(value: unknown, limit: number): number | undefined {
  const number = typeof value === 'string' ? Number(value) : value
  return typeof number === 'number' && Number.isFinite(number) && Math.abs(number) <= limit
    ? number
    : undefined
}

/**
 * Contexto para diferenciar nomes iguais, no mesmo formato da lista local:
 * Brasil → "São Paulo, SP"; outros países → "Lisboa, Portugal".
 */
export function describeContext(name: string, address: Record<string, unknown>): string {
  const isBrazil = text(address.country_code)?.toLowerCase() === 'br'
  const locality =
    text(address.city) ?? text(address.town) ?? text(address.village) ?? text(address.municipality)
  const stateCode = text(address['ISO3166-2-lvl4'])?.match(/^BR-([A-Z]{2})$/)?.[1]
  const state = isBrazil && stateCode ? stateCode : text(address.state)
  const country = isBrazil ? undefined : text(address.country)

  // A própria cidade não se repete no contexto ("Campinas" → "SP", e não "Campinas, SP").
  const seen = new Set([normalizeText(name)])
  const parts: string[] = []
  for (const part of [locality, state, country]) {
    if (!part || seen.has(normalizeText(part))) continue
    seen.add(normalizeText(part))
    parts.push(part)
  }
  return parts.join(', ')
}

function toRegion(item: unknown): Region | undefined {
  if (!isRecord(item)) return undefined

  const osmType = text(item.osm_type)
  const osmId = typeof item.osm_id === 'number' ? item.osm_id : undefined
  const latitude = coordinate(item.lat, 90)
  const longitude = coordinate(item.lon, 180)
  const name = text(item.name) ?? text(item.display_name)?.split(',')[0]?.trim()
  if (!osmType || osmId === undefined || latitude === undefined || longitude === undefined) {
    return undefined
  }
  if (!name) return undefined

  const address = isRecord(item.address) ? item.address : {}
  return {
    id: `nominatim-${osmType}-${String(osmId)}`,
    name,
    context: describeContext(name, address),
    center: { latitude, longitude },
  }
}

/** Valida a lista e remove repetidos (mesmo lugar, ou mesmo nome + contexto). */
export function parseNominatimResults(body: unknown): Region[] {
  if (!Array.isArray(body)) return []

  const seen = new Set<string>()
  const regions: Region[] = []
  for (const item of body) {
    const region = toRegion(item)
    if (!region) continue
    const label = `${normalizeText(region.name)}|${normalizeText(region.context)}`
    if (seen.has(region.id) || seen.has(label)) continue
    seen.add(region.id)
    seen.add(label)
    regions.push(region)
  }
  return regions
}
