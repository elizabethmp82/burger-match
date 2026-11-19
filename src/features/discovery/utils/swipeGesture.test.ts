import { describe, expect, it } from 'vitest'
import {
  dragRotation,
  exitOffset,
  isDrag,
  releaseVelocity,
  resolveSwipe,
  swipeProgress,
} from './swipeGesture'

const card = { width: 400, height: 500 }
const still = { vx: 0, vy: 0 }

describe('isDrag', () => {
  it('movimentos pequenos são toque (clique), não arrasto', () => {
    expect(isDrag(3, 4)).toBe(false)
    expect(isDrag(10, 0)).toBe(true)
  })
})

describe('resolveSwipe', () => {
  it('arrastar mais de 35% da largura para a direita → curtir', () => {
    expect(resolveSwipe({ ...card, ...still, dx: 150, dy: 10 })).toBe('right')
  })

  it('para a esquerda → pular', () => {
    expect(resolveSwipe({ ...card, ...still, dx: -150, dy: -20 })).toBe('left')
  })

  it('pouco arrasto e devagar → volta ao lugar', () => {
    expect(resolveSwipe({ ...card, ...still, dx: 100, dy: 0 })).toBeNull()
  })

  it('peteleco rápido vale mesmo com pouca distância', () => {
    expect(resolveSwipe({ ...card, dx: 80, dy: 0, vx: 1, vy: 0 })).toBe('right')
  })

  it('peteleco na direção contrária ao arrasto não vale', () => {
    expect(resolveSwipe({ ...card, dx: 80, dy: 0, vx: -1, vy: 0 })).toBeNull()
  })

  it('peteleco curto demais não vale (evita toques trêmulos)', () => {
    expect(resolveSwipe({ ...card, dx: 50, dy: 0, vx: 2, vy: 0 })).toBeNull()
  })

  it('para cima, mais de 25% da altura → detalhes', () => {
    expect(resolveSwipe({ ...card, ...still, dx: 20, dy: -140 })).toBe('up')
  })

  it('peteleco para cima → detalhes', () => {
    expect(resolveSwipe({ ...card, dx: 0, dy: -80, vx: 0, vy: -1 })).toBe('up')
  })

  it('para baixo não faz nada', () => {
    expect(resolveSwipe({ ...card, dx: 0, dy: 300, vx: 0, vy: 2 })).toBeNull()
  })

  it('o eixo dominante decide: diagonal mais lateral é curtir, não detalhes', () => {
    expect(resolveSwipe({ ...card, ...still, dx: 200, dy: -150 })).toBe('right')
  })
})

describe('feedback visual', () => {
  it('inclinação proporcional e limitada a 15°', () => {
    expect(dragRotation(0, 400)).toBe(0)
    expect(dragRotation(100, 400)).toBeCloseTo(7.5)
    expect(dragRotation(-1000, 400)).toBe(-15)
  })

  it('progresso de cada direção vai de 0 a 1', () => {
    expect(swipeProgress(70, 0, 400, 500)).toEqual({ right: 0.5, left: 0, up: 0 })
    expect(swipeProgress(-500, 0, 400, 500)).toEqual({ right: 0, left: 1, up: 0 })
    expect(swipeProgress(0, -125, 400, 500).up).toBe(1)
  })

  it('o card sai da tela na direção do gesto', () => {
    expect(exitOffset('right', 400, 500)).toEqual({ x: 600, y: 0 })
    expect(exitOffset('left', 400, 500)).toEqual({ x: -600, y: 0 })
    expect(exitOffset('up', 400, 500)).toEqual({ x: 0, y: -750 })
  })
})

describe('releaseVelocity', () => {
  it('usa só o trecho final do gesto', () => {
    const points = [
      { x: 0, y: 0, time: 0 },
      // pausa longa no meio…
      { x: 10, y: 0, time: 500 },
      // …e um peteleco no fim: 100 px em 50 ms
      { x: 110, y: 0, time: 550 },
    ]
    expect(releaseVelocity(points)).toEqual({ vx: 2, vy: 0 })
  })

  it('sem movimento: velocidade zero', () => {
    expect(releaseVelocity([])).toEqual({ vx: 0, vy: 0 })
    expect(releaseVelocity([{ x: 5, y: 5, time: 10 }])).toEqual({ vx: 0, vy: 0 })
  })
})
