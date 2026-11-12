import { MapPinOff } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { LoadMorePlaces } from '@/components/place/LoadMorePlaces'
import { PlaceRow } from '@/components/place/PlaceRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState, LoadingState } from '@/components/ui/LoadState'
import { useFavorites } from '@/features/favorites/hooks/useFavorites'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'
import { useNearbyPlaces } from '@/hooks/usePlaces'
import { useSearchArea } from '@/hooks/useSearchArea'
import type { BurgerPlace } from '@/types/place.types'
import type { FocusRequest } from '../components/BurgerMap'
import { NearbyPanel, type NearbyFilter } from '../components/NearbyPanel'
import { areaKey } from '../utils/mapCamera'

/**
 * O mapa (MapLibre) só é baixado quando esta tela abre: as outras telas não
 * pagam pelo tamanho da biblioteca.
 */
const BurgerMap = lazy(() => import('../components/BurgerMap'))

/**
 * Área livre para enquadrar os pinos, em px.
 * Celular: em cima, a etiqueta da região; embaixo, o card flutuante; à direita, os botões.
 */
const MOBILE_PADDING = { top: 72, bottom: 150, left: 40, right: 72 }
const DESKTOP_PADDING = { top: 64, bottom: 48, left: 48, right: 88 }

/**
 *   Celular: mapa + card do local selecionado flutuando embaixo (layout aprovado).
 *   Tablet:  igual, com o card limitado a 448px e centralizado.
 *   Desktop: lista "Por perto" com filtros + mapa (mockup Desktop · Mapa).
 *
 * Sincronização mapa ↔ lista: ESTA tela guarda qual local está selecionado.
 * - Card da lista → seleciona e pede ao mapa para centralizar (`focus`);
 * - Pino do mapa  → só seleciona (a lista rola até o card; a câmera fica parada).
 * O movimento da câmera nunca altera a seleção nem faz buscas: não há como entrar em loop.
 */
export function MapPage() {
  const { area } = useSearchArea()
  const nearby = useNearbyPlaces()
  const places = nearby.places
  const { isFavorite } = useFavorites()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [filter, setFilter] = useState<NearbyFilter>('all')
  const [selectedId, setSelectedId] = useState<string>()
  const [focus, setFocus] = useState<FocusRequest>()

  // Os filtros só existem no desktop (na lista); no celular o mapa mostra todos.
  const activeFilter: NearbyFilter = isDesktop ? filter : 'all'
  const shown = places.filter((place) => matchesFilter(place, activeFilter, isFavorite))

  // Sem seleção válida (nada escolhido, fora do raio ou filtrado), destaca o mais próximo.
  const selected = shown.find((place) => place.placeId === selectedId) ?? shown[0]

  function selectFromList(placeId: string) {
    setSelectedId(placeId)
    setFocus((current) => ({ placeId, requestId: (current?.requestId ?? 0) + 1 }))
  }

  return (
    <div className="relative h-full min-h-[28rem] overflow-hidden lg:flex">
      {isDesktop ? (
        <NearbyPanel
          totalCount={places.length}
          places={shown}
          filter={filter}
          onFilterChange={setFilter}
          selectedId={selected?.placeId}
          onSelect={selectFromList}
          isPending={nearby.isPending}
          footer={
            nearby.loadMore && (
              <LoadMorePlaces
                loadMore={nearby.loadMore}
                lastLoadAdded={nearby.lastLoadAdded}
                className="mt-4"
              />
            )
          }
        />
      ) : (
        <h1 className="sr-only">Mapa</h1>
      )}

      <div className="relative h-full min-w-0 flex-1 bg-creme">
        <Suspense fallback={<LoadingState className="h-full justify-center" />}>
          <BurgerMap
            center={area.center}
            areaKey={areaKey(area.center, area.radiusKm)}
            places={shown}
            fitTo={places.map((place) => place.location)}
            isReady={!nearby.isPending}
            selectedId={selected?.placeId}
            focus={focus}
            onSelect={setSelectedId}
            padding={isDesktop ? DESKTOP_PADDING : MOBILE_PADDING}
            showSelectedLabel={isDesktop}
            controlsClassName="top-16 right-3 lg:top-4 lg:right-4"
          />
        </Suspense>

        {/* Celular/tablet: qual região está no mapa (no desktop, ela aparece na barra lateral). */}
        <p className="absolute top-4 left-1/2 z-20 max-w-[calc(100%-2rem)] -translate-x-1/2 truncate rounded-full border-2 border-tostado bg-superficie px-3 py-1 text-xs font-semibold lg:hidden">
          {area.label} · {area.radiusKm} km
        </p>

        {(nearby.isPending || nearby.isError) && (
          <div className="absolute inset-x-4 top-1/2 z-40 mx-auto max-w-sm -translate-y-1/2 rounded-3xl border-2 border-tostado bg-superficie px-4 shadow-offset">
            {nearby.isPending ? (
              <LoadingState className="py-8" />
            ) : (
              <ErrorState
                onRetry={nearby.retry}
                description={nearby.errorMessage}
                className="py-6"
              />
            )}
          </div>
        )}

        {/*
          No desktop o local selecionado aparece destacado na lista ao lado.
          No celular, o card flutua acima da atribuição do mapa (que precisa ficar visível).
        */}
        {!isDesktop &&
          !nearby.isPending &&
          !nearby.isError &&
          (selected ? (
            <div
              className="absolute inset-x-4 bottom-10 z-30 md:inset-x-0 md:mx-auto md:w-full md:max-w-md"
              aria-live="polite"
            >
              <PlaceRow place={selected} media="none" className="shadow-offset" />
            </div>
          ) : (
            <div className="absolute inset-x-4 bottom-10 z-30 rounded-3xl border-2 border-tostado bg-superficie px-4 md:inset-x-0 md:mx-auto md:w-full md:max-w-md">
              <EmptyState
                icon={MapPinOff}
                title="Nada por aqui"
                description={`Nenhuma hamburgueria num raio de ${area.radiusKm} km.`}
                className="py-6"
              />
            </div>
          ))}
      </div>
    </div>
  )
}

function matchesFilter(
  place: BurgerPlace,
  filter: NearbyFilter,
  isFavorite: (placeId: string) => boolean,
): boolean {
  if (filter === 'open') return place.openNow === true
  if (filter === 'favorites') return isFavorite(place.placeId)
  return true
}
