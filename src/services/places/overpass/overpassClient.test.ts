import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlacesError } from '../PlacesError'
import { CLIENT_TIMEOUT_MS, runOverpassQuery } from './overpassClient'

const ENDPOINT = 'https://overpass.example/api/interpreter'

function respondWith(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  )
}

async function errorKind(promise: Promise<unknown>) {
  const error: unknown = await promise.catch((caught: unknown) => caught)
  return error instanceof PlacesError ? error.kind : error
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('runOverpassQuery', () => {
  it('envia POST com a consulta e devolve os elementos válidos', async () => {
    respondWith({
      elements: [
        { type: 'node', id: 1, lat: 1, lon: 2, tags: { name: 'A' } },
        { type: 'area', id: 2 }, // tipo inesperado: descartado
        'lixo',
      ],
    })
    const elements = await runOverpassQuery(ENDPOINT, '[out:json];')
    expect(elements).toEqual([{ type: 'node', id: 1, lat: 1, lon: 2, tags: { name: 'A' } }])

    const [url, init] = vi.mocked(fetch).mock.calls[0] ?? []
    expect(url).toBe(ENDPOINT)
    expect(init?.method).toBe('POST')
    expect(String(init?.body)).toBe('data=%5Bout%3Ajson%5D%3B')
  })

  it.each([
    [429, 'rate-limited'],
    [504, 'unavailable'],
    [503, 'unavailable'],
    [406, 'forbidden'],
    [403, 'forbidden'],
    [400, 'invalid-response'],
  ])('HTTP %i → %s', async (status, kind) => {
    respondWith({}, status)
    expect(await errorKind(runOverpassQuery(ENDPOINT, 'q'))).toBe(kind)
  })

  it('erro de rede → network', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )
    expect(await errorKind(runOverpassQuery(ENDPOINT, 'q'))).toBe('network')
  })

  it('resposta sem "elements" → invalid-response', async () => {
    respondWith({ ok: true })
    expect(await errorKind(runOverpassQuery(ENDPOINT, 'q'))).toBe('invalid-response')
  })

  it('erro de execução no servidor (200 com "remark") → timeout', async () => {
    respondWith({ elements: [], remark: 'runtime error: Query timed out in "query" at line 3' })
    expect(await errorKind(runOverpassQuery(ENDPOINT, 'q'))).toBe('timeout')
  })

  it('lista vazia sem erro é um resultado válido (nenhuma hamburgueria)', async () => {
    respondWith({ elements: [] })
    expect(await runOverpassQuery(ENDPOINT, 'q')).toEqual([])
  })

  it(`desiste após ${CLIENT_TIMEOUT_MS / 1000} s → timeout`, async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('', 'AbortError')),
            )
          }),
      ),
    )
    const pending = errorKind(runOverpassQuery(ENDPOINT, 'q'))
    await vi.advanceTimersByTimeAsync(CLIENT_TIMEOUT_MS)
    expect(await pending).toBe('timeout')
  })

  it('cancelamento pela tela não vira erro de serviço', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('', 'AbortError')),
            )
          }),
      ),
    )
    const controller = new AbortController()
    const pending = errorKind(runOverpassQuery(ENDPOINT, 'q', controller.signal))
    controller.abort()
    const result = await pending
    expect(result).toBeInstanceOf(DOMException)
  })
})
