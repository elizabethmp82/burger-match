/**
 * Busca manual de bairro/cidade (RN03).
 * Etapa 3: procura em uma lista local. Etapa 4: Autocomplete da Places API.
 */
import { MOCK_REGIONS } from '@/mocks/regions.mock'
import type { Region } from '@/types/location.types'

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
 * Regiões que combinam com o texto, das mais relevantes para as menos:
 * 1º nome começa com o texto · 2º alguma palavra do nome começa com ele · 3º contém.
 * Também procura no contexto ("sp", "rio").
 */
export function searchRegions(query: string, limit = 6): Region[] {
  const term = normalizeText(query)
  if (term.length < 2) return []

  const scored = MOCK_REGIONS.map((region) => {
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

  return scored
    .filter(({ score }) => score >= 0)
    .sort((a, b) => a.score - b.score || a.region.name.localeCompare(b.region.name, 'pt-BR'))
    .slice(0, limit)
    .map(({ region }) => region)
}
