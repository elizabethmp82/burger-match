import { Star } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { formatCount, formatDistance, formatPriceLevel, formatRating } from '@/utils/formatters'

interface PlaceMetaProps {
  place: BurgerPlace
  showReviewCount?: boolean
  showPrice?: boolean
  showDistance?: boolean
  className?: string
}

/**
 * Linha de resumo: ★ 4,8 (1.234) · $$ · 1,2 km.
 * Cada parte só aparece se o dado existir; os separadores se ajustam sozinhos.
 */
export function PlaceMeta({
  place,
  showReviewCount = false,
  showPrice = false,
  showDistance = true,
  className,
}: PlaceMetaProps) {
  const parts: Array<{ key: string; node: ReactNode }> = []

  if (place.rating !== undefined) {
    parts.push({
      key: 'rating',
      node: (
        <span className="inline-flex items-center gap-1">
          <Star aria-hidden="true" className="size-4 fill-mostarda text-tostado" strokeWidth={2} />
          <span className="font-bold text-tostado">
            <span className="sr-only">Nota </span>
            {formatRating(place.rating)}
          </span>
          {showReviewCount && place.reviewCount !== undefined && (
            <span>
              ({formatCount(place.reviewCount)}
              <span className="sr-only"> avaliações</span>)
            </span>
          )}
        </span>
      ),
    })
  }

  if (showPrice && place.priceLevel !== undefined) {
    parts.push({
      key: 'price',
      node: (
        <span>
          <span className="sr-only">Preço </span>
          {formatPriceLevel(place.priceLevel)}
        </span>
      ),
    })
  }

  if (showDistance && place.distanceMeters !== undefined) {
    parts.push({
      key: 'distance',
      node: (
        <span className="font-semibold text-tostado">
          <span className="sr-only">Distância </span>
          {formatDistance(place.distanceMeters)}
        </span>
      ),
    })
  }

  if (parts.length === 0) return null

  return (
    <p className={cn('flex flex-wrap items-center gap-x-1.5 text-texto-suave', className)}>
      {parts.map(({ key, node }, index) => (
        <Fragment key={key}>
          {index > 0 && <span aria-hidden="true">·</span>}
          {node}
        </Fragment>
      ))}
    </p>
  )
}
