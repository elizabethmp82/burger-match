import type { Coordinates } from './location.types'

/**
 * Foto de um estabelecimento.
 * `url` fica vazia nos dados simulados: a interface mostra um placeholder.
 * Na Etapa 4 ela virá da Places API, sempre com o crédito do autor.
 */
export interface PlacePhoto {
  id: string
  authorName: string
  url?: string
}

/** Faixa de preço de $ a $$$$, como no Google Maps. */
export type PriceLevel = 1 | 2 | 3 | 4

/**
 * Hamburgueria, conforme o modelo de dados de docs/scope.md §7,
 * com os campos opcionais que as telas da Etapa 2 exibem.
 * Campos opcionais podem faltar: a interface só mostra o que existir (RN11).
 */
export interface BurgerPlace {
  placeId: string
  name: string
  address: string
  location: Coordinates
  rating?: number
  reviewCount?: number
  /** Calculada a partir do centro da região de busca. */
  distanceMeters?: number
  openNow?: boolean
  /** Horário da próxima mudança de status ("23:00"): fechamento se aberto, abertura se fechado. */
  nextStatusChange?: string
  /**
   * Horários da semana, já prontos para exibir, uma linha por faixa de dias
   * (ex.: "Seg–Qui 18:00–23:00"). Equivale a `weekdayDescriptions` da Places API.
   */
  openingHours?: readonly string[]
  priceLevel?: PriceLevel
  photos?: PlacePhoto[]
  phoneNumber?: string
  websiteUrl?: string
  googleMapsUrl?: string
}
