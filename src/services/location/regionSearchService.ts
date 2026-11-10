/**
 * Busca manual de bairro/cidade (RN03).
 * Com chave do Google: Autocomplete da Places API (qualquer lugar do Brasil).
 * Sem chave: lista local de bairros e cidades (modo demonstração).
 */
import { isGoogleMapsEnabled } from '@/config/env'
import { MOCK_REGIONS } from '@/mocks/regions.mock'
import { autocompleteRegions, resolveRegionCenter } from '@/services/google/googlePlacesService'
import type { Coordinates, RegionSuggestion } from '@/types/location.types'

/** Abaixo disso não buscamos: poupa chamadas (e custo) enquanto o usuário começa a digitar. */
export const MIN_QUERY_LENGTH = 2

/** "São Paulo" → "sao paulo": sem acentos e sem diferença de maiúsculas. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Modo demo — das mais relevantes para as menos:
 * 1º nome começa com o texto · 2º alguma palavra começa com ele · 3º nome ou contexto contém.
 */
function searchMockRegions(query: string, limit = 6): RegionSuggestion[] {
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
  return isGoogleMapsEnabled ? autocompleteRegions(query) : searchMockRegions(query)
}

/** Coordenadas do centro da região escolhida. */
export async function resolveRegion(suggestion: RegionSuggestion): Promise<Coordinates> {
  if (isGoogleMapsEnabled) return resolveRegionCenter(suggestion.id)

  const region = MOCK_REGIONS.find((candidate) => candidate.id === suggestion.id)
  if (!region) throw new Error(`Região desconhecida: ${suggestion.id}`)
  return region.center
}
