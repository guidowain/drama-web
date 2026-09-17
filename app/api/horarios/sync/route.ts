import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { mergeSuccessfulCheck } from '@/lib/horarios/merge'
import { readHorariosStore, writeHorariosStore } from '@/lib/horarios/store'
import { showCatalog, syncInputSchema } from '@/lib/horarios/types'

export const dynamic = 'force-dynamic'

function configuredSecret() {
  return process.env.HORARIOS_SYNC_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'drama-horarios-local')
}

function authorized(request: Request) {
  const expected = configuredSecret()
  const received = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!expected || received.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected))
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const length = Number(request.headers.get('content-length') || 0)
  if (length > 100_000) {
    return NextResponse.json({ error: 'Solicitud demasiado grande.' }, { status: 413 })
  }

  const parsed = syncInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
      { status: 400 }
    )
  }

  const allowed = new Set(showCatalog.map((show) => show.id))
  if (parsed.data.shows.some((show) => !allowed.has(show.id))) {
    return NextResponse.json({ error: 'La obra no está configurada.' }, { status: 400 })
  }

  try {
    let store = await readHorariosStore()
    for (const show of parsed.data.shows) store = mergeSuccessfulCheck(store, show)
    await writeHorariosStore(store)

    return NextResponse.json({
      ok: true,
      updated: parsed.data.shows.map((show) => show.id),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No pudimos guardar los horarios.' },
      { status: 500 }
    )
  }
}
