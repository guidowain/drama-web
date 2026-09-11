/**
 * Helpers puros de fechas y franjas horarias de Drama Meet.
 * Se usan igual en el cliente y en el servidor: no tocan ni el DOM ni el filesystem.
 *
 * Una franja se identifica con la clave `YYYY-MM-DD|minutos`, donde `minutos` son
 * los minutos desde la medianoche de ese día en la zona horaria de la reunión.
 */

export const WEEKDAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
export const WEEKDAY_INITIALS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
export const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
export const MONTHS_LONG = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
]

export type AxisSlot = { min: number; label: string; onHour: boolean }
export type DayHead = { wd: string; num: string; mon: string }
export type DaySummary = { day: string; ranges: string }

export function isoOf(date: Date) {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  )
}

export function parseIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function timeAt(minutes: number) {
  return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0')
}

export function slotKey(date: string, minutes: number) {
  return `${date}|${minutes}`
}

export function splitSlotKey(key: string): { date: string; min: number } {
  const [date, min] = key.split('|')
  return { date, min: Number(min) }
}

export function buildAxis(from: number, to: number, step: number): AxisSlot[] {
  const out: AxisSlot[] = []
  for (let m = from; m < to; m += step) {
    out.push({ min: m, label: timeAt(m), onHour: m % 60 === 0 })
  }
  return out
}

/**
 * Eje del invitado: arranca en la primera franja habilitada y termina en la última,
 * para no mostrarle horas muertas arriba y abajo de la grilla.
 */
export function axisForSlots(slots: string[], step: number, fallback: AxisSlot[] = []): AxisSlot[] {
  const mins = slots.map((key) => splitSlotKey(key).min)
  if (!mins.length) return fallback
  return buildAxis(Math.min(...mins), Math.max(...mins) + step, step)
}

export function minutesForDate(slots: readonly string[] | Set<string>, date: string) {
  const prefix = `${date}|`
  const out: number[] = []
  Array.from(slots).forEach((key) => {
    if (key.startsWith(prefix)) out.push(Number(key.slice(prefix.length)))
  })
  return out.sort((a, b) => a - b)
}

/** Agrupa minutos sueltos en rangos contiguos legibles: `10:00–13:00`. */
export function toRanges(minutes: number[], step: number) {
  const sorted = [...minutes].sort((a, b) => a - b)
  const out: string[] = []
  let start: number | null = null
  let prev = 0

  for (const m of sorted) {
    if (start === null) {
      start = m
      prev = m
      continue
    }
    if (m === prev + step) {
      prev = m
      continue
    }
    out.push(`${timeAt(start)}–${timeAt(prev + step)}`)
    start = m
    prev = m
  }
  if (start !== null) out.push(`${timeAt(start)}–${timeAt(prev + step)}`)

  return out
}

export function dayHead(iso: string): DayHead {
  const date = parseIso(iso)
  return {
    wd: WEEKDAYS[date.getDay()],
    num: String(date.getDate()),
    mon: MONTHS[date.getMonth()],
  }
}

export function dayLabel(iso: string) {
  const head = dayHead(iso)
  return `${head.wd} ${head.num} ${head.mon}`
}

/** Resumen por día — se usa en la invitación y en la pantalla de confirmado. */
export function summarize(slots: string[], dates: string[], step: number): DaySummary[] {
  return dates
    .map((date) => {
      const mins = minutesForDate(slots, date)
      if (!mins.length) return null
      return { day: dayLabel(date), ranges: toRanges(mins, step).join('  ·  ') }
    })
    .filter((entry): entry is DaySummary => entry !== null)
}

/** `true` cuando entre dos días consecutivos de la lista hay un hueco de calendario. */
export function hasGapBefore(dates: string[], index: number) {
  if (index === 0) return false
  return (parseIso(dates[index]).getTime() - parseIso(dates[index - 1]).getTime()) / 86_400_000 > 1
}

export function slugify(name: string) {
  return (
    (name || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'reunion'
  )
}

/** Etiqueta corta de zona horaria: `America/Argentina/Buenos_Aires` → `Buenos Aires`. */
export function timezoneLabel(timezone: string) {
  return timezone.split('/').slice(-1)[0].replace(/_/g, ' ')
}

/** Offset GMT de una zona horaria en una fecha dada. Ej: `GMT−3`. */
export function timezoneOffset(timezone: string, at: Date = new Date()) {
  let offsetHours: number

  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' })
      .formatToParts(at)
      .find((part) => part.type === 'timeZoneName')?.value

    // longOffset devuelve `GMT-03:00`, o `GMT` cuando el offset es cero.
    const match = parts?.match(/GMT([+-])(\d{2}):(\d{2})/)
    if (!match) return 'GMT+0'
    offsetHours = (match[1] === '-' ? -1 : 1) * (Number(match[2]) + Number(match[3]) / 60)
  } catch {
    offsetHours = -at.getTimezoneOffset() / 60
  }

  const abs = Math.abs(offsetHours)
  return 'GMT' + (offsetHours >= 0 ? '+' : '−') + (Number.isInteger(abs) ? abs : abs.toFixed(1))
}

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Argentina/Buenos_Aires'
  } catch {
    return 'America/Argentina/Buenos_Aires'
  }
}
