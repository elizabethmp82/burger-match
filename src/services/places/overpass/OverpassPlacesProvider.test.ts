import { afterEach, describe, expect, it, vi } from 'vitest'
import { createOverpassPlacesProvider, MAX_NEARBY_RESULTS } from './OverpassPlacesProvider'

const CENTER = { latitude: -23.5667, longitude: -46.6929 }

function respondWith(elements: unknown[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ elements }))),
  )
}

/** Hamburgueria a `km` ao norte do centro. */
function burgerAt(id: number, km: number, name = `Burger ${id}`) {
  return {
    type: 'node',
    id,
    lat: CENTER.latitude + km / 111.2,
    lon: CENTER.longitude,
    tags: { name },
  }
}

const provider = createOverpassPlacesProvider({
  endpoint: 'https://overpass.example/api/interpreter',
  getUtcOffsetMinutes: () => -180,
})

/** Primeira página, raio de 5 km. */
async function nearby() {
  const page = await provider.searchNearby({
    ...CENTER,
    radiusMeters: 5000,
    scope: 'burger',
    offset: 0,
  })
  return page.places
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('OverpassPlacesProvider.searchNearby', () => {
  it('ordena por distância, remove duplicados e o que está fora do raio', async () => {
    respondWith([
      burgerAt(1, 3),
      burgerAt(2, 1),
      { ...burgerAt(3, 1.0001), tags: { name: 'Burger 2' } }, // duplicado do 2
      burgerAt(4, 6), // fora dos 5 km
    ])
    const places = await nearby()
    expect(places.map((place) => place.name)).toEqual(['Burger 2', 'Burger 1'])
    expect(places[0]?.distanceMeters).toBeCloseTo(1000, -2)
  })

  it(`devolve no máximo ${MAX_NEARBY_RESULTS} locais`, async () => {
    respondWith(Array.from({ length: 80 }, (_, index) => burgerAt(index + 1, index * 0.05)))
    const places = await nearby()
    expect(places).toHaveLength(MAX_NEARBY_RESULTS)
  })

  it('nenhum resultado → lista vazia', async () => {
    respondWith([])
    expect(await nearby()).toEqual([])
  })
})

describe('OverpassPlacesProvider.getByIds', () => {
  it('IDs inválidos não chegam ao servidor', async () => {
    respondWith([])
    expect(await provider.getByIds(['mock-x', 'qualquer coisa'])).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('busca vários IDs numa única requisição', async () => {
    respondWith([burgerAt(1, 1), { ...burgerAt(2, 2), type: 'way' }])
    const places = await provider.getByIds(['node-1', 'way-2', 'node-1'])
    expect(places.map((place) => place.placeId)).toEqual(['node-1', 'way-2'])
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('OverpassPlacesProvider — páginas', () => {
  it('tudo vem na 1ª página: outras páginas e busca complementar não consultam o servidor', async () => {
    respondWith([burgerAt(1, 1)])
    const base = { ...CENTER, radiusMeters: 5000 }
    expect(await provider.searchNearby({ ...base, scope: 'burger', offset: 40 })).toEqual({
      places: [],
    })
    expect(await provider.searchNearby({ ...base, scope: 'extended', offset: 0 })).toEqual({
      places: [],
    })
    expect(fetch).not.toHaveBeenCalled()
  })
})
