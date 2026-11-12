import { Hamburger } from 'lucide-react'
import { MapPinShape } from '@/components/ui/MapPinShape'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { formatDistance } from '@/utils/formatters'
import { SelectedPlaceLabel } from './SelectedPlaceLabel'

interface PlaceMarkerProps {
  place: BurgerPlace
  selected: boolean
  onSelect: (placeId: string) => void
  /** Balão com o nome sobre o pino selecionado (desktop). */
  showLabel?: boolean
}

/**
 * Marcador clicável. O selecionado fica maior, escuro e com o hambúrguer (RN10).
 * Quem posiciona é o mapa (MapLibre): a ponta do pino fica na coordenada do local.
 */
export function PlaceMarker({ place, selected, onSelect, showLabel = false }: PlaceMarkerProps) {
  const distance =
    place.distanceMeters !== undefined ? `, a ${formatDistance(place.distanceMeters)}` : ''

  return (
    <div className="relative">
      {selected && showLabel && <SelectedPlaceLabel place={place} />}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onSelect(place.placeId)
        }}
        aria-pressed={selected}
        aria-label={`${place.name}${distance}`}
        className={cn(
          'relative block origin-bottom rounded-full transition-transform',
          'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ketchup',
          selected ? 'w-16' : 'w-10 hover:scale-110',
        )}
      >
        <MapPinShape
          fillClassName={selected ? 'fill-tostado' : 'fill-ketchup'}
          withDot={!selected}
          className="w-full drop-shadow-sm"
        />
        {selected && (
          <Hamburger
            aria-hidden="true"
            className="absolute top-2.5 left-1/2 size-8 -translate-x-1/2 fill-pao text-mostarda"
            strokeWidth={2}
          />
        )}
      </button>
    </div>
  )
}
