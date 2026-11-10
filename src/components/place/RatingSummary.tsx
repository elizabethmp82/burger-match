import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { formatCount, formatPriceLevel } from '@/utils/formatters'
import { PlaceMeta } from './PlaceMeta'

/** ★ 4,8 · 1.234 avaliações · $$ — versão por extenso, para Detalhes e painéis. */
export function RatingSummary({ place, className }: { place: BurgerPlace; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-1.5 text-texto-suave', className)}>
      <PlaceMeta place={place} showDistance={false} />
      {place.reviewCount !== undefined && (
        <span>
          <span aria-hidden="true">· </span>
          {formatCount(place.reviewCount)} avaliações
        </span>
      )}
      {place.priceLevel !== undefined && (
        <span>
          <span aria-hidden="true">· </span>
          <span className="sr-only">Preço </span>
          {formatPriceLevel(place.priceLevel)}
        </span>
      )}
    </div>
  )
}
