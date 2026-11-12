import type { BurgerPlace } from '@/types/place.types'

/**
 * Que tipo de lugar procurar:
 * - "burger":   só os classificados como hamburgueria (busca principal);
 * - "extended": lanchonetes e restaurantes em geral, mantendo só os que têm
 *               evidência de vender hambúrguer (busca complementar, sob pedido).
 */
export type SearchScope = 'burger' | 'extended'

/** Qual página buscar. A primeira é sempre `{ scope: 'burger', offset: 0 }`. */
export interface PageCursor {
  scope: SearchScope
  offset: number
}

export const FIRST_PAGE: PageCursor = { scope: 'burger', offset: 0 }

export interface NearbyRequest extends PageCursor {
  latitude: number
  longitude: number
  radiusMeters: number
}

export interface NearbyPage {
  /** Da mais próxima para a mais distante, com `distanceMeters` a partir do centro. */
  places: BurgerPlace[]
  /** Próxima página, se houver. Só é buscada quando a pessoa pede (botão). */
  next?: PageCursor
}

/**
 * Contrato de uma FONTE de hamburguerias.
 *
 * O resto do app só conhece esta interface. Implementações:
 * - GeoapifyPlacesProvider: dados reais (OpenStreetMap, via Geoapify) — a principal;
 * - OverpassPlacesProvider: dados reais via Overpass (mantida temporariamente);
 * - MockPlacesProvider: dados simulados (modo demonstração e testes).
 * Trocar de fonte não exige mudar nenhuma tela.
 */
export interface PlacesProvider {
  /** Uma página de hamburguerias num raio. */
  searchNearby(request: NearbyRequest, signal?: AbortSignal): Promise<NearbyPage>

  /**
   * Locais pelos IDs (Detalhes e Favoritos).
   * IDs inexistentes ou inválidos simplesmente não aparecem no resultado.
   * Sem `distanceMeters`: ela depende de onde a pessoa está e é calculada ao exibir.
   */
  getByIds(placeIds: readonly string[], signal?: AbortSignal): Promise<BurgerPlace[]>
}
