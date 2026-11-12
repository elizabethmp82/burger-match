import { describe, expect, it } from 'vitest'
import { areaKey, boundsOf } from './mapCamera'

describe('boundsOf', () => {
  it('contém todos os pontos, em [lng, lat]', () => {
    expect(
      boundsOf([
        { latitude: -1.45, longitude: -48.5 },
        { latitude: -1.4, longitude: -48.45 },
        { latitude: -1.47, longitude: -48.48 },
      ]),
    ).toEqual([
      [-48.5, -1.47],
      [-48.45, -1.4],
    ])
  })

  it('um ponto só ganha uma folga mínima (sem zoom máximo)', () => {
    const bounds = boundsOf([{ latitude: -1.45, longitude: -48.5 }])
    expect(bounds?.[1][1]).toBeGreaterThan(-1.45)
    expect(bounds?.[0][1]).toBeLessThan(-1.45)
    expect(bounds?.[1][0]).toBeGreaterThan(-48.5)
  })

  it('lista vazia ou coordenadas inválidas → undefined', () => {
    expect(boundsOf([])).toBeUndefined()
    expect(boundsOf([{ latitude: Number.NaN, longitude: 1 }])).toBeUndefined()
  })
})

describe('areaKey', () => {
  it('muda com o centro ou o raio; não muda com variações minúsculas', () => {
    const center = { latitude: -1.452, longitude: -48.4936 }
    expect(areaKey(center, 5)).toBe(areaKey({ ...center }, 5))
    expect(areaKey(center, 5)).not.toBe(areaKey(center, 10))
    expect(areaKey(center, 5)).not.toBe(areaKey({ ...center, latitude: -1.46 }, 5))
  })
})
