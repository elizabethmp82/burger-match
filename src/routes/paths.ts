/**
 * Fonte única das rotas da aplicação.
 * Evita strings soltas espalhadas pelos componentes.
 */
export const paths = {
  welcome: '/',
  discover: '/discover',
  favorites: '/favorites',
  map: '/map',
  placeDetails: '/place/:placeId',
} as const

export function placeDetailsPath(placeId: string): string {
  return `/place/${encodeURIComponent(placeId)}`
}
