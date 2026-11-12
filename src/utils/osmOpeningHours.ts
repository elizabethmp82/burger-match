/**
 * Interpreta a tag `opening_hours` do OpenStreetMap (ex.: "Mo-Fr 18:00-23:00; Sa,Su 12:00-00:00")
 * e converte para a grade usada por `getOpenStatus` (utils/openingHours.ts).
 *
 * A especificação completa é enorme (feriados, meses, nascer do sol, comentários…).
 * Aqui entram só os formatos COMUNS em restaurantes. Se o texto tiver algo fora disso,
 * a função devolve `undefined`: o app mostra o texto original e NÃO afirma
 * "Aberto agora" — melhor não dizer nada do que dizer algo errado (RN11).
 *
 * Suportado:
 *   24/7 · Mo-Fr · Sa,Su · Fr-Mo (vira a semana) · 11:00-15:00,18:00-23:00
 *   18:00-02:00 (passa da meia-noite) · 18:00-26:00 · off / closed
 *   PH / SH (feriados): ignorados, porque não sabemos quando são.
 *   Regras posteriores substituem as anteriores nos dias que citam (como no OSM).
 */
import type { OpeningPeriod, OpeningSchedule } from './openingHours'

export interface ParsedOpeningHours {
  schedule: OpeningSchedule
  /** Linhas prontas para exibir, de segunda a domingo (ex.: "Seg–Sex 18:00–23:00"). */
  lines: string[]
}

/** Intervalo em minutos a partir das 00:00 do dia; `end` pode passar de 1440 (madrugada). */
type Interval = readonly [start: number, end: number]

const MINUTES_PER_DAY = 24 * 60
/** Tamanho máximo de uma tag no OSM. */
const MAX_LENGTH = 255

/** Dias no formato da grade: 0 = domingo … 6 = sábado. */
const OSM_DAYS: Readonly<Record<string, number>> = {
  su: 0,
  mo: 1,
  tu: 2,
  we: 3,
  th: 4,
  fr: 5,
  sa: 6,
}
const HOLIDAYS = new Set(['ph', 'sh'])
/** Ordem de exibição: a semana começa na segunda. */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const TIME_RANGE = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/

/** "Mo-Fr,Su" → [1,2,3,4,5,0]. `null` = só feriados (regra ignorada). `undefined` = inválido. */
function parseDays(selector: string): number[] | null | undefined {
  const days: number[] = []
  let onlyHolidays = true

  for (const item of selector.toLowerCase().split(',')) {
    if (HOLIDAYS.has(item)) continue
    onlyHolidays = false

    const [from, to, ...rest] = item.split('-')
    if (rest.length > 0 || from === undefined) return undefined
    const start = OSM_DAYS[from]
    const end = to === undefined ? start : OSM_DAYS[to]
    if (start === undefined || end === undefined) return undefined

    // Percorre de `start` até `end`, dando a volta na semana se preciso (Fr-Mo).
    for (let day = start; ; day = (day + 1) % 7) {
      days.push(day)
      if (day === end) break
    }
  }
  return onlyHolidays ? null : days
}

/** "11:00-15:00,18:00-23:00" → intervalos. "off" → nenhum. `undefined` = inválido. */
function parseTimes(text: string): Interval[] | undefined {
  const lower = text.toLowerCase()
  if (lower === 'off' || lower === 'closed') return []

  const intervals: Interval[] = []
  for (const range of text.split(',')) {
    const match = TIME_RANGE.exec(range)
    if (!match) return undefined
    const [, h1, m1, h2, m2] = match.map(Number)
    if (h1 === undefined || m1 === undefined || h2 === undefined || m2 === undefined) {
      return undefined
    }
    if (m1 > 59 || m2 > 59 || h1 > 24 || h2 > 48) return undefined

    const start = h1 * 60 + m1
    let end = h2 * 60 + m2
    if (start >= MINUTES_PER_DAY) return undefined
    if (end <= start) end += MINUTES_PER_DAY // 18:00-02:00 → até as 2h do dia seguinte
    if (end - start > MINUTES_PER_DAY) return undefined
    intervals.push([start, end])
  }
  return intervals
}

/** Separa "Mo-Fr 18:00-23:00" em dias + horários. `undefined` = formato não suportado. */
function parseRule(rule: string): { days: number[] | null; times: Interval[] } | undefined {
  // Junta espaços em volta de "," e "-": "Mo - Fr 18:00 - 23:00" → "Mo-Fr 18:00-23:00".
  const tokens = rule.replace(/\s*([,-])\s*/g, '$1').split(/\s+/)
  const allDays = [0, 1, 2, 3, 4, 5, 6]

  if (tokens.length === 1) {
    const [token = ''] = tokens
    // Só horários ("18:00-23:00"): vale para todos os dias.
    const times = parseTimes(token)
    if (times) return { days: allDays, times }
    // Só dias ("Mo-Fr"): no OSM, significa aberto o dia todo.
    const days = parseDays(token)
    return days === undefined ? undefined : { days, times: [[0, MINUTES_PER_DAY]] }
  }

  if (tokens.length === 2) {
    const [selector = '', timeText = ''] = tokens
    const days = parseDays(selector)
    const times = parseTimes(timeText)
    if (days === undefined || !times) return undefined
    return { days, times }
  }

  return undefined
}

function formatMinutes(minutes: number): string {
  const inDay = minutes % MINUTES_PER_DAY
  return `${String(Math.floor(inDay / 60)).padStart(2, '0')}:${String(inDay % 60).padStart(2, '0')}`
}

function describeIntervals(intervals: readonly Interval[]): string {
  if (intervals.length === 0) return 'Fechado'
  return intervals
    .map(([start, end]) =>
      end - start === MINUTES_PER_DAY && start === 0
        ? '24 horas'
        : `${formatMinutes(start)}–${formatMinutes(end)}`,
    )
    .join(', ')
}

/** Agrupa dias seguidos com o mesmo horário: "Seg–Qui 18:00–23:00", "Dom Fechado". */
function buildLines(week: readonly (readonly Interval[])[]): string[] {
  const groups: { first: number; last: number; text: string }[] = []

  for (const day of DISPLAY_ORDER) {
    const text = describeIntervals(week[day] ?? [])
    const previous = groups.at(-1)
    if (previous && previous.text === text) previous.last = day
    else groups.push({ first: day, last: day, text })
  }

  const [only] = groups
  if (groups.length === 1 && only) return [`Todos os dias ${only.text}`]

  return groups.map(({ first, last, text }) => {
    const days =
      first === last ? DAY_LABELS[first] : `${DAY_LABELS[first] ?? ''}–${DAY_LABELS[last] ?? ''}`
    return `${days ?? ''} ${text}`
  })
}

function buildPeriods(week: readonly (readonly Interval[])[]): OpeningPeriod[] {
  const isAlwaysOpen = week.every(
    (intervals) =>
      intervals.length === 1 && intervals[0]?.[0] === 0 && intervals[0][1] === MINUTES_PER_DAY,
  )
  // Mesmo formato da grade para "24 horas": um período sem fechamento.
  if (isAlwaysOpen) return [{ open: { day: 0, hour: 0, minute: 0 }, close: null }]

  return week.flatMap((intervals, day) =>
    intervals.map(([start, end]) => ({
      open: { day, hour: Math.floor(start / 60), minute: start % 60 },
      close: {
        day: (day + Math.floor(end / MINUTES_PER_DAY)) % 7,
        hour: Math.floor((end % MINUTES_PER_DAY) / 60),
        minute: end % 60,
      },
    })),
  )
}

/**
 * @param utcOffsetMinutes fuso do estabelecimento. O OSM guarda horário LOCAL, sem fuso;
 *   quem chama informa o fuso (o app usa o do aparelho — veja overpassMapper.ts).
 * @returns `undefined` quando o texto usa recursos não suportados.
 */
export function parseOsmOpeningHours(
  value: string,
  utcOffsetMinutes: number,
): ParsedOpeningHours | undefined {
  const text = value.trim()
  if (!text || text.length > MAX_LENGTH || text.includes('||') || text.includes('"')) {
    return undefined
  }

  // Dias que nenhuma regra cita ficam fechados (regra do OSM).
  const week: (readonly Interval[])[] = [[], [], [], [], [], [], []]

  if (text === '24/7') {
    week.fill([[0, MINUTES_PER_DAY]])
  } else {
    for (const rawRule of text.split(';')) {
      const rule = rawRule.trim()
      if (!rule) continue
      const parsed = parseRule(rule)
      if (!parsed) return undefined
      if (parsed.days === null) continue // só feriados
      for (const day of parsed.days) week[day] = parsed.times
    }
  }

  return {
    schedule: { periods: buildPeriods(week), utcOffsetMinutes },
    lines: buildLines(week),
  }
}
