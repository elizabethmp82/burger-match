/**
 * Regras do gesto de swipe (funções puras, sem React nem DOM: fáceis de testar).
 *
 * - direita  → curtir (RN05)
 * - esquerda → pular (RN06)
 * - cima     → abrir os Detalhes
 *
 * Um gesto vale quando passa de uma DISTÂNCIA mínima (proporcional ao card) ou
 * quando é um "peteleco" rápido (velocidade alta, mesmo que curto).
 */

export type SwipeDirection = 'right' | 'left' | 'up'

export const SWIPE_RULES = {
  /** Abaixo disso o toque é um clique normal (abre Detalhes/próxima foto). */
  tapTolerancePx: 8,
  /** Fração da largura do card para valer o swipe lateral. */
  horizontalRatio: 0.35,
  /** Fração da altura do card para valer o swipe para cima. */
  verticalRatio: 0.25,
  /** Velocidade de "peteleco", em px por milissegundo. */
  flickVelocity: 0.6,
  /** Mesmo rápido, um peteleco precisa andar pelo menos isto. */
  flickMinDistancePx: 60,
  /** Inclinação máxima do card ao arrastar, em graus. */
  maxRotationDeg: 15,
} as const

export interface SwipeSample {
  /** Deslocamento desde o início do gesto (positivo = direita / baixo). */
  dx: number
  dy: number
  /** Velocidade no fim do gesto, em px/ms (positivo = direita / baixo). */
  vx: number
  vy: number
  /** Tamanho do card. */
  width: number
  height: number
}

/** Saiu da tolerância de toque? (a partir daí é arrasto, não clique). */
export function isDrag(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) > SWIPE_RULES.tapTolerancePx
}

/** Direção do swipe ao soltar o card, ou null (o card volta ao lugar). */
export function resolveSwipe({
  dx,
  dy,
  vx,
  vy,
  width,
  height,
}: SwipeSample): SwipeDirection | null {
  const { horizontalRatio, verticalRatio, flickVelocity, flickMinDistancePx } = SWIPE_RULES

  if (Math.abs(dx) >= Math.abs(dy)) {
    const farEnough = Math.abs(dx) > width * horizontalRatio
    const flick = Math.abs(vx) > flickVelocity && Math.abs(dx) > flickMinDistancePx
    // O peteleco precisa ir na mesma direção do arrasto.
    if (farEnough || (flick && Math.sign(vx) === Math.sign(dx))) return dx > 0 ? 'right' : 'left'
    return null
  }

  if (dy < 0) {
    const farEnough = -dy > height * verticalRatio
    const flick = -vy > flickVelocity && -dy > flickMinDistancePx
    if (farEnough || flick) return 'up'
  }
  // Para baixo não faz nada: o card volta.
  return null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Inclinação do card conforme o arrasto lateral (como uma carta na mão). */
export function dragRotation(dx: number, width: number): number {
  if (width <= 0) return 0
  const max = SWIPE_RULES.maxRotationDeg
  return clamp((dx / width) * max * 2, -max, max)
}

/** Quanto falta para cada direção valer (0 a 1): controla os selos "CURTIR"/"PULAR"/"DETALHES". */
export function swipeProgress(
  dx: number,
  dy: number,
  width: number,
  height: number,
): Record<SwipeDirection, number> {
  const horizontal = Math.abs(dx) >= Math.abs(dy)
  const sideLimit = Math.max(1, width * SWIPE_RULES.horizontalRatio)
  const upLimit = Math.max(1, height * SWIPE_RULES.verticalRatio)
  return {
    right: horizontal ? clamp(dx / sideLimit, 0, 1) : 0,
    left: horizontal ? clamp(-dx / sideLimit, 0, 1) : 0,
    up: horizontal ? 0 : clamp(-dy / upLimit, 0, 1),
  }
}

/** Para onde o card voa ao sair (fora da tela, na direção do gesto). */
export function exitOffset(
  direction: SwipeDirection,
  width: number,
  height: number,
): { x: number; y: number } {
  if (direction === 'up') return { x: 0, y: -height * 1.5 }
  return { x: (direction === 'right' ? 1 : -1) * width * 1.5, y: 0 }
}

interface TimedPoint {
  x: number
  y: number
  time: number
}

/**
 * Velocidade nos últimos ~100 ms do gesto (px/ms).
 * Usar só o trecho final evita que uma pausa no meio "zere" um peteleco.
 */
export function releaseVelocity(
  points: readonly TimedPoint[],
  windowMs = 100,
): { vx: number; vy: number } {
  const last = points.at(-1)
  if (!last) return { vx: 0, vy: 0 }
  const first = points.find((point) => last.time - point.time <= windowMs) ?? last
  const elapsed = last.time - first.time
  if (elapsed <= 0) return { vx: 0, vy: 0 }
  return { vx: (last.x - first.x) / elapsed, vy: (last.y - first.y) / elapsed }
}
