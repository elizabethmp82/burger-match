import { useRef, useState, type DragEvent, type MouseEvent, type PointerEvent } from 'react'
import {
  exitOffset,
  isDrag,
  releaseVelocity,
  resolveSwipe,
  type SwipeDirection,
} from '../utils/swipeGesture'

/** Duração da volta/saída do card. Tem que bater com a classe `duration-200`. */
export const SWIPE_ANIMATION_MS = 200

type Phase = 'idle' | 'dragging' | 'returning' | 'leaving'

interface Gesture {
  pointerId: number
  startX: number
  startY: number
  width: number
  height: number
  dragging: boolean
  points: { x: number; y: number; time: number }[]
}

interface UseSwipeOptions {
  onSwipe: (direction: SwipeDirection) => void
  /** Sem animação de saída (prefers-reduced-motion): a ação acontece na hora. */
  reduceMotion: boolean
}

/**
 * Arrastar o card com dedo, mouse ou caneta (Pointer Events, sem biblioteca).
 *
 * - Toque curto continua sendo CLIQUE (abre Detalhes, troca a foto): o ponteiro só é
 *   "capturado" depois que o movimento passa da tolerância de toque.
 * - Depois de um arrasto, o clique que o navegador dispara ao soltar é cancelado.
 * - Botões e setas do teclado usam `fly(direção)`: o mesmo voo do gesto, sem arrastar.
 */
export function useSwipe({ onSwipe, reduceMotion }: UseSwipeOptions) {
  const gesture = useRef<Gesture | null>(null)
  const suppressClick = useRef(false)
  /** O card, para medir o tamanho quando o voo vem de um botão/tecla. */
  const elementRef = useRef<HTMLDivElement>(null)
  /** Já está saindo? (ref: bloqueia teclas repetidas antes de a tela atualizar) */
  const leavingRef = useRef(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [phase, setPhase] = useState<Phase>('idle')

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    // Só botão principal do mouse; nada durante a animação de saída.
    if (event.button !== 0 || leavingRef.current) return
    const box = event.currentTarget.getBoundingClientRect()
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: box.width,
      height: box.height,
      dragging: false,
      points: [{ x: event.clientX, y: event.clientY, time: event.timeStamp }],
    }
    suppressClick.current = false
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY

    if (!current.dragging) {
      if (!isDrag(dx, dy)) return
      // Virou arrasto: a partir daqui o card recebe o ponteiro mesmo fora dele.
      current.dragging = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setSize({ width: current.width, height: current.height })
      setPhase('dragging')
    }

    current.points.push({ x: event.clientX, y: event.clientY, time: event.timeStamp })
    if (current.points.length > 20) current.points.shift()
    setOffset({ x: dx, y: dy })
  }

  function finish(event: PointerEvent<HTMLElement>, cancelled: boolean) {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    gesture.current = null
    if (!current.dragging) return

    suppressClick.current = true
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    const direction = cancelled
      ? null
      : resolveSwipe({
          dx,
          dy,
          ...releaseVelocity(current.points),
          width: current.width,
          height: current.height,
        })

    if (!direction) {
      setPhase('returning')
      setOffset({ x: 0, y: 0 })
      return
    }
    leave(direction, current.width, current.height)
  }

  /** O card voa para fora da tela e, no fim da animação, a ação acontece. */
  function leave(direction: SwipeDirection, width: number, height: number) {
    if (leavingRef.current) return
    leavingRef.current = true
    if (reduceMotion) {
      onSwipe(direction)
      return
    }
    setSize({ width, height })
    setPhase('leaving')
    setOffset(exitOffset(direction, width, height))
    window.setTimeout(() => onSwipe(direction), SWIPE_ANIMATION_MS)
  }

  /** Voo sem arrastar: usado pelos botões e pelas setas do teclado. */
  function fly(direction: SwipeDirection) {
    const box = elementRef.current?.getBoundingClientRect()
    leave(direction, box?.width ?? 0, box?.height ?? 0)
  }

  /** Cancela o clique que vem logo depois de um arrasto (não abre Detalhes sem querer). */
  function onClickCapture(event: MouseEvent<HTMLElement>) {
    if (!suppressClick.current) return
    suppressClick.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  return {
    ref: elementRef,
    fly,
    offset,
    size,
    /** true enquanto o dedo está arrastando (sem transição: o card segue o dedo). */
    isDragging: phase === 'dragging',
    isLeaving: phase === 'leaving',
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLElement>) => finish(event, false),
      onPointerCancel: (event: PointerEvent<HTMLElement>) => finish(event, true),
      onClickCapture,
      // Links e imagens têm o "arrastar e soltar" nativo do navegador, que roubaria o gesto.
      onDragStart: (event: DragEvent<HTMLElement>) => event.preventDefault(),
    },
  }
}
