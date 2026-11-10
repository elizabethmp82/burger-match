/**
 * Cálculo de "aberto agora" a partir da grade semanal de horários.
 * Função pura (sem chamadas externas): fácil de testar na Etapa 8.
 *
 * Formato igual ao da Places API: dias de 0 (domingo) a 6 (sábado), horário local
 * do estabelecimento. Um período sem `close` significa aberto 24 horas.
 */

export interface OpeningPoint {
  day: number
  hour: number
  minute: number
}

export interface OpeningPeriod {
  open: OpeningPoint
  close: OpeningPoint | null
}

export interface OpeningSchedule {
  periods: readonly OpeningPeriod[]
  /** Fuso do estabelecimento em relação ao UTC, em minutos (São Paulo = -180). */
  utcOffsetMinutes: number
}

export interface OpenStatusInfo {
  openNow: boolean
  /**
   * Fechamento: sempre só o horário ("23:00").
   * Abertura: "18:00" (hoje), "amanhã 11:30" ou "qui 18:00".
   * Ausente quando abre 24 horas.
   */
  nextStatusChange?: string
}

const MINUTES_PER_DAY = 24 * 60
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function toWeekMinutes({ day, hour, minute }: OpeningPoint): number {
  return day * MINUTES_PER_DAY + hour * 60 + minute
}

function formatTime({ hour, minute }: OpeningPoint): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/** `waitMinutes` evita dizer "18:00" (hoje) quando a abertura é só na semana que vem. */
function formatOpening(point: OpeningPoint, today: number, waitMinutes: number): string {
  if (point.day === today && waitMinutes < MINUTES_PER_DAY) return formatTime(point)
  if (point.day === (today + 1) % 7 && waitMinutes < 2 * MINUTES_PER_DAY) {
    return `amanhã ${formatTime(point)}`
  }
  return `${WEEKDAYS[point.day] ?? ''} ${formatTime(point)}`
}

/** Status no instante `now` (padrão: agora). `undefined` se não houver horários. */
export function getOpenStatus(
  { periods, utcOffsetMinutes }: OpeningSchedule,
  now: Date = new Date(),
): OpenStatusInfo | undefined {
  if (periods.length === 0) return undefined
  if (periods.some((period) => period.close === null)) return { openNow: true }

  // "Agora" no relógio do estabelecimento, em minutos desde domingo 00:00.
  const local = new Date(now.getTime() + utcOffsetMinutes * 60_000)
  const today = local.getUTCDay()
  const nowMinutes = today * MINUTES_PER_DAY + local.getUTCHours() * 60 + local.getUTCMinutes()

  for (const { open, close } of periods) {
    if (!close) continue
    const start = toWeekMinutes(open)
    let end = toWeekMinutes(close)
    if (end <= start) end += MINUTES_PER_WEEK // período que atravessa sábado → domingo

    // "agora + 1 semana" cobre o trecho de domingo de um período iniciado no sábado.
    const isOpen = [nowMinutes, nowMinutes + MINUTES_PER_WEEK].some(
      (instant) => instant >= start && instant < end,
    )
    if (isOpen) return { openNow: true, nextStatusChange: formatTime(close) }
  }

  // Fechado: a próxima abertura é a que está mais perto, olhando para a frente.
  let nextOpen: OpeningPoint | undefined
  let smallestWait = Infinity
  for (const { open } of periods) {
    const wait = (toWeekMinutes(open) - nowMinutes + MINUTES_PER_WEEK) % MINUTES_PER_WEEK
    if (wait < smallestWait) {
      smallestWait = wait
      nextOpen = open
    }
  }

  return nextOpen
    ? { openNow: false, nextStatusChange: formatOpening(nextOpen, today, smallestWait) }
    : { openNow: false }
}
