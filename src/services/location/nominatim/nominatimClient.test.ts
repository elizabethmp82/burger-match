import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PlacesError } from '@/services/places/PlacesError'
import {
  MIN_INTERVAL_MS,
  NOMINATIM_TIMEOUT_MS,
  resetNominatimThrottle,
  searchNominatim,
} from './nominatimClient'

const BASE_URL = 'https://nominatim.example.org'
const result = {
  osm_type: 'relation',
  osm_id: 1,
  lat: '-22.9',
  lon: '-47.06',
  name: 'Campinas',
  address: { state: 'São Paulo', 'ISO3166-2-lvl4': 'BR-SP', country_code: 'br' },
}

function respondWith(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  )
}

async function errorKind(promise: Promise<unknown>) {
  const error = await promise.catch((caught: unknown) => caught)
  return error instanceof PlacesError ? error.kind : error
}

beforeEach(() => resetNominatimThrottle())

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('searchNominatim', () => {
  it('GET /search com os parâmetros da política (jsonv2, limite, idioma)', async () => {
    respondWith([result])
    const regions = await searchNominatim({ query: 'Campinas', baseUrl: BASE_URL })
    expect(regions.map((region) => region.name)).toEqual(['Campinas'])

    const [url, init] = vi.mocked(fetch).mock.calls[0] ?? []
    const sent = new URL(String(url))
    expect(sent.origin + sent.pathname).toBe(`${BASE_URL}/search`)
    expect(sent.searchParams.get('q')).toBe('Campinas')
    expect(sent.searchParams.get('format')).toBe('jsonv2')
    expect(sent.searchParams.get('limit')).toBe('5')
    expect(sent.searchParams.get('accept-language')).toBe('pt-BR')
    // Sem cabeçalhos extras: pedido simples para o CORS.
    expect(init?.headers).toBeUndefined()
  })

  it('mantém o caminho do servidor configurado (ex.: proxy em /nominatim/)', async () => {
    respondWith([])
    await searchNominatim({ query: 'x y', baseUrl: 'https://proxy.example.org/nominatim' })
    const [url] = vi.mocked(fetch).mock.calls[0] ?? []
    expect(new URL(String(url)).pathname).toBe('/nominatim/search')
  })

  it.each([
    [403, 'forbidden'],
    [429, 'rate-limited'],
    [503, 'unavailable'],
    [400, 'invalid-response'],
  ])('HTTP %i → %s (sem nova tentativa)', async (status, kind) => {
    respondWith([], status)
    expect(await errorKind(searchNominatim({ query: 'a', baseUrl: BASE_URL }))).toBe(kind)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('resposta que não é lista → invalid-response', async () => {
    respondWith({ error: 'x' })
    expect(await errorKind(searchNominatim({ query: 'a', baseUrl: BASE_URL }))).toBe(
      'invalid-response',
    )
  })

  it('falha de rede → network', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    )
    expect(await errorKind(searchNominatim({ query: 'a', baseUrl: BASE_URL }))).toBe('network')
  })

  it('tempo esgotado → timeout', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: URL, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
          }),
      ),
    )
    const pending = errorKind(searchNominatim({ query: 'a', baseUrl: BASE_URL }))
    await vi.advanceTimersByTimeAsync(NOMINATIM_TIMEOUT_MS)
    expect(await pending).toBe('timeout')
  })

  it('no máximo 1 pedido por segundo: o segundo espera a sua vez', async () => {
    vi.useFakeTimers()
    respondWith([])
    await searchNominatim({ query: 'a', baseUrl: BASE_URL })

    const second = searchNominatim({ query: 'b', baseUrl: BASE_URL })
    await vi.advanceTimersByTimeAsync(MIN_INTERVAL_MS - 100)
    expect(fetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(100)
    await second
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('cancelado enquanto espera a vez: não faz o pedido', async () => {
    vi.useFakeTimers()
    respondWith([])
    await searchNominatim({ query: 'a', baseUrl: BASE_URL })

    const controller = new AbortController()
    const second = searchNominatim({ query: 'b', baseUrl: BASE_URL, signal: controller.signal })
    controller.abort()
    await expect(second).rejects.toMatchObject({ name: 'AbortError' })
    await vi.advanceTimersByTimeAsync(MIN_INTERVAL_MS)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
