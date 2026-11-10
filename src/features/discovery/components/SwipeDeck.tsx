import type { BurgerPlace } from '@/types/place.types'
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
  // Celular: ocupa a altura livre (layout aprovado).
  // Tablet+: tamanho controlado (até 400 × 544px, como no mockup), centralizado.
  return (
    <div className="relative mx-1 min-h-96 flex-1 md:mx-auto md:max-h-[34rem] md:w-full md:max-w-[25rem]">
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
