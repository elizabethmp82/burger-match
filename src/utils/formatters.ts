import type { PriceLevel } from '@/types/place.types'

const LOCALE = 'pt-BR'

const ratingFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const countFormat = new Intl.NumberFormat(LOCALE)
const kmFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const wholeKmFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })

/** 4.8 → "4,8" */
export function formatRating(rating: number): string {
  return ratingFormat.format(rating)
}

/** 1234 → "1.234" */
export function formatCount(count: number): string {
  return countFormat.format(count)
}

/** 850 → "850 m" · 1240 → "1,2 km" · 4000 → "4,0 km" · 12400 → "12 km" */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.max(10, Math.round(meters / 10) * 10)} m`
  }
  const km = meters / 1000
  return `${km >= 10 ? wholeKmFormat.format(km) : kmFormat.format(km)} km`
}

/** 2 → "$$" */
export function formatPriceLevel(level: PriceLevel): string {
  return '$'.repeat(level)
}

/** 1 → "1 hamburgueria" · 4 → "4 hamburguerias" */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
