import { useImperativeHandle, type Ref } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { useSwipe } from '../hooks/useSwipe'
import { dragRotation, swipeProgress, type SwipeDirection } from '../utils/swipeGesture'
import { BurgerCard } from './BurgerCard'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** Selos que aparecem enquanto o card é arrastado (decorativos: a ação é anunciada depois). */
const STAMPS: Record<SwipeDirection, { label: string; className: string }> = {
  right: {
    label: 'Curtir',
    className: 'top-6 left-5 -rotate-12 border-alface-forte text-alface-forte',
  },
  left: {
    label: 'Pular',
    className: 'top-6 right-5 rotate-12 border-ketchup-forte text-ketchup-forte',
  },
  up: {
    label: 'Detalhes',
    className: 'bottom-8 left-1/2 -translate-x-1/2 border-tostado text-tostado',
  },
}

/** Controle do card pelo pai: botões e teclado pedem o mesmo voo do gesto. */
export interface SwipeableCardHandle {
  fly: (direction: SwipeDirection) => void
}

interface SwipeableCardProps {
  place: BurgerPlace
  onSwipe: (direction: SwipeDirection) => void
  ref?: Ref<SwipeableCardHandle> | undefined
}

/**
 * Card do topo com gestos: direita curte, esquerda pula, para cima abre os Detalhes.
 * Use `key={placeId}` no pai: cada card começa parado no lugar.
 */
export function SwipeableCard({ place, onSwipe, ref }: SwipeableCardProps) {
  const reduceMotion = useMediaQuery(REDUCED_MOTION_QUERY)
  // Desestruturado: o ref do elemento vai direto para o JSX, sem ser lido na renderização.
  const {
    ref: elementRef,
    fly,
    offset,
    size,
    isDragging,
    isLeaving,
    handlers,
  } = useSwipe({ onSwipe, reduceMotion })
  useImperativeHandle(ref, () => ({ fly }), [fly])

  const rotation = reduceMotion ? 0 : dragRotation(offset.x, size.width)
  const progress = swipeProgress(offset.x, offset.y, size.width, size.height)

  return (
    <div
      ref={elementRef}
      {...handlers}
      // touch-action: none — no celular, o navegador não rola a página nem dá zoom
      // ao arrastar o card; os movimentos vêm todos para o gesto.
      className={cn(
        'absolute inset-0 touch-none select-none',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        !isDragging && 'transition-[transform,opacity] duration-200 ease-out',
        isLeaving && 'pointer-events-none opacity-0',
      )}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
      }}
    >
      <BurgerCard place={place} />

      {(Object.keys(STAMPS) as SwipeDirection[]).map((direction) => (
        <span
          key={direction}
          aria-hidden="true"
          style={{ opacity: progress[direction] }}
          className={cn(
            'pointer-events-none absolute z-20 rounded-xl border-4 bg-superficie/90 px-3 py-1',
            'font-display text-2xl font-extrabold tracking-logo uppercase',
            STAMPS[direction].className,
          )}
        >
          {STAMPS[direction].label}
        </span>
      ))}
    </div>
  )
}
