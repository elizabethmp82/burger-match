import { ChevronLeft, Globe, Heart, MapPin, Navigation, Phone, SearchX, Share } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { OpenStatus } from '@/components/place/OpenStatus'
import { PhotoTile } from '@/components/place/PhotoTile'
import { RatingSummary } from '@/components/place/RatingSummary'
import { buttonClasses, iconButtonClasses } from '@/components/ui/buttonStyles'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFavorites } from '@/features/favorites/hooks/useFavorites'
import { useGoBack } from '@/hooks/useGoBack'
import { usePlace } from '@/hooks/usePlaces'
import { paths } from '@/routes/paths'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { formatDistance } from '@/utils/formatters'
import { directionsUrl } from '@/utils/googleMaps'
import { shareLink, shareResultMessage } from '@/utils/share'
import { PhotoGallery } from '../components/PhotoGallery'

/** Estilo comum de Ligar / Site / Compartilhar (dividem a largura igualmente). */
const secondaryAction = buttonClasses('secondary', 'flex-1 flex-col gap-1 px-2 text-sm')

export function PlaceDetailsPage() {
  const { placeId } = useParams<{ placeId: string }>()
  const place = usePlace(placeId)
  const goBack = useGoBack(paths.discover)

  if (!place) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-6">
        <BackButton onClick={goBack} />
        <EmptyState
          icon={SearchX}
          title="Local não encontrado"
          description="Esta hamburgueria não está disponível. Ela pode ter saído do Google Maps ou o link está incorreto."
        >
          <button type="button" onClick={goBack} className={buttonClasses('primary', 'w-full')}>
            Voltar
          </button>
        </EmptyState>
      </main>
    )
  }

  // A key reinicia a foto selecionada ao navegar de um local para outro.
  return <PlaceDetails key={place.placeId} place={place} onBack={goBack} />
}

function PlaceDetails({ place, onBack }: { place: BurgerPlace; onBack: () => void }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [photoIndex, setPhotoIndex] = useState(0)
  const [announcement, setAnnouncement] = useState('')

  const photos = place.photos ?? []
  const photo = photos[photoIndex]
  const favorite = isFavorite(place.placeId)

  function handleToggleFavorite() {
    toggleFavorite(place.placeId)
    setAnnouncement(
      favorite ? `${place.name} removida dos favoritos.` : `${place.name} salva nos favoritos.`,
    )
  }

  async function handleShare() {
    const result = await shareLink(place.name, window.location.href)
    setAnnouncement(shareResultMessage(result))
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md">
      <div className="relative h-72">
        <PhotoTile
          photo={photo}
          index={photoIndex}
          alt={`Foto de ${place.name}`}
          label={photo ? 'Foto do local' : undefined}
          className="size-full"
          iconClassName="size-10"
        />
        <div className="absolute inset-x-0 top-0 flex justify-between p-4">
          <BackButton onClick={onBack} />
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-pressed={favorite}
            aria-label={favorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            className={iconButtonClasses(
              cn(
                'size-11',
                favorite ? 'bg-ketchup-forte text-white' : 'bg-superficie text-tostado',
              ),
            )}
          >
            <Heart
              aria-hidden="true"
              className={cn('size-5', favorite && 'fill-current')}
              strokeWidth={2.5}
            />
          </button>
        </div>
        {photo && (
          <span className="absolute bottom-10 left-4 rounded-md bg-tostado/80 px-2 py-0.5 text-xs font-semibold text-white">
            Foto: {photo.authorName} · {photoIndex + 1} de {photos.length}
          </span>
        )}
      </div>

      <section className="relative -mt-6 flex flex-col gap-4 rounded-t-3xl border-t-2 border-tostado bg-creme px-5 pt-6 pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl leading-tight tracking-logo">{place.name}</h1>
          <RatingSummary place={place} />
        </div>

        <div className="flex flex-col gap-2">
          <OpenStatus place={place} variant="detailed" />
          <p className="flex items-start gap-2">
            <MapPin
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-ketchup-forte"
              strokeWidth={2.25}
            />
            <span>
              {place.address}
              {place.distanceMeters !== undefined && (
                <span className="text-texto-suave"> · {formatDistance(place.distanceMeters)}</span>
              )}
            </span>
          </p>
        </div>

        <a
          href={place.googleMapsUrl ?? directionsUrl(place.location)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses('primary', 'w-full')}
        >
          <Navigation aria-hidden="true" className="size-5" strokeWidth={2.5} />
          Ver rota no Maps
          <span className="sr-only"> (abre em nova aba)</span>
        </a>

        {/* Ligar e Site só aparecem se o local tiver esses dados. */}
        <div className="flex gap-3">
          {place.phoneNumber && (
            <a href={`tel:${place.phoneNumber.replace(/[^\d+]/g, '')}`} className={secondaryAction}>
              <Phone aria-hidden="true" className="size-5" strokeWidth={2.25} />
              Ligar
            </a>
          )}
          {place.websiteUrl && (
            <a
              href={place.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryAction}
            >
              <Globe aria-hidden="true" className="size-5" strokeWidth={2.25} />
              Site
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          )}
          <button type="button" onClick={() => void handleShare()} className={secondaryAction}>
            <Share aria-hidden="true" className="size-5" strokeWidth={2.25} />
            Compartilhar
          </button>
        </div>

        {photos.length > 0 && (
          <section aria-labelledby="photos-title" className="mt-2 flex flex-col gap-3">
            <h2 id="photos-title" className="text-2xl tracking-logo">
              Fotos
            </h2>
            <PhotoGallery
              photos={photos}
              placeName={place.name}
              selectedIndex={photoIndex}
              onSelect={setPhotoIndex}
            />
          </section>
        )}

        <p className="text-xs text-texto-suave">Dados simulados para desenvolvimento.</p>
      </section>

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </main>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Voltar"
      className={iconButtonClasses('size-11 bg-superficie text-tostado hover:bg-white')}
    >
      <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2.5} />
    </button>
  )
}
