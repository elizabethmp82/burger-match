import { Hamburger } from 'lucide-react'
import { MapPinShape } from '@/components/ui/MapPinShape'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { formatDistance } from '@/utils/formatters'
import type { BoxPosition } from '../utils/projectToBox'

interface PlaceMarkerProps {
  place: BurgerPlace
  position: BoxPosition
  selected: boolean
  onSelect: (placeId: string) => void
}

/** Marcador clicável. O selecionado fica maior, escuro e com o hambúrguer (RN10). */
export function PlaceMarker({ place, position, selected, onSelect }: PlaceMarkerProps) {
  const distance =
    place.distanceMeters !== undefined ? `, a ${formatDistance(place.distanceMeters)}` : ''

  return (
    <button
      type="button"
      onClick={() => onSelect(place.placeId)}
      aria-pressed={selected}
      aria-label={`${place.name}${distance}`}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      className={cn(
        'absolute -translate-x-1/2 -translate-y-full rounded-full transition-transform',
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ketchup',
        selected ? 'z-20 w-16' : 'z-10 w-10 hover:scale-110',
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
  )
}
