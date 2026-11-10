/**
 * Configuração lida das variáveis de ambiente (arquivo .env.local).
 *
 * ATENÇÃO: variáveis VITE_* vão para o JavaScript do navegador — são públicas.
 * A chave do Google Maps é feita para isso, desde que RESTRITA no Google Cloud
 * (por domínio e por API). Veja docs/google-maps-setup.md.
 */
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? ''

export const googleMapsConfig = {
  apiKey,
  /**
   * Map ID: obrigatório para os marcadores avançados (AdvancedMarkerElement).
   * "DEMO_MAP_ID" é o ID de demonstração do Google, válido para desenvolvimento.
   */
  mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || 'DEMO_MAP_ID',
} as const

/**
 * Sem chave, o app roda em MODO DEMONSTRAÇÃO: dados simulados e mapa ilustrativo.
 * Útil para desenvolver sem custo e para os testes automatizados (Etapa 8).
 */
export const isGoogleMapsEnabled = apiKey.length > 0
