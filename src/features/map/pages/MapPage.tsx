import { MapPinOff } from 'lucide-react'
import { useState } from 'react'
import { PlaceRow } from '@/components/place/PlaceRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFavorites } from '@/features/favorites/hooks/useFavorites'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'
import { useNearbyPlaces } from '@/hooks/usePlaces'
import { useSearchArea } from '@/hooks/useSearchArea'
import type { BurgerPlace } from '@/types/place.types'
import { MockMap } from '../components/MockMap'
import { NearbyPanel, type NearbyFilter } from '../components/NearbyPanel'
import type { BoxInsets } from '../utils/projectToBox'

/** No desktop não há card cobrindo o mapa: os marcadores usam quase toda a área. */
const DESKTOP_INSETS: BoxInsets = { top: 24, bottom: 86, left: 10, right: 88 }

/**
 *   Celular: mapa + card do local selecionado flutuando embaixo (layout aprovado).
 *   Tablet:  igual, com o card limitado a 448px e centralizado.
 *   Desktop: lista "Por perto" com filtros + mapa (mockup Desktop · Mapa).
 */
export function MapPage() {
  const { area } = useSearchArea()
  const places = useNearbyPlaces()
  const { isFavorite } = useFavorites()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [filter, setFilter] = useState<NearbyFilter>('all')
  const [selectedId, setSelectedId] = useState<string>()

  // Os filtros só existem no desktop (na lista); no celular o mapa mostra todos.
  const activeFilter: NearbyFilter = isDesktop ? filter : 'all'
  const shown = places.filter((place) => matchesFilter(place, activeFilter, isFavorite))

  // Sem seleção válida (nada escolhido, fora do raio ou filtrado), destaca o mais próximo.
  const selected = shown.find((place) => place.placeId === selectedId) ?? shown[0]

  return (
    <div className="relative h-full min-h-[28rem] overflow-hidden lg:flex">
      {isDesktop ? (
        <NearbyPanel
          totalCount={places.length}
          places={shown}
          filter={filter}
          onFilterChange={setFilter}
          selectedId={selected?.placeId}
          onSelect={setSelectedId}
        />
      ) : (
        <h1 className="sr-only">Mapa</h1>
      )}

      <div className="relative h-full min-w-0 flex-1">
        <MockMap
          center={area.center}
          places={shown}
          fitTo={places.map((place) => place.location)}
          selectedId={selected?.placeId}
          onSelect={setSelectedId}
          {...(isDesktop && { insets: DESKTOP_INSETS, showSelectedLabel: true })}
        />

        <p className="absolute top-4 left-1/2 z-30 -translate-x-1/2 rounded-full border-2 border-tostado bg-superficie px-3 py-1 text-xs font-semibold whitespace-nowrap">
          Mapa ilustrativo · {area.label}, {area.radiusKm} km
        </p>

        {/* No desktop o local selecionado aparece destacado na lista ao lado. */}
        {!isDesktop &&
          (selected ? (
            <div
              className="absolute inset-x-4 bottom-4 z-30 md:inset-x-0 md:mx-auto md:w-full md:max-w-md"
              aria-live="polite"
            >
              <PlaceRow place={selected} showReviewCount className="shadow-offset" />
            </div>
          ) : (
            <div className="absolute inset-x-4 bottom-4 z-30 rounded-3xl border-2 border-tostado bg-superficie px-4 md:inset-x-0 md:mx-auto md:w-full md:max-w-md">
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
