import { NextResponse } from 'next/server'
import {
  MAX_RESPONSES_PER_MEETING,
  countResponses,
  getMeeting,
  newResponseId,
  saveResponse,
} from '@/lib/meet/store'
import { submitResponseInput } from '@/lib/meet/types'

export const dynamic = 'force-dynamic'

/** Alta de la disponibilidad de un invitado. Devuelve el id, que es su token para editarla. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const meeting = await getMeeting(params.id)

  if (!meeting) {
    return NextResponse.json({ error: 'Esta reunión no existe.' }, { status: 404 })
  }

  const parsed = submitResponseInput.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }, { status: 400 })
  }

  const allowed = new Set(meeting.slots)
  const slots = parsed.data.slots.filter((slot) => allowed.has(slot))

  if (!slots.length) {
    return NextResponse.json({ error: 'Marcá al menos una franja habilitada.' }, { status: 400 })
  }

  if ((await countResponses(meeting.id)) >= MAX_RESPONSES_PER_MEETING) {
    return NextResponse.json({ error: 'Esta reunión ya alcanzó el máximo de respuestas.' }, { status: 409 })
  }

  const now = new Date().toISOString()
  const response = await saveResponse(meeting.id, {
    id: newResponseId(),
    name: parsed.data.name,
    email: parsed.data.email,
    slots,
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ response }, { status: 201 })
}
