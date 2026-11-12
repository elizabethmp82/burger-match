import { describe, expect, it } from 'vitest'
import type { OsmElement } from './osmId'
import { formatAddress, readPhone, safeWebsite, toBurgerPlace } from './osmPlaceMapper'

const options = { utcOffsetMinutes: -180 }

describe('formatAddress', () => {
  it('rua, número e bairro', () => {
    expect(
      formatAddress({
        'addr:street': 'Rua dos Pinheiros',
        'addr:housenumber': '1045',
        'addr:suburb': 'Pinheiros',
      }),
    ).toBe('Rua dos Pinheiros, 1045 · Pinheiros')
  })

  it('usa a cidade quando não há bairro', () => {
    expect(formatAddress({ 'addr:street': 'Av. Brasil', 'addr:city': 'Campinas' })).toBe(
      'Av. Brasil · Campinas',
    )
  })

  it('sem endereço → undefined', () => {
    expect(formatAddress({ name: 'X' })).toBeUndefined()
  })
})

describe('safeWebsite (segurança dos links)', () => {
  it('aceita http(s) e completa "www."', () => {
    expect(safeWebsite('https://burger.com.br')).toBe('https://burger.com.br/')
    expect(safeWebsite('www.burger.com.br')).toBe('https://www.burger.com.br/')
  })

  it.each(['javascript:alert(1)', 'data:text/html,<b>oi</b>', 'ftp://x.com', 'http://'])(
    'descarta "%s"',
    (value) => {
      expect(safeWebsite(value)).toBeUndefined()
    },
  )
})

describe('readPhone', () => {
  it('pega o primeiro de vários', () => {
    expect(readPhone('+55 11 3000-0101;+55 11 99999-0000')).toBe('+55 11 3000-0101')
  })

  it('descarta o que não parece telefone', () => {
    expect(readPhone('ligue já')).toBeUndefined()
    expect(readPhone('123')).toBeUndefined()
  })
})

describe('toBurgerPlace', () => {
  const node: OsmElement = {
    type: 'node',
    id: 42,
    lat: -23.5667,
    lon: -46.6929,
    tags: {
      amenity: 'fast_food',
      cuisine: 'burger',
      name: 'Hamburgueria Teste',
      'addr:street': 'Rua A',
      'addr:housenumber': '10',
      opening_hours: 'Mo-Fr 18:00-23:00',
      website: 'javascript:alert(1)',
      phone: '+55 11 3000-0000',
    },
  }

  it('normaliza um ponto completo', () => {
    const place = toBurgerPlace(node, {
      ...options,
      origin: { latitude: -23.5667, longitude: -46.6929 },
    })
    expect(place).toMatchObject({
      placeId: 'node-42',
      name: 'Hamburgueria Teste',
      address: 'Rua A, 10',
      location: { latitude: -23.5667, longitude: -46.6929 },
      distanceMeters: 0,
      openingHours: ['Seg–Sex 18:00–23:00', 'Sáb–Dom Fechado'],
      phoneNumber: '+55 11 3000-0000',
      osmUrl: 'https://www.openstreetmap.org/node/42',
    })
    expect(place?.openingSchedule?.periods).toHaveLength(5)
    // Link perigoso descartado.
    expect(place).not.toHaveProperty('websiteUrl')
  })

  it('NÃO inventa dados ausentes (nota, fotos, preço)', () => {
    const place = toBurgerPlace(node, options)
    expect(place).not.toHaveProperty('rating')
    expect(place).not.toHaveProperty('photos')
    expect(place).not.toHaveProperty('priceLevel')
    expect(place).not.toHaveProperty('distanceMeters')
  })

  it('usa o centro de contornos (way)', () => {
    const way: OsmElement = {
      type: 'way',
      id: 7,
      center: { lat: -23.5, lon: -46.6 },
      tags: { name: 'Burger Way' },
    }
    expect(toBurgerPlace(way, options)).toMatchObject({
      placeId: 'way-7',
      location: { latitude: -23.5, longitude: -46.6 },
    })
  })

  it('horário não suportado: mostra o texto, sem grade (sem "aberto agora")', () => {
    const place = toBurgerPlace(
      { ...node, tags: { name: 'X', opening_hours: 'Mo-Fr 18:00+' } },
      options,
    )
    expect(place?.openingHours).toEqual(['Mo-Fr 18:00+'])
    expect(place).not.toHaveProperty('openingSchedule')
  })

  it('descarta locais sem nome ou sem coordenadas', () => {
    expect(toBurgerPlace({ ...node, tags: { amenity: 'fast_food' } }, options)).toBeUndefined()
    expect(toBurgerPlace({ type: 'way', id: 1, tags: { name: 'X' } }, options)).toBeUndefined()
  })
})
