import { NextResponse } from 'next/server'
import { deleteMeeting, getMeeting, listResponses } from '@/lib/meet/store'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/** Reunión con todas las respuestas. Solo admin. */
export async function GET(_request: Request, { params }: Params) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  const { id } = await params
  const meeting = await getMeeting(id)

  if (!meeting) {
    return NextResponse.json({ error: 'Esta reunión no existe.' }, { status: 404 })
  }

  return NextResponse.json({ meeting, responses: await listResponses(meeting.id) })
}

export async function DELETE(_request: Request, { params }: Params) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  const { id } = await params
  await deleteMeeting(id)
  return NextResponse.json({ ok: true })
}
