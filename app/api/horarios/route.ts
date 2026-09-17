import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { HORARIOS_COOKIE, verifyHorariosToken } from '@/lib/horarios/auth'
import { publicData } from '@/lib/horarios/merge'
import { readHorariosStore } from '@/lib/horarios/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await verifyHorariosToken(cookies().get(HORARIOS_COOKIE)?.value))) {
    return NextResponse.json({ error: 'Ingresá el PIN para ver los horarios.' }, { status: 401 })
  }

  try {
    return NextResponse.json(publicData(await readHorariosStore()), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No pudimos cargar los horarios.' },
      { status: 500 }
    )
  }
}

