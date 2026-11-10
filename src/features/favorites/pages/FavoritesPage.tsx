import { Clock, Heart } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePlacesByIds } from '@/hooks/usePlaces'
import { paths } from '@/routes/paths'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { pluralize } from '@/utils/formatters'
import { FavoriteCard } from '../components/FavoriteCard'
import { useFavorites } from '../hooks/useFavorites'

type ViewMode = 'nearest' | 'best-rated' | 'open'

const viewModes: ReadonlyArray<{ id: ViewMode; label: string }> = [
  { id: 'nearest', label: 'Mais perto' },
  { id: 'best-rated', label: 'Melhor nota' },
  { id: 'open', label: 'Abertas' },
]

/** Ordena ou filtra sem alterar a lista original (toSorted/filter criam cópias). */
function applyViewMode(places: BurgerPlace[], mode: ViewMode): BurgerPlace[] {
  const byDistance = (a: BurgerPlace, b: BurgerPlace) =>
    (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)

  switch (mode) {
    case 'nearest':
      return places.toSorted(byDistance)
    case 'best-rated':
      return places.toSorted((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    case 'open':
      return places.filter((place) => place.openNow === true).toSorted(byDistance)
  }
}

export function FavoritesPage() {
  const { favoriteIds, removeFavorite } = useFavorites()
  const favorites = usePlacesByIds(favoriteIds)
  const [mode, setMode] = useState<ViewMode>('nearest')
  const [announcement, setAnnouncement] = useState('')

  const visible = applyViewMode(favorites, mode)

  function handleRemove(place: BurgerPlace) {
    removeFavorite(place.placeId)
    setAnnouncement(`${place.name} removida dos favoritos.`)
  }

  return (
    <div className="page-container pt-6 pb-6">
      <h1 className="text-4xl tracking-logo">Favoritos</h1>
      <p className="mt-1 text-texto-suave">
        {pluralize(favorites.length, 'hamburgueria salva', 'hamburguerias salvas')}
      </p>

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nenhuma favorita ainda"
          description="Curta hamburguerias em Descobrir e elas aparecem aqui."
        >
          <Link to={paths.discover} className={buttonClasses('primary', 'w-full')}>
            Descobrir hamburguerias
          </Link>
        </EmptyState>
      ) : (
        <>
          <div role="group" aria-label="Ordenar e filtrar favoritos" className="mt-4 flex gap-2">
            {viewModes.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                onClick={() => setMode(id)}
                className={cn(
                  'rounded-full border-2 border-tostado px-4 py-1.5 text-sm font-bold transition',
                  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ketchup',
                  mode === id ? 'bg-tostado text-creme' : 'bg-superficie hover:bg-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {visible.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3">
              {visible.map((place) => (
                <FavoriteCard key={place.placeId} place={place} onRemove={handleRemove} />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Clock}
              title="Nenhuma aberta agora"
              description="Nenhuma das suas favoritas está aberta neste momento."
            />
          )}
        </>
      )}

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
