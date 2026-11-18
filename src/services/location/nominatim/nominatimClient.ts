/**
 * Cliente HTTP do Nominatim (geocodificação do OpenStreetMap).
 *
 * Regras do servidor público (https://operations.osmfoundation.org/policies/nominatim/):
 * - no máximo 1 pedido por segundo → `waitForTurn` espaça os pedidos;
 * - proibido autocomplete → o app só chama quando a pessoa confirma a busca;
 * - não repetir pedidos sozinho → sem retry; quem tenta de novo é a pessoa;
 * - identificar o app → o navegador já envia o Referer (não dá para mudar o User-Agent).
 */
import { PlacesError } from '@/services/places/PlacesError'
import type { Region } from '@/types/location.types'
import { parseNominatimResults } from './nominatimMapper'

/** Respostas costumam levar menos de 1 s. Passou disso, a tela explica. */
export const NOMINATIM_TIMEOUT_MS = 10_000

/** Intervalo mínimo entre pedidos (a regra é 1 s; uma folga evita bater no limite). */
export const MIN_INTERVAL_MS = 1_100

/** Poucas opções bastam para escolher; menos dados trafegados. */
const RESULT_LIMIT = '5'

let lastRequestAt = Number.NEGATIVE_INFINITY

/** Só para os testes: esquece o horário do último pedido. */
export function resetNominatimThrottle(): void {
  lastRequestAt = Number.NEGATIVE_INFINITY
}

function abortError(): DOMException {
  return new DOMException('Busca cancelada', 'AbortError')
}

/** Espera até poder fazer o próximo pedido (respeitando um cancelamento no meio). */
async function waitForTurn(signal: AbortSignal | undefined): Promise<void> {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now()
  if (wait > 0) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort)
        resolve()
      }, wait)
      function onAbort() {
        clearTimeout(timer)
        reject(abortError())
      }
      signal?.addEventListener('abort', onAbort, { once: true })
    })
  }
  if (signal?.aborted) throw abortError()
  lastRequestAt = Date.now()
}

function errorForStatus(status: number): PlacesError {
  if (status === 403) return new PlacesError('forbidden', `Nominatim: HTTP ${String(status)}`)
  if (status === 429) return new PlacesError('rate-limited', 'Nominatim: HTTP 429')
  if (status >= 500) return new PlacesError('unavailable', `Nominatim: HTTP ${String(status)}`)
  return new PlacesError('invalid-response', `Nominatim: HTTP ${String(status)}`)
}

export interface NominatimSearch {
  query: string
  baseUrl: string
  signal?: AbortSignal | undefined
}

/** Busca bairros e cidades pelo nome. Cancelamento de propósito não vira erro. */
export async function searchNominatim({
  query,
  baseUrl,
  signal,
}: NominatimSearch): Promise<Region[]> {
  await waitForTurn(signal)

  const url = new URL('search', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', RESULT_LIMIT)
  // Só lugares do "endereço" (bairros, cidades, estados): nada de lojas ou ruas soltas.
  url.searchParams.set('layer', 'address')
  url.searchParams.set('accept-language', 'pt-BR')

  // Junta o cancelamento externo ao timeout (sem AbortSignal.any, por compatibilidade).
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, NOMINATIM_TIMEOUT_MS)
  const forwardAbort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', forwardAbort, { once: true })

  function failure(error: unknown, kind: 'network' | 'invalid-response'): unknown {
    if (timedOut) return new PlacesError('timeout', 'Nominatim: tempo esgotado', { cause: error })
    if (signal?.aborted) return error
    const message = kind === 'network' ? 'Nominatim: falha de rede' : 'Nominatim: JSON inválido'
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
    if (!response.ok) throw errorForStatus(response.status)

    let body: unknown
    try {
      body = await response.json()
    } catch (error) {
      throw failure(error, 'invalid-response')
    }
    if (!Array.isArray(body)) {
      throw new PlacesError('invalid-response', 'Nominatim: resposta não é uma lista.')
    }
    return parseNominatimResults(body)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', forwardAbort)
  }
}
