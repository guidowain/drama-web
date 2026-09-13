import { z } from 'zod'

export const SLOT_MINUTES = [15, 30, 60] as const
export type SlotMinutes = (typeof SLOT_MINUTES)[number]

/** Clave de franja: `YYYY-MM-DD|minutos-desde-medianoche`. Ej: `2026-09-15|570`. */
export const slotKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}\|\d{1,4}$/)
export const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const meetingSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  /** Días propuestos, ISO y ordenados. */
  dates: z.array(dateKeySchema).min(1).max(60),
  /** Franjas que Drama habilitó. */
  slots: z.array(slotKeySchema).min(1).max(5000),
  slotMinutes: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  /** Zona horaria IANA en la que se armó la reunión. Los horarios se leen en esta zona. */
  timezone: z.string().min(1).max(80),
  createdAt: z.string(),
})

export type Meeting = z.infer<typeof meetingSchema>

export const meetResponseSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  email: z.string().max(160),
  slots: z.array(slotKeySchema).min(1).max(5000),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type MeetResponse = z.infer<typeof meetResponseSchema>

/** Alta de reunión desde el admin. El id y createdAt los pone el servidor. */
export const createMeetingInput = z.object({
  name: z.string().trim().min(1, 'Poné un nombre.').max(120),
  dates: z.array(dateKeySchema).min(1, 'Elegí al menos un día.').max(60),
  slots: z.array(slotKeySchema).min(1, 'Habilitá al menos una franja.').max(5000),
  slotMinutes: z.union([z.literal(15), z.literal(30), z.literal(60)]).default(30),
  timezone: z.string().trim().min(1).max(80).default('America/Argentina/Buenos_Aires'),
})

/** Un solo mail: sin comas, punto y coma ni espacios que separen direcciones. */
const SINGLE_EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/

/** Respuesta de un invitado. Las franjas se validan después contra las de la reunión. */
export const submitResponseInput = z.object({
  name: z.string().trim().min(1, 'Poné tu nombre.').max(80),
  // Obligatorio: con estos mails se arma después la invitación del calendario.
  email: z
    .string()
    .trim()
    .min(1, 'Poné tu mail.')
    .max(160)
    .refine((value) => SINGLE_EMAIL.test(value), 'Poné un solo mail, sin comas.'),
  slots: z.array(slotKeySchema).min(1, 'Marcá al menos una franja.').max(5000),
})

export type MeetingSummary = Meeting & { responseCount: number }
export type MeetingWithResponses = Meeting & { responses: MeetResponse[] }
