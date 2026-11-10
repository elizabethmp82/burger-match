import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  getNearbyPlaces,
  getPlaceById,
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
 *   ['places', 'nearby', lat, lng, raio] → busca por proximidade
 *   ['places', 'detail', id]             → um local (sem distância: ela depende de
 *                                           onde o usuário está e é calculada na hora)
 */
const placeKeys = {
  nearby: ({ center, radiusKm }: SearchArea) =>
    ['places', 'nearby', center.latitude, center.longitude, radiusKm] as const,
  detail: (placeId: string) => ['places', 'detail', placeId] as const,
}

const NO_PLACES: readonly BurgerPlace[] = []

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
  retry: () => void
}

/** Hamburguerias dentro do raio atual, da mais próxima para a mais distante. */
export function useNearbyPlaces(): PlacesResult {
  const { area } = useSearchArea()
  const queryClient = useQueryClient()
  const now = useNow()

  const query = useQuery({
    queryKey: placeKeys.nearby(area),
    queryFn: async () => {
      const places = await getNearbyPlaces(area)
      // Já guarda cada local no cache de Detalhes: abrir um card não chama a API de novo.
      for (const place of places) queryClient.setQueryData(placeKeys.detail(place.placeId), place)
      return places
    },
  })

  const places = useMemo(
    () => (query.data ?? NO_PLACES).map((place) => present(place, area.center, now)),
    [query.data, area.center, now],
  )

  return {
    places,
    isPending: query.isPending,
    isError: query.isError,
    retry: () => void query.refetch(),
  }
}

/** Um local pelo ID. `place` fica `undefined` enquanto carrega ou se não existir. */
export function usePlace(placeId: string | undefined) {
  const { area } = useSearchArea()
  const now = useNow()

  const query = useQuery({
    queryKey: placeKeys.detail(placeId ?? ''),
    // O cache não aceita `undefined`: "não encontrado" é guardado como null.
    queryFn: async () => (await getPlaceById(placeId ?? '', area.center)) ?? null,
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
    retry: () => void query.refetch(),
  }
}

/** Vários locais pelos IDs (ex.: favoritos), na mesma ordem dos IDs. */
export function usePlacesByIds(placeIds: readonly string[]): PlacesResult {
  const { area } = useSearchArea()
  const now = useNow()

  const result = useQueries({
    queries: placeIds.map((placeId) => ({
      queryKey: placeKeys.detail(placeId),
      queryFn: async () => (await getPlaceById(placeId, area.center)) ?? null,
    })),
    combine: (results) => ({
      data: results.flatMap((item) => (item.data ? [item.data] : [])),
      isPending: results.some((item) => item.isPending),
      isError: results.some((item) => item.isError),
      retry: () => {
        for (const item of results) if (item.isError) void item.refetch()
      },
    }),
  })

  const places = useMemo(
    () => result.data.map((place) => present(place, area.center, now)),
    [result.data, area.center, now],
  )

  return { places, isPending: result.isPending, isError: result.isError, retry: result.retry }
}
