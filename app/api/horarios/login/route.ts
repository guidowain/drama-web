import { NextRequest, NextResponse } from 'next/server'
import { createHorariosToken, HORARIOS_COOKIE, validPin } from '@/lib/horarios/auth'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000
const attempts = new Map<string, { count: number; firstAt: number }>()

function clientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto')?.split(',')[0] || request.nextUrl.protocol.replace(':', '')
  return Boolean(host && origin === `${protocol}://${host}`)
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Origen inválido.' }, { status: 403 })
  }

  const ip = clientIp(request)
  const previous = attempts.get(ip)

  if (previous && Date.now() - previous.firstAt <= LOCKOUT_MS && previous.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Probá de nuevo en 15 minutos.' },
      { status: 429 }
    )
  }

  if (previous && Date.now() - previous.firstAt > LOCKOUT_MS) attempts.delete(ip)

  const length = Number(request.headers.get('content-length') || 0)
  if (length > 1_000) return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 413 })
  const body = await request.json().catch(() => null)
  const pin = typeof body?.pin === 'string' ? body.pin.trim() : ''

  if (!validPin(pin)) {
    const current = attempts.get(ip)
    attempts.set(ip, current ? { ...current, count: current.count + 1 } : { count: 1, firstAt: Date.now() })
    return NextResponse.json({ error: 'El PIN no es correcto.' }, { status: 401 })
  }

  attempts.delete(ip)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(HORARIOS_COOKIE, await createHorariosToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return response
}
