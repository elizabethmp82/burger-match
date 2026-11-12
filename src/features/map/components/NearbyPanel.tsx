import { ChevronRight, SearchX } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router'
import { PlaceRow } from '@/components/place/PlaceRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { DataAttribution } from '@/components/ui/DataAttribution'
import { LoadingState } from '@/components/ui/LoadState'
import { placeDetailsPath } from '@/routes/paths'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { pluralize } from '@/utils/formatters'

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
  /** Depois da lista (ex.: botão "Carregar mais"). */
  footer?: ReactNode
}

/**
 * Lista "Por perto" ao lado do mapa (mockup Desktop · Mapa).
 * Tocar num card seleciona o local (destaca o pino e centraliza o mapa);
 * a seta à direita abre os Detalhes.
 */
export function NearbyPanel({
  totalCount,
  places,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  isPending = false,
  footer,
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
        <ul className="mt-4 flex flex-col gap-2.5">
          {places.map((place) => {
            const selected = place.placeId === selectedId
            return (
              <li key={place.placeId} ref={selected ? selectedRef : undefined}>
                <PlaceRow
                  place={place}
                  media="none"
                  selected={selected}
                  onSelect={() => onSelect(place.placeId)}
                  actions={<DetailsArrow place={place} />}
                />
              </li>
            )
          })}
        </ul>
      )}
      {!isPending && footer}
      <DataAttribution className="mt-auto pt-6" />
    </section>
  )
}

/** Seta para os Detalhes: um link separado do card (que, aqui, seleciona). */
function DetailsArrow({ place }: { place: BurgerPlace }) {
  return (
    <Link
      to={placeDetailsPath(place.placeId)}
      aria-label={`Ver detalhes de ${place.name}`}
      className={cn(
        'grid w-12 shrink-0 place-items-center border-l-2 border-tostado/15 text-tostado transition hover:bg-mostarda/30',
        'focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-ketchup',
      )}
    >
      <ChevronRight aria-hidden="true" className="size-5" strokeWidth={2.5} />
    </Link>
  )
}
