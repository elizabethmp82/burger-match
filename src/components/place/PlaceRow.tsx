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
  /** Ações extras à direita, fora da área principal (ex.: remover dos favoritos). */
  actions?: ReactNode
  /**
   * Se informado, a área principal vira um botão que SELECIONA o local
   * (listas com painel ao lado, no desktop). Sem ele, é um link para os Detalhes.
   */
  onSelect?: (() => void) | undefined
  selected?: boolean
  /** Versão mais baixa (foto menor), para listas em colunas estreitas. */
  compact?: boolean
  className?: string
}

/**
 * Linha-resumo de um local (Favoritos e card do Mapa).
 * As ações ficam ao lado da área principal, e não dentro dela, porque um botão
 * dentro de um link/botão é HTML inválido e confuso para leitores de tela.
 */
export function PlaceRow({
  place,
  showReviewCount = false,
  actions,
  onSelect,
  selected = false,
  compact = false,
  className,
}: PlaceRowProps) {
  const mainClassName =
    'group flex min-w-0 flex-1 items-center gap-3 p-3 text-left focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-ketchup'

  const content = (
    <>
      <PhotoTile
        photo={place.photos?.[0]}
        alt={`Foto de ${place.name}`}
        className={cn('shrink-0 rounded-2xl', compact ? 'size-18' : 'size-20')}
        iconClassName="size-6"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2
          className={cn(
            'line-clamp-2 font-display tracking-logo group-hover:underline',
            // O tamanho segue a largura DA LINHA (@container no <article>), não da tela.
            compact ? 'text-lg' : 'text-lg @sm:text-xl',
          )}
        >
          {place.name}
        </h2>
        <PlaceMeta place={place} showReviewCount={showReviewCount} className="text-sm" />
        <OpenStatus place={place} variant="compact" />
      </div>
      {!onSelect && <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-tostado" />}
    </>
  )

  return (
    <article
      className={cn(
        '@container flex items-stretch overflow-hidden rounded-3xl border-2 border-tostado transition-colors',
        selected ? 'bg-mostarda/20 shadow-offset' : 'bg-superficie',
        className,
      )}
    >
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          aria-current={selected ? 'true' : undefined}
          className={mainClassName}
        >
          {content}
        </button>
      ) : (
        <Link to={placeDetailsPath(place.placeId)} className={mainClassName}>
          {content}
        </Link>
      )}
      {actions}
    </article>
  )
}
