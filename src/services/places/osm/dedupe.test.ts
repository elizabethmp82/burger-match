import { describe, expect, it } from 'vitest'
import type { BurgerPlace } from '@/types/place.types'
import { appendNewPlaces, dedupePlaces } from './dedupe'

function place(placeId: string, name: string, latitude: number, extra: Partial<BurgerPlace> = {}) {
  return { placeId, name, location: { latitude, longitude: -46.69 }, ...extra } as BurgerPlace
}

describe('dedupePlaces', () => {
  it('une ponto e prédio do mesmo local (mesmo nome, < 75 m), mantendo o mais completo', () => {
    const result = dedupePlaces([
      place('node-1', 'Burger Bom', -23.5667),
      place('way-2', 'BURGER BÔM', -23.5669, { address: 'Rua A, 10' }),
    ])
    expect(result.map((item) => item.placeId)).toEqual(['way-2'])
  })

  it('mantém filiais distantes da mesma rede', () => {
    const result = dedupePlaces([
      place('node-1', 'Burger King', -23.5667),
      place('node-2', 'Burger King', -23.58),
    ])
    expect(result).toHaveLength(2)
  })

  it('mantém locais vizinhos com nomes diferentes', () => {
    const result = dedupePlaces([
      place('node-1', 'Burger A', -23.5667),
      place('node-2', 'Burger B', -23.5667),
    ])
    expect(result).toHaveLength(2)
  })
})

describe('appendNewPlaces', () => {
  it('junta páginas na ordem de chegada, sem repetir locais já vistos', () => {
    const page1 = [place('node-1', 'A', -23.5667), place('node-2', 'B', -23.57)]
    const page2 = [
      place('node-2', 'B', -23.57), // mesmo ID
      place('way-9', 'a', -23.5668), // mesmo local que o node-1 (nome igual, ~11 m)
      place('node-3', 'C', -23.56), // novo — mesmo sendo mais perto, vai para o fim
    ]
    expect(appendNewPlaces([page1, page2]).map((item) => item.placeId)).toEqual([
      'node-1',
      'node-2',
      'node-3',
    ])
  })
})
