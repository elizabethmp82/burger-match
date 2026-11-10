import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { placeDetailsPath } from '@/routes/paths'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { OpenStatus } from './OpenStatus'
import { PhotoTile } from './PhotoTile'
import { PlaceMeta } from './PlaceMeta'

interface PlaceRowProps {
  place: BurgerPlace
  showReviewCount?: boolean
  /** Ações extras à direita, fora do link (ex.: remover dos favoritos). */
  actions?: ReactNode
  className?: string
}

/**
 * Linha-resumo de um local (Favoritos e card do Mapa).
 * A área principal é um link para os Detalhes; as ações ficam ao lado,
 * porque um botão dentro de um link é HTML inválido e confuso para leitores de tela.
 */
export function PlaceRow({ place, showReviewCount = false, actions, className }: PlaceRowProps) {
  return (
    <article
      className={cn(
        'flex items-stretch overflow-hidden rounded-3xl border-2 border-tostado bg-superficie',
        className,
      )}
    >
      <Link
        to={placeDetailsPath(place.placeId)}
        className="group flex min-w-0 flex-1 items-center gap-4 p-3 focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-ketchup"
      >
        <PhotoTile
          photo={place.photos?.[0]}
          alt={`Foto de ${place.name}`}
          className="size-24 shrink-0 rounded-2xl"
          iconClassName="size-6"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="truncate font-display text-xl tracking-logo group-hover:underline">
            {place.name}
          </h2>
          <PlaceMeta place={place} showReviewCount={showReviewCount} className="text-sm" />
          <OpenStatus place={place} variant="compact" />
        </div>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-tostado" />
      </Link>
      {actions}
    </article>
  )
}
