import { NextResponse } from 'next/server'
import { deleteMeeting, getMeeting, listResponses } from '@/lib/meet/store'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

/** Reunión con todas las respuestas. Solo admin: el middleware protege /api/admin. */
export async function GET(_request: Request, { params }: Params) {
  const meeting = await getMeeting(params.id)

  if (!meeting) {
    return NextResponse.json({ error: 'Esta reunión no existe.' }, { status: 404 })
  }

  return NextResponse.json({ meeting, responses: await listResponses(meeting.id) })
}

export async function DELETE(_request: Request, { params }: Params) {
  await deleteMeeting(params.id)
  return NextResponse.json({ ok: true })
}
