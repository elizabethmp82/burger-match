import { describe, expect, it } from 'vitest'
import { formatDistance } from './formatters'

const NBSP = ' '

describe('formatDistance', () => {
  it('metros arredondados de 10 em 10 (mínimo 10 m)', () => {
    expect(formatDistance(3)).toBe(`10${NBSP}m`)
    expect(formatDistance(386)).toBe(`390${NBSP}m`)
  })

  it('quilômetros com uma casa abaixo de 10 km e inteiros acima', () => {
    expect(formatDistance(1_250)).toBe(`1,3${NBSP}km`)
    expect(formatDistance(12_400)).toBe(`12${NBSP}km`)
  })

  it('número e unidade nunca se separam numa quebra de linha', () => {
    expect(formatDistance(390)).not.toContain(' ')
    expect(formatDistance(5_000)).not.toContain(' ')
  })
})
