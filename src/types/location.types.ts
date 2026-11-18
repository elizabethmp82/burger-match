/** Par latitude/longitude em graus decimais (WGS 84, o mesmo do GPS e do OpenStreetMap). */
export interface Coordinates {
  latitude: number
  longitude: number
}

/** Raios de busca oferecidos ao usuário, em km. O inicial é 5 km (RN04). */
export const SEARCH_RADII_KM = [5, 10, 20] as const

export type SearchRadiusKm = (typeof SEARCH_RADII_KM)[number]

/**
 * De onde veio a região de busca:
 *   default → exemplo inicial; o usuário ainda não escolheu (Descobrir e Mapa pedem a escolha)
 *   gps     → localização do navegador (RN02)
 *   manual  → bairro/cidade buscado pelo usuário (RN03)
 */
export type LocationSource = 'default' | 'gps' | 'manual'

/** Região onde as hamburguerias são procuradas. */
export interface SearchArea {
  /** Nome exibido para o usuário, ex.: "Pinheiros" ou "Sua localização". */
  label: string
  center: Coordinates
  radiusKm: SearchRadiusKm
  source: LocationSource
}

/**
 * Sugestão da busca manual de bairro/cidade. Não traz coordenadas: a tela só
 * precisa do nome; o centro é obtido com `resolveRegion` depois da escolha.
 */
export interface RegionSuggestion {
  id: string
  /** Ex.: "Pinheiros" */
  name: string
  /** Contexto para diferenciar nomes iguais, ex.: "São Paulo - SP" */
  context: string
}

/** Região já com o centro (lista local ou resultado do Nominatim). */
export interface Region extends RegionSuggestion {
  center: Coordinates
}
