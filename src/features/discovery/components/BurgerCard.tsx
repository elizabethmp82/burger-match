import { useState } from 'react'
import { Link } from 'react-router'
import { OpenStatus } from '@/components/place/OpenStatus'
import { PhotoCredit } from '@/components/place/PhotoCredit'
import { PhotoTile } from '@/components/place/PhotoTile'
import { PlaceMeta } from '@/components/place/PlaceMeta'
import { placeDetailsPath } from '@/routes/paths'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'

/** Máximo de tracinhos no indicador de fotos (como nos stories). */
const MAX_PHOTO_INDICATORS = 5

/**
 * Card do topo do baralho. Tocar na foto mostra a próxima; tocar no texto abre
 * os Detalhes. Use `key={placeId}` no pai: ao trocar de local, a foto volta à 1ª.
 */
export function BurgerCard({ place }: { place: BurgerPlace }) {
  const photos = place.photos ?? []
  const shownPhotos = photos.slice(0, MAX_PHOTO_INDICATORS)
  const [photoIndex, setPhotoIndex] = useState(0)
  const photo = shownPhotos[photoIndex]

  return (
    <article
      aria-label={place.name}
      className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl border-2 border-tostado bg-superficie shadow-offset"
    >
      <div className="relative min-h-32 flex-1 border-b-2 border-tostado">
        <PhotoTile
          photo={photo}
          index={photoIndex}
          alt={`Foto de ${place.name}`}
          label={photo ? 'Foto do local' : undefined}
          className="size-full"
          iconClassName="size-10"
        />

        {shownPhotos.length > 1 && (
          <>
            <div className="pointer-events-none absolute inset-x-4 top-3 flex gap-1.5">
              {shownPhotos.map((item, index) => (
                <span
                  key={item.id}
                  className={cn(
                    'h-1 flex-1 rounded-full',
                    index === photoIndex ? 'bg-tostado' : 'bg-tostado/30',
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPhotoIndex((index) => (index + 1) % shownPhotos.length)}
              className="absolute inset-0 focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-ketchup"
            >
              <span className="sr-only">
                Ver próxima foto ({photoIndex + 1} de {shownPhotos.length})
              </span>
            </button>
          </>
        )}

        {photo && (
          // z-10: fica acima do botão "próxima foto", para o link do autor ser clicável.
          <span className="absolute right-3 bottom-3 z-10 rounded-md bg-tostado/80 px-2 py-0.5 text-xs font-semibold text-white">
            <PhotoCredit photo={photo} />
          </span>
        )}
      </div>

      <Link
        to={placeDetailsPath(place.placeId)}
        className="group flex flex-col gap-2 px-5 pt-4 pb-5 focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-ketchup"
      >
        <h2 className="text-3xl leading-tight tracking-logo group-hover:underline">{place.name}</h2>
        <PlaceMeta place={place} showReviewCount showPrice />
        <OpenStatus place={place} variant="badge" />
        {/* No desktop o endereço vai para o painel "Sobre este lugar". */}
        <p className="text-texto-suave lg:hidden">{place.address}</p>
        <span className="sr-only">Ver detalhes</span>
      </Link>
    </article>
  )
}
