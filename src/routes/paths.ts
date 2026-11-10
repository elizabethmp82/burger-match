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

/**
 * Segunda etapa das Boas-vindas ("Onde você está?").
 * É um parâmetro da mesma rota "/" (o escopo não prevê uma rota própria),
 * mas entra no histórico: o botão Voltar do navegador funciona.
 */
export const locationStepPath = `${paths.welcome}?step=location`

export function placeDetailsPath(placeId: string): string {
  return `/place/${encodeURIComponent(placeId)}`
}
