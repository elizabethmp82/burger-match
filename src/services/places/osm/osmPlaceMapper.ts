/**
 * Normalização: local do OpenStreetMap (tags) → BurgerPlace do app.
 * Usado pelas duas fontes: Overpass e Geoapify (cujos dados também vêm do OSM).
 *
 * Os dados do OSM são colaborativos: qualquer campo pode faltar ou vir em formato
 * livre. Aqui nada é presumido — só entra no BurgerPlace o que passou na validação.
 * Referência das tags: https://wiki.openstreetmap.org/wiki/Key:addr
 */
import type { Coordinates } from '@/types/location.types'
import type { BurgerPlace } from '@/types/place.types'
import { distanceInMeters } from '@/utils/distance'
import { parseOsmOpeningHours } from '@/utils/osmOpeningHours'
import { osmUrl, toPlaceId, type OsmElement } from './osmId'

/** Proteção contra textos absurdos (o OSM aceita até 255 caracteres por tag). */
const MAX_NAME_LENGTH = 120

type Tags = Readonly<Record<string, string>>

/** Primeira tag preenchida da lista, sem espaços nas pontas. */
function firstTag(tags: Tags, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = tags[key]?.trim()
    if (value) return value
  }
  return undefined
}

function readLocation(element: OsmElement): Coordinates | undefined {
  const lat = element.lat ?? element.center?.lat
  const lon = element.lon ?? element.center?.lon
  if (lat === undefined || lon === undefined) return undefined
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return undefined
  }
  return { latitude: lat, longitude: lon }
}

/** "Rua X, 123 · Pinheiros". `undefined` se não houver rua nem bairro/cidade. */
export function formatAddress(tags: Tags): string | undefined {
  const street = firstTag(tags, 'addr:street')
  const number = firstTag(tags, 'addr:housenumber')
  const streetLine = street
    ? number
      ? `${street}, ${number}`
      : street
    : firstTag(tags, 'addr:full')
  const area = firstTag(tags, 'addr:suburb', 'addr:neighbourhood', 'addr:quarter', 'addr:city')

  const parts = [streetLine, area].filter((part): part is string => Boolean(part))
  return parts.length > 0 ? parts.join(' · ') : undefined
}

/** Só aceita http(s). "www.x.com" vira "https://www.x.com". Outros esquemas são descartados. */
export function safeWebsite(value: string | undefined): string | undefined {
  if (!value) return undefined
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

/** Primeiro telefone da tag (o OSM separa vários com ";"), se parecer um número real. */
export function readPhone(value: string | undefined): string | undefined {
  const phone = value?.split(';')[0]?.trim()
  if (!phone) return undefined
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15 ? phone : undefined
}

export interface MapperOptions {
  /** Centro da busca, para a distância. Sem ele, a distância é calculada depois. */
  origin?: Coordinates
  /**
   * Fuso dos horários. O OSM guarda horário LOCAL, sem fuso; usamos o do aparelho,
   * que coincide com o do estabelecimento quando a pessoa busca perto de onde está.
   */
  utcOffsetMinutes: number
}

/** `undefined` quando o elemento não serve (sem nome ou sem coordenadas). */
export function toBurgerPlace(
  element: OsmElement,
  { origin, utcOffsetMinutes }: MapperOptions,
): BurgerPlace | undefined {
  const tags = element.tags ?? {}
  const name = firstTag(tags, 'name', 'name:pt', 'brand')?.slice(0, MAX_NAME_LENGTH)
  const location = readLocation(element)
  // Sem nome de verdade (vazio, só números ou símbolos): descartado. Nada de nome inventado.
  if (!name || !/\p{L}/u.test(name) || !location) return undefined

  const address = formatAddress(tags)
  const phoneNumber = readPhone(firstTag(tags, 'phone', 'contact:phone'))
  const websiteUrl = safeWebsite(firstTag(tags, 'website', 'contact:website', 'url'))

  const rawHours = firstTag(tags, 'opening_hours')
  const hours = rawHours ? parseOsmOpeningHours(rawHours, utcOffsetMinutes) : undefined

  return {
    placeId: toPlaceId(element),
    name,
    location,
    osmUrl: osmUrl(element),
    ...(address && { address }),
    ...(origin && { distanceMeters: distanceInMeters(origin, location) }),
    ...(hours
      ? { openingSchedule: hours.schedule, openingHours: hours.lines }
      : // Formato não suportado: mostra o texto original, sem afirmar "aberto agora".
        rawHours && { openingHours: [rawHours] }),
    ...(phoneNumber && { phoneNumber }),
    ...(websiteUrl && { websiteUrl }),
  }
}
