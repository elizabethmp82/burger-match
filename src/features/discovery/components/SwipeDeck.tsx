import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { BurgerCard } from './BurgerCard'

interface SwipeDeckProps {
  current: BurgerPlace
  /** Quantos cards ainda restam (incluindo o atual): define as camadas de fundo. */
  remainingCount: number
}

/**
 * Pilha de cards. As camadas de trás são decorativas e mostram que há mais cards.
 * Na Etapa 5 este componente recebe os gestos de swipe (Hammer.js).
 */
export function SwipeDeck({ current, remainingCount }: SwipeDeckProps) {
  // Com foto — celular: ocupa a altura livre (layout aprovado); tablet+: até 400 × 544px.
  // Sem foto: card mais baixo (só a faixa da marca + texto), sem espaço vazio.
  // No celular, mt-auto (aqui) + mb-auto (na atribuição) centralizam card e botões.
  const hasPhotos = (current.photos?.length ?? 0) > 0
  return (
    <div
      className={cn(
        'relative mx-1 md:mx-auto md:w-full md:max-w-[25rem]',
        hasPhotos ? 'min-h-96 flex-1 md:max-h-[34rem]' : 'h-[22rem] flex-none max-md:mt-auto',
      )}
    >
      {remainingCount > 2 && (
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-y-2 -rotate-3 rounded-3xl border-2 border-tostado bg-mostarda"
        />
      )}
      {remainingCount > 1 && (
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-y-1 rotate-2 rounded-3xl border-2 border-tostado bg-superficie"
        />
      )}
      <BurgerCard key={current.placeId} place={current} />
    </div>
  )
}
