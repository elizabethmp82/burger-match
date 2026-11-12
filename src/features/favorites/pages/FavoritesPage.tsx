import { Clock, Heart } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { EmptyState } from '@/components/ui/EmptyState'
import { DataAttribution } from '@/components/ui/DataAttribution'
import { ErrorState, LoadingState } from '@/components/ui/LoadState'
import { PlaceDetailsPanel } from '@/components/place/PlaceDetailsPanel'
import { useMediaQuery, WIDE_DESKTOP_QUERY } from '@/hooks/useMediaQuery'
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
function applyViewMode(places: readonly BurgerPlace[], mode: ViewMode): BurgerPlace[] {
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

/**
 *   Celular: lista em uma coluna; tocar abre os Detalhes (layout aprovado).
 *   Tablet:  mesma lista; vira 2 colunas quando a área tem largura para isso.
 *   Desktop pequeno (1024–1279px): igual ao tablet (lista em grade).
 *   Desktop ≥ 1280px: lista à esquerda + painel de detalhe à direita (mockup Desktop · Favoritos).
 *   O painel precisa de ~600px para o mosaico de fotos; abaixo disso ficaria espremido.
 */
export function FavoritesPage() {
  const { favoriteIds, removeFavorite } = useFavorites()
  const favoritesQuery = usePlacesByIds(favoriteIds)
  const favorites = favoritesQuery.places
  const [mode, setMode] = useState<ViewMode>('nearest')
  const [selectedId, setSelectedId] = useState<string>()
  const [announcement, setAnnouncement] = useState('')
  const isWide = useMediaQuery(WIDE_DESKTOP_QUERY)

  const visible = applyViewMode(favorites, mode)
  // Sem seleção válida (nada escolhido, removido ou filtrado), mostra o primeiro da lista.
  const selected = visible.find((place) => place.placeId === selectedId) ?? visible[0]
  const showPanel = isWide && selected !== undefined

  function handleRemove(place: BurgerPlace) {
    removeFavorite(place.placeId)
    setAnnouncement(`${place.name} removida dos favoritos.`)
  }

  return (
    <div className="xl:flex xl:h-full">
      <div
        className={cn(
          'page-container pt-6 pb-6',
          showPanel &&
            'xl:w-[27.5rem] xl:max-w-none xl:shrink-0 xl:overflow-y-auto xl:border-r-2 xl:border-tostado xl:px-6',
        )}
      >
        <div
          className={cn(
            'flex flex-col',
            !showPanel && 'md:flex-row md:items-end md:justify-between md:gap-4',
          )}
        >
          <div>
            <h1 className="text-4xl tracking-logo">Favoritos</h1>
            <p className="mt-1 text-texto-suave">
              {pluralize(favoriteIds.length, 'hamburgueria salva', 'hamburguerias salvas')}
            </p>
          </div>

          {favoriteIds.length > 0 && (
            <div
              role="group"
              aria-label="Ordenar e filtrar favoritos"
              className={cn('mt-4 flex flex-wrap gap-2', !showPanel && 'md:mt-0')}
            >
              {viewModes.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={mode === id}
                  onClick={() => setMode(id)}
                  className={cn(
                    'rounded-full border-2 border-tostado px-4 py-1.5 text-sm font-bold whitespace-nowrap transition',
                    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ketchup',
                    mode === id ? 'bg-tostado text-creme' : 'bg-superficie hover:bg-white',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {favoriteIds.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nenhuma favorita ainda"
            description="Curta hamburguerias em Descobrir e elas aparecem aqui."
            className="md:mx-auto md:max-w-md"
          >
            <Link to={paths.discover} className={buttonClasses('primary', 'w-full')}>
              Descobrir hamburguerias
            </Link>
          </EmptyState>
        ) : favorites.length === 0 && favoritesQuery.isPending ? (
          <LoadingState label="Carregando suas favoritas…" />
        ) : favorites.length === 0 && favoritesQuery.isError ? (
          <ErrorState onRetry={favoritesQuery.retry} description={favoritesQuery.errorMessage} />
        ) : visible.length > 0 ? (
          // @container: as colunas dependem da largura DA LISTA, não da tela.
          // Assim a mesma lista tem 1 coluna no celular e ao lado do painel, e 2 no tablet largo.
          <div className="@container mt-4">
            <ul className={cn('grid grid-cols-1 gap-3', !showPanel && '@2xl:grid-cols-2')}>
              {visible.map((place) => (
                <FavoriteCard
                  key={place.placeId}
                  place={place}
                  onRemove={handleRemove}
                  onSelect={showPanel ? () => setSelectedId(place.placeId) : undefined}
                  selected={showPanel && place.placeId === selected.placeId}
                />
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title="Nenhuma aberta agora"
            description="Nenhuma das suas favoritas está aberta neste momento."
          />
        )}

        {favorites.length > 0 && <DataAttribution className="mt-6" />}

        <p role="status" className="sr-only">
          {announcement}
        </p>
      </div>

      {showPanel && (
        <section
          aria-label="Detalhes da favorita selecionada"
          className="min-w-0 flex-1 overflow-y-auto px-10 py-8"
        >
          <div className="mx-auto max-w-3xl">
            {/* key: reinicia o estado interno do painel ao trocar de local. */}
            <PlaceDetailsPanel
              key={selected.placeId}
              place={selected}
              onAnnounce={setAnnouncement}
            />
          </div>
        </section>
      )}
    </div>
  )
}
