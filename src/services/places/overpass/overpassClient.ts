/**
 * Cliente HTTP da Overpass API: envia a consulta, aplica timeout e valida a resposta.
 * Não repete pedidos sozinho — serviço público e gratuito não é infraestrutura ilimitada.
 * Quem decide tentar de novo é a pessoa (botão "Tentar de novo").
 * Política de uso: https://dev.overpass-api.de/overpass-doc/en/preface/commons.html
 */
import type { OsmElement, OsmElementType } from '../osm/osmId'
import { PlacesError } from '../PlacesError'

/** O cliente desiste antes do servidor (25 s), para a tela não ficar presa. */
export const CLIENT_TIMEOUT_MS = 20_000

/** Elemento da resposta: contornos e relações trazem `center` (pedido com `out center`). */
export type OverpassElement = OsmElement

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isElementType(value: unknown): value is OsmElementType {
  return value === 'node' || value === 'way' || value === 'relation'
}

function readTags(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined
  const tags: Record<string, string> = {}
  for (const [key, tag] of Object.entries(value)) if (typeof tag === 'string') tags[key] = tag
  return tags
}

/** Converte um item da resposta, descartando os malformados (sem quebrar a lista toda). */
function readElement(value: unknown): OverpassElement | undefined {
  if (!isRecord(value) || !isElementType(value.type)) return undefined
  if (typeof value.id !== 'number' || !Number.isSafeInteger(value.id)) return undefined

  const element: OverpassElement = { type: value.type, id: value.id }
  if (typeof value.lat === 'number' && typeof value.lon === 'number') {
    element.lat = value.lat
    element.lon = value.lon
  }
  const { center } = value
  if (isRecord(center) && typeof center.lat === 'number' && typeof center.lon === 'number') {
    element.center = { lat: center.lat, lon: center.lon }
  }
  const tags = readTags(value.tags)
  if (tags) element.tags = tags
  return element
}

/** Valida o JSON. O Overpass pode responder 200 com um aviso de erro em `remark`. */
export function parseOverpassResponse(body: unknown): OverpassElement[] {
  if (!isRecord(body) || !Array.isArray(body.elements)) {
    throw new PlacesError('invalid-response', 'Resposta da Overpass sem "elements".')
  }
  const elements = body.elements.flatMap((item) => readElement(item) ?? [])

  const remark = typeof body.remark === 'string' ? body.remark : ''
  if (elements.length === 0 && /runtime error/i.test(remark)) {
    throw new PlacesError(
      /timed? ?out/i.test(remark) ? 'timeout' : 'unavailable',
      `Overpass: ${remark}`,
    )
  }
  return elements
}

function errorForStatus(status: number): PlacesError {
  // 406: o servidor recusou este cliente (filtro do próprio Overpass).
  if (status === 401 || status === 403 || status === 406) {
    return new PlacesError('forbidden', `Overpass: HTTP ${status}`)
  }
  if (status === 429) return new PlacesError('rate-limited', 'Overpass: HTTP 429')
  if (status === 504) return new PlacesError('unavailable', 'Overpass: HTTP 504 (sobrecarga)')
  if (status >= 500) return new PlacesError('unavailable', `Overpass: HTTP ${status}`)
  return new PlacesError('invalid-response', `Overpass: HTTP ${status}`)
}

/**
 * Executa a consulta. `signal` (opcional) cancela o pedido — o TanStack Query
 * cancela quando a tela deixa de precisar do resultado.
 */
export async function runOverpassQuery(
  endpoint: string,
  query: string,
  signal?: AbortSignal,
): Promise<OverpassElement[]> {
  // Junta o cancelamento externo ao timeout (sem AbortSignal.any, por compatibilidade
  // com navegadores um pouco mais antigos).
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, CLIENT_TIMEOUT_MS)
  const forwardAbort = () => controller.abort()
  signal?.addEventListener('abort', forwardAbort, { once: true })

  try {
    let response: Response
    try {
      // POST com formulário: pedido "simples" para o CORS (sem pré-verificação OPTIONS).
      response = await fetch(endpoint, {
        method: 'POST',
        body: new URLSearchParams({ data: query }),
        signal: controller.signal,
      })
    } catch (error) {
      if (timedOut) throw new PlacesError('timeout', 'Overpass: tempo esgotado', { cause: error })
      if (signal?.aborted) throw error // cancelado de propósito: não é falha
      throw new PlacesError('network', 'Overpass: falha de rede', { cause: error })
    }

    if (!response.ok) throw errorForStatus(response.status)

    let body: unknown
    try {
      body = await response.json()
    } catch (error) {
      if (timedOut) throw new PlacesError('timeout', 'Overpass: tempo esgotado', { cause: error })
      if (signal?.aborted) throw error
      throw new PlacesError('invalid-response', 'Overpass: JSON inválido', { cause: error })
    }
    return parseOverpassResponse(body)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', forwardAbort)
  }
}
