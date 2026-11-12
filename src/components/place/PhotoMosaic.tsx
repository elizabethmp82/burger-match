import { Link } from 'react-router'
import { placeDetailsPath } from '@/routes/paths'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { BrandBand } from './BrandBand'
import { PhotoCredit } from './PhotoCredit'
import { PhotoTile } from './PhotoTile'

const tile = 'relative overflow-hidden rounded-3xl border-2 border-tostado'

/**
 * Mosaico de fotos do painel de detalhe (mockup Desktop · Favoritos):
 * uma foto grande à esquerda e até duas menores à direita; a última indica
 * quantas faltam ("+6 fotos").
 *
 * Por padrão o "+N" leva à página de Detalhes. Na própria página de Detalhes,
 * passe `onShowAllPhotos` para ele virar um botão (ex.: rolar até a galeria).
 */
export function PhotoMosaic({
  place,
  onShowAllPhotos,
}: {
  place: BurgerPlace
  onShowAllPhotos?: (() => void) | undefined
}) {
  const photos = place.photos ?? []
  const [main, ...rest] = photos
  const side = rest.slice(0, 2)
  /** Fotos que não aparecem nem no mosaico. */
  const notShown = photos.length - 1 - side.length

  // Sem fotos: só a faixa da marca, baixa (nada de "Sem foto" ocupando espaço).
  if (photos.length === 0) {
    return (
      <BrandBand className="h-28 rounded-3xl border-2 border-tostado" iconClassName="size-10" />
    )
  }

  return (
    <div className="grid h-72 grid-cols-3 grid-rows-2 gap-3 xl:h-80">
      <div className={cn(tile, side.length > 0 ? 'col-span-2' : 'col-span-3', 'row-span-2')}>
        <PhotoTile
          photo={main}
          alt={`Foto de ${place.name}`}
          label={main ? 'Foto do local' : undefined}
          className="size-full"
          iconClassName="size-10"
        />
        {main && (
          <span className="absolute bottom-3 left-3 rounded-md bg-tostado/80 px-2 py-0.5 text-xs font-semibold text-white">
            <PhotoCredit photo={main} />
          </span>
        )}
      </div>

      {side.map((photo, index) => {
        const isLast = index === side.length - 1
        const showMore = isLast && notShown > 0

        if (showMore) {
          const moreClassName = cn(
            tile,
            'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ketchup',
          )
          const moreLabel = `Ver todas as ${photos.length} fotos de ${place.name}`
          const moreContent = (
            <>
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
            </>
          )

          return onShowAllPhotos ? (
            <button
              key={photo.id}
              type="button"
              onClick={onShowAllPhotos}
              aria-label={moreLabel}
              className={moreClassName}
            >
              {moreContent}
            </button>
          ) : (
            <Link
              key={photo.id}
              to={placeDetailsPath(place.placeId)}
              aria-label={moreLabel}
              className={moreClassName}
            >
              {moreContent}
            </Link>
          )
        }

        return (
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
