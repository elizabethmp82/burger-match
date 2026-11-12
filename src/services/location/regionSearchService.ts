/**
 * Busca manual de bairro/cidade (RN03).
 * Sugestões instantâneas de uma lista local de bairros e cidades (sem rede).
 * Sub-etapa D: opção extra de buscar no Nominatim (OSM), só quando a pessoa confirmar.
 */
import { MOCK_REGIONS } from '@/mocks/regions.mock'
import type { Coordinates, RegionSuggestion } from '@/types/location.types'
import { normalizeText } from '@/utils/text'

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

/** Coordenadas do centro da região escolhida. */
export async function resolveRegion(suggestion: RegionSuggestion): Promise<Coordinates> {
  const region = MOCK_REGIONS.find((candidate) => candidate.id === suggestion.id)
  if (!region) throw new Error(`Região desconhecida: ${suggestion.id}`)
  return region.center
}
