import type { OpeningSchedule } from '@/utils/openingHours'
import type { Coordinates } from './location.types'

/**
 * Foto de um estabelecimento.
 * O OpenStreetMap não tem fotos: hoje elas só existem nos dados simulados (sem `url`,
 * a interface mostra uma ilustração). Se um dia houver fotos licenciadas, o crédito
 * do autor é sempre exibido.
 */
export interface PlacePhoto {
  id: string
  authorName: string
  authorUrl?: string
  url?: string
}

/** Faixa de preço de $ a $$$$ (só nos dados simulados; o OSM não tem). */
export type PriceLevel = 1 | 2 | 3 | 4

/**
 * Hamburgueria, conforme o modelo de dados de docs/scope.md §7.
 * Campos opcionais podem faltar — e no OpenStreetMap muitos faltam (nota, fotos,
 * preço, às vezes endereço e horários). A interface só mostra o que existir (RN11).
 */
export interface BurgerPlace {
  /** No OSM: "node-123", "way-456" ou "relation-789" (seguro para usar na URL). */
  placeId: string
  name: string
  /** Ausente quando o OSM não tem rua nem bairro cadastrados. */
  address?: string
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
   * (ex.: "Seg–Qui 18:00–23:00"). Se o horário do OSM não puder ser interpretado,
   * vem o texto original, sem `openingSchedule` (e, portanto, sem "Aberto agora").
   */
  openingHours?: readonly string[]
  /**
   * Grade de horários "bruta". Quando existe, `openNow`/`nextStatusChange` são
   * recalculados na hora de exibir (RN11: status atualizado), em vez de ficarem
   * congelados no momento em que os dados chegaram.
   */
  openingSchedule?: OpeningSchedule
  priceLevel?: PriceLevel
  photos?: PlacePhoto[]
  phoneNumber?: string
  /** Sempre http(s): endereços com outros esquemas são descartados ao normalizar. */
  websiteUrl?: string
  /** Página do local no OpenStreetMap (para ver a origem ou sugerir correções). */
  osmUrl?: string
}
