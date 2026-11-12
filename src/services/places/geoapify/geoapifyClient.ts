/**
 * Cliente HTTP da Geoapify: monta a URL, aplica timeout e valida a resposta.
 *
 * - Não repete pedidos sozinho: cada requisição gasta créditos do plano gratuito.
 *   Quem decide tentar de novo é a pessoa (botão "Tentar de novo").
 * - A chave vai na URL (é assim que a Geoapify funciona). Por isso NENHUMA mensagem
 *   de erro inclui a URL: a chave não pode acabar em logs.
 * Documentação: https://apidocs.geoapify.com/docs/places/
 */
import { PlacesError } from '../PlacesError'

export const GEOAPIFY_BASE_URL = 'https://api.geoapify.com'

/** A busca costuma responder em 1–3 s. Passou disso, algo está errado: a tela explica. */
export const CLIENT_TIMEOUT_MS = 15_000

/** `properties` de um item da resposta (formato GeoJSON). Tudo é validado antes do uso. */
export type GeoapifyProperties = Readonly<Record<string, unknown>>

export type GeoapifyPath = '/v2/places' | '/v2/place-details'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Valida o GeoJSON e devolve as `properties` de cada item (malformados são descartados). */
export function parseFeatureCollection(body: unknown): GeoapifyProperties[] {
  if (!isRecord(body) || !Array.isArray(body.features)) {
    throw new PlacesError('invalid-response', 'Geoapify: resposta sem "features".')
  }
  return body.features.flatMap((feature: unknown) =>
    isRecord(feature) && isRecord(feature.properties) ? [feature.properties] : [],
  )
}

function errorForStatus(status: number): PlacesError {
  // 401/403: chave inválida, ou domínio que não está na lista de permitidos da chave.
  if (status === 401 || status === 403) {
    return new PlacesError('forbidden', `Geoapify: HTTP ${status}`)
  }
  if (status === 429) return new PlacesError('rate-limited', 'Geoapify: HTTP 429')
  if (status >= 500) return new PlacesError('unavailable', `Geoapify: HTTP ${status}`)
  return new PlacesError('invalid-response', `Geoapify: HTTP ${status}`)
}

export interface GeoapifyRequest {
  path: GeoapifyPath
  params: Readonly<Record<string, string>>
  apiKey: string
  baseUrl?: string
  signal?: AbortSignal | undefined
}

/**
 * Faz um GET e devolve as `properties` dos itens.
 * `signal` (opcional) cancela o pedido — o TanStack Query cancela quando a tela
 * deixa de precisar do resultado. Cancelamento de propósito não vira erro.
 */
export async function fetchGeoapify({
  path,
  params,
  apiKey,
  baseUrl = GEOAPIFY_BASE_URL,
  signal,
}: GeoapifyRequest): Promise<GeoapifyProperties[]> {
  if (!apiKey) throw new PlacesError('not-configured', 'Geoapify: chave ausente.')

  const url = new URL(path, baseUrl)
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value)
  url.searchParams.set('apiKey', apiKey)

  // Junta o cancelamento externo ao timeout (sem AbortSignal.any, por compatibilidade).
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, CLIENT_TIMEOUT_MS)
  const forwardAbort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', forwardAbort, { once: true })

  function failure(error: unknown, kind: 'network' | 'invalid-response'): unknown {
    if (timedOut) return new PlacesError('timeout', 'Geoapify: tempo esgotado', { cause: error })
    if (signal?.aborted) return error // cancelado de propósito: não é falha
    const message = kind === 'network' ? 'Geoapify: falha de rede' : 'Geoapify: JSON inválido'
    return new PlacesError(kind, message, { cause: error })
  }

  try {
    let response: Response
    try {
      // GET sem cabeçalhos extras: pedido "simples" para o CORS (sem pré-verificação).
      response = await fetch(url, { signal: controller.signal })
    } catch (error) {
      throw failure(error, 'network')
    }

    // 404 em Detalhes: o local não existe mais no mapa. Não é erro: só não aparece.
    if (response.status === 404) return []
    if (!response.ok) throw errorForStatus(response.status)

    let body: unknown
    try {
      body = await response.json()
    } catch (error) {
      throw failure(error, 'invalid-response')
    }
    return parseFeatureCollection(body)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', forwardAbort)
  }
}
