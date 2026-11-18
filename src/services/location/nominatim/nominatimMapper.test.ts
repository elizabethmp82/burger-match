import { describe, expect, it } from 'vitest'
import { describeContext, parseNominatimResults } from './nominatimMapper'

const pinheiros = {
  osm_type: 'relation',
  osm_id: 123,
  lat: '-23.5667',
  lon: '-46.6929',
  name: 'Pinheiros',
  display_name: 'Pinheiros, São Paulo, Região Metropolitana de São Paulo, Brasil',
  address: {
    suburb: 'Pinheiros',
    city: 'São Paulo',
    state: 'São Paulo',
    'ISO3166-2-lvl4': 'BR-SP',
    country: 'Brasil',
    country_code: 'br',
  },
}

describe('describeContext', () => {
  it('Brasil: cidade + sigla do estado, sem o país', () => {
    expect(describeContext('Pinheiros', pinheiros.address)).toBe('São Paulo, SP')
  })

  it('não repete o próprio nome (a cidade buscada)', () => {
    expect(
      describeContext('Campinas', {
        city: 'Campinas',
        state: 'São Paulo',
        'ISO3166-2-lvl4': 'BR-SP',
        country_code: 'br',
      }),
    ).toBe('SP')
  })

  it('outros países: estado/região + país', () => {
    expect(
      describeContext('Lisboa', {
        city: 'Lisboa',
        state: 'Lisboa',
        country: 'Portugal',
        country_code: 'pt',
      }),
    ).toBe('Portugal')
  })

  it('sem endereço: contexto vazio', () => {
    expect(describeContext('Lugar', {})).toBe('')
  })
})

describe('parseNominatimResults', () => {
  it('converte nome, contexto, id e centro', () => {
    expect(parseNominatimResults([pinheiros])).toEqual([
      {
        id: 'nominatim-relation-123',
        name: 'Pinheiros',
        context: 'São Paulo, SP',
        center: { latitude: -23.5667, longitude: -46.6929 },
      },
    ])
  })

  it('sem "name": usa a primeira parte do display_name', () => {
    const [region] = parseNominatimResults([{ ...pinheiros, name: '' }])
    expect(region?.name).toBe('Pinheiros')
  })

  it('descarta itens malformados ou com coordenadas inválidas', () => {
    expect(
      parseNominatimResults([
        'lixo',
        null,
        { ...pinheiros, lat: 'abc' },
        { ...pinheiros, lon: '200' },
        { ...pinheiros, osm_id: '123' },
        { ...pinheiros, name: undefined, display_name: undefined },
      ]),
    ).toEqual([])
  })

  it('remove repetidos: mesmo id ou mesmo nome + contexto', () => {
    const regions = parseNominatimResults([
      pinheiros,
      pinheiros,
      { ...pinheiros, osm_type: 'node', osm_id: 999 },
    ])
    expect(regions).toHaveLength(1)
  })

  it('resposta que não é lista vira lista vazia', () => {
    expect(parseNominatimResults({ error: 'x' })).toEqual([])
  })
})
