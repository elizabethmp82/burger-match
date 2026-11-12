import { afterEach, describe, expect, it, vi } from 'vitest'
import { FIRST_PAGE } from '../PlacesProvider'
import {
  CATEGORIES,
  createGeoapifyPlacesProvider,
  nextCursor,
  PAGE_SIZE,
} from './GeoapifyPlacesProvider'

/** Coordenadas fixas SÓ nos testes (centro de Belém). O app usa a localização da pessoa. */
const CENTER = { latitude: -1.452, longitude: -48.4936 }
const FIRST = { ...CENTER, radiusMeters: 5000, ...FIRST_PAGE }

/** Hamburgueria a `km` ao norte do centro. */
function burgerAt(id: number, km: number, name = `Burger ${id}`, extra = {}) {
  return {
    properties: {
      name,
      lat: CENTER.latitude + km / 111.2,
      lon: CENTER.longitude,
      categories: ['catering.fast_food', 'catering.fast_food.burger'],
      datasource: { raw: { name, osm_id: id, osm_type: 'n', cuisine: 'burger' } },
      ...extra,
    },
  }
}

function respondWith(features: unknown[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ type: 'FeatureCollection', features }))),
  )
}

function sentParams(call = 0): URLSearchParams {
  const [url] = vi.mocked(fetch).mock.calls[call] ?? []
  return new URL(String(url)).searchParams
}

const provider = createGeoapifyPlacesProvider({
  apiKey: 'testkey0000000000000000000000000',
  getUtcOffsetMinutes: () => -180,
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GeoapifyPlacesProvider.searchNearby', () => {
  it('pede as categorias de hambúrguer, no raio, por proximidade, 40 por página', async () => {
    respondWith([])
    await provider.searchNearby(FIRST)
    const params = sentParams()
    expect(params.get('categories')).toBe('catering.fast_food.burger,catering.restaurant.burger')
    expect(params.get('filter')).toBe('circle:-48.49360,-1.45200,5000')
    expect(params.get('bias')).toBe('proximity:-48.49360,-1.45200')
    expect(params.get('limit')).toBe('40')
    expect(params.get('offset')).toBe('0')
  })

  it('ordena por distância, remove duplicados, sem nome e fora do raio', async () => {
    respondWith([
      burgerAt(1, 3),
      burgerAt(2, 1),
      burgerAt(3, 1.0001, 'Burger 2'), // duplicado do 2 (mesmo nome, a ~10 m)
      burgerAt(4, 2, ''), // sem nome
      burgerAt(5, 6), // fora dos 5 km
    ])
    const { places } = await provider.searchNearby(FIRST)
    expect(places.map((place) => place.name)).toEqual(['Burger 2', 'Burger 1'])
    expect(places[0]?.placeId).toBe('node-2')
  })

  it('busca complementar: só entra quem tem evidência de hambúrguer', async () => {
    const generic = { categories: ['catering.restaurant'], catering: { cuisine: 'regional' } }
    respondWith([
      burgerAt(1, 1, 'Restaurante Regional', {
        ...generic,
        datasource: { raw: { osm_id: 1, osm_type: 'n', cuisine: 'regional' } },
      }),
      burgerAt(2, 1.5, 'Casa da Pizza', {
        ...generic,
        datasource: { raw: { osm_id: 2, osm_type: 'n', cuisine: 'pizza;burger' } },
      }),
      burgerAt(3, 2, 'Zé Hamburgueria', {
        ...generic,
        datasource: { raw: { osm_id: 3, osm_type: 'n' } },
      }),
    ])
    const { places } = await provider.searchNearby({ ...FIRST, scope: 'extended' })
    expect(sentParams().get('categories')).toBe(CATEGORIES.extended)
    expect(places.map((place) => place.name)).toEqual(['Casa da Pizza', 'Zé Hamburgueria'])
  })

  it('página cheia → próxima página da mesma busca', async () => {
    respondWith(Array.from({ length: PAGE_SIZE }, (_, index) => burgerAt(index + 1, 0.05 * index)))
    expect((await provider.searchNearby(FIRST)).next).toEqual({ scope: 'burger', offset: 40 })
  })

  it('coordenada inválida não chega ao servidor', async () => {
    respondWith([])
    await expect(provider.searchNearby({ ...FIRST, latitude: 200 })).rejects.toThrow(RangeError)
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('nextCursor', () => {
  it('hamburguerias esgotadas → oferece a busca complementar', () => {
    expect(nextCursor(FIRST_PAGE, 12)).toEqual({ scope: 'extended', offset: 0 })
  })

  it('busca complementar esgotada → fim', () => {
    expect(nextCursor({ scope: 'extended', offset: 40 }, 3)).toBeUndefined()
  })

  it('nunca passa do máximo de 500 resultados da API', () => {
    expect(nextCursor({ scope: 'extended', offset: 480 }, PAGE_SIZE)).toBeUndefined()
  })
})

describe('GeoapifyPlacesProvider.getByIds', () => {
  it('IDs inválidos não chegam ao servidor', async () => {
    respondWith([])
    expect(await provider.getByIds(['mock-x', 'qualquer coisa'])).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('busca cada local pelo ID do OSM (sem repetir IDs)', async () => {
    respondWith([burgerAt(7, 1)])
    const places = await provider.getByIds(['node-7', 'node-7'])
    expect(places.map((place) => place.placeId)).toEqual(['node-7'])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(sentParams().get('osm_id')).toBe('7')
    expect(sentParams().get('osm_type')).toBe('n')
  })

  it('resposta de OUTRO local é ignorada', async () => {
    respondWith([burgerAt(8, 1)])
    expect(await provider.getByIds(['node-7'])).toEqual([])
  })
})
