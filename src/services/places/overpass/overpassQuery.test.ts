import { describe, expect, it } from 'vitest'
import { parsePlaceId, toPlaceId } from '../osm/osmId'
import { buildByIdsQuery, buildNearbyQuery } from './overpassQuery'

describe('IDs do OSM', () => {
  it('ida e volta', () => {
    expect(toPlaceId({ type: 'way', id: 123 })).toBe('way-123')
    expect(parsePlaceId('way-123')).toEqual({ type: 'way', id: 123 })
  })

  it.each(['mock-pao-e-brasa', 'node-', 'node-0', 'node-12a', 'node-1);out;', 'area-5', ''])(
    'rejeita "%s" (vem da URL: nada além de dígitos chega à consulta)',
    (value) => {
      expect(parsePlaceId(value)).toBeUndefined()
    },
  )
})

describe('buildNearbyQuery', () => {
  it('busca por cozinha e por nome, no raio pedido', () => {
    const query = buildNearbyQuery(-23.5667, -46.6929, 5000)
    expect(query).toContain('around:5000,-23.56670,-46.69290')
    expect(query).toContain('["cuisine"~"burger",i]')
    expect(query).toContain('["name"~"burg|hamb",i]')
    expect(query).toContain('out center tags;')
  })

  it('limita o raio entre 100 m e 10 km', () => {
    expect(buildNearbyQuery(0, 0, 50_000)).toContain('around:10000,')
    expect(buildNearbyQuery(0, 0, 1)).toContain('around:100,')
  })

  it('recusa coordenadas inválidas', () => {
    expect(() => buildNearbyQuery(Number.NaN, 0, 5000)).toThrow(RangeError)
    expect(() => buildNearbyQuery(91, 0, 5000)).toThrow(RangeError)
  })
})

describe('buildByIdsQuery', () => {
  it('agrupa os IDs por tipo numa consulta só', () => {
    const query = buildByIdsQuery([
      { type: 'node', id: 1 },
      { type: 'node', id: 2 },
      { type: 'way', id: 3 },
    ])
    expect(query).toContain('node(id:1,2);')
    expect(query).toContain('way(id:3);')
  })
})
