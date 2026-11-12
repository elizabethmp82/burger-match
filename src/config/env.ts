/**
 * Configuração lida das variáveis de ambiente (arquivo .env.local, fora do Git).
 *
 * ATENÇÃO: variáveis VITE_* vão para o JavaScript do navegador — são PÚBLICAS.
 * A chave da Geoapify é pública por natureza (o navegador chama a API direto); a
 * proteção dela é a lista de domínios permitidos no painel da Geoapify.
 * Nunca coloque aqui segredos de verdade (senhas, chaves de serviços pagos).
 */

export type PlacesProviderName = 'geoapify' | 'overpass' | 'mock'

/** Servidor público principal da Overpass API (dados do OpenStreetMap). */
export const DEFAULT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

/** Aceita só endereços https (ou http em localhost, para um servidor próprio de testes). */
function safeServiceUrl(value: string | undefined, fallback: string): string {
  const text = value?.trim()
  if (!text) return fallback
  try {
    const url = new URL(text)
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    if (url.protocol === 'https:' || (url.protocol === 'http:' && isLocal)) return url.toString()
  } catch {
    // URL inválida: usa o padrão
  }
  console.warn(`[config] URL de serviço inválida ignorada: "${text}"`)
  return fallback
}

/**
 * De onde vêm as hamburguerias:
 * - "geoapify" (padrão): dados reais do OpenStreetMap pela Geoapify Places API;
 * - "overpass": dados reais pela Overpass API (mantida temporariamente);
 * - "mock": MODO DEMONSTRAÇÃO, dados simulados, sem rede (desenvolvimento e testes).
 */
function readProviderName(value: string | undefined): PlacesProviderName {
  const name = value?.trim()
  return name === 'mock' || name === 'overpass' ? name : 'geoapify'
}

export const placesProviderName = readProviderName(import.meta.env.VITE_PLACES_PROVIDER)

export const isDemoMode = placesProviderName === 'mock'

export const overpassConfig = {
  endpoint: safeServiceUrl(import.meta.env.VITE_OVERPASS_URL, DEFAULT_OVERPASS_URL),
} as const

/** Formato da chave (letras e números). O valor nunca é exibido em mensagens. */
function readApiKey(value: string | undefined): string {
  const key = value?.trim() ?? ''
  if (key && !/^[A-Za-z0-9]{16,64}$/.test(key)) {
    console.warn('[config] VITE_GEOAPIFY_API_KEY em formato inesperado: ignorada.')
    return ''
  }
  return key
}

/** Chave vazia: a busca mostra "não configurada" em vez de chamar a API. */
export const geoapifyConfig = {
  apiKey: readApiKey(import.meta.env.VITE_GEOAPIFY_API_KEY),
} as const

/**
 * Estilo do mapa (MapLibre). Padrão: OpenFreeMap — gratuito, sem chave e sem limite
 * de visualizações, uso comercial permitido. Sem garantia de disponibilidade (SLA):
 * se um dia sair do ar, troque o endereço em VITE_MAP_STYLE_URL.
 */
export const DEFAULT_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

export const mapConfig = {
  styleUrl: safeServiceUrl(import.meta.env.VITE_MAP_STYLE_URL, DEFAULT_MAP_STYLE_URL),
} as const
