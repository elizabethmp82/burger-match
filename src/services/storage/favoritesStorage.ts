/**
 * Favoritos salvos no aparelho (RN09), no localStorage do navegador.
 *
 * - Só os IDs dos locais (ex.: "node-123"), como pede docs/scope.md §7: os dados
 *   do lugar são buscados de novo quando a tela precisa. Nenhuma localização é salva.
 * - Tudo que vem do armazenamento é validado: um valor corrompido ou editado à mão
 *   é ignorado, sem quebrar o app.
 * - Armazenamento indisponível (bloqueado, modo privado, cota cheia): o app segue
 *   funcionando, com os favoritos só na memória.
 */

/** Mude a versão se o formato mudar: dá para migrar sem perder favoritos antigos. */
export const FAVORITES_KEY = 'burgermatch:favorites:v1'
/** Modo demonstração: chave separada, para IDs fictícios não se misturarem aos reais. */
export const DEMO_FAVORITES_KEY = 'burgermatch:favorites:demo:v1'

/** Limite de segurança (ninguém favorita tanto; evita crescer sem fim). */
export const MAX_FAVORITES = 500

/** IDs do OSM ("node-123") ou dos dados simulados ("mock-nome-do-lugar"). */
const VALID_ID = /^(?:(?:node|way|relation)-[1-9]\d{0,15}|mock-[a-z0-9-]{1,80})$/

interface StoredFavorites {
  version: 1
  ids: string[]
}

function defaultStorage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

/** Limpa uma lista vinda de fora: só IDs válidos, sem repetidos (RN08), com limite. */
export function sanitizeFavoriteIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const unique = new Set<string>()
  for (const id of value) {
    if (typeof id === 'string' && VALID_ID.test(id)) unique.add(id)
    if (unique.size >= MAX_FAVORITES) break
  }
  return [...unique]
}

/** Lê o texto salvo. `undefined` = nada salvo ainda (diferente de "lista vazia"). */
export function parseStoredFavorites(raw: string | null): string[] | undefined {
  if (raw === null) return undefined
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data === 'object' && data !== null && 'ids' in data) {
      return sanitizeFavoriteIds((data as { ids: unknown }).ids)
    }
  } catch {
    // JSON inválido: tratado como lista vazia abaixo.
  }
  return []
}

export function loadFavoriteIds(
  key: string,
  storage: Storage | undefined = defaultStorage(),
): string[] | undefined {
  try {
    return parseStoredFavorites(storage?.getItem(key) ?? null)
  } catch {
    return undefined
  }
}

/** true se salvou; false se o armazenamento não está disponível. */
export function saveFavoriteIds(
  key: string,
  ids: readonly string[],
  storage: Storage | undefined = defaultStorage(),
): boolean {
  try {
    if (!storage) return false
    const data: StoredFavorites = { version: 1, ids: sanitizeFavoriteIds(ids) }
    storage.setItem(key, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}
