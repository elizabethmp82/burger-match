import { Trash2 } from 'lucide-react'
import { PlaceRow } from '@/components/place/PlaceRow'
import type { BurgerPlace } from '@/types/place.types'

interface FavoriteCardProps {
  place: BurgerPlace
  onRemove: (place: BurgerPlace) => void
  /** Desktop: seleciona em vez de navegar. */
  onSelect?: (() => void) | undefined
  selected?: boolean
}

/**
 * Linha de um favorito. Celular/tablet: tocar abre os Detalhes.
 * Desktop: tocar seleciona o local no painel ao lado (onSelect).
 * Em todas as larguras, a lixeira com rótulo explícito remove
 * (docs/scope.md §3.3 — sem coração redundante na foto).
 */
export function FavoriteCard({ place, onRemove, onSelect, selected = false }: FavoriteCardProps) {
  return (
    <li>
      <PlaceRow
        place={place}
        onSelect={onSelect}
        selected={selected}
        compact={onSelect !== undefined}
        actions={
          <button
            type="button"
            onClick={() => onRemove(place)}
            aria-label={`Remover ${place.name} dos favoritos`}
            className="grid w-12 shrink-0 place-items-center border-l-2 border-tostado/15 text-texto-suave transition hover:bg-ketchup/10 hover:text-ketchup-forte focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-ketchup"
          >
            <Trash2 aria-hidden="true" className="size-5" strokeWidth={2.25} />
          </button>
        }
      />
    </li>
  )
}
