import { describe, expect, it } from 'vitest'
import { distanceInMeters, sortByDistance } from './distance'

describe('distanceInMeters', () => {
  it('mesmo ponto: 0 m', () => {
    const point = { latitude: -23.5667, longitude: -46.6929 }
    expect(distanceInMeters(point, point)).toBe(0)
  })

  it('1 milésimo de grau de latitude ≈ 111 m', () => {
    const meters = distanceInMeters(
      { latitude: -23.566, longitude: -46.69 },
      { latitude: -23.567, longitude: -46.69 },
    )
    expect(meters).toBeGreaterThan(110)
    expect(meters).toBeLessThan(112)
  })
})

describe('sortByDistance', () => {
  it('do mais próximo para o mais distante (caso real: 250 m vinha antes de 230 m)', () => {
    const places = [
      { name: 'Seu Burge', distanceMeters: 250 },
      { name: 'Chapadão', distanceMeters: 230 },
      { name: 'Na Garagem', distanceMeters: 390 },
      { name: 'Burgercue', distanceMeters: 370 },
    ]
    expect(sortByDistance(places).map((place) => place.name)).toEqual([
      'Chapadão',
      'Seu Burge',
      'Burgercue',
      'Na Garagem',
    ])
  })

  it('sem distância vai para o fim; empates mantêm a ordem', () => {
    const places = [
      { name: 'sem', distanceMeters: undefined },
      { name: 'a', distanceMeters: 100 },
      { name: 'b', distanceMeters: 100 },
    ]
    expect(sortByDistance(places).map((place) => place.name)).toEqual(['a', 'b', 'sem'])
  })

  it('não altera a lista original', () => {
    const places = [{ distanceMeters: 2 }, { distanceMeters: 1 }]
    sortByDistance(places)
    expect(places.map((place) => place.distanceMeters)).toEqual([2, 1])
  })
})
