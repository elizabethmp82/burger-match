import { describe, expect, it } from 'vitest'
import {
  FAVORITES_KEY,
  loadFavoriteIds,
  MAX_FAVORITES,
  parseStoredFavorites,
  sanitizeFavoriteIds,
  saveFavoriteIds,
} from './favoritesStorage'

/** localStorage de mentira, em memória (os testes rodam fora do navegador). */
function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => data.delete(key),
    setItem: (key, value) => data.set(key, String(value)),
  }
}

/** Armazenamento que recusa tudo (bloqueado / cota cheia). */
const brokenStorage = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
} as unknown as Storage

describe('sanitizeFavoriteIds', () => {
  it('aceita IDs do OSM e dos dados simulados, na ordem', () => {
    expect(sanitizeFavoriteIds(['way-2', 'node-1', 'mock-brooklyn-burgers'])).toEqual([
      'way-2',
      'node-1',
      'mock-brooklyn-burgers',
    ])
  })

  it('descarta repetidos (RN08) e valores inválidos', () => {
    expect(
      sanitizeFavoriteIds(['node-1', 'node-1', 42, null, 'node-0', '<script>', 'way-abc']),
    ).toEqual(['node-1'])
  })

  it('não é lista → vazio', () => {
    expect(sanitizeFavoriteIds('node-1')).toEqual([])
  })

  it('respeita o limite máximo', () => {
    const many = Array.from({ length: MAX_FAVORITES + 10 }, (_, i) => `node-${i + 1}`)
    expect(sanitizeFavoriteIds(many)).toHaveLength(MAX_FAVORITES)
  })
})

describe('parseStoredFavorites', () => {
  it('nada salvo → undefined (diferente de lista vazia)', () => {
    expect(parseStoredFavorites(null)).toBeUndefined()
  })

  it('JSON corrompido ou formato estranho → lista vazia, sem erro', () => {
    expect(parseStoredFavorites('{quebrado')).toEqual([])
    expect(parseStoredFavorites('"texto"')).toEqual([])
    expect(parseStoredFavorites('{"ids":"node-1"}')).toEqual([])
  })
})

describe('salvar e carregar', () => {
  it('ida e volta mantém os IDs e a ordem', () => {
    const storage = memoryStorage()
    expect(saveFavoriteIds(FAVORITES_KEY, ['node-2', 'node-1'], storage)).toBe(true)
    expect(loadFavoriteIds(FAVORITES_KEY, storage)).toEqual(['node-2', 'node-1'])
    expect(JSON.parse(storage.getItem(FAVORITES_KEY) ?? '')).toEqual({
      version: 1,
      ids: ['node-2', 'node-1'],
    })
  })

  it('armazenamento indisponível: não quebra', () => {
    expect(saveFavoriteIds(FAVORITES_KEY, ['node-1'], brokenStorage)).toBe(false)
    expect(loadFavoriteIds(FAVORITES_KEY, brokenStorage)).toBeUndefined()
  })
})
