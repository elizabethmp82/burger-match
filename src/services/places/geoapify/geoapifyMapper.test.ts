import { describe, expect, it } from 'vitest'
import { burgerEvidence, cuisinesOf, geoapifyToBurgerPlace, readOsmRef } from './geoapifyMapper'

const options = { utcOffsetMinutes: -180 }

/** Item no formato real da Geoapify (resumido). */
function item(overrides: Record<string, unknown> = {}, raw: Record<string, unknown> = {}) {
  return {
    name: 'Circus Hamburgueria',
    lat: -1.45,
    lon: -48.48,
    street: 'Travessa Rui Barbosa',
    housenumber: '1000',
    suburb: 'Nazaré',
    city: 'Belém',
    categories: ['catering', 'catering.restaurant', 'catering.restaurant.burger'],
    catering: { cuisine: 'burger' },
    datasource: {
      sourcename: 'openstreetmap',
      raw: { name: 'Circus Hamburgueria', osm_id: 123, osm_type: 'n', cuisine: 'burger', ...raw },
    },
    ...overrides,
  }
}

describe('burgerEvidence', () => {
  it('categoria, cozinha e nome', () => {
    expect(burgerEvidence(item())).toEqual(['category', 'cuisine', 'name'])
  })

  it('cozinha com vários valores: vender outras coisas não exclui', () => {
    const pizzaria = item(
      { name: 'Cantina X', categories: ['catering.restaurant'], catering: { cuisine: 'pizza' } },
      { name: 'Cantina X', cuisine: 'pizza;coffee_shop;burger;ice_cream' },
    )
    expect(cuisinesOf(pizzaria)).toEqual(new Set(['pizza', 'coffee_shop', 'burger', 'ice_cream']))
    expect(burgerEvidence(pizzaria)).toEqual(['cuisine'])
  })

  it.each(['Hambúrgueria do Zé', 'Zé Burguer', 'BURGER HOUSE', 'Hamburgueria'])(
    'nome "%s" é evidência',
    (name) => {
      const place = item(
        { name, categories: ['catering.fast_food'], catering: undefined },
        { name, cuisine: undefined },
      )
      expect(burgerEvidence(place)).toEqual(['name'])
    },
  )

  it('sem nenhuma evidência (ex.: "Lanches" com cozinha de pizza) → lista vazia', () => {
    const place = item(
      { name: 'Big Lanches', categories: ['catering.fast_food'], catering: { cuisine: 'pizza' } },
      { name: 'Big Lanches', cuisine: 'pizza' },
    )
    expect(burgerEvidence(place)).toEqual([])
  })
})

describe('readOsmRef', () => {
  it.each([
    ['n', 'node'],
    ['w', 'way'],
    ['r', 'relation'],
  ])('osm_type "%s" → %s', (osmType, type) => {
    expect(readOsmRef(item({}, { osm_type: osmType, osm_id: 42 }))).toEqual({ type, id: 42 })
  })

  it('sem ID do OSM ou ID inválido → undefined', () => {
    expect(readOsmRef(item({ datasource: { sourcename: 'x' } }))).toBeUndefined()
    expect(readOsmRef(item({}, { osm_id: -1 }))).toBeUndefined()
    expect(readOsmRef(item({}, { osm_type: 'x' }))).toBeUndefined()
  })
})

describe('geoapifyToBurgerPlace', () => {
  it('normaliza: ID do OSM, endereço da Geoapify, horário do OSM', () => {
    const place = geoapifyToBurgerPlace(
      item({}, { opening_hours: 'Tu-Su 18:00-23:00', website: 'circus.com.br' }),
      { ...options, origin: { latitude: -1.45, longitude: -48.48 } },
    )
    expect(place).toMatchObject({
      placeId: 'node-123',
      name: 'Circus Hamburgueria',
      address: 'Travessa Rui Barbosa, 1000 · Nazaré',
      location: { latitude: -1.45, longitude: -48.48 },
      distanceMeters: 0,
      openingHours: ['Seg Fechado', 'Ter–Dom 18:00–23:00'],
      websiteUrl: 'https://circus.com.br/',
      osmUrl: 'https://www.openstreetmap.org/node/123',
    })
    expect(place).not.toHaveProperty('rating')
    expect(place).not.toHaveProperty('photos')
  })

  it('o dado original do OSM tem prioridade sobre o da Geoapify', () => {
    const place = geoapifyToBurgerPlace(item({}, { 'addr:street': 'Rua do OSM' }), options)
    expect(place?.address).toBe('Rua do OSM, 1000 · Nazaré')
  })

  it.each([
    ['sem nome', { name: undefined }, { name: undefined }],
    ['nome só com números', { name: '123' }, { name: '123' }],
    ['nome em branco', { name: '  ' }, { name: '' }],
  ])('%s → descartado (nada de nome inventado)', (_, overrides, raw) => {
    expect(geoapifyToBurgerPlace(item(overrides, raw), options)).toBeUndefined()
  })

  it('sem coordenadas → descartado', () => {
    expect(geoapifyToBurgerPlace(item({ lat: undefined }), options)).toBeUndefined()
  })

  it('Detalhes: usa o ID pedido se a resposta não trouxer o do OSM', () => {
    const place = geoapifyToBurgerPlace(item({ datasource: undefined }), options, {
      type: 'way',
      id: 9,
    })
    expect(place?.placeId).toBe('way-9')
  })
})
