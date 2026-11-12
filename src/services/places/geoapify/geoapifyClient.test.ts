import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlacesError } from '../PlacesError'
import { CLIENT_TIMEOUT_MS, fetchGeoapify } from './geoapifyClient'

const API_KEY = 'testkey0000000000000000000000000'
const request = { path: '/v2/places', params: { limit: '40' }, apiKey: API_KEY } as const

function respondWith(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  )
}

async function caught(promise: Promise<unknown>) {
  return promise.catch((error: unknown) => error)
}

async function errorKind(promise: Promise<unknown>) {
  const error = await caught(promise)
  return error instanceof PlacesError ? error.kind : error
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('fetchGeoapify', () => {
  it('GET com os parâmetros e a chave; devolve as properties válidas', async () => {
    respondWith({
      type: 'FeatureCollection',
      features: [{ properties: { name: 'A' } }, { sem: 'properties' }, 'lixo'],
    })
    expect(await fetchGeoapify(request)).toEqual([{ name: 'A' }])

    const [url] = vi.mocked(fetch).mock.calls[0] ?? []
    const sent = new URL(String(url))
    expect(sent.origin + sent.pathname).toBe('https://api.geoapify.com/v2/places')
    expect(sent.searchParams.get('limit')).toBe('40')
    expect(sent.searchParams.get('apiKey')).toBe(API_KEY)
  })

  it.each([
    [401, 'forbidden'],
    [403, 'forbidden'],
    [429, 'rate-limited'],
    [500, 'unavailable'],
    [503, 'unavailable'],
    [400, 'invalid-response'],
  ])('HTTP %i → %s', async (status, kind) => {
    respondWith({}, status)
    expect(await errorKind(fetchGeoapify(request))).toBe(kind)
  })

  it('a chave nunca aparece na mensagem de erro', async () => {
    respondWith({ message: `Invalid apiKey ${API_KEY}` }, 401)
    const error = await caught(fetchGeoapify(request))
    expect(String(error)).not.toContain(API_KEY)
  })

  it('404 (local que não existe mais) → lista vazia, sem erro', async () => {
    respondWith({}, 404)
    expect(await fetchGeoapify(request)).toEqual([])
  })

  it('resposta sem "features" → invalid-response', async () => {
    respondWith({ outra: 'coisa' })
    expect(await errorKind(fetchGeoapify(request))).toBe('invalid-response')
  })

  it('sem chave → not-configured, e nada é enviado', async () => {
    respondWith({ features: [] })
    expect(await errorKind(fetchGeoapify({ ...request, apiKey: '' }))).toBe('not-configured')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('erro de rede → network', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )
    expect(await errorKind(fetchGeoapify(request))).toBe('network')
  })

  it(`sem resposta em ${CLIENT_TIMEOUT_MS / 1000} s → timeout`, async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: URL, init?: RequestInit) =>
          new Promise((_, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            )
          }),
      ),
    )
    const result = errorKind(fetchGeoapify(request))
    await vi.advanceTimersByTimeAsync(CLIENT_TIMEOUT_MS)
    expect(await result).toBe('timeout')
  })

  it('cancelado pela tela → repassa o cancelamento (não vira erro de serviço)', async () => {
    const controller = new AbortController()
    controller.abort()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: URL, init?: RequestInit) => {
        if (init?.signal?.aborted) throw new DOMException('aborted', 'AbortError')
        return new Response('{}')
      }),
    )
    const error = await caught(fetchGeoapify({ ...request, signal: controller.signal }))
    expect(error).toBeInstanceOf(DOMException)
  })
})
