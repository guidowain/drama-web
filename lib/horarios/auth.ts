import { SignJWT, jwtVerify } from 'jose'
import { createHash, timingSafeEqual } from 'crypto'

export const HORARIOS_COOKIE = 'horarios-token'

function secret() {
  const value =
    process.env.HORARIOS_JWT_SECRET ||
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'production' ? '' : 'drama-horarios-local-auth-secret')
  if (!value) throw new Error('Falta configurar HORARIOS_JWT_SECRET o JWT_SECRET.')
  return new TextEncoder().encode(value)
}

export function validPin(pin: string) {
  const configured = process.env.HORARIOS_PIN
  const expected = configured || (process.env.NODE_ENV === 'production' ? '' : '1906')
  if (!expected) return false
  return timingSafeEqual(
    createHash('sha256').update(pin).digest(),
    createHash('sha256').update(expected).digest()
  )
}

export async function createHorariosToken() {
  return new SignJWT({ scope: 'horarios' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret())
}

export async function verifyHorariosToken(token?: string) {
  if (!token) return false

  try {
    const { payload } = await jwtVerify(token, secret())
    return payload.scope === 'horarios'
  } catch {
    return false
  }
}
