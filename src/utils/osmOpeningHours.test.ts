import { describe, expect, it } from 'vitest'
import { getOpenStatus } from './openingHours'
import { parseOsmOpeningHours } from './osmOpeningHours'

const SAO_PAULO = -180

/** Instante no horário de São Paulo (UTC-3). 2026-11-09 é uma segunda-feira. */
function at(isoLocal: string): Date {
  return new Date(`${isoLocal}-03:00`)
}

function statusAt(value: string, isoLocal: string) {
  const parsed = parseOsmOpeningHours(value, SAO_PAULO)
  if (!parsed) throw new Error(`não interpretou: ${value}`)
  return getOpenStatus(parsed.schedule, at(isoLocal))
}

describe('parseOsmOpeningHours — linhas para exibir', () => {
  it('agrupa dias seguidos com o mesmo horário', () => {
    expect(parseOsmOpeningHours('Mo-Fr 18:00-23:00; Sa,Su 12:00-23:30', SAO_PAULO)?.lines).toEqual([
      'Seg–Sex 18:00–23:00',
      'Sáb–Dom 12:00–23:30',
    ])
  })

  it('dias não citados ficam fechados', () => {
    expect(parseOsmOpeningHours('Tu-Su 18:00-23:00', SAO_PAULO)?.lines).toEqual([
      'Seg Fechado',
      'Ter–Dom 18:00–23:00',
    ])
  })

  it('24/7 e horário igual todos os dias', () => {
    expect(parseOsmOpeningHours('24/7', SAO_PAULO)?.lines).toEqual(['Todos os dias 24 horas'])
    expect(parseOsmOpeningHours('11:00-23:00', SAO_PAULO)?.lines).toEqual([
      'Todos os dias 11:00–23:00',
    ])
  })

  it('aceita dois turnos, espaços extras e letras minúsculas', () => {
    expect(parseOsmOpeningHours('mo - fr 11:00 - 15:00, 18:00 - 23:00', SAO_PAULO)?.lines).toEqual([
      'Seg–Sex 11:00–15:00, 18:00–23:00',
      'Sáb–Dom Fechado',
    ])
  })

  it('regra posterior substitui a anterior nos dias que cita', () => {
    expect(parseOsmOpeningHours('Mo-Su 18:00-23:00; We off', SAO_PAULO)?.lines).toEqual([
      'Seg–Ter 18:00–23:00',
      'Qua Fechado',
      'Qui–Dom 18:00–23:00',
    ])
  })

  it('ignora feriados (PH), que não sabemos quando são', () => {
    expect(parseOsmOpeningHours('Mo-Su 18:00-23:00; PH off', SAO_PAULO)?.lines).toEqual([
      'Todos os dias 18:00–23:00',
    ])
  })

  it('intervalo que vira a semana (Fr-Mo)', () => {
    expect(parseOsmOpeningHours('Fr-Mo 18:00-23:00', SAO_PAULO)?.lines).toEqual([
      'Seg 18:00–23:00',
      'Ter–Qui Fechado',
      'Sex–Dom 18:00–23:00',
    ])
  })
})

describe('parseOsmOpeningHours — formatos não suportados', () => {
  it.each([
    'Mo-Fr 18:00+',
    'Mo-Fr 18:00-23:00 || "sob consulta"',
    'Jan-Mar Mo-Fr 10:00-20:00',
    'Mo-Fr sunrise-sunset',
    'Mo[1] 10:00-12:00',
    'segunda a sexta das 18h às 23h',
    'Mo-Fr 25:00-26:00',
    'Mo-Fr 18:70-23:00',
    '',
  ])('"%s" → undefined (o app mostra o texto original)', (value) => {
    expect(parseOsmOpeningHours(value, SAO_PAULO)).toBeUndefined()
  })
})

describe('parseOsmOpeningHours + getOpenStatus — "aberto agora"', () => {
  it('aberto durante o expediente, com horário de fechamento', () => {
    expect(statusAt('Mo-Fr 18:00-23:00', '2026-11-09T19:00:00')).toEqual({
      openNow: true,
      nextStatusChange: '23:00',
    })
  })

  it('fechado antes de abrir, com horário de abertura', () => {
    expect(statusAt('Mo-Fr 18:00-23:00', '2026-11-09T10:00:00')).toEqual({
      openNow: false,
      nextStatusChange: '18:00',
    })
  })

  it('passa da meia-noite: sábado 01:00 ainda está aberto (turno de sexta)', () => {
    expect(statusAt('Fr 18:00-02:00', '2026-11-14T01:00:00')).toEqual({
      openNow: true,
      nextStatusChange: '02:00',
    })
  })

  it('domingo 00:30 com turno de sábado até 01:00 (vira a semana)', () => {
    expect(statusAt('Sa 18:00-01:00', '2026-11-15T00:30:00')?.openNow).toBe(true)
  })

  it('24/7 está sempre aberto', () => {
    expect(statusAt('24/7', '2026-11-11T04:00:00')).toEqual({ openNow: true })
  })

  it('fechado no dia de folga, abre amanhã', () => {
    expect(statusAt('Tu-Su 18:00-23:00', '2026-11-09T20:00:00')).toEqual({
      openNow: false,
      nextStatusChange: 'amanhã 18:00',
    })
  })

  it('tudo "off": sem status (não afirma nada)', () => {
    expect(statusAt('off', '2026-11-09T20:00:00')).toBeUndefined()
  })
})
