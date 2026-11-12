/**
 * Cache em sessionStorage na frente de qualquer PlacesProvider (padrão "decorator":
 * mesma interface, com um comportamento a mais).
 *
 * Por quê: o TanStack Query já guarda os resultados na memória, mas a memória some
 * ao recarregar a página (F5). Com este cache, recarregar não refaz a consulta ao
 * serviço público. Os dados do OSM (licença ODbL) podem ser guardados assim.
 *
 * sessionStorage: some ao fechar a aba e não é compartilhado entre abas — nada fica
 * guardado no aparelho por muito tempo (inclusive a região buscada).
 * Pode estar indisponível (modo privado, bloqueio): aí o app só não usa o cache.
 */
import type { BurgerPlace } from '@/types/place.types'
import type { NearbyPage, PageCursor, PlacesProvider } from './PlacesProvider'

/** Mude a versão quando o formato de BurgerPlace mudar: o cache antigo é ignorado. */
const PREFIX = 'burgermatch:places:v2:'

interface Entry {
  savedAt: number
  places: BurgerPlace[]
  /** Só nas buscas por proximidade: a página seguinte, se houver. */
  next?: PageCursor
}

export interface SessionCacheOptions {
  ttlMs: number
  storage?: Storage | undefined
  now?: () => number
}

function defaultStorage(): Storage | undefined {
  try {
    return globalThis.sessionStorage
  } catch {
    return undefined
  }
}

function isCursor(value: unknown): value is PageCursor {
  if (typeof value !== 'object' || value === null) return false
  const { scope, offset } = value as Partial<PageCursor>
  return (scope === 'burger' || scope === 'extended') && Number.isSafeInteger(offset)
}

export function withSessionCache(
  provider: PlacesProvider,
  { ttlMs, storage = defaultStorage(), now = Date.now }: SessionCacheOptions,
): PlacesProvider {
  function read(key: string): NearbyPage | undefined {
    try {
      const raw = storage?.getItem(PREFIX + key)
      if (!raw) return undefined
      const entry = JSON.parse(raw) as Partial<Entry>
      const fresh = typeof entry.savedAt === 'number' && now() - entry.savedAt < ttlMs
      if (fresh && Array.isArray(entry.places)) {
        return { places: entry.places, ...(isCursor(entry.next) && { next: entry.next }) }
      }
      storage?.removeItem(PREFIX + key)
    } catch {
      // Cache corrompido ou inacessível: ignora e busca de novo.
    }
    return undefined
  }

  function write(key: string, places: BurgerPlace[], next?: PageCursor): void {
    try {
      const entry: Entry = { savedAt: now(), places, ...(next && { next }) }
      storage?.setItem(PREFIX + key, JSON.stringify(entry))
    } catch {
      // Cota cheia ou armazenamento bloqueado: segue sem cache.
    }
  }

  return {
    async searchNearby(request, signal) {
      const { latitude, longitude, radiusMeters, scope, offset } = request
      const area = `${latitude.toFixed(5)},${longitude.toFixed(5)},${Math.round(radiusMeters)}`
      const key = `nearby:${scope}:${offset}:${area}`
      const cached = read(key)
      if (cached) return cached

      const page = await provider.searchNearby(request, signal)
      write(key, page.places, page.next)
      // Cada local também fica disponível para Detalhes/Favoritos sem nova consulta.
      for (const place of page.places) write(`place:${place.placeId}`, [place])
      return page
    },

    async getByIds(placeIds, signal) {
      const found: BurgerPlace[] = []
      const missing: string[] = []
      for (const placeId of placeIds) {
        const [cached] = read(`place:${placeId}`)?.places ?? []
        if (cached) found.push(cached)
        else missing.push(placeId)
      }
      if (missing.length === 0) return found

      const fetched = await provider.getByIds(missing, signal)
      for (const place of fetched) write(`place:${place.placeId}`, [place])
      return [...found, ...fetched]
    },
  }
}
