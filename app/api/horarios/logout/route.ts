import { NextResponse } from 'next/server'
import { HORARIOS_COOKIE } from '@/lib/horarios/auth'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(HORARIOS_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
