import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { appendNewPlaces } from '@/services/places/osm/dedupe'
import { describePlacesError } from '@/services/places/PlacesError'
import { FIRST_PAGE, type SearchScope } from '@/services/places/PlacesProvider'
import {
  getNearbyPage,
  getPlacesByIds,
  withCurrentOpenStatus,
} from '@/services/places/placesService'
import type { Coordinates, SearchArea } from '@/types/location.types'
import type { BurgerPlace } from '@/types/place.types'
import { distanceInMeters } from '@/utils/distance'
import { useNow } from './useNow'
import { useSearchArea } from './useSearchArea'

/*
 * Hooks de leitura de hamburguerias, com carregamento, erro e cache (RN12).
 *
 * Chaves de cache:
 *   ['places', 'nearby', lat, lng, raio] → busca por proximidade (em páginas)
 *   ['places', 'detail', id]             → um local (null = não existe)
 *   ['places', 'many', ...ids]           → vários locais (favoritos)
 *
 * Detalhes e Favoritos aproveitam o que a busca por proximidade já trouxe:
 * só pedem ao serviço os locais que ainda não estão no cache.
 */
const placeKeys = {
  nearby: ({ center, radiusKm }: SearchArea) =>
    ['places', 'nearby', center.latitude, center.longitude, radiusKm] as const,
  detail: (placeId: string) => ['places', 'detail', placeId] as const,
  many: (placeIds: readonly string[]) => ['places', 'many', ...placeIds] as const,
}

const NO_PLACES: readonly BurgerPlace[] = []

/**
 * Arredonda para 3 casas (~100 m). Pequenas variações do GPS caem na mesma chave
 * de cache — evita consultas repetidas — e a posição exata não sai do aparelho.
 */
function roundCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000
}

function roundedArea(area: SearchArea): SearchArea {
  return {
    ...area,
    center: {
      latitude: roundCoordinate(area.center.latitude),
      longitude: roundCoordinate(area.center.longitude),
    },
  }
}

/** Distância até a região atual + "aberto agora" para o instante atual. */
function present(place: BurgerPlace, origin: Coordinates, now: Date): BurgerPlace {
  return withCurrentOpenStatus(
    { ...place, distanceMeters: distanceInMeters(origin, place.location) },
    now,
  )
}

export interface PlacesResult {
  places: readonly BurgerPlace[]
  isPending: boolean
  isError: boolean
  /** Explicação do erro para exibir (RN12). */
  errorMessage: string | undefined
  retry: () => void
}

/**
 * Carregar mais resultados — sempre por pedido da pessoa (botão), nunca sozinho.
 * - "burger":   mais hamburguerias da mesma busca (próxima página);
 * - "extended": busca complementar em lanchonetes e restaurantes em geral.
 */
export interface LoadMore {
  scope: SearchScope
  load: () => void
  isLoading: boolean
  /** Falha ao carregar mais: os locais já mostrados continuam na tela. */
  errorMessage: string | undefined
}

export interface NearbyPlacesResult extends PlacesResult {
  /** `undefined` quando não há mais nada para buscar. */
  loadMore: LoadMore | undefined
  /** Quantos locais NOVOS a última página trouxe (só depois de carregar mais). */
  lastLoadAdded: number | undefined
}

/**
 * Hamburguerias dentro do raio atual, da mais próxima para a mais distante.
 * Só a 1ª página é buscada ao abrir a tela; as seguintes, só pelo `loadMore`.
 * Mover o mapa ou passar cards não faz nenhuma consulta.
 */
export function useNearbyPlaces(): NearbyPlacesResult {
  const { area } = useSearchArea()
  const queryClient = useQueryClient()
  const now = useNow()
  const searchArea = roundedArea(area)

  const query = useInfiniteQuery({
    queryKey: placeKeys.nearby(searchArea),
    initialPageParam: FIRST_PAGE,
    queryFn: async ({ pageParam, signal }) => {
      const page = await getNearbyPage(searchArea, pageParam, signal)
      // Já guarda cada local no cache de Detalhes: abrir um card não consulta de novo.
      for (const place of page.places) {
        queryClient.setQueryData(placeKeys.detail(place.placeId), place)
      }
      return page
    },
    getNextPageParam: (lastPage) => lastPage.next,
  })

  const pages = query.data?.pages
  const merged = useMemo(
    () => (pages ? appendNewPlaces(pages.map((page) => page.places)) : NO_PLACES),
    [pages],
  )
  const lastLoadAdded = useMemo(() => {
    if (!pages || pages.length < 2) return undefined
    return merged.length - appendNewPlaces(pages.slice(0, -1).map((page) => page.places)).length
  }, [pages, merged])

  const places = useMemo(
    () => merged.map((place) => present(place, area.center, now)),
    [merged, area.center, now],
  )

  const nextPage = pages?.at(-1)?.next
  // Erro na 1ª página: a tela mostra o erro. Erro ao carregar mais: a lista continua.
  const failedFirstPage = query.isError && !pages
  const { fetchNextPage, isFetchingNextPage } = query

  return {
    places,
    isPending: query.isPending,
    isError: failedFirstPage,
    errorMessage: failedFirstPage ? describePlacesError(query.error) : undefined,
    retry: () => void query.refetch(),
    lastLoadAdded,
    loadMore: nextPage && {
      scope: nextPage.scope,
      // Ignora cliques repetidos enquanto a página anterior ainda está chegando.
      load: () => {
        if (!isFetchingNextPage) void fetchNextPage({ cancelRefetch: false })
      },
      isLoading: isFetchingNextPage,
      errorMessage: query.isFetchNextPageError ? describePlacesError(query.error) : undefined,
    },
  }
}

/** Um local pelo ID. `place` fica `undefined` enquanto carrega ou se não existir. */
export function usePlace(placeId: string | undefined) {
  const { area } = useSearchArea()
  const now = useNow()

  const query = useQuery({
    queryKey: placeKeys.detail(placeId ?? ''),
    // O cache não aceita `undefined`: "não encontrado" é guardado como null.
    queryFn: async ({ signal }) => {
      const [place] = await getPlacesByIds([placeId ?? ''], signal)
      return place ?? null
    },
    enabled: Boolean(placeId),
  })

  const place = useMemo(
    () => (query.data ? present(query.data, area.center, now) : undefined),
    [query.data, area.center, now],
  )

  return {
    place,
    isPending: query.isPending && Boolean(placeId),
    isError: query.isError,
    errorMessage: query.isError ? describePlacesError(query.error) : undefined,
    retry: () => void query.refetch(),
  }
}

/**
 * Vários locais pelos IDs (ex.: favoritos), na mesma ordem dos IDs.
 * Os que faltam no cache vêm numa ÚNICA consulta — não uma por favorito, o que
 * esbarraria no limite de uso do serviço público.
 */
export function usePlacesByIds(placeIds: readonly string[]): PlacesResult {
  const { area } = useSearchArea()
  const queryClient = useQueryClient()
  const now = useNow()

  const query = useQuery({
    queryKey: placeKeys.many(placeIds),
    queryFn: async ({ signal }) => {
      const cachedPlace = (placeId: string) =>
        queryClient.getQueryData<BurgerPlace | null>(placeKeys.detail(placeId))

      const missing = placeIds.filter((placeId) => cachedPlace(placeId) === undefined)
      if (missing.length > 0) {
        const fetched = await getPlacesByIds(missing, signal)
        for (const placeId of missing) {
          const place = fetched.find((item) => item.placeId === placeId) ?? null
          queryClient.setQueryData(placeKeys.detail(placeId), place)
        }
      }
      return placeIds.flatMap((placeId) => cachedPlace(placeId) ?? [])
    },
    enabled: placeIds.length > 0,
    // Ao remover um favorito, a lista anterior fica na tela até a nova (sem "piscar").
    placeholderData: keepPreviousData,
  })

  const places = useMemo(
    () =>
      placeIds.length === 0
        ? NO_PLACES
        : (query.data ?? NO_PLACES).map((place) => present(place, area.center, now)),
    [placeIds.length, query.data, area.center, now],
  )

  return {
    places,
    isPending: query.isPending && placeIds.length > 0,
    isError: query.isError,
    errorMessage: query.isError ? describePlacesError(query.error) : undefined,
    retry: () => void query.refetch(),
  }
}
