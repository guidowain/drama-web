import { NextResponse } from 'next/server'
import { getMeeting } from '@/lib/meet/store'

export const dynamic = 'force-dynamic'

/** Datos públicos de la reunión. Nunca devuelve las respuestas: esas son solo del admin. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const meeting = await getMeeting(id)

  if (!meeting) {
    return NextResponse.json({ error: 'Esta reunión no existe.' }, { status: 404 })
  }

  return NextResponse.json({ meeting })
}
