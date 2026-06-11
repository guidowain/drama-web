import { NextRequest, NextResponse } from 'next/server'
import { checkCredentials, createToken } from '@/lib/auth'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000
const attempts = new Map<string, { count: number; firstAt: number }>()

function isRateLimited(ip: string) {
  const entry = attempts.get(ip)
  if (!entry) return false
  if (Date.now() - entry.firstAt > LOCKOUT_MS) {
    attempts.delete(ip)
    return false
  }
  return entry.count >= MAX_ATTEMPTS
}

function registerFailure(ip: string) {
  const entry = attempts.get(ip)
  if (!entry || Date.now() - entry.firstAt > LOCKOUT_MS) {
    attempts.set(ip, { count: 1, firstAt: Date.now() })
    return
  }
  entry.count += 1
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
      { status: 429 }
    )
  }

  const { username, password } = await request.json()

  if (!checkCredentials(username, password)) {
    registerFailure(ip)
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  attempts.delete(ip)

  const token = await createToken(username)
  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}
