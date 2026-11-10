/**
 * Bairros e cidades para a busca manual (Etapa 3).
 * Coordenadas reais (aproximadas ao centro de cada lugar).
 * Na Etapa 4 a busca passa a usar o Autocomplete da Places API, que cobre qualquer endereço.
 */
import type { Region } from '@/types/location.types'

const SP = 'São Paulo, SP'

export const MOCK_REGIONS: readonly Region[] = [
  // Bairros de São Paulo
  {
    id: 'sp-pinheiros',
    name: 'Pinheiros',
    context: SP,
    center: { latitude: -23.5667, longitude: -46.6929 },
  },
  {
    id: 'sp-vila-madalena',
    name: 'Vila Madalena',
    context: SP,
    center: { latitude: -23.5536, longitude: -46.6916 },
  },
  {
    id: 'sp-moema',
    name: 'Moema',
    context: SP,
    center: { latitude: -23.6008, longitude: -46.6626 },
  },
  {
    id: 'sp-vila-mariana',
    name: 'Vila Mariana',
    context: SP,
    center: { latitude: -23.5893, longitude: -46.6346 },
  },
  {
    id: 'sp-itaim-bibi',
    name: 'Itaim Bibi',
    context: SP,
    center: { latitude: -23.5846, longitude: -46.6786 },
  },
  {
    id: 'sp-jardins',
    name: 'Jardins',
    context: SP,
    center: { latitude: -23.5671, longitude: -46.6626 },
  },
  {
    id: 'sp-bela-vista',
    name: 'Bela Vista',
    context: SP,
    center: { latitude: -23.5614, longitude: -46.6474 },
  },
  {
    id: 'sp-liberdade',
    name: 'Liberdade',
    context: SP,
    center: { latitude: -23.5587, longitude: -46.6337 },
  },
  {
    id: 'sp-centro',
    name: 'Centro',
    context: SP,
    center: { latitude: -23.5475, longitude: -46.6361 },
  },
  {
    id: 'sp-tatuape',
    name: 'Tatuapé',
    context: SP,
    center: { latitude: -23.5401, longitude: -46.5765 },
  },
  {
    id: 'sp-santana',
    name: 'Santana',
    context: SP,
    center: { latitude: -23.5025, longitude: -46.6253 },
  },
  {
    id: 'sp-butanta',
    name: 'Butantã',
    context: SP,
    center: { latitude: -23.5718, longitude: -46.7083 },
  },
  {
    id: 'sp-perdizes',
    name: 'Perdizes',
    context: SP,
    center: { latitude: -23.5367, longitude: -46.6778 },
  },
  { id: 'sp-lapa', name: 'Lapa', context: SP, center: { latitude: -23.5226, longitude: -46.7047 } },
  {
    id: 'sp-brooklin',
    name: 'Brooklin',
    context: SP,
    center: { latitude: -23.6149, longitude: -46.6893 },
  },
  {
    id: 'sp-mooca',
    name: 'Mooca',
    context: SP,
    center: { latitude: -23.5605, longitude: -46.5996 },
  },
  // Cidades
  {
    id: 'cidade-sao-paulo',
    name: 'São Paulo',
    context: 'SP',
    center: { latitude: -23.5505, longitude: -46.6333 },
  },
  {
    id: 'cidade-rio',
    name: 'Rio de Janeiro',
    context: 'RJ',
    center: { latitude: -22.9068, longitude: -43.1729 },
  },
  {
    id: 'cidade-bh',
    name: 'Belo Horizonte',
    context: 'MG',
    center: { latitude: -19.9167, longitude: -43.9345 },
  },
  {
    id: 'cidade-curitiba',
    name: 'Curitiba',
    context: 'PR',
    center: { latitude: -25.4284, longitude: -49.2733 },
  },
  {
    id: 'cidade-porto-alegre',
    name: 'Porto Alegre',
    context: 'RS',
    center: { latitude: -30.0346, longitude: -51.2177 },
  },
  {
    id: 'cidade-brasilia',
    name: 'Brasília',
    context: 'DF',
    center: { latitude: -15.7939, longitude: -47.8828 },
  },
  {
    id: 'cidade-salvador',
    name: 'Salvador',
    context: 'BA',
    center: { latitude: -12.9777, longitude: -38.5016 },
  },
  {
    id: 'cidade-recife',
    name: 'Recife',
    context: 'PE',
    center: { latitude: -8.0476, longitude: -34.877 },
  },
  {
    id: 'cidade-fortaleza',
    name: 'Fortaleza',
    context: 'CE',
    center: { latitude: -3.7319, longitude: -38.5267 },
  },
  {
    id: 'cidade-campinas',
    name: 'Campinas',
    context: 'SP',
    center: { latitude: -22.9099, longitude: -47.0626 },
  },
  {
    id: 'cidade-florianopolis',
    name: 'Florianópolis',
    context: 'SC',
    center: { latitude: -27.5954, longitude: -48.548 },
  },
]
