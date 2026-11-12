import { ChevronLeft, Globe, Heart, MapPin, Navigation, Phone, SearchX, Share } from 'lucide-react'
import { useRef, useState } from 'react'
import { useParams } from 'react-router'
import { OpenStatus } from '@/components/place/OpenStatus'
import { PlaceDetailsPanel } from '@/components/place/PlaceDetailsPanel'
import { PhotoCredit } from '@/components/place/PhotoCredit'
import { BrandBand } from '@/components/place/BrandBand'
import { PhotoTile } from '@/components/place/PhotoTile'
import { RatingSummary } from '@/components/place/RatingSummary'
import { buttonClasses, iconButtonClasses } from '@/components/ui/buttonStyles'
import { DataAttribution } from '@/components/ui/DataAttribution'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState, LoadingState } from '@/components/ui/LoadState'
import { isDemoMode } from '@/config/env'
import { useFavorites } from '@/features/favorites/hooks/useFavorites'
import { useGoBack } from '@/hooks/useGoBack'
import { TABLET_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'
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

/**
 *   Celular: foto no topo + "folha" com as informações (layout aprovado).
 *   Tablet/desktop: painel de detalhe (o mesmo de Favoritos) + galeria completa.
 */
export function PlaceDetailsPage() {
  const { placeId } = useParams<{ placeId: string }>()
  const { place, isPending, isError, errorMessage, retry } = usePlace(placeId)
  const goBack = useGoBack(paths.discover)
  const isTablet = useMediaQuery(TABLET_QUERY)

  if (isPending || isError) {
    return (
      <div className="page-container flex min-h-full flex-col pt-6 md:max-w-2xl">
        <BackButton onClick={goBack} />
        <h1 className="sr-only">Detalhes da hamburgueria</h1>
        {isPending ? (
          <LoadingState label="Carregando detalhes…" className="flex-1" />
        ) : (
          <ErrorState onRetry={retry} description={errorMessage} />
        )}
      </div>
    )
  }

  if (!place) {
    return (
      <div className="page-container flex min-h-full flex-col pt-6 md:max-w-2xl">
        <BackButton onClick={goBack} />
        <EmptyState
          icon={SearchX}
          titleAs="h1"
          title="Local não encontrado"
          description="Esta hamburgueria não está disponível. Ela pode ter saído do Google Maps ou o link está incorreto."
        >
          <button type="button" onClick={goBack} className={buttonClasses('primary', 'w-full')}>
            Voltar
          </button>
        </EmptyState>
      </div>
    )
  }

  // A key reinicia o estado interno (foto selecionada etc.) ao trocar de local.
  return isTablet ? (
    <WidePlaceDetails key={place.placeId} place={place} onBack={goBack} />
  ) : (
    <PlaceDetails key={place.placeId} place={place} onBack={goBack} />
  )
}

/**
 * Tablet e desktop: Voltar + o mesmo painel do Favoritos (desktop) + galeria completa.
 * Largura limitada para manter a leitura confortável e as fotos em boa proporção.
 */
function WidePlaceDetails({ place, onBack }: { place: BurgerPlace; onBack: () => void }) {
  const galleryRef = useRef<HTMLElement>(null)
  const photos = place.photos ?? []

  function showAllPhotos() {
    const gallery = galleryRef.current
    if (!gallery) return
    // Foco primeiro (sem rolar): focar depois pode interromper a rolagem suave.
    // O foco leva leitores de tela e teclado direto para a galeria.
    gallery.focus({ preventScroll: true })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    gallery.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className="page-container max-w-4xl pt-6 pb-10 lg:pt-8">
      <BackButton onClick={onBack} />

      <div className="mt-5">
        <PlaceDetailsPanel
          place={place}
          titleAs="h1"
          onShowAllPhotos={photos.length > 3 ? showAllPhotos : undefined}
        />
      </div>

      {photos.length > 1 && (
        <section
          ref={galleryRef}
          tabIndex={-1}
          aria-labelledby="all-photos-title"
          className="mt-10 scroll-mt-6 outline-none"
        >
          <h2 id="all-photos-title" className="text-2xl tracking-logo">
            Fotos{' '}
            <span className="font-sans text-base font-semibold text-texto-suave">
              ({photos.length})
            </span>
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo, index) => (
              <li key={photo.id}>
                <figure>
                  <PhotoTile
                    photo={photo}
                    index={index}
                    alt={`Foto ${index + 1} de ${place.name}`}
                    className="aspect-square w-full rounded-2xl border-2 border-tostado"
                    iconClassName="size-6"
                  />
                  {/* Crédito do autor em cada foto (exigência de atribuição do Google). */}
                  <figcaption className="mt-1.5 text-xs text-texto-suave">
                    <PhotoCredit photo={photo} />
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
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
    // Celular (layout aprovado). A largura de 448px já vem do AppLayout.
    <div className="min-h-full">
      {/* Sem fotos: faixa da marca mais baixa, só para os botões de voltar e favoritar. */}
      <div className={cn('relative', photos.length > 0 ? 'h-72' : 'h-36')}>
        {photos.length > 0 ? (
          <PhotoTile
            photo={photo}
            index={photoIndex}
            alt={`Foto de ${place.name}`}
            label={photo ? 'Foto do local' : undefined}
            className="size-full"
            iconClassName="size-10"
          />
        ) : (
          <BrandBand className="size-full pb-6" iconClassName="size-10" />
        )}
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
            <PhotoCredit photo={photo} suffix={` · ${photoIndex + 1} de ${photos.length}`} />
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
          href={directionsUrl(place.location)}
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

        {isDemoMode ? (
          <p className="text-xs text-texto-suave">Dados simulados para desenvolvimento.</p>
        ) : (
          <DataAttribution />
        )}
      </section>

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
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
