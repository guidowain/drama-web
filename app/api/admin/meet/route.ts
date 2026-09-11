import { NextResponse } from 'next/server'
import { claimMeetingId, listMeetings, meetStorageMode, saveMeeting } from '@/lib/meet/store'
import { createMeetingInput } from '@/lib/meet/types'
import { slugify } from '@/lib/meet/slots'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json({ meetings: await listMeetings(), storage: meetStorageMode() })
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createMeetingInput.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }, { status: 400 })
  }

  const { name, slotMinutes, timezone } = parsed.data

  // Un día sin franjas habilitadas sería una columna muerta para el invitado.
  const dates = Array.from(new Set(parsed.data.dates))
    .filter((date) => parsed.data.slots.some((slot) => slot.startsWith(`${date}|`)))
    .sort()

  if (!dates.length) {
    return NextResponse.json({ error: 'Habilitá al menos una franja.' }, { status: 400 })
  }

  const allowedDates = new Set(dates)
  const slots = Array.from(new Set(parsed.data.slots))
    .filter((slot) => allowedDates.has(slot.split('|')[0]))
    .sort()

  try {
    const meeting = await saveMeeting({
      id: await claimMeetingId(slugify(name)),
      name,
      dates,
      slots,
      slotMinutes,
      timezone,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ meeting }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 })
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : 'No pudimos guardar la reunión.'
}
