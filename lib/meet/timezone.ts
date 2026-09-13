import { buildAxis, isoOf, slotKey, splitSlotKey, type AxisSlot } from './slots'

/**
 * Conversión de franjas entre zonas horarias.
 *
 * Las franjas se guardan como hora de pared en la zona con la que se armó la
 * reunión (`2026-09-15|600` = las 10:00 de ese día en Buenos Aires). Eso es lo
 * que quiso decir quien la armó y no cambia nunca. Para mostrárselas a alguien
 * en otra zona hay que pasar por el instante absoluto: hora de pared + zona
 * origen → UTC → hora de pared en la zona destino.
 *
 * Sin librerías de fechas: alcanza con Intl, que ya conoce la base de datos de
 * zonas horarias del sistema, incluidos los cambios de horario de verano.
 */

/** Cuánto se adelanta `timeZone` respecto de UTC en ese instante, en ms. */
export function zoneOffsetMs(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs))

  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0')
  // formatToParts puede devolver la hora 24 para la medianoche según el motor.
  const asIfUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour') % 24,
    value('minute'),
    value('second')
  )

  return asIfUtc - utcMs
}

/** Hora de pared en una zona → instante absoluto. */
export function wallTimeToUtc(date: string, minutes: number, timeZone: string) {
  const [year, month, day] = date.split('-').map(Number)
  const naive = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60)

  // El offset depende del instante, y el instante depende del offset. Se estima
  // una vez y se corrige: la segunda pasada ya cae del lado correcto de un
  // cambio de horario de verano.
  const first = zoneOffsetMs(naive, timeZone)
  const corrected = naive - first
  const second = zoneOffsetMs(corrected, timeZone)

  return second === first ? corrected : naive - second
}

/** Instante absoluto → hora de pared en una zona. */
export function utcToWallTime(utcMs: number, timeZone: string) {
  const local = new Date(utcMs + zoneOffsetMs(utcMs, timeZone))

  return {
    date: isoOf(new Date(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())),
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
  }
}

export type SlotProjection = {
  /** Días tal como caen en la zona de visualización. */
  dates: string[]
  axis: AxisSlot[]
  /** Franjas ya expresadas en la zona de visualización. */
  slots: string[]
  /** Clave mostrada → clave guardada, y a la inversa. */
  toCanonical: Map<string, string>
  toDisplay: Map<string, string>
}

/**
 * Reexpresa un conjunto de franjas en otra zona horaria y arma la grilla que le
 * corresponde. Cuando ambas zonas coinciden no hay nada que convertir.
 */
export function projectSlots(
  slots: string[],
  fromZone: string,
  toZone: string,
  step: number
): SlotProjection {
  const toCanonical = new Map<string, string>()
  const toDisplay = new Map<string, string>()
  const displaySlots: string[] = []

  for (const canonical of slots) {
    let display = canonical

    if (fromZone !== toZone) {
      const { date, min } = splitSlotKey(canonical)
      const wall = utcToWallTime(wallTimeToUtc(date, min, fromZone), toZone)
      display = slotKey(wall.date, wall.minutes)
    }

    toCanonical.set(display, canonical)
    toDisplay.set(canonical, display)
    displaySlots.push(display)
  }

  const dates = Array.from(new Set(displaySlots.map((key) => splitSlotKey(key).date))).sort()
  const minutes = displaySlots.map((key) => splitSlotKey(key).min)
  const axis = minutes.length
    ? buildAxis(Math.min(...minutes), Math.max(...minutes) + step, step)
    : []

  return { dates, axis, slots: displaySlots, toCanonical, toDisplay }
}

/** Traduce un conjunto de claves de un espacio al otro, descartando las que no mapean. */
export function mapSlots(keys: Iterable<string>, mapping: Map<string, string>) {
  const out = new Set<string>()
  for (const key of Array.from(keys)) {
    const mapped = mapping.get(key)
    if (mapped) out.add(mapped)
  }
  return out
}

const FALLBACK_ZONES = [
  'America/Argentina/Buenos_Aires',
  'America/Santiago',
  'America/Montevideo',
  'America/Sao_Paulo',
  'America/Bogota',
  'America/Mexico_City',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Rome',
  'Asia/Tokyo',
  'Australia/Sydney',
]

/** Todas las zonas que conoce el navegador, con respaldo para los que no exponen la lista. */
export function listTimeZones(...ensure: string[]) {
  let zones: string[] = []

  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] })
      .supportedValuesOf
    zones = supported ? supported('timeZone') : []
  } catch {
    zones = []
  }

  if (!zones.length) zones = FALLBACK_ZONES

  for (const zone of ensure) {
    if (zone && !zones.includes(zone)) zones.push(zone)
  }

  return zones.sort()
}
