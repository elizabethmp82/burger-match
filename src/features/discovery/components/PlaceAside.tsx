import { Clock, MapPin, Navigation } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link } from 'react-router'
import { OpenStatus } from '@/components/place/OpenStatus'
import { PhotoTile } from '@/components/place/PhotoTile'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { DataAttribution } from '@/components/ui/DataAttribution'
import { MiniMap } from '@/features/map/components/MiniMap'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'
import { placeDetailsPath } from '@/routes/paths'
import type { Coordinates } from '@/types/location.types'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { formatDistance } from '@/utils/formatters'
import { directionsUrl } from '@/utils/googleMaps'

const THUMBNAILS = 3

const LiveMiniMap = lazy(() => import('@/features/map/components/LiveMiniMap'))

interface PlaceAsideProps {
  place: BurgerPlace
  /** Centro da região de busca (onde está o usuário no minimapa). */
  origin: Coordinates
  className?: string
}

/**
 * Painel "Sobre este lugar" do Descobrir no desktop (mockup Desktop · Descobrir):
 * fotos, endereço, horários, minimapa e rota. Complementa o card sem repeti-lo.
 */
export function PlaceAside({ place, origin, className }: PlaceAsideProps) {
  const photos = place.photos ?? []
  const thumbnails = photos.slice(0, THUMBNAILS)
  const hiddenPhotos = photos.length - THUMBNAILS
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  return (
    <aside
      aria-labelledby="place-aside-title"
      className={cn(
        'w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l-2 border-tostado bg-superficie p-6 xl:w-[26rem] xl:p-8',
        className,
      )}
    >
      <h2
        id="place-aside-title"
        className="font-sans text-sm font-bold tracking-[0.12em] text-texto-suave uppercase"
      >
        Sobre este lugar
        <span className="sr-only">: {place.name}</span>
      </h2>

      {thumbnails.length > 0 && (
        <Link
          to={placeDetailsPath(place.placeId)}
          aria-label={`Ver as ${photos.length} fotos de ${place.name}`}
          className="grid grid-cols-3 gap-2 rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ketchup"
        >
          {thumbnails.map((photo, index) => {
            const showMore = index === THUMBNAILS - 1 && hiddenPhotos > 0
            return (
              <span
                key={photo.id}
                className="relative aspect-[6/5] overflow-hidden rounded-2xl border-2 border-tostado"
              >
                <PhotoTile
                  photo={photo}
                  index={index}
                  alt=""
                  className="size-full"
                  iconClassName="size-5"
                />
                {showMore && (
                  <span className="absolute inset-0 grid place-items-center bg-tostado/40 text-lg font-bold text-white">
                    +{hiddenPhotos}
                  </span>
                )}
              </span>
            )
          })}
        </Link>
      )}

      <div className="flex flex-col gap-3">
        <p className="flex items-start gap-3">
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

        {place.openingHours && place.openingHours.length > 0 ? (
          <div className="flex items-start gap-3">
            <Clock
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-alface-forte"
              strokeWidth={2.25}
            />
            <div>
              <span className="sr-only">Horário de funcionamento: </span>
              <ul>
                {place.openingHours.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          // Sem a grade de horários, mostra ao menos o status atual (se existir — RN11).
          <OpenStatus place={place} variant="detailed" />
        )}
      </div>

      {/*
        Desktop: minimapa real, baixado sob demanda. Enquanto carrega (e no celular,
        onde este painel fica escondido), vale o ilustrativo — sem baixar a biblioteca à toa.
      */}
      {isDesktop ? (
        <Suspense
          fallback={<MiniMap center={origin} destination={place.location} className="h-40" />}
        >
          <LiveMiniMap center={origin} destination={place.location} className="h-40" />
        </Suspense>
      ) : (
        <MiniMap center={origin} destination={place.location} className="h-40" />
      )}

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

      <DataAttribution className="mt-auto" />
    </aside>
  )
}
