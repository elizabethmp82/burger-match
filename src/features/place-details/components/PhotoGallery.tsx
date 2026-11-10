import { useState } from 'react'
import { PhotoTile } from '@/components/place/PhotoTile'
import type { PlacePhoto } from '@/types/place.types'
import { cn } from '@/utils/cn'

const COLLAPSED_COUNT = 3

interface PhotoGalleryProps {
  photos: readonly PlacePhoto[]
  placeName: string
  selectedIndex: number
  onSelect: (index: number) => void
}

/**
 * Miniaturas das fotos. Tocar em uma a mostra no topo da página.
 * Mostra 3; a última indica quantas faltam ("+5") e expande a grade.
 */
export function PhotoGallery({ photos, placeName, selectedIndex, onSelect }: PhotoGalleryProps) {
  const [expanded, setExpanded] = useState(false)
  const hiddenCount = photos.length - COLLAPSED_COUNT
  const canExpand = !expanded && hiddenCount > 0
  const visible = expanded ? photos : photos.slice(0, COLLAPSED_COUNT)

  return (
    <ul className="grid grid-cols-3 gap-2.5">
      {visible.map((photo, index) => {
        const isMoreTile = canExpand && index === COLLAPSED_COUNT - 1

        return (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => (isMoreTile ? setExpanded(true) : onSelect(index))}
              aria-label={
                isMoreTile
                  ? `Ver mais ${hiddenCount} fotos`
                  : `Mostrar foto ${index + 1} de ${photos.length}`
              }
              aria-current={!isMoreTile && index === selectedIndex ? 'true' : undefined}
              className={cn(
                'relative block aspect-square w-full overflow-hidden rounded-2xl border-2 border-tostado',
                'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ketchup',
                !isMoreTile && index === selectedIndex && 'ring-3 ring-mostarda',
              )}
            >
              <PhotoTile
                photo={photo}
                index={index}
                alt={`Foto ${index + 1} de ${placeName}`}
                className="size-full"
                iconClassName={isMoreTile ? 'hidden' : 'size-6'}
              />
              {isMoreTile && (
                <span className="absolute inset-0 grid place-items-center bg-tostado/40 text-xl font-bold text-white">
                  +{hiddenCount}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
