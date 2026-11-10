import { useState } from 'react'
import { BrandIcon, Wordmark } from '@/components/ui/Brand'
import { useFavorites } from '@/features/favorites/hooks/useFavorites'
import { useNearbyPlaces } from '@/hooks/usePlaces'
import { useSearchArea } from '@/hooks/useSearchArea'
import type { SearchRadiusKm } from '@/types/location.types'
import { AreaPill } from '../components/AreaPill'
import { DeckEmptyState } from '../components/DeckEmptyState'
import { SwipeActions } from '../components/SwipeActions'
import { SwipeDeck } from '../components/SwipeDeck'
import { useDiscoveryDeck } from '../hooks/useDiscoveryDeck'

export function DiscoverPage() {
  const { area, setRadius } = useSearchArea()
  const places = useNearbyPlaces()
  const { favoriteIds } = useFavorites()
  const deck = useDiscoveryDeck(places)
  /** Mensagem lida por leitores de tela após cada ação (região role="status"). */
  const [announcement, setAnnouncement] = useState('')

  const current = deck.current

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
    deck.undo()
    setAnnouncement('Última ação desfeita.')
  }

  function handleExpandRadius(radiusKm: SearchRadiusKm) {
    setRadius(radiusKm)
    setAnnouncement(`Buscando num raio de ${radiusKm} km.`)
  }

  // md:max-w-md é provisório: a composição de tablet/desktop vem na etapa 3.
  return (
    <div className="page-container flex min-h-full flex-col gap-4 pt-6 pb-4 md:max-w-md">
      {/* Celular: logo no topo. Tablet+: o logo e a região ficam na barra lateral. */}
      <header className="flex items-center gap-2 md:hidden">
        <BrandIcon className="size-9" />
        <Wordmark className="text-2xl" />
      </header>
      <h1 className="sr-only md:not-sr-only md:text-4xl md:tracking-logo">Descobrir</h1>

      <AreaPill area={area} />

      {current ? (
        <>
          <SwipeDeck current={current} remainingCount={deck.remaining.length} />
          <SwipeActions
            placeName={current.name}
            canUndo={deck.canUndo}
            onUndo={handleUndo}
            onSkip={handleSkip}
            onLike={handleLike}
          />
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
  )
}
