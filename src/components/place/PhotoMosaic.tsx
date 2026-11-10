import { Link } from 'react-router'
import { placeDetailsPath } from '@/routes/paths'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { PhotoTile } from './PhotoTile'

const tile = 'relative overflow-hidden rounded-3xl border-2 border-tostado'

/**
 * Mosaico de fotos do painel de detalhe (mockup Desktop · Favoritos):
 * uma foto grande à esquerda e até duas menores à direita; a última indica
 * quantas faltam ("+6 fotos") e leva à página de Detalhes.
 */
export function PhotoMosaic({ place }: { place: BurgerPlace }) {
  const photos = place.photos ?? []
  const [main, ...rest] = photos
  const side = rest.slice(0, 2)
  /** Fotos que não aparecem nem no mosaico. */
  const notShown = photos.length - 1 - side.length

  return (
    <div className="grid h-72 grid-cols-3 grid-rows-2 gap-3 xl:h-80">
      <PhotoTile
        photo={main}
        alt={`Foto de ${place.name}`}
        label={main ? 'Foto do local' : undefined}
        className={cn(tile, side.length > 0 ? 'col-span-2' : 'col-span-3', 'row-span-2')}
        iconClassName="size-10"
      />

      {side.map((photo, index) => {
        const isLast = index === side.length - 1
        const showMore = isLast && notShown > 0

        return showMore ? (
          <Link
            key={photo.id}
            to={placeDetailsPath(place.placeId)}
            aria-label={`Ver todas as ${photos.length} fotos de ${place.name}`}
            className={cn(
              tile,
              side.length === 1 && 'row-span-2',
              'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ketchup',
            )}
          >
            <PhotoTile
              photo={photo}
              index={index + 1}
              alt=""
              className="size-full"
              iconClassName="hidden"
            />
            {/* O tile "+N" cobre uma foto, então ela também conta como oculta. */}
            <span className="absolute inset-0 grid place-items-center bg-tostado/40 text-lg font-bold text-white">
              +{notShown + 1} fotos
            </span>
          </Link>
        ) : (
          <PhotoTile
            key={photo.id}
            photo={photo}
            index={index + 1}
            alt={`Foto ${index + 2} de ${place.name}`}
            className={cn(tile, side.length === 1 && 'row-span-2')}
            iconClassName="size-6"
          />
        )
      })}
    </div>
  )
}
