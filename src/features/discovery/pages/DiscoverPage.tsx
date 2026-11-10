import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BrandIcon, Wordmark } from '@/components/ui/Brand'
import { GoogleAttribution } from '@/components/ui/GoogleAttribution'
import { ErrorState, LoadingState } from '@/components/ui/LoadState'
import { useFavorites } from '@/features/favorites/hooks/useFavorites'
import { useNearbyPlaces } from '@/hooks/usePlaces'
import { useSearchArea } from '@/hooks/useSearchArea'
import { placeDetailsPath } from '@/routes/paths'
import type { SearchRadiusKm } from '@/types/location.types'
import { AreaPill } from '../components/AreaPill'
import { DeckEmptyState } from '../components/DeckEmptyState'
import { PlaceAside } from '../components/PlaceAside'
import { SwipeActions } from '../components/SwipeActions'
import { SwipeDeck } from '../components/SwipeDeck'
import { useDeckShortcuts } from '../hooks/useDeckShortcuts'
import { useDiscoveryDeck } from '../hooks/useDiscoveryDeck'

/**
 *   Celular: coluna única (layout aprovado).
 *   Tablet:  título + contador, card com tamanho controlado, centralizado na vertical.
 *   Desktop: coluna central + painel "Sobre este lugar" à direita (mockup Desktop · Descobrir).
 */
export function DiscoverPage() {
  const navigate = useNavigate()
  const { area, setRadius } = useSearchArea()
  const nearby = useNearbyPlaces()
  const places = nearby.places
  const { favoriteIds } = useFavorites()
  const deck = useDiscoveryDeck(places)
  /** Mensagem lida por leitores de tela após cada ação (região role="status"). */
  const [announcement, setAnnouncement] = useState('')

  const current = deck.current
  /** Posição do card atual na lista do raio ("3 de 12"). */
  const position = places.length - deck.remaining.length + 1

  function handleLike() {
    if (!current) return
    deck.like()
    setAnnouncement(`${current.name} curtida e salva nos favoritos.`)
  }

  function handleSkip() {
    if (!current) return
    deck.skip()
    setAnnouncement(`${current.name} pulada.`)
  }

  function handleUndo() {
    if (!deck.canUndo) return
    deck.undo()
    setAnnouncement('Última ação desfeita.')
  }

  function handleExpandRadius(radiusKm: SearchRadiusKm) {
    setRadius(radiusKm)
    setAnnouncement(`Buscando num raio de ${radiusKm} km.`)
  }

  useDeckShortcuts({
    onSkip: handleSkip,
    onLike: handleLike,
    onUndo: handleUndo,
    onDetails: () => {
      if (current) void navigate(placeDetailsPath(current.placeId))
    },
  })

  return (
    <div className="flex min-h-full lg:h-full">
      <div className="page-container flex flex-1 flex-col gap-4 pt-6 pb-4 md:justify-center md:py-8 lg:overflow-y-auto">
        {/* Celular: logo no topo. Tablet+: o logo e a região ficam na barra lateral. */}
        <header className="flex items-center gap-2 md:hidden">
          <BrandIcon className="size-9" />
          <Wordmark className="text-2xl" />
        </header>

        {/* "contents" faz a linha não existir no celular (sem espaço extra). */}
        <div className="contents md:mx-auto md:flex md:w-full md:max-w-[25rem] md:items-baseline md:justify-between">
          <h1 className="sr-only md:not-sr-only md:text-4xl md:tracking-logo">Descobrir</h1>
          {current && (
            <p className="hidden text-sm text-texto-suave md:block">
              {position} de {places.length} por perto
            </p>
          )}
        </div>

        <AreaPill area={area} />

        {nearby.isPending ? (
          <LoadingState className="flex-1" />
        ) : nearby.isError ? (
          <ErrorState onRetry={nearby.retry} className="flex-1 justify-center" />
        ) : current ? (
          <>
            <SwipeDeck current={current} remainingCount={deck.remaining.length} />
            <SwipeActions
              placeName={current.name}
              canUndo={deck.canUndo}
              onUndo={handleUndo}
              onSkip={handleSkip}
              onLike={handleLike}
            />
            <p className="hidden text-center text-sm text-texto-suave lg:block">
              Use as setas do teclado: ← pular · → curtir
            </p>
            <GoogleAttribution className="text-center lg:hidden" />
          </>
        ) : (
          <DeckEmptyState
            // A key reinicia a seleção de raio sempre que o raio atual muda.
            key={area.radiusKm}
            totalInRadius={places.length}
            radiusKm={area.radiusKm}
            favoritesCount={favoriteIds.length}
            canUndo={deck.canUndo}
            onUndo={handleUndo}
            onExpandRadius={handleExpandRadius}
            onRestart={deck.restart}
          />
        )}

        <p role="status" className="sr-only">
          {announcement}
        </p>
      </div>

      {current && <PlaceAside place={current} origin={area.center} className="hidden lg:flex" />}
    </div>
  )
}
