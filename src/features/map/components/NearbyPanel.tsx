import { ChevronRight, SearchX, Star } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { PhotoTile } from '@/components/place/PhotoTile'
import { EmptyState } from '@/components/ui/EmptyState'
import { GoogleAttribution } from '@/components/ui/GoogleAttribution'
import { LoadingState } from '@/components/ui/LoadState'
import { placeDetailsPath } from '@/routes/paths'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { formatDistance, formatRating, pluralize } from '@/utils/formatters'

export type NearbyFilter = 'all' | 'open' | 'favorites'

const filters: ReadonlyArray<{ id: NearbyFilter; label: string; empty: string }> = [
  { id: 'all', label: 'Todas', empty: 'Nenhuma hamburgueria nesta área.' },
  { id: 'open', label: 'Abertas agora', empty: 'Nenhuma aberta agora nesta área.' },
  { id: 'favorites', label: 'Favoritas', empty: 'Nenhuma favorita nesta área.' },
]

interface NearbyPanelProps {
  /** Total da região (sem filtro), para o subtítulo. */
  totalCount: number
  /** Locais após o filtro. */
  places: readonly BurgerPlace[]
  filter: NearbyFilter
  onFilterChange: (filter: NearbyFilter) => void
  selectedId: string | undefined
  onSelect: (placeId: string) => void
  /** Carregando: mostra o aviso em vez de "Nada por aqui". */
  isPending?: boolean
}

/**
 * Lista "Por perto" ao lado do mapa (mockup Desktop · Mapa).
 * Tocar numa linha seleciona o marcador; a seta da linha selecionada abre os Detalhes.
 */
export function NearbyPanel({
  totalCount,
  places,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  isPending = false,
}: NearbyPanelProps) {
  const selectedRef = useRef<HTMLLIElement>(null)

  // RN10: ao selecionar pelo mapa, a linha correspondente aparece na lista.
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  const emptyMessage = filters.find((item) => item.id === filter)?.empty ?? ''

  return (
    <section
      aria-labelledby="nearby-title"
      className="flex w-80 shrink-0 flex-col overflow-y-auto border-r-2 border-tostado bg-creme p-6 xl:w-[25rem]"
    >
      <h1 id="nearby-title" className="text-4xl tracking-logo">
        Por perto
      </h1>
      <p className="mt-1 text-texto-suave">
        {isPending
          ? 'Procurando nesta área…'
          : filter === 'all'
            ? `${pluralize(totalCount, 'hamburgueria', 'hamburguerias')} nesta área`
            : `${places.length} de ${pluralize(totalCount, 'hamburgueria', 'hamburguerias')}`}
      </p>

      <div role="group" aria-label="Filtrar hamburguerias" className="mt-4 flex flex-wrap gap-2">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => onFilterChange(id)}
            className={cn(
              'rounded-full border-2 border-tostado px-4 py-1.5 text-sm font-bold whitespace-nowrap transition',
              'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ketchup',
              filter === id ? 'bg-tostado text-creme' : 'bg-superficie hover:bg-white',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isPending ? (
        <LoadingState className="py-10" />
      ) : places.length === 0 ? (
        <EmptyState icon={SearchX} title="Nada por aqui" description={emptyMessage} />
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {places.map((place) => {
            const selected = place.placeId === selectedId
            return (
              <li key={place.placeId} ref={selected ? selectedRef : undefined}>
                <NearbyRow place={place} selected={selected} onSelect={onSelect} />
              </li>
            )
          })}
        </ul>
      )}
      <GoogleAttribution className="mt-auto pt-6" />
    </section>
  )
}

function NearbyRow({
  place,
  selected,
  onSelect,
}: {
  place: BurgerPlace
  selected: boolean
  onSelect: (placeId: string) => void
}) {
  const focusRing =
    'focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-ketchup'

  return (
    <article
      className={cn(
        'flex items-stretch overflow-hidden rounded-2xl border-2 border-tostado transition-colors',
        selected ? 'bg-mostarda/20 shadow-offset' : 'bg-superficie hover:bg-white',
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(place.placeId)}
        aria-current={selected ? 'true' : undefined}
        className={cn('flex min-w-0 flex-1 items-center gap-3 p-2.5 text-left', focusRing)}
      >
        <PhotoTile
          photo={place.photos?.[0]}
          alt=""
          className="size-14 shrink-0 rounded-xl"
          iconClassName="size-5"
        />
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-bold">{place.name}</span>
          <span className="flex flex-wrap items-center gap-x-1 text-sm text-texto-suave">
            {place.rating !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Star
                  aria-hidden="true"
                  className="size-3.5 fill-mostarda text-tostado"
                  strokeWidth={2}
                />
                <span className="font-bold text-tostado">
                  <span className="sr-only">Nota </span>
                  {formatRating(place.rating)}
                </span>
              </span>
            )}
            {place.distanceMeters !== undefined && (
              <span>
                <span aria-hidden="true">· </span>
                {formatDistance(place.distanceMeters)}
              </span>
            )}
            {place.openNow !== undefined && (
              <span
                className={cn(
                  'font-bold',
                  place.openNow ? 'text-alface-forte' : 'text-ketchup-forte',
                )}
              >
                <span aria-hidden="true" className="font-normal text-texto-suave">
                  ·{' '}
                </span>
                {place.openNow ? 'Aberto' : 'Fechado'}
              </span>
            )}
          </span>
        </span>
      </button>

      {selected && (
        <Link
          to={placeDetailsPath(place.placeId)}
          aria-label={`Ver detalhes de ${place.name}`}
          className={cn('grid w-11 shrink-0 place-items-center hover:bg-mostarda/30', focusRing)}
        >
          <ChevronRight aria-hidden="true" className="size-5" strokeWidth={2.5} />
        </Link>
      )}
    </article>
  )
}
