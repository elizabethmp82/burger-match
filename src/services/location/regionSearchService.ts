/**
 * Busca manual de bairro/cidade (RN03).
 * Sugestões instantâneas de uma lista local de bairros e cidades (sem rede).
 * Fora da lista, a busca vai ao Nominatim (OpenStreetMap) — só quando a pessoa
 * confirma ("Buscar em todo o mapa" ou Enter), nunca a cada tecla.
 */
import { isDemoMode, nominatimConfig } from '@/config/env'
import { MOCK_REGIONS } from '@/mocks/regions.mock'
import type { Coordinates, Region, RegionSuggestion } from '@/types/location.types'
import { normalizeText } from '@/utils/text'
import { searchNominatim } from './nominatim/nominatimClient'

export { normalizeText }

/** Abaixo disso não sugerimos nada (uma letra combinaria com quase tudo). */
export const MIN_QUERY_LENGTH = 2

/**
 * Das mais relevantes para as menos:
 * 1º nome começa com o texto · 2º alguma palavra começa com ele · 3º nome ou contexto contém.
 */
function searchLocalRegions(query: string, limit = 6): RegionSuggestion[] {
  const term = normalizeText(query)

  return MOCK_REGIONS.map((region) => {
    const name = normalizeText(region.name)
    const full = `${name} ${normalizeText(region.context)}`
    const score = name.startsWith(term)
      ? 0
      : name.split(' ').some((word) => word.startsWith(term))
        ? 1
        : full.includes(term)
          ? 2
          : -1
    return { region, score }
  })
    .filter(({ score }) => score >= 0)
    .sort((a, b) => a.score - b.score || a.region.name.localeCompare(b.region.name, 'pt-BR'))
    .slice(0, limit)
    .map(({ region: { id, name, context } }) => ({ id, name, context }))
}

export async function suggestRegions(query: string): Promise<RegionSuggestion[]> {
  if (normalizeText(query).length < MIN_QUERY_LENGTH) return []
  return searchLocalRegions(query)
}

/** No modo demonstração o app não acessa a rede: só a lista local. */
export const canSearchOnline = !isDemoMode

/** Respostas do Nominatim nesta aba, pelo texto buscado (não repete o mesmo pedido). */
const onlineResults = new Map<string, Region[]>()
/** Regiões vindas do Nominatim, pelo id — para achar o centro da escolhida. */
const onlineRegions = new Map<string, Region>()

/** Busca no mapa todo (Nominatim). Chamar só depois de a pessoa confirmar. */
export async function searchRegionsOnline(
  query: string,
  signal?: AbortSignal,
): Promise<RegionSuggestion[]> {
  const term = normalizeText(query)
  if (!canSearchOnline || term.length < MIN_QUERY_LENGTH) return []

  let regions = onlineResults.get(term)
  if (!regions) {
    regions = await searchNominatim({
      query: query.trim(),
      baseUrl: nominatimConfig.endpoint,
      signal,
    })
    onlineResults.set(term, regions)
    for (const region of regions) onlineRegions.set(region.id, region)
  }
  return regions.map(({ id, name, context }) => ({ id, name, context }))
}

/** Coordenadas do centro da região escolhida. */
export async function resolveRegion(suggestion: RegionSuggestion): Promise<Coordinates> {
  const region =
    MOCK_REGIONS.find((candidate) => candidate.id === suggestion.id) ??
    onlineRegions.get(suggestion.id)
  if (!region) throw new Error(`Região desconhecida: ${suggestion.id}`)
  return region.center
}
