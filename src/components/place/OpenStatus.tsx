import { Clock } from 'lucide-react'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'

type OpenStatusVariant = 'compact' | 'badge' | 'detailed'

interface OpenStatusProps {
  place: Pick<BurgerPlace, 'openNow' | 'nextStatusChange'>
  /**
   * compact  → "Aberto · fecha 23:00" (listas)
   * badge    → [Aberto agora] Fecha às 23:00 (card de Descobrir)
   * detailed → ⏱ Aberto agora · fecha às 23:00 (Detalhes)
   */
  variant: OpenStatusVariant
  className?: string
}

/** Status de funcionamento. Não renderiza nada se a informação não existir (RN11). */
export function OpenStatus({ place, variant, className }: OpenStatusProps) {
  const { openNow, nextStatusChange } = place
  if (openNow === undefined) return null

  const color = openNow ? 'text-alface-forte' : 'text-ketchup-forte'
  const changeVerb = openNow ? 'fecha' : 'abre'

  if (variant === 'compact') {
    return (
      <p className={cn('text-sm font-bold', color, className)}>
        {openNow ? 'Aberto' : 'Fechado'}
        {nextStatusChange && ` · ${changeVerb} ${nextStatusChange}`}
      </p>
    )
  }

  if (variant === 'badge') {
    return (
      <p className={cn('flex flex-wrap items-center gap-2 text-sm', className)}>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 font-bold',
            openNow ? 'bg-alface/15' : 'bg-ketchup/10',
            color,
          )}
        >
          {openNow ? 'Aberto agora' : 'Fechado agora'}
        </span>
        {nextStatusChange && (
          <span className="text-texto-suave">
            {openNow ? 'Fecha' : 'Abre'} às {nextStatusChange}
          </span>
        )}
      </p>
    )
  }

  return (
    <p className={cn('flex items-center gap-2', className)}>
      <Clock aria-hidden="true" className={cn('size-5 shrink-0', color)} strokeWidth={2.25} />
      <span>
        <span className={cn('font-bold', color)}>{openNow ? 'Aberto agora' : 'Fechado agora'}</span>
        {nextStatusChange && (
          <span className="text-texto-suave">
            {' '}
            · {changeVerb} às {nextStatusChange}
          </span>
        )}
      </span>
    </p>
  )
}
