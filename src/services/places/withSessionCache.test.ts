import { describe, expect, it, vi } from 'vitest'
import type { BurgerPlace } from '@/types/place.types'
import type { PlacesProvider } from './PlacesProvider'
import { withSessionCache } from './withSessionCache'

/** sessionStorage de mentira, em memória. */
function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  }
}

const PLACE: BurgerPlace = {
  placeId: 'node-1',
  name: 'Burger',
  location: { latitude: 1, longitude: 2 },
}

const NEXT = { scope: 'burger', offset: 40 } as const
const PAGE = { places: [PLACE], next: NEXT }
const FIRST = { latitude: 1, longitude: 2, radiusMeters: 5000, scope: 'burger', offset: 0 } as const

function fakeProvider() {
  return {
    searchNearby: vi.fn<PlacesProvider['searchNearby']>(async () => PAGE),
    getByIds: vi.fn<PlacesProvider['getByIds']>(async () => [PLACE]),
  }
}

describe('withSessionCache', () => {
  it('a mesma busca dentro do prazo não consulta o serviço de novo', async () => {
    const inner = fakeProvider()
    const cached = withSessionCache(inner, { ttlMs: 1000, storage: memoryStorage() })

    await cached.searchNearby(FIRST)
    expect(await cached.searchNearby(FIRST)).toEqual(PAGE)
    expect(inner.searchNearby).toHaveBeenCalledTimes(1)
  })

  it('depois do prazo, consulta de novo', async () => {
    const inner = fakeProvider()
    let now = 0
    const cached = withSessionCache(inner, {
      ttlMs: 1000,
      storage: memoryStorage(),
      now: () => now,
    })

    await cached.searchNearby(FIRST)
    now = 1001
    await cached.searchNearby(FIRST)
    expect(inner.searchNearby).toHaveBeenCalledTimes(2)
  })

  it('locais da busca servem para Detalhes/Favoritos sem nova consulta', async () => {
    const inner = fakeProvider()
    const cached = withSessionCache(inner, { ttlMs: 1000, storage: memoryStorage() })

    await cached.searchNearby(FIRST)
    expect(await cached.getByIds(['node-1'])).toEqual([PLACE])
    expect(inner.getByIds).not.toHaveBeenCalled()
  })

  it('só pede ao serviço os IDs que faltam', async () => {
    const inner = fakeProvider()
    const cached = withSessionCache(inner, { ttlMs: 1000, storage: memoryStorage() })

    await cached.searchNearby(FIRST)
    await cached.getByIds(['node-1', 'way-9'])
    expect(inner.getByIds).toHaveBeenCalledWith(['way-9'], undefined)
  })

  it('cache corrompido ou armazenamento bloqueado: segue funcionando', async () => {
    const storage = memoryStorage()
    storage.setItem('burgermatch:places:v2:nearby:burger:0:1.00000,2.00000,5000', '{não é json')
    const inner = fakeProvider()
    expect(await withSessionCache(inner, { ttlMs: 1000, storage }).searchNearby(FIRST)).toEqual(
      PAGE,
    )

    const blocked = memoryStorage()
    blocked.setItem = () => {
      throw new DOMException('cheio', 'QuotaExceededError')
    }
    expect(
      await withSessionCache(inner, { ttlMs: 1000, storage: blocked }).searchNearby(FIRST),
    ).toEqual(PAGE)
  })

  it('cada página tem seu próprio cache (offset e tipo de busca fazem parte da chave)', async () => {
    const inner = fakeProvider()
    const cached = withSessionCache(inner, { ttlMs: 1000, storage: memoryStorage() })

    await cached.searchNearby(FIRST)
    await cached.searchNearby({ ...FIRST, offset: 40 })
    await cached.searchNearby({ ...FIRST, scope: 'extended' })
    await cached.searchNearby({ ...FIRST, offset: 40 })
    expect(inner.searchNearby).toHaveBeenCalledTimes(3)
  })
})
