/** Par latitude/longitude em graus decimais (WGS 84, o mesmo do GPS e do Google Maps). */
export interface Coordinates {
  latitude: number
  longitude: number
}

/** Raios de busca oferecidos ao usuário, em km. O inicial é 5 km (RN04). */
export const SEARCH_RADII_KM = [5, 10, 20] as const

export type SearchRadiusKm = (typeof SEARCH_RADII_KM)[number]

/** Região onde as hamburguerias são procuradas. */
export interface SearchArea {
  /** Nome exibido para o usuário, ex.: "Pinheiros". */
  label: string
  center: Coordinates
  radiusKm: SearchRadiusKm
}
