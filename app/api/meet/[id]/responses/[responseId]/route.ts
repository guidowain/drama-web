import { NextResponse } from 'next/server'
import { getMeeting, getResponse, saveResponse } from '@/lib/meet/store'
import { submitResponseInput } from '@/lib/meet/types'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string; responseId: string } }

/**
 * Lee o actualiza la respuesta de un invitado. El `responseId` es un token secreto
 * que solo tiene quien la cargó (queda guardado en su navegador), así nadie puede
 * leer ni editar la disponibilidad de otro.
 */
export async function GET(_request: Request, { params }: Params) {
  const response = await getResponse(params.id, params.responseId)

  if (!response) {
    return NextResponse.json({ error: 'No encontramos tu respuesta.' }, { status: 404 })
  }

  return NextResponse.json({ response })
}

export async function PUT(request: Request, { params }: Params) {
  const [meeting, existing] = await Promise.all([
    getMeeting(params.id),
    getResponse(params.id, params.responseId),
  ])

  if (!meeting || !existing) {
    return NextResponse.json({ error: 'No encontramos tu respuesta.' }, { status: 404 })
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

  const response = await saveResponse(meeting.id, {
    ...existing,
    name: parsed.data.name,
    email: parsed.data.email,
    slots,
    updatedAt: new Date().toISOString(),
  })

  return NextResponse.json({ response })
}
